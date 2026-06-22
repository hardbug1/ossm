"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavRail } from "@/components/NavRail";
import { Icon } from "@/components/Icon";
import { FindingRow } from "@/components/FindingRow";
import { FindingDetail } from "@/components/FindingDetail";
import { fetchScan, fetchProject } from "@/lib/api/client";
import { prep, sortFindings, summarize, SEV_META, type PreppedFinding } from "@/lib/meta";
import type { Kind, Scan, Severity } from "@/lib/types";

type Variant = "tabs" | "table" | "severity";
const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low", "unknown"];

export default function ScanResults({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [projName, setProjName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [variant, setVariant] = useState<Variant>("tabs");
  const [tab, setTab] = useState<Kind>("vuln");
  const [filterKind, setFilterKind] = useState<Kind | "all">("all");
  const [filterSev, setFilterSev] = useState<Severity | "all">("all");
  const [open, setOpen] = useState<Record<Severity, boolean>>({ critical: true, high: true, medium: true, low: true, unknown: true });
  const [selected, setSelected] = useState<PreppedFinding | null>(null);

  useEffect(() => {
    fetchScan(params.id)
      .then(async (s) => {
        setScan(s);
        setProjectId(s.projectId);
        try {
          const p = await fetchProject(s.projectId);
          setProjName(p.name);
        } catch { /* ignore */ }
      })
      .catch((e) => setErr(e.message));
  }, [params.id]);

  const prepped = useMemo(() => (scan ? sortFindings(scan.findings).map(prep) : []), [scan]);
  const sm = useMemo(() => (scan ? summarize(scan.findings) : null), [scan]);

  const goHome = () => router.push("/");
  const back = () => router.push(projectId ? `/projects/${projectId}` : "/");

  if (err) {
    return (
      <Shell goHome={goHome}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" }}>{err}</div>
      </Shell>
    );
  }
  if (!scan || !sm) {
    return (
      <Shell goHome={goHome}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" }}>불러오는 중…</div>
      </Shell>
    );
  }
  if (scan.status !== "done") {
    return (
      <Shell goHome={goHome}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--md-sys-color-on-surface-variant)" }}>
          <Icon name={scan.status === "failed" ? "error" : "hourglass_empty"} size={48} style={{ opacity: 0.6 }} />
          <div>{scan.status === "failed" ? `스캔 실패: ${scan.error ?? ""}` : "스캔이 아직 완료되지 않았습니다"}</div>
          <button onClick={back} style={btnOutline}>프로젝트로 돌아가기</button>
        </div>
      </Shell>
    );
  }

  const variantOptions: { id: Variant; label: string }[] = [
    { id: "tabs", label: "탭" },
    { id: "table", label: "통합 테이블" },
    { id: "severity", label: "심각도별" },
  ];
  const tabOptions: { id: Kind; label: string }[] = [
    { id: "vuln", label: `취약점 ${sm.kind.vuln}` },
    { id: "license", label: `라이선스 ${sm.kind.license}` },
    { id: "misconfig", label: `구성 ${sm.kind.misconfig}` },
  ];
  const kindFilters: { id: Kind | "all"; label: string }[] = [
    { id: "all", label: "전체" }, { id: "vuln", label: "취약점" }, { id: "license", label: "라이선스" }, { id: "misconfig", label: "구성" },
  ];
  const sevFilters: { id: Severity | "all"; label: string }[] = [
    { id: "all", label: "전체" }, { id: "critical", label: "심각" }, { id: "high", label: "높음" }, { id: "medium", label: "보통" }, { id: "low", label: "낮음" }, { id: "unknown", label: "미상" },
  ];
  const tabFindings = prepped.filter((f) => f.kind === tab);
  const filtered = prepped.filter((f) => (filterKind === "all" || f.kind === filterKind) && (filterSev === "all" || f.severity === filterSev));
  const groups = SEV_ORDER.map((k) => ({ sev: k, ...SEV_META[k], count: sm.sev[k], findings: prepped.filter((f) => f.severity === k) })).filter((g) => g.count > 0);

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }}>
      <NavRail active="projects" onHome={goHome} onSettings={goHome} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div data-chrome style={{ minHeight: 72, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 20px 0 12px", gap: 8, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <button onClick={back} style={iconBtn}><Icon name="arrow_back" /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 21, fontWeight: 600, color: "var(--md-sys-color-on-surface)" }}>스캔 결과</div>
            <div style={{ fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "var(--md-sys-typescale-mono-font)" }}>{projName} · {scan.started}</div>
          </div>
          <button onClick={() => window.open(`/api/scans/${scan.id}/pdf`, "_blank")} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 20px", borderRadius: 9999, border: "none", cursor: "pointer", background: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-on-secondary-container)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: 600 }}>
            <Icon name="picture_as_pdf" size={18} />PDF 내보내기
          </button>
        </div>

        <div data-scroll style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {/* summary cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
              <div style={{ flex: 1.4, ...card }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>취약점</span>
                  <span style={bigNum}>{sm.kind.vuln}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <SumPill label={`심각 ${sm.sev.critical}`} bg="var(--md-sys-color-error)" fg="var(--md-sys-color-on-error)" />
                  <SumPill label={`높음 ${sm.sev.high}`} bg="var(--md-sys-color-error-container)" fg="var(--md-sys-color-on-error-container)" />
                  <SumPill label={`보통 ${sm.sev.medium}`} bg="var(--md-sys-color-tertiary-container)" fg="var(--md-sys-color-on-tertiary-container)" />
                  <SumPill label={`낮음 ${sm.sev.low}`} bg="var(--md-sys-color-secondary-container)" fg="var(--md-sys-color-on-secondary-container)" />
                </div>
              </div>
              <div style={{ flex: 1, ...card }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>라이선스 위험</span>
                  <span style={bigNum}>{sm.kind.license}</span>
                </div>
                <div style={{ marginTop: 18, fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>고위험 <b style={{ color: "var(--md-sys-color-on-surface)" }}>{sm.licHigh}</b>건</div>
              </div>
              <div style={{ flex: 1, ...card }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--md-sys-color-on-surface-variant)" }}>구성 이슈</span>
                  <span style={bigNum}>{sm.kind.misconfig}</span>
                </div>
                <div style={{ marginTop: 18, fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>고위험 <b style={{ color: "var(--md-sys-color-on-surface)" }}>{sm.miscHigh}</b>건</div>
              </div>
            </div>

            {/* view switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>뷰</span>
              <div style={{ display: "inline-flex", padding: 3, gap: 2, borderRadius: 9999, background: "var(--md-sys-color-surface-container-high)" }}>
                {variantOptions.map((v) => {
                  const sel = variant === v.id;
                  return (
                    <button key={v.id} onClick={() => setVariant(v.id)} style={{ height: 32, padding: "0 16px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 13, fontWeight: 600, background: sel ? "var(--md-sys-color-secondary-container)" : "transparent", color: sel ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)" }}>{v.label}</button>
                  );
                })}
              </div>
            </div>

            {/* VARIANT: tabs */}
            {variant === "tabs" && (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 4, padding: "0 12px", borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
                  {tabOptions.map((t) => {
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)} style={{ height: 48, padding: "0 18px", background: "transparent", border: "none", borderBottom: `3px solid ${active ? "var(--md-sys-color-primary)" : "transparent"}`, cursor: "pointer", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)" }}>{t.label}</button>
                    );
                  })}
                </div>
                {tabFindings.length === 0 && <Empty />}
                {tabFindings.map((f, i) => <FindingRow key={i} f={f} showSeverity onClick={() => setSelected(f)} />)}
              </div>
            )}

            {/* VARIANT: unified table */}
            {variant === "table" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
                  {kindFilters.map((k) => <FilterChip key={k.id} label={k.label} sel={filterKind === k.id} onClick={() => setFilterKind(k.id)} />)}
                  <span style={{ width: 1, height: 24, background: "var(--md-sys-color-outline-variant)", margin: "0 4px" }} />
                  {sevFilters.map((s) => <FilterChip key={s.id} label={s.label} sel={filterSev === s.id} onClick={() => setFilterSev(s.id)} />)}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)", marginBottom: 8 }}>{filtered.length}건 표시 중</div>
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "11px 20px", borderBottom: "1px solid var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container)" }}>
                    <span style={hdr(52)}>심각도</span>
                    <span style={hdr(84)}>종류</span>
                    <span style={{ flex: 1, ...hdrBase }}>제목 · 대상</span>
                    <span style={{ ...hdr(150), textAlign: "right" }}>조치</span>
                  </div>
                  {filtered.length === 0 && <Empty />}
                  {filtered.map((f, i) => <FindingRow key={i} f={f} showSeverity onClick={() => setSelected(f)} />)}
                </div>
              </div>
            )}

            {/* VARIANT: by severity */}
            {variant === "severity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {groups.map((g) => (
                  <div key={g.sev} style={{ ...card, padding: 0, overflow: "hidden" }}>
                    <div onClick={() => setOpen((o) => ({ ...o, [g.sev]: !o[g.sev] }))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 700, background: g.bg, color: g.fg }}>{g.kr}</span>
                      <span style={{ fontSize: 14, color: "var(--md-sys-color-on-surface-variant)" }}>{g.count}건</span>
                      <div style={{ flex: 1 }} />
                      <Icon name="expand_more" size={24} color="var(--md-sys-color-on-surface-variant)" style={{ transform: open[g.sev] ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                    {open[g.sev] && (
                      <div style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
                        {g.findings.map((f, i) => <FindingRow key={i} f={f} onClick={() => setSelected(f)} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FindingDetail f={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

const card = { background: "var(--md-sys-color-surface-container-low)", borderRadius: 16, boxShadow: "var(--md-sys-elevation-level1)", padding: "18px 22px" } as const;
const bigNum = { fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 34, fontWeight: 700, color: "var(--md-sys-color-on-surface)", lineHeight: 1 } as const;
const iconBtn = { width: 44, height: 44, borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)" } as const;
const btnOutline = { display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: 9999, border: "1px solid var(--md-sys-color-outline)", background: "transparent", color: "var(--md-sys-color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const;
const hdrBase = { fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase" as const };
function hdr(w: number) { return { width: w, flexShrink: 0, ...hdrBase }; }

function SumPill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return <span style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, background: bg, color: fg }}>{label}</span>;
}
function FilterChip({ label, sel, onClick }: { label: string; sel: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ height: 32, padding: "0 14px", borderRadius: 8, cursor: "pointer", border: "none", boxShadow: sel ? "none" : "inset 0 0 0 1px var(--md-sys-color-outline-variant)", background: sel ? "var(--md-sys-color-secondary-container)" : "var(--md-sys-color-surface)", color: sel ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)", fontFamily: "var(--md-sys-typescale-plain-font)", fontSize: 13, fontWeight: 600 }}>{label}</button>;
}
function Empty() {
  return <div style={{ padding: 36, textAlign: "center", fontSize: 13, color: "var(--md-sys-color-on-surface-variant)" }}>해당 항목이 없습니다</div>;
}
function Shell({ children, goHome }: { children: React.ReactNode; goHome: () => void }) {
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)" }}>
      <NavRail active="projects" onHome={goHome} onSettings={goHome} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
