# 도란

최신 소스: 집·회사·도란 고등학교·광장, 캐릭터 편집과 관계 설정, 기본 대사 및 대화 기억 수정 기능 포함.

**GitHub 업로드 방법은 `GITHUB_UPLOAD.md`를 먼저 확인하세요.** 이 ZIP은 소스 저장소용이며, GitHub Pages에 올리는 것만으로 서버 기능이 실행되지는 않습니다. 기존 배포의 프로젝트 ID·계정 데이터·API 키는 포함하지 않습니다.

캐릭터 2~6명이 함께 생활하는 관찰형 웹게임 MVP. 크림·살구색의 반응형 UI, 직접 올린 캐릭터 이미지, 규칙 기반 생활과 선택적 AI 대사를 제공합니다.

## MVP 구조

- `lib/world.ts`: 타입, 검증, 캐릭터 상한, 하루 일정, 시간 진행, 같은 공간의 대화 상대 선택, 기본 대사.
- `app/Simulator.tsx`: 편집과 관찰 UI. React state로 진행하고 localStorage로 기기별 자동 보관.
- `app/api/worlds/route.ts`: D1에 변경 불가능한 세계 스냅샷 저장 / UUID로 조회.
- `app/api/dialogue/route.ts`: 서버 전용 AI 호출. 입력·출력 moderation, 20초 제한, 실패 시 기본 대사.
- `db/schema.ts`, `drizzle/`: 저장 테이블 및 schema-only migration.
- `/world/:id`: 저장한 시점에서 각자 진행하는 관람 화면. 원본 편집 불가.
- `/embed/:id`: 사이드 메뉴를 뺀 iframe용 관람 화면.

## 데이터 모델

| 개체 | 필드 |
|---|---|
| World | version, name, day, minute, places[], characters[], relations[], logs[] |
| Place | id, name, type(집/직장/학교/광장/기타) |
| Character | id, name, image(data URL), age, personality, speech, job, likes, dislikes, habits, mood, fatigue, home, destination, wake, leave, back, sleep, homework, parents[] |
| Relation | a, b, type, affinity(0~100) |
| Log | day, time, speaker, text, mode |
| DB World | id(UUID), data(JSON), created(timestamp) |

최대 인원은 `MAX_CHARACTERS` 한 곳에서 바꿉니다. 관계 검증의 최대 15개도 인원 상한에 맞춰 계산합니다. 시간은 0~1439분이며 주말에는 외출을 생략합니다. 각 캐릭터의 취침/기상, 출근/등교, 귀가를 평가하고 저녁·숙제·자유 시간을 배치합니다. 1배속에서 실제 2초가 게임 5분입니다. 대화는 게임 30분 주기로, 같은 공간에 있고 깨어 있는 두 사람만 대상으로 생성합니다. 생성 요청이 진행 중이면 추가 요청을 하지 않습니다. 대화마다 해당 관계 친밀도가 1 증가합니다. 로그는 최근 200개를 보관합니다.

## 실행과 배포

Node 22.13 이상, pnpm 사용. 저장소를 GitHub로 옮길 때 비밀키·환경 파일·`.wrangler`·빌드 결과를 커밋하지 마세요. `.gitignore` 참고.

```sh
pnpm install
pnpm exec drizzle-kit generate
pnpm dev
pnpm build
```

Cloudflare Workers + D1 기반 Vinext 앱입니다. Sites 외부에 배포하려면 이 저장소의 Sites 빌드 연동을 자체 Cloudflare 배포 구성으로 교체하고 DB binding 및 마이그레이션을 연결하세요. 순수 정적 GitHub Pages만으로 서버 API와 저장 기능은 동작하지 않습니다.

## AI 연결 (MVP 02)

사이트의 **AI 연결** 메뉴에서 OpenAI / Gemini / Claude 선택 → 텍스트 모델 ID와 해당 제공자의 API 키 입력 → **연결 확인 후 저장**. 짧은 테스트 대사와 안전 검사를 실제로 요청하며 비용이 발생할 수 있습니다. 연결 실패 시 기존 연결을 유지합니다. 연결 해제는 저장된 암호화 키를 삭제합니다. 안내의 공식 링크에서 사용 가능한 모델 및 키를 확인하세요.

`app/api/ai-settings/route.ts`는 Sites 로그인 사용자를 서버에서 확인하고 same-origin JSON 요청만 허용합니다. `ai_settings` D1 테이블은 계정 ID를 기본키로 쓰며 API 키는 AES-256-GCM과 계정 ID AAD로 암호화합니다. 서버 secret `AI_VAULT_SECRET`은 32바이트 난수를 64자리 hex로 설정해야 합니다. 실제 값은 소스에 저장하지 마세요. 이 secret을 교체하면 기존 암호문을 읽을 수 없어 키 재등록이 필요합니다.

