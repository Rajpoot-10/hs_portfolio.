import { useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { usePointerTilt } from '../hooks/motion';
import { ArrowUpRight, Box, ChartNoAxesCombined, Database, FileText, GitBranch, Mail, MessageSquare, Plane, Sparkles } from 'lucide-react';
import type { Project } from '../data/content';
import { labData, labMonths } from '../data/content';

function landscapePoint(x: number, z: number) {
  const height = 105 * Math.exp(-((x - 0.6) ** 2 + (z + 0.3) ** 2) / 1.45) + 45 * Math.exp(-((x + 1.5) ** 2 + (z - 1.3) ** 2) / 0.8);
  return [280 + x * 62 + z * 38, 264 + z * 27 - x * 14 - height];
}
export function DataLandscape() {
  const tilt = useRef<HTMLElement>(null);
  usePointerTilt(tilt);
  const [mode, setMode] = useState<'surface' | 'points'>('surface');
  const lines = Array.from({ length: 25 }, (_, i) => -3 + i / 4);
  const samples = Array.from({ length: 49 }, (_, i) => -3 + i / 8);
  const path = (fixed: number, flip: boolean) => samples.map((step, i) => { const [x, y] = landscapePoint(flip ? fixed : step, flip ? step : fixed); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
  return <figure ref={tilt} className="landscape">
    <div className="figure-top"><span><span className="tiny-square" /> THE INTELLIGENCE LAB</span><span>FIG. 001</span></div>
    <svg viewBox="0 0 560 410" role="img" aria-label={mode === 'surface' ? 'Illustrative cyan wireframe surface showing a synthetic distribution' : 'Illustrative scatter points sampled from a synthetic distribution'}>
      <defs><radialGradient id="landscape-glow"><stop stopColor="#34d9cf" stopOpacity=".10"/><stop offset="1" stopColor="#34d9cf" stopOpacity="0"/></radialGradient><linearGradient id="surface-stroke" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a8fff0"/><stop offset=".5" stopColor="#52d6cb"/><stop offset="1" stopColor="#285660"/></linearGradient></defs>
      <ellipse cx="300" cy="250" rx="250" ry="170" fill="url(#landscape-glow)"/>
      <g className="plot-grid" stroke="#26353d" strokeWidth=".65">{[-3,-2,-1,0,1,2,3].map(n => <g key={n}><path d={`M${280+n*62-114},${305-n*14-81} l228,162`}/><path d={`M${94+n*38},${347+n*27} l372,-84`}/></g>)}</g>
      <g className="surface-lines" fill="none" stroke="url(#surface-stroke)" strokeWidth=".8" opacity={mode === 'surface' ? '.85' : '.16'}>{lines.map(n => <g key={n}><path d={path(n, false)}/><path d={path(n, true)}/></g>)}</g>
      <g fill="#8af4e3">{Array.from({ length: 48 }, (_, i) => { const x = Math.sin(i * 7.13) * 2.8; const z = Math.cos(i * 4.87) * 2.8; const [cx, cy] = landscapePoint(x, z); return <circle key={i} cx={cx} cy={cy} r={mode === 'points' ? 2.6 : i % 6 === 0 ? 2.4 : 1} opacity={mode === 'points' ? '.9' : '.7'}/>; })}</g>
      <g fill="#80949d" fontSize="9" fontFamily="monospace"><text x="456" y="371">FEATURE X</text><text x="33" y="309">FEATURE Y</text><text x="306" y="100">DISTRIBUTION</text><path d="M303 106v27" stroke="#53656c"/><text x="88" y="391">−3</text><text x="285" y="350">0</text><text x="494" y="310">+3</text></g>
      <circle cx="303" cy="141" r="4" fill="#9ff6e7"/><circle cx="303" cy="141" r="9" fill="none" stroke="#67d7ce" strokeOpacity=".4"/>
    </svg>
    <div className="figure-bottom"><figcaption><span className="cyan-dot" /> An exploration of possibility <span className="demo-label">Demo data</span></figcaption><button onClick={() => setMode(mode === 'surface' ? 'points' : 'surface')} className="plot-toggle" aria-label={`Show ${mode === 'surface' ? 'scatter points' : 'wireframe surface'}`}><GitBranch size={13}/><span>{mode === 'surface' ? 'Surface' : 'Points'}</span></button></div>
  </figure>;
}

export function ProjectPreview({ project, large = false }: { project: Project; large?: boolean }) {
  const id = useId().replace(/:/g, '');
  const tilt = useRef<HTMLElement>(null);
  usePointerTilt(tilt, large);
  const workflows = {
    eda: [{ icon: FileText, label: 'Dataset' }, { icon: ChartNoAxesCombined, label: 'Profile' }, { icon: GitBranch, label: 'Visualize' }],
    rag: [{ icon: Mail, label: 'Question' }, { icon: Database, label: 'Retrieve' }, { icon: Sparkles, label: 'Response' }],
    flight: [{ icon: Plane, label: 'Search' }, { icon: Box, label: 'Hold' }, { icon: Mail, label: 'Confirm' }],
    chat: [{ icon: MessageSquare, label: 'Message' }, { icon: Database, label: 'Memory' }, { icon: Sparkles, label: 'Reply' }],
  };
  return <figure ref={tilt} className={`project-preview preview-${project.preview} ${large ? 'preview-large' : ''}`}>
    {project.screenshot ? <img src={project.screenshot} alt={`${project.title} screenshot`} loading="lazy" width="1000" height="650" /> : <>
      {(project.preview === 'sales' || project.preview === 'dashboards') ? <div className="preview-window" aria-hidden="true">
        <div className="window-header"><div className="window-dots"><i/><i/><i/></div><span>{project.preview === 'sales' ? 'INVENTORY / OVERVIEW' : 'EXPLORATORY ANALYSIS'}</span><ArrowUpRight size={12}/></div>
        <div className="window-body"><div className="mini-sidebar"><Database size={15}/><ChartNoAxesCombined size={15}/><Box size={15}/></div><div className="mini-dashboard">
          <div className="mini-title"><span>{project.preview === 'sales' ? 'Sales overview' : 'A view into the data'}</span><span className="mini-period">JAN — JUN</span></div>
          <div className="mini-stats"><div>REVENUE TREND<span className="mini-stat-line"/></div><div>ORDER VOLUME<span className="mini-stat-line short"/></div><div>STOCK LEVELS<span className="mini-stat-line medium"/></div></div>
          <svg viewBox="0 0 400 135"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4ed6c9" stopOpacity=".24"/><stop offset="1" stopColor="#4ed6c9" stopOpacity="0"/></linearGradient></defs>{[20,55,90,125].map(y => <path key={y} d={`M0 ${y}H400`} stroke="#233038" strokeDasharray="3 5" fill="none"/>)}<path d="M0 113L24 102L48 108L74 80L98 91L123 64L148 74L172 56L198 69L222 37L246 45L271 22L297 39L322 18L347 28L373 9L400 17V135H0Z" fill={`url(#${id})`}/><path d="M0 113L24 102L48 108L74 80L98 91L123 64L148 74L172 56L198 69L222 37L246 45L271 22L297 39L322 18L347 28L373 9L400 17" fill="none" stroke="#65dfcd" strokeWidth="2"/>{project.preview === 'dashboards' && <path d="M0 95L40 113L80 80L120 100L160 77L200 89L240 63L280 84L320 55L360 66L400 39" fill="none" stroke="#9f90de" strokeWidth="2"/>}</svg>
          <div className="mini-bottom"><span>{project.preview === 'sales' ? 'Inventory distribution' : 'Category comparison'}</span><div className="mini-bars">{[30,65,42,85,56,73,92,62,46,80,58,72].map((height,i) => <i key={i} style={{height: `${height}%`}}/>)}</div></div>
        </div></div>
      </div> : <div className="workflow-preview" aria-hidden="true">{workflows[project.preview].map(({icon: Icon, label},i) => <div className="workflow-step" key={label}>{i > 0 && <span className="workflow-connector"/>}<div className="workflow-icon"><Icon size={21}/></div><span>{label}</span></div>)}</div>}
    </>}
    <figcaption>{project.screenshot ? 'PROJECT SCREENSHOT' : 'CONCEPT PREVIEW · NOT A PROJECT SCREENSHOT'}{!project.screenshot && (project.preview === 'sales' || project.preview === 'dashboards') && <span>Demo data</span>}</figcaption>
  </figure>;
}

export function DataLab() {
  const [segment, setSegment] = useState<keyof typeof labData>('Retail');
  const [active, setActive] = useState<number | null>(null);
  const values = labData[segment];
  const total = values.reduce((a,b) => a+b,0);
  const max = Math.max(...values);
  const selected = active === null ? null : `${labMonths[active]}: ${values[active]} synthetic orders`;
  return <section className="lab-section" aria-labelledby="lab-heading">
    <div className="lab-intro" data-reveal><p className="eyebrow"><span className="cyan-dot"/> A SMALL EXPERIMENT</p><h2 id="lab-heading">A little data.<br/>A different perspective.</h2><p>Change the category. Explore a point. See how a simple filter changes the story.</p><span className="lab-disclaimer">DATA LAB / SYNTHETIC DATA ONLY</span></div>
    <div className="lab-chart" data-reveal data-reveal-delay="70"><div className="lab-chart-header"><div><h3>Orders over time</h3><p>Six months. Three perspectives.</p></div><label><span className="sr-only">Dataset category</span><select value={segment} onChange={event => {setSegment(event.target.value as keyof typeof labData); setActive(null);}}>{Object.keys(labData).map(key => <option key={key}>{key}</option>)}</select></label></div>
      <div className="bar-chart" role="group" aria-label={`${segment} synthetic monthly orders. Tab through each bar for details.`}>
        <div className="chart-axis" aria-hidden="true"><span>50</span><span>25</span><span>0</span></div>
        <div className="chart-bars">{values.map((value,index) => <div className="bar-column" key={labMonths[index]}><button className={`chart-bar ${active === index ? 'selected' : ''}`} style={{ '--bar-value': value / 50 } as CSSProperties} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(index)} aria-label={`${labMonths[index]}: ${value} synthetic orders`} aria-describedby={active === index ? 'chart-tooltip' : undefined}><span className="bar-fill" aria-hidden="true"/><span className="bar-value" aria-hidden="true">{value}</span></button><span className="bar-month">{labMonths[index].slice(0,3)}</span></div>)}</div>
      </div>
      <div className="chart-readout"><span id="chart-tooltip" role="status">{selected ?? 'Hover or focus a bar to explore'}</span><span>Demo data</span></div>
      <p className="chart-summary" aria-live="polite">{segment}: {total} synthetic orders from January to June. {labMonths[values.indexOf(max)]} has the highest count ({max}). These values are illustrative, not project results.</p>
    </div>
  </section>;
}
