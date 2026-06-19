import { describe, it, expect } from "vitest";
import { parseTrivyVersion } from "@/lib/scan/trivy";

describe("parseTrivyVersion", () => {
  it("'Version: x.y.z' 형식에서 버전을 뽑는다", () => {
    expect(parseTrivyVersion("Version: 0.50.1\nVulnerability DB:\n  Version: 2")).toBe("0.50.1");
  });
  it("형식이 다르면 null", () => {
    expect(parseTrivyVersion("garbage")).toBe(null);
  });
});
