<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Open-access journal articles from Europe PMC. Only CC BY, CC BY-SA and CC0 articles are listed,
 * because those licences allow the full text to be shown, and later adapted, on a commercial site.
 */
class JournalLibrary
{
    private const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
    private const LICENCE_FILTER = '(LICENSE:"cc by" OR LICENSE:"cc by-sa" OR LICENSE:"cc0")';
    private const ALLOWED_LICENCES = ['cc by', 'cc by-sa', 'cc0'];
    private const PAGE_SIZE = 10;
    private const SEARCH_TTL = 21600;   // 6 hours
    private const ARTICLE_TTL = 604800; // 7 days
    private const STALE_TTL = 604800;   // 7 days

    /**
     * Europe PMC is sometimes slow or briefly unavailable, so every good answer is also kept for a
     * week and served when a fresh request fails.
     */
    private function cached(string $key, int $ttl, callable $fetch): mixed
    {
        if (Cache::has($key)) return Cache::get($key);

        try {
            $value = $fetch();
        } catch (RuntimeException $e) {
            if (Cache::has($key . ':stale')) return Cache::get($key . ':stale');
            throw $e;
        }

        if ($value !== null) {
            Cache::put($key, $value, $ttl);
            Cache::put($key . ':stale', $value, self::STALE_TTL);
        }

        return $value;
    }

    public function search(string $query, string $cursor = '*'): array
    {
        $query = trim(preg_replace('/\s+/', ' ', $query));
        $key = 'journals:search:' . sha1(mb_strtolower($query) . '|' . $cursor);

        return $this->cached($key, self::SEARCH_TTL, function () use ($query, $cursor) {
            $data = $this->get('/search', [
                'query'      => '(' . $query . ') AND OPEN_ACCESS:y AND IN_EPMC:y AND ' . self::LICENCE_FILTER . ' AND FIRST_PDATE:[2015-01-01 TO 2100-12-31]',
                'format'     => 'json',
                'resultType' => 'core',
                'pageSize'   => self::PAGE_SIZE,
                'cursorMark' => $cursor,
            ]);

            $results = collect($data['resultList']['result'] ?? [])
                ->filter(fn ($r) => !empty($r['pmcid']) && $this->licenceAllowed($r['license'] ?? null))
                ->map(fn ($r) => $this->summary($r))
                ->values()
                ->all();

            $next = $data['nextCursorMark'] ?? null;

            return [
                'total'      => (int) ($data['hitCount'] ?? 0),
                'results'    => $results,
                'nextCursor' => $next && $next !== $cursor && count($data['resultList']['result'] ?? []) === self::PAGE_SIZE ? $next : null,
            ];
        });
    }

    public function article(string $pmcid): ?array
    {
        return $this->cached('journals:article:' . $pmcid, self::ARTICLE_TTL, function () use ($pmcid) {
            // The full-text XML carries its own title, authors and licence, so one request is usually enough.
            try {
                $response = $this->request()->get(self::BASE . "/{$pmcid}/fullTextXML");
                $xml = $response->successful() ? trim($response->body()) : '';
            } catch (\Exception) {
                $xml = '';
            }

            if ($xml !== '') {
                $article = self::parseArticle($xml, $pmcid);
                if ($article === false) return null;
                if ($article !== null) return $article;
            }

            // No usable full text: fall back to the abstract from the search index.
            $meta = $this->get('/search', ['query' => 'PMCID:' . $pmcid, 'format' => 'json', 'resultType' => 'core', 'pageSize' => 1]);
            $record = $meta['resultList']['result'][0] ?? null;
            if (!$record || !$this->licenceAllowed($record['license'] ?? null)) return null;

            return $this->summary($record) + ['abstract' => self::cleanText($record['abstractText'] ?? ''), 'sections' => []];
        });
    }

