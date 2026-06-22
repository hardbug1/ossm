import { describe, it, expect } from "vitest";
import { normalizeTrivy } from "@/lib/scan/normalize";
import fixture from "./fixtures/trivy-fs.json";
import type { TrivyOutput } from "@/lib/types";

describe("normalizeTrivy", () => {
  const findings = normalizeTrivy(fixture as TrivyOutput);

  it("취약점을 매핑하고 severity를 소문자화한다", () => {
    const lodash = findings.find((f) => f.identifier === "CVE-2021-23337")!;
    expect(lodash.kind).toBe("vuln");
    expect(lodash.severity).toBe("high");
    expect(lodash.pkg).toBe("lodash");
    expect(lodash.installed).toBe("4.17.19");
    expect(lodash.fixed).toBe("4.17.21");
    expect(lodash.url).toBe("https://avd.aquasec.com/nvd/cve-2021-23337");
    expect(lodash.description).toContain("command injection");
  });

  it("알 수 없는 severity와 누락 필드를 방어적으로 처리한다", () => {
    const mystery = findings.find((f) => f.identifier === "CVE-2099-0000")!;
    expect(mystery.severity).toBe("unknown");
    expect(mystery.fixed).toBeUndefined();
  });

  it("라이선스 severity는 classifyLicense로 결정한다", () => {
    const agpl = findings.find((f) => f.kind === "license" && f.pkg === "ghostscript4js")!;
    expect(agpl.severity).toBe("high");
    expect(agpl.note).toBe("강한 카피레프트");
    const mit = findings.find((f) => f.kind === "license" && f.pkg === "left-pad")!;
    expect(mit.severity).toBe("low");
  });

  it("구성 이슈를 매핑하고 note에 Resolution을 넣는다", () => {
    const ds = findings.find((f) => f.kind === "misconfig")!;
    expect(ds.identifier).toBe("DS002");
    expect(ds.severity).toBe("high");
    expect(ds.note).toContain("USER");
  });

  it("Results가 없으면 빈 배열", () => {
    expect(normalizeTrivy({})).toEqual([]);
  });
});
