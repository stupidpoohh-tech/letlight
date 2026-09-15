/* 첫 번째 세계.
   하늘 / 완만한 언덕 / 땅 / 아주 적은 자연 요소.
   아직 덜 완성되어 있어야 한다. 앞으로 알아가며 채워질 자리이기 때문이다. */

import { makeRng, makeNoise, fbm, between } from '../core/rng.js';

export const VB = { w: 1000, h: 2000, horizon: 1056 };

const f = (n) => Math.round(n * 10) / 10;

/** 점들을 부드러운 곡선으로 잇는다 (Catmull–Rom → 3차 베지에) */
function smooth(pts) {
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)},`
      +  ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)},`
      +  ` ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** 한 겹의 능선 */
function ridge({ noise, baseY, amp, seedOff, samples = 15 }) {
  const pts = [];
  const x0 = -90, span = 1180;
  for (let i = 0; i <= samples; i++) {
    const x = x0 + (i / samples) * span;
    const h = fbm(noise, i * 0.56 + seedOff, 3);
    pts.push([x, baseY - (h - 0.5) * amp * 2]);
  }
  const line = smooth(pts);
  const area = `${line} L ${x0 + span} ${VB.h + 60} L ${x0} ${VB.h + 60} Z`;
  const yAt = (x) => {
    const t = ((x - x0) / span) * samples;
    const i = Math.max(0, Math.min(samples - 1, Math.floor(t)));
    return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (t - i);
  };
  return { line, area, yAt };
}

/** 능선 위의 짧은 풀 획 */
function grassOn(r, rng, { count, spread, opacity, width = 1.6, color = '#3a3a2a' }) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = between(rng, -50, 1050);
    const drop = Math.pow(rng(), 1.7) * spread;
    const y = r.yAt(x) + 2 + drop;
    const len = between(rng, 7, 15) * (1 - drop / (spread * 1.55));
    if (len < 3.5) continue;
    const lean = between(rng, -4, 4);
    out += `<path d="M ${f(x)} ${f(y)} q ${f(lean * 0.35)} ${f(-len * 0.62)} ${f(lean)} ${f(-len)}"/>`;
  }
  return `<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"
             opacity="${opacity}" filter="url(#hand-fine)">${out}</g>`;
}

/** 드문드문한 덤불. 나무는 아직 두지 않는다. */
function tufts(r, rng, { count, scale, opacity }) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = between(rng, -20, 1020);
    const y = r.yAt(x) + between(rng, 6, 46);
    const s = scale * between(rng, 0.7, 1.25);
    out += `<path transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"
                  d="M -17 0 C -17 -11, -8 -17, 0 -17 C 9 -17, 17 -11, 17 0 Z"/>`;
  }
  return `<g fill="#6c7a4b" opacity="${opacity}" filter="url(#hand-fine)">${out}</g>`;
}

/** 능선이 낮아지는 자리에 드리우는 골 그림자 */
function folds(r, { shade, amp }, count, i) {
  if (!count) return '';
  const step = 18, lows = [];
  let p2 = r.yAt(-60), p1 = r.yAt(-60 + step);
  for (let x = -60 + step * 2; x < 1060; x += step) {
    const y = r.yAt(x);
    if (p1 > p2 && p1 >= y) lows.push([x - step, p1]);
    p2 = p1; p1 = y;
  }
  const picked = lows.slice(0, count);
  const w = 54 + i * 18, depth = 80 + i * 44;
  const out = picked.map(([x, y]) =>
    `<path d="M ${f(x - w)} ${f(y - 4)} Q ${f(x)} ${f(y + depth * 0.45)} ${f(x)} ${f(y + depth)}`
    + ` Q ${f(x)} ${f(y + depth * 0.45)} ${f(x + w)} ${f(y - 4)} Z"/>`).join('');
  return `<g fill="${shade}" opacity="0.3" filter="url(#soft)">${out}</g>`;
}

