import { ArrowRight, BookOpen, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';

export function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authError, configured, loading, session, signIn } = useAuth();
  const [status, setStatus] = useState('');

  const enter = async () => {
    const returnTo = location.state?.from?.pathname || '/app/overview';
    if (session) return navigate(returnTo);
    if (!configured) {
      setStatus('Supabase URL과 anon key를 설정해야 Google 로그인을 사용할 수 있습니다.');
      return undefined;
    }
    const { error } = await signIn(returnTo);
    if (error) setStatus(error.message);
    return undefined;
  };

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <strong>메디톡톡</strong>
        <button className="button button-ghost" onClick={enter} disabled={loading}>Google로 시작하기</button>
      </nav>
      <section className="hero clay-panel">
        <span className="eyebrow">PUBMED RESEARCH WORKSPACE</span>
        <h1>논문 탐색에서 인사이트까지,<br />한곳에서 톡톡.</h1>
        <p>PubMed 데이터를 수집하고 시각화하며, 저장된 연구를 바탕으로 AI와 대화하세요.</p>
        <button className="button button-primary" onClick={enter} disabled={loading}>
          {configured ? 'Google로 로그인' : '로그인 설정 필요'} <ArrowRight size={18} />
        </button>
        {(status || authError || location.state?.setupRequired) && (
          <small role="alert">{status || authError || '로그인 설정 후에만 서비스 화면에 접근할 수 있습니다.'}</small>
        )}
      </section>
      <section className="feature-grid">
        <article className="clay-panel"><BookOpen /><h2>논문 수집</h2><p>검색 조건으로 PubMed 메타데이터를 수집합니다.</p></article>
        <article className="clay-panel"><MessageSquareText /><h2>AI 챗봇</h2><p>저장된 논문을 기반으로 맥락 있는 대화를 이어갑니다.</p></article>
        <article className="clay-panel"><ShieldCheck /><h2>안전한 사용</h2><p>개인 의료 조언은 차단하고 연구 분석에 집중합니다.</p></article>
      </section>
    </main>
  );
}
