export type ProjectCategory = 'Data Science & Analytics' | 'AI & Engineering';
export type ProjectFilter = 'All' | ProjectCategory;
export interface Project {
  slug: string; title: string; shortTitle: string; category: ProjectCategory;
  description: string; problem: string; approach: string;
  stack: string[]; features: string[]; architecture: string[];
  considerations: string[]; nextSteps: string[];
  preview: 'sales' | 'dashboards' | 'eda' | 'rag' | 'flight' | 'chat';
  github?: string; demo?: string; screenshot?: string;
}
export interface Profile {
  name: string; role: string; secondaryRole: string; location: string;
  statement: string; introduction: string; about: string;
  github?: string; linkedin?: string; email?: string; resume?: string;
  portrait?: string; socialImage?: string; siteUrl?: string;
}
// Supply missing links/assets here. Keep unavailable values undefined, never use '#'.
// Local assets belong in public/; reference them with a root-relative path.
export const profile: Profile = {
  name: 'Hassam Ali', role: 'Data Scientist', secondaryRole: 'AI Engineer',
  location: 'Faisalabad, Pakistan',
  statement: 'Turning data into insight. Building intelligence into applications.',
  introduction: 'I work with Python, SQL, analytics, and AI tools to explore real-world problems and build practical solutions.',
  about: 'I’m Hassam, a BS Data Science student at the University of Agriculture Faisalabad. I build practical analytics applications and AI-powered systems, connecting what I learn with problems I can explore and solve.',
  github: 'https://github.com/Rajpoot-10',
  linkedin: undefined, email: undefined, resume: undefined,
  portrait: undefined, socialImage: undefined, siteUrl: undefined,
};
export const education = [
  { institution: 'University of Agriculture Faisalabad', course: 'BS Data Science', label: 'EDUCATION' },
  { institution: 'Saylani Mass IT Training · SMIT', course: 'AI & Data Science training', label: 'CONTINUED LEARNING' },
];
export const expertise = [
  { title: 'Data Science & Analytics', note: 'From raw data to a clearer picture.', icon: 'data', skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Statistics', 'EDA', 'Matplotlib', 'Seaborn', 'Plotly', 'Streamlit'] },
  { title: 'Machine Learning', note: 'Studied and practised', icon: 'ml', skills: ['Scikit-learn', 'Decision trees', 'Random forests', 'Bagging', 'AdaBoost', 'Feature engineering', 'Model evaluation'] },
  { title: 'AI Engineering & Applications', note: 'Connecting models, tools, and useful interfaces.', icon: 'ai', skills: ['FastAPI', 'n8n', 'Groq', 'Pinecone', 'RAG', 'API integrations', 'Supabase/PostgreSQL', 'MySQL'] },
] as const;
export const filters: ProjectFilter[] = ['All', 'Data Science & Analytics', 'AI & Engineering'];
export const featuredProjectOrder = ['sales-inventory-analytics', 'interactive-analytics-dashboards'];
export const projects: Project[] = [
  {
    slug: 'sales-inventory-analytics', title: 'Sales & Inventory Analytics API', shortTitle: 'Making inventory\nintelligence actionable.', category: 'Data Science & Analytics', preview: 'sales',
    description: 'An analytics API that connects day-to-day inventory operations with revenue insights and practical reorder recommendations.',
    problem: 'Sales records and stock levels are most useful when they can inform the same decision: what is selling, what is running low, and what should be reordered?',
    approach: 'FastAPI exposes product, order, and analytics operations. Supabase/PostgreSQL stores records, Pydantic validates inputs, and Pandas and NumPy support aggregation and moving-average calculations. This project does not use n8n.',
    stack: ['FastAPI', 'Supabase/PostgreSQL', 'Pandas', 'NumPy', 'Pydantic'],
    architecture: ['Products & orders', 'FastAPI · Pydantic', 'PostgreSQL', 'Pandas · NumPy', 'Analytics responses'],
    features: ['Product and order management', 'Inventory tracking and stock alerts', 'Revenue analysis and best-selling products', 'Moving-average reorder recommendations'],
    considerations: ['Moving averages provide a transparent baseline for reorder recommendations; they are not advanced machine learning.', 'Inventory insights depend on complete, consistent order records.'],
    nextSteps: ['Evaluate reorder calculations against held-out historical demand.', 'Document handling of seasonality, missing records, and unusual demand spikes.'],
  },
  {
    slug: 'interactive-analytics-dashboards', title: 'Interactive Analytics Dashboards', shortTitle: 'A better question.\nA clearer perspective.', category: 'Data Science & Analytics', preview: 'dashboards',
    description: 'Exploratory dashboards for Netflix titles, Amazon products, and Superstore sales. Prepare, filter, and see the story in the data.',
    problem: 'Raw datasets make comparisons difficult. Exploring titles, products, or sales requires consistent preparation and visualizations that make the underlying questions clear.',
    approach: 'Pandas supports data preparation and exploratory analysis. Streamlit provides interactive filters, while Plotly turns selected records into visual comparisons.',
    stack: ['Streamlit', 'Pandas', 'Plotly'], architecture: ['Source datasets', 'Pandas preparation', 'Streamlit filters', 'Plotly views'],
    features: ['Netflix title exploration', 'Amazon product exploration', 'Superstore sales exploration', 'Interactive filtering and visual communication'],
    considerations: ['A filter changes the population being described, so chart labels and context matter.', 'Exploratory comparisons describe patterns; they do not establish causation.'],
    nextSteps: ['Add dataset provenance and refresh dates to each dashboard.', 'Document missing-value handling and provide downloadable filtered records.'],
  },
  {
    slug: 'automated-eda-system', title: 'Automated EDA System', shortTitle: 'From dataset to first insights.', category: 'Data Science & Analytics', preview: 'eda',
    description: 'Reduce repetitive exploration with dataset profiling and automated visualization workflows.',
    problem: 'Early dataset exploration repeats many of the same tasks: inspecting columns, checking completeness, and examining distributions.',
    approach: 'FastAPI and Pandas support dataset profiling, with visualization libraries and n8n connecting the analysis into automated workflows.',
    stack: ['FastAPI', 'Pandas', 'Visualization libraries', 'n8n'], architecture: ['Dataset', 'FastAPI', 'Pandas profiling', 'Visualizations', 'n8n workflow'],
    features: ['Dataset profiling', 'Automated visualization workflows'],
    considerations: ['Automated profiles are a starting point for domain-specific investigation.', 'Useful chart selection depends on variable types and data quality.'],
    nextSteps: ['Document supported input formats and dataset size limits.', 'Add explicit checks for sensitive fields and invalid input.'],
  },
  {
    slug: 'rag-email-assistant', title: 'RAG Email Answering Assistant', shortTitle: 'Context before a response.', category: 'AI & Engineering', preview: 'rag',
    description: 'Bring relevant document context into AI-generated email responses with a retrieval-augmented workflow.',
    problem: 'A useful email response needs relevant source context rather than relying only on a language model’s general knowledge.',
    approach: 'An n8n workflow connects Gmail integration, Pinecone retrieval, and Groq generation. Retrieved document context supports the generated email response.',
    stack: ['n8n', 'Pinecone', 'Groq', 'Gmail integration'], architecture: ['Email', 'n8n', 'Pinecone retrieval', 'Groq + context', 'Response'],
    features: ['Document context retrieval', 'AI-generated email responses', 'Gmail integration'],
    considerations: ['Retrieval relevance is a prerequisite for a grounded response.', 'Generated responses can still be incorrect and should be reviewed.'],
    nextSteps: ['Evaluate retrieval quality with representative questions.', 'Add explicit source references and a human review step before sending.'],
  },
  {
    slug: 'flight-management-system', title: 'Flight Management System', shortTitle: 'Coordinating the booking journey.', category: 'AI & Engineering', preview: 'flight',
    description: 'An engineering and automation project connecting flight search, seat inventory, bookings, and notifications.',
    problem: 'A booking workflow must coordinate changing seat availability with reservation states and passenger notifications.',
    approach: 'A React frontend connects to FastAPI and Supabase/PostgreSQL. n8n supports notification workflows around the booking lifecycle. This is an engineering and automation project.',
    stack: ['FastAPI', 'Supabase/PostgreSQL', 'n8n', 'React'], architecture: ['React frontend', 'FastAPI', 'PostgreSQL', 'n8n notifications'],
    features: ['Flight search and seat inventory', 'Temporary seat holds and booking confirmation', 'Cancellations and refunds', 'Waitlists and notification workflows'],
    considerations: ['Temporary holds need consistent expiration rules.', 'Booking state and notification delivery are separate concerns.'],
    nextSteps: ['Validate concurrent booking and hold-expiration behavior.', 'Document refund states, retries, and notification failure handling.'],
  },
  {
    slug: 'whatsapp-ai-agent', title: 'WhatsApp AI Agent', shortTitle: 'Conversations with context.', category: 'AI & Engineering', preview: 'chat',
    description: 'Automated conversational responses that use recent-message memory to maintain local context.',
    problem: 'Responding to each message in isolation loses context from the conversation immediately before it.',
    approach: 'Baileys connects WhatsApp messaging to an n8n workflow. Groq generates responses using recent-message memory as context.',
    stack: ['Baileys', 'Groq', 'n8n'], architecture: ['WhatsApp · Baileys', 'n8n', 'Recent messages', 'Groq response'],
    features: ['Automated conversational responses', 'Recent-message memory'],
    considerations: ['Recent-message memory is bounded context, not durable knowledge.', 'Conversation data requires deliberate retention and access policies.'],
    nextSteps: ['Document memory limits and reset behavior.', 'Add a clear human handoff and evaluate response quality.'],
  },
];
export function filterProjects(filter: ProjectFilter): Project[] {
  return projects.filter(project => filter === 'All' || project.category === filter);
}
export function findProject(slug: string | undefined): Project | undefined {
  return projects.find(project => project.slug === slug);
}
export function orderedProjects(filter: ProjectFilter): Project[] {
  const order = (slug: string) => { const index = featuredProjectOrder.indexOf(slug); return index < 0 ? 100 : index; };
  return filterProjects(filter).sort((a, b) => order(a.slug) - order(b.slug));
}
export function webUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function assetUrl(value: string | undefined): string | undefined {
  return value?.startsWith('/') && !value.startsWith('//') ? value : webUrl(value);
}
export function emailUrl(value: string | undefined): string | undefined {
  return value && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ? `mailto:${value}` : undefined;
}
export const labData = {
  Retail: [18, 25, 22, 36, 31, 45],
  Technology: [28, 20, 34, 30, 42, 38],
  'Office supplies': [12, 19, 16, 24, 21, 29],
};
export const labMonths = ['January', 'February', 'March', 'April', 'May', 'June'];
