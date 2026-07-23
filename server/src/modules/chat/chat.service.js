import { env } from '../../config/env.js';
import { requireOpenAI } from '../../lib/openai.js';
import { requireDatabase } from '../../lib/supabase.js';

export async function loadConversation(userId, conversationId) {
  const database = requireDatabase();
  const { data, error } = await database.from('chat_messages').select('role,content').eq('user_id', userId).eq('conversation_id', conversationId).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function ensureConversation(userId, conversationId) {
  const database = requireDatabase();
  const { error } = await database.from('chat_conversations').upsert(
    { id: conversationId, user_id: userId },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function saveMessage({ userId, conversationId, role, content }) {
  const database = requireDatabase();
  const { error } = await database.from('chat_messages').insert({ user_id: userId, conversation_id: conversationId, role, content });
  if (error) throw error;
}

export async function createChatStream(messages) {
  const client = requireOpenAI();
  return client.chat.completions.create({
    model: env.openaiModel,
    stream: true,
    messages: [
      { role: 'system', content: '너는 메디톡톡의 PubMed 메타데이터 분석 도우미다. 개인 의료 조언, 진단, 처방은 제공하지 않는다.' },
      ...messages,
    ],
  });
}
