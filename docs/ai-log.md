# AI 협업 기록

단계마다 목표, 완료 조건, 확인 방법, AI가 틀린 곳을 남긴다.

## 단계 0. 저장소 준비

- 목표: 공개 저장소와 작업 규칙, 비밀값 검사를 갖춘다.
- 확인 방법: 가짜 토큰을 커밋하면 막히는지 실행해 본다.

## 단계 1. 앱과 테스트 (PR 1)

- 목표: 기능 없는 Next.js 첫 화면과 `lint`, `typecheck`, `test`, `build` 네 명령을 갖춘다.
- 완료 조건: 네 명령이 로컬에서 모두 성공하고, 테스트를 먼저 써서 실패를 확인한 뒤 구현한다.
- 확인 방법: 테스트 실패(빨간 불) 확인, 구현 후 네 명령 실행, `.next` 폴더를 지운 상태에서 `typecheck` 재실행.
- AI가 틀린 곳
  - Vitest 설정의 `@` 경로를 `new URL().pathname`으로 만들었더니 폴더 이름의 공백이 `%20`으로 바뀌어 import가 실패했다. `fileURLToPath`로 고쳤다.
  - 레이아웃에 `LayoutProps`(빌드 때 생성되는 타입)를 써서, 빌드 전에 `typecheck`를 돌리면 실패했다. CI는 빌드 전에 검사하므로 직접 타입으로 바꿨다.
- 첫 빨간 불은 설정 오류와 기본 페이지의 CSS 참조 오류였다. 내용 불일치로 실패한 것은 아니므로, 테스트가 기대를 검증한다는 증거는 구현 후 통과로만 확인했다.

## 단계 2. CI 워크플로 (PR 2)

- 목표: PR을 올리면 GitHub 서버에서 린트, 타입 검사, 테스트, 빌드가 자동으로 돈다.
- 완료 조건: PR의 Checks에 초록 체크.
- 확인 방법: PR Checks 화면과 `gh pr checks`.
- 경과: 처음에는 `permissions`, `concurrency`, `timeout-minutes`, 아티팩트 업로드까지 넣은 완성본을 썼다가, 이유를 이해하기 어려워 공식 Node.js 예시 구조의 가장 기본 버전으로 줄였다. 뺀 항목은 이해하며 하나씩 다시 더한다.
- AI가 틀린 곳: 공식 starter workflow의 `@v4`를 그대로 따랐지만 최신은 `checkout` v7, `setup-node` v7이었다. 릴리스를 조회해 v7로 올리고 CI 통과를 확인했다. `ubuntu-latest`를 "재현성이 중요하지 않아 괜찮다"고 설명한 것도 부정확했고, 정확히는 편의와 재현성 사이의 트레이드오프다.

## 단계 3. 정적 내보내기 (PR 3)

- 목표: 서버 없이 파일로 내보내 GitHub Pages에 올릴 수 있게 한다.
- 완료 조건: `npm run build` 뒤 `out/index.html`이 생기고, 로컬 정적 서버로 열면 첫 화면이 보인다.
- 확인 방법: 빌드, `out/` 폴더를 `python3 -m http.server`로 열어 제목 확인, lint와 test 재실행.
- AI가 한 일과 확인: 생성된 설정에 있던 `cacheComponents`, `partialPrefetching`을 확인 없이 지웠다. 되돌려 빌드해 보니 `PPR cannot be enabled in export mode` 오류가 나서, 정적 내보내기와 함께 쓸 수 없어 제거한 것이 맞았다.
- 아직 안 한 것: GitHub Pages의 프로젝트 주소(`/nextjs-pages-ci/`)에서 경로가 맞는지는 4단계에서 `configure-pages`가 설정하는 `basePath`로 확인한다.

## 단계 4. 배포 워크플로 (PR 4)

- 목표: main에 합치면 GitHub Pages에 자동 배포되고 주소가 열린다.
- 완료 조건: build와 deploy 두 잡이 순서대로 초록, `https://7inug1.github.io/nextjs-pages-ci/`에서 첫 화면과 스타일이 보인다.
- 확인 방법: main 합친 뒤 Actions 화면, 배포 주소 열기.
- 설정: 저장소 Pages 배포 방식을 `gh api`로 GitHub Actions(`build_type=workflow`)로 켰다.
- AI가 틀릴 뻔한 곳: 공식 starter workflow는 `static_site_generator: next`로 `basePath`를 자동 주입하지만, `configure-pages`는 설정 파일을 `.js`, `.cjs`, `.mjs`만 인식한다(소스의 `SUPPORTED_FILE_EXTENSIONS` 확인). 우리는 `next.config.ts`라서 그대로 쓰면 맞지 않는다. 그래서 `configure-pages`의 `base_path` 출력값을 환경 변수(`NEXT_PUBLIC_BASE_PATH`)로 넘기고 `next.config.ts`가 읽도록 했다.
- 액션 버전은 릴리스 조회 기준: checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5.
- 아직 안 한 것: 실제 배포 실행과 주소 확인(합친 뒤에 한다). 배포 워크플로는 main push에서만 돌아서 PR 단계에서는 실행되지 않는다.
