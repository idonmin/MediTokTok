import { ArrowRight, BookOpen, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';

export function LandingPage() {
  const navigate = useNavigate();
  const { configured, session, signIn } = useAuth();

  const enter = async () => {
    if (session || !configured) navigate('/app/overview');
    else await signIn();
  };

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <strong>메디톡톡</strong>
        <button className="button button-ghost" onClick={enter}>Google로 시작하기</button>
      </nav>
      <section className="hero clay-panel">
        <span className="eyebrow">PUBMED RESEARCH WORKSPACE</span>
        <h1>논문 탐색에서 인사이트까지,<br />한곳에서 톡톡.</h1>
        <p>PubMed 데이터를 수집하고 시각화하며, 저장된 연구를 바탕으로 AI와 대화하세요.</p>
        <button className="button button-primary" onClick={enter}>
          {configured ? 'Google로 로그인' : '데모 화면 열기'} <ArrowRight size={18} />
        </button>
        {!configured && <small>Supabase 환경변수를 설정하면 로그인이 활성화됩니다.</small>}
      </section>
      <section className="feature-grid">
        <article className="clay-panel"><BookOpen /><h2>논문 수집</h2><p>검색 조건으로 PubMed 메타데이터를 수집합니다.</p></article>
        <article className="clay-panel"><MessageSquareText /><h2>AI 챗봇</h2><p>저장된 논문을 기반으로 맥락 있는 대화를 이어갑니다.</p></article>
        <article className="clay-panel"><ShieldCheck /><h2>안전한 사용</h2><p>개인 의료 조언은 차단하고 연구 분석에 집중합니다.</p></article>
      </section>
    </main>
  );
}
