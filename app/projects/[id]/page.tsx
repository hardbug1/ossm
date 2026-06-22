"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavRail } from "@/components/NavRail";
import { Icon } from "@/components/Icon";
import { fetchProject, triggerScan, type ProjectWithScans } from "@/lib/api/client";
import { sevChips } from "@/lib/meta";
import type { Scan } from "@/lib/types";

const SCAN_STEPS = ["스캔 대기열 등록", "대상 확보 · 경로 검증", "Trivy 스캔 실행", "결과 정규화", "위험도 분류 · 집계"];

const STATUS_META: Record<string, { kr: string; bg: string; fg: string }> = {
  done: { kr: "완료", bg: "var(--md-sys-color-secondary-container)", fg: "var(--md-sys-color-on-secondary-container)" },
  running: { kr: "진행 중", bg: "var(--md-sys-color-tertiary-container)", fg: "var(--md-sys-color-on-tertiary-container)" },
  failed: { kr: "실패", bg: "var(--md-sys-color-error-container)", fg: "var(--md-sys-color-on-error-container)" },
  queued: { kr: "대기", bg: "var(--md-sys-color-surface-container-high)", fg: "var(--md-sys-color-on-surface-variant)" },
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectWithScans | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasRunning = useRef(false);

  const load = () => fetchProject(id).then(setProject).catch((e) => showSnack(e.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // running 스캔 폴링
  useEffect(() => {
    const running = (project?.scans ?? []).some((s) => s.status === "running" || s.status === "queued");
    if (running) {
      wasRunning.current = true;
      const t = setInterval(load, 1000);
      return () => clearInterval(t);
    }
    if (wasRunning.current) {
      wasRunning.current = false;
      const last = project?.scans[0];
      if (last?.status === "done") showSnack("스캔이 완료되었습니다");
      else if (last?.status === "failed") showSnack("스캔이 실패했습니다");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  function showSnack(m: string) {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack(m);
    snackTimer.current = setTimeout(() => setSnack(null), 3200);
  }

  async function runScan() {
    try {
      await triggerScan(id);
      await load();
    } catch (e) {
      showSnack((e as Error).message);
    }
  }

  if (!project) {
    return (
      <div style={{ height: "100vh", display: "flex", overflow: "hidden", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)" }}>
        <NavRail active="projects" onHome={() => router.push("/")} onSettings={() => showSnack("설정·인증·권한은 PoC 비범위입니다")} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" }}>불러오는 중…</div>
      </div>
    );
  }

  const running = project.scans.some((s) => s.status === "running" || s.status === "queued");
  const typeKr = project.type === "github" ? "GitHub 저장소" : "로컬 경로";

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }}>
      <NavRail active="projects" onHome={() => router.push("/")} onSettings={() => showSnack("설정·인증·권한은 PoC 비범위입니다")} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div data-chrome style={{ height: 72, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 20px 0 12px", gap: 8, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <button onClick={() => router.push("/")} style={{ width: 44, height: 44, borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" }}><Icon name="arrow_back" /></button>
          <span style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 22, fontWeight: 600, color: "var(--md-sys-color-on-surface)", flex: 1 }}>{project.name}</span>
          <button onClick={runScan} disabled={running} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 22px", borderRadius: 9999, border: "none", cursor: running ? "default" : "pointer", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600, opacity: running ? 0.5 : 1 }}>
            <Icon name="play_arrow" size={18} />스캔 실행
          </button>
        </div>

        <div data-scroll style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, background: "var(--md-sys-color-surface-container-low)", borderRadius: 16, boxShadow: "var(--md-sys-elevation-level1)", padding: "18px 22px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase" }}>소스</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--md-sys-color-on-surface)", marginTop: 6 }}>{typeKr}</div>
                <div style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)", marginTop: 4, fontFamily: "var(--md-sys-typescale-mono-font)", wordBreak: "break-all" }}>{project.value}</div>
              </div>
              <div style={{ width: 200, background: "var(--md-sys-color-surface-container-low)", borderRadius: 16, boxShadow: "var(--md-sys-elevation-level1)", padding: "18px 22px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase" }}>등록일</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--md-sys-color-on-surface)", marginTop: 6, fontFamily: "var(--md-sys-typescale-mono-font)" }}>{project.created}</div>
              </div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--md-sys-color-on-surface)", marginBottom: 12 }}>스캔 이력</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {project.scans.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--md-sys-color-on-surface-variant)", background: "var(--md-sys-color-surface-container-low)", borderRadius: 16 }}>
                  <Icon name="policy" size={48} style={{ opacity: 0.5 }} />
                  <div style={{ marginTop: 8, fontSize: 14 }}>아직 스캔이 없습니다. &quot;스캔 실행&quot;으로 시작하세요</div>
                </div>
              )}
              {project.scans.map((s) => (
                <ScanCard key={s.id} s={s} onOpen={() => router.push(`/scans/${s.id}`)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {snack && (
        <div style={{ position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 1000, background: "var(--md-sys-color-inverse-surface)", color: "var(--md-sys-color-inverse-on-surface)", borderRadius: 8, padding: "14px 20px", boxShadow: "var(--md-sys-elevation-level3)", fontSize: 14, display: "flex", alignItems: "center", gap: 16, minWidth: 280 }}>
          <span style={{ flex: 1 }}>{snack}</span>
        </div>
      )}
    </div>
  );
}

function ScanCard({ s, onOpen }: { s: Scan; onOpen: () => void }) {
  const sm = STATUS_META[s.status] ?? STATUS_META.queued;
  const chips = s.status === "done" ? sevChips(s.findings) : [];
  const step = s.step ?? 0;
  return (
    <div style={{ background: "var(--md-sys-color-surface-container-low)", borderRadius: 16, boxShadow: "var(--md-sys-elevation-level1)", padding: "18px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, background: sm.bg, color: sm.fg }}>{sm.kr}</span>
        <span style={{ fontSize: 13, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "var(--md-sys-typescale-mono-font)" }}>{s.started}</span>
        {s.duration && <span style={{ fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>{s.duration}</span>}
        <div style={{ flex: 1 }} />
        {s.status === "done" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {chips.map((c) => (
                <span key={c.key} style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.fg }}>{c.kr} {c.count}</span>
              ))}
              {chips.length === 0 && <span style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)" }}>발견 없음</span>}
            </div>
            <button onClick={onOpen} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px", borderRadius: 9999, border: "1px solid var(--md-sys-color-outline)", background: "transparent", color: "var(--md-sys-color-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>결과 보기<Icon name="chevron_right" size={18} /></button>
          </div>
        )}
      </div>

      {(s.status === "running" || s.status === "queued") && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--md-sys-color-outline-variant)", display: "flex", flexDirection: "column", gap: 10 }}>
          {SCAN_STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {done && <Icon name="check_circle" filled size={20} color="var(--md-sys-color-primary)" />}
                {active && <span style={{ width: 18, height: 18, margin: 1, borderRadius: 9999, border: "2px solid var(--md-sys-color-outline-variant)", borderTopColor: "var(--md-sys-color-primary)", animation: "ossm-spin 0.9s linear infinite", display: "inline-block" }} />}
                {!done && !active && <Icon name="radio_button_unchecked" size={20} color="var(--md-sys-color-outline-variant)" />}
                <span style={{ fontSize: 13.5, color: i <= step ? "var(--md-sys-color-on-surface)" : "var(--md-sys-color-on-surface-variant)", fontWeight: active ? 600 : 400 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {s.status === "failed" && (
        <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-on-error-container)", fontSize: 13, fontFamily: "var(--md-sys-typescale-mono-font)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="report" size={18} style={{ flexShrink: 0 }} /><span>{s.error}</span>
        </div>
      )}
    </div>
  );
}
