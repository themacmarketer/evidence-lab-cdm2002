'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CaseStudy = {
  id: string; topic: string; week: string; title: string; setting: string; takeaway: string;
  trap: string; question: string; answer: string; tags: string[]; source: string; sourceUrl: string; color: string;
  learningRole?: 'Foundational' | 'Transfer' | 'Current practice'; context?: string; evidence?: string; decision?: string;
  sourceClass?: 'Institutional source' | 'Vendor source' | 'Independent source';
  keyNumbers?: { value: string; label: string }[];
};

type CaseNotes = { fact: string; inference: string; hypothesis: string };
const emptyNotes: CaseNotes = { fact:'', inference:'', hypothesis:'' };
const notesStorageKey = 'evidence-lab-case-notes-v1';

const topics = ['All topics','Foundations','AI agents','Data preparation','Statistical interpretation','Web analytics','Visualisation','Data stories','Forecasting','Campaign decisions'];
const learningRoles = ['All paths','Foundational','Transfer','Current practice'] as const;
type LearningRoleFilter = typeof learningRoles[number];
const foundationalIds = new Set(['snow','nightingale','berkeley','anscombe','minard','challenger','digest']);
const currentPracticeIds = new Set(['aircanada','agent-boundary','crowdstrike','ai-overviews','simplygo','mycity','netflix-llm-art','mcdonalds-ai']);
type DiagramAsset = { src: string; alt: string; credit: string; creditUrl: string; license: string };
const diagramAssets: Record<string, DiagramAsset> = {
  minard: { src:'/diagrams/minard-original.png', alt:'Charles Minard’s 1869 flow map of Napoleon’s 1812 Russian campaign, showing army size, route and temperature', credit:'Charles Joseph Minard · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Minard.png', license:'Public domain' },
  snow: { src:'/diagrams/snow-original.jpg', alt:'John Snow’s 1854 map marking cholera deaths and water pumps around Broad Street in London', credit:'John Snow · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Snow-cholera-map-1.jpg', license:'Public domain' },
  nightingale: { src:'/diagrams/nightingale-original.jpg', alt:'Florence Nightingale’s polar-area diagrams comparing causes of mortality in the British Army', credit:'Florence Nightingale · Wikimedia Commons', creditUrl:'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg', license:'Public domain' },
  challenger: { src:'/diagrams/challenger-original.jpg', alt:'Morton Thiokol history of O-ring damage in solid rocket motor field joints', credit:'Rogers Commission Report · NASA', creditUrl:'https://www.nasa.gov/history/rogersrep/v5p895.htm', license:'US government work' },
};
const recreatedIds = new Set(['anscombe','berkeley','digest','google-flu','netflix-art','axis','funnel','crowdstrike','ai-overviews','simplygo','mycity','zillow','ai-verify','genai-catalog']);
const dataFaithfulIds = new Set(['anscombe','berkeley','digest','google-flu','mycity']);
const workedScenarioIds = new Set(['agent-boundary','categories','abtest','funnel','attribution','axis','choropleth','museum','shock','benefits','campaign']);
const dataIllustrationIds = new Set(['commute','rainfall']);

