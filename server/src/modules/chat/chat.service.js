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

export async function createPaperConversation(userId, pmids) {
  const database = requireDatabase();
  const uniquePmids = [...new Set(pmids)];
  const { data: ownedPapers, error: ownershipError } = await database
    .from('user_paper_collections')
    .select('pmid')
    .eq('user_id', userId)
    .in('pmid', uniquePmids);
  if (ownershipError) throw ownershipError;

  const ownedPmids = new Set((ownedPapers || []).map((paper) => paper.pmid));
  if (uniquePmids.some((pmid) => !ownedPmids.has(pmid))) {
    const ownershipFailure = new Error('내 논문 목록에 없는 논문이 포함되어 있습니다.');
    ownershipFailure.status = 400;
    throw ownershipFailure;
  }

  const { data: conversation, error: roomError } = await database
    .from('chat_rooms')
    .insert({
      user_id: userId,
      title: `선택 논문 ${uniquePmids.length}편 분석`,
    })
    .select('id,title,created_at,updated_at')
    .single();
  if (roomError) throw roomError;

  const { error: linksError } = await database.from('chat_room_papers').insert(
    uniquePmids.map((pmid) => ({
      room_id: conversation.id,
      user_id: userId,
      pmid,
    })),
  );
  if (linksError) {
    await database
      .from('chat_rooms')
      .delete()
      .eq('id', conversation.id)
      .eq('user_id', userId);
    throw linksError;
  }

  return {
    ...conversation,
    paper_count: uniquePmids.length,
  };
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

export async function loadConversationPapers(userId, conversationId) {
  const database = requireDatabase();
  const { data, error } = await database
    .from('chat_room_papers')
    .select('pmid,pubmed_records!inner(title,abstract,journal,pub_year,authors)')
    .eq('user_id', userId)
    .eq('room_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((link) => ({
    pmid: link.pmid,
    ...link.pubmed_records,
  }));
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

export function buildPaperContext(papers) {
  return papers.map((paper, index) => [
    `[선택 논문 ${index + 1}]`,
    `PMID: ${paper.pmid}`,
    `제목: ${paper.title}`,
    `저널: ${paper.journal || '정보 없음'}`,
    `연도: ${paper.pub_year || '정보 없음'}`,
    `저자: ${paper.authors?.join(', ') || '정보 없음'}`,
    `초록: ${(paper.abstract || '초록 없음').slice(0, 6000)}`,
  ].join('\n')).join('\n\n');
}

export function buildChatSystemPrompt(papers = []) {
  return papers.length
    ? [
        '너는 메디톡톡의 선택 논문 전용 분석 도우미다.',
        '아래 제공된 선택 논문의 내용만 근거로 답변해야 한다.',
        '일반 지식이나 선택되지 않은 다른 논문의 내용을 추가하지 마라.',
        '질문에 답할 근거가 선택 논문에 없으면 "선택한 논문에서 확인할 수 없습니다."라고 명확히 안내하라.',
        '가능하면 근거가 된 PMID를 함께 표시하라.',
        '개인 의료 조언, 진단, 처방은 제공하지 않는다.',
        '',
        buildPaperContext(papers),
      ].join('\n')
    : '너는 메디톡톡의 PubMed 메타데이터 분석 도우미다. 개인 의료 조언, 진단, 처방은 제공하지 않는다.';
}

export async function createChatStream(messages, papers = []) {
  const client = requireOpenAI();
  return client.chat.completions.create({
    model: env.openaiModel,
    stream: true,
    messages: [
      { role: 'system', content: buildChatSystemPrompt(papers) },
      ...messages,
    ],
  });
}
