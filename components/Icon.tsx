import type { CSSProperties } from "react";

export function Icon({
  name,
  filled,
  size = 24,
  color,
  style,
}: {
  name: string;
  filled?: boolean;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={filled ? "md-icon is-filled" : "md-icon"} style={{ fontSize: size, color, ...style }}>
      {name}
    </span>
  );
}
