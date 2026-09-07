'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CaseResource = { type: 'video' | 'pdf' | 'article'; url: string; label?: string };
type CaseUpdate = { date: string; summary: string; source: string; sourceUrl: string; keyNumbers?: { value: string; label: string }[] };

type CaseStudy = {
  id: string; topic: string; week: string; title: string; setting: string; takeaway: string;
  trap: string; question: string; answer: string; tags: string[]; source: string; sourceUrl: string; color: string;
  learningRole?: 'Foundational' | 'Transfer' | 'Current practice'; context?: string; evidence?: string; decision?: string;
  sourceClass?: 'Institutional source' | 'Vendor source' | 'Independent source';
  keyNumbers?: { value: string; label: string }[];
  resources?: CaseResource[];
  update?: CaseUpdate;
};

type CaseNotes = { fact: string; inference: string; hypothesis: string };
const emptyNotes: CaseNotes = { fact:'', inference:'', hypothesis:'' };
const notesStorageKey = 'evidence-lab-case-notes-v1';

const editableFields = ['title','setting','context','evidence','takeaway','trap','decision','question','answer','source','sourceUrl'] as const;
type EditableField = typeof editableFields[number];
type CaseOverride = Partial<Record<EditableField, string>> & { resources?: CaseResource[] };
const overridesStorageKey = 'evidence-lab-case-overrides-v1';
const optionalFields = new Set<EditableField>(['context','evidence','decision']);

function applyOverride(item: CaseStudy, override?: CaseOverride): CaseStudy {
  if (!override) return item;
  const next: CaseStudy = { ...item };
  const target = next as unknown as Record<EditableField, string | undefined>;
  for (const field of editableFields) {
    const value = override[field];
    if (value === undefined) continue;
    if (value === '') { if (optionalFields.has(field)) target[field] = undefined; continue; }
    target[field] = value;
  }
  if (override.resources) next.resources = override.resources;
  return next;
}

const resourceFallbackLabels: Record<CaseResource['type'], string> = { video: 'Watch the video', pdf: 'Open the PDF', article: 'Read the article' };
const resourceIcons: Record<CaseResource['type'], string> = { video: '▶', pdf: 'PDF', article: '↗' };

