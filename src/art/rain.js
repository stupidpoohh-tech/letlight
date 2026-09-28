/* 비.
   "비 기능이 열렸다"가 아니라
   "구름 안에서 어떤 과정이 끝나고 마침내 비가 시작됐다"에 가깝도록,
   한 방울에서 시작해 천천히 밀도가 올라간다. */

import { makeRng, between } from '../core/rng.js';

export function buildRainLayer(drift) {
  const layer = document.createElement('div');
  layer.className = 'rain';
  drift.appendChild(layer);
  return layer;
}

/**
 * 물방울을 n개 더한다.
 * @param {boolean}  o.once    한 번만 떨어지고 사라진다 (첫 방울들)
 * @param {number[]} o.delays  각 방울의 시작 지연 (초). 없으면 무작위
 */
export function addDrops(layer, n, { rng, once = false, delays = null,
                                     opacity = 0.5 } = {}) {
  const r = rng || makeRng(9173 + layer.childElementCount);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = once ? 'raindrop is-once' : 'raindrop';
    const dur = between(r, 1.2, 1.75);
    /* 계속 내리는 비는 이미 떨어지고 있던 중이다. 시작 지점을 뒤로 물리면
       처음부터 하늘 전체에 방울이 흩어져 있고, 멈춰 세워도 그 모습이 남는다. */
    const delay = delays ? delays[i] : -between(r, 0, dur);

    el.style.left = `${between(r, 4, 96).toFixed(1)}%`;
    el.style.height = `${between(r, 13, 24).toFixed(1)}px`;
    el.style.setProperty('--o', (opacity * between(r, 0.65, 1.3)).toFixed(2));
    el.style.animationDuration = `${dur.toFixed(2)}s`;
    el.style.animationDelay = `${delay.toFixed(2)}s`;
    layer.appendChild(el);

    if (once) setTimeout(() => el.remove(), (delay + dur) * 1000 + 200);
  }
}
