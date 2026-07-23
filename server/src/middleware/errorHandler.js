export function notFound(req, res) {
  res.status(404).json({ message: '요청한 API를 찾을 수 없습니다.' });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || '서버 오류가 발생했습니다.' });
}