function detectResourceType(url: string): CaseResource['type'] {
  if (/\.pdf(\?|#|$)/i.test(url)) return 'pdf';
  if (/(youtube\.com|youtu\.be|vimeo\.com|instagram\.com\/(p|reel|tv)\/|tiktok\.com|facebook\.com\/watch|\.mp4(\?|#|$))/i.test(url)) return 'video';
  return 'article';
}

const topics = ['All topics','Foundations','AI agents','Data preparation','Statistical interpretation','Web analytics','Visualisation','Data stories','Forecasting','Campaign decisions'];
const learningRoles = ['All paths','Foundational','Transfer','Current practice'] as const;
type LearningRoleFilter = typeof learningRoles[number];
const foundationalIds = new Set(['snow','nightingale','berkeley','anscombe','minard','challenger','digest']);
/** Old deep-link ids that still appear in lesson plans; map to the case that replaced them. */
const retiredCaseIds: Record<string, string> = { crowdstrike: 'cloudflare' };
const currentPracticeIds = new Set(['aircanada','agent-boundary','cloudflare','ai-overviews','simplygo','mycity','netflix-llm-art','mcdonalds-ai','tacobell-ai']);
type DiagramAsset = { src: string; alt: string; credit: string; creditUrl: string; license: string };
const diagramAssets: Record<string, DiagramAsset> = {
  minard: { src:'/diagrams/minard-original.png', alt:'Charles Minard’s 1869 flow map of Napoleon’s 1812 Russian campaign, showing army size, route and temperature', credit:'Charles Joseph Minard · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Minard.png', license:'Public domain' },
  snow: { src:'/diagrams/snow-original.jpg', alt:'John Snow’s 1854 map marking cholera deaths and water pumps around Broad Street in London', credit:'John Snow · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Snow-cholera-map-1.jpg', license:'Public domain' },
  nightingale: { src:'/diagrams/nightingale-original.jpg', alt:'Florence Nightingale’s polar-area diagrams comparing causes of mortality in the British Army', credit:'Florence Nightingale · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg', license:'Public domain' },
  challenger: { src:'/diagrams/challenger-original.jpg', alt:'Morton Thiokol history of O-ring damage in solid rocket motor field joints', credit:'Rogers Commission Report · NASA', creditUrl:'https://www.nasa.gov/history/rogersrep/v5p895.htm', license:'US government work' },
};
const recreatedIds = new Set(['anscombe','berkeley','digest','google-flu','netflix-art','axis','funnel','cloudflare','ai-overviews','simplygo','mycity','zillow','ai-verify','genai-catalog']);
const dataFaithfulIds = new Set(['anscombe','berkeley','digest','google-flu','mycity']);
const workedScenarioIds = new Set(['agent-boundary','categories','abtest','funnel','attribution','axis','choropleth','museum','shock','benefits','campaign']);
const dataIllustrationIds = new Set(['commute','rainfall']);

const cases: CaseStudy[] = [
  { id:'minard', topic:'Visualisation', week:'W08–09', learningRole:'Foundational', title:'Six variables, one unforgettable map', setting:'Napoleon’s Russian campaign · chart published 1869', context:'Charles Joseph Minard fused geography, army size, direction, distance, time and temperature into a single flow map of the disastrous 1812 campaign.', evidence:'The band begins with roughly 422,000 troops and narrows relentlessly. The returning path is aligned with falling temperatures, letting readers see attrition as a journey rather than a single total.', takeaway:'A visual can explain a system when every encoding serves the same question.', trap:'Calling a dense graphic “good” because it is famous. Its success depends on a focused story and careful reading, not complexity alone.', decision:'A modern analyst must decide what to layer together and what to separate for an audience with less time or context.', question:'Which encoding carries the main argument?', answer:'Width. It makes the loss of people physically dominate the page; geography and temperature explain when and where that loss unfolded.', keyNumbers:[{value:'6',label:'variables integrated'},{value:'1869',label:'publication year'},{value:'1812',label:'campaign depicted'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=V8swlmNZlG4',label:'The greatest data visualisation? (3:04)'}], tags:['multivariate','flow map','history'], source:'Charles Joseph Minard · Wikimedia Commons', sourceUrl:'https://commons.wikimedia.org/wiki/File:Minard.png', color:'lime' },
  { id:'challenger', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'The missing data in the launch decision', setting:'Space Shuttle Challenger · 1986', context:'Engineers were concerned about O-ring performance in unusually cold conditions. The pre-launch communication did not present past damage and temperature as a clear, complete relationship.', evidence:'The Rogers Commission found that limited consideration was given to the history of O-ring damage in relation to temperature, and described a conflict between engineering data and management judgment.', takeaway:'How evidence is selected and framed can be as consequential as the analysis itself.', trap:'Plotting only launches with damage—or presenting scattered technical tables—without showing all prior launches and their temperatures.', decision:'The launch decision required reasoning beyond observed experience because the forecast temperature was below the range of previous launches.', question:'What chart should have been on the decision table?', answer:'Every prior launch plotted by temperature, with damage severity encoded, plus a clear marker showing the forecast launch temperature outside the observed range.', keyNumbers:[{value:'28°F',label:'launch-day temperature'},{value:'51–53°F',label:'previous low range discussed'},{value:'73 sec',label:'flight before breakup'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=raMmRKGkGD4',label:'Feynman’s O-ring demo (1:17)'}], tags:['risk','missing data','communication'], source:'NASA · Rogers Commission Report', sourceUrl:'https://www.nasa.gov/history/rogersrep/v1ch5.htm', color:'orange' },
  { id:'digest', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'Two million answers—and the wrong winner', setting:'Literary Digest election poll · 1936', context:'The magazine mailed millions of ballots using lists such as telephone directories and automobile registrations, then relied on voluntary returns.', evidence:'Later analysis concluded that both the sampling frame and non-response were biased. A huge response count could not repair who was missing or disproportionately motivated to reply.', takeaway:'Sample quality beats sample size when the data does not represent the decision population.', trap:'Teaching the failure as selection bias alone. Research shows non-response bias also materially amplified the miss.', decision:'The analyst must defend how people entered the sample, who did not respond and whether weighting can plausibly repair the gap.', question:'What would you audit before calculating a margin of error?', answer:'Coverage of the sampling frame and the response mechanism. A precise interval around a biased estimate is still confidently wrong.', keyNumbers:[{value:'10m',label:'ballots mailed'},{value:'~2.4m',label:'responses'},{value:'0',label:'guarantee of representativeness'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=JwZo28RKdvU',label:'Business Insider: the 1936 poll (1:20)'}], tags:['sampling','non-response','polling'], source:'Public Opinion Quarterly · Why the poll failed', sourceUrl:'https://academic.oup.com/poq/article-abstract/52/1/125/1878544', color:'blue' },
  { id:'netflix-art', topic:'Web analytics', week:'W05–06', learningRole:'Transfer', title:'The same film, a different thumbnail', setting:'Netflix artwork personalisation · 2017', context:'A title has many possible images: a face, an ensemble, a landscape, comedy or action. Netflix tests artwork because the image is part of the choice architecture, not decoration.', evidence:'Netflix described moving beyond one globally winning image toward contextual bandits that learn which artwork works for a particular member and viewing context.', takeaway:'Personalisation changes the treatment itself; “the average winner” may not be best for everyone.', trap:'Optimising clicks without watching downstream satisfaction, viewing completion or representation effects.', decision:'Choose a success metric and guardrails before the system learns to exploit attention at the expense of trust.', question:'What is the experimental unit?', answer:'Usually the member, not the impression. Randomising impressions can contaminate learning when the same person sees multiple treatments.', keyNumbers:[{value:'1 title',label:'many possible frames'},{value:'member',label:'experimental unit'},{value:'long-term',label:'guardrail horizon'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=WRGW6xHLy3k',label:'Netflix Research: experimentation (2:47)'}], update:{ date:'January 2026', summary:'The bandit era has a successor. In January 2026 Netflix researchers reported post-training an 8-billion-parameter language model on structured descriptions of members, titles and candidate artwork, with 3–5% offline improvements over the production system. The experimental-unit question has not changed: a better offline ranker is a candidate until a member-level online test says otherwise (see the companion case on LLM artwork prediction).', source:'Netflix Research · Artwork Personalization via LLM Post-training (arXiv)', sourceUrl:'https://arxiv.org/abs/2601.02764' }, tags:['A/B testing','personalisation','bandits'], source:'Netflix Technology Blog · Artwork Personalization', sourceUrl:'https://netflixtechblog.com/artwork-personalization-c589f074ad76', color:'coral' },
  { id:'google-flu', topic:'Forecasting', week:'W12', learningRole:'Transfer', title:'When search behaviour impersonated disease', setting:'Google Flu Trends · 2008–2014', context:'Google Flu Trends tried to estimate influenza activity faster than clinical reporting by using patterns in search queries.', evidence:'A 2014 Science critique documented persistent over-prediction and “big data hubris”: search behaviour, media attention and platform changes could move even when actual illness did not.', takeaway:'A high-volume proxy is not the phenomenon—and the proxy’s meaning can drift.', trap:'Validating once, then treating the measurement relationship as permanent while the platform changes underneath it.', decision:'Combine timely proxy data with slower ground truth, benchmark against simple models and monitor residuals for drift.', question:'What is the hidden time series in this case?', answer:'The search platform itself. Ranking, autocomplete, media coverage and user habits all change the data-generating process.', keyNumbers:[{value:'2008',label:'public launch'},{value:'2014',label:'landmark critique'},{value:'2×',label:'reported peak overestimate'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=LC06jUW2Cs8',label:'Google Flu Trends: a fiasco (3:54)'}], update:{ date:'August 2026', summary:'Nowcasting now treats the reporting system itself as something to model. In a CDC report published 27 August 2026 on the South Carolina measles outbreak (997 cases, October 2025–March 2026), the EpiNow2 model adjusted provisional counts for reporting delays—median lag two to three days, 92.8% of cases reported within 14 days—and improved estimates of outbreak size by 10.5–11.3%. It still under-estimated during rapid growth, and the authors say so: the Google Flu lesson applied in reverse. Know the data-generating process, and state when it breaks.', source:'CDC MMWR · Nowcasting during a measles outbreak (Aug 2026)', sourceUrl:'https://www.cdc.gov/mmwr/volumes/75/wr/mm7533a1.htm', keyNumbers:[{value:'997',label:'measles cases, SC outbreak'},{value:'10.5–11.3%',label:'nowcast gain over provisional counts'},{value:'92.8%',label:'cases reported within 14 days'}] }, tags:['proxy data','drift','nowcasting'], source:'PubMed · The Parable of Google Flu', sourceUrl:'https://pubmed.ncbi.nlm.nih.gov/24626916/', color:'lime' },
  { id:'cambridge', topic:'Campaign decisions', week:'W13', learningRole:'Transfer', title:'The targeting dataset people never agreed to build', setting:'Cambridge Analytica and Facebook data · 2014–2019', context:'A personality-quiz app collected data from users and, under platform rules at the time, information connected to their friends. Those data fed political profiling and targeting work.', evidence:'The US Federal Trade Commission concluded that Cambridge Analytica used deceptive representations concerning the collection and use of Facebook data.', takeaway:'A campaign can be analytically sophisticated and still fail the legitimacy test.', trap:'Reducing ethics to legal compliance or assuming public data is automatically fair game for a new purpose.', decision:'Before targeting, define consent, purpose limitation, sensitive proxies, contestability and who bears harm if the model is wrong.', question:'Which question comes before “Does the model work?”', answer:'“Should this dataset and intervention exist for this purpose?” Technical performance cannot legitimise deceptive collection.', keyNumbers:[{value:'2014',label:'app collection began'},{value:'2019',label:'FTC final action'},{value:'purpose',label:'must be bounded'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=Q91nvbJSmS4',label:'The Guardian: the scandal (3:41)'}], tags:['privacy','political communication','consent'], source:'US FTC · Cambridge Analytica matter', sourceUrl:'https://www.ftc.gov/legal-library/browse/cases-proceedings/182-3107-cambridge-analytica-llc-matter', update:{ date:'August 2026', summary:'On 26 August 2026, 47 US states, the District of Columbia and three territories announced a settlement with Meta worth at least US$12.1 billion and up to US$17.1 billion over features alleged to drive compulsive use by children. Folded into it was more than US$460 million to close the states’ remaining Cambridge Analytica data-privacy claims—eight years after the 2018 disclosure.', source:'New Jersey Office of the Attorney General · Historic settlement with Meta', sourceUrl:'https://www.njoag.gov/attorney-general-davenport-announces-historic-17-billion-settlement-with-meta/', keyNumbers:[{value:'$460m+',label:'Cambridge Analytica claims settled (USD)'},{value:'47 + DC',label:'states in the agreement'},{value:'8 yrs',label:'from disclosure to settlement'}] }, color:'orange' },
  { id:'zillow', topic:'Forecasting', week:'W12', learningRole:'Transfer', title:'A forecast became inventory—and balance-sheet risk', setting:'Zillow Offers wind-down · 2021', context:'Zillow bought homes directly, making future price forecasts operational: errors determined purchase prices, renovation plans, inventory and capital exposure.', evidence:'Zillow said the unpredictability of home-price forecasting exceeded what it anticipated and that scaling would create excessive earnings and balance-sheet volatility.', takeaway:'Forecast error changes meaning when a prediction triggers an irreversible, capital-intensive action.', trap:'Reporting average model accuracy while ignoring tail errors, correlated market shifts and exposure at scale.', decision:'Tie model evaluation to the cost distribution of being wrong, capacity constraints and an explicit stop rule.', question:'Why can a reasonably accurate model still make a bad business?', answer:'Because asymmetric errors, correlated shocks and scale can turn a minority of misses into inventory and cash-flow losses larger than the gains.', keyNumbers:[{value:'1,200 bps',label:'unit-economics swing cited'},{value:'2021',label:'operations wound down'},{value:'scale',label:'amplified exposure'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=xpyfIgPexr8',label:'Why Zillow’s iBuying failed (2:58)'}], update:{ date:'August 2026', summary:'iBuying did not die; it changed its risk posture. Opendoor, refounded under a new chief executive in late 2025, reported Q2 2026 revenue of $883 million and a net loss of $162 million, bought 4,378 homes against 2,339 sold, and held 5,459 homes in inventory while promising positive adjusted net income on a forward twelve-month basis by the end of 2026. The forecast still becomes inventory; the question for the class is whether the stop rule is now explicit.', source:'Opendoor · Q2 2026 results (4 August 2026)', sourceUrl:'https://investor.opendoor.com/news-releases/news-release-details/q2-2026-open-house-everything-more-contracts-more-revenue-more', keyNumbers:[{value:'4,378',label:'homes bought, Q2 2026'},{value:'2,339',label:'homes sold, Q2 2026'},{value:'$162m',label:'net loss, Q2 2026'}] }, tags:['forecast risk','operations','model limits'], source:'Zillow · Q3 2021 shareholder letter', sourceUrl:'https://www.sec.gov/Archives/edgar/data/1617640/000161764021000085/exhibit993.htm', color:'blue' },
  { id:'cloudflare', topic:'Data preparation', week:'W03', learningRole:'Current practice', title:'The query that returned every row twice', setting:'Cloudflare global outage · 18 November 2025', context:'A permissions change on Cloudflare’s ClickHouse database cluster altered what a metadata query returned, so the query that builds the Bot Management “feature file” produced duplicate rows. The file, regenerated every few minutes and pushed to every machine on the network, roughly doubled in size.', evidence:'Cloudflare’s post-incident review states the proxy’s Bot Management module had a hard limit of 200 features against normal use of about 60; the oversized file breached the limit and the proxy failed, returning HTTP 5xx errors from 11:20 to 17:06 UTC. The company committed to hardening ingestion of its own configuration files “in the same way we would for user-generated input”, adding global kill switches and reviewing failure modes across core proxy modules.', takeaway:'A data-preparation change—one query returning duplicates—can be a production outage. Validate row counts, sizes and schemas at the boundary between a pipeline and its consumers, and rehearse the rollback.', trap:'Filing this as a networking failure. The root cause is a familiar analytics error: a query that silently doubled its output because an upstream permission changed what it could see.', decision:'Choose what must be checked before a generated file or table propagates—expected row count, size limit, schema—which cohort receives it first, and what signal automatically halts the rollout.', question:'What is the analytics analogue of Cloudflare’s missing check?', answer:'Reconciling row counts and totals after every join or dedupe against a known baseline before the output feeds a dashboard, model or agent—and treating a doubled count as a halt condition, not a curiosity.', keyNumbers:[{value:'~60 → 200+',label:'features: normal use vs. limit breached'},{value:'11:20–17:06',label:'UTC impact window'},{value:'2×',label:'file size after duplicate rows'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=tF_4baiIUiQ',label:'Fireship: the internet crashed again (3:10)'},{type:'pdf',url:'https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf',label:'Compare: CrowdStrike 2024 root-cause analysis'}], tags:['validation','duplicates','blast radius'], source:'Cloudflare · Post-incident review, 18 November 2025', sourceUrl:'https://blog.cloudflare.com/18-november-2025-outage/', color:'coral' },
  { id:'ai-overviews', topic:'AI agents', week:'W02', learningRole:'Current practice', sourceClass:'Independent source', title:'Right 91% of the time—but a third of the claims had no support', setting:'Google AI Overviews accuracy study by Oumi for The New York Times · April 2026', context:'Two years after the May 2024 rollout—when AI Overviews repeated satire about eating rocks and Google shipped “more than a dozen technical improvements”—an independent lab re-tested the feature at scale. Oumi ran more than 4,000 SimpleQA factual queries through AI Overviews in late 2025 and again in early 2026, after the switch to Gemini 3.', evidence:'Oumi reports that about 91% of Gemini 3 AI Overviews contained the correct answer, but only 67% of the claims in those answers were supported by the sources the Overview cited. Accuracy improved with the newer model; grounding did not.', takeaway:'A correct answer and a grounded answer are different measurements. A system can improve on one while getting worse on the other, so a launch dashboard needs both denominators.', trap:'Reading the headline accuracy as the quality score. Unsupported claims that happen to be right are still a citation-integrity failure, and they are invisible if you only grade the final answer.', decision:'Define, before launch, when the system answers, cites, defers to conventional search or abstains—and report correctness and citation support as separate rates, especially for health and safety queries.', question:'What should a launch dashboard separate?', answer:'Answer correctness, citation support (does the source actually say this?), unsafe-query handling and fabricated screenshots or fake reports. Each needs its own denominator and its own remedy.', keyNumbers:[{value:'91%',label:'Gemini 3 answers correct (Oumi)'},{value:'67%',label:'claims supported by cited sources'},{value:'4,000+',label:'SimpleQA queries tested'}], resources:[{type:'article',url:'https://arxiv.org/abs/2511.12920',label:'ICWSM 2026 audit of 1,508 health queries (arXiv)'},{type:'article',url:'https://techcrunch.com/2026/01/11/google-removes-ai-overviews-for-certain-medical-queries',label:'TechCrunch, Jan 2026: some medical Overviews removed'},{type:'video',url:'https://www.youtube.com/watch?v=CMBXgKnBHd8',label:'AI Inside: great and terrible at once (5:11)'},{type:'article',url:'https://blog.google/products-and-platforms/products/search/ai-overviews-update-may-2024/',label:'Google, May 2024: what happened'}], update:{ date:'May 2026', summary:'Grounding failures now carry legal weight. An audit of 1,508 baby-care and pregnancy queries, to appear at ICWSM 2026, found the AI Overview and the Featured Snippet on the same results page disagreed 33% of the time, with medical safeguards present in only 11% of Overviews; after a Guardian investigation in January 2026 Google removed Overviews for some liver-test queries rather than fixing the class. On 28 May 2026 the Munich Regional Court held Google directly liable for a false Overview that linked a publisher to fraud schemes, reasoning that a generated summary is Google’s own statement, not a list of results.', source:'Oxford Business Law Blog · A German ruling on AI Overviews', sourceUrl:'https://blogs.law.ox.ac.uk/oblb/blog-post/2026/07/who-speaks-when-algorithm-speaks-german-ruling-ai-overviews', keyNumbers:[{value:'33%',label:'Overview vs snippet disagreement (1,508 queries)'},{value:'11%',label:'Overviews with medical safeguards'},{value:'28 May 2026',label:'Munich court: the summary is Google’s own words'}] }, tags:['grounding','source quality','abstention'], source:'Oumi · Study finds 50% of AI Overviews untrustworthy', sourceUrl:'https://oumi.ai/blog/oumis-study-finds-50-of-ai-overviews', color:'lime' },
  { id:'ai-verify', topic:'AI agents', week:'W11', learningRole:'Current practice', sourceClass:'Institutional source', title:'When responsible AI became a test plan', setting:'Singapore Global AI Assurance Sandbox and AI Tester Accreditation · 2025–2026', context:'Singapore’s AI Verify work translates governance principles into process checks and technical tests. In February 2025 the AI Verify Foundation and IMDA launched the Global AI Assurance Sandbox, pairing organisations deploying generative-AI applications with specialist testing firms; in May 2026 they announced an accreditation programme for the testers themselves.', evidence:'The pilot-phase report covered 17 deployed applications tested by 16 specialist firms across 10 industries; by May 2026 the Sandbox had tested 30 applications from 14 sectors, including agentic AI and prompt-injection risk. The report says deciding what to test “was a non-trivial exercise”, that “no one has the ‘right’ test dataset to hand”, and records “an overwhelming reinforcement of the critical role of human experts” at every stage. The AI Tester Accreditation Programme opens in the third quarter of 2026 with no fees, benchmarked to IMDA’s starter kit for testing LLM-based applications.', takeaway:'Assurance begins when principles become a scoped test set, thresholds, logs, an accountable owner and an escalation route—and when someone independent can check the tester as well as the system.', trap:'Treating a framework, toolkit, sandbox report or accreditation badge as certification that a particular deployment is safe, effective or appropriate in every context.', decision:'Before deployment, define the use case, credible harms, evaluation set, acceptance threshold, human owner, escalation route and disclosure requirement—and decide who verifies the verification.', question:'What must be visible before an instructor calls an AI-assisted workflow responsible?', answer:'The intended use, test set, thresholds, failure record, unresolved risks, accountable owner, human escalation and the limits of what the evaluations establish.', keyNumbers:[{value:'30',label:'applications tested in the Sandbox by May 2026'},{value:'16',label:'specialist testing firms in the pilot'},{value:'3Q26',label:'tester accreditation opens'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=_8UfgeVcRXc',label:'AI Verify Foundation: Global AI Assurance Pilot (1:18)'},{type:'video',url:'https://www.youtube.com/watch?v=8NfNN1heFQY',label:'IMDA: A.I. Verify explained (4:45)'},{type:'pdf',url:'https://aiverifyfoundation.sg/wp-content/uploads/2026/05/Accreditation-Factsheet.pdf',label:'AI TAP factsheet, 19 May 2026'}], tags:['Singapore','assurance','evaluation'], source:'AI Verify Foundation · Global AI Assurance Sandbox report', sourceUrl:'https://assurance.aiverifyfoundation.sg/report/executive-summary/', color:'orange' },
  { id:'genai-catalog', topic:'AI agents', week:'W11', learningRole:'Current practice', sourceClass:'Vendor source', title:'1,302 use cases—and one missing denominator', setting:'Google Cloud customer catalogue · updated April 2026', context:'Google Cloud’s growing catalogue assembles customer and partner descriptions of generative-AI deployments and frames their expansion as evidence of an “agentic enterprise” era.', evidence:'The first-party catalogue’s April 2026 headline reports 1,302 real-world use cases. It is a broad collection of selected examples, not a representative sample with a denominator or common independent outcome measure.', takeaway:'A large catalogue can establish breadth of reported activity without establishing an adoption rate, average return, causal impact or probability of success.', trap:'Counting selected vendor stories as independent success evidence—or treating the number of examples as the percentage of organisations achieving value.', decision:'Before citing the catalogue, classify each claim, locate its denominator, identify who measured the outcome and state what cannot be inferred.', question:'What is the strongest defensible statement supported by “1,302 use cases”?', answer:'Google Cloud published 1,302 selected customer and partner examples. The catalogue alone cannot tell us how representative they are, how many attempts failed or what average causal impact the deployments produced.', keyNumbers:[{value:'1,302',label:'reported examples'},{value:'0',label:'population denominator'},{value:'1st-party',label:'source relationship'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=mbkBtikfANU',label:'IFLScience: survivorship bias (2:07)'}], update:{ date:'May 2026', summary:'An independent denominator now exists. The US Census Bureau’s Business Trends and Outlook Survey, covering 14 December 2025 to 3 May 2026, found 17–20% of US businesses using AI in any business function, rising to 37% among firms with 250 or more employees, with 20–23% expecting to use it within six months. Set beside 1,302 selected success stories, the survey shows what the catalogue cannot: most firms are not yet using AI at all, and the catalogue says nothing about the ones that tried and stopped.', source:'US Census Bureau · AI use at businesses (BTOS, May 2026)', sourceUrl:'https://www.census.gov/library/stories/2026/05/ai-use-businesses.html', keyNumbers:[{value:'17–20%',label:'US businesses using AI (Dec 2025–May 2026)'},{value:'37%',label:'firms with 250+ employees'},{value:'1,302',label:'catalogue examples, no denominator'}] }, tags:['source critique','selection bias','vendor claims'], source:'Google Cloud · Real-world gen-AI use cases', sourceUrl:'https://cloud.google.com/transform/101-real-world-generative-ai-use-cases-from-industry-leaders', color:'lime' },
  { id:'simplygo', topic:'Campaign decisions', week:'W13', learningRole:'Current practice', title:'When adoption data missed a commuter need', setting:'Singapore SimplyGo reversal · January 2024', context:'The planned retirement of legacy adult fare cards met strong public concern, including the loss of instant fare and balance displays at station gates.', evidence:'The Ministry of Transport said it had underestimated how strongly some commuters preferred seeing fares and balances immediately, then reversed the mandatory transition and retained the legacy system.', takeaway:'Usage data cannot substitute for understanding which moments make a service feel trustworthy.', trap:'Interpreting adoption counts as acceptance while missing a small, repeated interaction that anchors user confidence.', decision:'Combine operational costs and migration progress with observation, complaints, accessibility needs and qualitative research before mandating change.', question:'Which measure would have tested the decision more directly?', answer:'A direct measure of the need to verify fares and balances at the gate, segmented by commuter group—not adoption alone.', keyNumbers:[{value:'64%',label:'adult commuters on ABT in Dec 2023'},{value:'1 glance',label:'critical user moment'},{value:'2030',label:'legacy support horizon stated'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=adv0MoN6Gc4',label:'LTA: the fare-display fix (0:23)'}], tags:['Singapore','service design','qualitative data'], source:'Singapore MOT · Parliamentary reply on SimplyGo', sourceUrl:'https://www.mot.gov.sg/news-resources/newsroom/oral-reply-by-minister-for-transport-chee-hong-tat-to-parliamentary-questions-on-simplygo/', color:'blue' },
  { id:'mycity', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'The civic chatbot that needed an audit, not a disclaimer', setting:'New York City MyCity audit · report dated December 2025', context:'MyCity was built to help residents and businesses navigate services. Its chatbot operated in a domain where incorrect guidance could affect legal or financial decisions.', evidence:'The City Comptroller’s audit, dated 30 December 2025, found the chatbot “appears to be unable to provide accurate or consistent information”, recorded 90th-percentile response times of 12.4–16.2 seconds for 311 questions against a five-second standard, and counted more than $100 million spent on MyCity with a further $81 million requested for 2026.', takeaway:'Public-sector agents need measurable accuracy, latency, escalation and accountability targets before scale.', trap:'Treating a disclaimer as a control. Warning users that a system may be wrong does not make high-stakes misinformation safe.', decision:'Set test suites from real user tasks, publish thresholds, log sources, create human escalation and define a shutdown condition.', question:'Which two metrics belong together?', answer:'Answer correctness and task latency. A correct answer that arrives too slowly—or a fast answer that is wrong—both fail the service.', keyNumbers:[{value:'12.4–16.2s',label:'90th-percentile response (standard: 5s)'},{value:'$100m+',label:'spent on MyCity by Oct 2025'},{value:'30 Dec 2025',label:'audit report date'}], resources:[{type:'pdf',url:'https://comptroller.nyc.gov/wp-content/uploads/2026/02/MyCity-System-Development-Public-Final-report-12-30-25-final-copy.pdf',label:'Official audit PDF (comptroller.nyc.gov)'},{type:'video',url:'https://www.youtube.com/watch?v=QyF1QD2dBN0',label:'PIX11: the chatbot’s bad advice (0:40)'},{type:'article',url:'https://comptroller.nyc.gov/reports/audit-report-on-the-new-york-city-office-of-technology-and-innovations-mycity-system/',label:'NYC Comptroller: audit report page'}], update:{ date:'January 2026', summary:'On 30 January 2026 the incoming Mamdani administration said it would shut the chatbot down, calling it “functionally unusable” and citing roughly half a million dollars a year in running costs. The audit’s three measures—accuracy, latency and cost—became the shutdown condition that the 2023 launch never defined.', source:'THE CITY · Mamdani targets ‘unusable’ AI chatbot', sourceUrl:'https://www.thecityreporter.nyc/2026/01/30/mamdani-unusable-ai-chatbot-budget/', keyNumbers:[{value:'$500k',label:'annual cost cited at shutdown'},{value:'30 Jan 2026',label:'shutdown announced'},{value:'2023→2026',label:'launch to shutdown'}] }, tags:['public service','audit','latency'], source:'NYC Comptroller · MyCity audit (course PDF mirror)', sourceUrl:'https://drive.google.com/file/d/1PJ4g7bOqMmiGbsfLou-OB0II47ahM1Tk/view', color:'orange' },
  { id:'netflix-llm-art', topic:'Web analytics', week:'W05–06', learningRole:'Current practice', title:'Can an LLM predict which artwork you will choose?', setting:'Netflix artwork research · 2026', context:'Netflix researchers tested post-trained language models on structured descriptions of members, titles and candidate artwork to improve personalised artwork selection.', evidence:'The published study reports training on 110,000 data points, evaluation on 5,000 held-out examples and 3–5% improvements over a production model in the reported experiments.', takeaway:'Offline model gains are evidence for a candidate—not proof of better member outcomes.', trap:'Confusing held-out predictive performance with causal lift, or optimising clicks without fairness and satisfaction guardrails.', decision:'Use offline evaluation to screen candidates, then pre-register an online experiment with member-level outcomes and long-term guardrails.', question:'What must happen before “3–5% better” becomes a product claim?', answer:'Clarify the metric and baseline, reproduce the holdout result, then run an online randomised test measuring actual member behaviour and downstream quality.', keyNumbers:[{value:'110k',label:'training examples'},{value:'5k',label:'held-out examples'},{value:'3–5%',label:'reported improvement'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=nq2QtatuF7U',label:'NBC: Netflix’s algorithm (2:58)'}], tags:['LLM','offline vs online','personalisation'], source:'Netflix Research · Artwork Personalization via LLM Post-training', sourceUrl:'https://arxiv.org/abs/2601.02764', update:{ date:'August 2026', summary:'A follow-up Netflix paper describes multimodal embeddings now serving all five artwork canvases from one model, replacing five per-canvas models, and a tri-modal MediaFM model that beat visual-only baselines “both offline and in online A/B tests”. It also reports a cheap offline proxy task whose scores correlate with online outcomes and now gate every new model checkpoint—offline evidence used to screen, online evidence used to decide.', source:'arXiv · Multimedia Asset Personalization via Multimodal Embeddings at Netflix', sourceUrl:'https://arxiv.org/abs/2608.18322', keyNumbers:[{value:'5 → 1',label:'per-canvas models replaced'},{value:'3',label:'modalities fused in MediaFM'},{value:'A/B',label:'online test before rollout'}] }, color:'coral' },
  { id:'mcdonalds-ai', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'The drive-thru pilot that stopped before scale', setting:'McDonald’s and IBM voice ordering · 2021–2024', context:'McDonald’s tested automated order taking at more than 100 drive-thrus, a noisy real-world environment with accents, overlapping voices and highly variable orders.', evidence:'The company ended the specific IBM test in 2024 while saying voice ordering still had future potential. Public reports documented conspicuous order failures and customer complaints.', takeaway:'Ending a pilot can be good evidence practice when the current system is not ready for the operating environment.', trap:'Declaring AI a total failure—or a future certainty—without seeing the test criteria, error distribution and human fallback performance.', decision:'Segment errors by accent, noise, order complexity and harm; compare speed and accuracy with a human-assisted baseline before choosing to scale, redesign or stop.', question:'Which average could hide the real product risk?', answer:'Overall order accuracy. Rare but severe basket errors, systematic failures for speech groups and staff intervention time need separate measures.', keyNumbers:[{value:'100+',label:'restaurants in test'},{value:'2024',label:'test ended'},{value:'severity',label:'matters beyond mean error'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=cofWg1ot9Z8',label:'WOSU: trying Wendy’s AI drive-thru (1:00)'},{type:'article',url:'https://www.nrn.com/restaurant-technology/wendy-s-is-giving-franchisees-the-option-to-test-its-drive-thru-ai-chatbot',label:'NRN: Wendy’s two accuracy figures (86% vs 99%)'},{type:'video',url:'https://www.youtube.com/watch?v=el_f82ZXGME',label:'CBS News: the pilot ends (3:37)'}], tags:['pilot','speech AI','segmentation'], source:'Associated Press · McDonald’s ends AI drive-thru test', sourceUrl:'https://apnews.com/article/bebc898363f2d550e1a0cd3c682fa234', update:{ date:'June 2026', summary:'McDonald’s returned to voice ordering with a Google-built system, ArchIQ, in test at five US restaurants under its “McDonald’s NEXT” plan. A franchisee-run account reported more than a million transactions with about 90% of orders completed without human escalation—figures the company itself has not confirmed. The 2024 stop and the 2026 restart are the same evidence practice: stage, measure, then decide.', source:'Fox Business · McDonald’s testing ArchIQ at five locations', sourceUrl:'https://www.foxbusiness.com/retail/mcdonalds-testing-ai-drive-thru-order-taking-system-called-archiq-five-locations-country', keyNumbers:[{value:'5',label:'test restaurants, June 2026'},{value:'~90%',label:'orders without escalation (unconfirmed)'},{value:'2 yrs',label:'between stop and restart'}] }, color:'lime' },
  { id:'snow', topic:'Foundations', week:'W01', learningRole:'Foundational', title:'The pump that changed public health', setting:'London cholera outbreak · 1854', context:'In September 1854 cholera struck the streets around Broad Street in Soho. John Snow marked each death on a street map together with the public water pumps—decades before the microbiology of cholera was settled—turning scattered addresses into a question about a shared source.', evidence:'CDC’s Principles of Epidemiology self-study course presents Snow’s 1854 investigation, in which cholera deaths were plotted around the Broad Street pump, as a founding exercise in field epidemiology.', takeaway:'Plotting deaths around water pumps exposed a spatial cluster that a table could hide.', trap:'A pattern suggests a hypothesis; it does not prove a cause on its own.', decision:'The parish board had to decide whether to disable a working public pump on pattern evidence alone—act early with imperfect evidence, or wait for proof while deaths continued.', question:'What extra evidence strengthens the pump hypothesis?', answer:'Compare households’ water sources—including exceptions such as brewery workers—not only distance from the pump.', keyNumbers:[{value:'1854',label:'Broad Street outbreak'},{value:'1',label:'pump implicated'},{value:'0',label:'pathogen certainty required to act'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=D2DzDDyKjR4',label:'John Snow and cholera (2:08)'}], tags:['mapping','public health'], source:'CDC · Principles of Epidemiology', sourceUrl:'https://stacks.cdc.gov/view/cdc/6914', color:'blue' },
  { id:'nightingale', topic:'Foundations', week:'W01', learningRole:'Foundational', title:'Mortality, made impossible to ignore', setting:'British military hospitals · 1850s', context:'Returning from the Crimean War hospitals, Florence Nightingale compiled monthly mortality statistics and redrew them as polar-area diagrams for official reports—aimed at ministers and army administrators, not statisticians.', evidence:'The University of York statistics archive reproduces Nightingale’s Crimean mortality tables, in which deaths from zymotic disease far exceeded deaths from wounds during the first winter of the campaign.', takeaway:'Florence Nightingale’s polar-area diagrams turned preventable deaths into an argument for sanitation.', trap:'Area grows faster than radius. A dramatic shape can exaggerate change.', decision:'The War Office had to decide whether hospital deaths were an unavoidable cost of war or a fixable failure of sanitation—and whether to fund reform on the strength of a chart.', question:'Why was the chart persuasive to decision-makers?', answer:'It paired a memorable visual pattern with a concrete action: improve hospital sanitation.', keyNumbers:[{value:'1858',label:'diagrams published'},{value:'1854–56',label:'Crimean data period'},{value:'3',label:'causes of death compared'}], resources:[{type:'video',url:'https://www.instagram.com/p/DcF_JyoAmVH/',label:'Watch on Instagram'},{type:'video',url:'https://www.youtube.com/watch?v=DpfccQ95SOM',label:'CGTN: Nightingale, data pioneer (2:36)'}], tags:['history','health'], source:'University of York · Nightingale data', sourceUrl:'https://www.york.ac.uk/depts/maths/histstat/small.htm', color:'coral' },
  { id:'commute', topic:'Foundations', week:'W01', learningRole:'Transfer', title:'How Singapore gets to work', setting:'Census transport modes · Singapore', context:'Singapore’s census asks employed residents how they usually travel to work. Summarised by planning area, the table becomes a planning tool: modal shares differ sharply between towns with different housing, income and MRT access.', evidence:'The data.gov.sg census table records employed residents’ usual mode of transport to work by planning area, so counts and modal shares can be compared across the island.', takeaway:'A planning-area comparison links everyday travel behaviour to housing and transport decisions.', trap:'Counts reward populous areas. Rates answer a different question.', decision:'Transport and housing agencies allocate capacity by area. Mapping counts instead of rates—or rates instead of counts—points investment at different neighbourhoods.', question:'Would you map counts or percentages?', answer:'Use percentages to compare modal preference; use counts to plan absolute capacity. Often show both.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=3aKaM2Sui4k',label:'LTA: Land Transport Master Plan 2040 (4:06)'}], tags:['Singapore','open data'], source:'data.gov.sg · Census transport dataset', sourceUrl:'https://data.gov.sg/datasets/d_1f8f5ec7201964e365c77551cab99503/view', color:'lime' },
  { id:'aircanada', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'“The chatbot said so” was not a defence', setting:'Moffatt v. Air Canada · 2024', context:'A traveller asked Air Canada’s website chatbot about bereavement fares and was told he could apply for the discount after flying. The airline’s actual policy said otherwise, and it argued the chatbot was a separate entity responsible for its own words.', evidence:'The BC Civil Resolution Tribunal found Air Canada liable for negligent misrepresentation after its chatbot gave incorrect bereavement-fare guidance, ordering the airline to pay CAD $812.02.', takeaway:'A customer relied on incorrect bereavement-fare advice from a chatbot; the company remained responsible.', trap:'Treating an agent as an independent authority dissolves accountability.', decision:'Any organisation deploying a customer-facing agent must decide, before launch, who answers for its statements—the tribunal treated the chatbot’s advice as the company’s own.', question:'Where should a human checkpoint sit?', answer:'Before policy advice is shown or acted on, with a current source and escalation path attached.', keyNumbers:[{value:'2024',label:'tribunal decision'},{value:'$812.02',label:'ordered payment (CAD)'},{value:'1',label:'accountable company'}], resources:[{type:'article',url:'https://policy-insider.ai/who-blames-the-bot-the-olg-hamm-ruling-and-the-reality-of-ai-liability-in-professional-services/',label:'Analysis: OLG Hamm chatbot ruling (May 2026)'},{type:'article',url:'https://www.mddi.gov.sg/newsroom/singapore-launches-new-model-ai-governance-framework-for-agentic-ai--/',label:'MDDI: agentic AI governance framework (Jan 2026)'},{type:'video',url:'https://www.youtube.com/watch?v=PrktgGDP0jA',label:'CBC News: the ruling (2:14)'}], tags:['governance','hallucination'], source:'CanLII · Moffatt v. Air Canada', sourceUrl:'https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html', update:{ date:'July 2026', summary:'Courts and regulators have held the tribunal’s line. On 12 May 2026 the Higher Regional Court of Hamm (4 UKl 3/25) found a cosmetic-surgery clinic liable under German unfair-competition law after its chatbot invented specialist qualifications for its doctors: the bot is the operator’s tool, so its words are the company’s words, even where the company fed it correct data; an appeal to the Federal Court of Justice was allowed. In Singapore, the Model AI Governance Framework for Agentic AI (January 2026) asks organisations to define checkpoints where human approval is required, and IMDA’s Transparency Guidelines for Generative AI Chatbots (20 July 2026) introduce an AI Information Card disclosing a chatbot’s capabilities, limits, safeguards, data use and complaint channels before a customer relies on it.', source:'IMDA · Transparency Guidelines for Generative AI Chatbots', sourceUrl:'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/new-transparency-guidelines-to-help-consumers-use-generative-ai-chatbots-safely-and-responsibly', keyNumbers:[{value:'12 May 2026',label:'Hamm court: chatbot is the operator’s tool'},{value:'20 Jul 2026',label:'IMDA chatbot transparency guidelines'},{value:'1 card',label:'AI Information Card per chatbot'}] }, color:'orange' },
  { id:'agent-boundary', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'The analyst agent with one permission too many', setting:'Campaign CRM · governance scenario', context:'A marketing team gives an analyst agent CRM access to deduplicate a mailing list. The same credential also allows it to send campaigns and delete records—permissions nobody consciously granted for this task.', takeaway:'A useful agent may clean a list; it should not also publish, email and delete without bounded authority.', trap:'Automation bias grows after a streak of correct outputs.', decision:'Scoping authority is itself the decision: which actions the agent may take autonomously, which require approval, and which are excluded—settled before a streak of correct outputs builds false trust.', question:'Which permission would you remove first?', answer:'Irreversible actions such as sending and deletion should require explicit approval and logs.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=potjsYIlh8Y',label:'ByteMonk: deleted in 9 seconds (8:35)'},{type:'article',url:'https://www.searchenginejournal.com/amazon-wins-preliminary-injunction-against-perplexitys-comet/569256/',label:'SEJ: Amazon v. Perplexity Comet injunction (Mar 2026)'},{type:'video',url:'https://www.youtube.com/watch?v=xG3py56UBUo',label:'Microsoft: what is an AI agent? (0:59)'}], tags:['privacy','human control'], source:'IMDA · Agentic AI Governance Framework', sourceUrl:'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2026/new-model-ai-governance-framework-for-agentic-ai', update:{ date:'April 2026', summary:'The scenario now has two real counterparts. On 25 April 2026 a Cursor coding agent working on a staging task for PocketOS, a car-rental software firm, hit a credential mismatch, found a Railway API token created for managing custom domains but scoped to every operation, and deleted the production database and its volume-level backups in nine seconds; the last separate backup was three months old. Six weeks earlier, on 9 March 2026, a US federal judge granted Amazon a preliminary injunction against Perplexity’s Comet shopping agent for accessing customer accounts with the user’s permission but without Amazon’s authorisation. Permissions granted for a build phase outlive it, and a user’s consent and a platform’s authorisation are separate permissions—an agent needs both.', source:'The Register · Cursor-Opus agent snuffs out PocketOS database', sourceUrl:'https://www.theregister.com/2026/04/27/cursoropus_agent_snuffs_out_pocketos/', keyNumbers:[{value:'9 s',label:'to delete database and backups'},{value:'3 months',label:'age of last separate backup'},{value:'2',label:'permissions an agent needs: user and platform'}] }, color:'blue' },
  { id:'categories', topic:'Data preparation', week:'W03', learningRole:'Transfer', title:'Why did “Chicken Rice” disappear?', setting:'Food-delivery export · adapted case', context:'A food-delivery export lists the same dish as “Chicken Rice”, “chicken rice set”, “Hainanese Chicken Rice” and three other labels. An agent asked for top sellers standardises the categories silently, and the familiar leader vanishes from the ranking.', takeaway:'One dish appears under six labels. Standardising categories completely changes the ranking.', trap:'Silent cleaning choices can manufacture a winner.', decision:'The ranking feeds menu and inventory choices. Whether “one dish” or “six labels” is true decides which item gets promoted—so the cleaning rule, not the chart, is the real decision.', question:'What must the cleaning log preserve?', answer:'Original value, new value, rule used, affected rows and who approved the change.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=efRKika4SOE',label:'Tom Redman: garbage in, garbage out (1:24)'}], tags:['cleaning','categories'], source:'Course case · adapted from platform exports', sourceUrl:'#lab', color:'coral' },
  { id:'rainfall', topic:'Data preparation', week:'W03', learningRole:'Transfer', title:'A rainfall join that doubled the storm', setting:'Weather stations · Singapore open data', context:'Hourly rainfall readings are joined to a station-metadata table to compute an island-wide total. The metadata contains duplicated station rows, so each reading matches twice and the storm total doubles without any error being raised.', evidence:'The data.gov.sg collection publishes NEA weather-station readings, including rainfall, identified by station—so joins between readings and station metadata can be checked for key uniqueness.', takeaway:'Joining hourly readings to duplicated station metadata inflated the citywide total.', trap:'A many-to-many join can multiply rows while still “looking right.”', decision:'Flood-preparedness and public reporting depend on the total. A silent row-multiplying join can trigger a response sized for a storm that never happened.', question:'What check catches this fastest?', answer:'Compare row counts and key uniqueness before and after the join; then reconcile totals.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=J4x3jscwzUU',label:'SQL joins, visually (4:28)'}], tags:['joining','validation'], source:'data.gov.sg · Real-time weather readings', sourceUrl:'https://data.gov.sg/collections/1459/view', color:'blue' },
  { id:'berkeley', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'The admissions paradox', setting:'UC Berkeley graduate admissions · 1973', context:'In 1973 UC Berkeley’s aggregate graduate admissions looked biased against women—44% of men admitted versus 35% of women. Bickel and colleagues re-examined the figures by department and the pattern reversed.', evidence:'The UCBAdmissions dataset records 4,526 applications to the six largest Berkeley departments in autumn 1973; the aggregate rate favours men, yet women’s admission rate is equal or higher in four of the six departments.', takeaway:'Aggregated data appeared biased against women; department-level rates revealed different application patterns.', trap:'A hidden grouping variable can reverse the overall relationship.', decision:'The university faced a possible discrimination case. Whether the aggregate or the department view is the right frame determines who, if anyone, is accountable—and what should change.', question:'Does the disaggregated result end the equity question?', answer:'No. It changes the mechanism to investigate—such as why applicants cluster in more selective departments.', keyNumbers:[{value:'4,526',label:'applications in the dataset'},{value:'6',label:'departments'},{value:'4 of 6',label:'departments favour women'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=sxYrzzy3cq8',label:'TED-Ed: misleading statistics (4:19)'},{type:'video',url:'https://www.youtube.com/watch?v=ebEkn-BiW5k',label:'minutephysics: Simpson’s paradox (4:39)'}], tags:['Simpson’s paradox','bias'], source:'R datasets · UCBAdmissions', sourceUrl:'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/UCBAdmissions.html', color:'lime' },
  { id:'anscombe', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'Four datasets, one summary', setting:'Anscombe’s quartet · 1973', context:'Francis Anscombe built four small datasets to make a point to statisticians who trusted summary output: identical regression printouts can describe a line, a curve, an outlier-driven slope and a single high-leverage point.', evidence:'Anscombe’s 1973 paper constructs four eleven-point datasets with matching means, variances, correlations (≈0.82) and fitted regression lines, whose scatterplots differ radically.', takeaway:'Four datasets share nearly identical means, correlations and regressions, but look radically different.', trap:'A compact statistic can conceal outliers, curves and clusters.', decision:'An automated summary that reports only means, correlations and coefficients will endorse all four datasets equally—plotting before trusting is a supervision rule, not a nicety.', question:'What is the non-negotiable next step?', answer:'Visualise the data and inspect residuals before accepting the summary model.', keyNumbers:[{value:'4',label:'datasets'},{value:'11',label:'points each'},{value:'≈.82',label:'shared correlation'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=Ftp3mmItV-k',label:'Udacity: Anscombe’s quartet (1:08)'}], tags:['correlation','outliers'], source:'American Statistician · Anscombe', sourceUrl:'https://www.sjsu.edu/faculty/gerstman/StatPrimer/anscombe1973.pdf', color:'orange' },
  { id:'abtest', topic:'Statistical interpretation', week:'W04', learningRole:'Transfer', title:'The tiny lift that “won”', setting:'Newsletter subject-line test · adapted case', context:'A newsletter subject-line test on a very large list produces a 0.2-point open-rate lift with a small p-value. The team reads “significant” as “worth shipping” and schedules a creative overhaul.', takeaway:'A 0.2-point lift is statistically detectable at huge scale but may not pay for a creative overhaul.', trap:'Statistical significance is not practical significance.', decision:'Shipping the overhaul costs real design and testing time. The minimum effect worth acting on, at what cost, must be set before the test—or significance will decide by default.', question:'What belongs beside the p-value?', answer:'Effect size, confidence interval, business value, costs and the pre-registered decision rule.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=xYvWbELefjY',label:'NNgroup: practical vs statistical (2:35)'}], tags:['A/B testing','significance'], source:'Course case · adapted experiment', sourceUrl:'#lab', color:'blue' },
  { id:'funnel', topic:'Web analytics', week:'W05–06', learningRole:'Transfer', title:'The campaign that won clicks—not customers', setting:'Social ad → checkout funnel · adapted case', context:'A social campaign is optimised for click-through and celebrates a 38% rise. The funnel shows what happened next: 12,400 visits became 3,170 carts and 294 completed purchases—fewer than before the change.', takeaway:'Click-through rose 38%, while qualified visits and completed purchases fell.', trap:'Optimising the top of the funnel can damage the outcome.', decision:'Budget follows the reported metric. Crowning click-through moves spend towards traffic that does not convert; owning the decision with a downstream metric moves it back.', question:'Which metric should own the decision?', answer:'A downstream metric tied to the goal—such as qualified conversion or profit—not clicks alone.', keyNumbers:[{value:'+38%',label:'click-through change'},{value:'12,400',label:'visits into the funnel'},{value:'294',label:'completed purchases'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=jQjOD579jhI',label:'The marketing funnel (2:28)'}], tags:['GA4','funnel'], source:'Google Analytics · Funnel exploration', sourceUrl:'https://support.google.com/analytics/answer/9327974', color:'blue' },
  { id:'attribution', topic:'Web analytics', week:'W06', learningRole:'Transfer', title:'Who gets credit for the sale?', setting:'Search, social and email journey', context:'A customer first meets the brand on social, returns later through search, and finally converts from an email link. Each attribution model divides the same sale differently; last-click gives email everything.', takeaway:'Last-click attribution crowns email; the path shows social introduced the user and search returned them.', trap:'An attribution model is a rule for assigning credit, not ground truth.', decision:'Channel budgets are reallocated on this report. A model choice presented as measurement can quietly defund the channel that introduces new customers.', question:'How should the team report the result?', answer:'Compare models, show the journey, state the lookback window and avoid claiming causal lift.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=BfnJwYuFWVM',label:'HubSpot: attribution modeling (2:38)'}], tags:['attribution','journeys'], source:'Google Analytics · Attribution', sourceUrl:'https://support.google.com/analytics/answer/10596866', color:'coral' },
  { id:'axis', topic:'Visualisation', week:'W08', learningRole:'Transfer', title:'A 3% change that looks like a cliff', setting:'Quarterly brand-trust dashboard', context:'A quarterly dashboard tracks brand trust. The score moved from 81 to 78, and the chart’s y-axis begins at 77, so the bars show a collapse rather than a three-point dip.', takeaway:'Starting the y-axis at 77 turns a three-point dip into a visual collapse.', trap:'A technically correct scale can still mislead perception.', decision:'Leadership reads the chart, not the data table. Whether this quarter triggers a crisis response or routine monitoring depends on a scale choice the reader never sees.', question:'Must every bar chart start at zero?', answer:'Usually yes because length encodes magnitude. If not, disclose the break and consider a line or dot plot.', keyNumbers:[{value:'81 → 78',label:'scenario trust scores'},{value:'77',label:'axis start that distorts'},{value:'≈3%',label:'actual change'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=E91bGT9BjYk',label:'TED-Ed: spot a misleading graph (4:10)'}], tags:['axes','perception'], source:'Claus Wilke · Visualizing amounts', sourceUrl:'https://clauswilke.com/dataviz/visualizing-amounts.html', color:'orange' },
  { id:'choropleth', topic:'Visualisation', week:'W08–09', learningRole:'Transfer', title:'The map that mostly shows population', setting:'Campaign mentions by region', context:'Campaign mentions are mapped by region as raw counts. The most populous regions saturate darkest, so the map largely repaints the population distribution rather than engagement.', takeaway:'Raw mention counts make dense regions look most engaged. Per-capita rates reveal a different pattern.', trap:'Area and population dominate a choropleth of counts.', decision:'Regional teams are resourced from this map. Counts direct effort to big regions by default; a defensible denominator can redirect it to where engagement is actually unusual.', question:'Which denominator is defensible?', answer:'Choose the exposed or eligible population, explain it, and show uncertainty for small areas.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=hlQE4IGFc5A',label:'Vox: the bad election map (2:05)'}], tags:['maps','normalisation'], source:'CDC · Mapping techniques', sourceUrl:'https://www.cdc.gov/tobacco/stateandcommunity/guides/pdfs/best-practices-mapping-techniques.pdf', color:'lime' },
  { id:'flatten', topic:'Data stories', week:'W10', learningRole:'Transfer', title:'One curve, one memorable action', setting:'“Flatten the curve” · COVID-19', context:'In early 2020 one schematic—two epidemic curves against a flat health-system capacity line—travelled from journals to briefings to social media, giving the public a single actionable idea: slow the spread so the peak stays manageable.', evidence:'A March 2020 Lancet comment by Anderson and colleagues argued that mitigation measures act by flattening the epidemic curve so that peak demand stays closer to health-system capacity.', takeaway:'A simple visual connected collective behaviour to health-system capacity.', trap:'Simplicity aids action but can hide assumptions and uncertainty.', decision:'Governments asked millions to change behaviour on the strength of a schematic. Its simplicity earned compliance; its hidden assumptions—fixed capacity, uniform mixing—still shaped policy.', question:'What made the story travel?', answer:'Clear contrast, an understandable constraint, and a specific role for the audience.', keyNumbers:[{value:'Mar 2020',label:'Lancet comment published'},{value:'2',label:'curves contrasted'},{value:'1',label:'capacity line anchoring the story'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=MD4UpVEzm0g',label:'Flatten the curve, explained (1:21)'}], update:{ date:'August 2026', summary:'Six years on, outbreak visuals carry the uncertainty the 2020 schematic hid. The CDC’s August 2026 report on the South Carolina measles outbreak shows provisional case curves alongside delay-adjusted nowcasts and the effective reproduction number, and states plainly where the nowcasts under-estimated. It is less memorable than two curves and a capacity line—and more honest about what the data can support.', source:'CDC MMWR · Nowcasting during a measles outbreak (Aug 2026)', sourceUrl:'https://www.cdc.gov/mmwr/volumes/75/wr/mm7533a1.htm', keyNumbers:[{value:'997',label:'cases, Oct 2025–Mar 2026'},{value:'Rt',label:'shown with uncertainty bands'},{value:'2020→2026',label:'from schematic to nowcast'}] }, tags:['narrative','public health'], source:'The Lancet · flattening the curve', sourceUrl:'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)30567-5/fulltext', color:'coral' },
  { id:'wrapped', topic:'Data stories', week:'W10', learningRole:'Transfer', title:'Your data became the campaign', setting:'Spotify Wrapped · annual product story', context:'Each December Spotify assembles every listener’s streaming history into Wrapped: a sequenced, designed story with comparisons, reveals and a share button—private telemetry turned into a public campaign.', evidence:'Spotify’s newsroom has presented Wrapped annually since 2015 as a personalised year-in-review that packages each listener’s data into a shareable story.', takeaway:'Personal listening data is sequenced into a shareable identity story.', trap:'Personalisation can feel delightful or invasive depending on expectation and control.', decision:'The same personalisation that drives sharing sets expectations about what the platform keeps and shows. Where the line sits between delight and surveillance is a design decision, not an accident.', question:'What turns a dashboard into a story?', answer:'A deliberate sequence, comparison, surprise, a clear voice and an ending designed for action or sharing.', keyNumbers:[{value:'2015',label:'first annual Wrapped'},{value:'Dec',label:'annual cadence'},{value:'1',label:'listener at the centre of each story'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=aAxHVa8-GxE',label:'Wrapped in 60 seconds (0:54)'}], tags:['personalisation','storytelling'], source:'Spotify Newsroom · Wrapped', sourceUrl:'https://newsroom.spotify.com/tag/spotify-wrapped/', update:{ date:'December 2025', summary:'Spotify reported that Wrapped 2025 reached 200 million engaged users in about 24 hours (62 hours in 2024) and roughly 500 million shares on its first day, up 41% year on year. The figures are Spotify’s own, as reported by Music Business Worldwide—reach and shares, not retention or revenue—so treat them as campaign-output metrics rather than outcome evidence.', source:'Music Business Worldwide · Wrapped hit 200m engaged users in 24 hours', sourceUrl:'https://www.musicbusinessworldwide.com/spotify-wrapped-campaign-hit-200m-engaged-users-in-24-hours-a-19-yoy-increase/', keyNumbers:[{value:'200m',label:'engaged users in ~24 hours'},{value:'~500m',label:'shares on day one'},{value:'+41%',label:'shares, year on year'}] }, color:'blue' },
  { id:'museum', topic:'Forecasting', week:'W11–12', learningRole:'Transfer', title:'The forecast that forgot school holidays', setting:'Weekly museum attendance · adapted case', context:'A weekly attendance forecast is fitted to a smooth trend. School holidays predictably multiply visits, but the model treats those weeks as noise, so staffing is planned for the average.', takeaway:'A smooth trend misses predictable holiday spikes and understates staffing needs.', trap:'A good average forecast can still fail when the decision happens at peaks.', decision:'Rosters and temporary hires are booked from the forecast. A model that misses predictable peaks understaffs exactly the weeks when service failure is most visible.', question:'Which baseline should the agent beat?', answer:'A seasonal naïve forecast—this week equals the comparable week last cycle—before adding complexity.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=7UPgcI0ebi4',label:'Trend, seasonality, cyclicity (3:39)'}], tags:['seasonality','baseline'], source:'Forecasting: Principles and Practice', sourceUrl:'https://otexts.com/fpp3/', color:'lime' },
  { id:'shock', topic:'Forecasting', week:'W12', learningRole:'Transfer', title:'When history stopped behaving normally', setting:'Mobility demand during a structural break', context:'A mobility-demand model is trained on thirty stable years; then a sudden policy and behaviour change breaks the data-generating process. The model extrapolates the old regime with confident, narrow intervals.', takeaway:'A model trained on stable years projects straight through a sudden policy and behaviour change.', trap:'Narrow intervals create false confidence when the data-generating process changes.', decision:'Plans and communications are built on those intervals. Presenting one confident line instead of scenarios commits the organisation to a future the model no longer describes.', question:'What should the communication lead say?', answer:'Present scenarios, identify the break, widen uncertainty and describe triggers for updating the plan.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=f3CLo2w7I0I',label:'Probabilistic forecasting (3:08)'}], tags:['uncertainty','time series'], source:'Forecasting: Principles and Practice', sourceUrl:'https://otexts.com/fpp3/', color:'orange' },
  { id:'benefits', topic:'Campaign decisions', week:'W13', learningRole:'Transfer', title:'When a risk score became a verdict', setting:'Public-service fraud detection · real-world pattern', context:'A fraud-detection score is introduced to prioritise which benefit cases a caseworker reviews first. Under workload pressure the queue becomes the verdict: high scores are treated as denials—a pattern seen in public-sector incidents tracked by the OECD.', takeaway:'A score designed to prioritise review can become an automated denial when people over-trust it.', trap:'Prediction silently turns into prescription.', decision:'People lose income and appeal rights when review becomes denial. The design decision—what the score may trigger without a human, and what recourse exists—is the real safeguard.', question:'When should data not decide?', answer:'When stakes are high, recourse is weak, proxies encode protected traits, or evidence cannot justify the action.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=m8D5AQEYsU0',label:'ABC News: compensation after the royal commission (2:05)'},{type:'video',url:'https://www.youtube.com/watch?v=CUjprpN5oXc',label:'SBS News: the Robodebt inquiry (1:01)'}], update:{ date:'September 2025', summary:'On 4 September 2025 the Australian government settled a second Robodebt class action for A$475 million, covering more than 450,000 people and compensating the distress and suffering the 2020 settlement did not—the largest class-action settlement in Australia’s history. The royal commission’s verdict stands: “a crude and cruel mechanism, neither fair nor legal”.', source:'ABC News · Robodebt class-action settlement', sourceUrl:'https://www.abc.net.au/news/2025-09-04/robodebt-victims-get-compensation-from-class-action/105734030', keyNumbers:[{value:'A$475m',label:'second class-action settlement'},{value:'450,000+',label:'people covered'},{value:'4 Sep 2025',label:'settlement announced'}] }, tags:['ethics','recommendation'], source:'OECD · AI incidents and accountability', sourceUrl:'https://oecd.ai/en/incidents', color:'coral' },
  { id:'campaign', topic:'Campaign decisions', week:'W13', learningRole:'Transfer', title:'From insight to a campaign someone can use', setting:'Active-mobility campaign · Singapore scenario', context:'A capstone-style scenario: survey responses, search interest and transport datasets each suggest a different barrier to active mobility—safety in one neighbourhood, distance in another, weather in a third.', takeaway:'Survey, search and transport data point to different barriers by neighbourhood.', trap:'A generic citywide recommendation averages away the people who need different messages.', decision:'One citywide message or several targeted ones is a budget and equity decision. The recommendation must name its audience, evidence and uncertainty so someone can actually act on it.', question:'What makes the recommendation defensible?', answer:'Name the audience, action, evidence, uncertainty, trade-off, owner, success measure and review date.', resources:[{type:'video',url:'https://www.youtube.com/watch?v=r5_34YnCmMY',label:'HBR: telling stories with data (4:47)'}], tags:['strategy','stakeholders'], source:'data.gov.sg · Transport datasets', sourceUrl:'https://data.gov.sg/datasets?topics=transport', color:'blue' },
  { id:'tacobell-ai', topic:'AI agents', week:'W02', learningRole:'Current practice', sourceClass:'Independent source', title:'Eighteen thousand cups of water—and a rollout that kept growing', setting:'Taco Bell voice AI · August 2025 – July 2026', context:'Taco Bell rolled voice ordering out across hundreds of US drive-thrus in 2025. In August a customer ordered 18,000 cups of water and the system accepted it; the clip went viral and the company said it was rethinking where the technology should run.', evidence:'By July 2026 Taco Bell reported voice AI live in more than 890 restaurants across 38 states, with transactions “either on par with or faster than” human order-taking. Its chief digital and technology officer said the company was “thinking about where and where not to deploy the technology” while calling it “a core part of our future”.', takeaway:'A viral failure is an anecdote and a deployment count is a vendor-reported output; neither is an error rate. Ask for accuracy by order type, the share needing staff intervention, and what bounds-check would have caught an absurd order.', trap:'Letting the most shareable failure stand in for the distribution of failures—or letting continued expansion stand in for proof that the failures were fixed.', decision:'Set the halt condition before scale: which error classes (absurd quantities, wrong items, misheard modifiers) trigger a pause, measured how, at which threshold, and who owns the call.', question:'Which single number would you ask Taco Bell for first?', answer:'Order accuracy by site and order complexity against a human baseline, with the intervention rate alongside it—because “on par or faster” is a speed claim, not an accuracy claim.', keyNumbers:[{value:'18,000',label:'cups of water accepted'},{value:'890+',label:'restaurants live, July 2026'},{value:'38',label:'US states'}], resources:[{type:'video',url:'https://www.youtube.com/watch?v=1Z0wZ7k-gwc',label:'CBS Evening News: the rollout (2:07)'},{type:'article',url:'https://www.nrn.com/quick-service/taco-bell-s-drive-thru-voice-ai-expands-to-nearly-900-restaurants',label:'NRN: expansion to nearly 900 restaurants'}], tags:['pilot','speech AI','segmentation'], source:'Nation’s Restaurant News · Taco Bell’s voice AI expands to nearly 900 restaurants', sourceUrl:'https://www.nrn.com/quick-service/taco-bell-s-drive-thru-voice-ai-expands-to-nearly-900-restaurants', color:'lime' },
];

const weeks = [
  ['01','Foundations'],['02','Directing AI agents'],['03','Prepare & verify'],['04','Interpret statistics'],['05–06','GA4 & web metrics'],['08–09','Visualise in Data Studio'],['10','Tell the data story'],['11','Agentic workflows'],['12','Forecast honestly'],['13','Recommend & pitch'],
];

export default function Home() {
  const [topic, setTopic] = useState('All topics');
  const [learningRole, setLearningRole] = useState<LearningRoleFilter>('All paths');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [publishedOverrides, setPublishedOverrides] = useState<Record<string, CaseOverride>>({});
  const [draftOverrides, setDraftOverrides] = useState<Record<string, CaseOverride>>({});

  useEffect(() => {
    const openCaseFromHash = () => {
      const match = window.location.hash.match(/^#case\/([a-z0-9-]+)$/i);
      if (!match) return;
      const key = retiredCaseIds[match[1].toLowerCase()] ?? match[1].toLowerCase();
      const found = /^\d+$/.test(key) ? cases[Number(key) - 1] : cases.find((item) => item.id === key);
      if (found) setSelectedId(found.id);
    };
    openCaseFromHash();
    window.addEventListener('hashchange', openCaseFromHash);
    return () => window.removeEventListener('hashchange', openCaseFromHash);
  }, []);

  useEffect(() => {
    const loadAdminState = window.setTimeout(() => {
      setAdmin(new URLSearchParams(window.location.search).has('admin'));
      try {
        setDraftOverrides(JSON.parse(localStorage.getItem(overridesStorageKey) ?? '{}') as Record<string, CaseOverride>);
      } catch { /* drafts unavailable in this browser */ }
    }, 0);
    fetch('/case-overrides.json')
      .then((response) => response.ok ? response.json() : {})
      .then((data) => setPublishedOverrides(data as Record<string, CaseOverride>))
      .catch(() => { /* no published overrides file */ });
    return () => window.clearTimeout(loadAdminState);
  }, []);

  const allCases = useMemo(() => cases.map((item) => applyOverride(applyOverride(item, publishedOverrides[item.id]), draftOverrides[item.id])), [publishedOverrides, draftOverrides]);
  const selected = selectedId ? allCases.find((item) => item.id === selectedId) ?? null : null;

  const saveDraftOverride = (id: string, override: CaseOverride | null) => {
    setDraftOverrides((current) => {
      const next = { ...current };
      if (override && Object.keys(override).length > 0) next[id] = override; else delete next[id];
      try { localStorage.setItem(overridesStorageKey, JSON.stringify(next)); } catch { /* edits stay in memory for this visit */ }
      return next;
    });
  };

  const exportOverrides = () => {
    const merged: Record<string, CaseOverride> = { ...publishedOverrides };
    for (const [id, override] of Object.entries(draftOverrides)) merged[id] = { ...merged[id], ...override };
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'case-overrides.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importOverrides = (file: File) => {
    file.text().then((text) => {
      const parsed = JSON.parse(text) as Record<string, CaseOverride>;
      setDraftOverrides(parsed);
      try { localStorage.setItem(overridesStorageKey, JSON.stringify(parsed)); } catch { /* edits stay in memory */ }
    }).catch(() => window.alert('Could not read that file as a case-overrides JSON.'));
  };

  const openCase = (item: CaseStudy) => {
    setSelectedId(item.id);
    history.replaceState(null, '', `#case/${item.id}`);
  };
  const closeCase = () => {
    setSelectedId(null);
    if (window.location.hash.startsWith('#case/')) history.replaceState(null, '', '#casebook');
  };

  const filtered = useMemo(() => allCases.filter((item) => {
    const topicMatch = topic === 'All topics' || item.topic === topic;
    const roleMatch = learningRole === 'All paths' || getLearningRole(item) === learningRole;
    const searchMatch = `${item.title} ${item.setting} ${item.context ?? ''} ${item.evidence ?? ''} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return topicMatch && roleMatch && searchMatch;
  }), [allCases, topic, learningRole, search]);

  const comparisonCases = compareIds.map((id) => allCases.find((item) => item.id === id)).filter((item): item is CaseStudy => Boolean(item));
  const toggleCompare = (id: string) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);

  return (
    <main id="top">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Evidence Lab home"><span className="brandMark">E/L</span><span>Evidence Lab</span></a>
        <span className="courseCode">CDM2002 · AY 2026/27</span>
        <div className="navActions"><a href="#casebook">Casebook</a><a href="#path">Course path</a><a href="#challenge">Challenge</a></div>
      </nav>

      {admin && <aside className="adminBar" aria-label="Admin tools">
        <strong>ADMIN</strong>
        <span>{Object.keys(draftOverrides).length} case{Object.keys(draftOverrides).length === 1 ? '' : 's'} with draft edits · drafts save to this browser only — export and commit <code>public/case-overrides.json</code> to publish for students</span>
        <button onClick={exportOverrides}>Export overrides</button>
        <label className="adminImport">Import<input type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importOverrides(file); event.target.value = ''; }} /></label>
        <button onClick={() => { if (window.confirm('Discard all draft edits saved in this browser?')) { setDraftOverrides({}); try { localStorage.removeItem(overridesStorageKey); } catch { /* nothing to clear */ } } }}>Clear drafts</button>
      </aside>}

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow"><span /> DATA ANALYTICS &amp; VISUALISATION</p>
          <h1>Don’t just read<br />the chart. <em>Question it.</em></h1>
          <p className="lede">Build the idea, spot the pattern, then apply it to current data decisions hiding in campaigns, dashboards, queues, clicks and everyday life.</p>
          <a className="primaryButton" href="#casebook">Open the evidence lab <span>↘</span></a>
          <div className="heroStats"><span><strong>{cases.length}</strong> cases &amp; scenarios</span><span><strong>9</strong> course topics</span><span><strong>1</strong> rule: verify</span></div>
        </div>
        <div className="heroVisual" aria-label="A bar chart with a misleading truncated axis">
          <div className="chartNote">Looks convincing.<br /><strong>Is it true?</strong></div>
          <div className="plot"><span className="plotLabel plotLabelA">78%</span><span className="plotLabel plotLabelB">62%</span><span className="plotLabel plotLabelC">45%</span><div className="bar barA" /><div className="bar barB" /><div className="bar barC" /></div>
          <div className="scribble">axis starts at 40!</div><div className="dataBadge">DATA ≠ TRUTH</div>
        </div>
      </section>

      <section className="ticker" aria-label="Course themes"><div>COLLECT <span>◆</span> CLEAN <span>◆</span> QUESTION <span>◆</span> VISUALISE <span>◆</span> DECIDE <span>◆</span> VERIFY THE AGENT <span>◆</span> COLLECT <span>◆</span> CLEAN <span>◆</span></div></section>

      <section className="casebook" id="casebook">
        <div className="sectionIntro"><p className="eyebrow dark"><span /> THE CASEBOOK</p><h2>Real cases.<br />Honest limits.</h2><p>Documented cases, data-backed illustrations and worked scenarios are labelled separately—so the evidence never claims more than its source.</p></div>
        <div className="learningGuide" aria-label="Guided learning paths">
          <button onClick={() => { setLearningRole('Foundational'); setTopic('All topics'); setSearch(''); }}><span>01 · BUILD THE IDEA</span><strong>Foundational</strong><p>Landmark examples that make a core analytical principle visible and memorable.</p><em>{cases.filter((item) => getLearningRole(item) === 'Foundational').length} cases →</em></button>
          <button onClick={() => { setLearningRole('Transfer'); setTopic('All topics'); setSearch(''); }}><span>02 · SPOT THE PATTERN</span><strong>Transfer</strong><p>Different settings that reveal the same recurring problem, trap or decision structure.</p><em>{cases.filter((item) => getLearningRole(item) === 'Transfer').length} cases →</em></button>
          <button onClick={() => { setLearningRole('Current practice'); setTopic('All topics'); setSearch(''); }}><span>03 · APPLY IT NOW</span><strong>Current practice</strong><p>Recent, verified cases for testing the principle against today’s technologies and constraints.</p><em>{cases.filter((item) => getLearningRole(item) === 'Current practice').length} cases · 2024–26 →</em></button>
        </div>
        <div className="filterBar">
          <label className="searchBox"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases, settings or skills…" aria-label="Search cases" /></label>
          <label className="topicSelect"><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="learningFilters" aria-label="Filter by learning purpose">
          <span>Learning purpose</span>
          {learningRoles.map((item) => <button key={item} className={learningRole === item ? 'active' : ''} onClick={() => setLearningRole(item)} aria-pressed={learningRole === item}>{item === 'Current practice' ? 'Current practice · 2024–2026' : item}</button>)}
        </div>
        <div className="topicChips" aria-label="Filter by topic">{topics.map((item) => <button key={item} className={topic === item ? 'active' : ''} onClick={() => setTopic(item)} aria-pressed={topic === item}>{item}</button>)}</div>
        <p className="resultCount">Showing {filtered.length} of {cases.length} cases · {learningRole === 'All paths' ? 'all learning paths' : learningRole}</p>
        {comparisonCases.length > 0 && <aside className="compareTray" aria-label="Cases selected for comparison">
          <div><span>CONTRASTING CASES · {comparisonCases.length}/2</span>{comparisonCases.map((item) => <button key={item.id} onClick={() => toggleCompare(item.id)} aria-label={`Remove ${item.title} from comparison`}>{item.title} ×</button>)}</div>
          <div><button className="clearCompare" onClick={() => setCompareIds([])}>Clear</button><button className="openCompare" disabled={comparisonCases.length !== 2} onClick={() => setComparisonOpen(true)}>Compare the evidence ↗</button></div>
        </aside>}
        <div className="caseGrid">
          {filtered.map((item) => <CaseCard key={item.id} item={item} index={cases.findIndex((entry) => entry.id === item.id)} onOpen={() => openCase(item)} compareSelected={compareIds.includes(item.id)} compareDisabled={compareIds.length === 2 && !compareIds.includes(item.id)} onCompare={() => toggleCompare(item.id)} />)}
        </div>
        {filtered.length === 0 && <div className="emptyState"><strong>No evidence found.</strong><p>Try another keyword or reset the filters.</p><button onClick={() => { setTopic('All topics'); setLearningRole('All paths'); setSearch(''); }}>Reset the lab</button></div>}
      </section>

      <section className="path" id="path">
        <div className="pathHeading"><p className="eyebrow"><span /> YOUR COURSE PATH</p><h2>From raw data<br />to responsible action.</h2><p>Each stop adds a new question. The red thread never changes: what did the agent do, and how do you know it is right?</p></div>
        <div className="weekRail">{weeks.map(([number,label], index) => <a key={number} href="#casebook" onClick={() => { setTopic(topicForWeek(index)); setLearningRole('All paths'); setSearch(''); }}><span>{number}</span><strong>{label}</strong><i>{index === weeks.length - 1 ? 'Pitch it' : 'Explore'}</i></a>)}</div>
      </section>

      <section className="challenge" id="challenge">
        <div className="challengeCard">
          <p className="eyebrow dark"><span /> 60-SECOND CHALLENGE</p>
          <h2>Which statement<br />is best supported?</h2>
          <p className="experimentContext">Visitors were randomly assigned once during the same seven-day period. Tracking passed QA. The primary metric was account creation within 24 hours.</p>
          <div className="experiment"><div><strong>A</strong><span>80 / 2,010 signed up</span><em>3.98%</em></div><div><strong>B</strong><span>87 / 1,980 signed up</span><em>4.39%</em></div></div>
          <p className="experimentRule"><strong>Decision rule:</strong> ship only if the 95% interval is entirely above +0.5 percentage points and guardrails hold.</p>
          <div className="answers">
            {[
              ['A','B caused a reliable 10.4% lift.'],
              ['B','B is the clear winner and should ship.'],
              ['C','In this sample, B was 0.41 points higher; the experiment is inconclusive.'],
            ].map(([letter,label]) => <button key={letter} className={quizAnswer === letter ? 'chosen' : ''} onClick={() => setQuizAnswer(letter)}><span>{letter}</span>{label}</button>)}
          </div>
          {quizAnswer && <div className={quizAnswer === 'C' ? 'feedback correct' : 'feedback'} role="status"><strong>{quizAnswer === 'C' ? 'Best supported.' : 'Too confident.'}</strong><p>{quizAnswer === 'C' ? 'B is +0.41 percentage points (+10.4% relative), but an approximate 95% interval runs from −0.83 to +1.66 points (p ≈ .51). The result does not meet the stated shipping rule.' : 'The observed relative difference is 10.4%, but the estimate is imprecise. This experiment does not establish a reliable effect or meet the stated shipping rule.'}</p></div>}
        </div>
        <aside className="fieldRule"><span>FIELD RULE 04</span><blockquote>“An honest chart shows what you know—and leaves room for what you don’t.”</blockquote><p>Before you recommend: name the decision, denominator, uncertainty, trade-off and accountable human.</p></aside>
      </section>

      <section className="agentChecklist" id="lab">
        <div><p className="eyebrow"><span /> SUPERVISE THE PIPELINE</p><h2>Trust is a workflow,<br />not a feeling.</h2></div>
        <ol><li><span>01</span><strong>Scope</strong><p>Bound the goal, data, tools and authority.</p></li><li><span>02</span><strong>Observe</strong><p>Keep intermediate steps, logs and source links.</p></li><li><span>03</span><strong>Verify</strong><p>Reconcile rows, totals, assumptions and charts.</p></li><li><span>04</span><strong>Decide</strong><p>A human owns the action and disclosure.</p></li></ol>
      </section>

      <footer><div className="brand"><span className="brandMark">E/L</span><span>Evidence Lab</span></div><p>CDM2002 · Data Analytics and Visualisation<br />Trimester 1, AY 2026/27</p><a href="#top">Back to top ↑</a></footer>

      {selected && <CaseDrawer key={selected.id} item={selected} caseNumber={cases.findIndex((entry) => entry.id === selected.id) + 1} admin={admin} draftEdited={Boolean(draftOverrides[selected.id])} baseItem={applyOverride(cases.find((entry) => entry.id === selected.id) as CaseStudy, publishedOverrides[selected.id])} onSaveOverride={(override) => saveDraftOverride(selected.id, override)} onClose={closeCase} />}
      {comparisonOpen && comparisonCases.length === 2 && <CompareDrawer items={[comparisonCases[0], comparisonCases[1]]} onClose={() => setComparisonOpen(false)} />}
    </main>
  );
}

function CaseCard({ item, index, onOpen, compareSelected, compareDisabled, onCompare }: { item: CaseStudy; index: number; onOpen: () => void; compareSelected: boolean; compareDisabled: boolean; onCompare: () => void }) {
  return <article className={`caseCard ${item.color}`}>
    <div className="cardTop"><span>{String(index + 1).padStart(2,'0')}</span><div><em className={`roleBadge ${getLearningRole(item).toLowerCase().replace(' ','-')}`}>{getLearningRole(item) === 'Current practice' ? 'Current · 2024–26' : getLearningRole(item)}</em><span>{item.week}</span></div></div>
    <div className="cardVisual"><CaseVisual item={item} type={index % 5} compact /></div>
    <p className="cardTopic">{getCaseKind(item)} · {item.topic}</p><h3>{item.title}</h3><p className="cardSetting">{item.setting}</p>
    {item.update && <p className="cardUpdate">Updated {item.update.date}</p>}
    <div className="tagRow">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="cardActions"><button className="compareToggle" onClick={onCompare} disabled={compareDisabled} aria-pressed={compareSelected} aria-label={`${compareSelected ? 'Remove' : 'Add'} ${item.title} ${compareSelected ? 'from' : 'to'} comparison`}>{compareSelected ? 'Selected ✓' : 'Compare'}</button><button className="inspectButton" onClick={onOpen} aria-label={`Inspect ${item.title}`}>Inspect the evidence <span>↗</span></button></div>
  </article>;
}

function Visual({ type }: { type: number }) {
  if (type === 0) return <div className="dotMap">{Array.from({length:18},(_,i) => <i key={i} />)}<b>×</b></div>;
  if (type === 1) return <div className="bars"><i /><i /><i /><i /></div>;
  if (type === 2) return <div className="lineViz"><i /><b>?</b></div>;
  if (type === 3) return <div className="funnelViz"><i /><i /><i /></div>;
  return <div className="tableViz"><i /><i /><i /><i /><i /><i /></div>;
}

function CaseDrawer({ item, caseNumber, admin, draftEdited, baseItem, onSaveOverride, onClose }: { item: CaseStudy; caseNumber: number; admin: boolean; draftEdited: boolean; baseItem: CaseStudy; onSaveOverride: (override: CaseOverride | null) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const copyCaseLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#case/${item.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this case link:', link);
    }
  };

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (editing) { setEditing(false); return; }
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, summary, [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, editing]);

  return <div className="drawerBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article ref={dialogRef} className={`caseDrawer ${item.color}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button ref={closeRef} className="drawerClose" onClick={onClose} aria-label="Close case">×</button>
      <p className="caseKicker">CASE {String(caseNumber).padStart(2,'0')} · {getCaseKind(item).toUpperCase()} · {getLearningRole(item).toUpperCase()} · {item.week} · {item.topic}{admin && draftEdited ? ' · DRAFT EDITED' : ''}</p><h2 id="drawer-title">{item.title}</h2><p className="drawerSetting">{item.setting}</p>
      {(getCaseKind(item) === 'Data-backed illustration' || (item.resources && item.resources.length > 0)) && <div className="resourceRow" aria-label="Additional resources">
        {getCaseKind(item) === 'Data-backed illustration' && <a className="resourceChip dataset" href={item.sourceUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">DATA</span>Open the linked dataset</a>}
        {item.resources?.map((resource) => <a key={resource.url} className={`resourceChip ${resource.type}`} href={resource.url} target="_blank" rel="noreferrer"><span aria-hidden="true">{resourceIcons[resource.type]}</span>{resource.label || resourceFallbackLabels[resource.type]}</a>)}
      </div>}
      {admin && <div className="adminDrawerTools">
        <button onClick={() => setEditing((current) => !current)}>{editing ? 'Close editor' : '✎ Edit this case'}</button>
        {draftEdited && <button onClick={() => { if (window.confirm('Reset this case to its published content?')) { onSaveOverride(null); setEditing(false); } }}>Reset draft</button>}
      </div>}
      {editing && <CaseEditor item={item} baseItem={baseItem} onSave={(override) => { onSaveOverride(override); setEditing(false); }} />}
      {(diagramAssets[item.id] || recreatedIds.has(item.id)) && <EvidenceFigure item={item} />}
      {item.keyNumbers && <div className="keyNumbers">{item.keyNumbers.map((number) => <div key={`${number.value}-${number.label}`}><strong>{number.value}</strong><span>{number.label}</span></div>)}</div>}
      <div className="drawerSections">
        {item.context && <section><span>CASE CONTEXT</span><p>{item.context}</p></section>}
        <section className="evidenceStatus"><span>EVIDENCE STATUS{item.sourceClass ? ` · ${item.sourceClass.toUpperCase()}` : ''}</span><p>{getEvidenceStatus(item)}</p></section>
        <section><span>{item.evidence ? 'WHAT THE EVIDENCE SHOWS' : 'TEACHING CLAIM'}</span><p>{item.evidence ?? item.takeaway}</p></section>
        {item.evidence && <section className="lesson"><span>WHY IT BELONGS IN THIS COURSE</span><p>{item.takeaway}</p></section>}
        <section><span>THE ANALYTICAL TRAP</span><p>{item.trap}</p></section>
        {item.decision && <section><span>THE DECISION STAKE</span><p>{item.decision}</p></section>}
        {item.update && <section className="update"><span>SINCE THEN · UPDATED {item.update.date.toUpperCase()}</span><p>{item.update.summary}</p>{item.update.keyNumbers && <div className="updateNumbers">{item.update.keyNumbers.map((number) => <div key={`${number.value}-${number.label}`}><strong>{number.value}</strong><span>{number.label}</span></div>)}</div>}<a className="updateSource" href={item.update.sourceUrl} target="_blank" rel="noreferrer">Update source: {item.update.source} <span aria-hidden="true">↗</span></a></section>}
        <section className="question"><span>YOUR TURN</span><h3>{item.question}</h3><details><summary>Reveal one defensible response</summary><p>{item.answer}</p></details></section>
      </div>
      <a className="sourceLink" href={item.sourceUrl} target={item.sourceUrl.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{getCaseKind(item) === 'Worked scenario' ? 'Method / further reading' : 'Source / further reading'}: {item.source} <span>↗</span></a>
      <button className="copyCaseLink" onClick={copyCaseLink} aria-live="polite">{copied ? 'Link copied ✓' : `Copy link to this case (#case/${item.id})`}</button>
      <CaseNotebook caseId={item.id} title={item.title} />
    </article>
  </div>;
}

const editorFieldMeta: { field: EditableField; label: string; multiline: boolean; hint?: string }[] = [
  { field:'title', label:'Title', multiline:false },
  { field:'setting', label:'Setting', multiline:false },
  { field:'context', label:'Case context', multiline:true, hint:'Optional — leave empty to hide the section' },
  { field:'evidence', label:'Evidence statement', multiline:true, hint:'Optional — keep it narrow and source-supported; empty switches the drawer to “Teaching claim”' },
  { field:'takeaway', label:'Takeaway (why it belongs in the course)', multiline:true },
  { field:'trap', label:'Analytical trap', multiline:true },
  { field:'decision', label:'Decision stake', multiline:true, hint:'Optional' },
  { field:'question', label:'Question (Your turn)', multiline:false },
  { field:'answer', label:'Defensible response', multiline:true },
  { field:'source', label:'Source label', multiline:false },
  { field:'sourceUrl', label:'Source URL', multiline:false },
];

function CaseEditor({ item, baseItem, onSave }: { item: CaseStudy; baseItem: CaseStudy; onSave: (override: CaseOverride | null) => void }) {
  const readField = (source: CaseStudy, field: EditableField) => (source as unknown as Record<EditableField, string | undefined>)[field] ?? '';
  const [values, setValues] = useState<Record<EditableField, string>>(() => Object.fromEntries(editableFields.map((field) => [field, readField(item, field)])) as Record<EditableField, string>);
  const [resources, setResources] = useState<CaseResource[]>(item.resources ?? []);

  const updateResource = (index: number, patch: Partial<CaseResource>) => setResources((current) => current.map((resource, position) => position === index ? { ...resource, ...patch } : resource));

  const save = () => {
    const override: CaseOverride = {};
    for (const field of editableFields) {
      const value = values[field].trim();
      const baseValue = readField(baseItem, field);
      if (value === baseValue) continue;
      if (value === '' && !optionalFields.has(field)) continue;
      override[field] = value;
    }
    const cleanResources = resources.map((resource) => ({ type: resource.type, url: resource.url.trim(), ...(resource.label?.trim() ? { label: resource.label.trim() } : {}) })).filter((resource) => resource.url);
    if (JSON.stringify(cleanResources) !== JSON.stringify(baseItem.resources ?? [])) override.resources = cleanResources;
    onSave(Object.keys(override).length > 0 ? override : null);
  };

  return <div className="caseEditor">
    <p className="editorNote">Edits save as a draft in this browser. Use the admin bar to export <code>case-overrides.json</code>; committing that file to <code>public/</code> publishes the edits for everyone.</p>
    {editorFieldMeta.map(({ field, label, multiline, hint }) => <label key={field} className="editorField">
      <span>{label}{hint ? <em> · {hint}</em> : null}</span>
      {multiline
        ? <textarea rows={3} value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} />
        : <input value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} />}
    </label>)}
    <div className="editorResources">
      <span>ADDITIONAL RESOURCES · video, PDF or article links shown under the setting</span>
      {resources.map((resource, index) => <div key={index} className="editorResourceRow">
        <input placeholder="https://…" value={resource.url} onChange={(event) => updateResource(index, { url: event.target.value, type: detectResourceType(event.target.value) })} aria-label="Resource URL" />
        <select value={resource.type} onChange={(event) => updateResource(index, { type: event.target.value as CaseResource['type'] })} aria-label="Resource type">
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="article">Website / article</option>
        </select>
        <input placeholder="Label (optional)" value={resource.label ?? ''} onChange={(event) => updateResource(index, { label: event.target.value })} aria-label="Resource label" />
        <button onClick={() => setResources((current) => current.filter((_, position) => position !== index))} aria-label="Remove this resource">×</button>
      </div>)}
      <button className="editorAddResource" onClick={() => setResources((current) => [...current, { type: 'article', url: '', label: '' }])}>+ Add link</button>
    </div>
    <div className="editorActions"><button className="editorSave" onClick={save}>Save draft</button></div>
  </div>;
}

function CaseNotebook({ caseId, title }: { caseId: string; title: string }) {
  const [notes, setNotes] = useState<CaseNotes>(emptyNotes);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadNotes = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(notesStorageKey) ?? '{}') as Record<string, Partial<CaseNotes>>;
        setNotes({ ...emptyNotes, ...saved[caseId] });
      } catch {
        setNotes(emptyNotes);
      } finally {
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(loadNotes);
  }, [caseId]);

  useEffect(() => {
    if (!loaded) return;
    try {
      const saved = JSON.parse(localStorage.getItem(notesStorageKey) ?? '{}') as Record<string, CaseNotes>;
      localStorage.setItem(notesStorageKey, JSON.stringify({ ...saved, [caseId]: notes }));
    } catch {
      // Notes remain available in the current drawer if browser storage is unavailable.
    }
  }, [caseId, loaded, notes]);

  const fields: { key: keyof CaseNotes; label: string; prompt: string }[] = [
    { key:'fact', label:'Fact', prompt:'What is directly supported by the source?' },
    { key:'inference', label:'Inference', prompt:'What does the evidence reasonably suggest?' },
    { key:'hypothesis', label:'Hypothesis', prompt:'What would you test or verify next?' },
  ];

  return <section className="caseNotebook" aria-labelledby={`notebook-${caseId}`}>
    <div className="notebookHeading"><div><span>CASE NOTEBOOK</span><h3 id={`notebook-${caseId}`}>Separate the claim.</h3></div><em aria-live="polite">{loaded ? 'Saved on this device' : 'Loading notes…'}</em></div>
    <p>Write one statement in each box for “{title}”. Facts are source-supported; inferences interpret; hypotheses propose the next test.</p>
    <div className="notebookGrid">{fields.map((field) => <label key={field.key}><strong>{field.label}</strong><span>{field.prompt}</span><textarea value={notes[field.key]} onChange={(event) => setNotes((current) => ({ ...current, [field.key]: event.target.value }))} rows={5} placeholder="Write a concise statement…" /></label>)}</div>
  </section>;
}

function CompareDrawer({ items, onClose }: { items: [CaseStudy, CaseStudy]; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [left, right] = items;
  const rows = [
    ['Learning purpose', getLearningRole(left), getLearningRole(right)],
    ['Evidence claim', left.evidence ?? left.takeaway, right.evidence ?? right.takeaway],
    ['Analytical trap', left.trap, right.trap],
    ['Decision stake', left.decision ?? 'Use the teaching prompt to define the decision before acting.', right.decision ?? 'Use the teaching prompt to define the decision before acting.'],
    ['Transferable lesson', left.takeaway, right.takeaway],
    ['Evidence boundary', getEvidenceStatus(left), getEvidenceStatus(right)],
    ['Since then', left.update ? `${left.update.date}: ${left.update.summary}` : 'No later update recorded.', right.update ? `${right.update.date}: ${right.update.summary}` : 'No later update recorded.'],
  ];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [onClose]);

  return <div className="drawerBackdrop compareBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article ref={dialogRef} className="compareDrawer" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <button ref={closeRef} className="drawerClose" onClick={onClose} aria-label="Close comparison">×</button>
      <p className="caseKicker">CONTRASTING CASES · FIND THE SHARED STRUCTURE</p><h2 id="compare-title">Compare the evidence,<br />not the headlines.</h2>
      <div className="compareHeaders"><div><span>CASE A · {left.week}</span><h3>{left.title}</h3><p>{left.setting}</p></div><div><span>CASE B · {right.week}</span><h3>{right.title}</h3><p>{right.setting}</p></div></div>
      <div className="compareMatrix">{rows.map(([label, leftValue, rightValue]) => <section key={label}><h4>{label}</h4><p>{leftValue}</p><p>{rightValue}</p></section>)}</div>
      <div className="compareSources"><a href={left.sourceUrl} target="_blank" rel="noreferrer">A source: {left.source} ↗</a><a href={right.sourceUrl} target="_blank" rel="noreferrer">B source: {right.source} ↗</a></div>
      <aside className="comparePrompt"><span>TRANSFER PROMPT</span><strong>What principle survives when the organisation, technology and stakes change?</strong></aside>
    </article>
  </div>;
}

function EvidenceFigure({ item }: { item: CaseStudy }) {
  const original = diagramAssets[item.id];
  const dataFaithful = dataFaithfulIds.has(item.id);
  return <figure className="evidenceFigure">
    <div className="evidenceCanvas"><CaseVisual item={item} type={visualIndex(item.id)} /></div>
    <figcaption>
      <span>{original ? 'ORIGINAL SOURCE IMAGE' : dataFaithful ? 'DATA-FAITHFUL RECREATION' : 'SOURCE-BASED SCHEMATIC'}</span>
      {original ? <a href={original.creditUrl} target="_blank" rel="noreferrer">{original.credit} · {original.license} ↗</a> : <a href={item.sourceUrl} target="_blank" rel="noreferrer">{dataFaithful ? 'Recreated from values in the cited source' : 'Teaching schematic derived from the cited source'} ↗</a>}
      {item.id === 'challenger' && <small>Source record shown; the prompt asks learners to design the missing temperature-by-damage decision plot.</small>}
    </figcaption>
  </figure>;
}

function CaseVisual({ item, type, compact = false }: { item: CaseStudy; type: number; compact?: boolean }) {
  const original = diagramAssets[item.id];
  if (original) return <div className={`originalDiagram ${compact ? 'compact' : ''}`}><img src={original.src} alt={compact ? '' : original.alt} /><span>Original · {original.license}</span></div>;
  if (recreatedIds.has(item.id)) return <RecreatedDiagram id={item.id} compact={compact} />;
  return <div aria-hidden="true"><Visual type={type} /></div>;
}

function RecreatedDiagram({ id, compact }: { id: string; compact: boolean }) {
  if (id === 'anscombe') return <AnscombeDiagram compact={compact} />;
  if (id === 'berkeley') return <div className="reDiagram berkeleyDiagram"><span>AGGREGATE → DEPARTMENT VIEW</span><div className="aggregateBars"><p><i style={{width:'44%'}} /><b>Men 44%</b></p><p><i style={{width:'35%'}} /><b>Women 35%</b></p></div><div className="departmentRates">{[['A','62','82'],['B','63','68'],['C','37','34'],['D','33','35'],['E','28','24'],['F','6','7']].map(([dept,men,women]) => <p key={dept}><b>{dept}</b><span>M {men}%</span><span>W {women}%</span></p>)}</div><strong>Women’s rate is higher in 4 of 6 departments</strong><em>Exact rates</em></div>;
  if (id === 'digest') return <div className="reDiagram digestDiagram"><span>1936: FORECAST VS RESULT</span><div className="pollRows"><p><b>DIGEST</b><i style={{width:'57%'}}>L 57</i><i style={{width:'43%'}}>R 43</i></p><p><b>ACTUAL*</b><i style={{width:'38%'}}>L 38</i><i style={{width:'62%'}}>R 62</i></p></div><strong>*Two-party vote, rounded · 2.4m replies still failed</strong><em>Recreated</em></div>;
  if (id === 'google-flu') return <div className="reDiagram fluDiagram"><span>US FLU ACTIVITY · 2012–13 PEAK</span><div className="fluGrid"><b className="yLabel">RELATIVE ACTIVITY ↑</b><i className="actual" /><i className="estimate" /><b className="xLabel">TIME →</b></div><p><b>CDC baseline</b><b>GFT estimate ≈ 2×</b></p><em>Recreated</em></div>;
  if (id === 'netflix-art') return <div className="reDiagram netflixDiagram"><span>SAME TITLE · DIFFERENT ART</span><div><i>A</i><i>B</i><i>C</i></div><strong>Randomise member → measure downstream</strong><em>Concept recreation</em></div>;
  if (id === 'axis') return <div className="reDiagram axisDiagram"><span>TRUST SCORE</span><div><i style={{height:'74%'}}>81</i><i style={{height:'43%'}}>78</i></div><strong>Axis begins at 77</strong><em>Recreated</em></div>;
  if (id === 'funnel') return <div className="reDiagram funnelDiagram"><span>CAMPAIGN FUNNEL</span><i>12,400 visits</i><i>3,170 carts</i><i>294 sales</i><strong>Clicks rose · sales fell</strong><em>Recreated</em></div>;
  if (id === 'cloudflare') return <div className="reDiagram pipelineDiagram"><span>CONFIG PIPELINE</span><div><i>Rows ×2</i><b>→</b><i className="danger">200+ features</i><b>→</b><i>Outage</i></div><strong>Missing: row-count check + size guard before propagation</strong><em>Recreated</em></div>;
  if (id === 'ai-overviews') return <div className="reDiagram overviewDiagram"><span>CORRECT VS GROUNDED</span><div><i>91% correct</i><b>vs</b><i className="danger">67% supported</i></div><strong>A right answer is not a supported answer</strong><em>Recreated</em></div>;
  if (id === 'simplygo') return <div className="reDiagram simplygoDiagram"><span>FARE-GATE MOMENT</span><div><b>$?.??</b><i>BALANCE NOT SHOWN</i></div><strong>One missing glance changed trust</strong><em>Recreated</em></div>;
  if (id === 'mycity') return <div className="reDiagram latencyDiagram"><span>P90 RESPONSE TIME</span><div><i style={{width:'78%'}}>12.4s</i><i style={{width:'100%'}}>16.2s</i></div><strong>Correctness × latency × recourse</strong><em>Recreated</em></div>;
  if (id === 'zillow') return <div className="reDiagram zillowDiagram"><span>UNIT ECONOMICS</span><div><i>Q2</i><b>1,200 bps swing</b><i>Q4</i></div><strong>Forecast error became inventory risk</strong><em>Recreated</em></div>;
  if (id === 'ai-verify') return <div className="reDiagram assuranceDiagram"><span>ASSURANCE WORKFLOW</span><div><i>Use</i><b>→</b><i>Risk</i><b>→</b><i>Test</i><b>→</b><i>Log</i><b>→</b><i className="owner">Owner</i></div><strong>A passed test is evidence—not blanket certification</strong><em>Teaching schematic</em></div>;
  if (id === 'genai-catalog') return <div className="reDiagram catalogDiagram"><span>VENDOR EVIDENCE AUDIT</span><div><b>1,302</b><i>selected examples</i><strong>÷ ?</strong><i>population denominator</i></div><strong>Many stories ≠ a representative success rate</strong><em>Source critique</em></div>;
  return null;
}

const anscombeData = [
  [[10,8.04],[8,6.95],[13,7.58],[9,8.81],[11,8.33],[14,9.96],[6,7.24],[4,4.26],[12,10.84],[7,4.82],[5,5.68]],
  [[10,9.14],[8,8.14],[13,8.74],[9,8.77],[11,9.26],[14,8.10],[6,6.13],[4,3.10],[12,9.13],[7,7.26],[5,4.74]],
  [[10,7.46],[8,6.77],[13,12.74],[9,7.11],[11,7.81],[14,8.84],[6,6.08],[4,5.39],[12,8.15],[7,6.42],[5,5.73]],
  [[8,6.58],[8,5.76],[8,7.71],[8,8.84],[8,8.47],[8,7.04],[8,5.25],[19,12.50],[8,5.56],[8,7.91],[8,6.89]],
];

function AnscombeDiagram({ compact }: { compact: boolean }) {
  return <div className={`reDiagram anscombeDiagram ${compact ? 'compact' : ''}`}><span>SAME SUMMARY · FOUR SHAPES</span><div>{anscombeData.map((series, index) => <section key={index}>{series.map(([x,y], point) => <i key={point} style={{left:`${((x-3)/17)*100}%`,bottom:`${((y-2)/12)*100}%`}} />)}</section>)}</div><strong>Mean ≈ 7.5 · correlation ≈ .82</strong><em>Exact-data recreation</em></div>;
}

function topicForWeek(index: number) {
  return ['Foundations','AI agents','Data preparation','Statistical interpretation','Web analytics','Visualisation','Data stories','AI agents','Forecasting','Campaign decisions'][index];
}

function getLearningRole(item: CaseStudy): Exclude<LearningRoleFilter, 'All paths'> {
  if (item.learningRole) return item.learningRole;
  if (foundationalIds.has(item.id)) return 'Foundational';
  if (currentPracticeIds.has(item.id)) return 'Current practice';
  return 'Transfer';
}

function getCaseKind(item: CaseStudy) {
  if (workedScenarioIds.has(item.id)) return 'Worked scenario';
  if (dataIllustrationIds.has(item.id)) return 'Data-backed illustration';
  return 'Documented case';
}

function getEvidenceStatus(item: CaseStudy) {
  const kind = getCaseKind(item);
  if (kind === 'Worked scenario') return 'Illustrative teaching scenario. Treat its figures and decisions as pedagogical unless the card explicitly identifies an observed source value.';
  if (kind === 'Data-backed illustration') return 'The linked dataset supports the setting. Reproduce the relevant slice before making a numerical or causal claim.';
  if (item.evidence) return 'Documented case with a case-specific source. The record supports the evidence statement; the takeaway remains an analytical interpretation.';
  return 'Documented case with a linked source. The statement below is the course’s teaching interpretation, not a direct quotation or causal finding.';
}

function visualIndex(id: string) {
  return Array.from(id).reduce((total, char) => total + char.charCodeAt(0), 0) % 5;
}
