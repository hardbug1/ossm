import puppeteer from "puppeteer";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// puppeteer 번들 다운로드(storage.googleapis.com)가 막힌 환경을 위해,
// 시스템/플레이라이트가 설치한 Chromium을 찾아 executablePath로 사용한다.
function resolveExecutable(): string | undefined {
  const env = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env && existsSync(env)) return env;

  const pwRoot = join(homedir(), ".cache", "ms-playwright");
  if (existsSync(pwRoot)) {
    // 풀 chromium("chromium-")을 headless-shell보다 우선
    for (const dir of readdirSync(pwRoot).sort()) {
      if (!dir.startsWith("chromium")) continue;
      for (const cand of [
        join(pwRoot, dir, "chrome-linux64", "chrome"),
        join(pwRoot, dir, "chrome-linux", "chrome"),
        join(pwRoot, dir, "chrome-headless-shell-linux64", "chrome-headless-shell"),
      ]) {
        if (existsSync(cand)) return cand;
      }
    }
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"]) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

export async function renderReportPdf(scanId: string, origin: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: resolveExecutable(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/while loading shared librar|error while loading|libnss3|libnspr4|libasound/.test(msg)) {
      throw new Error("PDF용 Chromium 실행에 필요한 시스템 라이브러리가 없습니다. `sudo apt-get install -y libnss3 libnspr4 libasound2` 실행 후 다시 시도하세요.");
    }
    if (/Could not find Chrome|Failed to launch|Browser was not found|Could not find browser/.test(msg)) {
      throw new Error("PDF 생성을 위한 Chromium이 없습니다. `npx playwright install chromium` 실행 후 다시 시도하세요.");
    }
    throw e;
  }
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/scans/${scanId}/report?print=1`, { waitUntil: "networkidle0", timeout: 60000 });
    // 한글/웹폰트가 모두 로드된 뒤 렌더 (폰트 미로딩 시 글자가 깨지는 것 방지)
    await page.evaluate(() => document.fonts.ready);
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
