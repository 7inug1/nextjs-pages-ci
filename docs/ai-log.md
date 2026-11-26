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

## 단계 5-1. 분석 도구 가져오기 (PR 5)

- 목표: 이전 프로젝트(`ci-failure-analyzer`)의 분석 도구를 서버 없이 명령줄로 쓸 수 있게 `analyzer/`에 둔다.
- 완료 조건: 가져온 테스트 32개 통과, 새로 쓴 `analyze` 함수 테스트 통과, 키 없이 실행하면 실패 안내 글이 나온다, 루트의 lint, typecheck, test, build는 그대로 통과.
- 확인 방법: 테스트를 먼저 쓰고 실패(모듈 없음)를 확인한 뒤 구현. 명령줄로 `fingerprint`와 `analyze`를 직접 실행.
- 설계: 이전에는 로컬 서버(`/fingerprint`, `/analyze`)였지만 공개 저장소라 내 맥 서버를 쓸 수 없다. 같은 로직을 `analyze()` 함수와 명령줄(`cli.ts`)로 옮겼고 서버(express, multer)는 뺐다.
- AI가 틀린 곳: 명령줄 파일에 최상위 `await`를 써서 실행 오류가 났다(CommonJS 형식). `main()` 함수로 감싸 고쳤다.
- 아직 안 한 것: 실제 AI 호출(키 필요), 분석 워크플로(`ci-failure-analyzer.yml`), 일부러 실패시킨 PR에서 댓글 확인.

## 단계 5-2. 분석 워크플로 (PR 6)

- 목표: CI가 실패하면 GitHub 서버에서 AI가 원인을 분석해 PR이면 댓글, main이면 이슈로 남긴다.
- 완료 조건: 일부러 테스트를 깨뜨린 PR에 "CI 실패 분석" 댓글이 달린다. (`workflow_run` 워크플로는 main에 있어야 동작해서 합친 뒤에 확인한다.)
- 이전 파일(`ci-failure-analyzer.yml`)에서 바꾼 것: 내 맥 러너 대신 `ubuntu-latest`, 서버 호출(`curl`) 대신 명령줄(`fingerprint`, `analyze`), 분석 도구는 main의 것만 받음, 같은 저장소의 PR만 분석(fork PR 제외).
- `ci.yml`에 테스트 결과 파일(`report.xml`) 업로드를 되살렸다. 분석이 이 파일을 읽는다.
- 확인한 것: YAML 문법, 키 없이 명령줄 실행(실패 안내 글 생성).
- 아직 안 한 것: 실제 AI 호출과 PR 댓글(키는 등록 완료). 합친 뒤 실패 PR로 확인한다.

## 단계 7. 서버 렌더링 전환 (PR 9)

- 목표: TTFB 과제를 위해 요청마다 서버가 페이지를 그리게 한다.
- 이유: 정적 내보내기는 빌드할 때 HTML을 미리 다 만들어서, 페이지의 fetch가 빌드 때 한 번만 돈다. 그러면 외부 자원 지연을 늘려도 TTFB가 변하지 않아 과제의 측정이 성립하지 않는다.
- 바꾼 것: `next.config.ts`에서 `output: "export"`, `images.unoptimized`, `basePath` 제거. GitHub Pages는 서버 코드를 못 돌려서 `deploy.yml`(Pages 배포) 삭제. 첫 화면과 메타 설명 문구를 EC2 기준으로.
- 완료 조건: lint, typecheck, test, build 통과, 빌드 로그에 `out/` 대신 `.next/`, `next start`로 띄운 첫 화면 200.
- 확인 방법: 문구 테스트를 먼저 바꿔 실패 확인 후 구현. 로컬에서 `next build` 후 `next start`, curl로 확인.
- 아직 안 한 것: EC2 서버를 `next start` 상시 실행과 nginx 리버스 프록시로 바꾸기, GitHub 저장소 설정의 Pages 사이트 내리기(지금은 마지막 배포본이 남아 있음).

