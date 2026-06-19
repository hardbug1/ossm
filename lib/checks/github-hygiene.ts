import type { Finding } from "@/lib/types";

function parseRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export async function fetchHygieneFindings(repoUrl: string, token: string, fetchImpl: typeof fetch = fetch): Promise<Finding[]> {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return [];
  const { owner, repo } = parsed;
  const base = "https://api.github.com";
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  const out: Finding[] = [];
  try {
    const repoRes = await fetchImpl(`${base}/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) return [];
    const meta = await repoRes.json();
    const branch = meta.default_branch ?? "main";

    const branchRes = await fetchImpl(`${base}/repos/${owner}/${repo}/branches/${branch}`, { headers });
    if (branchRes.ok) {
      const b = await branchRes.json();
      if (!b.protected) {
        out.push({ kind: "misconfig", severity: "medium", pkg: "repository", identifier: "GH-BRANCH", title: "기본 브랜치 보호 규칙 미설정", note: "필수 리뷰 설정", hygiene: true });
      }
    }
    const sec = await fetchImpl(`${base}/repos/${owner}/${repo}/contents/SECURITY.md`, { headers });
    if (!sec.ok) {
      out.push({ kind: "misconfig", severity: "low", pkg: "repository", identifier: "GH-SECURITY", title: "SECURITY.md 보안 정책 파일 없음", note: "신고 절차 문서화", hygiene: true });
    }
    const lic = await fetchImpl(`${base}/repos/${owner}/${repo}/contents/LICENSE`, { headers });
    if (!lic.ok) {
      out.push({ kind: "misconfig", severity: "low", pkg: "repository", identifier: "GH-LICENSE", title: "LICENSE 파일 없음", note: "라이선스 명시", hygiene: true });
    }
  } catch {
    return [];
  }
  return out;
}
