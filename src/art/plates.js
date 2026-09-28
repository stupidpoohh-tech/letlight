/* 도감 도판 — 그린 구름에 설명을 얹는다. */

import { GROWTH_STAGES, FLYERS, isReady } from './assets.js';

const CLOUD = { src: 'assets/cloud-3.webp', w: 760, h: 540 };
const RAIN  = { src: 'assets/cloud-4.webp', w: 760, h: 571 };
const RIVER = { src: 'assets/river.webp' };

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

/** 강 — 물이 오르는 자리. 새 그림을 그리지 않고 있는 강에 주석만 얹는다. */
function riverPlate() {
  let up = '';
  for (let i = 0; i < 7; i++) {
    const x = 96 + i * 34 + (i % 2) * 9;
    const h = 30 + ((i * 13) % 26);
    up += `<path d="M${x} ${196 - i % 3 * 6} C ${x - 5} ${196 - h * 0.5}, ${x + 5} ${196 - h * 0.75}, ${x} ${196 - h}"
                 stroke-width="1.1"/>`;
  }
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#9aa4a8" stroke-linecap="round" stroke-dasharray="3 5" opacity="0.6">${up}</g>
      <image href="${RIVER.src}" x="64" y="76" width="272" height="212"
             preserveAspectRatio="xMidYMax meet"/>
      <line x1="28" y1="290" x2="372" y2="290" stroke="#2f2e27" stroke-width="1" opacity="0.18"/>
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


/** 벌이 보는 꽃 — 세계에는 그리지 않는 무늬를 여기에서만 본다.
    왼쪽은 사람 눈에 보이는 꽃, 오른쪽은 중심으로 모이는 단서가 드러난 꽃. */
function beePlate() {
  const petals = (cx, cy, r, stroke) => {
    let out = '';
    for (let i = 0; i < 6; i++) {
      const deg = i * 60 - 90;
      const a = (deg * Math.PI) / 180;
      const px = (cx + Math.cos(a) * r * 0.58).toFixed(1);
      const py = (cy + Math.sin(a) * r * 0.58).toFixed(1);
      out += `<ellipse cx="${px}" cy="${py}"
                rx="${(r * 0.46).toFixed(1)}" ry="${(r * 0.27).toFixed(1)}"
                transform="rotate(${deg} ${px} ${py})"
                fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
    }
    return out;
  };

  /* 오른쪽 꽃에만. 꽃잎 안쪽이 중심으로 모인다. */
  const guides = (cx, cy, r) => {
    let out = '';
    for (let i = 0; i < 6; i++) {
      const a = ((i * 60 - 90) * Math.PI) / 180;
      out += `<line x1="${(cx + Math.cos(a) * r * 0.86).toFixed(1)}"
                    y1="${(cy + Math.sin(a) * r * 0.86).toFixed(1)}"
                    x2="${(cx + Math.cos(a) * r * 0.26).toFixed(1)}"
                    y2="${(cy + Math.sin(a) * r * 0.26).toFixed(1)}"/>`;
    }
    return out;
  };

  const bee = isReady(FLYERS.bee)
    ? `<image href="${FLYERS.bee}" x="296" y="196" width="54" height="55"/>` : '';

  return `<svg viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg">
      <g>${petals(116, 132, 76, '#c6bda6')}</g>
      <circle cx="116" cy="132" r="15" fill="none" stroke="#c6bda6" stroke-width="1.2"/>

      <g>${petals(276, 132, 76, '#c6bda6')}</g>
      <g stroke="#8d7fb4" stroke-width="1.4" stroke-linecap="round"
         stroke-dasharray="3 4" opacity="0.72">${guides(276, 132, 76)}</g>
      <circle cx="276" cy="132" r="15" fill="#8d7fb4" opacity="0.22"/>
      <circle cx="276" cy="132" r="15" fill="none" stroke="#8d7fb4"
              stroke-width="1.3" opacity="0.72"/>

      ${bee}
      <line x1="28" y1="268" x2="372" y2="268" stroke="#2f2e27" stroke-width="1" opacity="0.18"/>
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
  if (kind === 'river') {
    return isReady(RIVER.src) ? riverPlate() : '';
  }
  if (kind === 'tree') {
    return isReady(GROWTH_STAGES.matureTree) ? growthPlate(GROWTH_STAGES.matureTree) : '';
  }
  if (kind === 'bee') return beePlate();
  /* 꽃 그림이 아직이면 큰 나무로 대신한다 */
  if (kind === 'bloom') {
    if (isReady(GROWTH_STAGES.bloomTree)) return growthPlate(GROWTH_STAGES.bloomTree);
    return isReady(GROWTH_STAGES.matureTree) ? growthPlate(GROWTH_STAGES.matureTree) : '';
  }
  return '';
}


/* 목록에 쓰는 작은 그림. 주석 없이 그림만. */
const THUMB_SRC = {
  cloud:  CLOUD.src,
  rain:   RAIN.src,
  sprout: GROWTH_STAGES.sprout,
  plant:  GROWTH_STAGES.youngTree,
  tree:   GROWTH_STAGES.matureTree,
  bloom:  GROWTH_STAGES.bloomTree,
  bee:    FLYERS.bee,
  river:  RIVER.src,
};

export function thumb(kind) {
  const src = THUMB_SRC[kind];
  if (!src) return '';
  /* 아직 올라오지 않은 그림은 조용히 빠진다 */
  return `<img class="ex-thumb-img" src="${src}" alt="" decoding="async"
    onerror="this.style.display='none'">`;
}
