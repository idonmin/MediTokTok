# 팀 협업 가이드

## 추천 역할 분배

1. 수집 담당: 요구사항 1~2, PubMed API, 공용 `pubmed_records`와 사용자별 `user_paper_collections` 저장
2. 대시보드 담당: 요구사항 3~4·6, 차트·필터·CSV
3. 챗봇 담당: 요구사항 5·7·9, Memory·안전 필터·SSE
4. 인증/배포 담당: 요구사항 8·10, Google OAuth·RLS·배포

## 브랜치 예시

```text
feature/collection
feature/dashboard-papers
feature/chat
feature/auth-deploy
```

공용 파일(`App.jsx`, `app.js`, SQL migration)을 직접 크게 수정하기보다는 각 feature/module 폴더에 구현하고 마지막에 route만 연결합니다.

## 완료 기준

- 입력값과 오류 상태가 UI에 표시된다.
- 인증되지 않은 API 호출은 401을 반환한다.
- 사용자 A는 사용자 B의 채팅 기록을 볼 수 없다.
- PMID 중복 수집 시 삽입하지 않고 skip 수를 반환한다.
- 키와 service role 값이 Git에 포함되지 않는다.
