/**
 * Logo — e-Kumusta brand mark, recreated as inline SVG.
 *
 * A caring circle: two hands cradle a heart (wellbeing) in front of the
 * school, flanked by a student and a counselor, with check-in and progress
 * bubbles overhead. Flat vector style, scales cleanly to any size.
 *
 * Usage: <Logo size={48} /> or <Logo size={36} className="..." />
 */

const TEAL = "#2E9E8F";
const TEAL_DARK = "#20706A";
const BLUE = "#2D6FC1";
const BLUE_DARK = "#1E4E8C";
const NAVY = "#274472";
const NAVY_SOFT = "#33557F";
const HEART = "#E8536E";
const HEART_LINE = "#FFFFFF";
const SKIN = "#F2C9A4";
const SKIN_SHADE = "#E4B48C";
const SCHOOL = "#8FB4E3";
const SCHOOL_WINDOW = "#C7DCF4";
const BUBBLE_BLUE = "#4D8FD6";
const BUBBLE_TEAL = "#2E9E8F";
const BAG = "#5B8DD9";
const LAPTOP = "#274472";

export default function Logo({ size = 48, className = "", title = "e-Kumusta" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      role="img"
      aria-label={title}
    >
      {/* ── Outer caring ring ─────────────────────────────────────────── */}
      <path
        d="M64 6a58 58 0 1 1-40.6 16.6"
        stroke={BLUE}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M23.4 22.6A58 58 0 0 0 64 122"
        stroke={TEAL}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* ── School building (behind everything) ───────────────────────── */}
      <g>
        <rect x="47" y="46" width="34" height="34" rx="2" fill={SCHOOL} />
        <path d="M40 52l24-16 24 16v3H40v-3z" fill={SCHOOL} />
        <rect x="61" y="22" width="2.6" height="12" fill={SCHOOL} />
        <path d="M63.6 23l9 3.2-9 3.2v-6.4z" fill={SCHOOL} />
        <circle cx="64" cy="48" r="5.5" fill={SCHOOL_WINDOW} />
        <path
          d="M64 45.4V48l1.8 1.4"
          stroke={SCHOOL}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <rect x="52" y="58" width="7" height="9" rx="1" fill={SCHOOL_WINDOW} />
        <rect x="69" y="58" width="7" height="9" rx="1" fill={SCHOOL_WINDOW} />
        <rect x="60" y="70" width="8" height="10" rx="1" fill={SCHOOL_WINDOW} />
      </g>

      {/* ── Speech bubbles (check-in + progress) ──────────────────────── */}
      <g>
        <rect x="24" y="18" width="30" height="21" rx="6" fill={BUBBLE_BLUE} />
        <path d="M32 38l-2 7 8-7h-6z" fill={BUBBLE_BLUE} />
        <circle cx="34" cy="28.5" r="6.4" fill="#FFFFFF" />
        <circle cx="31.8" cy="27.4" r="1" fill={BUBBLE_BLUE} />
        <circle cx="36.2" cy="27.4" r="1" fill={BUBBLE_BLUE} />
        <path
          d="M31.6 30.6c1.5 1.4 3.3 1.4 4.8 0"
          stroke={BUBBLE_BLUE}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <rect
          x="43"
          y="24"
          width="8"
          height="2.2"
          rx="1.1"
          fill="#FFFFFF"
          opacity="0.9"
        />
        <rect
          x="43"
          y="28.5"
          width="6"
          height="2.2"
          rx="1.1"
          fill="#FFFFFF"
          opacity="0.9"
        />

        <rect x="76" y="16" width="26" height="21" rx="6" fill={BUBBLE_TEAL} />
        <path d="M84 36l-2 7 8-7h-6z" fill={BUBBLE_TEAL} />
        <rect x="81" y="30" width="3.2" height="5" rx="1" fill="#FFFFFF" />
        <rect x="86" y="26.5" width="3.2" height="8.5" rx="1" fill="#FFFFFF" />
        <rect x="91" y="22.5" width="3.2" height="12.5" rx="1" fill="#FFFFFF" />
      </g>

      {/* ── Student (left) ───────────────────────────────────────────── */}
      <g>
        {/* hair back */}
        <path
          d="M22 52c-6 6-8 15-8 24v14h10V58c0-3-.7-5-2-6z"
          fill={NAVY}
        />
        {/* face */}
        <path
          d="M25 45c0-5 4-9 9-9s9 4 9 9v6c0 5-4 9-9 9s-9-4-9-9v-6z"
          fill={SKIN}
        />
        {/* hair front */}
        <path
          d="M23 47c0-7 5-12 11-12s11 5 11 12v3c-2-5-5-7-11-7s-9 2-11 7v-3z"
          fill={NAVY}
        />
        <path d="M20 49c-1 8 0 17 3 24h4c-3-8-4-16-3-24h-4z" fill={NAVY} />
        {/* body / uniform */}
        <path
          d="M24 66c3-2 7-3 10-3s7 1 10 3c3 2 4 5 4 9v15H20V75c0-4 1-7 4-9z"
          fill="#FFFFFF"
        />
        <path d="M20 78h28v12H20z" fill={SKIN_SHADE} opacity="0.25" />
        {/* collar */}
        <path d="M30 63l4 5 4-5" stroke={NAVY} strokeWidth="1.6" fill="none" />
        {/* backpack strap */}
        <path d="M27 68v20" stroke={BAG} strokeWidth="4" strokeLinecap="round" />
        {/* arm holding book */}
        <path
          d="M40 74c3 2 5 5 5 9v7h-6v-9c0-3-1-5-3-6l4-1z"
          fill={SKIN}
        />
        {/* book */}
        <rect x="36" y="86" width="14" height="10" rx="1.5" fill={BAG} />
        <rect x="36" y="86" width="3" height="10" fill={BLUE_DARK} opacity="0.35" />
      </g>

      {/* ── Counselor (right) ────────────────────────────────────────── */}
      <g>
        {/* face */}
        <path
          d="M86 44c0-5 4-9 9-9s9 4 9 9v6c0 5-4 9-9 9s-9-4-9-9v-6z"
          fill={SKIN}
        />
        {/* hair */}
        <path
          d="M85 46c-1-8 4-13 10-13s11 5 10 13c-1-3-2-4-4-4 0 0-1-3-6-3s-6 3-6 3c-2 0-3 1-4 4z"
          fill={LAPTOP}
        />
        {/* body / blazer */}
        <path
          d="M85 65c3-2 7-3 10-3s7 1 10 3c3 2 5 5 5 9v16H80V74c0-4 2-7 5-9z"
          fill={BLUE}
        />
        {/* shirt */}
        <path d="M92 63l3 5 3-5h-6z" fill="#FFFFFF" />
        <path d="M93 66h5v14h-5z" fill="#FFFFFF" opacity="0.95" />
        {/* laptop */}
        <rect x="88" y="82" width="20" height="13" rx="2" fill={LAPTOP} />
        <rect x="90" y="84" width="16" height="9" rx="1" fill={NAVY_SOFT} />
      </g>

      {/* ── Heart with smiley (front and center) ─────────────────────── */}
      <g>
        <path
          d="M64 108c-1.6 0-3.2-.6-4.4-1.7C49 97 40 89 40 78.6 40 71.6 45.5 66 52.4 66c4.5 0 8.7 2.4 11.6 6.5C66.9 68.4 71.1 66 75.6 66 82.5 66 88 71.6 88 78.6c0 10.4-9 18.4-19.6 27.7-1.2 1.1-2.8 1.7-4.4 1.7z"
          fill={HEART}
        />
        <circle cx="64" cy="86" r="12.5" fill="none" stroke={HEART_LINE} strokeWidth="2.6" />
        <circle cx="59.5" cy="83.5" r="1.5" fill={HEART_LINE} />
        <circle cx="68.5" cy="83.5" r="1.5" fill={HEART_LINE} />
        <path
          d="M59.5 89.5c2.6 2.4 6.4 2.4 9 0"
          stroke={HEART_LINE}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* ── Cradling hands (foreground) ──────────────────────────────── */}
      <g>
        <path
          d="M36 122c-2-6-3-12-2-17 1-4 4-6 8-5 5 1 10 4 14 8l-4 14H36z"
          fill={TEAL}
        />
        <path
          d="M92 122c2-6 3-12 2-17-1-4-4-6-8-5-5 1-10 4-14 8l4 14h16z"
          fill={BLUE}
        />
        <path
          d="M42 105c4 1 9 4 13 8"
          stroke={TEAL_DARK}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M86 105c-4 1-9 4-13 8"
          stroke={BLUE_DARK}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
