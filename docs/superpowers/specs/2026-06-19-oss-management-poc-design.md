# 오픈소스 관리 솔루션(OSSM) — PoC 설계서

- **작성일**: 2026-06-19
- **상태**: 승인됨 (브레인스토밍 완료)
- **목적**: 기술 검증용 PoC. 핵심 흐름("대상 확보 → 스캔 → 정규화 → 저장 → 조회/보고")을 빠르게 동작시키는 것이 목표.

---

## 1. 개요

오픈소스 의존성의 **보안 취약점 · 라이선스 위험 · 구성(misconfiguration) 이슈**를 점검하고,
그 결과를 웹 대시보드와 PDF 보고서로 제공하는 도구.

검증된 오픈소스 스캐너(**Trivy**)를 오케스트레이션하고, 그 위에 **관리·정규화·보고 계층**을 직접 구현한다.
취약점 스캐너를 from-scratch로 만들지 않는다 (PoC 범위 밖).

### 요구사항 요약

| 항목 | 결정 |
|------|------|
| 목적 | PoC / 기술 검증 |
| 엔진 전략 | 기존 스캐너(Trivy 중심) 오케스트레이션 |
| 대상 확보 | GitHub clone + 로컬 경로 |
| 점검 범위 | 취약점(CVE) + 라이선스 + 구성(misconfig) |
| 기술 스택 | Node.js / TypeScript 풀스택 (Next.js) |
| 보고서 | 웹 대시보드 + PDF 내보내기 |

### 비범위 (Non-goals)

- 취약점 DB/스캐너 자체 구현
- 멀티테넌시, 인증/권한, 사용자 관리
- 자동 수정(remediation)·PR 생성
- 다수 스캐너 동시 지원 (Trivy 단일. 정규화 계층으로 추후 확장 여지만 남김)

---

## 2. 아키텍처 (접근법 A — 단일 Next.js 풀스택 앱)

단일 Next.js 앱 안에서 책임을 분리한다. 핵심 파이프라인:
**디렉토리 확보 → 스캔 → 정규화 → 저장 → 조회/보고**

```
ossm/
├─ app/                      # Next.js App Router (UI + API routes)
│  ├─ page.tsx               # 프로젝트 목록 / 추가
│  ├─ projects/[id]/         # 프로젝트 상세 + 스캔 트리거/상태
│  ├─ scans/[id]/page.tsx    # 스캔 결과 대시보드
│  ├─ scans/[id]/report/     # 인쇄용 보고서 페이지(PDF 소스로 재사용)
│  └─ api/                   # route handlers (얇게, lib 호출만)
│     ├─ projects/...        # 프로젝트 CRUD
│     ├─ scans/...           # 스캔 생성/상태조회
│     └─ scans/[id]/pdf      # Puppeteer PDF 출력
├─ lib/
│  ├─ ingest/                # 대상 확보: github-clone.ts, local-path.ts
│  ├─ scan/                  # trivy-runner.ts(spawn), normalize.ts(JSON→Finding)
│  ├─ checks/                # license-risk.ts, github-hygiene.ts(선택)
│  ├─ jobs/                  # 인프로세스 작업 러너(상태 머신)
│  ├─ db/                    # better-sqlite3 + 스키마/쿼리
│  └─ report/                # pdf.ts(Puppeteer)
└─ test/                     # 파서/분류기 단위테스트 + 픽스처
```

### 모듈 책임

- **ingest**: GitHub URL이나 로컬 경로를 받아 "스캔 가능한 디렉토리 경로"를 반환. GitHub은 임시 워크스페이스에 clone(비공개는 토큰 옵션).
- **scan**: `trivy fs --scanners vuln,license,misconfig --format json` 을 spawn하고, 원시 JSON을 내부 표준 `Finding` 모델로 정규화. **로직의 핵심이자 테스트 1순위.**
- **checks**: 라이선스 위험도 분류(GPL 등 → high/medium/low), GitHub 위생 점검(선택, API 토큰 있을 때만).
- **jobs**: 스캔은 비동기. `queued → running → done/failed` 상태를 DB에 기록, UI는 폴링.
- **db**: SQLite. 의존성 최소화를 위해 `better-sqlite3` 직접 사용(ORM 없음).
- **report**: 보고서 페이지를 Puppeteer로 띄워 PDF로 출력.

### 설계 결정

- **ORM 없이 `better-sqlite3` 직접 사용**: PoC 규모에선 동기 API가 단순하고 의존성이 가볍다.
- **인프로세스 작업 러너**: 별도 큐 인프라(Redis 등) 없이, 단일 노드 프로세스 내 상태 머신 + DB 상태 기록으로 충분.

