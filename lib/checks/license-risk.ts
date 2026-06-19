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