    private function summary(array $r): array
    {
        $licence = mb_strtolower(trim($r['license'] ?? ''));
        $abstract = self::cleanText($r['abstractText'] ?? '');

        return [
            'id'        => $r['pmcid'],
            'title'     => self::cleanText($r['title'] ?? ''),
            'authors'   => self::shortAuthors($r['authorString'] ?? ''),
            'journal'   => $r['journalInfo']['journal']['title'] ?? ($r['bookOrReportDetails']['publisher'] ?? null),
            'year'      => isset($r['pubYear']) ? (int) $r['pubYear'] : null,
            'doi'       => $r['doi'] ?? null,
            'licence'   => strtoupper($licence),
            'licenceUrl'=> self::licenceUrl($licence),
            'snippet'   => mb_strlen($abstract) > 320 ? rtrim(mb_substr($abstract, 0, 320)) . '…' : $abstract,
            'sourceUrl' => 'https://europepmc.org/article/PMC/' . $r['pmcid'],
        ];
    }

    private function licenceAllowed(?string $licence): bool
    {
        return in_array(mb_strtolower(trim((string) $licence)), self::ALLOWED_LICENCES, true);
    }

    private function request(): PendingRequest
    {
        return Http::timeout(15)->connectTimeout(6)->retry(2, 1000, fn ($e) => $e instanceof ConnectionException || ($e instanceof RequestException && $e->response->serverError()), throw: false);
    }

    private function get(string $path, array $query): array
    {
        try {
            $response = $this->request()->acceptJson()->get(self::BASE . $path, $query);
        } catch (ConnectionException) {
            throw new RuntimeException('The journal library is not responding. Please try again in a moment.');
        }

        if (!$response->successful()) {
            throw new RuntimeException('The journal library is not responding. Please try again in a moment.');
        }
        return $response->json() ?? [];
    }

    private static function licenceUrl(string $licence): ?string
    {
        return match ($licence) {
            'cc by'    => 'https://creativecommons.org/licenses/by/4.0/',
            'cc by-sa' => 'https://creativecommons.org/licenses/by-sa/4.0/',
            'cc0'      => 'https://creativecommons.org/publicdomain/zero/1.0/',
            default    => null,
        };
    }

    private static function shortAuthors(string $authors): string
    {
        $names = array_filter(array_map('trim', explode(',', rtrim($authors, '. '))));
        return count($names) > 3 ? implode(', ', array_slice($names, 0, 3)) . ' et al.' : implode(', ', $names);
    }

