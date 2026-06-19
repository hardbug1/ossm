import type Database from "better-sqlite3";
import type { Project, Scan } from "@/lib/types";
import { listScans } from "@/lib/db/queries";

export function projectWithScans(db: InstanceType<typeof Database>, project: Project): Project & { scans: Scan[] } {
  return { ...project, scans: listScans(db, project.id) };
}

export function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function startedLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
