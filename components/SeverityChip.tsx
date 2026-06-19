import { SEV_META } from "@/lib/meta";
import type { Severity } from "@/lib/types";

export function SeverityChip({ severity, count, width }: { severity: Severity; count?: number; width?: number }) {
  const m = SEV_META[severity];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "3px 10px",
        width,
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        background: m.bg,
        color: m.fg,
      }}
    >
      {m.kr}
      {count != null ? ` ${count}` : ""}
    </span>
  );
}
