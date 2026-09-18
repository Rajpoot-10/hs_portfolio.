import { Component, lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import './chatbot.css';
const ChatPanel = lazy(() => import('./ChatPanel'));
class ChatBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="chat-load-error" role="alert">Chat could not load. <button onClick={() => window.location.reload()}>Reload page</button></div> : this.props.children;
  }
}
export default function ChatLauncher() {
  const [opened, setOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <ChatBoundary>
    <button className="chat-launcher" aria-haspopup="dialog" aria-expanded={opened} aria-controls={loaded ? 'hassam-chat' : undefined}
      onClick={() => { setLoaded(true); setOpened(true); }}><Sparkles size={18} aria-hidden="true"/><span>Ask Hassam AI</span></button>
    {loaded && <Suspense fallback={<div className="chat-load-error" role="status">Opening Hassam AI…</div>}>
      <ChatPanel open={opened} onClose={() => setOpened(false)}/>
    </Suspense>}
  </ChatBoundary>;
}
