import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getScan } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = getScan(getDb(), params.id);
  if (!s) return NextResponse.json({ error: "스캔을 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(s);
}
