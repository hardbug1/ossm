import type Database from "better-sqlite3";
import type { Finding, Project } from "@/lib/types";
import { getDb } from "@/lib/db";
import { getProject, getScan, updateScan, replaceFindings } from "@/lib/db/queries";
import { runTrivyFs, getTrivyVersion, type Scanner } from "@/lib/scan/trivy";
import { normalizeTrivy } from "@/lib/scan/normalize";
import { resolveLocal } from "@/lib/ingest/local";
import { cloneGithub } from "@/lib/ingest/github";
import type { IngestResult } from "@/lib/ingest/local";
import { fetchHygieneFindings } from "@/lib/checks/github-hygiene";

type DB = InstanceType<typeof Database>;

export interface RunnerDeps {
  db: DB;
  scanner: Scanner;
  ingest: (p: Project) => Promise<IngestResult>;
  hygiene: (p: Project) => Promise<Finding[]>;
  now: () => string;
}

function nowLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function defaultIngest(p: Project): Promise<IngestResult> {
  if (p.type === "github") return cloneGithub(p.value, process.env.GITHUB_TOKEN);
  return resolveLocal(p.value);
}

async function defaultHygiene(p: Project): Promise<Finding[]> {
  const token = process.env.GITHUB_TOKEN;
  if (p.type !== "github" || !token) return [];
  return fetchHygieneFindings(p.value, token);
}

export async function runScanJob(scanId: string, partial?: Partial<RunnerDeps>): Promise<void> {
  const deps: RunnerDeps = {
    db: partial?.db ?? getDb(),
    scanner: partial?.scanner ?? runTrivyFs,
    ingest: partial?.ingest ?? defaultIngest,
    hygiene: partial?.hygiene ?? defaultHygiene,
    now: partial?.now ?? nowLabel,
  };
  const { db } = deps;
  const scan = getScan(db, scanId);
  if (!scan) return;
  const project = getProject(db, scan.projectId);
  if (!project) {
    updateScan(db, scanId, { status: "failed", error: "프로젝트를 찾을 수 없습니다", finished: deps.now() });
    return;
  }

  let ingest: IngestResult | null = null;
  try {
    // step 1: 큐 등록 → running
    updateScan(db, scanId, { status: "running", step: 1, trivy: (await getTrivyVersion()) ?? undefined });
    // step 2: 대상 확보
    ingest = await deps.ingest(project);
    updateScan(db, scanId, { step: 2 });
    // step 3: Trivy 스캔
    const raw = await deps.scanner(ingest.dir);
    updateScan(db, scanId, { step: 3 });
    // step 4: 정규화
    const findings = normalizeTrivy(raw);
    updateScan(db, scanId, { step: 4 });
    // step 5: 위생 점검(선택) + 분류·집계 저장
    const hyg = await deps.hygiene(project);
    replaceFindings(db, scanId, [...findings, ...hyg]);
    updateScan(db, scanId, { status: "done", step: 5, finished: deps.now() });
  } catch (e) {
    updateScan(db, scanId, { status: "failed", error: e instanceof Error ? e.message : String(e), finished: deps.now() });
  } finally {
    if (ingest) await ingest.cleanup().catch(() => {});
  }
}

export function startScanJob(scanId: string): void {
  void runScanJob(scanId);
}
