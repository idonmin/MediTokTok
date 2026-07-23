# 요구사항 10 - 배포 체크리스트

클라이언트와 서버를 따로 배포하는 구성을 기준으로 합니다.

## Client

- Build command: `npm run build -w client`
- Output directory: `client/dist`
- `VITE_API_URL`: 배포된 Express API의 `/api` 주소
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: 공개 가능한 Supabase 클라이언트 값
- SPA fallback이 `/index.html`로 연결되는지 확인

## Server

- Start command: `npm run start -w server`
- `CLIENT_URL`: 배포된 클라이언트 Origin
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `NCBI_API_KEY`: 배포 플랫폼 Secret에만 저장
- health check path: `/api/health`

## Supabase/Google OAuth

- Site URL을 배포된 클라이언트 주소로 변경
- Redirect URL에 `https://클라이언트주소/auth/callback` 추가
- Google Cloud Console의 Authorized redirect URI와 Supabase 안내 URI 일치 확인
- `supabase/migrations`의 SQL 파일을 번호 순서대로 실행하고 RLS 및 API 역할 권한 확인

호스팅 플랫폼이 정해지면 해당 플랫폼 설정 파일은 배포 담당 브랜치에서 추가합니다.
