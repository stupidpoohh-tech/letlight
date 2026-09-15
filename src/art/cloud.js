/* 구름.
   흩어진 원들이 하나의 실루엣으로 녹아 붙는다.
   "해금됐다"가 아니라 "원래 거기 있었는데 이제 보인다"에 가깝도록. */

import { makeRng, between } from '../core/rng.js';
import { tween, ease, slice } from '../core/anim.js';

/* 로컬 좌표 기준 약 340 x 130 */
const SHAPE = [
  { t: 'c', x:  56, y: 100, r: 33 },
  { t: 'c', x:  94, y:  82, r: 45 },
  { t: 'c', x: 132, y:  63, r: 39 },
  { t: 'c', x: 174, y:  52, r: 51 },
  { t: 'c', x: 216, y:  70, r: 37 },
  { t: 'c', x: 252, y:  86, r: 45 },
  { t: 'c', x: 292, y: 101, r: 29 },
  { t: 'c', x: 148, y: 100, r: 41 },
  { t: 'c', x: 208, y: 103, r: 35 },
  { t: 'e', x: 172, y: 112, r: 134, ry: 21 },
];

let uid = 0;

/**
 * @param {object} o
 * @param {number} o.x,o.y  뷰박스 상의 놓일 자리 (구름 좌상단)
 * @param {number} o.scale
 * @param {boolean} o.scattered  참이면 흩어진 상태로 시작한다
 */
export function buildCloud({ x = 0, y = 0, scale = 1, scattered = false, seed = 4242 } = {}) {
  const id = `cloud-${++uid}`;
  const rng = makeRng(seed);

  const parts = SHAPE.map((b, i) => {
    const angle = between(rng, 0, Math.PI * 2);
    const dist  = between(rng, 70, 190);
    return {
      ...b,
      i,
      sx: b.x + Math.cos(angle) * dist,
      sy: b.y + Math.sin(angle) * dist * 0.45,
      delay: rng(),
    };
  });

  const shape = parts.map((b) => (b.t === 'e'
    ? `<ellipse data-i="${b.i}" cx="${b.x}" cy="${b.y}" rx="${b.r}" ry="${b.ry}"/>`
    : `<circle  data-i="${b.i}" cx="${b.x}" cy="${b.y}" r="${b.r}"/>`)).join('');

  const g = `<g class="cloud" data-cloud="${id}"
                transform="translate(${x} ${y}) scale(${scale})"
                opacity="${scattered ? 0 : 1}">
      <defs>
        <g id="${id}">${shape}</g>
        <linearGradient id="${id}-fill" gradientUnits="userSpaceOnUse" x1="0" y1="18" x2="0" y2="142">
          <stop offset="0%"   stop-color="#fdfaf0"/>
          <stop offset="58%"  stop-color="#f6efdd"/>
          <stop offset="100%" stop-color="#e2dac2"/>
        </linearGradient>
      </defs>
      <use href="#${id}" transform="translate(5 20)" style="fill:#c7bfa4"
           filter="url(#cloud-body)" opacity="0.55"/>
      <use href="#${id}" style="fill:url(#${id}-fill)" filter="url(#cloud-body)"/>
      <use href="#${id}" transform="translate(2 11)" fill="url(#hatch-fine)"
           filter="url(#cloud-body)" opacity="0.13"/>
      <use href="#${id}" class="cloud-dense" transform="translate(3 24)"
           style="fill:#c6c0aa" filter="url(#cloud-body)" opacity="0"/>
      <use href="#${id}" filter="url(#cloud-ink)"/>
    </g>`;

  return { id, markup: g, parts };
}

