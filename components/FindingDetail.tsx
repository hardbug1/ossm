"use client";
import { Icon } from "@/components/Icon";
import type { PreppedFinding } from "@/lib/meta";

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--md-sys-color-on-surface)", marginTop: 3, fontFamily: mono ? "var(--md-sys-typescale-mono-font)" : "inherit", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

export function FindingDetail({ f, onClose }: { f: PreppedFinding | null; onClose: () => void }) {
  if (!f) return null;
  const isVuln = f.kind === "vuln";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 950, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 580, maxHeight: "85vh", overflowY: "auto", background: "var(--md-sys-color-surface-container-high)", borderRadius: 28, padding: "24px 26px", boxShadow: "var(--md-sys-elevation-level3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "3px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: f.sevBg, color: f.sevFg }}>{f.sevKr}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--md-sys-color-on-surface-variant)", fontSize: 13, fontWeight: 500 }}>
            <Icon name={f.kindIcon} size={18} />{f.kindKr}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} aria-label="닫기" style={{ width: 36, height: 36, borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" }}><Icon name="close" size={20} /></button>
        </div>

        <div style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 19, fontWeight: 600, color: "var(--md-sys-color-on-surface)", marginTop: 14, lineHeight: "26px" }}>{f.title}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginTop: 20 }}>
          <Field label="패키지 / 대상" mono>{f.pkg}</Field>
          <Field label={isVuln ? "CVE / 식별자" : f.kind === "license" ? "라이선스" : "룰"} mono>{f.identifier}</Field>
          {isVuln && <Field label="설치 버전" mono>{f.installed ?? "-"}</Field>}
          {isVuln && <Field label="수정 버전" mono>{f.fixed ?? "수정버전 없음"}</Field>}
          {!isVuln && f.note && <Field label={f.kind === "license" ? "분류" : "권장 조치"}>{f.note}</Field>}
        </div>

        {f.description && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase" }}>설명</div>
            <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--md-sys-color-on-surface)", marginTop: 6, whiteSpace: "pre-wrap" }}>{f.description}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
          {f.url && (
            <a href={f.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 9999, border: "1px solid var(--md-sys-color-outline)", background: "transparent", color: "var(--md-sys-color-primary)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              <Icon name="open_in_new" size={18} />권고/CVE 열기
            </a>
          )}
          <button onClick={onClose} style={{ height: 40, padding: "0 22px", borderRadius: 9999, border: "none", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>닫기</button>
        </div>
      </div>
    </div>
  );
}
