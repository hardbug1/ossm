import { describe, it, expect } from "vitest";
import { validateProjectInput, windowsToWsl } from "@/lib/validate";

describe("windowsToWsl", () => {
  it("Windows 드라이브 경로를 WSL 경로로 변환한다", () => {
    expect(windowsToWsl("D:\\workspace\\t3")).toBe("/mnt/d/workspace/t3");
    expect(windowsToWsl("C:/Users/me/proj")).toBe("/mnt/c/Users/me/proj");
  });
});

describe("validateProjectInput", () => {
  it("Windows 경로는 유형 무관하게 WSL 경로 안내로 거부한다", () => {
    const err = validateProjectInput("local", "D:\\workspace\\t3");
    expect(err).toContain("WSL 경로");
    expect(err).toContain("/mnt/d/workspace/t3");
    expect(validateProjectInput("github", "C:\\repo")).toContain("WSL 경로");
  });

  it("GitHub 유형인데 URL이 아니면 거부한다", () => {
    expect(validateProjectInput("github", "my-local-folder")).toContain("URL");
  });

  it("정상 입력은 null", () => {
    expect(validateProjectInput("github", "https://github.com/org/repo")).toBeNull();
    expect(validateProjectInput("github", "git@github.com:org/repo.git")).toBeNull();
    expect(validateProjectInput("local", "/mnt/d/workspace/t3")).toBeNull();
    expect(validateProjectInput("local", "/home/pc/work/ossm")).toBeNull();
  });
});
