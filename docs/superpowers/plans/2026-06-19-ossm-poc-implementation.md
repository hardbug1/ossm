# OSSM PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivy를 오케스트레이션해 GitHub/로컬 프로젝트의 취약점·라이선스·구성 이슈를 점검하고, 결과를 Material 3 웹 대시보드와 PDF 보고서로 제공하는 동작하는 Next.js PoC를 구축한다.

**Architecture:** 단일 Next.js(App Router) 앱. `lib/`에 순수 로직(정규화·분류·집계)·DB(better-sqlite3)·스캔 오케스트레이션(인프로세스 잡 러너)을 두고, `app/api/`의 얇은 route handler가 이를 호출한다. UI는 `design/prototype.dc.html`의 확정 마크업을 React로 1:1 포팅한다. PDF는 Puppeteer가 보고서 페이지를 그대로 렌더해 생성한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, better-sqlite3, Puppeteer, Vitest, Material 3 토큰 CSS(`design/colors_and_type.css`).

## Global Constraints

- 응답·주석·UI 카피는 한국어. 코드·식별자·고유명사는 영문 유지.
- 외부 도구(Trivy) 출력은 **시스템 경계에서만 방어적 검증**. 내부에서 일어날 수 없는 상황에 대한 방어 코드는 추가하지 않는다.
- 취약점 스캐너를 직접 구현하지 않는다 — Trivy CLI 오케스트레이션만.
- 데이터 모델은 프로토타입과 일치시킨다: `Project.type ∈ {github, local}`, `Scan.status ∈ {queued, running, done, failed}`, `Finding.kind ∈ {vuln, license, misconfig}`, `Severity ∈ {critical, high, medium, low, unknown}`.
- 심각도 색상/한국어 라벨/정렬 순서는 `lib/meta.ts`의 `SEV_META`/`KIND_META` 단일 출처를 따른다 (프로토타입 `sevMeta`/`kindMeta`와 동일).
- 날짜 표기: 등록일 `YYYY-MM-DD`, 스캔 시각 `YYYY-MM-DD HH:MM`.
- Trivy 호출: `trivy fs <dir> --scanners vuln,license,misconfig --format json --quiet --timeout 5m`.
- 테스트 프레임워크: Vitest. 단위 테스트 실행 `npx vitest run <file>`.
- 라이선스 위험도는 OSSM 룩업 기준(법적 판단 대체 아님)이며, license finding의 severity는 Trivy 값이 아니라 `classifyLicense()`로 결정한다.
- 커밋은 각 Task의 마지막 단계에서. 사용자가 git 사용을 승인한 뒤에만 실제 커밋(저장소 미초기화 시 Task 0에서 `git init`).

**참조 자산 (Task별로 경로로 참조):**
- `design/prototype.dc.html` — 4개 화면 확정 마크업 + 인라인 데이터 모델/헬퍼/시드 데이터 (포팅 기준)
- `design/colors_and_type.css` — M3 토큰 (앱 전역 스타일로 사용)

---

## 진행 현황 (loop 트래커)

- [x] Task 0 — 프로젝트 스캐폴드 & 전역 스타일 (빌드 통과)
- [x] Task 1 — 공유 타입 & 메타 헬퍼 (vitest 5/5 통과)
- [x] Task 2 — 라이선스 위험도 분류기 (vitest 5/5 통과)
- [x] Task 3 — Trivy 결과 정규화 (vitest 5/5 통과)
- [x] Task 4 — DB 계층 (vitest 3/3 통과)
- [x] Task 5 — Trivy 러너 & 버전 체크 + health (vitest 2/2 통과 · ⚠️ 실행환경 Trivy 미설치, git 2.53.0 있음)
- [x] Task 6 — 대상 확보 (로컬 & GitHub) (vitest 2/2 통과 · cloneGithub는 후반 수동검증)
- [x] Task 7 — GitHub 위생 점검 (vitest 3/3 통과 · mock 최장일치로 수정)
- [x] Task 8 — 스캔 잡 러너 (vitest 2/2 · 전체 회귀 27/27 통과)
- [x] Task 9 — API 라우트 (build OK · 서버 smoke: health/CRUD/scan 트리거·상태 검증 · Trivy 미설치 에러 메시지 개선)
- [x] Task 10 — 공유 UI 컴포넌트 + API 클라이언트 (tsc --noEmit 통과)
- [x] Task 11 — 홈 화면 (build OK · SSR 렌더 검증 · Trivy 배지 health 연동)
- [x] Task 12 — 프로젝트 상세 화면 (build OK · 라우트 200 · 스캔 이력/실행/라이브 step 폴링)
- [x] Task 13 — 스캔 결과 화면 (build OK · 라우트 200 · 탭/통합테이블/심각도별 3뷰 · 렌더 로직은 meta 단위테스트로 검증)
- [x] Task 14 — 보고서 화면 + PDF (보고서 SSR 렌더 **완전 검증**(시드 데이터) · PDF 코드 완성+graceful 안내 · ⚠️ 실제 PDF 바이트 생성은 샌드박스 Chromium 다운로드 차단으로 미검증, Chromium 있는 환경에서 동작)
- [x] Task 15 — 마감 (README 작성 · Next 14.2.35 보안 패치 · 전체 회귀 test 27/27 + build OK)

**✅ 전체 16개 Task 완료.** 단위 테스트 27/27 · 프로덕션 빌드 통과 · 서버 smoke(health/CRUD/scan/보고서 SSR) 검증.
⚠️ 환경 제약(미검증): 실제 Trivy 스캔(미설치)·실제 PDF 바이트 생성(Chromium 다운로드 차단). 코드·라우트·실패 경로·보고서 렌더는 모두 검증됨.

> 커밋은 사용자 승인 시 일괄 진행(루프 동안 보류). git 미초기화 상태.

---

## File Structure

```
ossm/
├─ package.json, tsconfig.json, next.config.mjs, vitest.config.ts, .gitignore
├─ app/
│  ├─ layout.tsx                       # 루트 레이아웃: 전역 CSS·폰트 로드
│  ├─ globals.css                      # M3 토큰(import) + base + @media print + 키프레임
│  ├─ page.tsx                         # 홈: 프로젝트 목록 + 추가 다이얼로그 + 스낵바
│  ├─ projects/[id]/page.tsx           # 프로젝트 상세: 스캔 이력·실행·라이브 진행
│  ├─ scans/[id]/page.tsx              # 스캔 결과: 요약 + 3뷰(탭/통합테이블/심각도별)
│  ├─ scans/[id]/report/page.tsx       # 보고서(인쇄용)
│  └─ api/
│     ├─ health/route.ts               # GET trivy 버전
│     ├─ projects/route.ts             # GET 목록 / POST 생성
│     ├─ projects/[id]/route.ts        # GET 단건(+scans)
│     ├─ projects/[id]/scans/route.ts  # POST 스캔 트리거
│     ├─ scans/[id]/route.ts           # GET 스캔 상태·findings
│     └─ scans/[id]/pdf/route.ts       # GET Puppeteer PDF
├─ lib/
│  ├─ types.ts                         # Severity/Kind/ScanStatus/Finding/Project/Scan/TrivyOutput
│  ├─ meta.ts                          # SEV_META/KIND_META/sortFindings/summarize/sevChips/prep
│  ├─ db/index.ts                      # better-sqlite3 연결 + 스키마 migrate
│  ├─ db/queries.ts                    # projects/scans/findings CRUD
│  ├─ scan/normalize.ts                # TrivyOutput → Finding[]
│  ├─ scan/trivy.ts                    # runTrivyFs(dir) / getTrivyVersion()
│  ├─ ingest/local.ts                  # resolveLocal(path)
│  ├─ ingest/github.ts                 # cloneGithub(url, token?)
│  ├─ checks/license-risk.ts           # classifyLicense(name)
│  ├─ checks/github-hygiene.ts         # fetchHygieneFindings(repo, token, deps?)
│  ├─ jobs/runner.ts                   # runScanJob(scanId, deps?)
│  └─ report/pdf.ts                    # renderReportPdf(scanId, origin)
├─ components/
│  ├─ Icon.tsx                         # Material Symbols 래퍼
│  ├─ NavRail.tsx                      # 좌측 88px 레일
│  ├─ SeverityChip.tsx                 # 심각도 칩
│  └─ FindingRow.tsx                   # finding 한 줄
├─ test/
│  ├─ meta.test.ts
│  ├─ license-risk.test.ts
│  ├─ normalize.test.ts
│  ├─ db.test.ts
│  ├─ github-hygiene.test.ts
│  ├─ runner.test.ts
│  └─ fixtures/trivy-fs.json
└─ data/ossm.db                        # 런타임 SQLite (gitignore)
```

---

## Task 0: 프로젝트 스캐폴드 & 전역 스타일

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `.gitignore`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (임시 스텁)
- Create: `app/api/health/route.ts`

**Interfaces:**
- Produces: 빌드 가능한 Next.js 앱, `GET /api/health` → `{ trivy: string | null }` (Task 5에서 실제 구현; 여기선 `{ trivy: null }` 스텁).

- [x] **Step 1: 의존성 설치 & 스캐폴드 파일 생성**

