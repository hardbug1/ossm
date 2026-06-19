import { stat } from "node:fs/promises";

export interface IngestResult {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function resolveLocal(path: string): Promise<IngestResult> {
  let ok = false;
  try {
    ok = (await stat(path)).isDirectory();
  } catch {
    ok = false;
  }
  if (!ok) throw new Error(`경로가 존재하지 않거나 디렉토리가 아닙니다: ${path}`);
  return { dir: path, cleanup: async () => {} };
}
