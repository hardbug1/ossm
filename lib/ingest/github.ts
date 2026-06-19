import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IngestResult } from "@/lib/ingest/local";

function withToken(url: string, token?: string): string {
  if (!token) return url;
  try {
    const u = new URL(url);
    u.username = token;
    u.password = "x-oauth-basic";
    return u.toString();
  } catch {
    return url;
  }
}

export async function cloneGithub(url: string, token?: string): Promise<IngestResult> {
  const dir = await mkdtemp(join(tmpdir(), "ossm-clone-"));
  const cleanup = async () => { await rm(dir, { recursive: true, force: true }); };
  const code: number = await new Promise((resolve, reject) => {
    const child = spawn("git", ["clone", "--depth", "1", withToken(url, token), dir], { timeout: 3 * 60 * 1000 });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (c) => resolve(c ?? -1));
  });
  if (code !== 0) {
    await cleanup();
    throw new Error(`git clone 실패: repository not found 또는 토큰 인증 필요 (exit ${code})`);
  }
  return { dir, cleanup };
}
