import type Database from "better-sqlite3";
import type { Finding, Project, Scan, ScanStatus } from "@/lib/types";

type DB = InstanceType<typeof Database>;

export function insertProject(db: DB, p: { id: string; name: string; type: "github" | "local"; value: string; created: string }): Project {
  db.prepare(`INSERT INTO projects (id,name,source_type,source_value,created_at) VALUES (?,?,?,?,?)`)
    .run(p.id, p.name, p.type, p.value, p.created);
  return { id: p.id, name: p.name, type: p.type, value: p.value, created: p.created };
}

function rowToProject(r: any): Project {
  return { id: r.id, name: r.name, type: r.source_type, value: r.source_value, created: r.created_at };
}

export function listProjects(db: DB): Project[] {
  return db.prepare(`SELECT * FROM projects ORDER BY created_at DESC, rowid DESC`).all().map(rowToProject);
}

export function getProject(db: DB, id: string): Project | undefined {
  const r = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
  return r ? rowToProject(r) : undefined;
}

export function insertScan(db: DB, s: { id: string; projectId: string; status: ScanStatus; started: string }): void {
  db.prepare(`INSERT INTO scans (id,project_id,status,started_at,step) VALUES (?,?,?,?,0)`)
    .run(s.id, s.projectId, s.status, s.started);
}

export function updateScan(db: DB, id: string, patch: Partial<Pick<Scan, "status" | "finished" | "duration" | "trivy" | "error" | "step">>): void {
  const map: Record<string, string> = { finished: "finished_at" };
  const cols = Object.keys(patch);
  if (cols.length === 0) return;
  const setSql = cols.map((c) => `${map[c] ?? c} = ?`).join(", ");
  const vals = cols.map((c) => (patch as any)[c]);
  db.prepare(`UPDATE scans SET ${setSql} WHERE id = ?`).run(...vals, id);
}

export function replaceFindings(db: DB, scanId: string, findings: Finding[]): void {
  const tx = db.transaction((fs: Finding[]) => {
    db.prepare(`DELETE FROM findings WHERE scan_id = ?`).run(scanId);
    const stmt = db.prepare(`INSERT INTO findings (scan_id,kind,severity,pkg,identifier,title,detail_json) VALUES (?,?,?,?,?,?,?)`);
    for (const f of fs) {
      const detail = JSON.stringify({ installed: f.installed, fixed: f.fixed, note: f.note, hygiene: f.hygiene });
      stmt.run(scanId, f.kind, f.severity, f.pkg, f.identifier, f.title, detail);
    }
  });
  tx(findings);
}

function rowToFinding(r: any): Finding {
  const d = r.detail_json ? JSON.parse(r.detail_json) : {};
  return {
    kind: r.kind, severity: r.severity, pkg: r.pkg, identifier: r.identifier, title: r.title,
    installed: d.installed ?? undefined, fixed: d.fixed ?? undefined, note: d.note ?? undefined, hygiene: d.hygiene ?? undefined,
  };
}

function findingsFor(db: DB, scanId: string): Finding[] {
  return db.prepare(`SELECT * FROM findings WHERE scan_id = ? ORDER BY id`).all(scanId).map(rowToFinding);
}

function rowToScan(db: DB, r: any): Scan {
  return {
    id: r.id, projectId: r.project_id, status: r.status, started: r.started_at,
    finished: r.finished_at ?? undefined, duration: r.duration ?? undefined, trivy: r.trivy ?? undefined,
    error: r.error ?? undefined, step: r.step ?? 0, findings: findingsFor(db, r.id),
  };
}

export function getScan(db: DB, id: string): Scan | undefined {
  const r = db.prepare(`SELECT * FROM scans WHERE id = ?`).get(id);
  return r ? rowToScan(db, r) : undefined;
}

export function listScans(db: DB, projectId: string): Scan[] {
  return db.prepare(`SELECT * FROM scans WHERE project_id = ? ORDER BY started_at DESC, rowid DESC`).all(projectId).map((r) => rowToScan(db, r));
}
