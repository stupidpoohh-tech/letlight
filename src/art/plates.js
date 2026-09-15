/* 도감 도판 — 오래된 자연 백과사전의 그림처럼. */

import { buildCloud } from './cloud.js';

/** 구름 — 흰 구름, 맑은 날의 것 */
function cloudPlate() {
  const c = buildCloud({ x: 30, y: 14, scale: 0.98, seed: 8801 });
  let inRays = '';
  for (let i = 0; i < 4; i++) {
    const y = 16 + i * 13;
    inRays += `<line x1="10" y1="${y}" x2="${104 + i * 7}" y2="${y + 48}"/>`;
  }
  let outRays = '';
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.08 + (i / 10) * 0.84);
    outRays += `<line x1="${(200 + Math.cos(a) * 118).toFixed(1)}" y1="${(98 + Math.sin(a) * 58).toFixed(1)}"
                      x2="${(200 + Math.cos(a) * 158).toFixed(1)}" y2="${(98 + Math.sin(a) * 88).toFixed(1)}"/>`;
  }
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#c9a85e" stroke-width="1.5" stroke-linecap="round" opacity="0.6">${inRays}</g>
      ${c.markup}
      <g stroke="#9d9884" stroke-width="1.2" stroke-linecap="round" opacity="0.5">${outRays}</g>
      <line x1="28" y1="184" x2="372" y2="184" stroke="#2f2e27" stroke-width="1" opacity="0.16"/>
    </svg>`;
}

/** 비 — 구름방울이 강수 입자로 자란 뒤 */
function rainPlate() {
  const c = buildCloud({ x: 34, y: 4, scale: 0.9, seed: 3307 });

  /* 위는 작고 촘촘하게, 아래로 갈수록 굵고 성글게 — 성장의 그림 */
  let drops = '';
  for (let i = 0; i < 26; i++) {
    const x = 62 + ((i * 97) % 280);
    const t = ((i * 53) % 100) / 100;
    const y = 122 + t * 58;
    const len = 5 + t * 13;
    const w = 1 + t * 1.5;
    drops += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}"
                    x2="${(x - len * 0.16).toFixed(1)}" y2="${(y + len).toFixed(1)}"
                    stroke-width="${w.toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      ${c.markup}
      <g stroke="#7f95a0" stroke-linecap="round" opacity="0.62">${drops}</g>
      <line x1="28" y1="188" x2="372" y2="188" stroke="#2f2e27" stroke-width="1" opacity="0.2"/>
    </svg>`;
}

function unknownPlate() {
  return `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="20" width="344" height="160" fill="none"
            stroke="#2f2e27" stroke-width="1" stroke-dasharray="4 7" opacity="0.28"/>
    </svg>`;
}

export function plate(kind) {
  if (kind === 'cloud') return cloudPlate();
  if (kind === 'rain')  return rainPlate();
  return unknownPlate();
}
