import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { failStaleScans } from "@/lib/db/queries";

export function migrate(db: InstanceType<typeof Database>): void {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_value TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      duration TEXT,
      trivy TEXT,
      error TEXT,
      step INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL REFERENCES scans(id),
      kind TEXT NOT NULL,
      severity TEXT NOT NULL,
      pkg TEXT NOT NULL,
      identifier TEXT NOT NULL,
      title TEXT NOT NULL,
      detail_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id);
    CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
  `);
}

let _db: InstanceType<typeof Database> | null = null;
export function getDb(): InstanceType<typeof Database> {
  if (_db) return _db;
  const path = process.env.OSSM_DB_PATH ?? "data/ossm.db";
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  _db = new Database(path);
  migrate(_db);
  // 서버 시작 시 이전 프로세스에서 중단된(고아) 스캔을 정리
  failStaleScans(_db);
  return _db;
}
