import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/app/overview', { replace: true }), 600);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return <main className="center-page">로그인을 완료하는 중입니다.</main>;
}
