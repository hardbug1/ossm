import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, insertScan, getScan, hasActiveScan } from "@/lib/db/queries";
import { genId, startedLabel } from "@/lib/api/dto";
import { startScanJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectIdParam } = await params;
  const db = getDb();
  const project = getProject(db, projectIdParam);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  if (hasActiveScan(db, project.id)) return NextResponse.json({ error: "이미 진행 중인 스캔이 있습니다. 완료 후 다시 시도하세요." }, { status: 409 });
  const id = genId("s");
  insertScan(db, { id, projectId: project.id, status: "queued", started: startedLabel() });
  startScanJob(id);
  return NextResponse.json(getScan(db, id), { status: 201 });
}
