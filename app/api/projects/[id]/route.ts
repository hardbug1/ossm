import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/db/queries";
import { projectWithScans } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const p = getProject(db, params.id);
  if (!p) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(projectWithScans(db, p));
}
