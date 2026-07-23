import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig } from '../config/env.js';

export const supabaseAuth = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } })
  : null;

export const supabaseAdmin = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

export function requireDatabase() {
  if (!supabaseAdmin) {
    const error = new Error('Supabase 서버 환경변수가 설정되지 않았습니다.');
    error.status = 503;
    throw error;
  }
  return supabaseAdmin;
}
