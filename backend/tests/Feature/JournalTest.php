<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JournalTest extends TestCase
{
    use RefreshDatabase;

    private const XML = <<<'XML'
<?xml version="1.0"?>
<article xmlns:ali="http://www.niso.org/schemas/ali/1.0/"><front><journal-meta><journal-title-group><journal-title>BMC Psychology</journal-title></journal-title-group></journal-meta>
<article-meta><article-id pub-id-type="doi">10.1/x</article-id><title-group><article-title>Sleep and study</article-title></title-group>
<contrib-group><contrib contrib-type="author"><name><surname>Lee</surname><given-names>Anna Mae</given-names></name></contrib><contrib contrib-type="author"><name><surname>Kim</surname><given-names>B</given-names></name></contrib></contrib-group>
<pub-date pub-type="epub"><year>2023</year></pub-date>
<permissions><license><ali:license_ref>https://creativecommons.org/licenses/by/4.0/</ali:license_ref></license></permissions>
<abstract><sec><title>Background</title><p>Sleep matters <xref ref-type="bibr">[4]</xref>.</p></sec></abstract></article-meta></front>
<body>
<p>An opening paragraph outside any section.</p>
<sec><title>Introduction</title><p>Students who sleep well perform better <xref ref-type="bibr">[1]</xref>.</p>
  <sec><title>Background</title><p>Earlier work (<xref ref-type="bibr">2</xref>, <xref ref-type="bibr">3</xref>) looked at schools.</p></sec>
  <fig><caption><p>Figure text that should not appear.</p></caption></fig>
</sec>
<sec><title>Methods</title><p>We surveyed <italic>412</italic> students.</p><table-wrap><table><tr><td>secret table</td></tr></table></table-wrap></sec>
</body></article>
XML;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Sanctum::actingAs(User::factory()->create());
    }

    private function record(string $pmcid, string $licence): array
    {
        return [
            'pmcid' => $pmcid, 'title' => 'Sleep <i>and</i> study', 'authorString' => 'Lee A, Kim B, Tan C, Wu D.',
            'journalInfo' => ['journal' => ['title' => 'BMC Psychology']], 'pubYear' => '2023', 'doi' => '10.1/x',
            'license' => $licence, 'abstractText' => '<h4>Background</h4>Sleep matters for students.',
        ];
    }

    private function fakeEuropePmc(array $records, int $status = 200, ?string $xml = self::XML, int $xmlStatus = 200): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake([
            '*/fullTextXML' => Http::response($xml ?? '', $xmlStatus),
            '*/search*' => Http::response(['hitCount' => count($records), 'nextCursorMark' => 'AoE', 'resultList' => ['result' => $records]], $status),
        ]);
    }

    public function test_search_lists_only_openly_licensed_articles(): void
    {
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by'), $this->record('PMC2', 'cc by-nc'), $this->record('PMC3', 'CC0')]);

        $response = $this->getJson('/api/journals?q=sleep:students"')->assertOk();

        $this->assertSame(['PMC1', 'PMC3'], array_column($response->json('results'), 'id'));
        $this->assertSame('Lee A, Kim B, Tan C et al.', $response->json('results.0.authors'));
        $this->assertSame('Sleep and study', $response->json('results.0.title'));
        $this->assertSame('Background Sleep matters for students.', $response->json('results.0.snippet'));
        $this->assertNull($response->json('nextCursor'));
        Http::assertSent(fn ($request) => str_contains(urldecode($request->url()), '(sleep students) AND OPEN_ACCESS:y'));
    }

    public function test_article_is_split_into_readable_sections(): void
    {
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by')]);

        $article = $this->getJson('/api/journals/PMC1')->assertOk()->json();

        Http::assertSentCount(1);
        $this->assertSame('Sleep and study', $article['title']);
        $this->assertSame('Lee AM, Kim B', $article['authors']);
        $this->assertSame(['BMC Psychology', 2023, '10.1/x', 'CC BY'], [$article['journal'], $article['year'], $article['doi'], $article['licence']]);
        $this->assertSame('Background Sleep matters.', $article['abstract']);
        $this->assertSame('https://creativecommons.org/licenses/by/4.0/', $article['licenceUrl']);
        $this->assertSame([null, 'Introduction', 'Background', 'Methods'], array_column($article['sections'], 'title'));
        $this->assertSame([1, 1, 2, 1], array_column($article['sections'], 'level'));
        $this->assertSame('Students who sleep well perform better.', $article['sections'][1]['paragraphs'][0]);
        $this->assertSame('Earlier work looked at schools.', $article['sections'][2]['paragraphs'][0]);
        $this->assertStringNotContainsString('secret table', json_encode($article));
        $this->assertStringNotContainsString('Figure text', json_encode($article));
    }

    public function test_licence_links_inside_the_licence_sentence_are_recognised(): void
    {
        // The format several publishers use: the licence URL sits on a link inside <license-p>.
        $sentence = '<license><license-p>Distributed under the <ext-link xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike License</ext-link>.</license-p></license>';
        $xml = preg_replace('#<license>.*?</license>#s', $sentence, self::XML);

        $this->fakeEuropePmc([$this->record('PMC1', 'cc by-sa')], xml: $xml);
        $this->getJson('/api/journals/PMC1')->assertOk()->assertJsonPath('licence', 'CC BY-SA')->assertJsonCount(4, 'sections');

        Cache::flush();
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by')], xml: str_replace('licenses/by-sa/4.0', 'licenses/by-nc/4.0', $xml));
        $this->getJson('/api/journals/PMC1')->assertNotFound();
    }

    public function test_full_text_without_a_licence_uses_the_search_index(): void
    {
        $xml = preg_replace('#<permissions>.*?</permissions>#s', '', self::XML);

        $this->fakeEuropePmc([$this->record('PMC1', 'cc0')], xml: $xml);
        $this->getJson('/api/journals/PMC1')->assertOk()->assertJsonPath('licence', 'CC0')->assertJsonCount(4, 'sections');

        Cache::flush();
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by-nd')], xml: $xml);
        $this->getJson('/api/journals/PMC1')->assertNotFound();
    }

    public function test_without_full_text_the_abstract_is_still_shown(): void
    {
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by')], xml: null, xmlStatus: 404);

        $article = $this->getJson('/api/journals/PMC1')->assertOk()->json();
        $this->assertSame([], $article['sections']);
        $this->assertSame('Background Sleep matters for students.', $article['abstract']);
    }

    public function test_closed_licences_and_bad_ids_are_refused(): void
    {
        $closed = str_replace('licenses/by/4.0', 'licenses/by-nc-nd/4.0', self::XML);
        $this->fakeEuropePmc([$this->record('PMC9', 'cc by')], xml: $closed);
        $this->getJson('/api/journals/PMC9')->assertNotFound();

        $this->fakeEuropePmc([$this->record('PMC8', 'cc by-nc')], xml: null, xmlStatus: 404);
        $this->getJson('/api/journals/PMC8')->assertNotFound();
        $this->getJson('/api/journals/12345')->assertNotFound();
        $this->getJson('/api/journals?q=a')->assertStatus(422);
    }

    public function test_an_outage_serves_the_last_good_answer(): void
    {
        $this->fakeEuropePmc([$this->record('PMC1', 'cc by')]);
        $this->getJson('/api/journals?q=sleep')->assertOk();

        Cache::forget('journals:search:' . sha1('sleep|*'));
        $this->fakeEuropePmc([], 503);
        $this->getJson('/api/journals?q=sleep')->assertOk()->assertJsonPath('results.0.id', 'PMC1');

        $this->getJson('/api/journals?q=never searched')->assertStatus(502);
    }
}
