/* 세계 위에 조용히 얹히는 그림 한 장.
   그림이 아직 없으면 아무것도 보이지 않고, 흐름은 그대로 흐른다. */

import { tween, ease } from '../core/anim.js';

/**
 * @param {string} src
 * @param {number} o.left  화면 가로 위치 (%)
 * @param {number} o.top   아래가 닿는 세로 위치 (%)
 * @param {number} o.width 화면 폭 대비 (%)
 */
export function buildLayer(src, { left = 50, top = 82, width = 20 } = {}) {
  const anchor = document.createElement('div');
  anchor.className = 'layer-anchor';
  anchor.style.left = `${left}%`;
  anchor.style.top = `${top}%`;
  anchor.style.width = `${width}%`;

  const img = document.createElement('img');
  img.className = 'layer-img';
  img.alt = '';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    img.dataset.missing = '1';
    img.hidden = true;
    img.style.display = 'none';
  });
  img.src = src;
  anchor.appendChild(img);

  return { anchor, img };
}

/** 없던 것이 원래 있던 것처럼 떠오른다 */
export function fadeIn(layer, { to = 1, duration = 2400 } = {}) {
  return tween({
    from: 0, to, duration, easing: ease.inOut,
    onUpdate: (v) => { layer.img.style.opacity = v.toFixed(3); },
  });
}
