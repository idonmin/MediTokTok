# 요구사항별 파일 지도

| 번호 | 기능 | 프론트엔드 | 백엔드/DB |
|---|---|---|---|
| 1 | PubMed 검색 조건 | `client/src/features/collection/CollectionPanel.jsx` | `server/src/modules/collection/collection.routes.js` |
| 2 | 수집·중복 방지 | `client/src/features/collection/collection.api.js` | `collection.service.js`, Supabase `pubmed_records` 테이블 |
| 3 | 개요·시각화 | `client/src/features/overview/OverviewPage.jsx` | `overview.routes.js` |
| 4 | 논문 검색 | `client/src/features/papers/PapersPage.jsx`, `PaperFilters.jsx` | `papers.routes.js` |
| 5 | Memory 챗봇 | `client/src/features/chat/ChatPage.jsx` | `chat.routes.js`, `chat.service.js`, 채팅 테이블 |
| 6 | CSV 다운로드 | `client/src/features/papers/CsvExportButton.jsx` | `papers.routes.js`의 `/export` |
| 7 | 의료 질문 차단 | 채팅 안내 UI | `server/src/middleware/medicalSafety.js` |
| 8 | OAuth·랜딩·기록 | `landing`, `auth` 폴더 | Supabase Auth, RLS 정책 |
| 9 | Claymorphism·stream | `client/src/styles`, `ChatPage.jsx` | `chat.routes.js`의 SSE |
| 10 | 배포 | `client/vite.config.js` | `server/src/server.js`, 환경변수 |

같은 기능의 파일을 여러 요구사항 번호가 공유합니다. 팀원은 번호보다 기능 폴더 단위로 맡는 편이 충돌이 적습니다.
