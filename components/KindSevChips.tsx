import { Icon } from "@/components/Icon";
import { kindSevGroups } from "@/lib/meta";
import type { Finding } from "@/lib/types";

// 종류(취약점/라이선스/구성)별로 묶어, 각 종류 아이콘 + 그 종류의 심각도 칩을 보여준다.
export function KindSevChips({ findings }: { findings: Finding[] }) {
  const groups = kindSevGroups(findings);
  if (groups.length === 0) {
    return <span style={{ fontSize: 12.5, color: "var(--md-sys-color-on-surface-variant)" }}>발견 없음</span>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {groups.map((g) => (
        <div key={g.kind} style={{ display: "inline-flex", alignItems: "center", gap: 5 }} title={g.kindKr}>
          <Icon name={g.kindIcon} size={16} color="var(--md-sys-color-on-surface-variant)" />
          {g.chips.map((c) => (
            <span
              key={c.key}
              style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.fg }}
            >
              {c.kr} {c.count}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