`package.json`:
```json
{
  "name": "ossm",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.0",
    "next": "14.2.15",
    "puppeteer": "^23.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^20.14.0",
    "@types/react": "18.3.3",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3, puppeteer는 서버 외부 패키지로 번들 제외
  serverExternalPackages: ["better-sqlite3", "puppeteer"],
};
export default nextConfig;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

`.gitignore`:
```
node_modules
.next
data/*.db
*.tsbuildinfo
next-env.d.ts
```

- [x] **Step 2: 전역 스타일 작성**

`app/globals.css` — `design/colors_and_type.css`의 전체 내용을 복사하되, 상단 `@font-face`의 Pretendard `src`를 로컬 otf 대신 CDN으로 교체하고, 프로토타입 `<helmet><style>`의 base 규칙을 이어붙인다.

Pretendard `@font-face` 블록 전체를 다음 한 줄 import로 대체:
```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");
```
(나머지 `@import`(Roboto Mono + Material Symbols)와 `:root`/`[data-theme="dark"]`/유틸리티 클래스는 그대로 유지.)

파일 끝에 프로토타입 base 스타일 추가:
```css
/* base + print (from prototype helmet) */
html, body { margin: 0; height: 100%; background: var(--md-sys-color-surface); }
*, *::before, *::after { box-sizing: border-box; }
@keyframes ossm-spin { to { transform: rotate(360deg); } }
@media print {
  [data-chrome] { display: none !important; }
  [data-scroll] { overflow: visible !important; height: auto !important; }
  html, body { background: #ffffff !important; }
  [data-report] { box-shadow: none !important; margin: 0 !important; max-width: none !important; padding: 0 !important; }
  [data-reportbg] { background: #ffffff !important; padding: 0 !important; }
}
@page { size: A4; margin: 16mm; }
```

- [x] **Step 3: 루트 레이아웃 + 임시 홈 + health 스텁**

`app/layout.tsx`:
```tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "OSSM — 오픈소스 관리", description: "오픈소스 취약점·라이선스·구성 점검" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Roboto+Mono:wght@400;500;700&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx` (임시 스텁, Task 9에서 교체):
```tsx
export default function Home() {
  return <div style={{ padding: 24 }}>OSSM scaffold OK</div>;
}
```

`app/api/health/route.ts` (스텁, Task 5에서 교체):
```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ trivy: null });
}
```

- [x] **Step 4: 빌드 검증**

Run: `npm install && npm run build`
Expected: 빌드 성공(에러 0). `app/api/health` 라우트가 빌드 산출물에 포함.
✅ 완료: `✓ Compiled successfully`, 라우트 `/`, `/_not-found`, `/api/health` 생성됨.

> ⏸️ **Step 5(Commit) 보류** — git 미초기화 + 커밋은 사용자 명시 승인 시. 루프 동안 파일/테스트/빌드만 진행.

- [ ] **Step 5: Commit**

```bash
git init   # 저장소 미초기화 시에만
git add -A
git commit -m "chore: scaffold Next.js app with M3 tokens and health stub"
```

---

## Task 1: 공유 타입 & 메타 헬퍼 (lib/types.ts, lib/meta.ts)

**Files:**
- Create: `lib/types.ts`
- Create: `lib/meta.ts`
- Test: `test/meta.test.ts`

**Interfaces:**
- Produces:
  - `type Severity = 'critical'|'high'|'medium'|'low'|'unknown'`
  - `type Kind = 'vuln'|'license'|'misconfig'`
  - `type ScanStatus = 'queued'|'running'|'done'|'failed'`
  - `interface Finding { kind: Kind; severity: Severity; pkg: string; identifier: string; title: string; installed?: string; fixed?: string; note?: string; hygiene?: boolean }`
  - `interface Project { id: string; name: string; type: 'github'|'local'; value: string; created: string }`
  - `interface Scan { id: string; projectId: string; status: ScanStatus; started: string; finished?: string; duration?: string; trivy?: string; error?: string; step?: number; findings: Finding[] }`
  - `SEV_META: Record<Severity, {kr:string; bg:string; fg:string; order:number}>`
  - `KIND_META: Record<Kind, {kr:string; icon:string}>`
  - `sortFindings(findings: Finding[]): Finding[]`
  - `summarize(findings: Finding[]): { sev: Record<Severity, number>; kind: Record<Kind, number>; licHigh: number; miscHigh: number; total: number }`
  - `sevChips(findings: Finding[]): { key: Severity; count: number; kr: string; bg: string; fg: string }[]`
  - `interface PreppedFinding extends Finding { sevKr; sevBg; sevFg; kindKr; kindIcon; right: string }`
  - `prep(f: Finding): PreppedFinding`

- [ ] **Step 1: 실패 테스트 작성**

`test/meta.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sortFindings, summarize, sevChips, prep, SEV_META } from "@/lib/meta";
import type { Finding } from "@/lib/types";

const sample: Finding[] = [
  { kind: "vuln", severity: "low", pkg: "semver", identifier: "CVE-2022-25883", title: "ReDoS", installed: "7.3.4", fixed: "7.5.2" },
  { kind: "vuln", severity: "critical", pkg: "jsonwebtoken", identifier: "CVE-2022-23529", title: "auth bypass", installed: "8.5.1", fixed: "9.0.0" },
  { kind: "license", severity: "high", pkg: "ghostscript4js", identifier: "AGPL-3.0", title: "강한 카피레프트", note: "강한 카피레프트" },
  { kind: "misconfig", severity: "high", pkg: "Dockerfile", identifier: "DS002", title: "root 실행", note: "USER 지정" },
];

describe("sortFindings", () => {
  it("심각도 순서대로 정렬한다 (critical 먼저)", () => {
    const ordered = sortFindings(sample).map((f) => f.severity);
    expect(ordered[0]).toBe("critical");
    expect(ordered[ordered.length - 1]).toBe("low");
  });
});

describe("summarize", () => {
  it("심각도·종류별 개수와 고위험 라이선스/구성 수를 집계한다", () => {
    const s = summarize(sample);
    expect(s.total).toBe(4);
    expect(s.sev.critical).toBe(1);
    expect(s.kind.vuln).toBe(2);
    expect(s.kind.license).toBe(1);
    expect(s.licHigh).toBe(1);
    expect(s.miscHigh).toBe(1);
  });
});

describe("sevChips", () => {
  it("개수가 0인 심각도는 제외하고 메타를 붙인다", () => {
    const chips = sevChips(sample);
    const keys = chips.map((c) => c.key);
    expect(keys).toContain("critical");
    expect(keys).not.toContain("unknown");
    expect(chips[0].kr).toBe(SEV_META[chips[0].key].kr);
  });
});

