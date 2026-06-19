"use client";
import { Icon } from "@/components/Icon";

export function NavRail({
  active,
  onHome,
  onSettings,
}: {
  active: "projects" | "settings";
  onHome: () => void;
  onSettings: () => void;
}) {
  const projActive = active === "projects";
  return (
    <div
      data-chrome
      style={{
        width: 88,
        flexShrink: 0,
        background: "var(--md-sys-color-surface)",
        borderRight: "1px solid var(--md-sys-color-outline-variant)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={onHome}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "var(--md-sys-color-primary-container)",
            color: "var(--md-sys-color-on-primary-container)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="shield" filled size={26} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface)" }}>OSSM</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginTop: 28 }}>
        <button onClick={onHome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", width: 68, padding: "6px 0" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 32,
              borderRadius: 9999,
              background: projActive ? "var(--md-sys-color-secondary-container)" : "transparent",
              color: projActive ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)",
            }}
          >
            <Icon name="folder" filled={projActive} size={24} />
          </span>
          <span style={{ fontSize: 12, fontWeight: projActive ? 600 : 500, color: projActive ? "var(--md-sys-color-on-surface)" : "var(--md-sys-color-on-surface-variant)" }}>프로젝트</span>
        </button>
        <button onClick={onSettings} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", width: 68, padding: "6px 0" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 32, borderRadius: 9999, color: "var(--md-sys-color-on-surface-variant)" }}>
            <Icon name="settings" size={24} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--md-sys-color-on-surface-variant)" }}>설정</span>
        </button>
      </div>
    </div>
  );
}
