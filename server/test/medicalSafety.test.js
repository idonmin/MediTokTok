import assert from 'node:assert/strict';
import test from 'node:test';
import { isMedicalAdvice, medicalSafety, MEDICAL_SAFETY_MESSAGE } from '../src/middleware/medicalSafety.js';

test('개인 의료 조언 질문을 감지한다', () => {
  const blocked = [
    '음주 후 타이레놀 먹어도 되나요?',
    '제가 이 약을 복용해도 괜찮을까요?',
    '제 증상을 진단해 주세요.',
    '하루 몇 알 먹어야 하나요?',
  ];
  blocked.forEach((message) => assert.equal(isMedicalAdvice(message), true, message));
});

test('일반적인 PubMed 연구 질문은 허용한다', () => {
  const allowed = [
    '타이레놀 관련 논문은 몇 편인가요?',
    '2024년 진단 기술 연구의 저널별 추세를 알려줘.',
    '백신 연구의 주요 키워드를 요약해 줘.',
  ];
  allowed.forEach((message) => assert.equal(isMedicalAdvice(message), false, message));
});

test('차단 시 고정 안내문과 422 상태를 반환한다', () => {
  const req = { body: { message: '음주 후 타이레놀 먹어도 되나요?' } };
  let result;
  const res = {
    status(status) {
      result = { status };
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };

  medicalSafety(req, res, () => assert.fail('차단 질문에서 next가 호출되면 안 됩니다.'));
  assert.deepEqual(result, {
    status: 422,
    body: { code: 'MEDICAL_ADVICE_BLOCKED', message: MEDICAL_SAFETY_MESSAGE },
  });
});
