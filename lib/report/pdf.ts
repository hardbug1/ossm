import puppeteer from "puppeteer";

export async function renderReportPdf(scanId: string, origin: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  } catch (e) {
    if (e instanceof Error && /Could not find Chrome|Failed to launch/.test(e.message)) {
      throw new Error("PDF 생성을 위한 Chromium이 없습니다. `npx puppeteer browsers install chrome` 실행 후 다시 시도하세요.");
    }
    throw e;
  }
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/scans/${scanId}/report?print=1`, { waitUntil: "networkidle0", timeout: 60000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
