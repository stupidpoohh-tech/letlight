/* 도감 도판 — 그린 구름에 설명을 얹는다. */

import { GROWTH_STAGES, isReady } from './assets.js';

const CLOUD = { src: 'assets/cloud-3.webp', w: 760, h: 540 };
const RAIN  = { src: 'assets/cloud-4.webp', w: 760, h: 571 };

/** 구름 — 비스듬히 들어온 햇빛이 여러 방향으로 흩어진다 */
function cloudPlate() {
  const w = 300, h = Math.round(w * CLOUD.h / CLOUD.w);   // 231
  let inRays = '';
  for (let i = 0; i < 4; i++) {
    const y = 14 + i * 14;
    inRays += `<line x1="6" y1="${y}" x2="${96 + i * 8}" y2="${y + 52}"/>`;
  }
  let outRays = '';
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.07 + (i / 10) * 0.86);
    outRays += `<line x1="${(200 + Math.cos(a) * 140).toFixed(1)}" y1="${(150 + Math.sin(a) * 82).toFixed(1)}"
                      x2="${(200 + Math.cos(a) * 182).toFixed(1)}" y2="${(150 + Math.sin(a) * 116).toFixed(1)}"/>`;
  }
  return `<svg viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#c9a85e" stroke-width="1.6" stroke-linecap="round" opacity="0.62">${inRays}</g>
      <image href="${CLOUD.src}" x="${(400 - w) / 2}" y="34" width="${w}" height="${h}"/>
      <g stroke="#9d9884" stroke-width="1.3" stroke-linecap="round" opacity="0.5">${outRays}</g>
      <line x1="28" y1="274" x2="372" y2="274" stroke="#2f2e27" stroke-width="1" opacity="0.16"/>
    </svg>`;
}

/** 비 — 구름방울이 강수 입자로 자란 뒤.
    위는 작고 촘촘하게, 아래로 갈수록 굵고 성글게. */
function rainPlate() {
  const w = 306, h = Math.round(w * RAIN.h / RAIN.w);     // 230
  let drops = '';
  for (let i = 0; i < 30; i++) {
    /* 황금비 간격으로 흩는다. 정수 배수로 두면 몇 줄로 뭉친다. */
    const x = 68 + ((i * 165.6) % 268);
    const t = ((i * 0.618) % 1);
    const y = 232 + t * 56;
    const len = 4 + t * 13;
    drops += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}"
                    x2="${(x - len * 0.16).toFixed(1)}" y2="${(y + len).toFixed(1)}"
                    stroke-width="${(0.9 + t * 1.5).toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
      <image href="${RAIN.src}" x="${(400 - w) / 2}" y="4" width="${w}" height="${h}"/>
      <g stroke="#7f95a0" stroke-linecap="round" opacity="0.66">${drops}</g>
      <line x1="28" y1="306" x2="372" y2="306" stroke="#2f2e27" stroke-width="1" opacity="0.18"/>
    </svg>`;
}

/* 씨앗·식물 도판. 그림의 실제 비율을 모르므로 틀에 맞춰 넣는다. */
function growthPlate(src) {
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <image href="${src}" x="70" y="12" width="260" height="262"
             preserveAspectRatio="xMidYMax meet"/>
      <line x1="28" y1="286" x2="372" y2="286" stroke="#2f2e27" stroke-width="1" opacity="0.18"/>
    </svg>`;
}

function unknownPlate() {
  return `<svg viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="20" width="344" height="250" fill="none"
            stroke="#2f2e27" stroke-width="1" stroke-dasharray="4 7" opacity="0.28"/>
    </svg>`;
}

export function plate(kind) {
  if (kind === 'cloud') return cloudPlate();
  if (kind === 'rain')  return rainPlate();

  /* 그림이 아직 올라오지 않았으면 빈 틀을 둔다 */
  /* 그림이 아직이면 빈 틀 대신 아무것도 두지 않는다 */
  if (kind === 'sprout') {
    return isReady(GROWTH_STAGES.sprout) ? growthPlate(GROWTH_STAGES.sprout) : '';
  }
  if (kind === 'plant') {
    return isReady(GROWTH_STAGES.youngTree) ? growthPlate(GROWTH_STAGES.youngTree) : '';
  }
  return '';
}


/* 목록에 쓰는 작은 그림. 주석 없이 그림만. */
const THUMB_SRC = {
  cloud:  CLOUD.src,
  rain:   RAIN.src,
  sprout: GROWTH_STAGES.sprout,
  plant:  GROWTH_STAGES.youngTree,
};

export function thumb(kind) {
  const src = THUMB_SRC[kind];
  return src ? `<img class="ex-thumb-img" src="${src}" alt="" decoding="async">` : '';
}