/** 강 — 해가 선 자리에서 흘러내린다 */
function river(rng) {
  const spine = [
    [508, VB.horizon - 8], [520, 1086], [496, 1118], [534, 1150],
    [504, 1184], [552, 1218], [522, 1256], [586, 1292], [548, 1330],
  ];
  const widths = [6, 13, 21, 30, 41, 54, 70, 88, 112];
  const left = [], right = [];
  spine.forEach(([x, y], i) => {
    left.push([x - widths[i] / 2, y]);
    right.push([x + widths[i] / 2, y]);
  });
  const tail = right[right.length - 1];
  const d = `${smooth(left)} L ${f(tail[0])} ${f(tail[1])} `
          + smooth(right.slice().reverse()).replace(/^M[^C]*/, '') + ' Z';

  let ripples = '';
  for (let i = 0; i < 30; i++) {
    const t = between(rng, 0.2, 0.99);
    const idx = Math.min(spine.length - 2, Math.floor(t * (spine.length - 1)));
    const k = t * (spine.length - 1) - idx;
    const cx = spine[idx][0] + (spine[idx + 1][0] - spine[idx][0]) * k;
    const cy = spine[idx][1] + (spine[idx + 1][1] - spine[idx][1]) * k;
    const w = (widths[idx] + (widths[idx + 1] - widths[idx]) * k) * between(rng, 0.2, 0.52);
    ripples += `<path d="M ${f(cx - w)} ${f(cy)} q ${f(w)} ${f(between(rng, -2.6, 2.6))} ${f(w * 2)} 0"/>`;
  }

  return `<g filter="url(#hand-water)">
      <path d="${d}" fill="url(#waterGrad)"/>
      <path d="${d}" fill="none" stroke="#5c6a58" stroke-width="1.4" opacity="0.22"/>
      <g fill="none" stroke="#fdf6e4" stroke-width="1.8" stroke-linecap="round"
         opacity="0.55">${ripples}</g>
    </g>`;
}

/** 앞쪽의 오솔길 */
function trail(rng) {
  const left  = [[388, VB.h + 40], [416, 1900], [452, 1800], [488, 1710], [520, 1636], [548, 1578], [566, 1540]];
  const right = [[634, VB.h + 40], [630, 1902], [612, 1804], [590, 1714], [572, 1640], [576, 1580], [584, 1542]];
  const tail = right[right.length - 1];
  const d = `${smooth(left)} L ${f(tail[0])} ${f(tail[1])} `
          + smooth(right.slice().reverse()).replace(/^M[^C]*/, '') + ' Z';

  let pebbles = '';
  for (let i = 0; i < 40; i++) {
    const t = Math.pow(rng(), 0.65);
    const y = 1556 + t * 460;
    const half = 18 + t * 100;
    const cx = 516 + t * 12 + between(rng, -half, half);
    const r = between(rng, 1.8, 5.6);
    pebbles += `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.66)}"/>`;
  }

  return `<g filter="url(#hand-fine)">
      <path d="${d}" fill="url(#trailGrad)"/>
      <path d="${d}" fill="url(#hatch-fine)" opacity="0.06"/>
      <path d="${d}" fill="none" stroke="#9c8358" stroke-width="1.8" opacity="0.45"/>
      <g fill="#9c8358" opacity="0.5">${pebbles}</g>
    </g>`;
}

/** 바위 몇 개. 그 이상은 두지 않는다. */
function stones() {
  const list = [
    { x: 196, y: 1690, s: 1.0,  flip:  1 },
    { x: 352, y: 1742, s: 0.66, flip: -1 },
    { x: 806, y: 1712, s: 1.12, flip: -1 },
    { x: 660, y: 1636, s: 0.5,  flip:  1 },
  ];
  const body = `M -66 16 C -71 -13, -46 -35, -16 -38 C 15 -41, 53 -31, 64 -9
                C 73 6, 68 19, 57 21 L -56 23 Z`;
  return list.map(({ x, y, s, flip }) => `
      <g transform="translate(${x} ${y}) scale(${flip * s} ${s})" filter="url(#hand-fine)">
        <path d="${body}" fill="url(#stoneGrad)"/>
        <path d="${body}" fill="url(#hatch)" opacity="0.17"/>
        <path d="${body}" fill="none" stroke="#3a3a2a" stroke-width="1.8" opacity="0.4"/>
        <path d="M -42 -23 C -23 -31, 3 -32, 22 -25" fill="none"
              stroke="#3a3a2a" stroke-width="1.2" opacity="0.2"/>
        <path d="M -30 -6 C -12 -12, 10 -12, 30 -4" fill="none"
              stroke="#3a3a2a" stroke-width="1" opacity="0.14"/>
      </g>`).join('');
}

