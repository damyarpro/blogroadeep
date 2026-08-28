/**
 * Deterministic abstract cover art, drawn when a post has no uploaded image.
 * Purely decorative vector shapes on a charcoal ground, seeded from the slug so a
 * given post always gets the same composition. Four motifs keep a grid varied.
 */

const INK_BASE = '#161818';
const INK_DEEP = '#0c0d0d';
const INK_SOFT = '#212423';
const BONE_SOFT = '#d3d3cb';
const MINT = '#8ce99a';

/** Small stable string hash: same slug in, same art out, on server or client. */
function hashOf(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function Ripples({ n }: { n: number }) {
  const cx = 118 + (n % 5) * 24;
  const cy = 92 + (n % 3) * 16;
  const rings = [148, 120, 94, 70, 48, 30];

  return (
    <>
      {rings.map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={i === rings.length - 2 ? MINT : BONE_SOFT}
          strokeOpacity={i === rings.length - 2 ? 0.95 : 0.2 + i * 0.11}
          strokeWidth={i === rings.length - 2 ? 5 : 14 - i * 2}
        />
      ))}
      <circle cx={cx} cy={cy} r={16} fill={INK_SOFT} />
    </>
  );
}

function Bands({ n }: { n: number }) {
  const shift = (n % 7) * 9;

  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M-20 ${34 + i * 32 + shift} C 90 ${-6 + i * 30 + shift}, 190 ${88 + i * 26}, 340 ${20 + i * 34}`}
          fill="none"
          stroke={i === 2 ? MINT : BONE_SOFT}
          strokeOpacity={i === 2 ? 0.95 : 0.16 + i * 0.13}
          strokeWidth={i === 2 ? 6 : 22 - i * 3}
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function Spheres({ n }: { n: number }) {
  const spheres = [
    { cx: 92 + (n % 4) * 12, cy: 112, r: 72, fill: 'url(#coverArtSphere)', o: 1 },
    { cx: 206, cy: 70 + (n % 3) * 14, r: 48, fill: BONE_SOFT, o: 0.5 },
    { cx: 258, cy: 138, r: 28, fill: MINT, o: 1 },
  ];

  return (
    <>
      <rect x={0} y={132} width={320} height={68} fill={INK_DEEP} opacity={0.6} />
      {spheres.map((s) => (
        <circle key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} fillOpacity={s.o} />
      ))}
    </>
  );
}

function Folds({ n }: { n: number }) {
  const lean = (n % 5) * 12;

  return (
    <>
      <path d={`M${40 + lean} 200 L${120 + lean} 8 L${168 + lean} 200 Z`} fill={BONE_SOFT} opacity={0.42} />
      <path d={`M${140 + lean} 200 L${226 + lean} 40 L${300} 200 Z`} fill={BONE_SOFT} opacity={0.2} />
      <path d={`M${8} 200 L${74 + lean} 96 L${104 + lean} 200 Z`} fill={INK_SOFT} />
      <circle cx={258 - lean} cy={74} r={24} fill={MINT} />
    </>
  );
}

export function CoverArt({ seed, className = '' }: { seed: string; className?: string }) {
  const n = hashOf(seed || 'roadeep');
  const motif = (n >> 3) % 4;
  const flipped = (n >> 2) % 2 === 1;
  const scale = 0.86 + ((n >> 6) % 30) / 100;

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id="coverArtSphere" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="45%" stopColor={BONE_SOFT} stopOpacity="0.42" />
          <stop offset="100%" stopColor={INK_DEEP} />
        </radialGradient>
      </defs>

      <rect width="320" height="200" fill={INK_BASE} />
      <g transform={`translate(160 100) scale(${flipped ? -scale : scale} ${scale}) translate(-160 -100)`}>
        {motif === 0 && <Ripples n={n} />}
        {motif === 1 && <Bands n={n} />}
        {motif === 2 && <Spheres n={n} />}
        {motif === 3 && <Folds n={n} />}
      </g>
    </svg>
  );
}
