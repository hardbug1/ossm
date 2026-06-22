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

const KIND_ORDER: Kind[] = ["vuln", "license", "misconfig"];

// 종류(취약점/라이선스/구성)별로 묶고, 각 종류 안에서 심각도 칩을 만든다.
// 발견이 없는 종류는 제외한다.
export function kindSevGroups(findings: Finding[]) {
  const groups: { kind: Kind; kindKr: string; kindIcon: string; chips: ReturnType<typeof sevChips> }[] = [];
  for (const kind of KIND_ORDER) {
    const inKind = findings.filter((f) => f.kind === kind);
    if (inKind.length === 0) continue;
    groups.push({ kind, kindKr: KIND_META[kind].kr, kindIcon: KIND_META[kind].icon, chips: sevChips(inKind) });
  }
  return groups;
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
