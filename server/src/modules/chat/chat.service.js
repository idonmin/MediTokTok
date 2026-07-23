import { env } from '../../config/env.js';
import { requireOpenAI } from '../../lib/openai.js';
import { requireDatabase } from '../../lib/supabase.js';

export async function listConversations(userId) {
  const database = requireDatabase();
  const { data, error } = await database
    .from('chat_rooms')
    .select('id,title,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function createConversation(userId) {
  const database = requireDatabase();
  const { data, error } = await database
    .from('chat_rooms')
    .insert({
      user_id: userId,
      title: '새 채팅방',
    })
    .select('id,title,created_at,updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConversation(userId, conversationId) {
  const database = requireDatabase();
  const { data, error } = await database
    .from('chat_rooms')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const notFoundError = new Error('채팅방을 찾을 수 없습니다.');
    notFoundError.status = 404;
    throw notFoundError;
  }
  return data;
}

export async function loadConversation(userId, conversationId) {
  const database = requireDatabase();
  const { data, error } = await database
    .from('chat_messages')
    .select('id,role,content,created_at')
    .eq('user_id', userId)
    .eq('room_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).reverse();
}

export async function ensureConversation(userId, conversationId, firstMessage) {
  const database = requireDatabase();
  const { data: existing, error: selectError } = await database
    .from('chat_rooms')
    .select('user_id,title')
    .eq('id', conversationId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing && existing.user_id !== userId) {
    const error = new Error('대화를 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }
  if (existing) {
    if (existing.title === '새 대화' || existing.title === '새 채팅방') {
      const title = firstMessage.replace(/\s+/g, ' ').trim().slice(0, 60) || '새 채팅방';
      const { error: updateError } = await database
        .from('chat_rooms')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', userId);
      if (updateError) throw updateError;
    }
    return;
  }

  const title = firstMessage.replace(/\s+/g, ' ').trim().slice(0, 60) || '새 대화';
  const { error } = await database.from('chat_rooms').insert({
    id: conversationId,
    user_id: userId,
    title,
  });
  if (error) throw error;
}

export async function saveMessage({ userId, conversationId, role, content }) {
  const database = requireDatabase();
  const { error } = await database.from('chat_messages').insert({
    user_id: userId,
    room_id: conversationId,
    role,
    content,
  });
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
