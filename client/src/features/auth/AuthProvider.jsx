import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signIn: async () => {
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    },
    signOut: async () => supabase?.auth.signOut(),
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