---

## 3. 데이터 모델 & 스캔 흐름

### 3.1 데이터 모델 (SQLite, 3개 테이블)

```
projects
  id            TEXT PK
  name          TEXT
  source_type   TEXT   -- 'github' | 'local'
  source_value  TEXT   -- repo URL 또는 로컬 경로
  created_at    TEXT

scans
  id            TEXT PK
  project_id    TEXT FK
  status        TEXT   -- 'queued'|'running'|'done'|'failed'
  started_at    TEXT
  finished_at   TEXT
  error         TEXT   -- 실패 시 메시지/stderr 발췌
  summary_json  TEXT   -- 심각도별 집계 캐시 (대시보드 빠른 렌더용)

findings
  id            TEXT PK
  scan_id       TEXT FK
  kind          TEXT   -- 'vuln'|'license'|'misconfig'
  severity      TEXT   -- 'critical'|'high'|'medium'|'low'|'unknown'
  pkg           TEXT   -- 패키지/대상 식별자
  identifier    TEXT   -- CVE-ID / 라이선스명 / 룰ID
  title         TEXT
  detail_json   TEXT   -- 원시 부가정보(설치버전·수정버전·링크 등)
```

**설계 결정 — 단일 `findings` 테이블 통합**: 세 종류(취약점/라이선스/구성)를 `kind`로 구분해 하나의 테이블에 담는다.
대시보드·보고서가 동일한 렌더 로직을 공유할 수 있고, PoC에서 스키마가 단순해진다.

### 3.2 스캔 흐름

```
1. 사용자가 프로젝트 추가 (GitHub URL 또는 로컬 경로)        → projects insert
2. "스캔 실행" 클릭                                          → scans insert (queued)
3. jobs 러너가 픽업 → running
     a. ingest: github면 임시 디렉토리에 clone / local이면 경로 검증
     b. scan: trivy fs 실행 → JSON
     c. normalize: JSON → Finding[] (kind별)
     d. checks: 라이선스 위험도 부여 (+ github 위생, 토큰 있을 때)
     e. findings 일괄 insert, summary_json 집계, status=done
     f. (github clone 임시 디렉토리 정리)
   실패 시 어느 단계든 status=failed + error 기록
4. UI는 scan 상태 폴링 → done이면 결과 대시보드 렌더
5. PDF 내보내기 → 보고서 페이지를 Puppeteer로 출력
```

**임시 디렉토리 정리**: GitHub clone은 OS 임시 영역 하위의 스캔별 디렉토리에 받고, 잡 종료 시(성공/실패 무관) 정리한다.

---

## 4. 스캔 상세

### 4.1 Trivy 호출 (`lib/scan/trivy-runner.ts`)

```
trivy fs <dir> \
  --scanners vuln,license,misconfig \
  --format json \
  --quiet \
  --timeout 5m
```

- `child_process.spawn`으로 실행, stdout를 버퍼링해 JSON 파싱. stderr는 실패 시 `scans.error`에 발췌 저장.
- **사전 체크**: 앱 헬스체크에서 `trivy --version`을 확인해 미설치 시 명확히 안내(스캔을 시작조차 안 함).
- 첫 실행 시 Trivy가 취약점 DB를 내려받아 느릴 수 있음 → 타임아웃을 넉넉히(5분) + 상태는 계속 `running` 표시.
- **러너 주입 가능 구조**: 실제 Trivy 호출부를 인터페이스로 분리해, 테스트에서 mock 러너를 주입할 수 있게 한다.

### 4.2 정규화 (`lib/scan/normalize.ts`) — 핵심, 테스트 1순위

Trivy JSON의 `Results[]`를 순회하며 내부 `Finding`으로 변환:

- `Vulnerabilities[]` → `kind:'vuln'`
  (severity, PkgName, VulnerabilityID=CVE, InstalledVersion/FixedVersion, PrimaryURL → detail_json)
- `Licenses[]` → `kind:'license'`
  (PkgName, 라이선스명 → identifier)
- `Misconfigurations[]` → `kind:'misconfig'`
  (severity, ID=룰ID, Title, Resolution → detail_json)

Trivy 출력 스키마가 버전에 따라 조금씩 다르므로, **누락 필드는 방어적으로 처리**(옵셔널 체이닝 + 기본값 `'unknown'`).
입력이 외부 도구(Trivy)이므로 **이 경계에서만 검증**한다.

### 4.3 라이선스 위험도 (`lib/checks/license-risk.ts`)

Trivy는 라이선스명만 주므로, 위험도는 우리가 분류한다(룩업 테이블 + 매칭 함수):

