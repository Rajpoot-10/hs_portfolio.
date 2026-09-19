import { createHash } from 'node:crypto';
import { ID_PREFIX, SOURCE } from './config.ts';
export type Chunk = { id: string; metadata: { source: string; type: string; title: string; section: string; technologies: string[]; text: string } };
const headings = ['ABOUT', 'EDUCATION', 'CAREER DIRECTION', 'TECHNICAL SKILLS', 'SELECTED PROJECTS', 'CERTIFICATIONS AND ADDITIONAL LEARNING', 'PROFESSIONAL INTERESTS', 'PORTFOLIO ASSISTANT RESPONSE POLICY'];
export function chunkKnowledge(document: string): Chunk[] {
  const normalized = document.replace(/\r\n/g, '\n').trim();
  const pattern = new RegExp('^(' + headings.join('|') + ')(?=\\s|$)', 'gm');
  const matches = [...normalized.matchAll(pattern)];
  if (matches.length < 3) throw new Error('Knowledge file must preserve its named section headings.');
  const chunks: Chunk[] = [];
  const add = (section: string, title: string, text: string, type: string) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    // A content-aware boundary is safer than silently truncating a large section.
    if (clean.length > 8000) throw new Error('Split this oversized knowledge section into meaningful subsections: ' + title);
    const technologies = clean.match(/Technologies:\s*(.+)$/i)?.[1].replace(/\.$/, '').split(/,\s*/) || [];
    chunks.push({
      id: ID_PREFIX + createHash('sha256').update(section + ':' + title).digest('hex').slice(0, 24),
      metadata: { source: SOURCE, type, title, section, technologies, text: clean }
    });
  };
  const educationTitle = (text: string) => {
    if (/\bICS\b|Intermediate of Computer Science/i.test(text)) return 'ICS';
    if (/\bCGPA\b|\bGPA\b/i.test(text)) return 'CGPA';
    if (/\bBS in Data Science\b|University of Agriculture|Agriculture Faisalabad/i.test(text)) return 'Degree';
    if (/Saylani|AI and Data Science|SMIT/i.test(text)) return 'AI Training';
    return 'Education';
  };
  matches.forEach((match, index) => {
    const section = match[1];
    if (section === 'PORTFOLIO ASSISTANT RESPONSE POLICY') return; // Document prose never becomes system policy.
    const body = normalized.slice(match.index! + match[0].length, matches[index + 1]?.index ?? normalized.length).trim();
    if (section === 'SELECTED PROJECTS') {
      const projects = body.split(/(?=^\d+\.\s+)/m).filter(part => part.trim());
      for (const project of projects) {
        const clean = project.replace(/^\d+\.\s+/, '').replace(/\s+/g, ' ').trim();
        const title = clean.split(/\s+(?=An?\s|Hassam\s)/)[0];
        if (!title || title.length > 160) throw new Error('Project needs a short title followed by a description starting A, An, or Hassam.');
        add(section, title, clean, 'project');
      }
    } else if (section === 'TECHNICAL SKILLS') {
      for (const part of body.split(/\n\s*\n/)) {
        const title = part.split(':')[0].replace(/\s+/g, ' ').trim();
        add(section, title, part, 'skills');
      }
    } else if (section === 'EDUCATION') {
      const entries = body.split(/(?<=\.)\s+(?=[A-Z])/).map(part => part.trim()).filter(Boolean);
      const segments = entries.length ? entries : [body];
      for (const segment of segments) {
        const title = educationTitle(segment);
        add(section, title, segment, 'education');
      }
    } else add(section, section, body, 'profile');
  });
  if (new Set(chunks.map(chunk => chunk.id)).size !== chunks.length) throw new Error('Duplicate section titles would overwrite knowledge; give each a unique title.');
  if (!chunks.some(chunk => chunk.metadata.type === 'project')) throw new Error('No project chunks found.');
  return chunks;
}
export function staleIds(existing: string[], chunks: Chunk[]) {
  const current = new Set(chunks.map(chunk => chunk.id));
  return existing.filter(id => id.startsWith(ID_PREFIX) && !current.has(id));
}
