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
        description: v.Description || undefined,
        url: v.PrimaryURL || undefined,
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
        description: m.Description || undefined,
      });
    }
  }
  return out;
}
