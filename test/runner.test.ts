import { it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db";
import { insertProject, insertScan, getScan } from "@/lib/db/queries";
import { runScanJob } from "@/lib/jobs/runner";
import type { Project, TrivyOutput } from "@/lib/types";

let db: InstanceType<typeof Database>;
beforeEach(() => {
  db = new Database(":memory:");
  migrate(db);
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "queued", started: "2026-06-19 10:00" });
});

const fakeTrivy: TrivyOutput = {
  Results: [{ Target: "package-lock.json", Vulnerabilities: [{ VulnerabilityID: "CVE-1", PkgName: "lodash", InstalledVersion: "1", FixedVersion: "2", Severity: "HIGH", Title: "x" }] }],
};

const deps = (over = {}) => ({
  db,
  scanner: async () => fakeTrivy,
  ingest: async (_p: Project) => ({ dir: "/tmp/x", cleanup: async () => {} }),
  hygiene: async (_p: Project) => [],
  now: () => "2026-06-19 10:02",
  ...over,
});

it("성공 경로: done + findings 저장 + step 5", async () => {
  await runScanJob("s1", deps());
  const s = getScan(db, "s1")!;
  expect(s.status).toBe("done");
  expect(s.step).toBe(5);
  expect(s.findings).toHaveLength(1);
  expect(s.finished).toBe("2026-06-19 10:02");
});

it("ingest/scanner 실패: failed + error 기록 + cleanup 호출", async () => {
  let cleaned = false;
  await runScanJob("s1", deps({
    ingest: async () => ({ dir: "/x", cleanup: async () => { cleaned = true; } }),
    scanner: async () => { throw new Error("Trivy 실행 실패 (exit 1): boom"); },
  }));
  const s = getScan(db, "s1")!;
  expect(s.status).toBe("failed");
  expect(s.error).toContain("Trivy 실행 실패");
  expect(cleaned).toBe(true);
});
