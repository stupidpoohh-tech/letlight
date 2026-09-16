/* 시트(문제 / 도감) 열고 닫기. 항상 조용하게. */
import { nextFrame, wait } from './anim.js';

export async function openSheet(el) {
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  el.scrollTop = 0;
  await nextFrame();
  el.classList.add('is-visible');
  await wait(900);
}

export async function closeSheet(el) {
  el.classList.remove('is-visible');
  await wait(900);
  el.classList.remove('is-open');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '';
}

export const br = (s) => String(s).split('\n').join('<br>');

/** 문제를 푸는 동안에는 세계 위의 것들이 조용히 물러난다 */
export function chrome(on) {
  const nav = document.getElementById('nav');
  const nodes = document.getElementById('nodes');
  if (nav.getAttribute('aria-hidden') !== 'true') nav.classList.toggle('is-on', on);
  nodes.style.transition = 'opacity calc(.8s * var(--rate)) var(--ease-quiet)';
  nodes.style.opacity = on ? '1' : '0';
}
