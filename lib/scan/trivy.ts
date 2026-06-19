import { spawn } from "node:child_process";
import type { TrivyOutput } from "@/lib/types";

export type Scanner = (dir: string) => Promise<TrivyOutput>;

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { timeout: timeoutMs });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export const runTrivyFs: Scanner = async (dir) => {
  let result;
  try {
    result = await run(
      "trivy",
      ["fs", dir, "--scanners", "vuln,license,misconfig", "--format", "json", "--quiet", "--timeout", "5m"],
      6 * 60 * 1000,
    );
  } catch (e) {
    if (e instanceof Error && (e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Trivy가 설치되어 있지 않습니다. Trivy CLI 설치 후 다시 시도하세요.");
    }
    throw e;
  }
  const { code, stdout, stderr } = result;
  if (code !== 0) throw new Error(`Trivy 실행 실패 (exit ${code}): ${stderr.slice(0, 500)}`);
  try {
    return JSON.parse(stdout) as TrivyOutput;
  } catch {
    throw new Error(`Trivy 출력 JSON 파싱 실패: ${stdout.slice(0, 200)}`);
  }
};

export function parseTrivyVersion(out: string): string | null {
  const m = /Version:\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(out);
  return m ? m[1] : null;
}

export async function getTrivyVersion(): Promise<string | null> {
  try {
    const { code, stdout } = await run("trivy", ["--version"], 10000);
    if (code !== 0) return null;
    return parseTrivyVersion(stdout);
  } catch {
    return null;
  }
}
