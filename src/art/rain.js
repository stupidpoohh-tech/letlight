/* 비.
   "비 기능이 열렸다"가 아니라
   "구름 안에서 어떤 과정이 끝나고 마침내 비가 시작됐다"에 가깝도록,
   한 방울에서 시작해 천천히 밀도가 올라간다. */

import { makeRng, between } from '../core/rng.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* 구름 로컬 좌표 기준. 구름 아랫면은 y ≈ 132 */
const TOP = { y0: 116, y1: 146, x0: 26, x1: 312 };

export function buildRainLayer() {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'rain');
  return g;
}

/**
 * 물방울을 n개 더한다.
 * @param {SVGGElement} layer
 * @param {object} o
 * @param {boolean} o.once   한 번만 떨어지고 사라진다 (첫 방울들)
 * @param {number}  o.fall   떨어지는 거리 (로컬 단위)
 * @param {number[]} o.delays  각 방울의 시작 지연 (초). 없으면 무작위
 */
export function addDrops(layer, n, { rng, once = false, fall = 470, delays = null,
                                     opacity = 0.34 } = {}) {
  const r = rng || makeRng(1234 + layer.childElementCount);
  for (let i = 0; i < n; i++) {
    const x = between(r, TOP.x0, TOP.x1);
    const y = between(r, TOP.y0, TOP.y1);
    const len = between(r, 9, 17);
    const dur = between(r, 1.15, 1.7);
    const delay = delays ? delays[i] : between(r, 0, 1.6);

    const el = document.createElementNS(SVG_NS, 'line');
    el.setAttribute('class', once ? 'raindrop is-once' : 'raindrop');
    el.setAttribute('x1', x.toFixed(1));
    el.setAttribute('y1', y.toFixed(1));
    el.setAttribute('x2', (x - len * 0.13).toFixed(1));
    el.setAttribute('y2', (y + len).toFixed(1));
    el.setAttribute('stroke', '#7f95a0');
    el.setAttribute('stroke-width', between(r, 1.1, 1.7).toFixed(2));
    el.setAttribute('stroke-linecap', 'round');
    el.style.setProperty('--fall', `${fall.toFixed(0)}px`);
    el.style.setProperty('--o', (opacity * between(r, 0.7, 1.25)).toFixed(2));
    el.style.animationDuration = `${dur.toFixed(2)}s`;
    el.style.animationDelay = `${delay.toFixed(2)}s`;
    layer.appendChild(el);

    if (once) setTimeout(() => el.remove(), (delay + dur) * 1000 + 200);
  }
}

/** 땅이 젖는다 */
export function buildWetGround() {
  return `<rect class="wet" x="-120" y="1140" width="1240" height="960"
            fill="url(#wetGrad)" opacity="0" style="mix-blend-mode:multiply"/>`;
}
