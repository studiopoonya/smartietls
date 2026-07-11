export const CURRICULUM = {
  reading: {
    label: 'Reading',
    color: 'var(--accent-success)',
    colorHex: '#10B981',
    icon: 'BookOpen',
    description: 'Master academic reading passages through structured lessons and AI practice.',
    lessons: [
      {
        id: 'reading_1',
        title: 'Skimming & Scanning',
        duration: '20 min',
        description: 'Read quickly for main ideas and locate specific information without reading every word.',
        theory: [
          {
            heading: 'What is Skimming?',
            body: 'Skimming means reading quickly to get the general idea without reading every word. Focus on the title, headings, first sentence of each paragraph, and any bold or italicised text. Aim to skim a full passage in under 2 minutes.',
            tips: ['Read the title and subheadings first', 'Focus on the first sentence of each paragraph (topic sentence)', 'Ignore details on your first pass'],
          },
          {
            heading: 'What is Scanning?',
            body: "Scanning means searching for a specific piece of information — a name, date, number, or keyword. You don't read every word; you let your eyes move rapidly until you find what you're looking for.",
            tips: ['Identify keywords from the question before scanning', 'The passage may use synonyms — look for paraphrases', 'Numbers and proper nouns are easy to spot when scanning'],
          },
          {
            heading: 'Strategy for IELTS Reading',
            body: "Always skim the passage first (1–2 min), then scan for specific answers to each question. Never read the full passage word-for-word from start to finish — you will run out of time.",
            tips: ['Skim first, then scan per question', 'Spend no more than 20 minutes per passage', 'Mark keywords in questions before scanning'],
          },
        ],
        keyTakeaways: ['Skim for the main idea, scan for specific details', 'Always preview questions before reading the passage', 'Time discipline: 20 min per passage'],
      },
      {
        id: 'reading_2',
        title: 'True / False / Not Given',
        duration: '25 min',
        description: 'Master the trickiest IELTS question type by understanding the key differences.',
        theory: [
          {
            heading: 'Understanding the Three Answers',
            body: "TRUE: The statement agrees with what the passage says.\nFALSE: The statement contradicts what the passage says.\nNOT GIVEN: The topic is not addressed in the passage at all — you cannot determine truth or falsity.",
            tips: ['TRUE = passage says the same thing', 'FALSE = passage says the opposite', 'NOT GIVEN = passage is silent on the topic'],
          },
          {
            heading: 'The NOT GIVEN Trap',
            body: "NOT GIVEN is the hardest answer. Don't choose it just because you haven't found an answer yet — read the full relevant section first. If the passage genuinely doesn't address the topic of the statement, then it's NOT GIVEN.",
            tips: ["Don't confuse 'I can't find it' with NOT GIVEN", 'Read the whole relevant paragraph before choosing NOT GIVEN', 'NOT GIVEN means the text is completely silent on the topic'],
          },
          {
            heading: 'How to Approach Each Statement',
            body: "Find the relevant section using scanning, then read it carefully and compare to the statement. Watch out for paraphrasing — the passage will rarely use the exact words from the statement.",
            tips: ['Underline keywords in the statement, then scan', "Watch for qualifying words: 'always', 'never', 'some', 'all'", 'Statements appear in the same order as information in the passage'],
          },
        ],
        keyTakeaways: ['Base answers strictly on what the text says — not common knowledge', 'NOT GIVEN means the topic is not mentioned at all', 'Statements paraphrase the passage — look for synonyms'],
      },
      {
        id: 'reading_3',
        title: 'Matching Headings',
        duration: '20 min',
        description: "Match headings to paragraphs by identifying each paragraph's main idea.",
        theory: [
          {
            heading: 'How Matching Headings Works',
            body: 'You get a list of 6–8 headings and must match each to the correct paragraph. There are always more headings than paragraphs. Each heading captures the main idea of a paragraph, not a detail.',
            tips: ['Read all headings before you start', 'Eliminate obviously wrong headings first', 'Focus on the main idea, not details mentioned in the paragraph'],
          },
          {
            heading: 'Finding the Main Idea',
            body: "The main idea is usually in the topic sentence (first sentence) or summarised in the last sentence. If a heading matches a detail but not the overall point of the paragraph, it's wrong.",
            tips: ['Read the first and last sentence of each paragraph', "Ask: 'What is this paragraph mostly about?'", "Don't be tricked by headings that mention words from the paragraph but miss the main point"],
          },
        ],
        keyTakeaways: ['Headings = main idea of paragraph, not details', 'Read first and last sentence of each paragraph', 'Cross out used headings as you progress'],
      },
      {
        id: 'reading_4',
        title: 'Multiple Choice & Short Answer',
        duration: '20 min',
        description: 'Answer MC and short-answer questions accurately and efficiently.',
        theory: [
          {
            heading: 'Multiple Choice Strategy',
            body: "Read the question stem carefully, then read all options before scanning the text. Eliminate clearly wrong options. The correct answer paraphrases the passage — it rarely uses the exact same words.",
            tips: ['Underline the key part of the question stem', "Watch for 'distractor' options that use words from the passage but are wrong", 'The correct answer paraphrases — don\'t expect exact word matches'],
          },
          {
            heading: 'Short Answer Questions',
            body: "Write 1–3 words from the passage. The word limit is strict. Your answer must be copied directly from the text — don't paraphrase.",
            tips: ["Strictly follow the word limit ('NO MORE THAN THREE WORDS')", 'Copy words directly from the passage — do not paraphrase', 'Look for who/what/when/where/how many type answers'],
          },
        ],
        keyTakeaways: ['For MC: eliminate wrong options, correct answer paraphrases the text', 'For short answer: use exact words from the passage', 'Never exceed the word limit'],
      },
      {
        id: 'reading_5',
        title: 'Sentence & Summary Completion',
        duration: '20 min',
        description: 'Fill in gaps in sentences and summaries using the right words from the passage.',
        theory: [
          {
            heading: 'How It Works',
            body: "Fill in incomplete sentences or summaries using words from the passage. The word limit (1–3 words) is strict. Gaps usually follow the order of the passage.",
            tips: ['Always note the word limit before starting', 'Gaps test understanding of specific details', 'Gaps usually follow passage order — use this to scan efficiently'],
          },
          {
            heading: 'Grammar as a Clue',
            body: "The grammar around the gap tells you what type of word to find (noun, verb, adjective, number). Use this to narrow your search.",
            tips: ["After 'the': look for a noun", "After 'is/are': look for an adjective or noun phrase", 'Check your answer makes grammatical sense in the sentence'],
          },
        ],
        keyTakeaways: ['Use exact words from the passage — no paraphrasing', 'Let grammar guide what word type to look for', 'Gaps follow passage order — use it to scan faster'],
      },
    ],
  },

  listening: {
    label: 'Listening',
    color: '#F59E0B',
    colorHex: '#F59E0B',
    icon: 'Headphones',
    description: 'Develop sharp listening skills across all four IELTS sections.',
    lessons: [
      {
        id: 'listening_1',
        title: 'Listening Strategies & Prediction',
        duration: '15 min',
        description: 'Use your preparation time to predict answers before the audio plays.',
        theory: [
          {
            heading: 'Before You Listen: Predict',
            body: "In IELTS Listening you get 30 seconds to read questions before each section. Use this time to predict what kind of information you need: names, numbers, dates, places, or ideas. This primes your brain to catch the right information.",
            tips: ['Underline keywords in each question', 'Predict the answer type (number? name? adjective?)', 'Look at diagrams or maps before the audio starts'],
          },
          {
            heading: 'While You Listen: Stay on Track',
            body: "Answers come in order, so if you miss one, move on immediately — don't waste time. Speakers often paraphrase questions, so the audio won't always use the exact words from the question.",
            tips: ['Answers appear in order in the audio', 'Miss one? Skip it — move to the next question', "Listen for signpost words: 'however', 'the main point is', 'actually'"],
          },
          {
            heading: 'After: Check & Transfer',
            body: "You get time at the end of each section to check your answers. Look for spelling errors, word limit violations, and grammatical sense.",
            tips: ['Check spelling carefully — wrong spelling = wrong answer', "Ensure you've respected the word limit", 'Transfer answers to the answer sheet clearly'],
          },
        ],
        keyTakeaways: ['Predict answer types from questions before the audio plays', 'Answers come in order — skip and move on if you miss one', 'Spelling matters — check carefully'],
      },
      {
        id: 'listening_2',
        title: 'Section 1 & 2: Everyday Contexts',
        duration: '20 min',
        description: 'Handle practical conversations and informational monologues.',
        theory: [
          {
            heading: 'Section 1: Social Dialogues',
            body: "Section 1 is a conversation between two people in a practical context (booking accommodation, registering for a service, enquiring about facilities). It's the easiest section. You need to fill in forms, tables, or short answers.",
            tips: ['Listen for names, addresses, phone numbers, dates', 'Speakers often spell out tricky words — focus when you hear spelling', 'Answers are concrete facts, not abstract ideas'],
          },
          {
            heading: 'Section 2: Social Monologues',
            body: "Section 2 is one person speaking about a social topic — describing a place, explaining services, or outlining community facilities. You may need to label a map or complete a table.",
            tips: ["For maps: orient yourself using the 'you are here' position", "Listen for direction language: 'turn left', 'opposite', 'next to'", 'Table/form headings tell you exactly what category to listen for'],
          },
        ],
        keyTakeaways: ['Section 1 & 2 are the most accessible — build confidence here', 'Listen for specific facts: names, numbers, addresses', 'For maps: track directions and spatial language carefully'],
      },
      {
        id: 'listening_3',
        title: 'Section 3 & 4: Academic Contexts',
        duration: '25 min',
        description: 'Understand complex academic discussions and formal lectures.',
        theory: [
          {
            heading: 'Section 3: Academic Discussions',
            body: "Section 3 features 2–4 people in an academic setting (students discussing a project, a student and tutor reviewing work). The vocabulary is more academic and ideas are more complex. Multiple-choice is common here.",
            tips: ["Identify each speaker's opinion — they often disagree", "Speakers may change their mind: listen for 'actually', 'but', 'on reflection'", 'A wrong MC option may be mentioned and then rejected by a speaker'],
          },
          {
            heading: 'Section 4: Academic Lectures',
            body: "Section 4 is the hardest — a single speaker gives a lecture on an academic topic. There are no natural pauses. Questions are typically note or sentence completion.",
            tips: ['Listen for the structure: introduction → main points → summary', "Signpost phrases: 'The key point here is...', 'To summarise...'", 'Academic vocabulary — revise common lecture phrases before your exam'],
          },
        ],
        keyTakeaways: ['Section 3 & 4 use academic vocabulary — preparation helps', 'In Section 3, track multiple speakers and watch for opinion changes', 'Section 4: follow the lecture structure (intro → points → conclusion)'],
      },
      {
        id: 'listening_4',
        title: 'Gap Fill, Tables & Forms',
        duration: '20 min',
        description: 'Complete gaps, forms, and tables with accurate information from the audio.',
        theory: [
          {
            heading: 'Form & Note Completion',
            body: "Fill in a form or notes with information from the audio. The word limit is strict (e.g., ONE WORD AND/OR A NUMBER). Write the exact words used in the audio — do not paraphrase.",
            tips: ['Section headings tell you what category of information is coming', "Dates: write as heard ('15 March' or 'the 15th of March')", 'Phone numbers: write digits in order, listen carefully'],
          },
          {
            heading: 'Table Completion',
            body: "Tables organise information by category. Read the headings and column labels before the audio — this tells you exactly what information to listen for and in what order.",
            tips: ['Table entries follow left-to-right, top-to-bottom order', 'Blank cells warn you that information is coming soon', "Spelling counts: 'accommodation', 'necessary' — learn common misspellings"],
          },
        ],
        keyTakeaways: ['Write exact words from the audio — no paraphrasing', 'Preview tables and forms to predict what you will hear', 'Spelling matters — wrong spelling = wrong answer'],
      },
      {
        id: 'listening_5',
        title: 'Multiple Choice & Maps',
        duration: '25 min',
        description: 'Navigate multiple choice traps and label maps/plans accurately.',
        theory: [
          {
            heading: 'Multiple Choice Traps',
            body: "All options may be mentioned in the audio, but only one answers the question. Speakers often mention wrong answers as distractors before confirming the correct one.",
            tips: ['Underline the key word in the question before listening', "A wrong answer may be mentioned, then corrected ('actually...')", 'The correct answer is usually confirmed — wait for that confirmation'],
          },
          {
            heading: "Map & Plan Labelling",
            body: "You label locations on a map or floor plan. Orient yourself using the key and 'you are here' marker. Listen for directional and spatial language.",
            tips: ['Learn direction vocabulary: north/south, left/right, opposite, adjacent', "Visualise the route: 'past the library, turn left, the café is on your right'", 'Label in pencil first — confirm when certain'],
          },
        ],
        keyTakeaways: ['In MC, distractors are often mentioned then rejected — wait for confirmation', 'For maps: orientate yourself before the audio starts', 'Your outside knowledge is irrelevant — trust only the audio'],
      },
    ],
  },

  writing: {
    label: 'Writing',
    color: 'var(--accent-primary)',
    colorHex: '#7C3AED',
    icon: 'PenLine',
    description: 'Build structured essays and clear reports that score Band 7+.',
    lessons: [
      {
        id: 'writing_1',
        title: 'Task 1: Charts, Graphs & Tables',
        duration: '25 min',
        description: 'Describe visual data clearly with the right structure and language.',
        theory: [
          {
            heading: 'The Overview: Your Most Important Paragraph',
            body: "Every Task 1 needs an overview — a 2-sentence summary of the main trends, without specific data. This is what separates Band 5 from Band 7+. Write it after the introduction and before the detailed body paragraphs.",
            tips: ['Overview = most significant trends and extremes — no numbers', 'Write overview AFTER introduction, BEFORE details', 'Never write a conclusion in Task 1 — the overview serves that purpose'],
          },
          {
            heading: 'Language for Trends',
            body: "Use precise vocabulary: increase/rise/surge/climb (upward); fall/drop/decline/decrease (downward); remain stable/plateau/level off (static); fluctuate (variable). Avoid 'go up' and 'go down' — too informal.",
            tips: ["Verbs: 'GDP rose sharply' / Nouns: 'There was a sharp rise in GDP'", "Adverbs of degree: sharply, dramatically, gradually, slightly, steadily", "Avoid informal language: 'go up/down', 'a big change'"],
          },
          {
            heading: 'Structure',
            body: "1. Introduction: paraphrase the question (never copy)\n2. Overview: 2 key trends without specific data\n3. Body 1: detailed description with data\n4. Body 2: comparison or secondary feature with data",
            tips: ['Introduction: change words and sentence structure — never copy the prompt', 'Use data selectively — highlight extremes and key comparisons', 'Aim for 160–180 words (minimum 150 required)'],
          },
        ],
        keyTakeaways: ['Overview is essential — main trends only, no numbers', "Use rich trend vocabulary (rise, decline, surge, plateau...)", 'Paraphrase the question in your introduction — never copy it'],
      },
      {
        id: 'writing_2',
        title: 'Task 1: Processes & Maps',
        duration: '20 min',
        description: 'Describe processes and map changes with correct tenses and sequencing.',
        theory: [
          {
            heading: 'Process Diagrams',
            body: "Describe each stage in order using passive voice ('the material is heated', 'it is then filtered'). Process diagrams focus on what happens, not who does it. Count the stages and mention the total in your overview.",
            tips: ["Sequencing: first, then, next, after that, subsequently, finally", "Passive voice: 'the mixture is poured into...' (not 'someone pours...')", 'Your overview should state the number of stages and the overall process'],
          },
          {
            heading: 'Map Tasks',
            body: "Map tasks show changes to a location over time. Use past tense for changes and present tense for current features. Focus on what changed — added, removed, or relocated.",
            tips: ["Past: 'the forest was cleared' / Present: 'a car park now occupies the area'", "Location language: to the north of, adjacent to, in the centre of, to the east", 'Focus on CHANGE — don\'t describe every static feature'],
          },
        ],
        keyTakeaways: ['Processes: passive voice + sequencing words throughout', 'Maps: focus on what changed, use correct tenses', 'Always include an overview (number of stages or main overall change)'],
      },
      {
        id: 'writing_3',
        title: 'Task 2: Essay Structure',
        duration: '30 min',
        description: 'Build a clear, logical essay structure that scores high on Coherence & Cohesion.',
        theory: [
          {
            heading: 'The 4-Paragraph Structure',
            body: "Introduction → Body 1 → Body 2 → Conclusion. This is the safest and clearest structure for IELTS Task 2. Each paragraph has one main idea. Never write fewer than 4 paragraphs.",
            tips: ['Introduction: background sentence + clear thesis (your position)', 'Body paragraphs: one main argument each, fully developed', 'Conclusion: restate your position, briefly summarise'],
          },
          {
            heading: 'The PEEL Method for Body Paragraphs',
            body: "Point (your argument) → Explanation (why it's true) → Example (real or hypothetical) → Link (connect back to the question). This gives every paragraph a complete, logical structure.",
            tips: ["Point: 'One major benefit of X is...'", "Explanation: 'This is because...' / 'The reason is...'", "Example: 'For instance...' / 'A clear example is...'", "Link: 'Therefore, it is evident that...'"],
          },
          {
            heading: 'Coherence & Cohesion',
            body: "Band 7+ essays flow naturally. Use a range of linking words without repeating the same ones. Vary sentence structure — don't start every sentence with a discourse marker.",
            tips: ["Addition: furthermore, in addition, additionally, moreover", "Contrast: however, nevertheless, on the other hand, despite this", "Cause/Effect: because, since, as a result, consequently, therefore", "Don't overuse 'furthermore' and 'moreover' — vary them"],
          },
        ],
        keyTakeaways: ['4-paragraph structure: Intro → Body 1 → Body 2 → Conclusion', 'Use PEEL in every body paragraph for complete development', 'Vary linking words — repetition hurts your Coherence score'],
      },
      {
        id: 'writing_4',
        title: 'Task 2: Opinion & Discussion Essays',
        duration: '30 min',
        description: 'Distinguish question types and write focused, high-scoring responses.',
        theory: [
          {
            heading: 'Identifying the Question Type',
            body: "'To what extent do you agree or disagree?' → Opinion essay (YOUR view)\n'Discuss both views and give your opinion' → Discussion + opinion\n'What are the advantages and disadvantages?' → Balanced analysis\n'What are the causes/solutions?' → Problem essay",
            tips: ['Read the instruction carefully — wrong response type = low Task Achievement', 'Highlight the key instruction word(s) before planning', 'Your response must directly answer the specific question asked'],
          },
          {
            heading: 'Opinion Essays',
            body: "State your position clearly in the introduction and maintain it throughout. Don't say 'there are advantages and disadvantages' if the question asks for your opinion — commit to a position.",
            tips: ["Strong position: 'I strongly believe...' / 'I completely agree that...'", "Partial agreement is fine: 'While X has some merit, I believe Y is more important'", "Your conclusion must match your introduction's position — don't contradict yourself"],
          },
          {
            heading: 'Discussion Essays',
            body: "'Discuss both views' requires one paragraph for each viewpoint. Then give your own opinion. Be balanced — don't make one view appear weaker.",
            tips: ["Body 1: 'Proponents of this view argue that...'", "Body 2: 'On the other hand, those who believe X contend that...'", "Give YOUR opinion: 'In my view, while both perspectives have merit, I believe...'"],
          },
        ],
        keyTakeaways: ['Identify the exact question type before planning', 'Opinion essays: state and maintain a clear, consistent position', 'Discussion essays: present both views fairly, then give your opinion'],
      },
      {
        id: 'writing_5',
        title: 'Vocabulary & Grammar for Band 7+',
        duration: '25 min',
        description: 'Use sophisticated vocabulary and varied sentence structures confidently.',
        theory: [
          {
            heading: 'Lexical Resource (Vocabulary)',
            body: "Band 7 requires a wide range of vocabulary used accurately. Avoid repeating the same words — use synonyms, paraphrases, and collocations. Learn set phrases: 'raise awareness', 'tackle the problem', 'have a detrimental effect'.",
            tips: ["'A lot of people' → 'a significant proportion of the population'", "Topic-specific vocab: environment, technology, health, education, urban development", "Use academic hedging: 'it could be argued that...', 'there is a tendency to...'"],
          },
          {
            heading: 'Grammatical Range & Accuracy',
            body: "Band 7 needs a mix of simple and complex sentences with few errors. Practice: relative clauses, conditionals, passive voice, and participle clauses.",
            tips: ["Relative clause: 'People who live in urban areas tend to...'", "Conditional: 'If governments were to invest in X, it would...'", "Passive: 'It is widely believed that...' / 'This issue has been debated for years'", 'Mix short punchy sentences with longer complex ones'],
          },
        ],
        keyTakeaways: ['Use synonyms and paraphrases — avoid word repetition', 'Learn collocations and set phrases for IELTS topics', 'Mix simple and complex sentences for Band 7+ grammar range'],
      },
    ],
  },

  speaking: {
    label: 'Speaking',
    color: 'var(--accent-secondary)',
    colorHex: '#06B6D4',
    icon: 'Mic2',
    description: 'Build confidence and fluency for the face-to-face IELTS Speaking exam.',
    lessons: [
      {
        id: 'speaking_1',
        title: 'Part 1: Introduction & Everyday Topics',
        duration: '20 min',
        description: 'Give natural, extended answers to questions about yourself and everyday life.',
        theory: [
          {
            heading: 'What to Expect in Part 1',
            body: "Part 1 lasts 4–5 minutes. The examiner asks about familiar topics: your home, family, work/study, hobbies, and daily preferences. Answers should be 2–4 sentences — not too short (one word) and not a long speech.",
            tips: ["Never give one-word answers — always extend with a reason or detail", "Use connectors to extend: 'because', 'so', 'which means', 'especially when'", 'Aim for 2–4 sentences per answer in Part 1'],
          },
          {
            heading: 'Extending Answers with AREA',
            body: "AREA = Answer + Reason + Example + Add more. This gives a complete, natural-sounding response without rambling.",
            tips: ["Answer: 'I really enjoy cooking.'", "Reason: '...because it's a great way to unwind after work.'", "Example: 'I especially love making Italian dishes.'", "Add: 'Though I don't always have time for it during the week.'"],
          },
          {
            heading: 'Natural Delivery',
            body: "Speak at a natural pace — not too fast, not too slow. Hesitation is OK ('Well, that's an interesting question...') but avoid excessive filler words like 'um' and 'uh'.",
            tips: ["Natural fillers: 'Well...', 'Let me think...', 'That's a good question, actually...'", 'Vary your sentence starts — avoid repeating the same opening', 'Vary your intonation — a monotone voice reduces your score'],
          },
        ],
        keyTakeaways: ['Part 1: give 2–4 sentence answers, never one word', 'Use AREA: Answer + Reason + Example + Add more', 'Natural pacing and varied intonation beat speaking fast'],
      },
      {
        id: 'speaking_2',
        title: 'Part 2: Long Turn & Cue Cards',
        duration: '25 min',
        description: 'Speak fluently for 1–2 minutes on a given topic using a cue card.',
        theory: [
          {
            heading: 'What is Part 2?',
            body: "You receive a cue card with a topic and 3–4 bullet points. You have 1 minute to prepare notes, then must speak for 1–2 minutes. The examiner will stop you at 2 minutes.",
            tips: ['Use your 1 minute wisely: write keywords, not full sentences', 'Address ALL bullet points on the card', 'Speak until the examiner stops you — aim for the full 2 minutes'],
          },
          {
            heading: 'Structuring Your Talk',
            body: "Open with an introduction, cover each bullet point in order, add personal feelings, and close with a brief reflection. This structure keeps you on track and fills the time naturally.",
            tips: ["Opening: 'I'd like to talk about...' / 'The [topic] I'm going to describe is...'", "Cover bullets: 'Firstly...' / 'As for...' / 'When it comes to...'", "Add emotion: 'What I love most about this is...' / 'What made it memorable was...'"],
          },
          {
            heading: "Handling Difficult Topics",
            body: "If you're not familiar with the topic, adapt it. 'Describe a famous person' — choose anyone you can speak about. 'Describe an invention' — pick something simple like the internet.",
            tips: ["Choose the easiest example you can speak about confidently", "It's OK to say 'I'm going to talk about X because it's the most memorable to me'", 'Your language ability matters more than your content knowledge'],
          },
        ],
        keyTakeaways: ['Use preparation minute for keywords only — not full sentences', 'Cover all bullet points — structure your 2 minutes around them', 'Speak the full 2 minutes using a clear opening → middle → close structure'],
      },
      {
        id: 'speaking_3',
        title: 'Part 3: Abstract Discussion',
        duration: '25 min',
        description: 'Discuss complex, abstract ideas and societal issues confidently.',
        theory: [
          {
            heading: 'What is Part 3?',
            body: "Part 3 is a two-way discussion (4–5 minutes) connected to the Part 2 topic. Questions are more abstract and analytical ('Do you think governments should...?', 'How has X changed over time?'). This is where grammar and vocabulary range matter most.",
            tips: ['This is a discussion — share, justify, and explore ideas', 'Use hedging to sound thoughtful and academic', "It's OK to ask for clarification: 'Could you rephrase that?'"],
          },
          {
            heading: 'Giving Opinions on Complex Questions',
            body: "Don't just say yes or no. Give a reasoned opinion with examples, and acknowledge the other side.",
            tips: ["'In my opinion... because...'", "'It depends on the context. For example...'", "'While some argue that X, I believe Y because...'", "'That's a complex issue, but I tend to think...'"],
          },
          {
            heading: 'Showing Grammatical Range',
            body: "Part 3 is your opportunity to use advanced vocabulary and complex structures. Use conditionals, passive voice, comparative structures, and sophisticated connectors.",
            tips: ["'Were the government to invest in X, it would undoubtedly...'", "'The impact has been far-reaching, affecting not only X but also Y'", "'Historically speaking, the trend has shifted towards...'"],
          },
        ],
        keyTakeaways: ['Part 3: give reasoned, nuanced opinions — not yes/no answers', "Hedge and qualify: 'it depends on...', 'to some extent...'", 'Show grammar and vocabulary range — this is your highest-stakes section'],
      },
      {
        id: 'speaking_4',
        title: 'Fluency, Pronunciation & Coherence',
        duration: '20 min',
        description: 'Improve how your speech sounds and flows to the examiner.',
        theory: [
          {
            heading: 'Fluency',
            body: "Fluency is about speaking smoothly without excessive pausing or self-correction. It does NOT mean speaking fast. A Band 7+ speaker speaks at a natural pace, self-corrects only when necessary, and connects ideas smoothly.",
            tips: ["Reduce self-correction — only correct if what you said was clearly wrong", "Use discourse markers to maintain flow: 'Right, so...', 'Anyway...'", "Pause at natural points (between sentences), not mid-sentence"],
          },
          {
            heading: 'Pronunciation',
            body: "Pronunciation is not about having a native accent. It's about being intelligible and using English stress and intonation patterns correctly. Any accent can score Band 9.",
            tips: ["Word stress: 'PHOtograph' not 'photoGRAPH'", 'Sentence stress: content words are stressed, function words are not', 'Rising intonation for questions, falling for statements — examiners notice this'],
          },
        ],
        keyTakeaways: ['Fluency = smoothness and naturalness, not speed', 'Accent is irrelevant — intelligibility and intonation are what matter', 'Pause naturally between sentences, not within them'],
      },
      {
        id: 'speaking_5',
        title: 'Vocabulary & Grammar for Band 7+',
        duration: '25 min',
        description: 'Use sophisticated language naturally and confidently in spoken English.',
        theory: [
          {
            heading: 'Lexical Resource in Speaking',
            body: "Avoid repeating simple words. If you use 'good' three times, try 'beneficial', 'advantageous', or 'valuable'. Use topic-specific vocabulary and idiomatic expressions naturally — don't force them.",
            tips: ["'Very important' → 'crucial', 'vital', 'paramount'", "'A lot of people' → 'a significant number of people', 'the majority of people'", "'Bad for the environment' → 'harmful to the ecosystem', 'environmentally damaging'"],
          },
          {
            heading: 'Grammatical Range in Speaking',
            body: "Mix tenses naturally. Use conditionals, perfect tenses, and passive voice where appropriate. Don't limit yourself to simple present and past.",
            tips: ["Perfect: 'I've always been interested in...' / 'People have become increasingly...'", "Conditional: 'If I had more time, I would definitely...'", "Passive: 'It is widely believed that...' / 'This issue has been discussed for years'"],
          },
        ],
        keyTakeaways: ['Vary vocabulary — replace repeated simple words with precise alternatives', 'Use a range of tenses and complex structures naturally', 'Idiomatic expressions used correctly and naturally impress examiners'],
      },
    ],
  },
};

export const SKILL_ORDER = ['reading', 'listening', 'writing', 'speaking'];
