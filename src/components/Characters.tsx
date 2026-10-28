import type { Lane } from "@/data/steps";

type P = { sleepy?: boolean | undefined; className?: string };

/** Flat, emoji-style face: dot eyes and one small mouth. No shine, no blush. */
function Face({ cx, cy, r, sleepy }: { cx: number; cy: number; r: number; sleepy?: boolean | undefined }) {
  const ex = r * 0.4;
  const ey = cy - r * 0.05;
  const mw = r * 0.34;
  const my = cy + r * 0.45;
  return (
    <g>
      {sleepy ? (
        <g stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <path d={`M${cx - ex - 1.6} ${ey} q1.6 1.8 3.2 0`} />
          <path d={`M${cx + ex - 1.6} ${ey} q1.6 1.8 3.2 0`} />
        </g>
      ) : (
        <g fill="var(--foreground)">
          <circle cx={cx - ex} cy={ey} r={r * 0.13} />
          <circle cx={cx + ex} cy={ey} r={r * 0.13} />
        </g>
      )}
      <path
        d={sleepy ? `M${cx - mw * 0.5} ${my} h${mw}` : `M${cx - mw} ${my} q${mw} ${r * 0.3} ${mw * 2} 0`}
        stroke="var(--foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

/** Parent and child, standing side by side, holding hands. */
export function Family({ sleepy, className }: P) {
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden>
      <ellipse cx="28" cy="19" rx="11.5" ry="14" fill="var(--hair)" />
      <rect x="25" y="26" width="6" height="9" fill="var(--skin)" />
      <path d="M13 60 V46 a13 13 0 0 1 26 0 V60 Z" fill="var(--fam)" />
      <circle cx="28" cy="20" r="9" fill="var(--skin)" />
      <Face cx={28} cy={20} r={9} sleepy={sleepy} />

      <ellipse cx="57" cy="32" rx="9" ry="11" fill="var(--hair)" />
      <rect x="54.5" y="38" width="5" height="7" fill="var(--skin)" />
      <path d="M48 60 V52 a9 9 0 0 1 18 0 V60 Z" fill="var(--fam-soft)" />
      <circle cx="57" cy="33" r="7" fill="var(--skin)" />
      <Face cx={57} cy={33} r={7} sleepy={sleepy} />

      <path d="M37 46 q6 4 11 4" stroke="var(--skin)" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Agent in a collared shirt and glasses, holding a clipboard. */
export function Agent({ sleepy, className }: P) {
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden>
      <g transform="rotate(8 60 44)">
        <rect x="52" y="30" width="19" height="27" rx="2" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="57" y="27" width="9" height="5" rx="1.5" fill="var(--foreground)" opacity=".65" />
        <g stroke="var(--foreground)" strokeWidth="1.4" strokeLinecap="round" opacity=".45">
          <path d="M56 39 h11" />
          <path d="M56 44 h11" />
          <path d="M56 49 h7" />
        </g>
      </g>

      <path d="M14 60 V45 a14 14 0 0 1 28 0 V60 Z" fill="var(--agt)" />
      <rect x="25" y="25" width="7" height="10" fill="var(--skin-2)" />
      <path d="M21.5 39.5 l7 6.5 l7 -6.5 l-3.5 -3 h-7 z" fill="var(--card)" />
      <ellipse cx="28.5" cy="15.5" rx="10.5" ry="11.5" fill="var(--hair-2)" />
      <circle cx="28.5" cy="18" r="8.5" fill="var(--skin-2)" />
      <Face cx={28.5} cy={18} r={8.5} sleepy={sleepy} />

      <g fill="none" stroke="var(--foreground)" strokeWidth="1.4">
        <rect x="22.1" y="14.6" width="6" height="6.4" rx="2.2" />
        <rect x="28.9" y="14.6" width="6" height="6.4" rx="2.2" />
        <path d="M28.1 17.6 h.8" />
        <path d="M22.1 16.4 l-2.2 -1.2" />
        <path d="M34.9 16.4 l2.2 -1.2" />
      </g>

      <circle cx="50" cy="47" r="3.2" fill="var(--skin-2)" />
    </svg>
  );
}

/** Apartment block with a rooftop water tower. Windows go dark when it is not its turn. */
export function City({ sleepy, className }: P) {
  const win = sleepy ? "var(--city-soft)" : "var(--card)";
  return (
    <svg viewBox="0 0 80 64" className={className} aria-hidden>
      <path d="M20.5 4 h13 l-6.5 -4 z" fill="var(--city)" />
      <path d="M19 8 h16 l-1.5 -4 h-13 z" fill="var(--city-mid)" />
      <g stroke="var(--city)" strokeWidth="1.6">
        <path d="M22 8 v2" />
        <path d="M32 8 v2" />
      </g>

      <rect x="44" y="30" width="22" height="30" fill="var(--city-mid)" />
      <g fill="var(--city-soft)">
        <rect x="49" y="36" width="6" height="7" />
        <rect x="58" y="36" width="6" height="7" />
        <rect x="49" y="47" width="6" height="7" />
        <rect x="58" y="47" width="6" height="7" />
      </g>

      <rect x="10" y="14" width="34" height="46" fill="var(--city)" />
      <rect x="7" y="10" width="40" height="5" rx="1.5" fill="var(--city-mid)" />
      <g fill={win}>
        <rect x="15" y="20" width="7" height="8" />
        <rect x="24.5" y="20" width="7" height="8" />
        <rect x="34" y="20" width="7" height="8" />
        <rect x="15" y="32" width="7" height="8" />
        <rect x="24.5" y="32" width="7" height="8" />
        <rect x="34" y="32" width="7" height="8" />
        <rect x="15" y="44" width="7" height="8" />
        <rect x="34" y="44" width="7" height="8" />
      </g>
      <path d="M22 60 V53 a6 6 0 0 1 12 0 V60 Z" fill="var(--card)" />
    </svg>
  );
}

export const CHAR: Record<Lane, (p: P) => React.JSX.Element> = { fam: Family, agt: Agent, city: City };
