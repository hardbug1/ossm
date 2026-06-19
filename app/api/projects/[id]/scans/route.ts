import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, insertScan, getScan } from "@/lib/db/queries";
import { genId, startedLabel } from "@/lib/api/dto";
import { startScanJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const project = getProject(db, params.id);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  const id = genId("s");
  insertScan(db, { id, projectId: project.id, status: "queued", started: startedLabel() });
  startScanJob(id);
  return NextResponse.json(getScan(db, id), { status: 201 });
}