/** 해 — 지평선에 반쯤 걸쳐 있다 */
function sun() {
  const cx = 508, cy = VB.horizon + 10, r = 88;
  let rays = '';
  for (let i = 0; i < 52; i++) {
    const a = (Math.PI * (i + 0.5)) / 52;
    const len = r + 48 + ((i * 53) % 13) * 19;
    const w = 1.2 + ((i * 29) % 7) * 0.32;
    rays += `<line stroke-width="${w.toFixed(2)}"
                   x1="${f(cx - Math.cos(a) * (r + 16))}" y1="${f(cy - Math.sin(a) * (r + 16))}"
                   x2="${f(cx - Math.cos(a) * len)}"      y2="${f(cy - Math.sin(a) * len)}"/>`;
  }
  return `<g>
      <ellipse cx="${cx}" cy="${cy}" rx="560" ry="430" fill="url(#sunGlow)" opacity="0.9"/>
      <g stroke="#e6bf68" stroke-linecap="round" opacity="0.26">${rays}</g>
      <circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="#fdf5dd" opacity="0.55"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sunDisc)"/>
    </g>`;
}

/** 하늘의 인쇄 결. 구름이 아니다 — 아주 평평하고 희미하다. */
function skyLines(rng) {
  let out = '';
  for (let i = 0; i < 13; i++) {
    const y = between(rng, 70, 820);
    const x = between(rng, -140, 470);
    const w = between(rng, 300, 800);
    const sag = between(rng, -6, 6);
    out += `<path d="M ${f(x)} ${f(y)} q ${f(w / 2)} ${f(sag)} ${f(w)} 0"/>`;
  }
  return `<g fill="none" stroke="#5a6470" stroke-width="1.4" stroke-linecap="round"
             opacity="0.05">${out}</g>`;
}

/* ------------------------------------------------------------------
   먼 곳은 창백하고 푸르게, 가까운 곳은 따뜻하고 짙게.
   각 겹은 능선 바로 아래가 볕을 받고 아래로 갈수록 그늘진다.
   ------------------------------------------------------------------ */

const BANDS = [
  { baseY: 1046, amp: 15, seedOff:  0.0, lit: '#ccd2c2', shade: '#b7c0a9', fade:  90, hatch: 0.03, grass:   0, tuft: 0, fold: 0 },
  { baseY: 1086, amp: 26, seedOff:  4.3, lit: '#cdd0ad', shade: '#aeb894', fade: 130, hatch: 0.04, grass:  70, tuft: 0, fold: 0 },
  { baseY: 1152, amp: 42, seedOff:  9.1, lit: '#cccb9c', shade: '#9fa980', fade: 200, hatch: 0.05, grass: 130, tuft: 0, fold: 2 },
  { baseY: 1256, amp: 58, seedOff: 15.7, lit: '#c6c288', shade: '#8f9c72', fade: 280, hatch: 0.06, grass: 180, tuft: 5, fold: 3 },
  { baseY: 1396, amp: 70, seedOff: 23.4, lit: '#bdb97b', shade: '#7d8c62', fade: 340, hatch: 0.07, grass: 230, tuft: 8, fold: 3 },
  { baseY: 1566, amp: 64, seedOff: 31.2, lit: '#b0af6f', shade: '#6a7a52', fade: 520, hatch: 0.08, grass: 300, tuft: 10, fold: 4 },
];

