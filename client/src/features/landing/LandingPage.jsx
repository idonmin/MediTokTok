import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleUserRound,
  LogIn,
  LogOut,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';

const navigation = [
  { to: '/app/overview', label: '개요', icon: BarChart3 },
  { to: '/app/papers', label: '논문 목록', icon: BookOpen },
  { to: '/app/chat', label: '챗봇', icon: MessageSquareText },
];

export function LandingPage() {
  const location = useLocation();
  const { authError, configured, loading, session, signIn, signOut, user } = useAuth();
  const [status, setStatus] = useState('');
  const profileMenuRef = useRef(null);
  const profileName = user?.user_metadata?.full_name || user?.user_metadata?.name || '메디톡톡 사용자';

  useEffect(() => {
    const closeWhenClickingOutside = (event) => {
      const menu = profileMenuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    const closeWithEscape = (event) => {
      if (event.key === 'Escape' && profileMenuRef.current?.open) {
        profileMenuRef.current.open = false;
        profileMenuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  const enter = async () => {
    if (session) return;
    if (!configured) {
      setStatus('Supabase URL과 anon key를 설정해야 Google 로그인을 사용할 수 있습니다.');
      return;
    }
    const { error } = await signIn();
    if (error) setStatus(error.message);
  };

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="메인 내비게이션">
        <Link className="landing-brand" to="/">메디톡톡</Link>
        <div className="landing-nav-links">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link key={to} className="landing-nav-link" to={to}>
              <Icon size={16} />{label}
            </Link>
          ))}
        </div>
        <details className="profile-menu" ref={profileMenuRef}>
          <summary aria-label="사용자 프로필 보기" title="사용자 프로필">
            <CircleUserRound size={22} />
          </summary>
          <div className="profile-popover">
            <div className="profile-avatar"><CircleUserRound size={30} /></div>
            {user ? (
              <>
                <strong>{profileName}</strong>
                <span>{user.email}</span>
                <button className="profile-action" type="button" onClick={signOut}><LogOut size={16} />로그아웃</button>
              </>
            ) : (
              <>
                <strong>로그인이 필요합니다</strong>
                <span>Google 계정으로 로그인하면 모든 메뉴를 이용할 수 있습니다.</span>
                <button className="profile-action" type="button" onClick={enter} disabled={loading}><LogIn size={16} />Google로 로그인</button>
              </>
            )}
          </div>
        </details>
      </nav>

      <div className="landing-content">
        <section className="hero clay-panel">
          <span className="eyebrow">PUBMED RESEARCH WORKSPACE</span>
          <h1>논문 탐색에서 인사이트까지,<br />한곳에서 톡톡.</h1>
          <p>PubMed 데이터를 수집하고 시각화하며, 저장된 연구를 바탕으로 AI와 대화하세요.</p>
          {!session && (
            <button className="button button-primary" onClick={enter} disabled={loading}>
              {configured ? 'Google로 로그인' : '로그인 설정 필요'} <ArrowRight size={18} />
            </button>
          )}
          {(status || authError || location.state?.setupRequired) && (
            <small role="alert">{status || authError || '로그인 후 내비게이션에서 원하는 메뉴로 이동할 수 있습니다.'}</small>
          )}
        </section>
        <section className="feature-grid">
          <article className="clay-panel"><BookOpen /><h2>논문 수집</h2><p>검색 조건으로 PubMed 메타데이터를 수집합니다.</p></article>
          <article className="clay-panel"><MessageSquareText /><h2>AI 챗봇</h2><p>저장된 논문을 기반으로 맥락 있는 대화를 이어갑니다.</p></article>
          <article className="clay-panel"><ShieldCheck /><h2>안전한 사용</h2><p>개인 의료 조언은 차단하고 연구 분석에 집중합니다.</p></article>
        </section>
      </div>
    </main>
  );
}
