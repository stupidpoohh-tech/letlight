/* 씨앗에서 첫 잎까지.
   그림 한 장을 갈아 끼우는 것이 아니라, 단계를 겹쳐 두고 천천히 넘긴다.

   그림이 아직 없으면 그 단계는 보이지 않는다. 흐름은 그대로 흐른다. */

import { tween, ease } from '../core/anim.js';
import { GROWTH_STAGES } from './assets.js';

/* 같은 자리에서 자란다 */
const SCALE = { sprout: 0.58, youngTree: 1 };

/**
 * @param {number} o.left  화면 가로 위치 (%)
 * @param {number} o.top   땅에 닿는 지점의 세로 위치 (%)
 * @param {number} o.width 다 자랐을 때의 폭 (화면 폭 대비 %)
 */
export function buildGrowth({ left = 40, top = 82, width = 17 } = {}) {
  const anchor = document.createElement('div');
  anchor.className = 'growth-anchor';
  anchor.style.left = `${left}%`;
  anchor.style.top = `${top}%`;
  anchor.style.width = `${width}%`;

  const stages = new Map();
  for (const [key, src] of Object.entries(GROWTH_STAGES)) {
    const img = document.createElement('img');
    img.className = 'growth-stage';
    img.alt = '';
    img.decoding = 'async';
    img.dataset.stage = key;
    img.style.transform = `translateX(-50%) scale(${SCALE[key] ?? 1})`;
    /* 아직 올라오지 않은 그림은 조용히 빠진다.
       hidden 만으로는 .growth-stage 의 display 가 이겨서 깨진 이미지가 남는다. */
    img.addEventListener('error', () => {
      img.dataset.missing = '1';
      img.hidden = true;
      img.style.display = 'none';
    });
    img.src = src;
    anchor.appendChild(img);
    stages.set(key, img);
  }

  return { anchor, stages, current: null };
}

/** 앞 단계는 사라지고 다음 단계가 떠오른다 */
export function setStage(growth, key, { duration = 1400 } = {}) {
  const next = growth.stages.get(key);
  const prev = growth.current;
  if (!next || next === prev) return Promise.resolve();
  growth.current = next;

  return tween({
    duration, easing: ease.inOut,
    onUpdate: (t) => {
      next.style.opacity = t.toFixed(3);
      if (prev) prev.style.opacity = (1 - t).toFixed(3);
    },
    onDone: () => { if (prev) prev.style.opacity = '0'; },
  });
}
