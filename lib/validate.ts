const WINDOWS_PATH = /^[A-Za-z]:[\\/]/;

/** `D:\workspace\t3` → `/mnt/d/workspace/t3` (WSL 마운트 규칙) */
export function windowsToWsl(value: string): string {
  const drive = value[0].toLowerCase();
  const rest = value.slice(2).replace(/\\/g, "/");
  return `/mnt/${drive}${rest.startsWith("/") ? rest : "/" + rest}`;
}

/** 시스템 경계(프로젝트 추가) 입력 검증. 문제가 있으면 한국어 메시지, 없으면 null. */
export function validateProjectInput(type: "github" | "local", value: string): string | null {
  const v = value.trim();
  if (WINDOWS_PATH.test(v)) {
    return `Windows 경로는 이 서버(WSL/Linux)에서 접근할 수 없습니다. WSL 경로로 입력하세요. 예: ${windowsToWsl(v)}`;
  }
  if (type === "github" && !/^(https?:\/\/|git@)/.test(v)) {
    return "GitHub 저장소는 URL 형식이어야 합니다 (예: https://github.com/org/repo). 로컬 폴더라면 유형을 '로컬 경로'로 선택하세요.";
  }
  return null;
}
