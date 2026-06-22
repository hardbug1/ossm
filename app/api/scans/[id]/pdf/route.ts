import { getDb } from "@/lib/db";
import { getScan } from "@/lib/db/queries";
import { renderReportPdf } from "@/lib/report/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = getScan(getDb(), id);
  if (!scan) {
    return new Response(JSON.stringify({ error: "스캔을 찾을 수 없습니다" }), { status: 404, headers: { "content-type": "application/json" } });
  }
  try {
    const origin = new URL(req.url).origin;
    const pdf = await renderReportPdf(id, origin);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="ossm-report-${id}.pdf"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `PDF 생성 실패: ${e instanceof Error ? e.message : String(e)}` }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
