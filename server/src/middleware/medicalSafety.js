export const MEDICAL_SAFETY_MESSAGE = '이 앱은 PubMed 메타데이터 분석용이며, 개인 의료 조언, 진단, 처방 관련 질문에는 답변할 수 없습니다. 의료 관련 결정은 의료 전문가와 상담해 주세요.';

const personalAdvicePatterns = [
  /먹어도\s*되/i,
  /복용해도/i,
  /처방/i,
  /진단/i,
  /증상.*어떻게/i,
  /내가.*아픈/i,
  /타이레놀/i,
  /용량.*얼마/i,
];

export function medicalSafety(req, res, next) {
  const message = String(req.body?.message || '');
  if (personalAdvicePatterns.some((pattern) => pattern.test(message))) {
    return res.status(422).json({ code: 'MEDICAL_ADVICE_BLOCKED', message: MEDICAL_SAFETY_MESSAGE });
  }
  return next();
}
