/* 시트(문제 / 도감) 열고 닫기. 항상 조용하게. */
import { nextFrame, wait } from './anim.js';

export async function openSheet(el) {
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  el.scrollTop = 0;
  /* 무대는 스크롤되는 물건이 아니다. 어쩌다 밀렸으면 되돌린다. */
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
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

/** 시트 안에서만, 딱 보일 만큼만 내린다.
    scrollIntoView 는 바깥 요소까지 함께 밀어 무대를 어긋나게 할 수 있다. */
export function revealIn(node) {
  const sheet = node.closest('.sheet');
  if (!sheet) return;
  const r = node.getBoundingClientRect();
  const b = sheet.getBoundingClientRect();
  const pad = 16;
  let d = 0;
  if (r.bottom > b.bottom - pad) d = r.bottom - b.bottom + pad;
  else if (r.top < b.top + pad)  d = r.top - b.top - pad;
  if (d) sheet.scrollTo({ top: sheet.scrollTop + d, behavior: 'smooth' });
}

/** 문제를 푸는 동안에는 세계 위의 것들이 조용히 물러난다 */
export function chrome(on) {
  const nav = document.getElementById('nav');
  const nodes = document.getElementById('nodes');
  if (nav.getAttribute('aria-hidden') !== 'true') nav.classList.toggle('is-on', on);
  nodes.style.transition = 'opacity calc(.8s * var(--rate)) var(--ease-quiet)';
  nodes.style.opacity = on ? '1' : '0';
}
