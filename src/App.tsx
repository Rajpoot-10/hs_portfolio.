import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Braces, ChartNoAxesCombined, Check, ChevronRight, Download, Github, Linkedin, Mail, MapPin, Menu, Network, X } from 'lucide-react';
import { assetUrl, education, emailUrl, expertise, featuredProjectOrder, filters, findProject, orderedProjects, profile, projects, webUrl } from './data/content';
import type { Project, ProjectFilter } from './data/content';
import { DataLab, DataLandscape, ProjectPreview } from './components/Visuals';

const navigation = ['Home', 'Projects', 'Expertise', 'About', 'Contact'];
function ExternalLink({ href, children, className = '' }: { href?: string; children: ReactNode; className?: string }) {
  const safeHref = webUrl(href);
  return safeHref ? <a href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>{children}</a> : null;
}
function Monogram({ large = false }: { large?: boolean }) {
  return <span className={`monogram ${large ? 'monogram-large' : ''}`} aria-hidden="true"><svg viewBox="0 0 48 40"><path d="M5 8v25m0-13h13M18 8v25m8 0 8-25 9 25m-14-8h11" fill="none" stroke="currentColor" strokeWidth="2.3"/></svg></span>;
}
function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -55% 0px' });
    navigation.forEach(item => { const element = document.getElementById(item.toLowerCase()); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }
    function resize() { if (window.innerWidth > 760) setOpen(false); }
    document.addEventListener('keydown', escape); window.addEventListener('resize', resize);
    return () => { document.removeEventListener('keydown', escape); window.removeEventListener('resize', resize); };
  }, [open]);
  return <header className="site-header"><div className="header-inner"><Link className="brand" to="/#home" onClick={() => setOpen(false)} aria-label="Hassam Ali, home"><Monogram/><span>Hassam Ali<span className="brand-dot">.</span></span></Link>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={23}/> : <Menu size={23}/>}</button>
    <nav id="main-navigation" className={open ? 'navigation is-open' : 'navigation'} aria-label="Main navigation" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== toggle.current) setOpen(false); }}>{navigation.map(item => { const id = item.toLowerCase(); const selected = location.pathname === '/' ? active === id : id === 'projects' && location.pathname.startsWith('/projects/'); return <Link key={id} to={`/#${id}`} aria-current={selected ? 'location' : undefined} onClick={() => setOpen(false)}>{item}{item === 'Contact' && <ArrowUpRight size={14}/>}</Link>; })}</nav>
  </div></header>;
}
function PageEffects() {
  const { pathname, hash } = useLocation();
  const initial = useRef(true);
  useEffect(() => {
    const project = pathname.startsWith('/projects/') ? findProject(pathname.split('/')[2]) : undefined;
    const title = pathname === '/' ? `${profile.name} — ${profile.role} & ${profile.secondaryRole}` : project ? `${project.title} — ${profile.name}` : `Page not found — ${profile.name}`;
    const description = project?.description ?? profile.statement;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    const siteUrl = webUrl(profile.siteUrl);
    const image = assetUrl(profile.socialImage);
    let socialMeta = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (image && (webUrl(image) || siteUrl)) {
      if (!socialMeta) { socialMeta = document.createElement('meta'); socialMeta.setAttribute('property', 'og:image'); document.head.appendChild(socialMeta); }
      socialMeta.content = webUrl(image) ?? new URL(image, siteUrl).href;
    } else socialMeta?.remove();
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (siteUrl) {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = new URL(pathname, siteUrl).href;
    } else canonical?.remove();
    const frame = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null;
      if (target) { target.scrollIntoView({ behavior: 'instant' }); if (!initial.current) target.focus({ preventScroll: true }); }
      else { window.scrollTo(0,0); if (!initial.current) document.getElementById('main')?.focus({ preventScroll: true }); }
      initial.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
function SectionHeading({ number, label, title, children }: { number: string; label: string; title: string; children?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow"><span>{number} /</span> {label}</p><h2>{title}</h2></div>{children && <p className="section-description">{children}</p>}</div>;
}
function ProjectActions({ project }: { project: Project }) {
  return <div className="project-actions"><Link to={`/projects/${project.slug}`} className="text-link">View case study <ArrowUpRight size={17}/></Link><ExternalLink href={project.github} className="subtle-link">GitHub <Github size={15}/></ExternalLink><ExternalLink href={project.demo} className="subtle-link">Live demo <ArrowUpRight size={15}/></ExternalLink></div>;
}
function ProjectCard({ project, featured, index }: { project: Project; featured: boolean; index: number }) {
  return <article className={featured ? `featured-project featured-${index}` : 'compact-project'} data-testid="project-card">
    <ProjectPreview project={project} large={featured}/>
    <div className="project-copy"><p className="project-category"><span>{String(projects.indexOf(project)+1).padStart(2,'0')}</span>{project.category}</p><h3>{project.title}</h3>{featured && <p className="project-hook">{project.shortTitle}</p>}<p className="project-description">{project.description}</p><ul className="tags" aria-label="Technologies">{project.stack.map(tech => <li key={tech}>{tech}</li>)}</ul><ProjectActions project={project}/></div>
  </article>;
}
function Projects() {
  const [filter, setFilter] = useState<ProjectFilter>('All');
  const visible = orderedProjects(filter);
  const featured = visible.filter(project => featuredProjectOrder.includes(project.slug));
  const compact = visible.filter(project => !featuredProjectOrder.includes(project.slug));
  return <section id="projects" className="section projects-section" tabIndex={-1}>
    <SectionHeading number="01" label="SELECTED WORK" title="Built with questions. Backed by data.">A selection of projects at the intersection<br className="desktop-break"/> of analysis, intelligence, and engineering.</SectionHeading>
    <div className="project-toolbar"><div className="project-filters" role="group" aria-label="Filter projects">{filters.map(item => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}{item === 'All' && <span>{projects.length.toString().padStart(2,'0')}</span>}</button>)}</div><span className="project-count" role="status">{visible.length} projects</span></div>
    <div className="featured-projects">{featured.map((project,index) => <ProjectCard key={project.slug} project={project} featured index={index}/>)}</div>
    <div className="compact-projects">{compact.map((project,index) => <ProjectCard key={project.slug} project={project} featured={false} index={index}/>)}</div>
  </section>;
}
function Home() {
  return <main id="main" tabIndex={-1}>
    <section id="home" className="hero container" tabIndex={-1}>
      <div className="hero-copy"><p className="eyebrow hero-eyebrow"><span className="cyan-dot"/> CURIOUS BY NATURE. DRIVEN BY DATA.</p><p className="hero-name">Hello, I’m {profile.name}<span className="cyan">.</span></p><h1>Data<br/><span>Scientist.</span></h1><p className="secondary-role"><span className="role-line"/> & {profile.secondaryRole}</p><p className="hero-statement">{profile.statement}</p><p className="hero-description">{profile.introduction}</p><div className="hero-actions"><a href="#projects" className="button button-primary">Explore My Projects <ArrowUpRight size={18}/></a>{assetUrl(profile.resume) && <a href={assetUrl(profile.resume)} className="button button-outline" target="_blank" rel="noopener noreferrer">View Resume <Download size={16}/></a>}<ExternalLink href={profile.github} className="hero-social"><Github size={19}/><span>GitHub</span><ArrowUpRight size={13}/></ExternalLink><ExternalLink href={profile.linkedin} className="hero-social"><Linkedin size={18}/><span>LinkedIn</span></ExternalLink></div><p className="hero-location"><MapPin size={13}/> BS Data Science <span>·</span> {profile.location}</p></div>
      <div className="hero-visual"><DataLandscape/><div className="visual-note"><span>01 — OBSERVE</span><span>02 — UNDERSTAND</span><span>03 — BUILD</span></div></div>
      <div className="hero-bottom"><span>DATA SCIENCE AT THE CORE. AI ENGINEERING IN PRACTICE.</span><a href="#projects">SCROLL TO EXPLORE <ArrowDown size={13}/></a></div>
    </section>
    <div className="container"><Projects/>
      <section id="expertise" className="section expertise-section" tabIndex={-1}><SectionHeading number="02" label="THE TOOLKIT" title="A foundation in data. A mindset for building.">The tools I use, the concepts I practise,<br className="desktop-break"/> and the connections between them.</SectionHeading>
        <div className="expertise-list">{expertise.map((group,index) => { const Icon = [ChartNoAxesCombined, Network, Braces][index]; return <article className="expertise-row" key={group.title}><div className="expertise-title"><span className="expertise-icon"><Icon size={23}/></span><div><h3>{group.title}</h3><p>{group.note}</p></div></div><ul className="skill-list">{group.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></article>; })}</div>
      </section>
      <section id="about" className="section about-section" tabIndex={-1}><div className="about-art">{assetUrl(profile.portrait) ? <img src={assetUrl(profile.portrait)} width="480" height="500" loading="lazy" alt={profile.name}/> : <><div className="monogram-grid"><Monogram large/><span className="art-cross art-cross-one">+</span><span className="art-cross art-cross-two">+</span></div><div className="about-art-caption"><span>THE PERSON BEHIND THE PROJECTS</span><span>HA / PK</span></div></>}</div><div className="about-copy"><p className="eyebrow"><span>03 /</span> BEHIND THE WORK</p><h2>Always learning.<br/>Purposefully building.</h2><p>{profile.about}</p><p>I’m interested in the space between understanding a dataset and turning that understanding into something useful — a clearer dashboard, a thoughtful API, or an application with intelligence built in.</p><div className="education">{education.map(item => <div key={item.institution}><span>{item.label}</span><h3>{item.institution}</h3><p>{item.course}</p></div>)}</div></div></section>
      <DataLab/>
      <section id="contact" className="section contact-section" tabIndex={-1}><p className="eyebrow"><span>04 /</span> LET’S CONNECT</p><div className="contact-content"><h2>Have a data problem<br/>worth <span>solving?</span></h2><div className="contact-copy"><p>Ideas, interesting datasets, and thoughtful conversations. I’d love to hear what you’re working on.</p><div className="contact-actions">{emailUrl(profile.email) && <a className="button button-primary" href={emailUrl(profile.email)}>Open Email App <Mail size={18}/></a>}<ExternalLink href={profile.github} className="contact-link">Find me on GitHub <ArrowUpRight size={21}/></ExternalLink><ExternalLink href={profile.linkedin} className="contact-link">Connect on LinkedIn <ArrowUpRight size={21}/></ExternalLink></div></div></div></section>
    </div>
  </main>;
}
function CaseStudy() {
  const { slug } = useParams();
  const project = findProject(slug);
  if (!project) return <NotFound/>;
  const nextProject = projects[(projects.indexOf(project)+1) % projects.length];
  return <main id="main" tabIndex={-1} className="container case-study"><Link to="/#projects" className="back-link"><ArrowLeft size={16}/> Back to selected work</Link><p className="eyebrow">PROJECT STUDY / {project.category.toUpperCase()}</p><h1>{project.title}</h1><p className="case-intro">{project.description}</p><ul className="tags">{project.stack.map(tech => <li key={tech}>{tech}</li>)}</ul><div className="case-external"><ExternalLink href={project.github} className="button button-outline">GitHub <Github size={16}/></ExternalLink><ExternalLink href={project.demo} className="button button-primary">Live demo <ArrowUpRight size={16}/></ExternalLink></div><ProjectPreview project={project} large/>
    <div className="case-body"><aside><span className="eyebrow">IN THIS STUDY</span><nav aria-label="Case study sections">{['Overview','Problem','Approach','Features','Takeaways','Next steps'].map(item => <a key={item} href={`#${item.toLowerCase().replace(' ','-')}`}>{item}<ChevronRight size={13}/></a>)}</nav></aside><div className="case-sections"><section id="overview"><p className="eyebrow">01 / CONTEXT</p><h2>Overview</h2><p>{project.description}</p></section><section id="problem"><p className="eyebrow">02 / THE QUESTION</p><h2>The problem</h2><p>{project.problem}</p></section><section id="approach"><p className="eyebrow">03 / THE SYSTEM</p><h2>Approach & architecture</h2><p>{project.approach}</p><div className="architecture" aria-label="Conceptual architecture">{project.architecture.map((step,index) => <div key={step}><span>{String(index+1).padStart(2,'0')}</span>{step}{index < project.architecture.length-1 && <ArrowDown size={15}/>}</div>)}</div><p className="caption">Conceptual flow based on the project’s described tools and features.</p></section><section id="features"><p className="eyebrow">04 / CAPABILITIES</p><h2>Features</h2><ul className="feature-list">{project.features.map(feature => <li key={feature}><Check size={17}/>{feature}</li>)}</ul></section><section id="takeaways"><p className="eyebrow">05 / REFLECTION</p><h2>Technical takeaways</h2><p className="caption">Design considerations, rather than measured performance claims.</p>{project.considerations.map(point => <p key={point}>{point}</p>)}</section><section id="next-steps"><p className="eyebrow">06 / LOOKING AHEAD</p><h2>Limitations & next steps</h2><p>These are proposed areas for further validation and development.</p><ul className="next-steps">{project.nextSteps.map(step => <li key={step}>{step}</li>)}</ul></section></div></div>
    <Link to={`/projects/${nextProject.slug}`} className="next-project"><div><span className="eyebrow">EXPLORE THE NEXT PROJECT</span><h2>{nextProject.title}</h2></div><ArrowRight size={30}/></Link>
  </main>;
}
function NotFound() {
  return <main id="main" tabIndex={-1} className="container not-found"><p className="eyebrow">404 / OUTSIDE THE DATASET</p><h1>A little off the chart.</h1><p>This page couldn’t be found. There’s still plenty to explore.</p><Link to="/#projects" className="button button-primary">Explore the projects <ArrowRight size={18}/></Link></main>;
}
export default function App() {
  return <><a href="#main" className="skip-link">Skip to content</a><PageEffects/><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/projects/:slug" element={<CaseStudy/>}/><Route path="*" element={<NotFound/>}/></Routes><footer className="site-footer container"><Link to="/#home" className="footer-brand"><Monogram/><span>{profile.name}</span></Link><span>Thoughtfully built. Always evolving.</span><span>© {new Date().getFullYear()} {profile.name}</span><a href="#main" aria-label="Back to top"><ArrowUpRight size={18}/></a></footer></>;
}