/** 하늘 한 조각이 아주 희미해졌다가, 흰 형태들이 모여 구름이 된다. */
export function formCloud(groupEl, parts, { duration = 5200 } = {}) {
  const nodes = [...groupEl.querySelectorAll('defs > g > *')];
  const byIndex = new Map(nodes.map((n) => [Number(n.dataset.i), n]));

  const apply = (t) => {
    groupEl.setAttribute('opacity', String(Math.min(1, slice(t, 0.04, 0.5) * 1.15)));
    parts.forEach((b) => {
      const el = byIndex.get(b.i);
      if (!el) return;
      /* 각 덩어리는 조금씩 다른 박자로 모여든다 */
      const a = 0.05 + b.delay * 0.18;
      const k = ease.inOut(slice(t, a, a + 0.72));
      const grow = ease.outCubic(slice(t, a * 0.6, a + 0.8));
      const cx = b.sx + (b.x - b.sx) * k;
      const cy = b.sy + (b.y - b.sy) * k;
      el.setAttribute('cx', cx.toFixed(1));
      el.setAttribute('cy', cy.toFixed(1));
      if (b.t === 'e') {
        el.setAttribute('rx', (b.r * (0.22 + 0.78 * grow)).toFixed(1));
        el.setAttribute('ry', (b.ry * (0.22 + 0.78 * grow)).toFixed(1));
      } else {
        el.setAttribute('r', (b.r * (0.2 + 0.8 * grow)).toFixed(1));
      }
    });
  };

  apply(0);
  return tween({ duration, easing: ease.linear, onUpdate: apply });
}

/** 다 만들어진 구름은 아주 천천히 흐른다.
    필터가 매 프레임 다시 계산되지 않도록 낮은 빈도로만 갱신한다. */
export function driftCloud(groupEl, { x, y, scale, speed = 1.15, bob = 5 }) {
  let t = 0;
  const id = setInterval(() => {
    t += 0.25;
    const dx = t * speed;
    const dy = Math.sin(t * 0.055) * bob;
    groupEl.setAttribute('transform',
      `translate(${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}) scale(${scale})`);
  }, 250);
  return () => clearInterval(id);
}

/** 구름이 생기기 직전, 하늘 한 부분이 먼저 아주 희미해진다 */
export function buildSkyHush({ cx, cy, rx = 300, ry = 170 }) {
  return `<ellipse class="sky-hush" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
            fill="#fbf6e9" opacity="0" style="mix-blend-mode:screen"/>`;
}

/** 구름의 밀도가 아주 약간 높아진다. 비가 오기 직전. */
export function thickenCloud(groupEl, { to = 0.5, duration = 2400 } = {}) {
  const dense = groupEl.querySelector('.cloud-dense');
  if (!dense) return Promise.resolve();
  return tween({
    from: 0, to, duration, easing: ease.inOut,
    onUpdate: (v) => dense.setAttribute('opacity', v.toFixed(3)),
  });
}

/** 구름 안에서 무언가 움직이고 있다는 정도의 암시 */
export function stirCloud(groupEl, parts, { duration = 7000, amp = 2.6 } = {}) {
  const nodes = [...groupEl.querySelectorAll('defs > g > *')];
  const byIndex = new Map(nodes.map((n) => [Number(n.dataset.i), n]));
  return tween({
    duration, easing: ease.linear,
    onUpdate: (t) => {
      const fade = Math.sin(Math.PI * Math.min(1, t)); // 조용히 시작해 조용히 멎는다
      parts.forEach((b, i) => {
        const el = byIndex.get(b.i);
        if (!el || b.t === 'e') return;
        const w = Math.sin(t * Math.PI * 2 * (2.1 + i * 0.37) + i) * amp * fade;
        el.setAttribute('r', (b.r + w).toFixed(2));
        el.setAttribute('cy', (b.y + w * 0.4).toFixed(2));
      });
    },
    onDone: () => {
      parts.forEach((b) => {
        const el = byIndex.get(b.i);
        if (!el || b.t === 'e') return;
        el.setAttribute('r', String(b.r));
        el.setAttribute('cy', String(b.y));
      });
    },
  });
}
