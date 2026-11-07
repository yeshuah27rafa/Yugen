// components/art/PieceArt.jsx
// Ilustración provisional de una pieza (SVG). Mientras no haya fotografías reales, cada categoría tiene su silueta
// y cada obra su atmósfera de color. No simula datos: solo ocupa el lugar de la imagen.
import { hashText, toneFor } from "../../utils/artwork.js";

const SHAPES = {
  pin: (t, id) => (
    <g>
      <circle cx="206" cy="266" r="118" fill="#000" opacity=".4" />
      <circle cx="200" cy="258" r="118" fill={t.o} />
      <circle cx="200" cy="258" r="100" fill={`url(#g-${id})`} />
      <circle cx="200" cy="258" r="84" fill="none" stroke={t.k} strokeWidth="2" opacity=".7" strokeDasharray="3 6" />
      <circle cx="162" cy="214" r="20" fill="#fff" opacity=".28" />
    </g>
  ),
  manga: (t, id) => (
    <g>
      <rect x="116" y="96" width="184" height="278" rx="4" fill="#000" opacity=".4" transform="translate(10 10)" />
      <rect x="116" y="96" width="184" height="278" rx="4" fill={t.o} />
      <rect x="116" y="96" width="22" height="278" fill="#000" opacity=".28" />
      <rect x="152" y="120" width="132" height="168" fill={`url(#g-${id})`} />
      <rect x="152" y="304" width="132" height="10" fill={t.k} opacity=".85" />
      <rect x="152" y="324" width="84" height="6" fill={t.k} opacity=".5" />
    </g>
  ),
  figura: (t, id) => (
    <g>
      <ellipse cx="212" cy="404" rx="108" ry="22" fill="#000" opacity=".45" />
      <ellipse cx="200" cy="396" rx="104" ry="22" fill={t.k} opacity=".9" />
      <path d="M150 390 C148 300 170 250 200 232 C230 250 252 300 250 390 Z" fill={t.o} />
      <path d="M200 232 C200 300 214 350 250 390 L200 390 Z" fill="#000" opacity=".22" />
      <circle cx="200" cy="190" r="40" fill={`url(#g-${id})`} />
      <path d="M158 190 C160 140 240 140 242 190 C228 168 172 168 158 190 Z" fill="#000" opacity=".55" />
    </g>
  ),
  mousepad: (t, id) => (
    <g>
      <rect x="40" y="170" width="332" height="190" rx="22" fill="#000" opacity=".4" transform="translate(10 12)" />
      <rect x="40" y="170" width="332" height="190" rx="22" fill={t.o} />
      <rect x="54" y="184" width="304" height="162" rx="12" fill={`url(#g-${id})`} />
      <rect x="54" y="184" width="304" height="162" rx="12" fill="none" stroke={t.k} strokeWidth="1.5" strokeDasharray="5 5" opacity=".7" />
      <path d="M54 300 Q130 240 206 290 T358 262" fill="none" stroke={t.k} strokeWidth="3" opacity=".8" />
    </g>
  ),
  otro: (t, id) => (
    <g>
      <path d="M130 130 H280 L310 160 V370 H130 Z" fill="#000" opacity=".4" transform="translate(10 10)" />
      <path d="M130 130 H280 L310 160 V370 H130 Z" fill={t.o} />
      <circle cx="220" cy="170" r="12" fill={t.b} />
      <rect x="150" y="210" width="140" height="130" fill={`url(#g-${id})`} />
    </g>
  )
};

export default function PieceArt({ category, seed, label, className }) {
  const tone = toneFor(seed);
  const id = String(hashText(`${seed}-${category}`));
  const draw = SHAPES[category] || SHAPES.otro;
  const initial = String(seed || "Y").trim().charAt(0).toUpperCase();
  return (
    <svg
      className={className ? `piece-art ${className}` : "piece-art"}
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.a} />
          <stop offset="1" stopColor={tone.b} />
        </linearGradient>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.k} stopOpacity=".95" />
          <stop offset="1" stopColor={tone.a} />
        </linearGradient>
        <pattern id={`d-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.1" fill="#000" opacity=".35" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill={`url(#bg-${id})`} />
      <circle cx="318" cy="112" r="64" fill={tone.k} opacity=".16" />
      <text x="396" y="520" textAnchor="end" fontFamily="var(--serif)" fontWeight="800" fontSize="420" fill={tone.k} opacity=".07">{initial}</text>
      <rect width="400" height="500" fill={`url(#d-${id})`} />
      {draw(tone, id)}
    </svg>
  );
}
