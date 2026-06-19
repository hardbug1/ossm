import { describe, it, expect } from "vitest";
import { fetchHygieneFindings } from "@/lib/checks/github-hygiene";

// 가장 구체적인(최장) 매칭 키를 선택해 substring 모호성을 제거한다.
function mockFetch(routes: Record<string, { status: number; body?: any }>): typeof fetch {
  return (async (url: string) => {
    const key = Object.keys(routes)
      .filter((k) => String(url).includes(k))
      .sort((a, b) => b.length - a.length)[0];
    const r = key ? routes[key] : { status: 404 };
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body ?? {} } as Response;
  }) as unknown as typeof fetch;
}

describe("fetchHygieneFindings", () => {
  it("보호 미설정·문서 없음을 finding으로 만든다", async () => {
    const f = await fetchHygieneFindings("https://github.com/a/b", "tok", mockFetch({
      "/repos/a/b": { status: 200, body: { default_branch: "main" } },
      "/repos/a/b/branches/": { status: 200, body: { protected: false } },
      "/repos/a/b/contents/SECURITY.md": { status: 404 },
      "/repos/a/b/contents/LICENSE": { status: 404 },
    }));
    const ids = f.map((x) => x.identifier);
    expect(ids).toContain("GH-BRANCH");
    expect(ids).toContain("GH-SECURITY");
    expect(ids).toContain("GH-LICENSE");
    expect(f.every((x) => x.hygiene === true && x.kind === "misconfig")).toBe(true);
  });

  it("모두 양호하면 빈 배열", async () => {
    const f = await fetchHygieneFindings("https://github.com/a/b", "tok", mockFetch({
      "/repos/a/b": { status: 200, body: { default_branch: "main" } },
      "/repos/a/b/branches/": { status: 200, body: { protected: true } },
      "/repos/a/b/contents/SECURITY.md": { status: 200, body: {} },
      "/repos/a/b/contents/LICENSE": { status: 200, body: {} },
    }));
    expect(f).toEqual([]);
  });

  it("잘못된 URL이면 빈 배열", async () => {
    expect(await fetchHygieneFindings("not-a-url", "tok", mockFetch({}))).toEqual([]);
  });
});
