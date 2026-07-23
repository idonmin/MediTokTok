import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError('');
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    authError,
    configured: isSupabaseConfigured,
    signIn: async (returnTo = '/app/overview') => {
      if (!supabase) return { error: new Error('Supabase 환경변수가 설정되지 않았습니다.') };
      const safeReturnTo = returnTo.startsWith('/app/') ? returnTo : '/app/overview';
      sessionStorage.setItem('authReturnTo', safeReturnTo);
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (result.error) setAuthError(result.error.message);
      return result;
    },
    signOut: async () => supabase?.auth.signOut(),
  }), [authError, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