| 등급 | 예시 |
|------|------|
| **high** | GPL-2.0, GPL-3.0, AGPL-*, 기타 강한 카피레프트 |
| **medium** | LGPL-*, MPL-2.0, 기타 약한 카피레프트 |
| **low** | MIT, Apache-2.0, BSD-*, ISC 등 허용형 |
| **unknown** | 매핑에 없는 라이선스 → 보고서에 "검토 필요"로 표시 |

분류 매핑도 테스트 대상.

### 4.4 GitHub 위생 점검 (`lib/checks/github-hygiene.ts`) — 선택

GitHub 토큰이 설정된 경우에만 동작. 저장소 메타데이터를 조회해 가벼운 항목만 `kind:'misconfig'` finding으로 추가:

- 기본 브랜치 보호 설정 여부
- 보안 정책(SECURITY.md) 존재 여부
- 라이선스 파일 존재 여부

토큰 없으면 조용히 건너뜀(PoC에서 필수 아님).

---

## 5. UI · PDF · 에러 처리 · 테스트

### 5.1 UI (Next.js App Router + React)

화면 4개:

1. **홈 (`/`)** — 프로젝트 목록 + "프로젝트 추가" 폼(GitHub URL 또는 로컬 경로 선택)
2. **프로젝트 상세 (`/projects/[id]`)** — 스캔 이력 + "스캔 실행" 버튼, 진행 중이면 상태 폴링 표시(spinner)
3. **스캔 결과 (`/scans/[id]`)** — 상단 요약 카드(심각도별 개수, 라이선스 위험 개수, 구성 이슈 개수) + 탭/섹션으로 취약점·라이선스·구성 목록(심각도순 정렬, 필터)
4. **보고서 (`/scans/[id]/report`)** — 인쇄 친화 레이아웃(헤더/요약/표). 화면에서도 보이며, **이 페이지가 PDF의 소스**.

스타일은 가벼운 CSS(또는 Tailwind). PoC라 컴포넌트 라이브러리는 최소화.

### 5.2 PDF 내보내기 (`api/scans/[id]/pdf`)

- Puppeteer를 headless로 띄워 `/scans/[id]/report?print=1` 페이지로 navigate → `page.pdf()`로 A4 PDF 생성 → 다운로드 응답.
- 보고서 페이지에 `@media print` 스타일을 적용해 버튼/네비 숨김.
- 보고서 페이지를 그대로 재사용하므로 **별도 PDF 레이아웃 코드가 거의 없다.**

### 5.3 에러 처리 (시스템 경계 중심)

- Trivy 미설치 → 헬스체크에서 차단 + 안내 메시지
- GitHub clone 실패(잘못된 URL/인증) → 해당 scan `failed` + 사용자에게 사유 표시
- Trivy 비정상 종료/타임아웃/JSON 파싱 실패 → `failed` + stderr 발췌 저장
- 잘못된 로컬 경로(미존재/디렉토리 아님) → 추가 시점에 즉시 검증
- *일어날 수 없는 내부 상황에 대한 방어 코드는 추가하지 않는다.*

### 5.4 테스트 (PoC 적정 수준)

- **단위(핵심)**: `normalize.ts` — Trivy JSON 픽스처(취약점/라이선스/구성 샘플) → 기대 `Finding[]`. 버전별 누락 필드 케이스 포함.
- **단위**: `license-risk.ts` 분류 매핑, GitHub URL 검증.
- **통합(1개)**: 작은 픽스처 프로젝트로 `queued→done` 잡 흐름. Trivy 러너를 주입해 mock/실제 둘 다 가능하게.
- UI는 PoC라 수동 확인 위주, 자동화 테스트는 로직 계층에 집중.

---

## 6. 전제 조건 / 외부 의존성

- **Trivy CLI**가 실행 환경에 설치되어 있어야 함(헬스체크로 확인).
- Node.js 20+ / Next.js (App Router).
- 주요 npm 의존성: `better-sqlite3`, `puppeteer`, (선택) GitHub API 클라이언트.
- GitHub 비공개 저장소·위생 점검은 환경변수 토큰이 있을 때만 활성화.

---

## 7. 향후 확장 여지 (PoC 이후, 비범위)

- 다중 스캐너(OSV-Scanner, Grype 등) 추가 — 정규화 계층이 흡수.
- 정기 스캔 스케줄링, 추세 그래프(스캔 이력 비교).
- 인증/권한, 멀티 프로젝트 그룹/조직.
- 정책 엔진(특정 라이선스·심각도 임계치 위반 시 실패 처리).
