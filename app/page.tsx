"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavRail } from "@/components/NavRail";
import { Icon } from "@/components/Icon";
import { fetchProjects, createProject, type ProjectWithScans } from "@/lib/api/client";
import { KindSevChips } from "@/components/KindSevChips";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithScans[]>([]);
  const [trivy, setTrivy] = useState<string | null | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"github" | "local">("github");
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [snack, setSnack] = useState<string | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = () => fetchProjects().then(setProjects).catch((e) => showSnack(e.message));

  useEffect(() => {
    load();
    fetch("/api/health").then((r) => r.json()).then((d) => setTrivy(d.trivy)).catch(() => setTrivy(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 진행 중 스캔이 있으면 가볍게 폴링
  useEffect(() => {
    const anyRunning = projects.some((p) => p.scans[0]?.status === "running");
    if (!anyRunning) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  function showSnack(m: string) {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack(m);
    snackTimer.current = setTimeout(() => setSnack(null), 3200);
  }

  async function add() {
    if (!newName.trim() || !newValue.trim()) return showSnack("이름과 경로를 입력하세요");
    try {
      await createProject({ name: newName.trim(), type: newType, value: newValue.trim() });
      setDialogOpen(false);
      setNewName("");
      setNewValue("");
      await load();
      showSnack("프로젝트가 추가되었습니다");
    } catch (e) {
      showSnack((e as Error).message);
    }
  }

  const tG = newType === "github";

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }}>
      <NavRail active="projects" onHome={() => router.push("/")} onSettings={() => showSnack("설정·인증·권한은 PoC 비범위입니다")} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div data-chrome style={{ height: 72, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 28px", gap: 16, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <span style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 22, fontWeight: 600, color: "var(--md-sys-color-on-surface)", flex: 1 }}>프로젝트</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", borderRadius: 9999, background: "var(--md-sys-color-surface-container-high)", fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: trivy ? "var(--md-sys-color-primary)" : "var(--md-sys-color-error)" }} />
            <span style={{ fontFamily: "var(--md-sys-typescale-mono-font)" }}>{trivy ? `Trivy ${trivy}` : "Trivy"}</span>
            <span>· {trivy === undefined ? "확인 중" : trivy ? "연결됨" : "미설치"}</span>
          </div>
        </div>

        {/* body */}
        <div data-scroll style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "var(--md-sys-color-on-surface-variant)" }}>스캔할 오픈소스 프로젝트를 관리합니다</div>
              </div>
              <button onClick={() => { setDialogOpen(true); setNewType("github"); setNewName(""); setNewValue(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 22px", borderRadius: 9999, border: "none", cursor: "pointer", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600 }}>
                <Icon name="add" size={18} />프로젝트 추가
              </button>
            </div>

            <div style={{ background: "var(--md-sys-color-surface-container-low)", borderRadius: 16, boxShadow: "var(--md-sys-elevation-level1)", overflow: "hidden" }}>
              {projects.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--md-sys-color-on-surface-variant)" }}>
                  <Icon name="folder_open" size={48} style={{ opacity: 0.5 }} />
                  <div style={{ marginTop: 8, fontSize: 14 }}>등록된 프로젝트가 없습니다. &quot;프로젝트 추가&quot;로 시작하세요</div>
                </div>
              )}
              {projects.map((p) => {
                const latest = p.scans[0];
                const typeKr = p.type === "github" ? "GitHub" : "로컬";
                const typeIcon = p.type === "github" ? "public" : "folder";
                const done = latest?.status === "done";
                const failed = latest?.status === "failed";
                const running = latest?.status === "running";
                const none = !latest;
                const metaLabel = none ? "" : running ? "스캔 진행 중…" : latest!.started;
                return (
                  <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderBottom: "1px solid var(--md-sys-color-outline-variant)", cursor: "pointer" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9999, flexShrink: 0, background: "var(--md-sys-color-surface-container-highest)", color: "var(--md-sys-color-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={typeIcon} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--md-sys-color-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{p.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 9999, background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)", flexShrink: 0 }}>{typeKr}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)", marginTop: 3, fontFamily: "var(--md-sys-typescale-mono-font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.value}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      {done && <KindSevChips findings={latest.findings} />}
                      {failed && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, fontSize: 12.5, fontWeight: 600, background: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-on-error-container)" }}><Icon name="error" size={16} />실패</span>
                      )}
                      {running && <span style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)" }}>진행 중…</span>}
                      {none && <span style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)" }}>스캔 없음</span>}
                      <span style={{ fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", width: 150, textAlign: "right" }}>{metaLabel}</span>
                      <Icon name="chevron_right" size={22} color="var(--md-sys-color-on-surface-variant)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ADD PROJECT DIALOG */}
      {dialogOpen && (
        <div onClick={() => setDialogOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--md-sys-color-surface-container-high)", borderRadius: 28, padding: "24px 26px", boxShadow: "var(--md-sys-elevation-level3)" }}>
            <div style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 22, fontWeight: 600, color: "var(--md-sys-color-on-surface)" }}>프로젝트 추가</div>
            <div style={{ fontSize: 13, color: "var(--md-sys-color-on-surface-variant)", marginTop: 6 }}>GitHub 저장소 또는 로컬 경로를 등록합니다</div>
            <div style={{ display: "inline-flex", marginTop: 18, padding: 3, gap: 2, borderRadius: 9999, background: "var(--md-sys-color-surface-container-highest)" }}>
              <button onClick={() => setNewType("github")} style={{ height: 34, padding: "0 18px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 13, fontWeight: 600, background: tG ? "var(--md-sys-color-primary)" : "transparent", color: tG ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface-variant)" }}>GitHub</button>
              <button onClick={() => setNewType("local")} style={{ height: 34, padding: "0 18px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 13, fontWeight: 600, background: !tG ? "var(--md-sys-color-primary)" : "transparent", color: !tG ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface-variant)" }}>로컬 경로</button>
            </div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>이름</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: acme-corp/web-frontend" style={{ height: 48, borderRadius: 8, border: "1px solid var(--md-sys-color-outline)", background: "transparent", padding: "0 14px", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 15, color: "var(--md-sys-color-on-surface)", outline: "none" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>{tG ? "저장소 URL" : "로컬 경로"}</span>
                <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={tG ? "https://github.com/org/repo" : "/path/to/project"} style={{ height: 48, borderRadius: 8, border: "1px solid var(--md-sys-color-outline)", background: "transparent", padding: "0 14px", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 15, color: "var(--md-sys-color-on-surface)", outline: "none" }} />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button onClick={() => setDialogOpen(false)} style={{ height: 40, padding: "0 20px", borderRadius: 9999, border: "none", background: "transparent", color: "var(--md-sys-color-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>취소</button>
              <button onClick={add} style={{ height: 40, padding: "0 22px", borderRadius: 9999, border: "none", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* SNACKBAR */}
      {snack && (
        <div style={{ position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 1000, background: "var(--md-sys-color-inverse-surface)", color: "var(--md-sys-color-inverse-on-surface)", borderRadius: 8, padding: "14px 20px", boxShadow: "var(--md-sys-elevation-level3)", fontSize: 14, display: "flex", alignItems: "center", gap: 16, minWidth: 280 }}>
          <span style={{ flex: 1 }}>{snack}</span>
        </div>
      )}
    </div>
  );
}
