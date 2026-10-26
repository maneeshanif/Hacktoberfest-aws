import type { CSSProperties } from "react";

// The Hifazat mark: a shield drawn on a 7x7 stud grid with a lime check (docs/brand/logo.svg).
// B = big stud (currentColor), L = lime check stud, s = small dim stud.
const ROWS = ["BBBBBBB", "BsssssB", "BssssLB", "BsLsLsB", "sBsLsBs", "ssBsBss", "sssBsss"];

type Props = { size?: number; className?: string; scan?: boolean; tile?: boolean };

// `scan` is the loading state: every stud pulses violet in a sweep, so the grid itself shows work in progress.
export default function StudShield({ size = 120, className = "", scan = false, tile = false }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`stud-shield ${scan ? "scan" : ""} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {tile && <rect width="200" height="200" rx="36" fill="var(--forest)" />}
      {ROWS.flatMap((row, r) =>
        [...row].map((kind, c) => (
          <circle
            key={r * 7 + c}
            className={`s s-${kind}`}
            cx={28 + 24 * c}
            cy={28 + 24 * r}
            r={kind === "s" ? 4.5 : 9}
            style={{ "--i": r * 7 + c } as CSSProperties}
          />
        )),
      )}
    </svg>
  );
}
