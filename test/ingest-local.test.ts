import { describe, it, expect } from "vitest";
import { resolveLocal } from "@/lib/ingest/local";
import { tmpdir } from "node:os";

describe("resolveLocal", () => {
  it("존재하는 디렉토리는 그대로 반환한다", async () => {
    const r = await resolveLocal(tmpdir());
    expect(r.dir).toBe(tmpdir());
    await r.cleanup(); // noop, throw 없어야 함
  });
  it("없는 경로는 throw", async () => {
    await expect(resolveLocal("/no/such/path/xyz123")).rejects.toThrow("경로가 존재하지");
  });
});
