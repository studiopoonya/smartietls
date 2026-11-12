// Ids match the weakness tags used by the backend (App\Services\Weakness::LANGUAGE),
// so a mistake in the Error Bank links straight to the rule that fixes it.
const TOPICS = [
  {
    id: 'articles',
    title: 'Articles (a / an / the)',
    rule: 'Use "a/an" for one countable thing mentioned for the first time. Use "the" for something specific or already mentioned. Use no article for a general meaning with plural or uncountable nouns.',
    ruleId: 'Pakai "a/an" untuk satu benda yang bisa dihitung dan baru pertama kali disebut. Pakai "the" untuk sesuatu yang spesifik atau sudah disebut. Tidak pakai article kalau maknanya umum, dengan kata benda jamak atau uncountable.',
    examples: [
      ['Education is important for the development of country.', 'Education is important for the development of a country.'],
      ['The technology changes our lives.', 'Technology changes our lives.', 'General meaning, so no article.'],
      ['She is an university student.', 'She is a university student.', '"University" starts with a "yu" sound.'],
    ],
    task: 'Write 3 sentences about your university or school. Use "a" or "an", "the", and one general noun with no article.',
  },
  {
    id: 'subject_verb_agreement',
    title: 'Subject–verb agreement',
    rule: 'A singular subject takes a singular verb (is, has, goes). A plural subject takes a plural verb (are, have, go). Find the main noun, not the noun closest to the verb.',
    ruleId: 'Subjek tunggal memakai kata kerja tunggal (is, has, goes). Subjek jamak memakai kata kerja jamak (are, have, go). Cari kata benda utamanya, bukan kata benda yang paling dekat dengan kata kerja.',
    examples: [
      ['The number of students have increased.', 'The number of students has increased.', 'The main noun is "number".'],
      ['Many people thinks that cars are necessary.', 'Many people think that cars are necessary.'],
      ['Each of the countries have its own rules.', 'Each of the countries has its own rules.'],
    ],
    task: 'Write 3 sentences about your city that start with "The number of…", "Many people…" and "Each…".',
  },
  {
    id: 'verb_tense',
    title: 'Verb tenses',
    rule: 'Use the past simple for a finished time (in 2010, last year). Use the present perfect for a period up to now (since, for, recently). Use the present simple for facts and habits.',
    ruleId: 'Pakai past simple untuk waktu yang sudah selesai (in 2010, last year). Pakai present perfect untuk periode sampai sekarang (since, for, recently). Pakai present simple untuk fakta dan kebiasaan.',
    examples: [
      ['I have visited Bali last year.', 'I visited Bali last year.', '"Last year" is a finished time.'],
      ['She is living here since 2019.', 'She has lived here since 2019.'],
      ['Water is boil at 100°C.', 'Water boils at 100°C.'],
    ],
    task: 'Write 3 sentences about learning English: one with "last year", one with "since", and one general fact.',
  },
  {
    id: 'plurals_countability',
    title: 'Plurals & countable nouns',
    rule: 'Countable nouns need -s in the plural (many students). Uncountable nouns have no plural form (information, research, advice, equipment) and use "much", "a lot of" or "a piece of".',
    ruleId: 'Kata benda yang bisa dihitung perlu -s untuk jamak (many students). Kata benda uncountable tidak punya bentuk jamak (information, research, advice, equipment), jadi pakai "much", "a lot of" atau "a piece of".',
    examples: [
      ['There are many informations online.', 'There is a lot of information online.'],
      ['One of the main reason is cost.', 'One of the main reasons is cost.', '"One of the" is followed by a plural noun.'],
      ['They did many researches.', 'They did a lot of research.'],
    ],
    task: 'Write 3 sentences about studying abroad using "information", "advice" and "one of the…".',
  },
  {
    id: 'prepositions',
    title: 'Prepositions',
    rule: 'Many words take a fixed preposition: interested in, depend on, responsible for, increase by (an amount). For time: at 7 pm, on Monday, in 2020.',
    ruleId: 'Banyak kata punya preposition yang tetap: interested in, depend on, responsible for, increase by (untuk jumlah). Untuk waktu: at 7 pm, on Monday, in 2020.',
    examples: [
      ['I am interested on economics.', 'I am interested in economics.'],
      ['It depends of the weather.', 'It depends on the weather.'],
      ['The price increased with 10%.', 'The price increased by 10%.'],
    ],
    task: 'Write 3 sentences about your future plans using "interested in", "depend on" and a time phrase with in, on or at.',
  },
  {
    id: 'sentence_structure',
    title: 'Complete sentences',
    rule: 'Every sentence needs a subject and a main verb. Join two complete sentences with a full stop or a linking word (and, but, so, because), not with a comma alone.',
    ruleId: 'Setiap kalimat butuh subjek dan kata kerja utama. Gabungkan dua kalimat lengkap dengan titik atau kata penghubung (and, but, so, because), jangan hanya dengan koma.',
    examples: [
      ['Because the cost is high.', 'Many students study online because the cost is high.', 'A "because" clause cannot stand alone.'],
      ['Prices rose, people bought less.', 'Prices rose, so people bought less.'],
      ['In my country have many problems.', 'My country has many problems.', 'The sentence needs a subject.'],
    ],
    task: 'Write 3 complete sentences about public transport. Use "because", "but" and "so" once each.',
  },
  {
    id: 'word_form',
    title: 'Word form',
    rule: 'Choose the right form of a word for its job in the sentence: noun (success), verb (succeed), adjective (successful) or adverb (successfully).',
    ruleId: 'Pilih bentuk kata yang sesuai fungsinya di kalimat: kata benda/noun (success), kata kerja/verb (succeed), kata sifat/adjective (successful), atau kata keterangan/adverb (successfully).',
    examples: [
      ['Technology is very benefit for students.', 'Technology is very beneficial for students.'],
      ['The economy grew rapid.', 'The economy grew rapidly.', 'An adverb describes the verb "grew".'],
      ['Education is important for develop a country.', 'Education is important for developing a country.'],
    ],
    task: 'Write 3 sentences using a form of "economy" (economic), "success" (successful or successfully) and "rapid" (rapidly).',
  },
  {
    id: 'collocation',
    title: 'Collocations',
    rule: 'Some words naturally go together. Learn them as pairs: do or conduct research, make a decision, pay attention, take a risk, heavy traffic, strong evidence.',
    ruleId: 'Ada kata-kata yang memang selalu berpasangan. Hafalkan sebagai pasangan: do/conduct research, make a decision, pay attention, take a risk, heavy traffic, strong evidence.',
    examples: [
      ['They made a research.', 'They conducted research.'],
      ['We must do a decision.', 'We must make a decision.'],
      ['There is big traffic in Jakarta.', 'There is heavy traffic in Jakarta.'],
    ],
    task: 'Write 3 sentences about city life using "heavy traffic", "make a decision" and "conduct research".',
  },
  {
    id: 'word_choice',
    title: 'Academic word choice',
    rule: 'Academic writing avoids very informal words. Use precise, neutral words: "a lot of" → many or much, "kids" → children, "big" → significant, "get" → become or obtain.',
    ruleId: 'Tulisan akademik menghindari kata yang terlalu santai. Pakai kata yang tepat dan netral: "a lot of" → many/much, "kids" → children, "big" → significant, "get" → become/obtain.',
    examples: [
      ['A lot of kids get fat these days.', 'Many children are becoming overweight nowadays.'],
      ['Prices went up big time.', 'Prices rose significantly.'],
      ['The government should do something about it.', 'The government should take action to address this problem.'],
    ],
    task: 'Rewrite this sentence in academic style: "Lots of people think phones are bad for kids." Then write 2 more academic sentences about phones.',
  },
  {
    id: 'linking',
    title: 'Linking words',
    rule: 'Linking words show how ideas connect: addition (moreover, in addition), contrast (however, although), result (therefore, as a result) and example (for example). Put "However," at the start of a new sentence.',
    ruleId: 'Kata penghubung menunjukkan hubungan antar ide: tambahan (moreover, in addition), pertentangan (however, although), akibat (therefore, as a result), dan contoh (for example). Taruh "However," di awal kalimat baru.',
    examples: [
      ['Although it is expensive, but many people buy it.', 'Although it is expensive, many people buy it.', 'Use "although" or "but", not both.'],
      ['Online learning is flexible, however it can be lonely.', 'Online learning is flexible. However, it can be lonely.'],
      ['Because of the price is high, people buy less.', 'Because the price is high, people buy less.'],
    ],
    task: 'Write 3 connected sentences about online learning using "however", "as a result" and "for example".',
  },
];

