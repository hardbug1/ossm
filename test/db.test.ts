import { it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db";
import {
  insertProject, listProjects, getProject,
  insertScan, updateScan, replaceFindings, getScan, listScans,
} from "@/lib/db/queries";
import type { Finding } from "@/lib/types";

let db: InstanceType<typeof Database>;
beforeEach(() => {
  db = new Database(":memory:");
  migrate(db);
});

const findings: Finding[] = [
  { kind: "vuln", severity: "high", pkg: "lodash", identifier: "CVE-2021-23337", title: "ci", installed: "4.17.19", fixed: "4.17.21" },
  { kind: "license", severity: "high", pkg: "g4js", identifier: "AGPL-3.0", title: "강한 카피레프트 라이선스", note: "강한 카피레프트" },
];

it("프로젝트를 저장하고 조회한다", () => {
  insertProject(db, { id: "p1", name: "web", type: "github", value: "https://github.com/a/b", created: "2026-06-19" });
  expect(listProjects(db)).toHaveLength(1);
  expect(getProject(db, "p1")?.name).toBe("web");
});

it("스캔 생성·갱신·findings 저장·조회 왕복", () => {
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "running", started: "2026-06-19 10:00" });
  updateScan(db, "s1", { status: "done", finished: "2026-06-19 10:02", duration: "2분", trivy: "0.50.1", step: 5 });
  replaceFindings(db, "s1", findings);

  const scan = getScan(db, "s1")!;
  expect(scan.status).toBe("done");
  expect(scan.trivy).toBe("0.50.1");
  expect(scan.findings).toHaveLength(2);
  expect(scan.findings.find((f) => f.kind === "vuln")?.fixed).toBe("4.17.21");

  expect(listScans(db, "p1")).toHaveLength(1);
});

it("replaceFindings는 기존 findings를 교체한다", () => {
  insertProject(db, { id: "p1", name: "web", type: "local", value: "/tmp/x", created: "2026-06-19" });
  insertScan(db, { id: "s1", projectId: "p1", status: "running", started: "2026-06-19 10:00" });
  replaceFindings(db, "s1", findings);
  replaceFindings(db, "s1", [findings[0]]);
  expect(getScan(db, "s1")!.findings).toHaveLength(1);
});