function bandGradients() {
  return BANDS.map((b, i) => `
    <linearGradient id="band${i}" gradientUnits="userSpaceOnUse"
                    x1="0" y1="${b.baseY - b.amp}" x2="0" y2="${b.baseY + b.fade}">
      <stop offset="0%"   stop-color="${b.lit}"/>
      <stop offset="34%"  stop-color="${b.lit}"/>
      <stop offset="100%" stop-color="${b.shade}"/>
    </linearGradient>`).join('');
}

const LOCAL_DEFS = `
  <linearGradient id="trailGrad" gradientUnits="userSpaceOnUse" x1="0" y1="1540" x2="0" y2="2010">
    <stop offset="0%"   stop-color="#d8bf92"/>
    <stop offset="100%" stop-color="#bda071"/>
  </linearGradient>
  <linearGradient id="stoneGrad" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#b3ae98"/>
    <stop offset="100%" stop-color="#8a8672"/>
  </linearGradient>
  <radialGradient id="haze" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%"   stop-color="#fbeec7" stop-opacity="0.5"/>
    <stop offset="45%"  stop-color="#f6e6bf" stop-opacity="0.34"/>
    <stop offset="100%" stop-color="#f2e2ba" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="horizonHaze" gradientUnits="userSpaceOnUse" x1="0" y1="1010" x2="0" y2="1200">
    <stop offset="0%"   stop-color="#f7e9c6" stop-opacity="0.55"/>
    <stop offset="55%"  stop-color="#f4e6c2" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#f4e6c2" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="foreShade" gradientUnits="userSpaceOnUse" x1="0" y1="1780" x2="0" y2="2010">
    <stop offset="0%"   stop-color="#3a4a2a" stop-opacity="0"/>
    <stop offset="100%" stop-color="#3a4a2a" stop-opacity="0.26"/>
  </linearGradient>`;

/* ------------------------------------------------------------------ */

export function buildLandscape(seed = 20260915) {
  const rng = makeRng(seed);
  const noise = makeNoise(seed % 9973);

  const layer = (b, i) => {
    const r = ridge({ noise, ...b });
    let out = `<g filter="url(#hand)">
        <path d="${r.area}" fill="url(#band${i})"/>
        <path d="${r.area}" fill="url(#hatch)" opacity="${b.hatch}"/>
        <path d="${r.line}" fill="none" stroke="#3a3a2a"
              stroke-width="${1.4 + i * 0.22}" opacity="${(0.14 + i * 0.035).toFixed(2)}"/>
      </g>`;
    out += folds(r, b, b.fold, i);
    if (b.tuft) out += tufts(r, rng, { count: b.tuft, scale: 0.38 + i * 0.12, opacity: 0.17 });
    if (b.grass) {
      out += grassOn(r, rng, {
        count: b.grass,
        spread: 26 + i * 22,
        opacity: 0.07 + i * 0.016,
        width: 1.2 + i * 0.16,
      });
    }
    return out;
  };

  const far  = BANDS.slice(0, 3).map((b, i) => layer(b, i)).join('');
  const near = BANDS.slice(3).map((b, i) => layer(b, i + 3)).join('');

  return `<svg viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid slice"
               xmlns="http://www.w3.org/2000/svg">
    <defs>${bandGradients()}${LOCAL_DEFS}</defs>

    <rect x="-100" y="-100" width="1200" height="${VB.horizon + 140}" fill="url(#skyGrad)"/>
    ${skyLines(rng)}
    ${sun()}

    ${far}
    ${river(rng)}

    <!-- 지평선의 대기 -->
    <ellipse cx="508" cy="${VB.horizon + 6}" rx="620" ry="200" fill="url(#haze)"/>
    <rect x="-100" y="1010" width="1200" height="190" fill="url(#horizonHaze)"/>

    ${near}
    ${trail(rng)}
    ${stones()}

    <rect x="-100" y="1780" width="1200" height="240" fill="url(#foreShade)"/>
  </svg>`;
}
