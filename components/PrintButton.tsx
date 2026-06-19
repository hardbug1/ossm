"use client";
import { Icon } from "@/components/Icon";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 22px", borderRadius: 9999, border: "none", cursor: "pointer", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600 }}>
      <Icon name="print" size={18} />인쇄 · PDF 저장
    </button>
  );
}
