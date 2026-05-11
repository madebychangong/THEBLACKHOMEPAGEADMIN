# THE BLACK SHOP Homepage

프리미엄 다크 톤의 방문자용 홈페이지와 가격표 중심 미니 관리자 편집기입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

- 방문자 화면: `http://localhost:5173`
- 관리자 화면: `http://localhost:5173/admin`
- Vite 개발 모드에서는 Cloudflare Functions가 없으므로 브라우저 `localStorage`에 저장되는 로컬 미리보기 모드로 동작합니다.

## Cloudflare Pages 배포

1. Cloudflare Pages에서 이 폴더를 프로젝트 루트로 연결합니다.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Pages Functions 환경변수를 추가합니다.

```text
ADMIN_PASSWORD=관리자-비밀번호
SESSION_SECRET=긴-랜덤-문자열
ADMIN_HOSTS=관리자전용도메인.com
```

5. KV namespace를 만들고 Pages/Workers binding 이름을 `THEBLACK_KV`로 연결합니다.

`ADMIN_HOSTS`에 들어간 도메인에서만 관리자 화면과 관리자 API가 열립니다. 고객용 도메인에서 `/admin`으로 접속하면 404가 반환됩니다.

## 구조

- `src/`: React 방문자 화면과 관리자 편집기
- `functions/api/`: Cloudflare Pages Functions API
- `public/hero-blackshop.png`: 홈페이지 히어로 이미지
- `src/data/defaultCatalog.ts`: 초기 가격표 데이터

## 관리자에서 수정 가능한 것

- 첫 화면 문구
- 채널톡 플러그인 키
- 카카오 오픈채팅 주소
- 상담 수치 기준값
- 가격표 섹션 제목, 소제목, 노출 여부, 순서
- 상품명, 단위/설명, 가격, 배지, 노출 여부, 순서
- 템플릿 스타일: 기본, 추천 강조, 인기 상품, 품절/중지, 이벤트 가격
