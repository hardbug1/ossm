import { describe, it, expect } from "vitest";
import { sortFindings, summarize, sevChips, prep, SEV_META, kindSevGroups } from "@/lib/meta";
import type { Finding } from "@/lib/types";

const sample: Finding[] = [
  { kind: "vuln", severity: "low", pkg: "semver", identifier: "CVE-2022-25883", title: "ReDoS", installed: "7.3.4", fixed: "7.5.2" },
  { kind: "vuln", severity: "critical", pkg: "jsonwebtoken", identifier: "CVE-2022-23529", title: "auth bypass", installed: "8.5.1", fixed: "9.0.0" },
  { kind: "license", severity: "high", pkg: "ghostscript4js", identifier: "AGPL-3.0", title: "강한 카피레프트", note: "강한 카피레프트" },
  { kind: "misconfig", severity: "high", pkg: "Dockerfile", identifier: "DS002", title: "root 실행", note: "USER 지정" },
];

describe("sortFindings", () => {
  it("심각도 순서대로 정렬한다 (critical 먼저)", () => {
    const ordered = sortFindings(sample).map((f) => f.severity);
    expect(ordered[0]).toBe("critical");
    expect(ordered[ordered.length - 1]).toBe("low");
  });
});

describe("summarize", () => {
  it("심각도·종류별 개수와 고위험 라이선스/구성 수를 집계한다", () => {
    const s = summarize(sample);
    expect(s.total).toBe(4);
    expect(s.sev.critical).toBe(1);
    expect(s.kind.vuln).toBe(2);
    expect(s.kind.license).toBe(1);
    expect(s.licHigh).toBe(1);
    expect(s.miscHigh).toBe(1);
  });
});

describe("sevChips", () => {
  it("개수가 0인 심각도는 제외하고 메타를 붙인다", () => {
    const chips = sevChips(sample);
    const keys = chips.map((c) => c.key);
    expect(keys).toContain("critical");
    expect(keys).not.toContain("unknown");
    expect(chips[0].kr).toBe(SEV_META[chips[0].key].kr);
  });
});

describe("kindSevGroups", () => {
  it("종류 순서(취약점→라이선스→구성)로 묶고, 각 종류 안에서 심각도 칩을 만든다", () => {
    const groups = kindSevGroups(sample);
    expect(groups.map((g) => g.kind)).toEqual(["vuln", "license", "misconfig"]);
    const vuln = groups.find((g) => g.kind === "vuln")!;
    expect(vuln.kindKr).toBe("취약점");
    expect(vuln.chips.map((c) => c.key)).toEqual(["critical", "low"]); // 심각도 순
    expect(groups.find((g) => g.kind === "license")!.chips.map((c) => c.key)).toEqual(["high"]);
  });
  it("발견이 없는 종류는 제외한다", () => {
    const onlyLicense = kindSevGroups(sample.filter((f) => f.kind === "license"));
    expect(onlyLicense.map((g) => g.kind)).toEqual(["license"]);
    expect(kindSevGroups([])).toEqual([]);
  });
});

describe("prep", () => {
  it("취약점은 right에 설치→수정 버전을, 그 외는 note를 넣는다", () => {
    expect(prep(sample[1]).right).toBe("8.5.1 → 9.0.0");
    expect(prep(sample[2]).right).toBe("강한 카피레프트");
  });
  it("수정버전이 없으면 '수정버전 없음'", () => {
    const f: Finding = { kind: "vuln", severity: "high", pkg: "x", identifier: "CVE-X", title: "t", installed: "1.0.0" };
    expect(prep(f).right).toBe("수정버전 없음");
  });
});
