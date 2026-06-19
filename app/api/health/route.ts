import { NextResponse } from "next/server";
import { getTrivyVersion } from "@/lib/scan/trivy";

export const dynamic = "force-dynamic";

export async function GET() {
  const trivy = await getTrivyVersion();
  return NextResponse.json({ trivy });
}
