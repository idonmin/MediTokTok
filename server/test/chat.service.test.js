import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChatSystemPrompt, buildPaperContext } from '../src/modules/chat/chat.service.js';

const selectedPaper = {
  pmid: '12345678',
  title: 'Selected paper title',
  abstract: 'Selected paper abstract',
  journal: 'Test Journal',
  pub_year: 2025,
  authors: ['First Author', 'Second Author'],
};

test('선택 논문의 PMID와 메타데이터만 AI 문맥으로 만든다', () => {
  const context = buildPaperContext([selectedPaper]);

  assert.match(context, /PMID: 12345678/);
  assert.match(context, /Selected paper title/);
  assert.match(context, /Selected paper abstract/);
  assert.doesNotMatch(context, /unselected paper/i);
});

test('선택 논문 채팅은 제공된 논문 밖의 답변을 제한한다', () => {
  const prompt = buildChatSystemPrompt([selectedPaper]);

  assert.match(prompt, /선택 논문의 내용만 근거로 답변/);
  assert.match(prompt, /선택한 논문에서 확인할 수 없습니다/);
  assert.match(prompt, /PMID: 12345678/);
});
