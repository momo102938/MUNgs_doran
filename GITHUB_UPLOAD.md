# GitHub에 도란 올리기

1. ZIP 압축을 풉니다.
2. GitHub에서 새 저장소를 만듭니다. 이름 예: `doran`.
3. `doran` 폴더 안의 파일들을 저장소 최상위에 올립니다. ZIP 파일 자체를 올리는 것이 아닙니다.
4. `package.json`, `app`, `lib`, `db`, `drizzle`, `scripts` 등이 최상위에 보이면 됩니다.

숨김 파일인 `.gitignore`, `.env.example`, `.openai/hosting.json`도 포함해야 합니다. Git으로 올리면 빠뜨리지 않을 수 있습니다.

```sh
cd doran
git init
git add .
git commit -m "Add Doran life simulation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/doran.git
git push -u origin main
```

`YOUR_USERNAME`을 본인 GitHub 아이디로 바꾸세요. 이미 Git 저장소가 있다면 새로 초기화하지 말고 기존 저장소에 파일을 복사해 커밋하세요.

## 로컬 실행

Node.js 22.13 이상과 package.json에 명시된 pnpm 버전을 사용합니다.

```sh
pnpm install
pnpm build
```

최초 실행에서 로컬 DB 테이블을 만듭니다. 각 마이그레이션은 한 번만 적용합니다.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_brainy_imperial_guard.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_lucky_the_fury.sql
pnpm dev
```

터미널에 표시되는 로컬 주소를 엽니다.

```sh
pnpm test
pnpm typecheck
```

## GitHub 저장과 웹 배포는 다릅니다

이 소스는 React/Vinext + Cloudflare Workers/D1 구조입니다. **GitHub Pages만으로는 AI 키 저장·AI 요청·세계 서버 저장이 동작하지 않습니다.**

현재 로그인과 빌드에는 ChatGPT Sites 연동 코드가 포함되어 있습니다. 다른 호스팅에 운영 배포하려면 Cloudflare D1 연결과 마이그레이션, 서버 비밀값 설정에 더해 인증 연동을 해당 환경에 맞춰 교체해야 합니다. 이 ZIP은 다른 호스팅으로의 즉시 배포를 보장하는 템플릿이 아닙니다.

기존 Sites의 프로젝트 ID는 제거했습니다. 기존 사이트와 연결하지 않고 새 소스 저장소로 사용할 수 있습니다. 기존 사이트의 배포 설정은 변경하지 않았습니다.

## API 키와 로그인

서버의 `AI_VAULT_SECRET`은 임의의 32바이트 키를 64자리 hex로 생성해 비밀값으로 설정합니다. 실제 값은 저장소에 올리지 마세요. `.env.example`에는 이름만 기재되어 있습니다.

AI 키는 실행 중인 사이트에서 본인 계정으로 로그인한 뒤 **AI 연결** 메뉴에서 등록합니다. 인증되지 않은 사용자는 AI 키를 등록할 수 없습니다. Sites 밖에서 배포할 때는 `app/chatgpt-auth.ts`와 호스트의 신뢰할 수 있는 인증 경계를 반드시 맞춰야 합니다. 외부 요청이 인증 헤더를 직접 지정할 수 있는 상태로 공개하면 안 됩니다.

서버 DB의 저장된 세계·암호화된 API 키·사용자의 이미지와 대화 데이터는 ZIP에 포함되어 있지 않습니다. 기본 예제 캐릭터와 코드만 포함합니다.
