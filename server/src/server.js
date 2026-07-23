import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`메디톡톡 API가 http://localhost:${env.port} 에서 실행 중입니다.`);
});
