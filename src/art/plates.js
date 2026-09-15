/* 도감 삽화 — 오래된 자연 백과사전의 도판처럼. */

import { buildCloud } from './cloud.js';

function wavePath(x0, x1, y, amp, periods) {
  const n = 96;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y - Math.sin(t * Math.PI * 2 * periods) * amp;
    d += `${i ? 'L' : 'M'} ${x.toFixed(1)} ${yy.toFixed(1)} `;
  }
  return d;
}

/** 빛 — 입자이면서 파동 */
function lightPlate() {
  const wave = wavePath(28, 372, 104, 30, 2.5);
  let dots = '';
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = 28 + (372 - 28) * t;
    const y = 104 - Math.sin(t * Math.PI * 2 * 2.5) * 30;
    const r = 2.4 + Math.abs(Math.cos(t * Math.PI * 2 * 2.5)) * 2.6;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`;
  }
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    rays += `<line x1="${(200 + Math.cos(a) * 24).toFixed(1)}" y1="${(104 + Math.sin(a) * 24).toFixed(1)}"
                   x2="${(200 + Math.cos(a) * 44).toFixed(1)}" y2="${(104 + Math.sin(a) * 44).toFixed(1)}"/>`;
  }
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#hand-fine)">
        <path d="${wave}" fill="none" stroke="#2f2e27" stroke-width="1.8"
              stroke-linecap="round" opacity="0.5"/>
        <g stroke="#f0cf86" stroke-width="1.6" stroke-linecap="round" opacity="0.85">${rays}</g>
        <circle cx="200" cy="104" r="21" fill="url(#sunDisc)"/>
        <circle cx="200" cy="104" r="21" fill="none" stroke="#2f2e27"
                stroke-width="1.4" opacity="0.35"/>
        <g fill="#2f2e27" opacity="0.62">${dots}</g>
      </g>
      <line x1="28" y1="168" x2="372" y2="168" stroke="#2f2e27"
            stroke-width="1" opacity="0.16"/>
    </svg>`;
}

/** 구름 — 흰 구름, 맑은 날의 것 */
function cloudPlate() {
  const c = buildCloud({ x: 30, y: 12, scale: 0.98, seed: 8801 });
  /* 비스듬히 들어온 햇빛이 여러 방향으로 흩어진다 */
  let inRays = '';
  for (let i = 0; i < 4; i++) {
    const y = 18 + i * 13;
    inRays += `<line x1="10" y1="${y}" x2="${104 + i * 7}" y2="${y + 48}"/>`;
  }
  let outRays = '';
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.08 + (i / 10) * 0.84);
    const x0 = 200 + Math.cos(a) * 118, y0 = 96 + Math.sin(a) * 58;
    const x1 = 200 + Math.cos(a) * 158, y1 = 96 + Math.sin(a) * 88;
    outRays += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}"
                      x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
  }
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#c9a85e" stroke-width="1.5" stroke-linecap="round" opacity="0.6">${inRays}</g>
      ${c.markup}
      <g stroke="#9d9884" stroke-width="1.2" stroke-linecap="round" opacity="0.5">${outRays}</g>
      <line x1="28" y1="182" x2="372" y2="182" stroke="#2f2e27"
            stroke-width="1" opacity="0.16"/>
    </svg>`;
}

function unknownPlate() {
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="20" width="344" height="160" fill="none"
            stroke="#2f2e27" stroke-width="1" stroke-dasharray="4 7" opacity="0.28"/>
    </svg>`;
}

export function plate(kind) {
  if (kind === 'light') return lightPlate();
  if (kind === 'cloud') return cloudPlate();
  return unknownPlate();
}