const cases: CaseStudy[] = [
  { id:'minard', topic:'Visualisation', week:'W08–09', learningRole:'Foundational', title:'Six variables, one unforgettable map', setting:'Napoleon’s Russian campaign · chart published 1869', context:'Charles Joseph Minard fused geography, army size, direction, distance, time and temperature into a single flow map of the disastrous 1812 campaign.', evidence:'The band begins with roughly 422,000 troops and narrows relentlessly. The returning path is aligned with falling temperatures, letting readers see attrition as a journey rather than a single total.', takeaway:'A visual can explain a system when every encoding serves the same question.', trap:'Calling a dense graphic “good” because it is famous. Its success depends on a focused story and careful reading, not complexity alone.', decision:'A modern analyst must decide what to layer together and what to separate for an audience with less time or context.', question:'Which encoding carries the main argument?', answer:'Width. It makes the loss of people physically dominate the page; geography and temperature explain when and where that loss unfolded.', keyNumbers:[{value:'6',label:'variables integrated'},{value:'1869',label:'publication year'},{value:'1812',label:'campaign depicted'}], tags:['multivariate','flow map','history'], source:'École des Ponts · Minard digital collection', sourceUrl:'https://heritage.ecoledesponts.fr/collections/charles-joseph-minard', color:'lime' },
  { id:'challenger', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'The missing data in the launch decision', setting:'Space Shuttle Challenger · 1986', context:'Engineers were concerned about O-ring performance in unusually cold conditions. The pre-launch communication did not present past damage and temperature as a clear, complete relationship.', evidence:'The Rogers Commission found that limited consideration was given to the history of O-ring damage in relation to temperature, and described a conflict between engineering data and management judgment.', takeaway:'How evidence is selected and framed can be as consequential as the analysis itself.', trap:'Plotting only launches with damage—or presenting scattered technical tables—without showing all prior launches and their temperatures.', decision:'The launch decision required reasoning beyond observed experience because the forecast temperature was below the range of previous launches.', question:'What chart should have been on the decision table?', answer:'Every prior launch plotted by temperature, with damage severity encoded, plus a clear marker showing the forecast launch temperature outside the observed range.', keyNumbers:[{value:'28°F',label:'launch-day temperature'},{value:'51–53°F',label:'previous low range discussed'},{value:'73 sec',label:'flight before breakup'}], tags:['risk','missing data','communication'], source:'NASA · Rogers Commission Report', sourceUrl:'https://www.nasa.gov/history/rogersrep/v1ch5.htm', color:'orange' },
  { id:'digest', topic:'Statistical interpretation', week:'W04', learningRole:'Foundational', title:'Two million answers—and the wrong winner', setting:'Literary Digest election poll · 1936', context:'The magazine mailed millions of ballots using lists such as telephone directories and automobile registrations, then relied on voluntary returns.', evidence:'Later analysis concluded that both the sampling frame and non-response were biased. A huge response count could not repair who was missing or disproportionately motivated to reply.', takeaway:'Sample quality beats sample size when the data does not represent the decision population.', trap:'Teaching the failure as selection bias alone. Research shows non-response bias also materially amplified the miss.', decision:'The analyst must defend how people entered the sample, who did not respond and whether weighting can plausibly repair the gap.', question:'What would you audit before calculating a margin of error?', answer:'Coverage of the sampling frame and the response mechanism. A precise interval around a biased estimate is still confidently wrong.', keyNumbers:[{value:'10m',label:'ballots mailed'},{value:'~2.4m',label:'responses'},{value:'0',label:'guarantee of representativeness'}], tags:['sampling','non-response','polling'], source:'Public Opinion Quarterly · Why the poll failed', sourceUrl:'https://academic.oup.com/poq/article-abstract/52/1/125/1878544', color:'blue' },
  { id:'netflix-art', topic:'Web analytics', week:'W05–06', learningRole:'Transfer', title:'The same film, a different thumbnail', setting:'Netflix artwork personalisation · 2017', context:'A title has many possible images: a face, an ensemble, a landscape, comedy or action. Netflix tests artwork because the image is part of the choice architecture, not decoration.', evidence:'Netflix described moving beyond one globally winning image toward contextual bandits that learn which artwork works for a particular member and viewing context.', takeaway:'Personalisation changes the treatment itself; “the average winner” may not be best for everyone.', trap:'Optimising clicks without watching downstream satisfaction, viewing completion or representation effects.', decision:'Choose a success metric and guardrails before the system learns to exploit attention at the expense of trust.', question:'What is the experimental unit?', answer:'Usually the member, not the impression. Randomising impressions can contaminate learning when the same person sees multiple treatments.', keyNumbers:[{value:'1 title',label:'many possible frames'},{value:'member',label:'experimental unit'},{value:'long-term',label:'guardrail horizon'}], tags:['A/B testing','personalisation','bandits'], source:'Netflix Technology Blog · Artwork Personalization', sourceUrl:'https://medium.com/netflix-techblog/artwork-personalization-c589f074ad76', color:'coral' },
  { id:'google-flu', topic:'Forecasting', week:'W12', learningRole:'Transfer', title:'When search behaviour impersonated disease', setting:'Google Flu Trends · 2008–2014', context:'Google Flu Trends tried to estimate influenza activity faster than clinical reporting by using patterns in search queries.', evidence:'A 2014 Science critique documented persistent over-prediction and “big data hubris”: search behaviour, media attention and platform changes could move even when actual illness did not.', takeaway:'A high-volume proxy is not the phenomenon—and the proxy’s meaning can drift.', trap:'Validating once, then treating the measurement relationship as permanent while the platform changes underneath it.', decision:'Combine timely proxy data with slower ground truth, benchmark against simple models and monitor residuals for drift.', question:'What is the hidden time series in this case?', answer:'The search platform itself. Ranking, autocomplete, media coverage and user habits all change the data-generating process.', keyNumbers:[{value:'2008',label:'public launch'},{value:'2014',label:'landmark critique'},{value:'2×',label:'reported peak overestimate'}], tags:['proxy data','drift','nowcasting'], source:'PubMed · The Parable of Google Flu', sourceUrl:'https://pubmed.ncbi.nlm.nih.gov/24626916/', color:'lime' },
  { id:'cambridge', topic:'Campaign decisions', week:'W13', learningRole:'Transfer', title:'The targeting dataset people never agreed to build', setting:'Cambridge Analytica and Facebook data · 2014–2019', context:'A personality-quiz app collected data from users and, under platform rules at the time, information connected to their friends. Those data fed political profiling and targeting work.', evidence:'The US Federal Trade Commission concluded that Cambridge Analytica used deceptive representations concerning the collection and use of Facebook data.', takeaway:'A campaign can be analytically sophisticated and still fail the legitimacy test.', trap:'Reducing ethics to legal compliance or assuming public data is automatically fair game for a new purpose.', decision:'Before targeting, define consent, purpose limitation, sensitive proxies, contestability and who bears harm if the model is wrong.', question:'Which question comes before “Does the model work?”', answer:'“Should this dataset and intervention exist for this purpose?” Technical performance cannot legitimise deceptive collection.', keyNumbers:[{value:'2014',label:'app collection began'},{value:'2019',label:'FTC final action'},{value:'purpose',label:'must be bounded'}], tags:['privacy','political communication','consent'], source:'US FTC · Cambridge Analytica matter', sourceUrl:'https://www.ftc.gov/legal-library/browse/cases-proceedings/182-3107-cambridge-analytica-llc-matter', color:'orange' },
  { id:'zillow', topic:'Forecasting', week:'W12', learningRole:'Transfer', title:'A forecast became inventory—and balance-sheet risk', setting:'Zillow Offers wind-down · 2021', context:'Zillow bought homes directly, making future price forecasts operational: errors determined purchase prices, renovation plans, inventory and capital exposure.', evidence:'Zillow said the unpredictability of home-price forecasting exceeded what it anticipated and that scaling would create excessive earnings and balance-sheet volatility.', takeaway:'Forecast error changes meaning when a prediction triggers an irreversible, capital-intensive action.', trap:'Reporting average model accuracy while ignoring tail errors, correlated market shifts and exposure at scale.', decision:'Tie model evaluation to the cost distribution of being wrong, capacity constraints and an explicit stop rule.', question:'Why can a reasonably accurate model still make a bad business?', answer:'Because asymmetric errors, correlated shocks and scale can turn a minority of misses into inventory and cash-flow losses larger than the gains.', keyNumbers:[{value:'1,200 bps',label:'unit-economics swing cited'},{value:'2021',label:'operations wound down'},{value:'scale',label:'amplified exposure'}], tags:['forecast risk','operations','model limits'], source:'Zillow · Q3 2021 shareholder letter', sourceUrl:'https://s24.q4cdn.com/723050407/files/doc_financials/2021/q3/Zillow-Group-Q3%2721-Shareholder-Letter.pdf', color:'blue' },
  { id:'crowdstrike', topic:'Data preparation', week:'W03', learningRole:'Current practice', title:'One content update, a global workflow failure', setting:'CrowdStrike Windows outage · July 2024', context:'CrowdStrike distributed a Rapid Response Content configuration update to Windows hosts. A mismatch and validation failure triggered system crashes across dependent organisations.', evidence:'The company’s root-cause analysis described the update path and subsequent changes including staged deployment, additional validation and third-party review.', takeaway:'A transformation pipeline needs release validation, canaries, observability and rollback—not confidence in past success.', trap:'Calling this merely a coding bug. The teaching value is the socio-technical pipeline: tests, rollout scope, monitoring and recovery all shaped impact.', decision:'Choose what must be validated before release, which cohort receives the change first and what signal automatically halts propagation.', question:'What is the analytics analogue of a canary release?', answer:'Apply a cleaning rule or agent workflow to a small, representative subset; reconcile rows, totals and outputs before scaling it to the full dataset.', keyNumbers:[{value:'04:09 UTC',label:'update published'},{value:'2024',label:'global incident'},{value:'staged',label:'safer rollout principle'}], tags:['validation','rollout','blast radius'], source:'CrowdStrike · Root Cause Analysis', sourceUrl:'https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf', color:'coral' },
  { id:'ai-overviews', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'When the source was satire, but the answer sounded certain', setting:'Google AI Overviews rollout · May 2024', context:'AI-generated summaries were rolled out broadly in US Search. Users surfaced odd or inaccurate answers, while fabricated screenshots complicated diagnosis.', evidence:'Google said some results misinterpreted queries or web language, then added more than a dozen technical improvements including restrictions on satire, user-generated content and nonsensical queries.', takeaway:'Grounding is not enough if source quality, context and abstention are weak.', trap:'Fixing viral examples one by one rather than identifying failure classes and measuring them systematically.', decision:'Define when the system should answer, cite, defer to conventional search or refuse—especially for health and safety topics.', question:'What should a launch dashboard separate?', answer:'Confirmed model failures, source-quality failures, unsafe-query failures and fake reports. Each needs a different denominator and remedy.', keyNumbers:[{value:'12+',label:'technical improvements'},{value:'May 2024',label:'broad US rollout'},{value:'abstain',label:'valid system action'}], tags:['grounding','source quality','abstention'], source:'Google · AI Overviews: what happened', sourceUrl:'https://blog.google/products-and-platforms/products/search/ai-overviews-update-may-2024/', color:'lime' },
  { id:'ai-verify', topic:'AI agents', week:'W11', learningRole:'Current practice', sourceClass:'Institutional source', title:'When responsible AI became a test plan', setting:'Singapore AI Verify and Project Moonshot · 2022–2026', context:'Singapore’s AI Verify work translated governance principles into process checks and technical tests. Project Moonshot extended the testing conversation to generative-AI applications and model-safety evaluations.', evidence:'IMDA describes testing resources that cover robustness, factuality, propensity to bias, toxicity generation and data governance, while stressing an iterative approach to risks in model development and use.', takeaway:'Assurance begins when principles become test cases, thresholds, logs, ownership and escalation—not when a demo looks convincing.', trap:'Treating a framework, toolkit or passed test as certification that a particular deployment is safe, effective or appropriate in every context.', decision:'Before deployment, define the use case, credible harms, evaluation set, acceptance threshold, human owner, escalation route and disclosure requirement.', question:'What must be visible before an instructor calls an AI-assisted workflow responsible?', answer:'The intended use, test set, thresholds, failure record, unresolved risks, accountable owner, human escalation and limits of what the evaluations establish.', keyNumbers:[{value:'2022',label:'AI Verify MVP introduced'},{value:'5',label:'evaluation areas named'},{value:'1',label:'accountable owner required'}], tags:['Singapore','assurance','evaluation'], source:'IMDA · Project Moonshot, powered by AI Verify', sourceUrl:'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2024/project-moonshot', color:'orange' },
  { id:'genai-catalog', topic:'AI agents', week:'W11', learningRole:'Current practice', sourceClass:'Vendor source', title:'1,302 use cases—and one missing denominator', setting:'Google Cloud customer catalogue · updated April 2026', context:'Google Cloud’s growing catalogue assembles customer and partner descriptions of generative-AI deployments and frames their expansion as evidence of an “agentic enterprise” era.', evidence:'The first-party catalogue’s April 2026 headline reports 1,302 real-world use cases. It is a broad collection of selected examples, not a representative sample with a denominator or common independent outcome measure.', takeaway:'A large catalogue can establish breadth of reported activity without establishing an adoption rate, average return, causal impact or probability of success.', trap:'Counting selected vendor stories as independent success evidence—or treating the number of examples as the percentage of organisations achieving value.', decision:'Before citing the catalogue, classify each claim, locate its denominator, identify who measured the outcome and state what cannot be inferred.', question:'What is the strongest defensible statement supported by “1,302 use cases”?', answer:'Google Cloud published 1,302 selected customer and partner examples. The catalogue alone cannot tell us how representative they are, how many attempts failed or what average causal impact the deployments produced.', keyNumbers:[{value:'1,302',label:'reported examples'},{value:'0',label:'population denominator'},{value:'1st-party',label:'source relationship'}], tags:['source critique','selection bias','vendor claims'], source:'Google Cloud · Real-world gen-AI use cases', sourceUrl:'https://cloud.google.com/transform/101-real-world-generative-ai-use-cases-from-industry-leaders', color:'lime' },
  { id:'simplygo', topic:'Campaign decisions', week:'W13', learningRole:'Current practice', title:'When adoption data missed a commuter need', setting:'Singapore SimplyGo reversal · January 2024', context:'The planned retirement of legacy adult fare cards met strong public concern, including the loss of instant fare and balance displays at station gates.', evidence:'The Ministry of Transport said it had underestimated how strongly some commuters preferred seeing fares and balances immediately, then reversed the mandatory transition and retained the legacy system.', takeaway:'Usage data cannot substitute for understanding which moments make a service feel trustworthy.', trap:'Interpreting adoption counts as acceptance while missing a small, repeated interaction that anchors user confidence.', decision:'Combine operational costs and migration progress with observation, complaints, accessibility needs and qualitative research before mandating change.', question:'Which measure would have tested the decision more directly?', answer:'A direct measure of the need to verify fares and balances at the gate, segmented by commuter group—not adoption alone.', keyNumbers:[{value:'64%',label:'adult commuters on ABT in Dec 2023'},{value:'1 glance',label:'critical user moment'},{value:'2030',label:'legacy support horizon stated'}], tags:['Singapore','service design','qualitative data'], source:'Singapore MOT · Parliamentary reply on SimplyGo', sourceUrl:'https://www.mot.gov.sg/news-resources/newsroom/oral-reply-by-minister-for-transport-chee-hong-tat-to-parliamentary-questions-on-simplygo/', color:'blue' },
  { id:'mycity', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'The civic chatbot that needed an audit, not a disclaimer', setting:'New York City MyCity audit · 2026', context:'MyCity was built to help residents and businesses navigate services. Its chatbot operated in a domain where incorrect guidance could affect legal or financial decisions.', evidence:'A 2026 city comptroller audit reported hallucination concerns, response-time problems and wider questions about technical, economic, legal and operational feasibility.', takeaway:'Public-sector agents need measurable accuracy, latency, escalation and accountability targets before scale.', trap:'Treating a disclaimer as a control. Warning users that a system may be wrong does not make high-stakes misinformation safe.', decision:'Set test suites from real user tasks, publish thresholds, log sources, create human escalation and define a shutdown condition.', question:'Which two metrics belong together?', answer:'Answer correctness and task latency. A correct answer that arrives too slowly—or a fast answer that is wrong—both fail the service.', keyNumbers:[{value:'12.4–16.2s',label:'reported P90 responses'},{value:'2026',label:'audit published'},{value:'human',label:'required escalation path'}], tags:['public service','audit','latency'], source:'NYC Comptroller · MyCity audit', sourceUrl:'https://comptroller.nyc.gov/reports/audit-report-on-the-new-york-city-office-of-technology-and-innovations-mycity-system/', color:'orange' },
  { id:'netflix-llm-art', topic:'Web analytics', week:'W05–06', learningRole:'Current practice', title:'Can an LLM predict which artwork you will choose?', setting:'Netflix artwork research · 2026', context:'Netflix researchers tested post-trained language models on structured descriptions of members, titles and candidate artwork to improve personalised artwork selection.', evidence:'The published study reports training on 110,000 data points, evaluation on 5,000 held-out examples and 3–5% improvements over a production model in the reported experiments.', takeaway:'Offline model gains are evidence for a candidate—not proof of better member outcomes.', trap:'Confusing held-out predictive performance with causal lift, or optimising clicks without fairness and satisfaction guardrails.', decision:'Use offline evaluation to screen candidates, then pre-register an online experiment with member-level outcomes and long-term guardrails.', question:'What must happen before “3–5% better” becomes a product claim?', answer:'Clarify the metric and baseline, reproduce the holdout result, then run an online randomised test measuring actual member behaviour and downstream quality.', keyNumbers:[{value:'110k',label:'training examples'},{value:'5k',label:'held-out examples'},{value:'3–5%',label:'reported improvement'}], tags:['LLM','offline vs online','personalisation'], source:'Netflix Research · Artwork Personalization via LLM Post-training', sourceUrl:'https://arxiv.org/abs/2601.02764', color:'coral' },
  { id:'mcdonalds-ai', topic:'AI agents', week:'W02', learningRole:'Current practice', title:'The drive-thru pilot that stopped before scale', setting:'McDonald’s and IBM voice ordering · 2021–2024', context:'McDonald’s tested automated order taking at more than 100 drive-thrus, a noisy real-world environment with accents, overlapping voices and highly variable orders.', evidence:'The company ended the specific IBM test in 2024 while saying voice ordering still had future potential. Public reports documented conspicuous order failures and customer complaints.', takeaway:'Ending a pilot can be good evidence practice when the current system is not ready for the operating environment.', trap:'Declaring AI a total failure—or a future certainty—without seeing the test criteria, error distribution and human fallback performance.', decision:'Segment errors by accent, noise, order complexity and harm; compare speed and accuracy with a human-assisted baseline before choosing to scale, redesign or stop.', question:'Which average could hide the real product risk?', answer:'Overall order accuracy. Rare but severe basket errors, systematic failures for speech groups and staff intervention time need separate measures.', keyNumbers:[{value:'100+',label:'restaurants in test'},{value:'2024',label:'test ended'},{value:'severity',label:'matters beyond mean error'}], tags:['pilot','speech AI','segmentation'], source:'Associated Press · McDonald’s ends AI drive-thru test', sourceUrl:'https://apnews.com/article/bebc898363f2d550e1a0cd3c682fa234', color:'lime' },
  { id:'snow', topic:'Foundations', week:'W01', title:'The pump that changed public health', setting:'London cholera outbreak · 1854', takeaway:'Plotting deaths around water pumps exposed a spatial cluster that a table could hide.', trap:'A pattern suggests a hypothesis; it does not prove a cause on its own.', question:'What extra evidence strengthens the pump hypothesis?', answer:'Compare households’ water sources—including exceptions such as brewery workers—not only distance from the pump.', tags:['mapping','public health'], source:'CDC · Principles of Epidemiology', sourceUrl:'https://stacks.cdc.gov/view/cdc/6914/cdc_6914_DS1.', color:'blue' },
  { id:'nightingale', topic:'Foundations', week:'W01', title:'Mortality, made impossible to ignore', setting:'British military hospitals · 1850s', takeaway:'Florence Nightingale’s polar-area diagrams turned preventable deaths into an argument for sanitation.', trap:'Area grows faster than radius. A dramatic shape can exaggerate change.', question:'Why was the chart persuasive to decision-makers?', answer:'It paired a memorable visual pattern with a concrete action: improve hospital sanitation.', tags:['history','health'], source:'University of York · Nightingale data', sourceUrl:'https://www.york.ac.uk/depts/maths/histstat/small.htm', color:'coral' },
  { id:'commute', topic:'Foundations', week:'W01', title:'How Singapore gets to work', setting:'Census transport modes · Singapore', takeaway:'A planning-area comparison links everyday travel behaviour to housing and transport decisions.', trap:'Counts reward populous areas. Rates answer a different question.', question:'Would you map counts or percentages?', answer:'Use percentages to compare modal preference; use counts to plan absolute capacity. Often show both.', tags:['Singapore','open data'], source:'data.gov.sg · Census transport dataset', sourceUrl:'https://data.gov.sg/datasets/d_1f8f5ec7201964e365c77551cab99503/view', color:'lime' },
  { id:'aircanada', topic:'AI agents', week:'W02', title:'“The chatbot said so” was not a defence', setting:'Moffatt v. Air Canada · 2024', takeaway:'A customer relied on incorrect bereavement-fare advice from a chatbot; the company remained responsible.', trap:'Treating an agent as an independent authority dissolves accountability.', question:'Where should a human checkpoint sit?', answer:'Before policy advice is shown or acted on, with a current source and escalation path attached.', tags:['governance','hallucination'], source:'CanLII · Moffatt v. Air Canada', sourceUrl:'https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html', color:'orange' },
  { id:'agent-boundary', topic:'AI agents', week:'W02', title:'The analyst agent with one permission too many', setting:'Campaign CRM · governance scenario', takeaway:'A useful agent may clean a list; it should not also publish, email and delete without bounded authority.', trap:'Automation bias grows after a streak of correct outputs.', question:'Which permission would you remove first?', answer:'Irreversible actions such as sending and deletion should require explicit approval and logs.', tags:['privacy','human control'], source:'IMDA · Agentic AI Governance Framework', sourceUrl:'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2026/new-model-ai-governance-framework-for-agentic-ai', color:'blue' },
  { id:'categories', topic:'Data preparation', week:'W03', title:'Why did “Chicken Rice” disappear?', setting:'Food-delivery export · adapted case', takeaway:'One dish appears under six labels. Standardising categories completely changes the ranking.', trap:'Silent cleaning choices can manufacture a winner.', question:'What must the cleaning log preserve?', answer:'Original value, new value, rule used, affected rows and who approved the change.', tags:['cleaning','categories'], source:'Course case · adapted from platform exports', sourceUrl:'#lab', color:'coral' },
  { id:'rainfall', topic:'Data preparation', week:'W03', title:'A rainfall join that doubled the storm', setting:'Weather stations · Singapore open data', takeaway:'Joining hourly readings to duplicated station metadata inflated the citywide total.', trap:'A many-to-many join can multiply rows while still “looking right.”', question:'What check catches this fastest?', answer:'Compare row counts and key uniqueness before and after the join; then reconcile totals.', tags:['joining','validation'], source:'data.gov.sg · Real-time weather readings', sourceUrl:'https://data.gov.sg/collections/1459/view', color:'blue' },
  { id:'berkeley', topic:'Statistical interpretation', week:'W04', title:'The admissions paradox', setting:'UC Berkeley graduate admissions · 1973', takeaway:'Aggregated data appeared biased against women; department-level rates revealed different application patterns.', trap:'A hidden grouping variable can reverse the overall relationship.', question:'Does the disaggregated result end the equity question?', answer:'No. It changes the mechanism to investigate—such as why applicants cluster in more selective departments.', tags:['Simpson’s paradox','bias'], source:'R datasets · UCBAdmissions', sourceUrl:'https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/UCBAdmissions.html', color:'lime' },
  { id:'anscombe', topic:'Statistical interpretation', week:'W04', title:'Four datasets, one summary', setting:'Anscombe’s quartet · 1973', takeaway:'Four datasets share nearly identical means, correlations and regressions, but look radically different.', trap:'A compact statistic can conceal outliers, curves and clusters.', question:'What is the non-negotiable next step?', answer:'Visualise the data and inspect residuals before accepting the summary model.', tags:['correlation','outliers'], source:'American Statistician · Anscombe', sourceUrl:'https://www.sjsu.edu/faculty/gerstman/StatPrimer/anscombe1973.pdf', color:'orange' },
  { id:'abtest', topic:'Statistical interpretation', week:'W04', title:'The tiny lift that “won”', setting:'Newsletter subject-line test · adapted case', takeaway:'A 0.2-point lift is statistically detectable at huge scale but may not pay for a creative overhaul.', trap:'Statistical significance is not practical significance.', question:'What belongs beside the p-value?', answer:'Effect size, confidence interval, business value, costs and the pre-registered decision rule.', tags:['A/B testing','significance'], source:'Course case · adapted experiment', sourceUrl:'#lab', color:'blue' },
  { id:'funnel', topic:'Web analytics', week:'W05–06', title:'The campaign that won clicks—not customers', setting:'Social ad → checkout funnel · adapted case', takeaway:'Click-through rose 38%, while qualified visits and completed purchases fell.', trap:'Optimising the top of the funnel can damage the outcome.', question:'Which metric should own the decision?', answer:'A downstream metric tied to the goal—such as qualified conversion or profit—not clicks alone.', tags:['GA4','funnel'], source:'Google Analytics · Funnel exploration', sourceUrl:'https://support.google.com/analytics/answer/9327974', color:'blue' },
  { id:'attribution', topic:'Web analytics', week:'W06', title:'Who gets credit for the sale?', setting:'Search, social and email journey', takeaway:'Last-click attribution crowns email; the path shows social introduced the user and search returned them.', trap:'An attribution model is a rule for assigning credit, not ground truth.', question:'How should the team report the result?', answer:'Compare models, show the journey, state the lookback window and avoid claiming causal lift.', tags:['attribution','journeys'], source:'Google Analytics · Attribution', sourceUrl:'https://support.google.com/analytics/answer/10596866', color:'coral' },
  { id:'axis', topic:'Visualisation', week:'W08', title:'A 3% change that looks like a cliff', setting:'Quarterly brand-trust dashboard', takeaway:'Starting the y-axis at 78 turns a small movement into a visual collapse.', trap:'A technically correct scale can still mislead perception.', question:'Must every bar chart start at zero?', answer:'Usually yes because length encodes magnitude. If not, disclose the break and consider a line or dot plot.', tags:['axes','perception'], source:'Claus Wilke · Visualizing amounts', sourceUrl:'https://clauswilke.com/dataviz/visualizing-amounts.html', color:'orange' },
  { id:'choropleth', topic:'Visualisation', week:'W08–09', title:'The map that mostly shows population', setting:'Campaign mentions by region', takeaway:'Raw mention counts make dense regions look most engaged. Per-capita rates reveal a different pattern.', trap:'Area and population dominate a choropleth of counts.', question:'Which denominator is defensible?', answer:'Choose the exposed or eligible population, explain it, and show uncertainty for small areas.', tags:['maps','normalisation'], source:'CDC · Mapping techniques', sourceUrl:'https://www.cdc.gov/tobacco/stateandcommunity/guides/pdfs/best-practices-mapping-techniques.pdf', color:'lime' },
  { id:'flatten', topic:'Data stories', week:'W10', title:'One curve, one memorable action', setting:'“Flatten the curve” · COVID-19', takeaway:'A simple visual connected collective behaviour to health-system capacity.', trap:'Simplicity aids action but can hide assumptions and uncertainty.', question:'What made the story travel?', answer:'Clear contrast, an understandable constraint, and a specific role for the audience.', tags:['narrative','public health'], source:'The Lancet · flattening the curve', sourceUrl:'https://doi.org/10.1016/S0140-6736(20)30567-5', color:'coral' },
  { id:'wrapped', topic:'Data stories', week:'W10', title:'Your data became the campaign', setting:'Spotify Wrapped · annual product story', takeaway:'Personal listening data is sequenced into a shareable identity story.', trap:'Personalisation can feel delightful or invasive depending on expectation and control.', question:'What turns a dashboard into a story?', answer:'A deliberate sequence, comparison, surprise, a clear voice and an ending designed for action or sharing.', tags:['personalisation','storytelling'], source:'Spotify Newsroom · Wrapped', sourceUrl:'https://newsroom.spotify.com/tag/spotify-wrapped/', color:'blue' },
  { id:'museum', topic:'Forecasting', week:'W11–12', title:'The forecast that forgot school holidays', setting:'Weekly museum attendance · adapted case', takeaway:'A smooth trend misses predictable holiday spikes and understates staffing needs.', trap:'A good average forecast can still fail when the decision happens at peaks.', question:'Which baseline should the agent beat?', answer:'A seasonal naïve forecast—this week equals the comparable week last cycle—before adding complexity.', tags:['seasonality','baseline'], source:'Forecasting: Principles and Practice', sourceUrl:'https://otexts.com/fpp3/', color:'lime' },
  { id:'shock', topic:'Forecasting', week:'W12', title:'When history stopped behaving normally', setting:'Mobility demand during a structural break', takeaway:'A model trained on stable years projects straight through a sudden policy and behaviour change.', trap:'Narrow intervals create false confidence when the data-generating process changes.', question:'What should the communication lead say?', answer:'Present scenarios, identify the break, widen uncertainty and describe triggers for updating the plan.', tags:['uncertainty','time series'], source:'Forecasting: Principles and Practice', sourceUrl:'https://otexts.com/fpp3/', color:'orange' },
  { id:'benefits', topic:'Campaign decisions', week:'W13', title:'When a risk score became a verdict', setting:'Public-service fraud detection · real-world pattern', takeaway:'A score designed to prioritise review can become an automated denial when people over-trust it.', trap:'Prediction silently turns into prescription.', question:'When should data not decide?', answer:'When stakes are high, recourse is weak, proxies encode protected traits, or evidence cannot justify the action.', tags:['ethics','recommendation'], source:'OECD · AI incidents and accountability', sourceUrl:'https://oecd.ai/en/incidents', color:'coral' },
  { id:'campaign', topic:'Campaign decisions', week:'W13', title:'From insight to a campaign someone can use', setting:'Active-mobility campaign · Singapore scenario', takeaway:'Survey, search and transport data point to different barriers by neighbourhood.', trap:'A generic citywide recommendation averages away the people who need different messages.', question:'What makes the recommendation defensible?', answer:'Name the audience, action, evidence, uncertainty, trade-off, owner, success measure and review date.', tags:['strategy','stakeholders'], source:'data.gov.sg · Transport datasets', sourceUrl:'https://data.gov.sg/datasets?topics=transport', color:'blue' },
];

