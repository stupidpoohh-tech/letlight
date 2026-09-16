/* 원리의 도식.
   그림이 아니라 설명이다. 가는 선과 점, 파선 화살표만 쓴다. */

const INK = '#2f312c';
const SOFT = '#b4b8a8';
const OLIVE = '#7d8760';

const svg = (inner, box = '0 0 200 150') =>
  `<svg class="mark" viewBox="${box}" xmlns="http://www.w3.org/2000/svg"
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

/* 침투 — 물이 흙 입자 사이의 공극을 따라 땅속으로 들어간다 */
const infiltration = () => svg(`
  <line x1="18" y1="52" x2="182" y2="52" stroke="${INK}" stroke-width="1.3"/>
  ${[[42, 22], [74, 16], [108, 24], [140, 18]]
    .map(([x, y]) => arrow(x, y, x - 3, 48)).join('')}
  ${(() => {
    let g = ''; let a = 7 * 9301;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) {
      const x = 22 + rnd() * 156;
      const y = 60 + rnd() * 76;
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
                    r="${(3.4 + rnd() * 5).toFixed(1)}" stroke="${INK}"
                    stroke-width="1" opacity=".55"/>`;
    }
    return g;
  })()}
  <path d="M74 54 C 70 70, 82 82, 78 98 C 74 112, 86 122, 84 136"
        stroke="${OLIVE}" stroke-width="1.6" opacity=".85"/>
  <path d="M120 54 C 126 68, 114 78, 118 92 C 122 104, 112 114, 116 128"
        stroke="${OLIVE}" stroke-width="1.4" opacity=".7"/>
  <text x="18" y="146" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">공극</text>`);

/* 지표 유출 — 받아들이지 못한 물이 표면에 남아 낮은 곳으로 모인다 */
const runoff = () => svg(`
  <path d="M14 46 C 60 52, 104 74, 150 106 L 190 128" stroke="${INK}" stroke-width="1.3"/>
  ${[[40, 12], [72, 8], [104, 14], [136, 10]]
    .map(([x, y]) => arrow(x, y, x - 2, y + 26)).join('')}
  <path d="M30 50 C 74 58, 116 80, 160 112" stroke="${OLIVE}" stroke-width="2.2" opacity=".85"/>
  <path d="M38 56 C 78 64, 118 86, 158 118" stroke="${OLIVE}" stroke-width="1.2" opacity=".5"/>
  ${[[58, 62], [96, 82], [132, 104]]
    .map(([x, y]) => arrow(x, y + 6, x + 16, y + 18, '2 3')).join('')}
  <ellipse cx="176" cy="132" rx="16" ry="5" stroke="${OLIVE}" stroke-width="1.2" opacity=".7"/>
  <text x="16" y="132" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">지표</text>`);

/* 자기조직화 — 같은 규칙이 생장점에서 반복되며 전체 형태가 나타난다 */
const selfOrganization = () => svg(`
  <line x1="100" y1="140" x2="100" y2="96" stroke="${INK}" stroke-width="1.6"/>
  <path d="M100 96 L 74 68 M100 96 L 126 68" stroke="${INK}" stroke-width="1.4"/>
  <path d="M74 68 L 58 48 M74 68 L 86 46 M126 68 L 114 46 M126 68 L 142 48"
        stroke="${INK}" stroke-width="1.1"/>
  <path d="M58 48 L 48 34 M58 48 L 64 32 M86 46 L 80 30 M86 46 L 94 32
           M114 46 L 106 32 M114 46 L 120 30 M142 48 L 136 32 M142 48 L 152 34"
        stroke="${SOFT}" stroke-width="1"/>
  ${[[48, 34], [64, 32], [80, 30], [94, 32], [106, 32], [120, 30], [136, 32], [152, 34]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${OLIVE}" stroke="none"/>`).join('')}
  <circle cx="100" cy="96" r="9" stroke="${SOFT}" stroke-width="1" stroke-dasharray="3 4"/>
  ${arrow(30, 108, 30, 60)}
  <text x="12" y="126" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">반복</text>`);

/* 표현형 가소성 — 같은 씨앗이 자란 자리에 따라 다른 형태가 된다 */
const plasticity = () => svg(`
  <circle cx="100" cy="24" r="6" stroke="${INK}" stroke-width="1.3"/>
  ${arrow(92, 32, 60, 62)}${arrow(108, 32, 140, 62)}
  <line x1="56" y1="132" x2="56" y2="76" stroke="${INK}" stroke-width="1.5"/>
  <path d="M56 100 L 44 88 M56 88 L 68 78 M56 112 L 46 104" stroke="${INK}" stroke-width="1"/>
  <ellipse cx="56" cy="76" rx="15" ry="20" stroke="${SOFT}" stroke-width="1.1"/>
  <line x1="144" y1="132" x2="144" y2="104" stroke="${INK}" stroke-width="1.5"/>
  <path d="M144 104 L 118 92 M144 104 L 170 92 M144 110 L 124 106 M144 110 L 164 106"
        stroke="${INK}" stroke-width="1"/>
  <ellipse cx="144" cy="96" rx="34" ry="13" stroke="${SOFT}" stroke-width="1.1"/>
  <line x1="30" y1="132" x2="82" y2="132" stroke="${INK}" stroke-width="1" opacity=".5"/>
  <line x1="112" y1="132" x2="180" y2="132" stroke="${INK}" stroke-width="1" opacity=".5"/>
  <text x="30" y="146" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">숲 속</text>
  <text x="130" y="146" fill="${SOFT}" stroke="none"
        font-size="9" font-family="system-ui,sans-serif">벌판</text>`);

const MARKS = { scattering, growth, imbibition, photosynthesis, carbonFixation,
                infiltration, runoff, selfOrganization, plasticity };

export function mark(conceptId) {
  const fn = MARKS[conceptId];
  return fn ? fn() : svg(`<circle cx="100" cy="75" r="26" stroke="${SOFT}"
                            stroke-width="1" stroke-dasharray="4 5"/>`);
}

/* 순환의 고리 — 이름 몇 개가 한 바퀴를 돈다.
   배지 그림이 아직 없을 때 그 자리에도 이것을 쓴다. */
export function ring(names = [], { labels = true } = {}) {
  const n = names.length;
  if (!n) return '';
  const cx = 100, cy = 92, r = 54;
  const at = (i, rad = r) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };

  /* 점과 점 사이를 도는 파선 화살표 */
  let arcs = '';
  for (let i = 0; i < n; i++) {
    const gap = 0.36;
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2 + gap;
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2 - gap;
    const p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
    const p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
    arcs += `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}
                      A ${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}"
                   stroke="${SOFT}" stroke-width="1.1" stroke-dasharray="3 4"
                   marker-end="url(#mk-tip)"/>`;
  }

  const marks = names.map((name, i) => {
    const [x, y] = at(i);
    const ux = Math.cos(-Math.PI / 2 + (i / n) * Math.PI * 2);
    const uy = Math.sin(-Math.PI / 2 + (i / n) * Math.PI * 2);
    const anchor = ux > 0.4 ? 'start' : ux < -0.4 ? 'end' : 'middle';
    const tx = x + ux * 11;
    const ty = y + uy * 11 + (uy < -0.4 ? -2 : uy > 0.4 ? 10 : 4);
    const dot = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"
                         fill="${OLIVE}" stroke="none"/>`;
    if (!labels) return dot;
    return dot + `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${INK}" stroke="none"
                  text-anchor="${anchor}" font-size="12"
                  font-family="system-ui,sans-serif">${name}</text>`;
  }).join('');

  return svg(arcs + marks, labels ? '0 0 200 184' : '38 30 124 124');
}
