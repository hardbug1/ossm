# OSSM — 오픈소스 관리 솔루션 (PoC)

오픈소스 의존성의 **보안 취약점 · 라이선스 위험 · 구성(misconfiguration) 이슈**를 점검하고,
결과를 Material 3 웹 대시보드와 PDF 보고서로 제공하는 기술 검증용 PoC입니다.

검증된 오픈소스 스캐너(**Trivy**)를 오케스트레이션하고, 그 위에 관리·정규화·보고 계층을 올렸습니다.

## 기능

1. **취약점 점검** — Trivy로 의존성 CVE 탐지, 심각도별 집계
2. **저장소 연동 자가 점검** — GitHub 저장소(clone) 또는 로컬 경로를 스캔
   - 취약점 + 라이선스 위험도 분류 + 구성(misconfig) 점검
   - (선택) GitHub 토큰이 있으면 저장소 위생 점검(브랜치 보호·SECURITY.md·LICENSE)
3. **보고서** — 웹 대시보드(탭/통합 테이블/심각도별 3뷰) + PDF 내보내기

## 사전 요구사항

| 도구 | 필요성 | 비고 |
|------|--------|------|
| Node.js 20+ | 필수 | 앱 실행 |
| [Trivy CLI](https://aquasecurity.github.io/trivy/) | 실제 스캔에 필수 | 미설치 시 health 배지 "미설치" + 스캔 실패에 안내 |
| git | GitHub 연동에 필요 | 로컬 경로 스캔만 쓰면 불필요 |
| Chromium (Puppeteer) | PDF 내보내기에 필요 | `npx puppeteer browsers install chrome` |

## 설치 & 실행

```bash
npm install
# (선택) PDF 내보내기를 쓰려면 Chromium 설치
npx puppeteer browsers install chrome

npm run dev        # 개발 서버 → http://localhost:3000
# 또는
npm run build && npm start   # 프로덕션 (PDF는 프로덕션에서 더 안정적)
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OSSM_DB_PATH` | `data/ossm.db` | SQLite 파일 경로 (`:memory:` 가능) |
| `GITHUB_TOKEN` | (없음) | 비공개 저장소 clone + GitHub 위생 점검 활성화 (있을 때만) |

## 사용 흐름

1. 홈에서 **프로젝트 추가** (GitHub URL 또는 로컬 경로)
2. 프로젝트 상세에서 **스캔 실행** → 진행 단계가 실시간 표시
3. 완료 후 **결과 보기** → 요약 카드 + 3가지 뷰로 findings 탐색
4. **PDF 내보내기** 또는 보고서 미리보기 → 인쇄

## 아키텍처

단일 Next.js(App Router) 앱:

- `lib/scan/` — Trivy 실행(`trivy.ts`) + 결과 정규화(`normalize.ts`)
- `lib/checks/` — 라이선스 위험도 분류 + GitHub 위생 점검
- `lib/ingest/` — GitHub clone / 로컬 경로 확보
- `lib/jobs/runner.ts` — 인프로세스 스캔 잡 러너(상태 머신)
- `lib/db/` — better-sqlite3 스키마 + 쿼리
- `lib/meta.ts` — 심각도/종류 메타·집계·정렬 (UI·보고서 공용 단일 출처)
- `app/` — 4개 화면(홈/프로젝트 상세/스캔 결과/보고서) + API 라우트
- `lib/report/pdf.ts` — Puppeteer로 보고서 페이지를 A4 PDF로 출력

설계 문서: `docs/superpowers/specs/2026-06-19-oss-management-poc-design.md`
구현 계획: `docs/superpowers/plans/2026-06-19-ossm-poc-implementation.md`
디자인 원본: `design/prototype.dc.html`, `design/colors_and_type.css`

## 테스트

```bash
npm test           # vitest — 정규화·분류·집계·DB·러너·위생점검 단위 테스트 (27)
```

## PoC 비범위

- 인증/권한/사용자 관리, 멀티테넌시 (네비 "설정"은 안내만 표시)
- 자동 수정(remediation)·PR 생성
- 다중 스캐너 동시 지원 (Trivy 단일; 정규화 계층으로 확장 여지만 둠)
- 정기 스캔 스케줄링, 추세 비교

## 알려진 사항

- `npm audit`에 남는 Next.js 권고는 미사용 기능(next/image·remotePatterns·rewrites·이미지 캐시) 관련으로 본 PoC 사용 범위에 해당하지 않습니다.
- 라이선스 위험도는 OSSM 룩업 테이블 기준이며 법적 판단을 대체하지 않습니다.
