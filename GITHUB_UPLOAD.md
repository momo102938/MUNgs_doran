# GitHub에 도란 올리기

1. ZIP 압축을 풀어요.
2. GitHub 저장소를 만들어요.
3. ZIP 자체가 아니라 `doran` 폴더 안의 파일과 폴더를 저장소 최상위에 올려요.
4. `.gitignore`, `.env.example`, `.openai/hosting.json` 등 숨김 파일도 포함해 주세요.

## Cloudflare에서 웹으로 실행하기

이 프로젝트는 서버 API와 D1 데이터베이스를 사용합니다. GitHub Pages 또는 Cloudflare의 **Upload your static files**로는 동작하지 않습니다.

1. Cloudflare에서 **Storage & databases → D1 SQL Database**로 가서 `doran-db`를 만들고 Database ID를 복사합니다.
2. **Workers & Pages → Create application → Continue with GitHub**에서 `MUNgs_doran`을 선택합니다.
3. Project name은 `mungs-doran`, Build command는 `pnpm run build`, Deploy command는 `pnpm run deploy`로 둡니다. Preview builds는 끕니다.
4. 배포 설정의 Build variables에 `DORAN_D1_DATABASE_ID`를 만들고 1번에서 복사한 ID를 입력합니다.
5. Worker의 **Settings → Variables and Secrets**에서 `AI_VAULT_SECRET`, `SESSION_SECRET`을 Secret으로 추가합니다. `AI_VAULT_SECRET`은 32바이트 난수의 64자리 hex이고, `SESSION_SECRET`은 충분히 긴 임의 문자열이어야 합니다. 이 값은 GitHub에 올리지 않습니다.
6. Deploy를 누릅니다. 배포 스크립트가 D1 마이그레이션을 적용한 뒤 Worker를 배포합니다. 성공하면 `*.workers.dev` 주소에서 확인합니다.

## 로컬 실행

Node 22.13 이상과 pnpm이 필요합니다.

```sh
pnpm install
pnpm exec drizzle-kit generate
pnpm dev
pnpm build
```

## 보안 메모

방문자의 API 키는 Worker가 사용자별 서명 쿠키 ID로 연결하고, D1에는 `AI_VAULT_SECRET`으로 암호화해 저장합니다. 실제 API 키와 두 서버 secret을 GitHub에 커밋하지 마세요. 공개 운영 전에는 rate limit과 사용량 예산을 설정하세요.
