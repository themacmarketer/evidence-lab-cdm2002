'use client';

import { useMemo, useState } from 'react';

type CaseStudy = {
  id: string; topic: string; week: string; title: string; setting: string; takeaway: string;
  trap: string; question: string; answer: string; tags: string[]; source: string; sourceUrl: string; color: string;
};

const topics = ['All topics','Foundations','AI agents','Data preparation','Statistical interpretation','Web analytics','Visualisation','Data stories','Forecasting','Campaign decisions'];

const cases: CaseStudy[] = [
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
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);

  const filtered = useMemo(() => cases.filter((item) => {
    const topicMatch = topic === 'All topics' || item.topic === topic;
    const searchMatch = `${item.title} ${item.setting} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return topicMatch && searchMatch;
  }), [topic, search]);

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
          <p className="lede">A field guide to the data decisions hiding in campaigns, dashboards, queues, clicks and everyday life.</p>
          <a className="primaryButton" href="#casebook">Open the evidence lab <span>↘</span></a>
          <div className="heroStats"><span><strong>{cases.length}</strong> field cases</span><span><strong>9</strong> course topics</span><span><strong>1</strong> rule: verify</span></div>
        </div>
        <div className="heroVisual" aria-label="A bar chart with a misleading truncated axis">
          <div className="chartNote">Looks convincing.<br /><strong>Is it true?</strong></div>
          <div className="plot"><span className="plotLabel plotLabelA">78%</span><span className="plotLabel plotLabelB">62%</span><span className="plotLabel plotLabelC">45%</span><div className="bar barA" /><div className="bar barB" /><div className="bar barC" /></div>
          <div className="scribble">axis starts at 40!</div><div className="dataBadge">DATA ≠ TRUTH</div>
        </div>
      </section>

      <section className="ticker" aria-label="Course themes"><div>COLLECT <span>◆</span> CLEAN <span>◆</span> QUESTION <span>◆</span> VISUALISE <span>◆</span> DECIDE <span>◆</span> VERIFY THE AGENT <span>◆</span> COLLECT <span>◆</span> CLEAN <span>◆</span></div></section>

      <section className="casebook" id="casebook">
        <div className="sectionIntro"><p className="eyebrow dark"><span /> THE CASEBOOK</p><h2>Real data.<br />Messy decisions.</h2><p>Filter the collection, open a case, catch the analytical trap and decide what you would tell the stakeholder.</p></div>
        <div className="filterBar">
          <label className="searchBox"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases, settings or skills…" aria-label="Search cases" /></label>
          <label className="topicSelect"><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="topicChips" aria-label="Filter by topic">{topics.map((item) => <button key={item} className={topic === item ? 'active' : ''} onClick={() => setTopic(item)} aria-pressed={topic === item}>{item}</button>)}</div>
        <p className="resultCount">Showing {filtered.length} of {cases.length} cases</p>
        <div className="caseGrid">
          {filtered.map((item, index) => <CaseCard key={item.id} item={item} index={index} onOpen={() => setSelected(item)} />)}
        </div>
        {filtered.length === 0 && <div className="emptyState"><strong>No evidence found.</strong><p>Try another keyword or reset the topic filter.</p><button onClick={() => { setTopic('All topics'); setSearch(''); }}>Reset the lab</button></div>}
      </section>

      <section className="path" id="path">
        <div className="pathHeading"><p className="eyebrow"><span /> YOUR COURSE PATH</p><h2>From raw data<br />to responsible action.</h2><p>Each stop adds a new question. The red thread never changes: what did the agent do, and how do you know it is right?</p></div>
        <div className="weekRail">{weeks.map(([number,label], index) => <a key={number} href="#casebook" onClick={() => setTopic(topicForWeek(index))}><span>{number}</span><strong>{label}</strong><i>{index === weeks.length - 1 ? 'Pitch it' : 'Explore'}</i></a>)}</div>
      </section>

      <section className="challenge" id="challenge">
        <div className="challengeCard">
          <p className="eyebrow dark"><span /> 60-SECOND CHALLENGE</p>
          <span className="challengeNumber">#01</span>
          <h2>Which headline<br />can the data support?</h2>
          <div className="experiment"><div><strong>A</strong><span>2,010 visitors</span><em>4.0% signed up</em></div><div><strong>B</strong><span>1,980 visitors</span><em>4.4% signed up</em></div></div>
          <div className="answers">
            {[
              ['A','Version B increased sign-ups by 10%.'],
              ['B','Version B is definitely the better design.'],
              ['C','B’s observed rate is higher; uncertainty and practical value still need checking.'],
            ].map(([letter,label]) => <button key={letter} className={quizAnswer === letter ? 'chosen' : ''} onClick={() => setQuizAnswer(letter)}><span>{letter}</span>{label}</button>)}
          </div>
          {quizAnswer && <div className={quizAnswer === 'C' ? 'feedback correct' : 'feedback'} role="status"><strong>{quizAnswer === 'C' ? 'Defensible.' : 'Too confident.'}</strong><p>{quizAnswer === 'C' ? 'The sample shows an observed difference, but you still need an uncertainty interval, a test plan and a business threshold.' : 'The result describes this sample. It does not yet prove the design caused a reliable or worthwhile improvement.'}</p></div>}
        </div>
        <aside className="fieldRule"><span>FIELD RULE 04</span><blockquote>“An honest chart shows what you know—and leaves room for what you don’t.”</blockquote><p>Before you recommend: name the decision, denominator, uncertainty, trade-off and accountable human.</p></aside>
      </section>

      <section className="agentChecklist" id="lab">
        <div><p className="eyebrow"><span /> SUPERVISE THE PIPELINE</p><h2>Trust is a workflow,<br />not a feeling.</h2></div>
        <ol><li><span>01</span><strong>Scope</strong><p>Bound the goal, data, tools and authority.</p></li><li><span>02</span><strong>Observe</strong><p>Keep intermediate steps, logs and source links.</p></li><li><span>03</span><strong>Verify</strong><p>Reconcile rows, totals, assumptions and charts.</p></li><li><span>04</span><strong>Decide</strong><p>A human owns the action and disclosure.</p></li></ol>
      </section>

      <footer><div className="brand"><span className="brandMark">E/L</span><span>Evidence Lab</span></div><p>CDM2002 · Data Analytics and Visualisation<br />Trimester 1, AY 2026/27</p><a href="#top">Back to top ↑</a></footer>

      {selected && <CaseDrawer item={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function CaseCard({ item, index, onOpen }: { item: CaseStudy; index: number; onOpen: () => void }) {
  return <article className={`caseCard ${item.color}`}>
    <div className="cardTop"><span>{String(index + 1).padStart(2,'0')}</span><span>{item.week}</span></div>
    <div className="cardVisual" aria-hidden="true"><Visual type={index % 5} /></div>
    <p className="cardTopic">{item.topic}</p><h3>{item.title}</h3><p className="cardSetting">{item.setting}</p>
    <div className="tagRow">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <button onClick={onOpen} aria-label={`Inspect ${item.title}`}>Inspect the evidence <span>↗</span></button>
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
  return <div className="drawerBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article className={`caseDrawer ${item.color}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button className="drawerClose" onClick={onClose} aria-label="Close case">×</button>
      <p className="caseKicker">{item.week} · {item.topic}</p><h2 id="drawer-title">{item.title}</h2><p className="drawerSetting">{item.setting}</p>
      <div className="drawerSections"><section><span>WHAT THE DATA SHOWS</span><p>{item.takeaway}</p></section><section><span>THE ANALYTICAL TRAP</span><p>{item.trap}</p></section><section className="question"><span>YOUR TURN</span><h3>{item.question}</h3><details><summary>Reveal a defensible answer</summary><p>{item.answer}</p></details></section></div>
      <a className="sourceLink" href={item.sourceUrl} target={item.sourceUrl.startsWith('#') ? undefined : '_blank'} rel="noreferrer">Source / further reading: {item.source} <span>↗</span></a>
    </article>
  </div>;
}

function topicForWeek(index: number) {
  return ['Foundations','AI agents','Data preparation','Statistical interpretation','Web analytics','Visualisation','Data stories','AI agents','Forecasting','Campaign decisions'][index];
}
