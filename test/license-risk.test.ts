import { describe, it, expect } from "vitest";
import { classifyLicense } from "@/lib/checks/license-risk";

describe("classifyLicense", () => {
  it("강한 카피레프트는 high", () => {
    expect(classifyLicense("AGPL-3.0").severity).toBe("high");
    expect(classifyLicense("GPL-2.0").severity).toBe("high");
    expect(classifyLicense("GPL-3.0-only").severity).toBe("high");
  });
  it("약한 카피레프트는 medium", () => {
    expect(classifyLicense("LGPL-2.1").severity).toBe("medium");
    expect(classifyLicense("MPL-2.0").severity).toBe("medium");
  });
  it("허용형은 low", () => {
    expect(classifyLicense("MIT").severity).toBe("low");
    expect(classifyLicense("Apache-2.0").severity).toBe("low");
    expect(classifyLicense("BSD-3-Clause").severity).toBe("low");
  });
  it("매핑에 없으면 unknown + 검토 필요", () => {
    const r = classifyLicense("SEE LICENSE IN LICENSE");
    expect(r.severity).toBe("unknown");
    expect(r.note).toBe("검토 필요");
  });
  it("대소문자·공백을 무시하고 매칭한다", () => {
    expect(classifyLicense("  agpl-3.0  ").severity).toBe("high");
  });
});
