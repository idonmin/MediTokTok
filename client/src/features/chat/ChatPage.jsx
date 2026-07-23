import { useState } from 'react';
import { Send } from 'lucide-react';

const initialMessages = [
  { id: 1, role: 'assistant', content: '안녕하세요. 저장된 PubMed 논문에 대해 질문해 주세요.' },
];

export function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    setMessages((current) => [...current, { id: Date.now(), role: 'user', content: input }, { id: Date.now() + 1, role: 'assistant', content: 'SSE 스트리밍 연결 담당자가 구현할 응답 영역입니다.' }]);
    setInput('');
  };

  return (
    <section className="page-content chat-page">
      <div className="page-heading"><div><span className="eyebrow">RESEARCH CHAT</span><h1>논문과 대화하기</h1></div></div>
      <div className="chat-panel clay-panel">
        <div className="message-list">
          {messages.map((message) => <article key={message.id} className={`message ${message.role}`}><span>{message.role === 'user' ? '나' : '메디톡톡'}</span><p>{message.content}</p></article>)}
        </div>
        <form className="chat-input" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="저장된 논문 데이터에 대해 질문하세요." />
          <button className="icon-button primary" aria-label="전송"><Send size={18} /></button>
        </form>
      </div>
      <p className="safety-copy">메디톡톡은 논문 메타데이터 분석용이며 개인 의료 조언, 진단, 처방을 제공하지 않습니다.</p>
    </section>
  );
}
