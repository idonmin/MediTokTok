import { useEffect } from 'react';
import { useAuth } from './auth-context.js';

export function AuthCallbackPage() {
  const { authError, configured, loading, session } = useAuth();
  const providerError = new URLSearchParams(window.location.search).get('error_description');

  useEffect(() => {
    if (!session) return;
    window.location.replace('/');
  }, [session]);

  if (!configured) return <main className="center-page">Supabase 로그인 설정이 필요합니다.</main>;
  if (providerError || authError) return <main className="center-page">로그인에 실패했습니다: {providerError || authError}</main>;
  if (!loading && !session) return <main className="center-page">로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.</main>;
  return <main className="center-page">로그인을 완료하는 중입니다.</main>;
}
