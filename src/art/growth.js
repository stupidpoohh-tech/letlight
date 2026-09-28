/* 씨앗에서 첫 잎까지.
   그림 한 장을 갈아 끼우는 것이 아니라, 단계를 겹쳐 두고 천천히 넘긴다.

   그림이 아직 없으면 그 단계는 보이지 않는다. 흐름은 그대로 흐른다. */

import { tween, ease } from '../core/anim.js';
import { GROWTH_STAGES } from './assets.js';

/* 같은 자리에서 자란다 */
const SCALE = { sprout: 0.58, youngTree: 1, matureTree: 0.949, bloomTree: 0.949 };

function setScale(img, sx, sy) {
  img.dataset.sx = sx.toFixed(4);
  img.dataset.sy = sy.toFixed(4);
  img.style.transform = `translateX(-50%) scale(${img.dataset.sx}, ${img.dataset.sy})`;
}

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
  const growth = { anchor, stages, current: null, back: null };

  for (const [key, src] of Object.entries(GROWTH_STAGES)) {
    const img = document.createElement('img');
    img.className = 'growth-stage';
    img.alt = '';
    img.decoding = 'async';
    img.dataset.stage = key;
    setScale(img, SCALE[key] ?? 1, SCALE[key] ?? 1);
    /* 아직 올라오지 않은 그림은 조용히 빠진다.
       hidden 만으로는 .growth-stage 의 display 가 이겨서 깨진 이미지가 남는다. */
    img.addEventListener('error', () => {
      img.dataset.missing = '1';
      img.hidden = true;
      img.style.display = 'none';
      /* 없는 그림이 앞 단계를 지우고 그 자리에 앉지 않도록,
         보이던 단계를 도로 켠다. */
      if (growth.current === img) {
        growth.current = growth.back;
        if (growth.back) growth.back.style.opacity = '1';
      }
    });
    img.src = src;
    anchor.appendChild(img);
    stages.set(key, img);
  }

  return growth;
}

/** 앞 단계는 사라지고 다음 단계가 떠오른다 */
export function setStage(growth, key, { duration = 1400 } = {}) {
  const next = growth.stages.get(key);
  const prev = growth.current;
  if (!next || next === prev) return Promise.resolve();
  /* 다음 그림이 아직 올라오지 않았으면 앞 단계를 지우지 않는다 */
  if (next.dataset.missing) return Promise.resolve();
  growth.back = prev;
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

/** 앞 단계가 자라 있던 만큼을 다음 단계가 그대로 물려받는다.
    같은 크기의 같은 나무인데 몸만 달라지는 단계에 쓴다. */
export function carryScale(growth, key) {
  const next = growth.stages.get(key);
  const prev = growth.current;
  if (!next || !prev) return;
  setScale(next, parseFloat(prev.dataset.sx || 1), parseFloat(prev.dataset.sy || 1));
}

/** 생장점이 한 번 더 일한다.
    위로 자라고(y), 가지가 옆으로 갈라지며(x) 몸이 조금씩 달라진다.
    나무를 절차적으로 그리는 것이 아니라, 같은 일이 반복된다는 감각만 남긴다. */
export function growPulse(growth, { x = 1, y = 1, duration = 1100 } = {}) {
  const img = growth.current;
  if (!img || img.dataset.missing) return Promise.resolve();
  const sx0 = parseFloat(img.dataset.sx || 1);
  const sy0 = parseFloat(img.dataset.sy || 1);
  return tween({
    duration, easing: ease.inOut,
    onUpdate: (t) => setScale(img, sx0 + sx0 * (x - 1) * t, sy0 + sy0 * (y - 1) * t),
  });
}

/** 연출을 다시 틀지 않고, 그 단계가 끝난 모습으로 바로 놓는다.
    지난번에 보던 세계를 돌려놓을 때 쓴다. */
export function settleStage(growth, key, { x = 1, y = 1 } = {}) {
  const img = growth.stages.get(key);
  if (!img || img.dataset.missing) return;
  const base = SCALE[key] ?? 1;
  setScale(img, base * x, base * y);
  growth.stages.forEach((i) => { i.style.opacity = i === img ? '1' : '0'; });
  growth.back = growth.current;
  growth.current = img;
}
