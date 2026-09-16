/* 원리의 도식.
   그림이 아니라 설명이다. 가는 선과 점, 파선 화살표만 쓴다. */

const INK = '#2f312c';
const SOFT = '#b4b8a8';
const OLIVE = '#7d8760';

const svg = (inner) =>
  `<svg class="mark" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"
        fill="none" stroke-linecap="round" stroke-linejoin="round">
     <defs>
       <marker id="mk-tip" viewBox="0 0 8 8" refX="6" refY="4"
               markerWidth="6" markerHeight="6" orient="auto-start-reverse">
         <path d="M1 1 L6 4 L1 7" stroke="${SOFT}" stroke-width="1.1" fill="none"/>
       </marker>
     </defs>${inner}
   </svg>`;

const arrow = (x1, y1, x2, y2, dash = '3 4') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${SOFT}"
         stroke-width="1.1" stroke-dasharray="${dash}" marker-end="url(#mk-tip)"/>`;

/** 알갱이 하나. 판화의 점각처럼 찍는다. */
function speckled(cx, cy, r, seed = 1) {
  let dots = '';
  let a = seed * 9301;
  const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 46; i++) {
    const t = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * (r - 2);
    dots += `<circle cx="${(cx + Math.cos(t) * d).toFixed(1)}"
                     cy="${(cy + Math.sin(t) * d).toFixed(1)}"
                     r="${(0.5 + rnd() * 0.7).toFixed(2)}" fill="${INK}" opacity=".5" stroke="none"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${INK}" stroke-width="1.2"/>${dots}`;
}

/* 빛의 산란 — 나란히 들어와 사방으로 흩어진다 */
const scattering = () => svg(`
  ${[58, 75, 92].map((y) => arrow(18, y, 74, y)).join('')}
  ${speckled(100, 75, 24, 3)}
  ${[[-42, -34], [-18, -46], [10, -44], [34, -26], [44, 2], [30, 30], [4, 42], [-24, 34]]
    .map(([dx, dy]) => arrow(100 + dx * 0.52, 75 + dy * 0.52, 100 + dx, 75 + dy)).join('')}`);

/* 강수 입자의 성장 — 작은 것들이 부딪혀 커진다 */
const growth = () => svg(`
  ${[[26, 52, 4], [34, 78, 3.2], [24, 100, 3.6], [46, 64, 3], [44, 96, 4.2]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" stroke="${INK}" stroke-width="1.1"/>`).join('')}
  ${arrow(58, 68, 82, 74)}${arrow(58, 92, 82, 80)}
  ${[[98, 62, 7], [100, 92, 8]].map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" stroke="${INK}" stroke-width="1.1"/>`).join('')}
  ${arrow(114, 70, 136, 76)}${arrow(114, 88, 136, 80)}
  <path d="M158 56 C 170 74, 174 84, 174 92 a 16 16 0 0 1 -32 0 c 0 -8 4 -18 16 -36 Z"
        stroke="${INK}" stroke-width="1.3"/>
  <line x1="150" y1="120" x2="166" y2="134" stroke="${SOFT}" stroke-width="1.1"/>`);

/* 흡윤 — 마른 것이 물을 머금고 부푼다 */
const imbibition = () => svg(`
  <ellipse cx="100" cy="78" rx="34" ry="26" stroke="${SOFT}" stroke-width="1"
           stroke-dasharray="3 4"/>
  <ellipse cx="100" cy="78" rx="27" ry="20" stroke="${INK}" stroke-width="1.3"/>
  <path d="M86 70 C 94 64, 108 64, 115 71" stroke="${INK}" stroke-width="1" opacity=".55"/>
  ${arrow(30, 50, 68, 66)}${arrow(26, 78, 66, 78)}${arrow(30, 106, 68, 90)}
  ${arrow(170, 50, 132, 66)}${arrow(174, 78, 134, 78)}${arrow(170, 106, 132, 90)}
  <circle cx="100" cy="78" r="2" fill="${OLIVE}" stroke="none"/>`);

/* 광합성 — 빛이 들어오고, 공기에서 탄소가 들어오고, 산소가 나간다 */
const photosynthesis = () => svg(`
  <path d="M104 118 C 104 88, 112 56, 140 40 C 150 72, 140 106, 104 118 Z"
        stroke="${INK}" stroke-width="1.3"/>
  <path d="M104 118 C 114 96, 126 70, 138 46" stroke="${INK}" stroke-width="1" opacity=".5"/>
  ${[0, 1, 2].map((i) => arrow(26, 30 + i * 13, 96, 56 + i * 13)).join('')}
  ${arrow(58, 120, 96, 110)}
  ${arrow(150, 96, 184, 112)}
  <text x="22" y="20" fill="${OLIVE}" stroke="none"
        font-size="9" letter-spacing="1.4" font-family="system-ui,sans-serif">LIGHT</text>
  <text x="18" y="136" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">CO₂</text>
  <text x="172" y="130" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">O₂</text>`);

/* 탄소 고정 — 흩어져 있던 탄소가 회로 안으로 들어온다 */
const carbonFixation = () => svg(`
  <circle cx="108" cy="76" r="34" stroke="${SOFT}" stroke-width="1.1" stroke-dasharray="4 5"/>
  <path d="M96 62 L120 62 L128 76 L120 90 L96 90 L88 76 Z" stroke="${INK}" stroke-width="1.3"/>
  ${arrow(24, 52, 74, 66)}
  ${[[26, 34], [40, 24], [18, 70]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="2.2" fill="${SOFT}" stroke="none"/>`).join('')}
  ${arrow(142, 86, 178, 100)}
  <circle cx="108" cy="42" r="2.4" fill="${OLIVE}" stroke="none"/>
  <text x="14" y="88" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">CO₂</text>
  <text x="150" y="122" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">C₆</text>`);

const MARKS = { scattering, growth, imbibition, photosynthesis, carbonFixation };

export function mark(conceptId) {
  const fn = MARKS[conceptId];
  return fn ? fn() : svg(`<circle cx="100" cy="75" r="26" stroke="${SOFT}"
                            stroke-width="1" stroke-dasharray="4 5"/>`);
}
