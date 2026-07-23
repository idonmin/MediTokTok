export const MEDICAL_SAFETY_MESSAGE = '이 앱은 PubMed 메타데이터 분석용이며, 개인 의료 조언, 진단, 처방 관련 질문에는 답변할 수 없습니다. 의료 관련 결정은 의료 전문가와 상담해 주세요.';

const personalAdvicePatterns = [
  /(?:먹|복용|사용|투여|맞|끊).{0,18}(?:어도|해도|해야|할까|되나|되나요|괜찮)/i,
  /(?:진단|처방|치료).{0,20}(?:해\s*줘|해주세요|받아야|필요|어떻게)/i,
  /(?:나는|제가|저는|내|제|우리\s*(?:아이|가족)|증상).{0,35}(?:진단|처방|치료|약|병원)/i,
  /(?:용량|복용량|몇\s*알|하루\s*몇).{0,20}(?:얼마|먹|복용|적당)/i,
  /음주.{0,24}(?:약|타이레놀|복용|먹)/i,
  /타이레놀.{0,24}(?:먹|복용|용량|괜찮|되)/i,
];

export function isMedicalAdvice(message) {
  const normalized = String(message || '').replace(/\s+/g, ' ').trim();
  return personalAdvicePatterns.some((pattern) => pattern.test(normalized));
}

export function medicalSafety(req, res, next) {
  if (isMedicalAdvice(req.body?.message)) {
    return res.status(422).json({ code: 'MEDICAL_ADVICE_BLOCKED', message: MEDICAL_SAFETY_MESSAGE });
  }
  return next();
}