    public static function cleanText(string $text): string
    {
        $text = html_entity_decode(strip_tags(preg_replace('/<\/?(h\d|p|br|div|li)\b[^>]*>/i', ' ', $text)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    /** Maps a Creative Commons licence URL to the licences this library accepts. */
    private static function licenceFromUrl(string $url): ?string
    {
        $url = mb_strtolower($url);
        if (str_contains($url, 'publicdomain/zero')) return 'cc0';
        if (preg_match('#creativecommons\.org/licenses/by-sa/#', $url)) return 'cc by-sa';
        if (preg_match('#creativecommons\.org/licenses/by/#', $url)) return 'cc by';
        return null;
    }

    /**
     * Reads a full JATS article: metadata, abstract and sections. Returns false when the article's
     * own licence is not an open one, and null when the XML cannot be read.
     */
    public static function parseArticle(string $xml, string $pmcid): array|false|null
    {
        $doc = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $loaded = $doc->loadXML($xml, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (!$loaded) return null;

        $xpath = new DOMXPath($doc);
        foreach (iterator_to_array($xpath->query('//article-meta//xref')) as $node) {
            $node->parentNode?->removeChild($node);
        }
        $first = fn (string $query) => ($node = $xpath->query($query)->item(0)) ? self::nodeText($node) : null;

        $licenceUrl = $first('//article-meta//permissions//*[local-name()="license_ref"]')
            ?? $xpath->evaluate('string(//article-meta//permissions/license/@*[local-name()="href"])')
            ?: ($first('//article-meta//permissions/license') ?? '');
        preg_match('#https?://creativecommons\.org/\S+#i', (string) $licenceUrl, $match);
        $licence = self::licenceFromUrl($match[0] ?? (string) $licenceUrl);
        if ($licence === null) return false;

        $authors = [];
        foreach ($xpath->query('//article-meta/contrib-group/contrib[@contrib-type="author"]') as $contrib) {
            $surname = $xpath->evaluate('string(.//surname)', $contrib);
            $given = $xpath->evaluate('string(.//given-names)', $contrib);
            $initials = implode('', array_map(fn ($part) => mb_substr($part, 0, 1), preg_split('/[\s.-]+/u', trim($given), -1, PREG_SPLIT_NO_EMPTY)));
            $name = trim($surname . ' ' . $initials) ?: trim($xpath->evaluate('string(./collab)', $contrib));
            if ($name !== '') $authors[] = $name;
        }

        $abstractNode = $xpath->query('//article-meta/abstract[not(@abstract-type)]')->item(0) ?? $xpath->query('//article-meta/abstract')->item(0);
        $abstract = '';
        if ($abstractNode instanceof DOMElement) {
            $parts = [];
            foreach ($xpath->query('.//title | .//p', $abstractNode) as $node) $parts[] = self::nodeText($node);
            $abstract = trim(implode(' ', array_filter($parts))) ?: self::nodeText($abstractNode);
        }

        $title = $first('//article-meta/title-group/article-title');
        if (!$title) return null;

        $year = $first('//article-meta/pub-date[@pub-type="epub"]/year') ?? $first('//article-meta/pub-date/year');

        return [
            'id'         => $pmcid,
            'title'      => $title,
            'authors'    => self::shortAuthors(implode(', ', $authors)),
            'journal'    => $first('//journal-meta//journal-title'),
            'year'       => $year ? (int) $year : null,
            'doi'        => $first('//article-meta/article-id[@pub-id-type="doi"]'),
            'licence'    => strtoupper($licence),
            'licenceUrl' => self::licenceUrl($licence),
            'snippet'    => '',
            'sourceUrl'  => 'https://europepmc.org/article/PMC/' . $pmcid,
            'abstract'   => $abstract,
            'sections'   => self::parseSections($xml),
        ];
    }

    /** Turns JATS full-text XML into readable sections. Citations, figures, tables and formulas are left out. */
    public static function parseSections(string $xml): array
    {
        $doc = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $loaded = $doc->loadXML($xml, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (!$loaded) return [];

        $xpath = new DOMXPath($doc);
        foreach (['//xref', '//fig', '//table-wrap', '//disp-formula', '//inline-formula', '//supplementary-material'] as $query) {
            foreach (iterator_to_array($xpath->query($query)) as $node) {
                $node->parentNode?->removeChild($node);
            }
        }

        $sections = [];
        $body = $xpath->query('//body')->item(0);
        if (!$body) return [];

        $walk = function (DOMElement $element, int $level) use (&$walk, &$sections) {
            $title = null;
            $paragraphs = [];
            foreach ($element->childNodes as $child) {
                if (!$child instanceof DOMElement) continue;
                if ($child->tagName === 'title') $title = self::nodeText($child);
                if ($child->tagName === 'p') {
                    $text = self::nodeText($child);
                    if ($text !== '') $paragraphs[] = $text;
                }
            }
            if ($title !== null || $paragraphs) {
                $sections[] = ['title' => $title, 'level' => $level, 'paragraphs' => $paragraphs];
            }
            foreach ($element->childNodes as $child) {
                if ($child instanceof DOMElement && $child->tagName === 'sec') $walk($child, min($level + 1, 3));
            }
        };

        $loose = [];
        foreach ($body->childNodes as $child) {
            if (!$child instanceof DOMElement) continue;
            if ($child->tagName === 'sec') {
                if ($loose) { $sections[] = ['title' => null, 'level' => 1, 'paragraphs' => $loose]; $loose = []; }
                $walk($child, 1);
            } elseif ($child->tagName === 'p' && ($text = self::nodeText($child)) !== '') {
                $loose[] = $text;
            }
        }
        if ($loose) $sections[] = ['title' => null, 'level' => 1, 'paragraphs' => $loose];

        return $sections;
    }

    private static function nodeText(DOMElement $node): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', $node->textContent));
        // Removing citation links can leave empty brackets such as "( )" or "[, ]".
        $text = preg_replace('/\s*[\(\[][\s,;–-]*[\)\]]/u', '', $text);
        $text = preg_replace('/\s+([.,;:])/u', '$1', $text);
        // Superscript citations sit next to punctuation, so removing them can leave ",." or ",,".
        return trim(preg_replace('/,+(?=[.,;:])/u', '', $text));
    }
}
