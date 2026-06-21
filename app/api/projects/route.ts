import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects, insertProject } from "@/lib/db/queries";
import { projectWithScans, genId } from "@/lib/api/dto";
import { validateProjectInput } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(listProjects(db).map((p) => projectWithScans(db, p)));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const type = body.type === "local" ? "local" : "github";
  const value = String(body.value ?? "").trim();
  if (!name || !value) return NextResponse.json({ error: "이름과 경로를 입력하세요" }, { status: 400 });
  const invalid = validateProjectInput(type, value);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const db = getDb();
  const created = new Date().toISOString().slice(0, 10);
  const project = insertProject(db, { id: genId("p"), name, type, value, created });
  return NextResponse.json(project, { status: 201 });
}