브라우저는 등록할 때만 키를 서버로 전송합니다. API 응답은 원문 키를 돌려주지 않으며 입력란은 요청 완료 후 비웁니다. localStorage, 세계 스냅샷, JSON 내보내기, 공유 링크, 대화 기억에는 API 키가 들어가지 않습니다. 공유 관람자는 본인 계정에 등록한 키만 사용하며 원본 작성자의 키를 사용하지 않습니다. 익명 사용자는 기본 대사를 사용합니다. API는 제공자별로 고정된 HTTPS 주소만 호출하며 사용자 지정 URL 및 리다이렉트를 허용하지 않습니다.

`lib/ai-providers.ts`: 제공자 목록과 검증. `lib/key-vault.ts`: 암호화. `lib/ai-server.ts`: 제공자 어댑터와 안전검사. OpenAI는 Moderations API, Gemini/Claude는 같은 제공자에게 SAFE/BLOCK 분류를 별도 요청합니다. 지침과 입력·출력 검사를 통과하지 못하면 안전한 고정 대사로 전환합니다. 20초 서버 타임아웃, 계정별 4초 대화 요청 간격을 적용합니다. 외부 제공자 오류의 원문은 키 유출을 막기 위해 전달하지 않습니다.

실제 제공자 키가 제공되지 않아 실제 AI 성공 경로는 검증하지 않았습니다. 로그인/권한/잔액/모델 호환 오류는 안내 메시지 및 기본 대사로 처리합니다. 안전 분류는 완벽한 검열 또는 공인 등급 심사를 의미하지 않습니다.

## 기본 대사와 기억

캐릭터 필드에 `baseLines?: string[]`(20개, 각 200자), `remember?: boolean`, `memories?: Memory[]`(최근 40개)가 추가됩니다. 이전 세계 파일도 호환되며 초기 예제 ID a/b의 이름이 정확히 서윤/도하인 경우에만 A/B로 바꿉니다. 사용자가 바꾼 이름은 유지합니다.

Memory는 `id, day, time, withId, speakerId, text, source`를 저장합니다. 실제 발언을 보관하며 내용을 사실로 추론하거나 가상의 과거를 생성해 저장하지 않습니다. 양쪽 참가자가 기억을 켠 경우 각자 보관합니다. 생성할 때 둘 사이의 중복 없는 최근 12개 및 생활 사건 5개를 전달합니다. 기본 대사는 말투 예문으로 보내고 모델에 반복을 피하도록 지시합니다. API가 없을 때는 `{name}`/`{self}`를 치환하고 최근 8개와 겹치지 않는 기본 대사를 우선 선택합니다.

이는 모델 가중치를 재학습하는 기능이 아니라 저장한 대화 맥락을 사용하는 방식입니다. 무한한 기억·풍부함을 보장하지 않습니다. 캐릭터 편집에서 기억을 끄거나 내용을 수정하고 개별/전체 삭제할 수 있고, 캐릭터 저장 시 적용합니다. 상대 캐릭터가 보관한 기억은 별도이며 공유·파일 내보내기에 기억이 포함됨을 UI에 안내합니다.

## 저장·공유의 의미

저장할 때마다 새 스냅샷 ID가 생성됩니다. 원본 덮어쓰기·수정 API가 없으며 관람자의 진행은 소유자의 기기 저장본에 영향을 주지 않습니다. 링크를 아는 사람에게 스냅샷을 보여주려는 설계이며 인증·공개 여부는 호스트 접근 정책이 추가로 제어합니다. 현재 Sites 배포는 비공개입니다. 외부 공개 공유·iframe은 호스트 공개 설정 및 frame 정책이 허용되어야 합니다. iframe 경로 구현과 외부 호스트에서의 삽입 검증은 별개입니다.

JSON 내보내기/불러오기로 이동 가능합니다. 아직 사용자 계정별 세계 목록, 스냅샷 삭제, 수정 동기화, 서버에서 백그라운드로 흐르는 시간, 실시간 다중 관람은 없습니다. 공개 운영 전에는 서버 저장/AI 요청의 사용자별 rate limit과 사용량 예산, 업로드·설정 검열, 관리 기능을 추가하세요.

## 검증

`node --experimental-strip-types --test tests/*.test.mjs` 및 `pnpm exec tsc --noEmit`. 일정, 저장 데이터 검증, 기억 제한·참가자 필터·기억 비활성화, 기본 대사 치환, 암호화/계정 경계/변조 감지를 테스트합니다.