const weeks = [
  ['01','Foundations'],['02','Directing AI agents'],['03','Prepare & verify'],['04','Interpret statistics'],['05–06','GA4 & web metrics'],['08–09','Visualise in Data Studio'],['10','Tell the data story'],['11','Agentic workflows'],['12','Forecast honestly'],['13','Recommend & pitch'],
];

export default function Home() {
  const [topic, setTopic] = useState('All topics');
  const [learningRole, setLearningRole] = useState<LearningRoleFilter>('All paths');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);

  const filtered = useMemo(() => cases.filter((item) => {
    const topicMatch = topic === 'All topics' || item.topic === topic;
    const roleMatch = learningRole === 'All paths' || getLearningRole(item) === learningRole;
    const searchMatch = `${item.title} ${item.setting} ${item.context ?? ''} ${item.evidence ?? ''} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return topicMatch && roleMatch && searchMatch;
  }), [topic, learningRole, search]);

  const comparisonCases = compareIds.map((id) => cases.find((item) => item.id === id)).filter((item): item is CaseStudy => Boolean(item));
  const toggleCompare = (id: string) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);

  return (
    <main id="top">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Evidence Lab home"><span className="brandMark">E/L</span><span>Evidence Lab</span></a>
        <span className="courseCode">CDM2002 · AY 2026/27</span>
        <div className="navActions"><a href="#casebook">Casebook</a><a href="#path">Course path</a><a href="#challenge">Challenge</a></div>
      </nav>

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
          {filtered.map((item) => <CaseCard key={item.id} item={item} index={cases.indexOf(item)} onOpen={() => setSelected(item)} compareSelected={compareIds.includes(item.id)} compareDisabled={compareIds.length === 2 && !compareIds.includes(item.id)} onCompare={() => toggleCompare(item.id)} />)}
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

      {selected && <CaseDrawer item={selected} onClose={() => setSelected(null)} />}
      {comparisonOpen && comparisonCases.length === 2 && <CompareDrawer items={[comparisonCases[0], comparisonCases[1]]} onClose={() => setComparisonOpen(false)} />}
    </main>
  );
}

function CaseCard({ item, index, onOpen, compareSelected, compareDisabled, onCompare }: { item: CaseStudy; index: number; onOpen: () => void; compareSelected: boolean; compareDisabled: boolean; onCompare: () => void }) {
  return <article className={`caseCard ${item.color}`}>
    <div className="cardTop"><span>{String(index + 1).padStart(2,'0')}</span><div><em className={`roleBadge ${getLearningRole(item).toLowerCase().replace(' ','-')}`}>{getLearningRole(item) === 'Current practice' ? 'Current · 2024–26' : getLearningRole(item)}</em><span>{item.week}</span></div></div>
    <div className="cardVisual"><CaseVisual item={item} type={index % 5} compact /></div>
    <p className="cardTopic">{getCaseKind(item)} · {item.topic}</p><h3>{item.title}</h3><p className="cardSetting">{item.setting}</p>
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

function CaseDrawer({ item, onClose }: { item: CaseStudy; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, summary, [tabindex]:not([tabindex="-1"])'));
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
  }, [onClose]);

  return <div className="drawerBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article ref={dialogRef} className={`caseDrawer ${item.color}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button ref={closeRef} className="drawerClose" onClick={onClose} aria-label="Close case">×</button>
      <p className="caseKicker">{getCaseKind(item).toUpperCase()} · {getLearningRole(item).toUpperCase()} · {item.week} · {item.topic}</p><h2 id="drawer-title">{item.title}</h2><p className="drawerSetting">{item.setting}</p>
      {(diagramAssets[item.id] || recreatedIds.has(item.id)) && <EvidenceFigure item={item} />}
      {item.keyNumbers && <div className="keyNumbers">{item.keyNumbers.map((number) => <div key={`${number.value}-${number.label}`}><strong>{number.value}</strong><span>{number.label}</span></div>)}</div>}
      <div className="drawerSections">
        {item.context && <section><span>CASE CONTEXT</span><p>{item.context}</p></section>}
        <section className="evidenceStatus"><span>EVIDENCE STATUS{item.sourceClass ? ` · ${item.sourceClass.toUpperCase()}` : ''}</span><p>{getEvidenceStatus(item)}</p></section>
        <section><span>{item.evidence ? 'WHAT THE EVIDENCE SHOWS' : 'TEACHING CLAIM'}</span><p>{item.evidence ?? item.takeaway}</p></section>
        {item.evidence && <section className="lesson"><span>WHY IT BELONGS IN THIS COURSE</span><p>{item.takeaway}</p></section>}
        <section><span>THE ANALYTICAL TRAP</span><p>{item.trap}</p></section>
        {item.decision && <section><span>THE DECISION STAKE</span><p>{item.decision}</p></section>}
        <section className="question"><span>YOUR TURN</span><h3>{item.question}</h3><details><summary>Reveal one defensible response</summary><p>{item.answer}</p></details></section>
      </div>
      <a className="sourceLink" href={item.sourceUrl} target={item.sourceUrl.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{getCaseKind(item) === 'Worked scenario' ? 'Method / further reading' : 'Source / further reading'}: {item.source} <span>↗</span></a>
      <CaseNotebook caseId={item.id} title={item.title} />
    </article>
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
  if (id === 'crowdstrike') return <div className="reDiagram pipelineDiagram"><span>RELEASE PIPELINE</span><div><i>Update</i><b>→</b><i className="danger">Global</i><b>→</b><i>Outage</i></div><strong>Missing: staged canary + halt signal</strong><em>Recreated</em></div>;
  if (id === 'ai-overviews') return <div className="reDiagram overviewDiagram"><span>SOURCE QUALITY</span><div><i>Satire</i><b>+</b><i>Query</i><b>→</b><i className="danger">Certain answer</i></div><strong>Grounded can still be wrong</strong><em>Recreated</em></div>;
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
