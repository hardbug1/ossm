# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

OSSM은 **Trivy를 오케스트레이션**해 오픈소스 의존성의 취약점·라이선스·구성 이슈를 점검하고 웹 대시보드 + PDF 보고서로 보여주는 Next.js(App Router) PoC다. 자체 스캐너를 만들지 않는다 — Trivy CLI를 호출하고 그 결과를 관리·정규화·보고하는 계층이 핵심이다.

## Commands

```bash
npm install            # 의존성
npm run dev            # 개발 서버 (http://localhost:3000)
npm run build          # 프로덕션 빌드 (= 타입체크 게이트로도 사용)
npm start              # 프로덕션 실행 (PDF는 prod에서 더 안정적)
npm test               # vitest 전체 (test/*.test.ts)
npx vitest run test/normalize.test.ts          # 단일 파일
npx vitest run -t "심각도 순서대로 정렬"        # 이름으로 단일 테스트
```

런타임 외부 의존(코드 아님, 환경 설치):
```bash
# 실제 스캔에 필수 — PATH에 trivy 있어야 함
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b "$HOME/.local/bin"
# PDF 내보내기에 필요
npx puppeteer browsers install chrome
```

환경변수: `OSSM_DB_PATH`(기본 `data/ossm.db`, 테스트는 `:memory:`), `GITHUB_TOKEN`(있으면 비공개 clone + GitHub 위생 점검 활성화).

## 핵심 파이프라인

`app/api`의 얇은 route → `lib/jobs/runner.ts`가 한 스캔을 5단계로 오케스트레이션:

1. **ingest** (`lib/ingest/`): `github`면 임시 디렉토리에 `git clone --depth 1`, `local`이면 경로 검증 → `{ dir, cleanup }`
2. **scan** (`lib/scan/trivy.ts`): `trivy fs <dir> --scanners vuln,license,misconfig --format json`
3. **normalize** (`lib/scan/normalize.ts`): Trivy JSON → 내부 `Finding[]`
4. **classify**: 라이선스 위험도 부여 + (토큰 있으면) GitHub 위생 점검 결과 합침
5. **persist**: findings 저장 + `scans.status=done`

각 단계 전이마다 `scans.step`(0→5)을 갱신하고, 프로젝트 상세 UI가 1초 폴링으로 진행 막대를 그린다. 어느 단계든 throw하면 `status=failed` + `error` 기록, `cleanup()`은 항상 호출.

## 알아둘 설계 결정 (비자명)

- **`lib/meta.ts`가 심각도/종류의 단일 출처.** `SEV_META`(색상·한국어 라벨·정렬순서), `KIND_META`, `summarize`/`sortFindings`/`prep`을 UI·보고서가 공유한다. 심각도 색상이나 라벨을 컴포넌트에 하드코딩하지 말 것 — 여기만 고친다.
- **라이선스 severity는 Trivy가 아니라 `lib/checks/license-risk.ts`가 결정한다.** Trivy는 라이선스명만 주고, 위험도(high/medium/low/unknown)는 우리 룩업으로 분류한다. normalize는 이 분류기를 호출해 severity·note를 채운다.
- **findings 단일 테이블 + `kind` 구분.** 취약점/라이선스/구성을 한 테이블에 담고, 버전·수정버전·note·hygiene 플래그는 `detail_json`에 직렬화한다(`lib/db/queries.ts`).
- **러너는 의존성 주입형.** `runScanJob(scanId, { scanner, ingest, hygiene, now, db })` — 테스트는 가짜 scanner/ingest를 주입해 Trivy·네트워크 없이 전체 흐름을 검증한다(`test/runner.test.ts`). 단위 테스트는 `better-sqlite3` `:memory:` 사용.
- **입력 검증은 시스템 경계에서만.** `lib/validate.ts`가 `POST /api/projects`에서 GitHub 유형의 URL 형식·Windows 경로를 막는다. 내부에서 일어날 수 없는 상황엔 방어 코드를 더하지 않는다.
- **외부(Trivy) 출력 파싱만 방어적으로.** normalize는 버전별 필드 차이를 옵셔널 체이닝 + 기본값 `'unknown'`으로 흡수한다.

## UI는 디자인 원본의 1:1 포팅

`app/`의 4개 화면(홈 / 프로젝트 상세 / 스캔 결과(탭·통합테이블·심각도별 3뷰) / 보고서)은 **`design/prototype.dc.html`의 확정 마크업을 React로 옮긴 것**이다. Material 3 토큰은 `app/globals.css`(원본 `design/colors_and_type.css`)에 있고 인라인 스타일은 CSS 변수(`--md-sys-color-*`)를 그대로 쓴다. UI를 바꿀 때는 프로토타입과의 시각적 일치를 깨지 않도록 한다. 보고서 페이지(`app/scans/[id]/report`)는 **서버 컴포넌트**라서 Puppeteer(`lib/report/pdf.ts`)가 `?print=1`로 띄워 PDF로 출력한다(`@media print`가 크롬 숨김).

## 환경 / 함정

- **WSL(Linux)에서 구동.** 로컬 경로는 Windows(`D:\...`)가 아니라 WSL 경로(`/mnt/d/...`)여야 한다 — `validateProjectInput`이 막고 변환 예시를 안내한다.
- **Trivy/Chromium 미설치 시** health 배지가 "미설치"로 뜨고, 스캔/PDF는 실패하되 한국어 안내 메시지를 준다(크래시 아님). 디버깅 전 둘의 PATH/설치부터 확인.
- **vitest는 tsconfig의 `@/*` 경로를 안 읽는다.** `vitest.config.ts`의 alias가 `@`를 잡아준다. 새 import alias가 안 풀리면 거기부터 본다.
- `next.config.mjs`는 `experimental.serverComponentsExternalPackages`로 `better-sqlite3`·`puppeteer`를 번들에서 제외한다(Next 14.2 키). next는 14.2.35 핀.

## 문서

- 설계서: `docs/superpowers/specs/2026-06-19-oss-management-poc-design.md`
- 구현 계획(Task별 트래커): `docs/superpowers/plans/2026-06-19-ossm-poc-implementation.md`
- README에 사전 요구사항·실행법·PoC 비범위 정리.
