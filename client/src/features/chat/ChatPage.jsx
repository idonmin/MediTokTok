import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Send, Trash2 } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark.jsx';
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  getConversations,
  streamChat,
} from './chat.api.js';

const greeting = {
  id: 'greeting',
  role: 'assistant',
  content: '안녕하세요. 저장된 PubMed 논문에 대해 질문해 주세요.',
};

export function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([greeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const messageListRef = useRef(null);
  const roomMenuRef = useRef(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    let active = true;
    const restoreLatestConversation = async () => {
      try {
        const { items } = await getConversations();
        if (!active) return;
        setConversations(items || []);
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
    const closeWhenClickingOutside = (event) => {
      const menu = roomMenuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    const closeWithEscape = (event) => {
      if (event.key === 'Escape' && roomMenuRef.current?.open) {
        roomMenuRef.current.open = false;
        roomMenuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
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

  const closeRoomMenu = () => {
    if (roomMenuRef.current) roomMenuRef.current.open = false;
  };

  const openConversation = async (conversation) => {
    if (loading || conversation.id === conversationId) {
      closeRoomMenu();
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const result = await getConversationMessages(conversation.id);
      setConversationId(conversation.id);
      setMessages(result.items?.length ? result.items : [greeting]);
      stickToBottomRef.current = true;
      closeRoomMenu();
    } catch (error) {
      setStatus(error.message || '채팅방을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addConversation = async () => {
    if (loading) return;
    setLoading(true);
    setStatus('');
    try {
      const conversation = await createConversation();
      setConversations((current) => [conversation, ...current]);
      setConversationId(conversation.id);
      setMessages([greeting]);
      stickToBottomRef.current = true;
      closeRoomMenu();
    } catch (error) {
      setStatus(error.message || '새 채팅방을 만들지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeConversation = async (event, conversation) => {
    event.stopPropagation();
    if (loading) return;
    const confirmed = window.confirm(`"${conversation.title}" 채팅방을 삭제할까요?`);
    if (!confirmed) return;

    setLoading(true);
    setStatus('');
    try {
      await deleteConversation(conversation.id);
      const remaining = conversations.filter((item) => item.id !== conversation.id);
      setConversations(remaining);

      if (conversation.id === conversationId) {
        const nextConversation = remaining[0];
        if (nextConversation) {
          const result = await getConversationMessages(nextConversation.id);
          setConversationId(nextConversation.id);
          setMessages(result.items?.length ? result.items : [greeting]);
        } else {
          setConversationId(null);
          setMessages([greeting]);
        }
        stickToBottomRef.current = true;
      }
    } catch (error) {
      setStatus(error.message || '채팅방을 삭제하지 못했습니다.');
    } finally {
      setLoading(false);
    }
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
      const { items } = await getConversations();
      setConversations(items || []);
    } catch (error) {
      setMessages((current) => current.map((item) =>
        item.id === assistantId ? { ...item, content: error.message } : item,
      ));
    } finally {
      setLoading(false);
    }
  };

  const currentConversation = conversations.find((item) => item.id === conversationId);
  const currentTitle = currentConversation?.title || '새 채팅방';

  return (
    <section className="page-content chat-page">
      <div className="page-heading">
        <div><span className="eyebrow">RESEARCH CHAT</span><h1>논문과 대화하기</h1></div>
        <details className="chat-room-accordion" ref={roomMenuRef}>
          <summary>
            <span>현재 채팅방</span>
            <strong title={currentTitle}>{currentTitle}</strong>
            <ChevronDown size={18} />
          </summary>
          <div className="chat-room-menu">
            <button className="new-chat-room" type="button" onClick={addConversation} disabled={loading}>
              <Plus size={17} />
              새 채팅방
            </button>
            <div className="chat-room-list">
              {conversations.map((conversation) => (
                <div
                  className={`chat-room-item${conversation.id === conversationId ? ' active' : ''}`}
                  key={conversation.id}
                >
                  <button
                    className="chat-room-select"
                    type="button"
                    onClick={() => openConversation(conversation)}
                    disabled={loading}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </button>
                  <button
                    className="chat-room-delete"
                    type="button"
                    onClick={(event) => removeConversation(event, conversation)}
                    disabled={loading}
                    aria-label={`${conversation.title} 삭제`}
                    title="채팅방 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {!conversations.length && <p className="chat-room-empty">저장된 채팅방이 없습니다.</p>}
            </div>
          </div>
        </details>
      </div>
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
