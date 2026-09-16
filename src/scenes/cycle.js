/* 순환이 닫히는 순간.

   축하가 아니라 알림에 가깝다. 세계 위에 종이 한 장이 조용히 올라오고,
   무엇이 닫혔는지 한 줄로 말한 뒤 물러난다. */

import { nextFrame, wait } from '../core/anim.js';
import { br } from '../core/sheet.js';
import { CYCLES } from '../data/cycles.js';
import { isReady } from '../art/assets.js';
import { ring } from '../art/marks.js';

const sheet = () => document.getElementById('cycle');

export const hasBadge = (c) => isReady(c.badge);

/** 배지 그림이 아직 없으면 같은 자리에 고리 도식을 둔다.
    작은 자리에서는 이름을 빼고 고리만 남긴다. */
export function badgeArt(c, { small = false } = {}) {
  if (hasBadge(c)) {
    return `<img class="cyc-badge-img" src="${c.badge}" alt="" decoding="async">`;
  }
  return `<div class="cyc-badge-ring">${ring(c.ring, { labels: !small })}</div>`;
}

/** 확인을 누를 때까지 돌아오지 않는다 */
export function openCycle(id) {
  const c = CYCLES[id];
  const el = sheet();
  if (!c) return Promise.resolve();

  el.innerHTML = `
    <div class="cyc-card" role="dialog" aria-modal="true" aria-label="${c.title}">
      <p class="cyc-kicker">새로운 순환을 발견했습니다</p>
      <h2 class="cyc-title">${c.title}</h2>
      <div class="cyc-badge">${badgeArt(c)}</div>
      <p class="cyc-lead">${br(c.lead)}</p>
      <p class="cyc-line">${[...c.ring, c.ring[0]].join(' → ')}</p>
      <button class="quiet-action is-on cyc-ok" type="button">확인</button>
    </div>`;

  return new Promise(async (resolve) => {
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    await nextFrame();
    el.classList.add('is-visible');
    await wait(900);

    const btn = el.querySelector('.cyc-ok');
    btn.focus({ preventScroll: true });

    const close = async () => {
      el.removeEventListener('keydown', onKey);
      el.classList.remove('is-visible');
      await wait(800);
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '';
      resolve();
    };
    function onKey(e) { if (e.key === 'Escape') close(); }

    btn.addEventListener('click', close, { once: true });
    el.addEventListener('keydown', onKey);
  });
}
