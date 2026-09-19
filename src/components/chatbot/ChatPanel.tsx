import { useEffect, useRef, useState } from 'react';
import { ArrowUp, RotateCcw, Sparkles, X } from 'lucide-react';
type Message = { role: 'user' | 'assistant'; content: string };
function formatMessageContent(content: string) {
  const sentences = content
    .replace(/\r\n/g, '\n')
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(sentence => sentence.trim())
    .filter(Boolean);

  return sentences.length ? sentences.map((sentence, index) => <p key={index} className="chat-message-line">{sentence}</p>) : [<p key="0" className="chat-message-line">{content.trim()}</p>];
}
const starters = [
  ['Data Science skills', "What are Hassam's Data Science skills?"],
  ['Explore projects', "Show me Hassam's main projects."],
  ['AI Engineering', "What AI Engineering experience does Hassam have?"],
  ['Education', 'What is Hassam studying?'],
];
export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) { element.showModal(); input.current?.focus(); }
    else if (!open && element.open) element.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    if (open && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, busy, error, open]);
  useEffect(() => () => request.current?.abort(), []);
  async function send(text: string, retry = false) {
    const question = text.trim();
    if (!question || question.length > 1200 || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const history = (retry ? messages.slice(0, -1) : messages).slice(-8);
    if (!retry) setMessages(previous => [...previous, { role: 'user', content: question }]);
    setDraft(''); setBusy(true); setError(''); setFailed(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]),
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a minute before asking another question.' : 'Hassam AI is temporarily unavailable. Please try again.');
      const result = await response.json() as { success?: boolean; answer?: string };
      if (!result.success || typeof result.answer !== 'string' || !result.answer.trim() || result.answer.length > 2400)
        throw new Error('Hassam AI is temporarily unavailable. Please try again.');
      if (!controller.signal.aborted) setMessages(previous => [...previous, { role: 'assistant' as const, content: result.answer! }].slice(-40));
    } catch (failure) {
      if (!controller.signal.aborted) {
        const message = failure instanceof Error && failure.message.startsWith('Please wait') ? failure.message : 'Hassam AI is temporarily unavailable. Please try again.';
        setError(message); setFailed(question);
      }
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }
  function clear() {
    request.current?.abort(); request.current = null;
    setMessages([]); setDraft(''); setBusy(false); setError(''); setFailed(null); input.current?.focus();
  }
  return <dialog ref={dialog} id="hassam-chat" className="chat-panel" aria-labelledby="chat-title" aria-describedby="chat-subtitle"
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, a[href], [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose}>
    <header className="chat-header">
      <span className="chat-mark"><Sparkles size={21} aria-hidden="true" /></span>
      <div><h2 id="chat-title">Hassam AI</h2><p id="chat-subtitle">Hassam Ali’s AI Portfolio Assistant</p></div>
      <button className="chat-icon" onClick={clear} aria-label="Clear conversation" title="Clear conversation"><RotateCcw size={18} /></button>
      <button className="chat-icon" onClick={onClose} aria-label="Close chat" title="Close chat"><X size={21} /></button>
    </header>
    <div ref={transcript} className="chat-transcript">
      <div className="chat-welcome"><span className="chat-eyebrow">BEHIND THE PORTFOLIO</span>
        <h3>A little more about<br />the person behind the work.</h3>
        <p>Hi! I’m Hassam’s AI portfolio assistant. Ask me about his projects, skills, education, or AI Engineering work.</p>
        {messages.length === 0 && <div className="chat-starters">{starters.map(([label, question]) =>
          <button key={label} disabled={busy} onClick={() => void send(question)}>{label}<span aria-hidden="true">↗</span></button>)}</div>}
      </div>
      <div className="chat-messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        {messages.map((message, index) => <div key={index} className={'chat-message chat-message-' + message.role}>
          <span className="chat-message-name">{message.role === 'user' ? 'YOU' : 'HASSAM AI'}</span>
          <div className="chat-message-body">{formatMessageContent(message.content)}</div>
        </div>)}
      </div>
      {busy && <div className="chat-thinking" role="status"><span className="chat-dots" aria-hidden="true"><i /><i /><i /></span>Looking through Hassam’s portfolio…</div>}
      {error && <div className="chat-error" role="alert"><p>{error}</p>{failed && <button disabled={busy} onClick={() => void send(failed, true)}>Retry question</button>}</div>}
    </div>
    <form className="chat-compose" onSubmit={event => { event.preventDefault(); void send(draft); }}>
      <label className="chat-sr-only" htmlFor="chat-question">Ask about Hassam</label>
      <div className="chat-input-row"><textarea ref={input} id="chat-question" placeholder="Ask about Hassam…" value={draft} maxLength={1200} rows={2}
        onChange={event => setDraft(event.target.value)} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft); }
        }} aria-describedby="chat-note" />
        <button type="submit" className="chat-send" disabled={busy || !draft.trim()} aria-label="Send message"><ArrowUp size={21} /></button>
      </div>
      <p id="chat-note">AI answers from Hassam’s portfolio · This session only</p>
    </form>
  </dialog>;
}
