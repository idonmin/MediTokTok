import OpenAI from 'openai';
import { env } from '../config/env.js';

export const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export function requireOpenAI() {
  if (!openai) {
    const error = new Error('OPENAI_API_KEY가 서버에 설정되지 않았습니다.');
    error.status = 503;
    throw error;
  }
  return openai;
}
