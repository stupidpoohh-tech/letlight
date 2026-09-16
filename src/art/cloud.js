/* 구름.
   그려 둔 그림 한 장을, 안개처럼 흩어진 상태에서 모아 붙인다.
   "해금됐다"가 아니라 "원래 거기 있었는데 이제 보인다"에 가깝도록. */

import { tween, ease, slice } from '../core/anim.js';

/** 형성 전에 흩어져 있는 조각들의 시작 위치 (%, 구름 크기 기준) */
const PUFFS = [
  { dx: -34, dy: -12, s: 0.52 },
  { dx:  30, dy:  14, s: 0.46 },
  { dx:  -6, dy:  20, s: 0.40 },
];

/**
 * @param {object} o
 * @param {number} o.left  화면 가로 위치 (%)
 * @param {number} o.top   화면 세로 위치 (%)
 * @param {number} o.width 화면 너비 대비 구름 폭 (%)
 */
export function buildCloud({ left = 50, top = 27, width = 56,
                             src = 'assets/cloud-1.webp' } = {}) {
  const anchor = document.createElement('div');
  anchor.className = 'cloud-anchor';
  anchor.style.left = `${left}%`;
  anchor.style.top = `${top}%`;
  anchor.style.width = `${width}%`;

  const drift = document.createElement('div');
  drift.className = 'cloud-drift';
  anchor.appendChild(drift);

  const img = (cls) => {
    const el = document.createElement('img');
    el.className = cls;
    el.src = src;
    el.alt = '';
    el.decoding = 'async';
    drift.appendChild(el);
    return el;
  };

  const puffs = PUFFS.map((p) => ({ ...p, el: img('cloud-puff') }));
  const body  = img('cloud-body');
  const dense = img('cloud-dense');   /* 비가 오기 직전에 짙어지는 겹 */
  const stir  = img('cloud-stir');    /* 안에서 뒤척이는 겹 */

  return { anchor, drift, body, dense, stir, puffs };
}

/** 하늘 한 조각이 옅어지고, 안개 같은 형태가 모여 하나의 구름이 된다. */
export function formCloud(cloud, { duration = 5200 } = {}) {
  const { anchor, body, puffs } = cloud;
  anchor.style.opacity = '0';

  const apply = (t) => {
    anchor.style.opacity = slice(t, 0.02, 0.3).toFixed(3);

    /* 흩어진 조각들이 가운데로 모여들며 흐려진다 */
    puffs.forEach((p, i) => {
      const a = 0.04 + i * 0.07;
      const k = ease.inOut(slice(t, a, a + 0.68));
      const fade = Math.min(slice(t, a, a + 0.2), 1 - slice(t, 0.55, 0.92));
      p.el.style.opacity = (fade * 0.5).toFixed(3);
      p.el.style.filter = `blur(${(16 - 11 * k).toFixed(1)}px)`;
      p.el.style.transform =
        `translate(${(p.dx * (1 - k)).toFixed(2)}%, ${(p.dy * (1 - k)).toFixed(2)}%)`
        + ` scale(${(p.s + (1 - p.s) * k).toFixed(3)})`;
    });

    /* 밀도가 오르며 형태가 잡힌다 */
    const g = ease.outCubic(slice(t, 0.34, 1));
    body.style.opacity = g.toFixed(3);
    body.style.filter = `blur(${(17 * (1 - g)).toFixed(1)}px)`;
    body.style.transform = `scale(${(1.1 - 0.1 * g).toFixed(3)})`;
  };

  apply(0);
  return tween({ duration, easing: ease.linear, onUpdate: apply,
    onDone: () => {
      puffs.forEach((p) => p.el.remove());
      body.style.filter = '';
      body.style.transform = '';
    } });
}

/** 다 만들어진 구름은 아주 천천히 흐른다. */
export function driftCloud(cloud, { speed = 0.55, bob = 0.5 } = {}) {
  let t = 0;
  const id = setInterval(() => {
    t += 0.25;
    cloud.drift.style.transform =
      `translate(${(t * speed).toFixed(2)}px, ${(Math.sin(t * 0.05) * bob).toFixed(2)}px)`;
  }, 250);
  return () => clearInterval(id);
}

/** 밀도가 아주 약간 높아진다. 비가 오기 직전. */
export function thickenCloud(cloud, { to = 0.5, duration = 2400 } = {}) {
  return tween({
    from: 0, to, duration, easing: ease.inOut,
    onUpdate: (v) => { cloud.dense.style.opacity = v.toFixed(3); },
  });
}

/** 구름 안에서 무언가 움직이고 있다는 정도의 암시 */
export function stirCloud(cloud, { duration = 8000 } = {}) {
  return tween({
    duration, easing: ease.linear,
    onUpdate: (t) => {
      const fade = Math.sin(Math.PI * Math.min(1, t));   // 조용히 시작해 조용히 멎는다
      const a = Math.sin(t * Math.PI * 2 * 1.7);
      const b = Math.sin(t * Math.PI * 2 * 2.6 + 1.1);
      cloud.stir.style.opacity = (0.42 * fade).toFixed(3);
      cloud.stir.style.transform =
        `translate(${(a * 0.9 * fade).toFixed(2)}%, ${(b * 0.5 * fade).toFixed(2)}%)`
        + ` scale(${(1 + 0.012 * a * fade).toFixed(4)})`;
    },
    onDone: () => { cloud.stir.style.opacity = '0'; cloud.stir.style.transform = ''; },
  });
}
