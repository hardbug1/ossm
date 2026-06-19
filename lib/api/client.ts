import type { Project, Scan } from "@/lib/types";

export type ProjectWithScans = Project & { scans: Scan[] };

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `요청 실패 (${res.status})`);
  return res.json() as Promise<T>;
}

export const fetchProjects = () => fetch("/api/projects").then((r) => j<ProjectWithScans[]>(r));
export const createProject = (body: { name: string; type: "github" | "local"; value: string }) =>
  fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<Project>(r));
export const fetchProject = (id: string) => fetch(`/api/projects/${id}`).then((r) => j<ProjectWithScans>(r));
export const triggerScan = (id: string) => fetch(`/api/projects/${id}/scans`, { method: "POST" }).then((r) => j<Scan>(r));
export const fetchScan = (id: string) => fetch(`/api/scans/${id}`).then((r) => j<Scan>(r));
