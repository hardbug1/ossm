import { Icon } from "@/components/Icon";
import type { PreppedFinding } from "@/lib/meta";

export function FindingRow({ f, showSeverity }: { f: PreppedFinding; showSeverity?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 20px", borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
      {showSeverity && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3px 0",
            width: 52,
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            background: f.sevBg,
            color: f.sevFg,
            flexShrink: 0,
          }}
        >
          {f.sevKr}
        </span>
      )}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, width: 84, flexShrink: 0, color: "var(--md-sys-color-on-surface-variant)" }}>
        <Icon name={f.kindIcon} size={18} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{f.kindKr}</span>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--md-sys-color-on-surface)", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.title}</div>
        <div style={{ fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", marginTop: 3, fontFamily: "var(--md-sys-typescale-mono-font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {f.pkg} · {f.identifier}
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 150, textAlign: "right", fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "var(--md-sys-typescale-mono-font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {f.right}
      </div>
    </div>
  );
}