describe("prep", () => {
  it("취약점은 right에 설치→수정 버전을, 그 외는 note를 넣는다", () => {
    expect(prep(sample[1]).right).toBe("8.5.1 → 9.0.0");
    expect(prep(sample[2]).right).toBe("강한 카피레프트");
  });
  it("수정버전이 없으면 '수정버전 없음'", () => {
    const f: Finding = { kind: "vuln", severity: "high", pkg: "x", identifier: "CVE-X", title: "t", installed: "1.0.0" };
    expect(prep(f).right).toBe("수정버전 없음");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/meta.test.ts`
Expected: FAIL — `@/lib/meta` 모듈 없음.

- [ ] **Step 3: 타입 작성**

`lib/types.ts`:
```ts
export type Severity = "critical" | "high" | "medium" | "low" | "unknown";
export type Kind = "vuln" | "license" | "misconfig";
export type ScanStatus = "queued" | "running" | "done" | "failed";

export interface Finding {
  kind: Kind;
  severity: Severity;
  pkg: string;
  identifier: string;
  title: string;
  installed?: string;
  fixed?: string;
  note?: string;
  hygiene?: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: "github" | "local";
  value: string;
  created: string;
}

export interface Scan {
  id: string;
  projectId: string;
  status: ScanStatus;
  started: string;
  finished?: string;
  duration?: string;
  trivy?: string;
  error?: string;
  step?: number;
  findings: Finding[];
}

// Trivy fs JSON (필요 필드만)
export interface TrivyOutput {
  Results?: TrivyResult[];
}
export interface TrivyResult {
  Target?: string;
  Class?: string;
  Type?: string;
  Vulnerabilities?: TrivyVuln[];
  Licenses?: TrivyLicense[];
  Misconfigurations?: TrivyMisconf[];
}
export interface TrivyVuln {
  VulnerabilityID?: string;
  PkgName?: string;
  InstalledVersion?: string;
  FixedVersion?: string;
  Severity?: string;
  Title?: string;
  PrimaryURL?: string;
}
export interface TrivyLicense {
  PkgName?: string;
  Name?: string;
  Category?: string;
  Severity?: string;
}
export interface TrivyMisconf {
  ID?: string;
  Title?: string;
  Description?: string;
  Severity?: string;
  Resolution?: string;
}
```

- [ ] **Step 4: 메타 헬퍼 작성**

`lib/meta.ts`:
```ts
import type { Finding, Kind, Severity } from "@/lib/types";

export const SEV_META: Record<Severity, { kr: string; bg: string; fg: string; order: number }> = {
  critical: { kr: "심각", bg: "var(--md-sys-color-error)", fg: "var(--md-sys-color-on-error)", order: 0 },
  high: { kr: "높음", bg: "var(--md-sys-color-error-container)", fg: "var(--md-sys-color-on-error-container)", order: 1 },
  medium: { kr: "보통", bg: "var(--md-sys-color-tertiary-container)", fg: "var(--md-sys-color-on-tertiary-container)", order: 2 },
  low: { kr: "낮음", bg: "var(--md-sys-color-secondary-container)", fg: "var(--md-sys-color-on-secondary-container)", order: 3 },
  unknown: { kr: "미상", bg: "var(--md-sys-color-surface-container-highest)", fg: "var(--md-sys-color-on-surface-variant)", order: 4 },
};

export const KIND_META: Record<Kind, { kr: string; icon: string }> = {
  vuln: { kr: "취약점", icon: "bug_report" },
  license: { kr: "라이선스", icon: "gavel" },
  misconfig: { kr: "구성", icon: "rule" },
};

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low", "unknown"];

export function sortFindings(findings: Finding[]): Finding[] {
  return findings.slice().sort(
    (a, b) =>
      SEV_META[a.severity].order - SEV_META[b.severity].order ||
      a.kind.localeCompare(b.kind) ||
      a.pkg.localeCompare(b.pkg),
  );
}

export function summarize(findings: Finding[]) {
  const sev: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  const kind: Record<Kind, number> = { vuln: 0, license: 0, misconfig: 0 };
  for (const f of findings) {
    sev[f.severity]++;
    kind[f.kind]++;
  }
  const licHigh = findings.filter((f) => f.kind === "license" && (f.severity === "high" || f.severity === "critical")).length;
  const miscHigh = findings.filter((f) => f.kind === "misconfig" && (f.severity === "high" || f.severity === "critical")).length;
  return { sev, kind, licHigh, miscHigh, total: findings.length };
}

export function sevChips(findings: Finding[]) {
  const { sev } = summarize(findings);
  return SEV_ORDER.filter((k) => sev[k] > 0).map((k) => ({
    key: k,
    count: sev[k],
    kr: SEV_META[k].kr,
    bg: SEV_META[k].bg,
    fg: SEV_META[k].fg,
  }));
}

export interface PreppedFinding extends Finding {
  sevKr: string;
  sevBg: string;
  sevFg: string;
  kindKr: string;
  kindIcon: string;
  right: string;
}

export function prep(f: Finding): PreppedFinding {
  const sm = SEV_META[f.severity] ?? SEV_META.unknown;
  const km = KIND_META[f.kind];
  const right = f.kind === "vuln" ? (f.fixed ? `${f.installed} → ${f.fixed}` : "수정버전 없음") : f.note ?? "";
  return { ...f, sevKr: sm.kr, sevBg: sm.bg, sevFg: sm.fg, kindKr: km.kr, kindIcon: km.icon, right };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run test/meta.test.ts`
Expected: PASS (4 describe 블록 모두 통과).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/meta.ts test/meta.test.ts
git commit -m "feat: add shared types and severity/kind meta helpers"
```

---

## Task 2: 라이선스 위험도 분류기 (lib/checks/license-risk.ts)

**Files:**
- Create: `lib/checks/license-risk.ts`
- Test: `test/license-risk.test.ts`

**Interfaces:**
- Consumes: `Severity` from `@/lib/types`.
- Produces: `classifyLicense(name: string): { severity: Severity; note: string }`
  - high → `'강한 카피레프트'`, medium → `'약한 카피레프트'`, low → `'허용형'`, unknown → `'검토 필요'`.

- [ ] **Step 1: 실패 테스트 작성**

`test/license-risk.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { classifyLicense } from "@/lib/checks/license-risk";

describe("classifyLicense", () => {
  it("강한 카피레프트는 high", () => {
    expect(classifyLicense("AGPL-3.0").severity).toBe("high");
    expect(classifyLicense("GPL-2.0").severity).toBe("high");
    expect(classifyLicense("GPL-3.0-only").severity).toBe("high");
  });
  it("약한 카피레프트는 medium", () => {
    expect(classifyLicense("LGPL-2.1").severity).toBe("medium");
    expect(classifyLicense("MPL-2.0").severity).toBe("medium");
  });
  it("허용형은 low", () => {
    expect(classifyLicense("MIT").severity).toBe("low");
    expect(classifyLicense("Apache-2.0").severity).toBe("low");
    expect(classifyLicense("BSD-3-Clause").severity).toBe("low");
  });
  it("매핑에 없으면 unknown + 검토 필요", () => {
    const r = classifyLicense("SEE LICENSE IN LICENSE");
    expect(r.severity).toBe("unknown");
    expect(r.note).toBe("검토 필요");
  });
  it("대소문자·공백을 무시하고 매칭한다", () => {
    expect(classifyLicense("  agpl-3.0  ").severity).toBe("high");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/license-risk.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`lib/checks/license-risk.ts`:
```ts
import type { Severity } from "@/lib/types";

// prefix 매칭(정규화된 라이선스명 소문자, 하이픈 유지)
const STRONG_COPYLEFT = ["agpl", "gpl-2", "gpl-3", "gpl 2", "gpl 3", "gpl-1", "sspl", "osl"];
const WEAK_COPYLEFT = ["lgpl", "mpl", "epl", "cddl", "cpl", "eupl"];
const PERMISSIVE = ["mit", "apache", "bsd", "isc", "zlib", "unlicense", "0bsd", "wtfpl", "cc0", "python-2"];

function norm(name: string): string {
  return name.trim().toLowerCase();
}

export function classifyLicense(name: string): { severity: Severity; note: string } {
  const n = norm(name);
  if (STRONG_COPYLEFT.some((p) => n.startsWith(p))) return { severity: "high", note: "강한 카피레프트" };
  if (WEAK_COPYLEFT.some((p) => n.startsWith(p))) return { severity: "medium", note: "약한 카피레프트" };
  if (PERMISSIVE.some((p) => n.startsWith(p))) return { severity: "low", note: "허용형" };
  return { severity: "unknown", note: "검토 필요" };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run test/license-risk.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/checks/license-risk.ts test/license-risk.test.ts
git commit -m "feat: add license risk classifier"
```

---

## Task 3: Trivy 결과 정규화 (lib/scan/normalize.ts)

**Files:**
- Create: `lib/scan/normalize.ts`
- Create: `test/fixtures/trivy-fs.json`
- Test: `test/normalize.test.ts`

**Interfaces:**
- Consumes: `TrivyOutput`, `Finding` from `@/lib/types`; `classifyLicense` from `@/lib/checks/license-risk`.
- Produces: `normalizeTrivy(raw: TrivyOutput): Finding[]`
  - Vulnerabilities → `kind:'vuln'`; severity는 Trivy 값을 소문자화(매핑 외엔 'unknown').
  - Licenses → `kind:'license'`; severity·note는 `classifyLicense(Name)`로 결정.
  - Misconfigurations → `kind:'misconfig'`; note는 `Resolution`.

- [ ] **Step 1: 픽스처 작성**

`test/fixtures/trivy-fs.json`:
```json
{
  "SchemaVersion": 2,
  "ArtifactName": "test-project",
  "Results": [
    {
      "Target": "package-lock.json",
      "Class": "lang-pkgs",
      "Type": "npm",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2021-23337",
          "PkgName": "lodash",
          "InstalledVersion": "4.17.19",
          "FixedVersion": "4.17.21",
          "Severity": "HIGH",
          "Title": "lodash: command injection via template",
          "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2021-23337"
        },
        {
          "VulnerabilityID": "CVE-2099-0000",
          "PkgName": "mystery",
          "InstalledVersion": "1.0.0",
          "Severity": "WEIRD",
          "Title": "no fixed version, unknown severity"
        }
      ]
    },
    {
      "Target": "package-lock.json",
      "Class": "license",
      "Licenses": [
        { "PkgName": "ghostscript4js", "Name": "AGPL-3.0", "Category": "restricted", "Severity": "HIGH" },
        { "PkgName": "left-pad", "Name": "MIT", "Category": "notice", "Severity": "LOW" }
      ]
    },
    {
      "Target": "Dockerfile",
      "Class": "config",
      "Type": "dockerfile",
      "Misconfigurations": [
        {
          "ID": "DS002",
          "Title": "Image user should not be 'root'",
          "Description": "Running containers as root is dangerous",
          "Severity": "HIGH",
          "Resolution": "Add 'USER <non root user name>' to the Dockerfile"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 실패 테스트 작성**

`test/normalize.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeTrivy } from "@/lib/scan/normalize";
import fixture from "./fixtures/trivy-fs.json";
import type { TrivyOutput } from "@/lib/types";

describe("normalizeTrivy", () => {
  const findings = normalizeTrivy(fixture as TrivyOutput);

  it("취약점을 매핑하고 severity를 소문자화한다", () => {
    const lodash = findings.find((f) => f.identifier === "CVE-2021-23337")!;
    expect(lodash.kind).toBe("vuln");
    expect(lodash.severity).toBe("high");
    expect(lodash.pkg).toBe("lodash");
    expect(lodash.installed).toBe("4.17.19");
    expect(lodash.fixed).toBe("4.17.21");
  });

  it("알 수 없는 severity와 누락 필드를 방어적으로 처리한다", () => {
    const mystery = findings.find((f) => f.identifier === "CVE-2099-0000")!;
    expect(mystery.severity).toBe("unknown");
    expect(mystery.fixed).toBeUndefined();
  });

  it("라이선스 severity는 classifyLicense로 결정한다", () => {
    const agpl = findings.find((f) => f.kind === "license" && f.pkg === "ghostscript4js")!;
    expect(agpl.severity).toBe("high");
    expect(agpl.note).toBe("강한 카피레프트");
    const mit = findings.find((f) => f.kind === "license" && f.pkg === "left-pad")!;
    expect(mit.severity).toBe("low");
  });

  it("구성 이슈를 매핑하고 note에 Resolution을 넣는다", () => {
    const ds = findings.find((f) => f.kind === "misconfig")!;
    expect(ds.identifier).toBe("DS002");
    expect(ds.severity).toBe("high");
    expect(ds.note).toContain("USER");
  });

  it("Results가 없으면 빈 배열", () => {
    expect(normalizeTrivy({})).toEqual([]);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run test/normalize.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: 구현**

`lib/scan/normalize.ts`:
```ts
import type { Finding, Severity, TrivyOutput } from "@/lib/types";
import { classifyLicense } from "@/lib/checks/license-risk";

const SEV_MAP: Record<string, Severity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  UNKNOWN: "unknown",
};

function toSeverity(raw?: string): Severity {
  return SEV_MAP[(raw ?? "").toUpperCase()] ?? "unknown";
}

export function normalizeTrivy(raw: TrivyOutput): Finding[] {
  const out: Finding[] = [];
  for (const r of raw.Results ?? []) {
    for (const v of r.Vulnerabilities ?? []) {
      out.push({
        kind: "vuln",
        severity: toSeverity(v.Severity),
        pkg: v.PkgName ?? "unknown",
        identifier: v.VulnerabilityID ?? "unknown",
        title: v.Title ?? v.VulnerabilityID ?? "취약점",
        installed: v.InstalledVersion,
        fixed: v.FixedVersion || undefined,
      });
    }
    for (const l of r.Licenses ?? []) {
      const name = l.Name ?? "unknown";
      const { severity, note } = classifyLicense(name);
      out.push({
        kind: "license",
        severity,
        pkg: l.PkgName ?? "unknown",
        identifier: name,
        title: note === "검토 필요" ? "분류되지 않은 라이선스" : `${note} 라이선스`,
        note,
      });
    }
    for (const m of r.Misconfigurations ?? []) {
      out.push({
        kind: "misconfig",
        severity: toSeverity(m.Severity),
        pkg: r.Target ?? "unknown",
        identifier: m.ID ?? "unknown",
        title: m.Title ?? m.ID ?? "구성 이슈",
        note: m.Resolution,
      });
    }
  }
  return out;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run test/normalize.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/scan/normalize.ts test/normalize.test.ts test/fixtures/trivy-fs.json
git commit -m "feat: normalize Trivy fs JSON into Finding model"
```

---

## Task 4: DB 계층 (lib/db/index.ts, lib/db/queries.ts)

**Files:**
- Create: `lib/db/index.ts`
- Create: `lib/db/queries.ts`
- Test: `test/db.test.ts`

**Interfaces:**
- Consumes: `Project`, `Scan`, `Finding`, `ScanStatus` from `@/lib/types`.
- Produces (from `lib/db/queries.ts`, 모두 동기):
  - `createDb(path: string): Database` — 스키마 보장(`lib/db/index.ts`의 `migrate` 사용)
  - `insertProject(db, p: Omit<Project,'id'|'created'> & {id:string; created:string}): Project`
  - `listProjects(db): Project[]`
  - `getProject(db, id: string): Project | undefined`
  - `insertScan(db, s: { id:string; projectId:string; status:ScanStatus; started:string }): void`
  - `updateScan(db, id: string, patch: Partial<Pick<Scan,'status'|'finished'|'duration'|'trivy'|'error'|'step'>>): void`
  - `replaceFindings(db, scanId: string, findings: Finding[]): void`
  - `getScan(db, id: string): Scan | undefined` (findings 포함)
  - `listScans(db, projectId: string): Scan[]` (started 내림차순, findings 포함)
- `lib/db/index.ts`: `migrate(db)` + 싱글톤 `getDb()` (경로 `data/ossm.db`, `OSSM_DB_PATH` env로 오버라이드, 테스트는 `:memory:`).

- [ ] **Step 1: 실패 테스트 작성**

`test/db.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db";
import {
  insertProject, listProjects, getProject,
  insertScan, updateScan, replaceFindings, getScan, listScans,
} from "@/lib/db/queries";
import type { Finding } from "@/lib/types";

let db: InstanceType<typeof Database>;
beforeEach(() => {
  db = new Database(":memory:");
  migrate(db);
});

const findings: Finding[] = [
  { kind: "vuln", severity: "high", pkg: "lodash", identifier: "CVE-2021-23337", title: "ci", installed: "4.17.19", fixed: "4.17.21" },
  { kind: "license", severity: "high", pkg: "g4js", identifier: "AGPL-3.0", title: "강한 카피레프트 라이선스", note: "강한 카피레프트" },
];

it("프로젝트를 저장하고 조회한다", () => {
  insertProject(db, { id: "p1", name: "web", type: "github", value: "https://github.com/a/b", created: "2026-06-19" });
  expect(listProjects(db)).toHaveLength(1);
  expect(getProject(db, "p1")?.name).toBe("web");
});

it("스캔 생성·갱신·findings 저장·조회 왕복", () => {
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "running", started: "2026-06-19 10:00" });
  updateScan(db, "s1", { status: "done", finished: "2026-06-19 10:02", duration: "2분", trivy: "0.50.1", step: 5 });
  replaceFindings(db, "s1", findings);

  const scan = getScan(db, "s1")!;
  expect(scan.status).toBe("done");
  expect(scan.trivy).toBe("0.50.1");
  expect(scan.findings).toHaveLength(2);
  expect(scan.findings.find((f) => f.kind === "vuln")?.fixed).toBe("4.17.21");

  expect(listScans(db, "p1")).toHaveLength(1);
});

it("replaceFindings는 기존 findings를 교체한다", () => {
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "running", started: "2026-06-19 10:00" });
  replaceFindings(db, "s1", findings);
  replaceFindings(db, "s1", [findings[0]]);
  expect(getScan(db, "s1")!.findings).toHaveLength(1);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/db.test.ts`
Expected: FAIL — `@/lib/db` 없음.

- [ ] **Step 3: 스키마/연결 구현**

`lib/db/index.ts`:
```ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function migrate(db: InstanceType<typeof Database>): void {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_value TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      duration TEXT,
      trivy TEXT,
      error TEXT,
      step INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL REFERENCES scans(id),
      kind TEXT NOT NULL,
      severity TEXT NOT NULL,
      pkg TEXT NOT NULL,
      identifier TEXT NOT NULL,
      title TEXT NOT NULL,
      detail_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id);
    CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
  `);
}

let _db: InstanceType<typeof Database> | null = null;
export function getDb(): InstanceType<typeof Database> {
  if (_db) return _db;
  const path = process.env.OSSM_DB_PATH ?? "data/ossm.db";
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  _db = new Database(path);
  migrate(_db);
  return _db;
}
```

- [ ] **Step 4: 쿼리 구현**

`lib/db/queries.ts`:
```ts
import type Database from "better-sqlite3";
import type { Finding, Project, Scan, ScanStatus } from "@/lib/types";

type DB = InstanceType<typeof Database>;

export function insertProject(db: DB, p: { id: string; name: string; type: "github" | "local"; value: string; created: string }): Project {
  db.prepare(`INSERT INTO projects (id,name,source_type,source_value,created_at) VALUES (?,?,?,?,?)`)
    .run(p.id, p.name, p.type, p.value, p.created);
  return { id: p.id, name: p.name, type: p.type, value: p.value, created: p.created };
}

function rowToProject(r: any): Project {
  return { id: r.id, name: r.name, type: r.source_type, value: r.source_value, created: r.created_at };
}

export function listProjects(db: DB): Project[] {
  return db.prepare(`SELECT * FROM projects ORDER BY created_at DESC, rowid DESC`).all().map(rowToProject);
}

export function getProject(db: DB, id: string): Project | undefined {
  const r = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  return r ? rowToProject(r) : undefined;
}

export function insertScan(db: DB, s: { id: string; projectId: string; status: ScanStatus; started: string }): void {
  db.prepare(`INSERT INTO scans (id,project_id,status,started_at,step) VALUES (?,?,?,?,0)`)
    .run(s.id, s.projectId, s.status, s.started);
}

export function updateScan(db: DB, id: string, patch: Partial<Pick<Scan, "status" | "finished" | "duration" | "trivy" | "error" | "step">>): void {
  const map: Record<string, string> = { finished: "finished_at" };
  const cols = Object.keys(patch);
  if (cols.length === 0) return;
  const setSql = cols.map((c) => `${map[c] ?? c} = ?`).join(", ");
  const vals = cols.map((c) => (patch as any)[c]);
  db.prepare(`UPDATE scans SET ${setSql} WHERE id = ?`).run(...vals, id);
}

export function replaceFindings(db: DB, scanId: string, findings: Finding[]): void {
  const tx = db.transaction((fs: Finding[]) => {
    db.prepare(`DELETE FROM findings WHERE scan_id = ?`).run(scanId);
    const stmt = db.prepare(`INSERT INTO findings (scan_id,kind,severity,pkg,identifier,title,detail_json) VALUES (?,?,?,?,?,?,?)`);
    for (const f of fs) {
      const detail = JSON.stringify({ installed: f.installed, fixed: f.fixed, note: f.note, hygiene: f.hygiene });
      stmt.run(scanId, f.kind, f.severity, f.pkg, f.identifier, f.title, detail);
    }
  });
  tx(findings);
}

function rowToFinding(r: any): Finding {
  const d = r.detail_json ? JSON.parse(r.detail_json) : {};
  return {
    kind: r.kind, severity: r.severity, pkg: r.pkg, identifier: r.identifier, title: r.title,
    installed: d.installed ?? undefined, fixed: d.fixed ?? undefined, note: d.note ?? undefined, hygiene: d.hygiene ?? undefined,
  };
}

function findingsFor(db: DB, scanId: string): Finding[] {
  return db.prepare(`SELECT * FROM findings WHERE scan_id = ? ORDER BY id`).all(scanId).map(rowToFinding);
}

function rowToScan(db: DB, r: any): Scan {
  return {
    id: r.id, projectId: r.project_id, status: r.status, started: r.started_at,
    finished: r.finished_at ?? undefined, duration: r.duration ?? undefined, trivy: r.trivy ?? undefined,
    error: r.error ?? undefined, step: r.step ?? 0, findings: findingsFor(db, r.id),
  };
}

export function getScan(db: DB, id: string): Scan | undefined {
  const r = db.prepare(`SELECT * FROM scans WHERE id = ?`).get(id);
  return r ? rowToScan(db, r) : undefined;
}

export function listScans(db: DB, projectId: string): Scan[] {
  return db.prepare(`SELECT * FROM scans WHERE project_id = ? ORDER BY started_at DESC, rowid DESC`).all(projectId).map((r) => rowToScan(db, r));
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run test/db.test.ts`
Expected: PASS (3 테스트 통과).

- [ ] **Step 6: Commit**

```bash
git add lib/db test/db.test.ts
git commit -m "feat: add SQLite schema and query layer"
```

---

## Task 5: Trivy 러너 & 버전 체크 (lib/scan/trivy.ts) + health 라우트

**Files:**
- Create: `lib/scan/trivy.ts`
- Modify: `app/api/health/route.ts`
- Test: `test/trivy.test.ts`

**Interfaces:**
- Consumes: `TrivyOutput` from `@/lib/types`.
- Produces:
  - `type Scanner = (dir: string) => Promise<TrivyOutput>`
  - `runTrivyFs: Scanner` — `trivy fs <dir> --scanners vuln,license,misconfig --format json --quiet --timeout 5m` spawn → stdout JSON parse. 비정상 종료/파싱 실패 시 throw(메시지에 stderr 발췌).
  - `getTrivyVersion(): Promise<string | null>` — `trivy --version` 첫 줄에서 버전 추출, 미설치 시 null.

- [ ] **Step 1: 실패 테스트 작성** (버전 파싱 헬퍼만 단위 검증; spawn 자체는 통합에서 확인)

`test/trivy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseTrivyVersion } from "@/lib/scan/trivy";

describe("parseTrivyVersion", () => {
  it("'Version: x.y.z' 형식에서 버전을 뽑는다", () => {
    expect(parseTrivyVersion("Version: 0.50.1\nVulnerability DB:\n  Version: 2")).toBe("0.50.1");
  });
  it("형식이 다르면 null", () => {
    expect(parseTrivyVersion("garbage")).toBe(null);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/trivy.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`lib/scan/trivy.ts`:
```ts
import { spawn } from "node:child_process";
import type { TrivyOutput } from "@/lib/types";

export type Scanner = (dir: string) => Promise<TrivyOutput>;

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { timeout: timeoutMs });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export const runTrivyFs: Scanner = async (dir) => {
  const { code, stdout, stderr } = await run(
    "trivy",
    ["fs", dir, "--scanners", "vuln,license,misconfig", "--format", "json", "--quiet", "--timeout", "5m"],
    6 * 60 * 1000,
  );
  if (code !== 0) throw new Error(`Trivy 실행 실패 (exit ${code}): ${stderr.slice(0, 500)}`);
  try {
    return JSON.parse(stdout) as TrivyOutput;
  } catch {
    throw new Error(`Trivy 출력 JSON 파싱 실패: ${stdout.slice(0, 200)}`);
  }
};

export function parseTrivyVersion(out: string): string | null {
  const m = /Version:\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(out);
  return m ? m[1] : null;
}

export async function getTrivyVersion(): Promise<string | null> {
  try {
    const { code, stdout } = await run("trivy", ["--version"], 10000);
    if (code !== 0) return null;
    return parseTrivyVersion(stdout);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: health 라우트 교체**

`app/api/health/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getTrivyVersion } from "@/lib/scan/trivy";

export const dynamic = "force-dynamic";

export async function GET() {
  const trivy = await getTrivyVersion();
  return NextResponse.json({ trivy });
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run test/trivy.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/scan/trivy.ts app/api/health/route.ts test/trivy.test.ts
git commit -m "feat: add Trivy fs runner and version-based health check"
```

---

## Task 6: 대상 확보 — 로컬 & GitHub (lib/ingest/*)

**Files:**
- Create: `lib/ingest/local.ts`
- Create: `lib/ingest/github.ts`
- Test: `test/ingest-local.test.ts`

**Interfaces:**
- Produces:
  - `interface IngestResult { dir: string; cleanup: () => Promise<void> }`
  - `resolveLocal(path: string): Promise<IngestResult>` — 존재하는 디렉토리면 `{ dir, cleanup: noop }`, 아니면 throw(`'경로가 존재하지 않거나 디렉토리가 아닙니다: <path>'`).
  - `cloneGithub(url: string, token?: string): Promise<IngestResult>` — `git clone --depth 1` 임시 디렉토리에. token 있으면 URL에 주입. cleanup은 임시 디렉토리 삭제. 실패 시 throw(`'git clone 실패: ... (exit N)'`).

- [ ] **Step 1: 로컬 실패 테스트 작성**

`test/ingest-local.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { resolveLocal } from "@/lib/ingest/local";
import { tmpdir } from "node:os";

describe("resolveLocal", () => {
  it("존재하는 디렉토리는 그대로 반환한다", async () => {
    const r = await resolveLocal(tmpdir());
    expect(r.dir).toBe(tmpdir());
    await r.cleanup(); // noop, throw 없어야 함
  });
  it("없는 경로는 throw", async () => {
    await expect(resolveLocal("/no/such/path/xyz123")).rejects.toThrow("경로가 존재하지");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/ingest-local.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 로컬 구현**

`lib/ingest/local.ts`:
```ts
import { stat } from "node:fs/promises";

export interface IngestResult {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function resolveLocal(path: string): Promise<IngestResult> {
  let ok = false;
  try {
    ok = (await stat(path)).isDirectory();
  } catch {
    ok = false;
  }
  if (!ok) throw new Error(`경로가 존재하지 않거나 디렉토리가 아닙니다: ${path}`);
  return { dir: path, cleanup: async () => {} };
}
```

- [ ] **Step 4: GitHub clone 구현**

`lib/ingest/github.ts`:
```ts
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IngestResult } from "@/lib/ingest/local";

function withToken(url: string, token?: string): string {
  if (!token) return url;
  try {
    const u = new URL(url);
    u.username = token;
    u.password = "x-oauth-basic";
    return u.toString();
  } catch {
    return url;
  }
}

export async function cloneGithub(url: string, token?: string): Promise<IngestResult> {
  const dir = await mkdtemp(join(tmpdir(), "ossm-clone-"));
  const cleanup = async () => { await rm(dir, { recursive: true, force: true }); };
  const code: number = await new Promise((resolve, reject) => {
    const child = spawn("git", ["clone", "--depth", "1", withToken(url, token), dir], { timeout: 3 * 60 * 1000 });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (c) => resolve(c ?? -1));
  });
  if (code !== 0) {
    await cleanup();
    throw new Error(`git clone 실패: repository not found 또는 토큰 인증 필요 (exit ${code})`);
  }
  return { dir, cleanup };
}
```

- [ ] **Step 5: 로컬 테스트 통과 확인**

Run: `npx vitest run test/ingest-local.test.ts`
Expected: PASS. (cloneGithub은 네트워크 의존이라 Task 11 수동 검증에서 확인.)

- [ ] **Step 6: Commit**

```bash
git add lib/ingest test/ingest-local.test.ts
git commit -m "feat: add local-path and github-clone ingestion"
```

---

## Task 7: GitHub 위생 점검 (lib/checks/github-hygiene.ts)

**Files:**
- Create: `lib/checks/github-hygiene.ts`
- Test: `test/github-hygiene.test.ts`

**Interfaces:**
- Consumes: `Finding` from `@/lib/types`.
- Produces: `fetchHygieneFindings(repoUrl: string, token: string, fetchImpl?: typeof fetch): Promise<Finding[]>`
  - 토큰으로 GitHub API 조회 → 위생 항목을 `kind:'misconfig', hygiene:true` finding으로 반환.
  - 점검: (1) 기본 브랜치 보호 미설정 → GH-BRANCH(medium), (2) SECURITY.md 없음 → GH-SECURITY(low), (3) LICENSE 없음 → GH-LICENSE(low).
  - 네트워크/권한 오류는 삼켜서 빈 배열(위생 점검은 부가 기능).

- [ ] **Step 1: 실패 테스트 작성** (주입된 fetch로 GitHub API 모킹)

`test/github-hygiene.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { fetchHygieneFindings } from "@/lib/checks/github-hygiene";

function mockFetch(routes: Record<string, { status: number; body?: any }>): typeof fetch {
  return (async (url: string) => {
    const key = Object.keys(routes).find((k) => String(url).includes(k));
    const r = key ? routes[key] : { status: 404 };
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body ?? {} } as Response;
  }) as unknown as typeof fetch;
}

describe("fetchHygieneFindings", () => {
  it("보호 미설정·문서 없음을 finding으로 만든다", async () => {
    const f = await fetchHygieneFindings("https://github.com/a/b", "tok", mockFetch({
      "/branches/": { status: 200, body: { protected: false } },
      "/contents/SECURITY.md": { status: 404 },
      "/contents/LICENSE": { status: 404 },
      "/repos/a/b": { status: 200, body: { default_branch: "main" } },
    }));
    const ids = f.map((x) => x.identifier);
    expect(ids).toContain("GH-BRANCH");
    expect(ids).toContain("GH-SECURITY");
    expect(ids).toContain("GH-LICENSE");
    expect(f.every((x) => x.hygiene === true && x.kind === "misconfig")).toBe(true);
  });

  it("모두 양호하면 빈 배열", async () => {
    const f = await fetchHygieneFindings("https://github.com/a/b", "tok", mockFetch({
      "/repos/a/b": { status: 200, body: { default_branch: "main" } },
      "/branches/": { status: 200, body: { protected: true } },
      "/contents/SECURITY.md": { status: 200, body: {} },
      "/contents/LICENSE": { status: 200, body: {} },
    }));
    expect(f).toEqual([]);
  });

  it("잘못된 URL이면 빈 배열", async () => {
    expect(await fetchHygieneFindings("not-a-url", "tok", mockFetch({}))).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/github-hygiene.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`lib/checks/github-hygiene.ts`:
```ts
import type { Finding } from "@/lib/types";

function parseRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export async function fetchHygieneFindings(repoUrl: string, token: string, fetchImpl: typeof fetch = fetch): Promise<Finding[]> {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return [];
  const { owner, repo } = parsed;
  const base = "https://api.github.com";
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  const out: Finding[] = [];
  try {
    const repoRes = await fetchImpl(`${base}/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) return [];
    const meta = await repoRes.json();
    const branch = meta.default_branch ?? "main";

    const branchRes = await fetchImpl(`${base}/repos/${owner}/${repo}/branches/${branch}`, { headers });
    if (branchRes.ok) {
      const b = await branchRes.json();
      if (!b.protected) {
        out.push({ kind: "misconfig", severity: "medium", pkg: "repository", identifier: "GH-BRANCH", title: "기본 브랜치 보호 규칙 미설정", note: "필수 리뷰 설정", hygiene: true });
      }
    }
    const sec = await fetchImpl(`${base}/repos/${owner}/${repo}/contents/SECURITY.md`, { headers });
    if (!sec.ok) {
      out.push({ kind: "misconfig", severity: "low", pkg: "repository", identifier: "GH-SECURITY", title: "SECURITY.md 보안 정책 파일 없음", note: "신고 절차 문서화", hygiene: true });
    }
    const lic = await fetchImpl(`${base}/repos/${owner}/${repo}/contents/LICENSE`, { headers });
    if (!lic.ok) {
      out.push({ kind: "misconfig", severity: "low", pkg: "repository", identifier: "GH-LICENSE", title: "LICENSE 파일 없음", note: "라이선스 명시", hygiene: true });
    }
  } catch {
    return [];
  }
  return out;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run test/github-hygiene.test.ts`
Expected: PASS (3 테스트).

- [ ] **Step 5: Commit**

```bash
git add lib/checks/github-hygiene.ts test/github-hygiene.test.ts
git commit -m "feat: add optional GitHub repo hygiene checks"
```

---

## Task 8: 스캔 잡 러너 (lib/jobs/runner.ts)

**Files:**
- Create: `lib/jobs/runner.ts`
- Test: `test/runner.test.ts`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`; query functions from `@/lib/db/queries`; `Scanner`/`runTrivyFs` from `@/lib/scan/trivy`; `normalizeTrivy` from `@/lib/scan/normalize`; `resolveLocal`/`cloneGithub`/`IngestResult` from ingest; `fetchHygieneFindings` from hygiene; `getProject`,`getScan` etc.
- Produces:
  - `interface RunnerDeps { db; scanner: Scanner; ingest: (p: Project) => Promise<IngestResult>; hygiene?: (p: Project) => Promise<Finding[]>; now: () => string }`
  - `runScanJob(scanId: string, deps?: Partial<RunnerDeps>): Promise<void>`
    - 단계별 `updateScan(step)` 진행: 1 큐등록 → 2 대상확보 → 3 Trivy → 4 정규화 → 5 분류·집계 → done.
    - 실패 시 `status:'failed'`, `error` 기록. 항상 `ingest.cleanup()` 호출.
  - `startScanJob(scanId)` — `runScanJob`를 fire-and-forget(에러는 잡 내부에서 DB에 기록).

- [ ] **Step 1: 실패 테스트 작성** (인메모리 DB + 가짜 scanner/ingest 주입)

`test/runner.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db";
import { insertProject, insertScan, getProject, getScan } from "@/lib/db/queries";
import { runScanJob } from "@/lib/jobs/runner";
import type { Project, TrivyOutput } from "@/lib/types";

let db: InstanceType<typeof Database>;
beforeEach(() => {
  db = new Database(":memory:");
  migrate(db);
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "queued", started: "2026-06-19 10:00" });
});

const fakeTrivy: TrivyOutput = {
  Results: [{ Target: "package-lock.json", Vulnerabilities: [{ VulnerabilityID: "CVE-1", PkgName: "lodash", InstalledVersion: "1", FixedVersion: "2", Severity: "HIGH", Title: "x" }] }],
};

const deps = (over = {}) => ({
  db,
  scanner: async () => fakeTrivy,
  ingest: async (_p: Project) => ({ dir: "/tmp/x", cleanup: async () => {} }),
  now: () => "2026-06-19 10:02",
  ...over,
});

it("성공 경로: done + findings 저장 + step 5", async () => {
  await runScanJob("s1", deps());
  const s = getScan(db, "s1")!;
  expect(s.status).toBe("done");
  expect(s.step).toBe(5);
  expect(s.findings).toHaveLength(1);
  expect(s.finished).toBe("2026-06-19 10:02");
});

it("ingest 실패: failed + error 기록 + cleanup 호출", async () => {
  let cleaned = false;
  await runScanJob("s1", deps({
    ingest: async () => ({ dir: "/x", cleanup: async () => { cleaned = true; } }),
    scanner: async () => { throw new Error("Trivy 실행 실패 (exit 1): boom"); },
  }));
  const s = getScan(db, "s1")!;
  expect(s.status).toBe("failed");
  expect(s.error).toContain("Trivy 실행 실패");
  expect(cleaned).toBe(true);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run test/runner.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`lib/jobs/runner.ts`:
```ts
import type Database from "better-sqlite3";
import type { Finding, Project } from "@/lib/types";
import { getDb } from "@/lib/db";
import { getProject, getScan, updateScan, replaceFindings } from "@/lib/db/queries";
import { runTrivyFs, getTrivyVersion, type Scanner } from "@/lib/scan/trivy";
import { normalizeTrivy } from "@/lib/scan/normalize";
import { resolveLocal } from "@/lib/ingest/local";
import { cloneGithub } from "@/lib/ingest/github";
import type { IngestResult } from "@/lib/ingest/local";
import { fetchHygieneFindings } from "@/lib/checks/github-hygiene";

type DB = InstanceType<typeof Database>;

export interface RunnerDeps {
  db: DB;
  scanner: Scanner;
  ingest: (p: Project) => Promise<IngestResult>;
  hygiene: (p: Project) => Promise<Finding[]>;
  now: () => string;
}

function nowLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function defaultIngest(p: Project): Promise<IngestResult> {
  if (p.type === "github") return cloneGithub(p.value, process.env.GITHUB_TOKEN);
  return resolveLocal(p.value);
}

async function defaultHygiene(p: Project): Promise<Finding[]> {
  const token = process.env.GITHUB_TOKEN;
  if (p.type !== "github" || !token) return [];
  return fetchHygieneFindings(p.value, token);
}

export async function runScanJob(scanId: string, partial?: Partial<RunnerDeps>): Promise<void> {
  const deps: RunnerDeps = {
    db: partial?.db ?? getDb(),
    scanner: partial?.scanner ?? runTrivyFs,
    ingest: partial?.ingest ?? defaultIngest,
    hygiene: partial?.hygiene ?? defaultHygiene,
    now: partial?.now ?? nowLabel,
  };
  const { db } = deps;
  const scan = getScan(db, scanId);
  if (!scan) return;
  const project = getProject(db, scan.projectId);
  if (!project) {
    updateScan(db, scanId, { status: "failed", error: "프로젝트를 찾을 수 없습니다", finished: deps.now() });
    return;
  }

  let ingest: IngestResult | null = null;
  try {
    updateScan(db, scanId, { status: "running", step: 1, trivy: (await getTrivyVersion()) ?? undefined });
    ingest = await deps.ingest(project); // step 2: 대상 확보
    updateScan(db, scanId, { step: 2 });
    const raw = await deps.scanner(ingest.dir); // step 3: Trivy
    updateScan(db, scanId, { step: 3 });
    const findings = normalizeTrivy(raw); // step 4: 정규화
    updateScan(db, scanId, { step: 4 });
    const hyg = await deps.hygiene(project);
    replaceFindings(db, scanId, [...findings, ...hyg]); // step 5: 분류·집계
    updateScan(db, scanId, { status: "done", step: 5, finished: deps.now() });
  } catch (e) {
    updateScan(db, scanId, { status: "failed", error: e instanceof Error ? e.message : String(e), finished: deps.now() });
  } finally {
    if (ingest) await ingest.cleanup().catch(() => {});
  }
}

export function startScanJob(scanId: string): void {
  void runScanJob(scanId);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run test/runner.test.ts`
Expected: PASS (2 테스트).

- [ ] **Step 5: 전체 단위 테스트 회귀 확인**

Run: `npm test`
Expected: 전체 PASS (meta, license-risk, normalize, db, trivy, ingest-local, github-hygiene, runner).

- [ ] **Step 6: Commit**

```bash
git add lib/jobs/runner.ts test/runner.test.ts
git commit -m "feat: add in-process scan job runner with injectable deps"
```

---

## Task 9: API 라우트 (projects / scans)

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`
- Create: `app/api/projects/[id]/scans/route.ts`
- Create: `app/api/scans/[id]/route.ts`
- Create: `lib/api/dto.ts` (응답 조립 헬퍼)

**Interfaces:**
- Produces (JSON 응답 형태):
  - `GET /api/projects` → `{ id,name,type,value,created, scans: Scan[] }[]` (홈에서 최신 스캔 칩 계산용; scans는 최신순)
  - `POST /api/projects` body `{ name, type, value }` → 생성된 project. 검증 실패 시 400 `{ error }`.
  - `GET /api/projects/:id` → `{ ...project, scans: Scan[] }` 또는 404.
  - `POST /api/projects/:id/scans` → 생성된 `Scan`(status queued/running), 잡 트리거. 프로젝트 없으면 404.
  - `GET /api/scans/:id` → `Scan`(findings 포함) 또는 404.
- `lib/api/dto.ts`: `projectWithScans(db, project): {...Project, scans: Scan[]}`, `genId(prefix): string`, `startedLabel(): string`.

- [ ] **Step 1: DTO 헬퍼 작성**

`lib/api/dto.ts`:
```ts
import type Database from "better-sqlite3";
import type { Project, Scan } from "@/lib/types";
import { listScans } from "@/lib/db/queries";

export function projectWithScans(db: InstanceType<typeof Database>, project: Project): Project & { scans: Scan[] } {
  return { ...project, scans: listScans(db, project.id) };
}

export function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function startedLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
```

- [ ] **Step 2: projects 컬렉션 라우트**

`app/api/projects/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects, insertProject } from "@/lib/db/queries";
import { projectWithScans, genId } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(listProjects(db).map((p) => projectWithScans(db, p)));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const type = body.type === "local" ? "local" : "github";
  const value = String(body.value ?? "").trim();
  if (!name || !value) return NextResponse.json({ error: "이름과 경로를 입력하세요" }, { status: 400 });
  const db = getDb();
  const created = new Date().toISOString().slice(0, 10);
  const project = insertProject(db, { id: genId("p"), name, type, value, created });
  return NextResponse.json(project, { status: 201 });
}
```

- [ ] **Step 3: project 단건 라우트**

`app/api/projects/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/db/queries";
import { projectWithScans } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const p = getProject(db, params.id);
  if (!p) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(projectWithScans(db, p));
}
```

- [ ] **Step 4: 스캔 트리거 라우트**

`app/api/projects/[id]/scans/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, insertScan, getScan } from "@/lib/db/queries";
import { genId, startedLabel } from "@/lib/api/dto";
import { startScanJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const project = getProject(db, params.id);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  const id = genId("s");
  insertScan(db, { id, projectId: project.id, status: "queued", started: startedLabel() });
  startScanJob(id);
  return NextResponse.json(getScan(db, id), { status: 201 });
}
```

- [ ] **Step 5: 스캔 상태 라우트**

`app/api/scans/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getScan } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = getScan(getDb(), params.id);
  if (!s) return NextResponse.json({ error: "스캔을 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(s);
}
```

- [ ] **Step 6: 수동 검증**

Run: `npm run dev` (별도 터미널), 그 다음:
```bash
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/projects -H 'content-type: application/json' -d '{"name":"demo","type":"local","value":"/home/pc/work/ossm"}'
curl -s localhost:3000/api/projects
```
Expected: health는 `{"trivy": "<버전>" 또는 null}`. POST는 201 + project. GET은 방금 만든 프로젝트가 `scans:[]`로 포함. (`/home/pc/work/ossm` 경로로 POST→scans 트리거 시 Trivy 설치돼 있으면 done까지 진행.)

- [ ] **Step 7: Commit**

```bash
git add app/api/projects app/api/scans lib/api/dto.ts
git commit -m "feat: add projects and scans REST API routes"
```

---

## Task 10: 공유 UI 컴포넌트 + API 클라이언트

**Files:**
- Create: `components/Icon.tsx`, `components/NavRail.tsx`, `components/SeverityChip.tsx`, `components/FindingRow.tsx`
- Create: `lib/api/client.ts`

**Interfaces:**
- Produces:
  - `<Icon name filled? size? color? />` — `<span className="md-icon">`.
  - `<NavRail active="projects"|"settings" onHome onSettings />` — 좌측 88px 레일 (프로토타입 navigation rail 마크업).
  - `<SeverityChip severity count? />` — SEV_META 색상 칩.
  - `<FindingRow f: PreppedFinding showSeverity? />` — finding 한 줄 (프로토타입 tab/table row 마크업).
  - `lib/api/client.ts`: `fetchProjects()`, `createProject(body)`, `fetchProject(id)`, `triggerScan(id)`, `fetchScan(id)` — `fetch` 래퍼, JSON 반환.

- [ ] **Step 1: API 클라이언트 작성**

`lib/api/client.ts`:
```ts
import type { Project, Scan } from "@/lib/types";

type ProjectWithScans = Project & { scans: Scan[] };

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `요청 실패 (${res.status})`);
  return res.json() as Promise<T>;
}

export const fetchProjects = () => fetch("/api/projects").then((r) => j<ProjectWithScans[]>(r));
export const createProject = (body: { name: string; type: "github" | "local"; value: string }) =>
  fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<Project>(r));
export const fetchProject = (id: string) => fetch(`/api/projects/${id}`).then((r) => j<ProjectWithScans>(r));
export const triggerScan = (id: string) => fetch(`/api/projects/${id}/scans`, { method: "POST" }).then((r) => j<Scan>(r));
export const fetchScan = (id: string) => fetch(`/api/scans/${id}`).then((r) => j<Scan>(r));
```

- [ ] **Step 2: Icon + SeverityChip 작성**

`components/Icon.tsx`:
```tsx
export function Icon({ name, filled, size = 24, color, style }: { name: string; filled?: boolean; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span className={filled ? "md-icon is-filled" : "md-icon"} style={{ fontSize: size, color, ...style }}>
      {name}
    </span>
  );
}
```

`components/SeverityChip.tsx`:
```tsx
import { SEV_META } from "@/lib/meta";
import type { Severity } from "@/lib/types";

export function SeverityChip({ severity, count, width }: { severity: Severity; count?: number; width?: number }) {
  const m = SEV_META[severity];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "3px 10px", width, borderRadius: 9999, fontSize: 12, fontWeight: 600, background: m.bg, color: m.fg }}>
      {m.kr}{count != null ? ` ${count}` : ""}
    </span>
  );
}
```

- [ ] **Step 3: NavRail + FindingRow 작성** (마크업은 `design/prototype.dc.html`의 navigation rail / tab row 블록을 그대로 옮기되 `{{ }}`를 props로 대체)

`components/NavRail.tsx` — 프로토타입 `<!-- Navigation rail -->` 블록(폭 88px, shield 로고 + 프로젝트/설정 버튼). `active` prop으로 선택 표시(배경 secondary-container 여부), `onHome`/`onSettings` 핸들러 연결.

`components/FindingRow.tsx` — 프로토타입 scan-results의 tab/table 한 줄 블록(심각도 칩 옵션 + 종류 아이콘/라벨 + 제목·대상 + 우측 조치). props: `{ f: PreppedFinding; showSeverity?: boolean }`. `f.sevBg/f.sevFg/f.sevKr/f.kindIcon/f.kindKr/f.title/f.pkg/f.identifier/f.right` 사용.

전체 인라인 스타일은 프로토타입 해당 블록과 1:1 일치시킬 것(색상은 CSS 변수 그대로).

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0.

- [ ] **Step 5: Commit**

```bash
git add components lib/api/client.ts
git commit -m "feat: add shared UI components and API client"
```

---

## Task 11: 홈 화면 (app/page.tsx)

**Files:**
- Replace: `app/page.tsx`

**Interfaces:**
- Consumes: `fetchProjects`, `createProject` from client; `NavRail`, `Icon`, `SeverityChip`; `sevChips` from meta.
- Produces: 클라이언트 컴포넌트 홈. 프로토타입 HOME 섹션 + ADD PROJECT DIALOG + SNACKBAR 마크업을 React로 포팅.

- [ ] **Step 1: 홈 구현** (프로토타입 `<!-- ============ HOME ============ -->` + 다이얼로그 + 스낵바 블록 포팅)

`app/page.tsx` (요지 — 마크업 디테일은 프로토타입과 1:1):
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavRail } from "@/components/NavRail";
import { Icon } from "@/components/Icon";
import { SeverityChip } from "@/components/SeverityChip";
import { fetchProjects, createProject } from "@/lib/api/client";
import { sevChips } from "@/lib/meta";
import type { Project, Scan } from "@/lib/types";

type PWS = Project & { scans: Scan[] };

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<PWS[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"github" | "local">("github");
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [snack, setSnack] = useState<string | null>(null);

  const load = () => fetchProjects().then(setProjects).catch((e) => setSnack(e.message));
  useEffect(() => { load(); }, []);

  const showSnack = (m: string) => { setSnack(m); setTimeout(() => setSnack(null), 3200); };

  const add = async () => {
    if (!newName.trim() || !newValue.trim()) return showSnack("이름과 경로를 입력하세요");
    try {
      await createProject({ name: newName.trim(), type: newType, value: newValue.trim() });
      setDialogOpen(false); setNewName(""); setNewValue("");
      await load(); showSnack("프로젝트가 추가되었습니다");
    } catch (e) { showSnack((e as Error).message); }
  };

  // 각 프로젝트의 최신 스캔 → done/failed/none + sevChips + metaLabel (프로토타입 homeProjects 로직과 동일)
  // 렌더: NavRail + 헤더(Trivy 연결 배지) + 프로젝트 목록 카드 + 다이얼로그 + 스낵바
  // 행 클릭 → router.push(`/projects/${p.id}`)
  // ... (프로토타입 HOME 마크업 1:1 포팅)
  return <div>{/* 위 데이터로 프로토타입 HOME/다이얼로그/스낵바 마크업 렌더 */}</div>;
}
```

구현 시 프로토타입 `renderVals().homeProjects` 매핑 로직(최신 스캔 상태→done/failed/none, `sevChips(effFindings)`, metaLabel)을 그대로 옮긴다. `effFindings`의 hygiene 필터는 PoC UI에선 생략(서버가 토큰 없으면 hygiene finding을 애초에 안 만든다).

- [ ] **Step 2: 수동 검증**

Run: `npm run dev` → 브라우저 `localhost:3000`
Expected: 빈 목록 + "프로젝트 추가" 동작. 다이얼로그에서 GitHub/로컬 토글, 추가 시 목록 갱신 + 스낵바. 행 클릭 시 `/projects/:id` 이동(다음 Task에서 렌더).

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement home screen with project list and add dialog"
```

---

## Task 12: 프로젝트 상세 화면 (app/projects/[id]/page.tsx)

**Files:**
- Create: `app/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `fetchProject`, `triggerScan`, `fetchScan`; `NavRail`, `Icon`, `SeverityChip`; `sevChips`.
- Produces: 프로토타입 PROJECT DETAIL 섹션 포팅. running 스캔이 있으면 1초 폴링으로 step 진행/완료 반영.

- [ ] **Step 1: 구현** (프로토타입 `<!-- ============ PROJECT DETAIL ============ -->` 블록 포팅)

핵심 로직:
- `fetchProject(id)`로 로드. "스캔 실행" → `triggerScan(id)` → 목록 새로고침.
- running 스캔이 하나라도 있으면 `setInterval(1000)`으로 `fetchProject` 재호출(또는 `fetchScan`으로 step만) → 단계 표시 갱신. done/failed로 바뀌면 폴링 중지 + 스낵바.
- 스캔 카드: 상태 칩(완료/진행 중/실패 색상은 프로토타입과 동일 — 완료 secondary-container, 진행 tertiary-container, 실패 error-container), 진행 중이면 `SCAN_STEPS` 5단계(check_circle/spinner/radio_button_unchecked), 완료면 sevChips + "결과 보기" → `/scans/:id`, 실패면 error 박스.
- `SCAN_STEPS = ['스캔 대기열 등록','대상 확보 · 경로 검증','Trivy 스캔 실행','결과 정규화','위험도 분류 · 집계']` (서버 step 0~5와 매핑: step 인덱스 i가 `< step`이면 done, `=== step`이면 active, `> step`이면 pending).

- [ ] **Step 2: 수동 검증**

로컬 경로 프로젝트(`/home/pc/work/ossm`)에서 "스캔 실행" → 진행 단계가 보이고(빠르면 즉시 done), 완료 후 sevChips + "결과 보기" 노출. Trivy 미설치 시 실패 카드 + error 메시지.

- [ ] **Step 3: Commit**

```bash
git add app/projects
git commit -m "feat: implement project detail with scan trigger and live progress"
```

---

## Task 13: 스캔 결과 화면 (app/scans/[id]/page.tsx)

**Files:**
- Create: `app/scans/[id]/page.tsx`

**Interfaces:**
- Consumes: `fetchScan`, `fetchProject`(프로젝트명); `prep`, `sortFindings`, `summarize`, `SEV_META`, `KIND_META`; `NavRail`, `Icon`, `SeverityChip`, `FindingRow`.
- Produces: 프로토타입 SCAN RESULTS 섹션 포팅 — 요약 카드 3개 + 뷰 스위처(탭/통합테이블/심각도별) + "PDF 내보내기"(→ `/api/scans/:id/pdf` 새 탭).

- [ ] **Step 1: 구현** (프로토타입 `<!-- ============ SCAN RESULTS ============ -->` 블록 + `renderVals().sr` 로직 포팅)

- 로드: `fetchScan(id)` → done 아니면 "결과 없음/진행 중" 안내. `sortFindings`→`prep` 매핑.
- 요약 카드: 취약점(심각/높음/보통/낮음 분해), 라이선스 위험(고위험 N), 구성 이슈(고위험 N) — `summarize` 사용.
- 뷰 스위처 상태 `variant ∈ {tabs,table,severity}` (기본 tabs):
  - **tabs**: 종류 탭(취약점/라이선스/구성, 개수 표시) + 해당 종류 FindingRow 목록.
  - **table**: 종류 필터 + 심각도 필터 칩 + 필터된 FindingRow(심각도 표시 포함) + "N건 표시 중".
  - **severity**: 심각도별 접이식 그룹(SEV_META 순서, 개수>0만) + 토글.
- "PDF 내보내기" → `window.open('/api/scans/'+id+'/pdf')`. (별도 "보고서 미리보기"는 `/scans/:id/report` 링크로도 제공.)

- [ ] **Step 2: 수동 검증**

완료된 스캔의 결과 페이지에서 3개 뷰 전환, 필터 동작, 요약 수치가 findings와 일치하는지 확인.

- [ ] **Step 3: Commit**

```bash
git add app/scans/[id]/page.tsx
git commit -m "feat: implement scan results with tabs/table/severity views"
```

---

## Task 14: 보고서 화면 + PDF 출력 (report page + pdf route)

**Files:**
- Create: `app/scans/[id]/report/page.tsx`
- Create: `lib/report/pdf.ts`
- Create: `app/api/scans/[id]/pdf/route.ts`

**Interfaces:**
- Consumes: `fetchScan`/`getScan`, `getProject`; `prep`,`sortFindings`,`summarize`,`SEV_META`.
- Produces:
  - 보고서 페이지(`/scans/:id/report`) — 프로토타입 REPORT 섹션 마크업(헤더/메타/요약표/3개 섹션표). `?print=1`이면 크롬(네비/버튼) 숨김. "인쇄 · PDF 저장" 버튼 → `window.print()`.
  - `renderReportPdf(scanId: string, origin: string): Promise<Buffer>` — Puppeteer가 `${origin}/scans/${scanId}/report?print=1`로 이동해 `page.pdf({format:'A4'})`.
  - `GET /api/scans/:id/pdf` → PDF 다운로드 응답.

- [ ] **Step 1: 보고서 페이지 구현** (프로토타입 `<!-- ============ REPORT ============ -->` + `renderVals().rp` 로직 포팅)

서버 컴포넌트로 구현 가능(데이터는 `getScan`/`getProject` 직접 호출). `?print=1` searchParam이면 `[data-chrome]` 영역 미렌더. 요약표는 심각도×종류 교차 집계(프로토타입 rpSevRows), 이어서 취약점/라이선스/구성 섹션표(해당 종류 있을 때만).

- [ ] **Step 2: PDF 생성기 구현**

`lib/report/pdf.ts`:
```ts
import puppeteer from "puppeteer";

export async function renderReportPdf(scanId: string, origin: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/scans/${scanId}/report?print=1`, { waitUntil: "networkidle0", timeout: 60000 });
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" } }));
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 3: PDF 라우트 구현**

`app/api/scans/[id]/pdf/route.ts`:
```ts
import { getDb } from "@/lib/db";
import { getScan } from "@/lib/db/queries";
import { renderReportPdf } from "@/lib/report/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const scan = getScan(getDb(), params.id);
  if (!scan) return new Response(JSON.stringify({ error: "스캔을 찾을 수 없습니다" }), { status: 404, headers: { "content-type": "application/json" } });
  const origin = new URL(req.url).origin;
  const pdf = await renderReportPdf(params.id, origin);
  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="ossm-report-${params.id}.pdf"`,
    },
  });
}
```

- [ ] **Step 4: 수동 검증**

`npm run build && npm start`(Puppeteer는 prod에서 안정적). 완료 스캔의 결과 페이지 → "PDF 내보내기" → A4 PDF 다운로드, 보고서 미리보기에서 "인쇄 · PDF 저장"도 동작. 내용이 화면 보고서와 일치.

- [ ] **Step 5: Commit**

```bash
git add app/scans/[id]/report lib/report/pdf.ts app/api/scans/[id]/pdf
git commit -m "feat: add printable report page and Puppeteer PDF export"
```

---

## Task 15: 마감 — 설정 안내 · README · 전체 점검

**Files:**
- Create: `README.md`
- (필요 시) Modify: 미세 조정

**Interfaces:** 없음 (마감 작업).

- [ ] **Step 1: README 작성** — 사전 요구사항(Node 20+, Trivy 설치, git), 실행법(`npm install`/`npm run dev`), 환경변수(`GITHUB_TOKEN` 선택, `OSSM_DB_PATH` 선택), PoC 비범위(인증/권한/설정) 명시.

- [ ] **Step 2: 설정 네비 동작** — NavRail "설정" 클릭 시 스낵바 "설정·인증·권한은 PoC 비범위입니다"(프로토타입 `onNavSettings`와 동일). 홈/상세에 적용.

- [ ] **Step 3: 전체 회귀**

Run: `npm test && npm run build`
Expected: 단위 테스트 전체 PASS + 프로덕션 빌드 성공.

- [ ] **Step 4: 엔드투엔드 수동 시나리오** — (1) 로컬 경로 프로젝트 추가 → 스캔 → 결과 3뷰 → PDF. (2) Trivy 미설치 환경에서 실패 카드 확인. (3) (선택) `GITHUB_TOKEN` 설정 후 GitHub 프로젝트 추가 → clone·스캔·hygiene finding 확인.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README and finalize PoC"
```

---

## Self-Review

**Spec coverage:**
- 취약점 점검 → Task 3(normalize) + Task 5(trivy) + Task 8(runner) + Task 13(결과뷰). ✓
- 라이선스 → Task 2(분류) + Task 3(normalize 통합). ✓
- 구성(misconfig) → Task 3(normalize) + Task 7(GitHub 위생, 선택). ✓
- Repository 연동(GitHub+로컬) → Task 6(ingest). ✓
- 자가 점검/스캔 오케스트레이션 → Task 8(잡 러너) + Task 9(API). ✓
- 보고서(웹+PDF) → Task 14. ✓
- M3 디자인/4화면 → Task 0(토큰) + Task 10~14(UI). ✓
- SQLite 영속화 → Task 4. ✓
- Trivy 미설치 안내 → Task 5(health) + 실패 카드(Task 12). ✓

**Placeholder scan:** UI Task(11~14)는 `design/prototype.dc.html`의 확정 마크업을 1:1 포팅하도록 경로·블록·바인딩 매핑을 명시했다(확정 디자인 원본이 저장소에 존재). 로직/백엔드 Task는 전체 코드 수록. "TBD/적절히 처리" 류 없음.

**Type consistency:** `Finding`/`Project`/`Scan` 필드, `Scanner`/`IngestResult`/`RunnerDeps` 시그니처, query 함수명(`insertProject`/`getScan`/`replaceFindings` 등), API 응답 형태가 Task 간 일치. `prep().right`/`SEV_META`/`KIND_META` 단일 출처.

**참고:** spec 대비 추가된 것 — `scans.step`(라이브 진행 UI용, 프로토타입 요구), `scans.duration`/`trivy` 컬럼(표시용). 모두 PoC UI를 위한 합리적 보강.
