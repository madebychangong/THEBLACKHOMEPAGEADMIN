# 더블랙샵 관리자

이 폴더는 관리자 편집기 전용입니다. 별도 관리자 도메인에 연결하세요.

## Cloudflare Pages 설정

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables:
  - `NODE_VERSION=22`
  - `ADMIN_PASSWORD=관리자비밀번호`
  - `SESSION_SECRET=긴랜덤문자열`
  - `ADMIN_HOSTS=관리자도메인`
- KV binding: `THEBLACK_KV`

손님용 폴더와 같은 KV namespace를 `THEBLACK_KV` 이름으로 연결해야 저장값이 손님용 홈페이지에 반영됩니다.
