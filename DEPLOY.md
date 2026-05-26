# daily.Q.co.kr 배포 가이드

## 파일 구성
```
daily-q/
└── index.html   ← 이 파일 하나만 있으면 됩니다
```

---

## Cloudflare Pages 배포 (3단계)

### 1단계 — Pages 프로젝트 생성
1. https://dash.cloudflare.com 로그인
2. 왼쪽 메뉴 **Workers & Pages** → **Pages** 탭
3. **Create a project** → **Direct Upload** 선택
4. 프로젝트 이름: `daily-q` 입력 → **Create project**
5. `index.html` 파일을 드래그&드롭 업로드
6. **Deploy site** 클릭
   - 임시 URL: `daily-q.pages.dev` 로 배포됨

### 2단계 — 커스텀 도메인 연결
1. Pages 프로젝트 → **Custom domains** 탭
2. **Set up a custom domain** 클릭
3. `daily.q.co.kr` 입력 → **Continue**
4. Cloudflare가 자동으로 CNAME 레코드 생성 → **Activate domain** 확인

### 3단계 — 완료 확인
- https://daily.q.co.kr 접속
- 약 1~2분 내 HTTPS 인증서 자동 발급

---

## 향후 업데이트 방법

1. `index.html` 수정 후 저장
2. Pages 프로젝트 → **Deployments** → **Upload** (또는 GitHub 연동 시 자동)

---

## 기능 설명

| 기능 | 설명 |
|------|------|
| 실시간 시계 | KST 기준 1초 업데이트 |
| Cloudflare / Supabase 상태 | 공식 Status API 직접 연동 |
| 뉴스 피드 4탭 | rss2json.com API 경유 |
| 오늘의 학습 포커스 | 요일별 자동 표시 |
| 루틴 체크리스트 | 당일 체크 상태 localStorage 저장 (익일 초기화) |
| 메모 | 자동 저장 (localStorage) |
| 바로가기 링크 | 10개 핵심 사이트 |

---

## 주의사항

- 뉴스 피드는 rss2json.com 무료 API 사용 — 간헐적으로 느릴 수 있음
- 더 빠른 피드를 원하면 Cloudflare Worker 프록시 추가 가능 (별도 요청)
- 체크리스트·메모는 브라우저 저장소 사용 — 다른 기기와 동기화 안 됨
- 북마크 등록 권장: https://daily.q.co.kr
