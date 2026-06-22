import Link from "next/link";
import { getDb } from "@/lib/db";
import { getScan, getProject } from "@/lib/db/queries";
import { prep, sortFindings, summarize, SEV_META } from "@/lib/meta";
import { Icon } from "@/components/Icon";
import { PrintButton } from "@/components/PrintButton";
import type { Severity } from "@/lib/types";

export const dynamic = "force-dynamic";

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low", "unknown"];

function nowLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Report({ params, searchParams }: { params: { id: string }; searchParams: { print?: string } }) {
  const db = getDb();
  const scan = getScan(db, params.id);
  const project = scan ? getProject(db, scan.projectId) : undefined;
  const printMode = searchParams.print === "1";

  if (!scan || scan.status !== "done" || !project) {
    return <div style={{ padding: 48, fontFamily: "var(--md-sys-typescale-plain-font)", color: "var(--md-sys-color-on-surface-variant)" }}>완료된 스캔 보고서를 찾을 수 없습니다.</div>;
  }

  const prepped = sortFindings(scan.findings).map(prep);
  const sm = summarize(scan.findings);
  const sevRows = SEV_ORDER.filter((k) => sm.sev[k] > 0).map((k) => {
    const inK = (t: string) => scan.findings.filter((f) => f.severity === k && f.kind === t).length;
    return { kr: SEV_META[k].kr, bg: SEV_META[k].bg, fg: SEV_META[k].fg, vuln: inK("vuln"), lic: inK("license"), mis: inK("misconfig"), total: sm.sev[k] };
  });
  const vuln = prepped.filter((f) => f.kind === "vuln");
  // "라이선스 위험" 섹션은 실제 위험(허용형=낮음 제외)만 나열한다. 허용형 전체 건수는 요약 표에 있다.
  const lic = prepped.filter((f) => f.kind === "license" && f.severity !== "low");
  const licLowCount = prepped.filter((f) => f.kind === "license" && f.severity === "low").length;
  const misc = prepped.filter((f) => f.kind === "misconfig");
  const sourceKr = project.type === "github" ? "GitHub 저장소" : "로컬 경로";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--md-sys-typescale-plain-font)", background: "var(--md-sys-color-surface)" }}>
      {!printMode && (
        <div data-chrome style={{ height: 72, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 20px 0 12px", gap: 8, borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <Link href={`/scans/${scan.id}`} style={{ width: 44, height: 44, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-on-surface-variant)", textDecoration: "none" }}><Icon name="arrow_back" /></Link>
          <span style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 21, fontWeight: 600, color: "var(--md-sys-color-on-surface)", flex: 1 }}>보고서 미리보기</span>
          <PrintButton />
        </div>
      )}

      <div data-scroll data-reportbg style={{ flex: 1, overflowY: "auto", padding: 32, background: "var(--md-sys-color-surface-dim)" }}>
        <div data-report style={{ maxWidth: 820, margin: "0 auto", background: "var(--md-sys-color-surface-container-lowest)", borderRadius: 8, boxShadow: "var(--md-sys-elevation-level2)", padding: "56px 60px", color: "#1b1b1f" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-start", borderBottom: "2px solid #1b1b1f", paddingBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#6750A4", textTransform: "uppercase" }}>오픈소스 관리 솔루션 · OSSM</div>
              <div style={{ fontFamily: "var(--md-sys-typescale-brand-font)", fontSize: 30, fontWeight: 700, marginTop: 6 }}>오픈소스 스캔 보고서</div>
              <div style={{ fontSize: 15, color: "#49454f", marginTop: 4 }}>{project.name}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#49454f", fontFamily: "var(--md-sys-typescale-mono-font)", lineHeight: 1.7 }}>
              <div>생성일 {nowLabel()}</div>
              <div>Trivy {scan.trivy ?? "-"}</div>
            </div>
          </div>

          {/* meta */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px", marginTop: 20, fontSize: 13 }}>
            <div><span style={{ color: "#79747e" }}>소스 유형</span><div style={{ fontWeight: 600, marginTop: 2 }}>{sourceKr}</div></div>
            <div><span style={{ color: "#79747e" }}>대상</span><div style={{ fontWeight: 600, marginTop: 2, fontFamily: "var(--md-sys-typescale-mono-font)", wordBreak: "break-all" }}>{project.value}</div></div>
            <div><span style={{ color: "#79747e" }}>스캔 일시</span><div style={{ fontWeight: 600, marginTop: 2, fontFamily: "var(--md-sys-typescale-mono-font)" }}>{scan.started}</div></div>
            <div><span style={{ color: "#79747e" }}>총 발견</span><div style={{ fontWeight: 600, marginTop: 2 }}>{sm.total}건</div></div>
          </div>

          {/* summary */}
          <div style={{ fontSize: 16, fontWeight: 700, margin: "32px 0 12px" }}>요약</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1.5px solid #1b1b1f" }}>
              <th style={{ textAlign: "left", padding: "8px", fontWeight: 700 }}>심각도</th>
              <th style={{ textAlign: "right", padding: "8px", fontWeight: 700 }}>취약점</th>
              <th style={{ textAlign: "right", padding: "8px", fontWeight: 700 }}>라이선스</th>
              <th style={{ textAlign: "right", padding: "8px", fontWeight: 700 }}>구성</th>
              <th style={{ textAlign: "right", padding: "8px", fontWeight: 700 }}>합계</th>
            </tr></thead>
            <tbody>
              {sevRows.map((r) => (
                <tr key={r.kr} style={{ borderBottom: "1px solid #cac4d0" }}>
                  <td style={{ padding: 8 }}><span style={{ display: "inline-block", padding: "2px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: r.bg, color: r.fg }}>{r.kr}</span></td>
                  <td style={mono}>{r.vuln}</td>
                  <td style={mono}>{r.lic}</td>
                  <td style={mono}>{r.mis}</td>
                  <td style={{ ...mono, fontWeight: 700 }}>{r.total}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "1.5px solid #1b1b1f" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>합계</td>
                <td style={{ ...mono, fontWeight: 700 }}>{sm.kind.vuln}</td>
                <td style={{ ...mono, fontWeight: 700 }}>{sm.kind.license}</td>
                <td style={{ ...mono, fontWeight: 700 }}>{sm.kind.misconfig}</td>
                <td style={{ ...mono, fontWeight: 700 }}>{sm.total}</td>
              </tr>
            </tbody>
          </table>

          {vuln.length > 0 && (
            <>
              <div style={sectionTitle}>1. 취약점 (CVE)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead><tr style={{ borderBottom: "1.5px solid #1b1b1f", color: "#49454f" }}>
                  <Th>심각도</Th><Th>패키지</Th><Th>CVE</Th><Th>설명</Th><Th right>수정 버전</Th>
                </tr></thead>
                <tbody>
                  {vuln.map((f, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #cac4d0" }}>
                      <td style={{ padding: "7px 8px" }}><Badge bg={f.sevBg} fg={f.sevFg}>{f.sevKr}</Badge></td>
                      <td style={cell}>{f.pkg}</td>
                      <td style={cell}>{f.identifier}</td>
                      <td style={{ padding: "7px 8px" }}>{f.title}</td>
                      <td style={{ ...cell, textAlign: "right" }}>{f.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {(lic.length > 0 || licLowCount > 0) && (
            <>
              <div style={sectionTitle}>2. 라이선스 위험</div>
              {lic.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead><tr style={{ borderBottom: "1.5px solid #1b1b1f", color: "#49454f" }}>
                    <Th>위험도</Th><Th>패키지</Th><Th>라이선스</Th><Th right>분류</Th>
                  </tr></thead>
                  <tbody>
                    {lic.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #cac4d0" }}>
                        <td style={{ padding: "7px 8px" }}><Badge bg={f.sevBg} fg={f.sevFg}>{f.sevKr}</Badge></td>
                        <td style={cell}>{f.pkg}</td>
                        <td style={cell}>{f.identifier}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right" }}>{f.right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ fontSize: 13, color: "#49454f" }}>검토가 필요한 라이선스 위험이 없습니다.</div>
              )}
              {licLowCount > 0 && (
                <div style={{ fontSize: 12, color: "#79747e", marginTop: 8 }}>
                  허용형(낮음) 라이선스 {licLowCount}건은 위험도가 낮아 표에서 생략했습니다. 전체 집계는 위 요약 표를 참고하세요.
                </div>
              )}
            </>
          )}

          {misc.length > 0 && (
            <>
              <div style={sectionTitle}>3. 구성 (Misconfiguration)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead><tr style={{ borderBottom: "1.5px solid #1b1b1f", color: "#49454f" }}>
                  <Th>심각도</Th><Th>대상</Th><Th>룰</Th><Th>제목</Th><Th right>해결</Th>
                </tr></thead>
                <tbody>
                  {misc.map((f, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #cac4d0" }}>
                      <td style={{ padding: "7px 8px" }}><Badge bg={f.sevBg} fg={f.sevFg}>{f.sevKr}</Badge></td>
                      <td style={cell}>{f.pkg}</td>
                      <td style={cell}>{f.identifier}</td>
                      <td style={{ padding: "7px 8px" }}>{f.title}</td>
                      <td style={{ ...cell, textAlign: "right" }}>{f.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div style={{ marginTop: 40, paddingTop: 14, borderTop: "1px solid #cac4d0", fontSize: 11, color: "#79747e" }}>
            본 보고서는 Trivy 스캔 결과를 OSSM이 정규화·분류하여 생성했습니다. 라이선스 위험도는 OSSM 룩업 테이블 기준이며 법적 판단을 대체하지 않습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

const mono = { textAlign: "right" as const, padding: 8, fontFamily: "var(--md-sys-typescale-mono-font)" };
const cell = { padding: "7px 8px", fontFamily: "var(--md-sys-typescale-mono-font)" } as const;
const sectionTitle = { fontSize: 16, fontWeight: 700, margin: "30px 0 12px" } as const;
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "7px 8px", fontWeight: 700 }}>{children}</th>;
}
function Badge({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return <span style={{ display: "inline-block", padding: "1px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{children}</span>;
}
