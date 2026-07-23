# 메디톡톡

PubMed 논문을 수집·검색·분석하고, 저장된 논문을 바탕으로 대화할 수 있는 팀 프로젝트용 웹 앱 뼈대입니다.

## 기술 스택

- Frontend: React, Vite, React Router, Recharts
- Backend: Node.js, Express
- Auth/DB: Supabase Auth, PostgreSQL
- External APIs: NCBI E-utilities, OpenAI API

## 빠른 시작

```bash
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
npm run dev
```

`client/.env`와 `server/.env`에는 각 폴더에 필요한 항목만 남기고 실제 값을 입력합니다. Supabase SQL Editor에서 `supabase/migrations/001_initial_schema.sql`을 실행한 뒤 Google Provider와 Redirect URL을 설정합니다.

- Client: http://localhost:5173
- Server health: http://localhost:4000/api/health

환경변수가 없어도 UI와 health API는 실행되지만 로그인, DB, PubMed 및 AI 기능은 실제 동작하지 않습니다.

## 협업 시작점

- 요구사항-파일 매핑: `docs/requirements-map.md`
- 브랜치 및 역할 분배: `docs/team-guide.md`
- 배포 담당 체크리스트: `docs/deployment.md`
- DB 스키마: `supabase/migrations/001_initial_schema.sql`

API 키는 React의 `VITE_*` 변수나 Supabase 테이블에 저장하지 않습니다. Express 서버의 환경변수 또는 배포 플랫폼의 Secret에 저장합니다.
