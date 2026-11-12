<?php

/**
 * IELTS Academic course content.
 * Track > Module > Lesson > Drill. Run CurriculumSeeder after changing this file.
 */

$section = fn (string $heading, string $body, array $tips = []) => compact('heading', 'body', 'tips');

$question = fn (int $id, string $question, ?array $options, string $answer, ?string $explain = null) => compact('id', 'question', 'options', 'answer', 'explain');

$tfng = ['TRUE', 'FALSE', 'NOT GIVEN'];
$ynng = ['YES', 'NO', 'NOT GIVEN'];
$wordClass = ['Noun', 'Number', 'Adjective', 'Verb'];

return [
    'slug' => 'academic',
    'title' => 'IELTS Academic',
    'description' => 'A staged path from diagnosis to exam conditioning for master\'s applicants.',
    'phases' => [
        ['number' => 1, 'title' => 'Diagnostic & Mindset Deconstruction', 'description' => 'Find your baseline first without sitting a 3-hour exam, then see what the test really rewards.'],
        ['number' => 2, 'title' => 'Skill-by-Skill Micro Mastery', 'description' => 'Master one question type and one response component at a time before attempting full tests.'],
        ['number' => 3, 'title' => 'The Active Correction Loop', 'description' => 'Your mistakes become your daily practice list, and your weakest paragraph must be rewritten.'],
        ['number' => 4, 'title' => 'Full-Scale Exam Conditioning', 'description' => 'A full computer-delivered simulation and your Score Readiness Report.'],
    ],
    'modules' => [

        // ─────────────────────────────── PHASE 1 ───────────────────────────────
        [
            'slug' => 'foundation_diagnostic', 'phase' => 1, 'skill' => 'foundation',
            'title' => 'Modular Placement Diagnostic',
            'description' => 'Start here: short adaptive tests per skill that return your baseline against your university target.',
            'lessons' => [
                [
                    'slug' => 'diagnostic_listening', 'title' => 'Diagnostic: Listening', 'description' => '15 adaptive questions in three short blocks.', 'duration' => 12,
                    'takeaways' => ['Each block adapts to how you did on the previous one', 'Audio plays once, as it does in the real test'],
                    'drills' => [['slug' => 'diagnostic_listening_test', 'type' => 'adaptive_quiz', 'title' => 'Listening Placement', 'instructions' => 'Listen to each recording once, then answer. The next block adapts to your result.', 'payload' => ['diagnosticSkill' => 'listening', 'questionsPerBlock' => 5]]],
                ],
                [
                    'slug' => 'diagnostic_reading', 'title' => 'Diagnostic: Reading', 'description' => '15 adaptive questions in three short blocks.', 'duration' => 15,
                    'takeaways' => ['Each block adapts to how you did on the previous one', 'Base every answer on the text only'],
                    'drills' => [['slug' => 'diagnostic_reading_test', 'type' => 'adaptive_quiz', 'title' => 'Reading Placement', 'instructions' => 'Read each short passage and answer. The next block adapts to your result.', 'payload' => ['diagnosticSkill' => 'reading', 'questionsPerBlock' => 5]]],
                ],
                [
                    'slug' => 'diagnostic_writing', 'title' => 'Diagnostic: Writing', 'description' => 'One Task 2 introduction paragraph.', 'duration' => 10,
                    'takeaways' => ['A single paragraph reveals grammar, vocabulary and clarity of position'],
                    'drills' => [[
                        'slug' => 'diagnostic_writing_intro', 'type' => 'ai_writing', 'title' => 'Task 2 Introduction',
                        'instructions' => 'Write only the introduction paragraph for this essay (40 to 80 words). Do not write the full essay.',
                        'rubric' => 'Assess one Task 2 introduction: paraphrased topic and clear position. Estimate the band this paragraph indicates.',
                        'payload' => ['diagnosticSkill' => 'writing', 'minWords' => 25, 'task' => 'Some people believe universities should focus on practical skills for employment, while others think their main purpose is the pursuit of knowledge. Discuss both views and give your own opinion.'],
                    ]],
                ],
                [
                    'slug' => 'diagnostic_speaking', 'title' => 'Diagnostic: Speaking', 'description' => 'One Part 2 recording.', 'duration' => 8,
                    'takeaways' => ['Speak for the full time, even if you are unsure'],
                    'drills' => [[
                        'slug' => 'diagnostic_speaking_part2', 'type' => 'ai_speaking', 'title' => 'Part 2 Long Turn',
                        'instructions' => 'Prepare for one minute, then speak for up to two minutes.',
                        'rubric' => 'Assess one Part 2 long turn for fluency, vocabulary and grammar. Estimate the band this answer indicates.',
                        'payload' => ['diagnosticSkill' => 'speaking', 'minWords' => 30, 'prepSeconds' => 60, 'speakSeconds' => 120, 'question' => 'Describe a skill you learned that has been useful to you.', 'cuePoints' => ['What the skill is', 'How you learned it', 'When you use it', 'Explain why it has been useful']],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'foundation_standard', 'phase' => 1, 'skill' => 'foundation',
            'title' => 'The Academic Standard Breakdown',
            'description' => 'Optional review: what your score means, what universities look for, and how the four band criteria work.',
            'lessons' => [
                [
                    'slug' => 'foundation_academic_standard',
                    'title' => 'What Master\'s Programmes Actually Need',
                    'description' => 'Why universities set an IELTS requirement and what it predicts.',
                    'duration' => 10,
                    'theory' => [
                        $section('The two abilities behind the score', "A master's programme expects you to read journal articles quickly and to build objective academic arguments. IELTS Academic tests a compressed version of exactly those abilities. Every technique in this course serves one of them.", ['Fast reading means finding the claim, the evidence and the limits of a text', 'Academic writing means supporting a position with reasons, not feelings', 'General English fluency alone does not guarantee a high Academic score']),
                        $section('Read your requirement carefully', "Most programmes state an overall band and a minimum for each skill, for example 6.5 overall with no band below 6.0. One weak skill can fail an otherwise strong application, so your target must be set per skill.", ['Check the overall and the per-skill minimum', 'Writing is the most common skill to fall short', 'Set your overall target and per-skill minimums on your Learning Path']),
                    ],
                    'takeaways' => ['IELTS Academic tests fast academic reading and objective argument', 'Check both the overall band and the per-skill minimum', 'One weak skill can block an otherwise strong application'],
                    'drills' => [[
                        'slug' => 'foundation_standard_check', 'type' => 'quiz',
                        'title' => 'Micro-exercise: Reading a requirement',
                        'instructions' => 'Choose the best answer for each situation.',
                        'payload' => ['questions' => [
                            $question(1, 'A programme requires 6.5 overall with no band below 6.0. You score L7.5 R7.0 W5.5 S7.0. What is the outcome?', ['A. Accepted, because the overall is high enough', 'B. Not accepted, because Writing is below the minimum', 'C. Accepted, because three skills are above 6.5'], 'B', 'The overall may reach 7.0, but Writing at 5.5 breaks the per-skill minimum.'),
                            $question(2, 'Which sentence best matches academic writing?', ['A. I really feel that online learning is the best.', 'B. Online learning is obviously great for everyone.', 'C. Online learning can widen access, particularly for students in remote regions.'], 'C', 'It makes a limited claim and gives a specific scope, without personal feeling.'),
                            $question(3, 'What does the Reading test mostly reward?', ['A. Reading every word carefully from start to finish', 'B. Locating claims and evidence quickly in a long text', 'C. Knowing the topic before you read'], 'B', 'Time pressure rewards navigation, and outside knowledge is never required.'),
                        ]],
                    ]],
                ],
                [
                    'slug' => 'foundation_band_descriptors',
                    'title' => 'The 4 Band Criteria: Band 5.5 vs Band 7.5',
                    'description' => 'Deconstruct the official descriptors using real contrasting examples.',
                    'duration' => 15,
                    'theory' => [
                        $section('The four criteria', "Writing is scored on Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy, each worth 25%. Speaking replaces Task Response with Fluency & Coherence and adds Pronunciation. You cannot compensate for a missing idea with fancy vocabulary.", ['Task Response: did you answer the exact question?', 'Coherence: can the reader follow your logic without effort?', 'Lexical Resource: precise word choice and natural collocation', 'Grammar: range of structures and how often they are error-free']),
                        $section('Same idea, two bands', "Band 5.5: \"Nowadays many people use car and it make pollution very bad. So government must do something about this problem because it is very important.\"\n\nBand 7.5: \"The growing reliance on private vehicles has significantly worsened urban air quality, which suggests that governments should restrict car use in city centres.\"\n\nThe Band 7.5 version is not longer. It is more precise, the grammar is controlled, and its reasoning moves from cause to policy in a single clear step.", ['Band 5.5 is understood despite errors; Band 7.5 errors are rare', 'Vague words like "very bad" and "do something" hold a score down', 'A clear chain of reasoning is what moves Coherence upward']),
                    ],
                    'takeaways' => ['Each criterion is worth an equal 25%', 'Band 7+ comes from precision and control, not length', 'Answering the exact question comes first'],
                    'drills' => [[
                        'slug' => 'foundation_band_contrast', 'type' => 'quiz',
                        'title' => 'Micro-exercise: Spot the band',
                        'instructions' => 'Identify which criterion or band each example shows.',
                        'payload' => ['questions' => [
                            $question(1, '"Many peoples thinks that education are important for get good job." Which criterion is most clearly limiting this sentence?', ['A. Grammatical Range & Accuracy', 'B. Task Response', 'C. Coherence & Cohesion'], 'A', 'The idea is clear, but there are repeated agreement and verb form errors.'),
                            $question(2, 'Which is closer to Band 7.5?', ['A. Technology is very good for students because it helps them a lot.', 'B. Digital tools allow students to access research that was previously restricted to university libraries.'], 'B', 'It uses precise vocabulary, a relative clause and a specific benefit.'),
                            $question(3, 'An essay asks for causes of obesity, and the writer describes only solutions. Which criterion suffers most?', ['A. Lexical Resource', 'B. Task Response', 'C. Grammatical Range & Accuracy'], 'B', 'The essay does not answer the question that was asked.'),
                            $question(4, 'Every sentence of a paragraph begins with "Furthermore" or "Moreover". Which criterion suffers most?', ['A. Coherence & Cohesion', 'B. Task Response', 'C. Grammatical Range & Accuracy'], 'A', 'Mechanical linking words are penalised under Coherence & Cohesion.'),
                        ]],
                    ]],
                ],
            ],
        ],

        // ─────────────────────────────── PHASE 2: READING ───────────────────────────────
        [
            'slug' => 'reading_navigation', 'phase' => 2, 'skill' => 'reading',
            'title' => 'The Navigation Protocol',
            'description' => 'Scan scientific text: skim for the main idea in 60 seconds, and scan for specific data.',
            'lessons' => [
                [
                    'slug' => 'reading_skimming', 'title' => 'Skimming in 60 Seconds', 'description' => 'Find the main idea without reading every word.', 'duration' => 15,
                    'theory' => [
                        $section('The 60-second pass', 'Read the title, the first sentence of each paragraph, and the final sentence of the passage. Ignore details. Your goal is a mental map of what each paragraph does, so you know where to return.', ['Topic sentences carry the argument', 'Do not stop for unknown words', 'Ask what job each paragraph is doing']),
                        $section('What skimming is for', 'Skimming does not answer questions directly. It tells you where the answers live, which makes your scanning much faster.', ['Skim once, then work question by question', 'A good skim saves far more time than it costs']),
                    ],
                    'takeaways' => ['Skim to build a map, not to answer questions', 'Topic sentences and the conclusion give you the main idea', 'Keep moving past unknown words'],
                    'drills' => [[
                        'slug' => 'reading_skimming_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: 60-second skim',
                        'instructions' => 'You have 60 seconds. Skim the passage, then answer before the time runs out.',
                        'payload' => [
                            'timeLimitSeconds' => 60,
                            'passage' => "Coral reefs occupy less than one percent of the ocean floor, yet they support around a quarter of all marine species. In recent decades, rising sea temperatures have triggered repeated bleaching events, in which corals expel the algae that feed them.\n\nResearchers are now testing whether heat-tolerant corals can be bred selectively. In laboratory trials, the offspring of corals that survived earlier heatwaves showed greater resistance to temperature stress than those from unaffected colonies.\n\nHowever, scaling up this approach is difficult. Reefs cover vast areas, and nursery-grown corals are expensive to transplant. Scientists therefore caution that assisted breeding can only buy time; without deep cuts to carbon emissions, reefs will continue to decline.",
                            'questions' => [
                                $question(1, 'What is the main idea of the whole passage?', ['A. Coral reefs support a large share of marine species', 'B. Breeding heat-tolerant corals shows promise but cannot replace emission cuts', 'C. Laboratory trials are expensive for marine scientists'], 'B', 'The passage moves from the problem to a solution and ends with its limits.'),
                                $question(2, 'What is the function of the final paragraph?', ['A. To describe how bleaching happens', 'B. To explain the limits of the proposed solution', 'C. To give the results of a laboratory trial'], 'B', '"However" and "can only buy time" signal limits.'),
                            ],
                        ],
                    ]],
                ],
                [
                    'slug' => 'reading_scanning', 'title' => 'Scanning for Data & Keywords', 'description' => 'Locate names, dates, numbers and paraphrased keywords fast.', 'duration' => 15,
                    'theory' => [
                        $section('Choose a scannable anchor', 'Pick the most visible word in the question: a number, a name, a capitalised term. Let your eyes move for that shape rather than reading the sentences around it.', ['Numbers and proper nouns are the easiest anchors', 'Underline the anchor before you start', 'Stop and read closely only when you find it']),
                        $section('Expect paraphrase', 'If the anchor is a common word, the passage will often use a synonym. "Decline" in a question may be "fell" or "shrinking" in the text.', ['Think of two synonyms before scanning', 'Answers usually follow passage order within a question set']),
                    ],
                    'takeaways' => ['Scan for the shape of an anchor word', 'Expect synonyms for common words', 'Use the passage order to narrow your search'],
                    'drills' => [[
                        'slug' => 'reading_scanning_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Find the data',
                        'instructions' => 'Scan for each answer. Write no more than three words or a number, taken from the passage.',
                        'payload' => [
                            'timeLimitSeconds' => 150,
                            'passage' => "The Svalbard Global Seed Vault opened in 2008 on a remote Norwegian island. Built into a mountainside, it stores duplicates of seed collections from gene banks around the world and can hold up to 4.5 million varieties. The site was chosen partly because the surrounding permafrost keeps the seeds naturally frozen, even if the cooling system were to fail.\n\nThe vault made its first major withdrawal in 2015, when the International Center for Agricultural Research in the Dry Areas requested seeds after its facility near Aleppo was damaged by conflict. The samples were later regenerated in Morocco and Lebanon. In 2017, meltwater entered the access tunnel following unusually warm weather, prompting engineers to waterproof the entrance.",
                            'questions' => [
                                $question(1, 'In what year did the vault open?', null, '2008'),
                                $question(2, 'How many varieties can the vault store at most?', null, '4.5 million/4.5 million varieties'),
                                $question(3, 'What natural feature keeps the seeds frozen?', null, 'permafrost/the permafrost/surrounding permafrost'),
                                $question(4, 'Which damaged facility was located near what city?', null, 'Aleppo'),
                                $question(5, 'What entered the access tunnel in 2017?', null, 'meltwater'),
                            ],
                        ],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'reading_logic', 'phase' => 2, 'skill' => 'reading',
            'title' => 'The Logic Traps',
            'description' => 'Train the logic of contradiction versus missing information, and of topic versus supporting sentences.',
            'lessons' => [
                [
                    'slug' => 'reading_tfng', 'title' => 'True / False / Not Given', 'description' => 'Separate a contradiction from information that simply is not there.', 'duration' => 20,
                    'theory' => [
                        $section('The decision test', "TRUE: the text says the same thing in other words.\nFALSE: the text says something that cannot be true at the same time as the statement.\nNOT GIVEN: the text does not let you decide either way.", ['Ask: can the statement and the text both be true?', 'If yes, and the text does not confirm it, choose NOT GIVEN', 'Never use outside knowledge']),
                        $section('Qualifier traps', 'Words such as all, some, always, only and most decide many answers. If the text says "most" and the statement says "all", the answer is FALSE.', ['Circle qualifiers in the statement', 'Compare them with the qualifiers in the text', 'A comparison the text never makes is NOT GIVEN']),
                    ],
                    'takeaways' => ['FALSE needs a real contradiction', 'NOT GIVEN means the text cannot settle it', 'Qualifiers decide many answers'],
                    'drills' => [[
                        'slug' => 'reading_tfng_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Contradiction or missing?',
                        'instructions' => 'Decide whether each statement is TRUE, FALSE or NOT GIVEN according to the passage.',
                        'payload' => [
                            'passage' => "Green roofs, which are covered with soil and vegetation, have been adopted by several European cities as a tool for managing rainwater. Studies in Germany found that such roofs can retain most of the rain that falls on them during the summer months, although their capacity is lower in winter. Installation costs remain higher than those of conventional roofs, but the vegetation layer protects the waterproof membrane beneath and can extend its life. In Basel, new flat roofs have been legally required to include vegetation since the early 2000s.",
                            'questions' => [
                                $question(1, 'Green roofs retain more rainwater in summer than in winter.', $tfng, 'TRUE', '"Most of the rain" in summer, and "capacity is lower in winter", say the same thing.'),
                                $question(2, 'Green roofs are cheaper to install than conventional roofs.', $tfng, 'FALSE', 'The text says installation costs remain higher, which directly contradicts this.'),
                                $question(3, 'German green roofs are more effective than those in Basel.', $tfng, 'NOT GIVEN', 'The text never compares German roofs with those in Basel.'),
                                $question(4, 'Vegetation can make the waterproof layer last longer.', $tfng, 'TRUE', '"Protects the waterproof membrane" and "extend its life" paraphrase this.'),
                                $question(5, 'All roofs in Basel must have vegetation.', $tfng, 'FALSE', 'The rule applies only to new flat roofs, so "all" contradicts it.'),
                                $question(6, 'Maintenance of green roofs requires specialist workers.', $tfng, 'NOT GIVEN', 'Maintenance is not mentioned at all.'),
                            ],
                        ],
                    ]],
                ],
                [
                    'slug' => 'reading_ynng', 'title' => 'Yes / No / Not Given', 'description' => 'Apply the same logic to the writer\'s claims and opinions.', 'duration' => 20,
                    'theory' => [
                        $section('Opinions, not facts', 'This format asks what the writer believes. YES means the writer agrees with the statement, NO means the writer disagrees, and NOT GIVEN means the writer does not reveal a view on it.', ['Look for attitude words: unfortunately, arguably, fails to', 'Reporting another person\'s opinion is not the writer agreeing with it']),
                        $section('Who is speaking?', 'Academic writers often present a view in order to reject it. "Some claim X. This overlooks Y." means the writer disagrees with X.', ['Track phrases such as "critics argue" or "it is often assumed"', 'Read the sentence after a reported view']),
                    ],
                    'takeaways' => ['Judge the writer\'s view, not the facts of the world', 'A reported view is not automatically the writer\'s own', 'Attitude words reveal the position'],
                    'drills' => [[
                        'slug' => 'reading_ynng_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: What does the writer think?',
                        'instructions' => 'Do the statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.',
                        'payload' => [
                            'passage' => "It is often assumed that remote work automatically raises productivity. This assumption overlooks the fact that much of the early evidence came from employees who had chosen to work from home. When entire organisations moved online, the results were far more mixed. Regrettably, many firms responded by increasing digital monitoring, a step that undermines the trust on which flexible work depends. A more sensible approach would be to judge staff by what they produce rather than by when they appear online.",
                            'questions' => [
                                $question(1, 'Remote work always increases productivity.', $ynng, 'NO', 'The writer calls this an assumption that overlooks key evidence.'),
                                $question(2, 'Increased digital monitoring was a mistake.', $ynng, 'YES', '"Regrettably" and "undermines the trust" show disapproval.'),
                                $question(3, 'Employees should be assessed on their output.', $ynng, 'YES', '"A more sensible approach" endorses judging what staff produce.'),
                                $question(4, 'Remote work is better suited to younger employees.', $ynng, 'NOT GIVEN', 'The writer says nothing about age.'),
                            ],
                        ],
                    ]],
                ],
                [
                    'slug' => 'reading_headings', 'title' => 'Matching Headings', 'description' => 'Recognise topic sentences and separate them from supporting sentences.', 'duration' => 20,
                    'theory' => [
                        $section('Main idea versus detail', 'A heading summarises the whole paragraph. Wrong options usually repeat a word from a single supporting detail. If a heading fits only one sentence, it is a trap.', ['Read the first and last sentences of the paragraph', 'Ask what the paragraph is mostly doing', 'Be suspicious of a heading that copies a word from the text']),
                        $section('Topic sentences can hide', 'Sometimes the first sentence is a hook or a contrast, and the true topic arrives after "however" or "yet". Read past the turn before you decide.', ['A contrast word often introduces the real point', 'Do the easiest paragraphs first and eliminate as you go']),
                    ],
                    'takeaways' => ['A heading covers the whole paragraph', 'A shared word is often a trap', 'The real topic can follow a contrast word'],
                    'drills' => [[
                        'slug' => 'reading_headings_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Topic or detail?',
                        'instructions' => 'Choose the heading that best fits each paragraph.',
                        'payload' => [
                            'passage' => "Paragraph A\nThe printing press is usually celebrated for spreading literacy. Yet its most immediate effect was commercial. Printers competed fiercely for buyers, and many went bankrupt within a few years, forcing the survivors to choose profitable titles over scholarly ones.\n\nParagraph B\nThe earliest printers had to invent their own methods for correcting errors. Some pasted slips over mistakes, others issued lists of corrections, and a few reprinted entire pages. Accuracy gradually became a selling point that publishers advertised.\n\nParagraph C\nGovernments quickly saw the danger of cheap, widely circulated pamphlets. Licensing laws appeared across Europe, and printers who published without permission faced fines or imprisonment.",
                            'questions' => [
                                $question(1, 'Paragraph A', ['A. How printing improved literacy', 'B. Market pressure on early printers', 'C. The cost of early books'], 'B', '"Literacy" appears only in the hook; the paragraph is about commercial competition.'),
                                $question(2, 'Paragraph B', ['A. Early ways of dealing with printing mistakes', 'B. Advertising in the printing trade', 'C. The invention of the printed page'], 'A', 'Advertising appears only in the last detail.'),
                                $question(3, 'Paragraph C', ['A. The popularity of pamphlets', 'B. Prison conditions for printers', 'C. State attempts to control printing'], 'C', 'Prison is a detail; licensing and penalties are both forms of state control.'),
                            ],
                        ],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'reading_paced', 'phase' => 2, 'skill' => 'reading',
            'title' => 'Paced Timed Drills',
            'description' => 'One full passage of 13 to 14 questions under a time limit that tightens from 25 to 18 minutes.',
            'lessons' => [
                [
                    'slug' => 'reading_paced_25', 'title' => 'Pace 1: 25 Minutes', 'description' => 'Apply the full method with a generous limit.', 'duration' => 25,
                    'takeaways' => ['Accuracy first at this stage', 'Note where your time goes'],
                    'theory' => [$section('Build the routine first', 'At 25 minutes, focus on running the routine correctly: skim, read the questions, then scan. Speed will come from a stable process.', ['Skim for no more than two minutes', 'Do not spend over two minutes on one question'])],
                    'drills' => [['slug' => 'reading_paced_25_drill', 'type' => 'timed_passage', 'title' => 'Timed Passage: 25 minutes', 'instructions' => 'Complete one full passage. The test submits automatically when the time ends.', 'payload' => ['timeLimitSeconds' => 1500, 'questionCount' => 13]]],
                ],
                [
                    'slug' => 'reading_paced_22', 'title' => 'Pace 2: 22 Minutes', 'description' => 'Tighten the limit and cut hesitation.', 'duration' => 22,
                    'takeaways' => ['Skip and return to anything that stalls you', 'Hesitation costs more than difficulty'],
                    'theory' => [$section('Cut hesitation', 'Most lost time comes from re-reading questions you have already decided on. Choose, mark doubtful answers, and come back at the end.', ['Flag and move on after 90 seconds', 'Never leave an answer blank'])],
                    'drills' => [['slug' => 'reading_paced_22_drill', 'type' => 'timed_passage', 'title' => 'Timed Passage: 22 minutes', 'instructions' => 'Complete one full passage. The test submits automatically when the time ends.', 'payload' => ['timeLimitSeconds' => 1320, 'questionCount' => 13]]],
                ],
                [
                    'slug' => 'reading_paced_20', 'title' => 'Pace 3: Target 18–20 Minutes', 'description' => 'Reach real exam pace, with time left for the hardest passage.', 'duration' => 20,
                    'takeaways' => ['Three passages in 60 minutes needs about 20 minutes each', 'Finishing early buys time for the hardest passage'],
                    'theory' => [$section('Exam pace', 'The real test gives 60 minutes for three passages with no extra transfer time on computer. Aim for 18 minutes here so that the hardest passage can take a little longer.', ['Bank time on the question types you do fastest', 'Keep your routine when the clock feels tight'])],
                    'drills' => [['slug' => 'reading_paced_20_drill', 'type' => 'timed_passage', 'title' => 'Timed Passage: 20 minutes', 'instructions' => 'Complete one full passage. Aim to finish in 18 minutes. The test submits automatically at 20.', 'payload' => ['timeLimitSeconds' => 1200, 'questionCount' => 14]]],
                ],
            ],
        ],

        // ─────────────────────────────── PHASE 2: LISTENING ───────────────────────────────
        [
            'slug' => 'listening_prediction', 'phase' => 2, 'skill' => 'listening',
            'title' => 'The Prediction Routine',
            'description' => 'Use the 30 to 45 seconds before the audio to predict the word class of each answer.',
            'lessons' => [
                [
                    'slug' => 'listening_prediction', 'title' => 'Predicting Word Class', 'description' => 'Decide what kind of word you need before you hear it.', 'duration' => 15,
                    'theory' => [
                        $section('Grammar tells you what is coming', 'The words around a gap reveal its word class. After "a" or "the", expect a noun or an adjective plus noun. After "costs", expect a number. Knowing the type focuses your attention on the moment that matters.', ['Mark each gap as noun, number, adjective or verb', 'Think about singular or plural', 'Think about units such as dollars or percent']),
                        $section('Use the silence', 'You get 30 to 45 seconds before each part. Use all of it. Read the questions, underline keywords and predict. Do not spend it reviewing the previous part.', ['Move forward as soon as a part ends', 'Predict the topic from any headings']),
                    ],
                    'takeaways' => ['The grammar around a gap predicts its word class', 'Use every second of the preparation time', 'Check singular or plural and units'],
                    'drills' => [[
                        'slug' => 'listening_prediction_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Predict in 45 seconds',
                        'instructions' => 'You have 45 seconds. Predict the word class needed in each gap. No audio plays in this exercise.',
                        'payload' => [
                            'timeLimitSeconds' => 45,
                            'questions' => [
                                $question(1, 'The library card costs ______ per year.', $wordClass, 'Number', '"Costs" is followed by an amount.'),
                                $question(2, 'Students must bring a valid ______ to register.', $wordClass, 'Noun', '"A valid" needs a noun after the adjective.'),
                                $question(3, 'The new study rooms are more ______ than the old ones.', $wordClass, 'Adjective', '"More ... than" compares using an adjective.'),
                                $question(4, 'Researchers ______ the samples every six hours.', $wordClass, 'Verb', 'The plural subject needs a main verb.'),
                                $question(5, 'The course lasts for ______ weeks.', $wordClass, 'Number', 'A quantity comes before "weeks".'),
                                $question(6, 'The main ______ of the project was a lack of funding.', $wordClass, 'Noun', '"The main" needs a noun that the sentence then explains.'),
                            ],
                        ],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'listening_distractors', 'phase' => 2, 'skill' => 'listening',
            'title' => 'Distractor Neutralization',
            'description' => 'Recognise common traps: speakers correcting themselves and synonyms of keywords.',
            'lessons' => [
                [
                    'slug' => 'listening_self_correction', 'title' => 'Speakers Who Correct Themselves', 'description' => 'Wait for the final, confirmed version of the information.', 'duration' => 15,
                    'theory' => [
                        $section('The first answer is often bait', 'Speakers give a detail and then change it: "Tuesday. Oh no, sorry, Thursday." Examiners write these moments deliberately, so the first thing you hear is frequently wrong.', ['Listen for: actually, sorry, no wait, I mean, on second thoughts', 'Write the final version only', 'Keep listening for a moment after you hear an answer']),
                    ],
                    'takeaways' => ['The first detail is frequently a trap', 'Correction phrases signal a change', 'Write only the confirmed information'],
                    'drills' => [[
                        'slug' => 'listening_self_correction_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Catch the correction',
                        'instructions' => 'Play the recording once, then write the final information. No more than two words or a number.',
                        'payload' => [
                            'audioScript' => "Right, let me book you in for the campus tour. We have a slot on Tuesday. Oh, sorry, that one is full, so it will have to be Thursday. It starts at half past nine. Actually, no, they moved it last week, so please be there at ten fifteen. You should meet the guide at the main library. Hmm, wait, the library is being repainted, so go to the science building instead. The tour costs twelve pounds, but with a student card you only pay eight.",
                            'questions' => [
                                $question(1, 'Day of the tour', null, 'Thursday', 'Tuesday was offered and then withdrawn.'),
                                $question(2, 'Start time', null, '10.15/10:15/ten fifteen/1015', 'Half past nine was the old time.'),
                                $question(3, 'Meeting place', null, 'science building/the science building', 'The library was replaced.'),
                                $question(4, 'Price with a student card (in pounds)', null, '8/eight', 'Twelve is the full price.'),
                            ],
                        ],
                    ]],
                ],
                [
                    'slug' => 'listening_synonyms', 'title' => 'Synonyms of Keywords', 'description' => 'Follow the meaning when the audio does not repeat the words on the page.', 'duration' => 15,
                    'theory' => [
                        $section('The audio rarely repeats your keywords', 'A question about "the cost" may be answered by a speaker talking about "the fee". An option that repeats the exact word you hear is often the distractor. Listen for meaning.', ['Prepare one synonym for each keyword', 'Be careful of an option that echoes the audio word for word']),
                    ],
                    'takeaways' => ['Listen for meaning, not matching words', 'Exact echoes are often distractors'],
                    'drills' => [[
                        'slug' => 'listening_synonyms_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Follow the meaning',
                        'instructions' => 'Play the recording once, then choose the correct answer.',
                        'payload' => [
                            'audioScript' => "I was worried about the seminar on renewable energy, because I expected it to be far too technical. In the end, what struck me most was how approachable the speaker was. She avoided jargon entirely. The only drawback was the room, which was so cramped that several people had to stand. For next term, the department is planning to shift the series to the evenings, so that people with day jobs can come along.",
                            'questions' => [
                                $question(1, 'What impressed the speaker about the presenter?', ['A. Her technical knowledge', 'B. Her accessible style', 'C. Her interest in energy'], 'B', '"Approachable" and "avoided jargon" mean accessible. "Technical" is the echo.'),
                                $question(2, 'What was the problem with the seminar?', ['A. It was too technical', 'B. It started late', 'C. There was not enough space'], 'C', '"Cramped" and "had to stand" mean there was too little space.'),
                                $question(3, 'Why will the timing change?', ['A. To suit people who work', 'B. To attract a new speaker', 'C. To free up the room'], 'A', '"People with day jobs" means people who work.'),
                            ],
                        ],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'listening_lecture', 'phase' => 2, 'skill' => 'listening',
            'title' => 'Academic Lecture Navigation (Part 3 & 4)',
            'description' => 'Recognise when a speaker moves to a new argument or presents research data.',
            'lessons' => [
                [
                    'slug' => 'listening_signposting', 'title' => 'Signposting & Transitions', 'description' => 'Hear the structure of a lecture so that you never lose your place.', 'duration' => 15,
                    'theory' => [
                        $section('Lecturers announce their structure', 'Signposts show where the talk is going. "Turning now to", "another factor", and "this brings me to" indicate a new point. "In other words" signals a restatement, and "however" signals a reversal.', ['Use signposts to find your place in the questions', 'Part 4 has no pause, so never stop to worry over a missed answer']),
                    ],
                    'takeaways' => ['Signposts mark every change of point', 'If you get lost, wait for the next signpost'],
                    'drills' => [[
                        'slug' => 'listening_signposting_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Track the argument',
                        'instructions' => 'Play the lecture extract once, then answer.',
                        'payload' => [
                            'audioScript' => "Today we are looking at why bees matter to agriculture. First of all, let me outline the economic picture. Crops that depend on pollination make up roughly a third of the food we eat. Turning now to the causes of decline, the most widely discussed factor is pesticide use. However, recent work suggests that the loss of wildflower habitat may be even more damaging. In other words, bees are running out of food rather than simply being poisoned. This brings me to possible solutions, and here I want to focus on planting strips of wildflowers along the edges of farms.",
                            'questions' => [
                                $question(1, 'Which point does the lecturer cover first?', ['A. Causes of decline', 'B. The economic importance of bees', 'C. Possible solutions'], 'B', '"First of all, let me outline the economic picture."'),
                                $question(2, 'Which signpost introduces the causes of decline?', ['A. In other words', 'B. Turning now to', 'C. This brings me to'], 'B', 'It moves the talk to a new main point.'),
                                $question(3, 'According to recent work, what may be the most damaging factor?', ['A. Pesticide use', 'B. Loss of wildflower habitat', 'C. Changes in farming income'], 'B', '"However" reverses the common view that pesticides are the main cause.'),
                                $question(4, 'What solution does the lecturer focus on?', ['A. Banning pesticides', 'B. Planting wildflowers beside farms', 'C. Importing new bee species'], 'B', '"Strips of wildflowers along the edges of farms".'),
                            ],
                        ],
                    ]],
                ],
                [
                    'slug' => 'listening_research_data', 'title' => 'Following Research & Data', 'description' => 'Catch methods, results and limits in an academic discussion.', 'duration' => 15,
                    'theory' => [
                        $section('The shape of a research report', 'Speakers usually move from what was done, to what was found, to what it means. Numbers are often compared or corrected, so note what each figure refers to.', ['Listen for: the study looked at, we found that, this suggests', 'Note what a figure describes and not only the figure', 'In Part 3, track who holds which opinion']),
                    ],
                    'takeaways' => ['Method, finding, then meaning', 'Always link a number to what it measures', 'Track who holds which view'],
                    'drills' => [[
                        'slug' => 'listening_research_data_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Method, finding, limit',
                        'instructions' => 'Play the extract once, then write no more than two words or a number.',
                        'payload' => [
                            'audioScript' => "So, for our project we surveyed two hundred students about their sleep. We had planned to use interviews, but that would have taken too long, so we went with an online questionnaire. We found that students who slept fewer than six hours scored about fifteen percent lower on memory tests. What this suggests is that sleep matters more than extra revision the night before. The main limitation is that the data was self-reported, so we cannot be sure that it was accurate.",
                            'questions' => [
                                $question(1, 'How many students took part?', null, '200/two hundred'),
                                $question(2, 'What research method was finally used?', null, 'online questionnaire/questionnaire', 'Interviews were planned but dropped.'),
                                $question(3, 'By what percentage were memory scores lower?', null, '15/fifteen/15%/fifteen percent/15 percent'),
                                $question(4, 'The main limitation was that the data was ______.', null, 'self-reported/self reported'),
                            ],
                        ],
                    ]],
                ],
            ],
        ],

        // ─────────────────────────────── PHASE 2: WRITING ───────────────────────────────
        [
            'slug' => 'writing_task1', 'phase' => 2, 'skill' => 'writing', 'requires_rewrite' => true,
            'title' => 'Task 1: Data Synthesis',
            'description' => 'Build the report one step at a time: paraphrase, overview, then data grouping.',
            'lessons' => [
                [
                    'slug' => 'writing_t1_paraphrase', 'title' => 'Step 1: The Paraphrase Prompt', 'description' => 'Turn the question sentence into an academic introduction.', 'duration' => 15,
                    'theory' => [$section('Change words and structure', 'Your introduction is one sentence that restates the task. Replace the verb, the data type and the time phrase, but keep every fact accurate. Copied words do not count towards your total.', ['"shows" becomes "illustrates" or "compares"', '"from 2000 to 2020" becomes "over a twenty-year period"', 'Never add a trend or opinion here'])],
                    'takeaways' => ['One accurate sentence is enough', 'Change both words and structure', 'Save the trends for the overview'],
                    'drills' => [[
                        'slug' => 'writing_t1_paraphrase_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Paraphrase this intro',
                        'instructions' => 'Write one sentence that paraphrases the task below.',
                        'rubric' => 'One accurate sentence paraphrasing the task with changed vocabulary and structure, with no trends or opinions.',
                        'payload' => ['minWords' => 10, 'task' => 'The chart below shows the percentage of households in three countries that owned a computer between 2000 and 2020.'],
                    ]],
                ],
                [
                    'slug' => 'writing_t1_overview', 'title' => 'Step 2: The Overview Drill', 'description' => 'State 2 to 3 main trends without any detailed figures.', 'duration' => 20,
                    'theory' => [$section('The paragraph that sets your band', 'The overview summarises the most striking features: the overall direction and the clear highest or lowest. It contains no specific numbers. Without one, Task Achievement is unlikely to reach Band 6.', ['Begin with "Overall, ..."', 'Compare the start with the end', 'Name the highest or the biggest change'])],
                    'takeaways' => ['2 to 3 key features with no numbers', 'Overall direction plus the standout category', 'A missing overview caps your score'],
                    'drills' => [[
                        'slug' => 'writing_t1_overview_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Write the overview',
                        'instructions' => 'Write an overview of 2 to 3 sentences. Do not use any specific figures.',
                        'rubric' => 'An overview that identifies 2 to 3 main trends, such as rising use overall and the leading country, with no specific figures.',
                        'payload' => ['minWords' => 15, 'task' => 'Summarise the main features of the table showing the percentage of households that owned a computer.', 'context' => "Year | Sweden | Spain | Mexico\n2000 | 48% | 20% | 6%\n2010 | 83% | 57% | 30%\n2020 | 95% | 81% | 44%"],
                    ]],
                ],
                [
                    'slug' => 'writing_t1_grouping', 'title' => 'Step 3: Data Grouping', 'description' => 'Sort the features into Body Paragraph 1 and 2 logically.', 'duration' => 20,
                    'theory' => [$section('Group by logic, not by order', 'Do not describe every figure in sequence. Group data that behaves alike, for example the categories that rose in one paragraph and those that fell in another. Then support each group with selected figures and comparisons.', ['Group by trend, by size or by time', 'Compare within each sentence', 'Include key figures only'])],
                    'takeaways' => ['Group data that behaves alike', 'Select figures, do not list them', 'Compare as you describe'],
                    'drills' => [[
                        'slug' => 'writing_t1_grouping_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Write two grouped body paragraphs',
                        'instructions' => 'Write two short body paragraphs that group this data logically, with selected figures. Leave a blank line between them.',
                        'rubric' => 'Two body paragraphs that group the data logically, such as increases versus decreases, with accurate selected figures and comparisons.',
                        'payload' => ['minWords' => 50, 'task' => 'Describe how spending on each category changed between 2010 and 2020.', 'context' => "Average monthly student spending (USD)\nCategory | 2010 | 2020\nRent | 300 | 450\nTransport | 60 | 95\nBooks | 80 | 35\nEntertainment | 90 | 50"],
                    ]],
                ],
            ],
        ],
        [
            'slug' => 'writing_task2', 'phase' => 2, 'skill' => 'writing', 'requires_rewrite' => true,
            'title' => 'Task 2: Academic Argumentation',
            'description' => 'Unpack the prompt, build the thesis, develop PEEL paragraphs and raise your tone.',
            'lessons' => [
                [
                    'slug' => 'writing_t2_unpacking', 'title' => 'Step 1: Prompt Unpacking', 'description' => 'Determine the essay type: Opinion, Discussion or Problem-Solution.', 'duration' => 15,
                    'theory' => [$section('The instruction sets the structure', '"To what extent do you agree?" is an Opinion essay and needs a consistent position. "Discuss both views and give your opinion" needs both sides plus your view. "What are the causes and solutions?" is Problem-Solution and may not need an opinion at all.', ['Underline the instruction before the topic', 'Answer every part of the question', 'Wrong structure limits Task Response'])],
                    'takeaways' => ['The instruction decides the essay type', 'Every part of the question needs an answer'],
                    'drills' => [[
                        'slug' => 'writing_t2_unpacking_drill', 'type' => 'quiz', 'title' => 'Micro-exercise: Name the essay type',
                        'instructions' => 'Identify the essay type for each prompt.',
                        'payload' => ['questions' => [
                            $question(1, 'Some people think governments should fund the arts. To what extent do you agree or disagree?', ['A. Opinion', 'B. Discussion', 'C. Problem-Solution'], 'A', '"To what extent do you agree" asks for your position.'),
                            $question(2, 'Many graduates cannot find work in their field. Why is this, and what can be done?', ['A. Opinion', 'B. Discussion', 'C. Problem-Solution'], 'C', 'The question asks for causes and for measures.'),
                            $question(3, 'Some believe exams are the best measure of ability, while others prefer coursework. Discuss both views and give your opinion.', ['A. Opinion', 'B. Discussion', 'C. Problem-Solution'], 'B', 'Both views are required, plus your own opinion.'),
                            $question(4, 'Traffic congestion is rising in major cities. What are the main causes, and how can it be reduced?', ['A. Opinion', 'B. Discussion', 'C. Problem-Solution'], 'C', 'Causes and solutions are requested.'),
                        ]],
                    ]],
                ],
                [
                    'slug' => 'writing_t2_thesis', 'title' => 'Step 2: Thesis & Introduction Builder', 'description' => 'Write a tight introduction of 2 to 3 sentences.', 'duration' => 20,
                    'theory' => [$section('Two moves only', 'Sentence one paraphrases the debate. Sentence two states your position and, ideally, previews your reasons. Avoid memorised openers such as "Nowadays, there is a controversial issue".', ['Make the position impossible to miss', 'Preview your two main reasons', 'Stay under about 50 words'])],
                    'takeaways' => ['Paraphrase, then position', 'No memorised openers', 'Preview your reasons in the thesis'],
                    'drills' => [[
                        'slug' => 'writing_t2_thesis_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Build the introduction',
                        'instructions' => 'Write an introduction of 2 to 3 sentences that ends with a clear thesis.',
                        'rubric' => 'A 2 to 3 sentence introduction that paraphrases the topic and states a clear position, without a memorised opener.',
                        'payload' => ['minWords' => 20, 'task' => 'Some people believe that international students bring only financial benefits to host universities. To what extent do you agree or disagree?'],
                    ]],
                ],
                [
                    'slug' => 'writing_t2_peel', 'title' => 'Step 3: PEEL Body Paragraphs', 'description' => 'Point, Explanation, Evidence or Example, Link.', 'duration' => 25,
                    'theory' => [$section('One paragraph, one developed idea', 'Point: state one claim. Explanation: show why it holds. Evidence or Example: make it concrete. Link: tie it back to the question. Most Band 6 paragraphs state several ideas and develop none of them.', ['One main idea per paragraph', 'Explain before you exemplify', 'Your example must prove the point'])],
                    'takeaways' => ['Depth beats a long list of ideas', 'Each PEEL part has one job'],
                    'drills' => [[
                        'slug' => 'writing_t2_peel_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Write one PEEL paragraph',
                        'instructions' => 'Write one body paragraph of 80 to 120 words that follows PEEL.',
                        'rubric' => 'One body paragraph with a clear Point, Explanation, Evidence or Example, and Link, developing a single idea.',
                        'payload' => ['minWords' => 60, 'task' => 'Essay question: Universities should require all students to study a foreign language. To what extent do you agree or disagree? Write one body paragraph that supports your position.'],
                    ]],
                ],
                [
                    'slug' => 'writing_t2_tone', 'title' => 'Step 4: Academic Tone Upgrades', 'description' => 'Remove personal phrasing and control your linking words.', 'duration' => 20,
                    'theory' => [
                        $section('From personal to objective', '"I think that phones are bad for kids" becomes "Excessive smartphone use may hinder children\'s concentration". Replace personal openers, informal words and absolute claims with precise, hedged statements.', ['Remove "I think" outside your thesis', 'Replace "a lot of" and "things"', 'Hedge claims: may, tends to, is likely to']),
                        $section('Mechanical linking', 'Starting every sentence with "Moreover" or "Furthermore" is penalised. Link ideas through reference and structure as well: "This trend", "Such measures".', ['Use one linker every two or three sentences', 'Use "this + noun" to connect sentences']),
                    ],
                    'takeaways' => ['Objective, hedged and precise', 'Connect ideas with reference words too'],
                    'drills' => [[
                        'slug' => 'writing_t2_tone_drill', 'type' => 'ai_writing', 'title' => 'Micro-exercise: Upgrade the tone',
                        'instructions' => 'Rewrite this paragraph in a formal academic tone. Keep the same ideas.',
                        'rubric' => 'The paragraph is rewritten with no personal phrasing or informal words, with hedged claims and natural, non-mechanical linking, and it keeps the original ideas.',
                        'payload' => ['minWords' => 35, 'task' => 'I think social media is really bad for students. Moreover, they waste a lot of time on it. Furthermore, it makes them feel sad about their lives. Moreover, teachers have a big problem with this thing. So I think schools must do something about it.'],
                    ]],
                ],
            ],
        ],

        // ─────────────────────────────── PHASE 2: SPEAKING ───────────────────────────────
        [
            'slug' => 'speaking_part1', 'phase' => 2, 'skill' => 'speaking',
            'title' => 'Part 1: Crisp & Direct',
            'description' => 'Answer directly and add one sentence of reason or elaboration.',
            'lessons' => [[
                'slug' => 'speaking_p1_crisp', 'title' => 'Direct Answer + One Reason', 'description' => 'Avoid both one-word replies and long speeches.', 'duration' => 15,
                'theory' => [$section('The two-sentence habit', 'Part 1 rewards natural, short exchanges. Give a direct answer, then add one sentence of reason or detail. Long speeches sound rehearsed and take time from the questions that show your range.', ['Answer in the first few words', 'Add: because, especially when, which means', 'Stop after your second sentence'])],
                'takeaways' => ['Direct answer first', 'One sentence of elaboration', 'Natural beats rehearsed'],
                'drills' => [[
                    'slug' => 'speaking_p1_crisp_drill', 'type' => 'ai_speaking', 'title' => 'Micro-exercise: Answer crisply',
                    'instructions' => 'Answer in about two sentences: a direct answer and one elaboration.',
                    'rubric' => 'A direct answer followed by one sentence of reason or elaboration, neither a one-word reply nor a long monologue.',
                    'payload' => ['minWords' => 10, 'speakSeconds' => 30, 'question' => 'Do you prefer studying in the morning or at night?'],
                ]],
            ]],
        ],
        [
            'slug' => 'speaking_part2', 'phase' => 2, 'skill' => 'speaking',
            'title' => 'Part 2: The 1-Minute Prep System',
            'description' => 'Build a keyword outline in 60 seconds so that you never run out of material.',
            'lessons' => [[
                'slug' => 'speaking_p2_prep', 'title' => 'Keyword Frame in 60 Seconds', 'description' => 'Plan a visual outline and speak for the full two minutes.', 'duration' => 20,
                'theory' => [$section('Write keywords, never sentences', 'Divide your notes into the cue card points and write two or three keywords under each one. Add one short story and one feeling, because those are what fill the final minute.', ['Four boxes, one for each cue point', 'One real story or example', 'End by explaining why it matters to you'])],
                'takeaways' => ['Keywords only', 'A story fills time naturally', 'Keep going until the two minutes end'],
                'drills' => [[
                    'slug' => 'speaking_p2_prep_drill', 'type' => 'ai_speaking', 'title' => 'Micro-exercise: Plan and speak',
                    'instructions' => 'Write your keyword notes during the 60-second preparation, then speak for up to two minutes.',
                    'rubric' => 'A sustained long turn that covers all of the cue points, with a clear beginning and end and some personal detail.',
                    'payload' => ['minWords' => 60, 'prepSeconds' => 60, 'speakSeconds' => 120, 'notes' => true, 'question' => 'Describe a book or article that changed the way you think.', 'cuePoints' => ['What it was', 'When you read it', 'What it was about', 'Explain how it changed your thinking']],
                ]],
            ]],
        ],
        [
            'slug' => 'speaking_part3', 'phase' => 2, 'skill' => 'speaking',
            'title' => 'Part 3: The Academic Extender',
            'description' => 'Direct Answer, Analytical Reason, Real-world Example, Alternative perspective.',
            'lessons' => [[
                'slug' => 'speaking_p3_extender', 'title' => 'The Four-Step Opinion Formula', 'description' => 'Give analytical answers to abstract questions.', 'duration' => 20,
                'theory' => [$section('Answer → Reason → Example → Alternative', 'Direct Answer: take a position. Analytical Reason: explain the mechanism behind it. Real-world or Societal Example: go beyond your own life. Alternative Perspective: acknowledge when the opposite may hold.', ['Answer: "I would say that ..."', 'Reason: "The main driver is ..."', 'Example: "In many Asian cities, for instance ..."', 'Alternative: "That said, in rural areas ..."'])],
                'takeaways' => ['Four moves in every answer', 'Societal examples rather than personal ones', 'A counterpoint shows analytical range'],
                'drills' => [[
                    'slug' => 'speaking_p3_extender_drill', 'type' => 'ai_speaking', 'title' => 'Micro-exercise: Extend your answer',
                    'instructions' => 'Answer using all four steps: direct answer, analytical reason, real-world example, alternative perspective.',
                    'rubric' => 'An answer that contains a direct position, an analytical reason, a real-world or societal example, and an alternative perspective.',
                    'payload' => ['minWords' => 40, 'speakSeconds' => 90, 'question' => 'Do you think university education should be free for everyone?'],
                ]],
            ]],
        ],
    ],
];
