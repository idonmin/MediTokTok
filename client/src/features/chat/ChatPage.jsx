import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark.jsx';
import { getConversationMessages, getConversations, streamChat } from './chat.api.js';

const greeting = {
  id: 'greeting',
  role: 'assistant',
  content: '안녕하세요. 저장된 PubMed 논문에 대해 질문해 주세요.',
};

export function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([greeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const messageListRef = useRef(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    let active = true;
    const restoreLatestConversation = async () => {
      try {
        const { items } = await getConversations();
        const latest = items?.[0];
        if (!latest) return;
        const result = await getConversationMessages(latest.id);
        if (!active) return;
        setConversationId(latest.id);
        setMessages(result.items?.length ? result.items : [greeting]);
      } catch (error) {
        if (active) setStatus(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreLatestConversation();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && stickToBottomRef.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const list = messageListRef.current;
    if (!list) return;
    stickToBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 64;
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    const assistantId = crypto.randomUUID();
    stickToBottomRef.current = true;
    setMessages((current) => [...current, userMessage, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setStatus('');
    setLoading(true);

    try {
      await streamChat({
        conversationId,
        message,
        onEvent: (type, data) => {
          if (type === 'meta') setConversationId(data.conversationId);
          if (type === 'token') {
            setMessages((current) => current.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + data.token } : item,
            ));
          }
          if (type === 'error') throw new Error(data.message || '답변 생성 중 오류가 발생했습니다.');
        },
      });
    } catch (error) {
      setMessages((current) => current.map((item) =>
        item.id === assistantId ? { ...item, content: error.message } : item,
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-content chat-page">
      <div className="page-heading"><div><span className="eyebrow">RESEARCH CHAT</span><h1>논문과 대화하기</h1></div></div>
      <div className="chat-panel clay-panel">
        <div className="message-list" ref={messageListRef} onScroll={handleScroll}>
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <span className="message-author">
                {message.role === 'user' ? '나' : <><BrandMark small />메디톡톡</>}
              </span>
              <p>{message.content || '답변을 작성하는 중…'}</p>
            </article>
          ))}
          {loading && messages.length === 1 && <p className="chat-status">이전 대화를 불러오는 중입니다.</p>}
        </div>
        {status && <p className="chat-error" role="alert">{status}</p>}
        <form className="chat-input" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="저장된 논문 데이터에 대해 질문하세요." disabled={loading} />
          <button className="icon-button primary" aria-label="전송" disabled={loading || !input.trim()}><Send size={18} /></button>
        </form>
      </div>
      <p className="safety-copy">메디톡톡은 논문 메타데이터 분석용이며 개인 의료 조언, 진단, 처방을 제공하지 않습니다.</p>
    </section>
  );
}
