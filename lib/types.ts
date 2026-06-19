export type Severity = "critical" | "high" | "medium" | "low" | "unknown";
export type Kind = "vuln" | "license" | "misconfig";
export type ScanStatus = "queued" | "running" | "done" | "failed";

export interface Finding {
  kind: Kind;
  severity: Severity;
  pkg: string;
  identifier: string;
  title: string;
  installed?: string;
  fixed?: string;
  note?: string;
  hygiene?: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: "github" | "local";
  value: string;
  created: string;
}

export interface Scan {
  id: string;
  projectId: string;
  status: ScanStatus;
  started: string;
  finished?: string;
  duration?: string;
  trivy?: string;
  error?: string;
  step?: number;
  findings: Finding[];
}

// Trivy fs JSON (필요 필드만)
export interface TrivyOutput {
  Results?: TrivyResult[];
}
export interface TrivyResult {
  Target?: string;
  Class?: string;
  Type?: string;
  Vulnerabilities?: TrivyVuln[];
  Licenses?: TrivyLicense[];
  Misconfigurations?: TrivyMisconf[];
}
export interface TrivyVuln {
  VulnerabilityID?: string;
  PkgName?: string;
  InstalledVersion?: string;
  FixedVersion?: string;
  Severity?: string;
  Title?: string;
  PrimaryURL?: string;
}
export interface TrivyLicense {
  PkgName?: string;
  Name?: string;
  Category?: string;
  Severity?: string;
}
export interface TrivyMisconf {
  ID?: string;
  Title?: string;
  Description?: string;
  Severity?: string;
  Resolution?: string;
}
