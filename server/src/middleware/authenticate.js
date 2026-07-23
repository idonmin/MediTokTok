import { hasSupabaseConfig } from '../config/env.js';
import { supabaseAuth } from '../lib/supabase.js';

export async function authenticate(req, res, next) {
  if (!hasSupabaseConfig) {
    req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'demo@local' };
    return next();
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: '로그인이 필요합니다.' });

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ message: '유효하지 않은 로그인입니다.' });
  req.user = data.user;
  return next();
}