// Sentences for the word-order builder. Each has one natural order, and the capital letter shows the first word.
const BUILDERS = {
  sentence_structure: ['Many students study online because it is cheaper.', 'Prices rose, so people bought less food.', 'My country has many beautiful islands.'],
  subject_verb_agreement: ['The number of students has increased.', 'Many people think that cars are necessary.', 'Each of the countries has its own rules.'],
  verb_tense: ['I visited Bali last year.', 'She has lived in Jakarta since 2019.', 'Water boils at 100 degrees.'],
  articles: ['She is a university student.', 'I read an article about the economy.', 'Technology changes our lives.'],
  plurals_countability: ['There is a lot of information online.', 'One of the main reasons is cost.', 'Scientists have done a lot of research.'],
  prepositions: ['I am interested in economics.', 'The result depends on the weather.', 'The price increased by ten percent.'],
  word_form: ['Technology is very beneficial for students.', 'The economy grew rapidly.', 'Education is important for developing a country.'],
  collocation: ['The government must make a decision.', 'There is heavy traffic in Jakarta.', 'Students should pay attention in class.'],
  linking: ['Although it is expensive, many people buy it.', 'Online learning is flexible. However, it can be lonely.', 'Prices rose sharply. As a result, sales fell.'],
  word_choice: ['Many children are becoming overweight nowadays.', 'Prices rose significantly last year.', 'The government should take action.'],
};

// Beginners start with whole sentences and verbs, then move to smaller and more advanced points.
const LEARNING_ORDER = ['sentence_structure', 'subject_verb_agreement', 'verb_tense', 'articles', 'plurals_countability', 'prepositions', 'word_form', 'collocation', 'linking', 'word_choice'];

export const GRAMMAR_TOPICS = LEARNING_ORDER.map(id => ({ ...TOPICS.find(topic => topic.id === id), builder: BUILDERS[id] }));

export const topicById = (id) => GRAMMAR_TOPICS.find(topic => topic.id === id) ?? null;
