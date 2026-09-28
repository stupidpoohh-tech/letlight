/* 시트(문제 / 지식 / 도감) 열고 닫기. 항상 조용하게.

   열려 있는 동안 이것은 진짜 모달이다. 뒤의 세계와 하단 메뉴로는
   키보드 초점이 넘어가지 않고, 초점은 시트 안에서만 돈다. */

import { nextFrame, wait } from './anim.js';

/* 초점이 돌 수 있는 것들 */
const TABBABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

const seen = (el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length;
const stops = (el) => [...el.querySelectorAll(TABBABLE)].filter(seen);

/* 지금 열려 있는 시트. 하나뿐이다. */
let open = null;
let returnTo = null;

/** 뒤쪽은 초점에서 아예 빠진다. inert 를 모르는 기기에서는 tabindex 로 막는다. */
function block(ids, off) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (off) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    el.querySelectorAll('button, [tabindex]').forEach((n) => {
      if (off) {
        if (!n.hasAttribute('data-tab')) n.setAttribute('data-tab', n.getAttribute('tabindex') ?? '');
        n.setAttribute('tabindex', '-1');
      } else if (n.hasAttribute('data-tab')) {
        const v = n.getAttribute('data-tab');
        if (v === '') n.removeAttribute('tabindex'); else n.setAttribute('tabindex', v);
        n.removeAttribute('data-tab');
      }
    });
  });
}

/** 도감은 모달이 아니라 화면 하나다. 아래 메뉴는 그대로 쓸 수 있어야 한다.
    뒤에 남은 세계의 질문만 초점에서 뺀다. */
export const blockWorld = (on) => block(['nodes'], on);

function onKey(e) {
  if (!open || e.key !== 'Tab') return;
  const list = stops(open);
  if (!list.length) { e.preventDefault(); return; }
  const first = list[0];
  const last = list[list.length - 1];
  const here = document.activeElement;
  if (e.shiftKey && (here === first || !open.contains(here))) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && (here === last || !open.contains(here))) {
    e.preventDefault(); first.focus();
  }
}

/** 시트를 열면 초점을 그 안의 시작점으로 옮긴다 */
export function focusStart(el) {
  const target = el.querySelector('[data-focus]')
    || el.querySelector('h1, h2, .ex-title, .quiz-q, .article-title')
    || el;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

export async function openSheet(el, { modal = true, focus = true } = {}) {
  if (modal) {
    returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    open = el;
    block(['nodes', 'nav'], true);
    addEventListener('keydown', onKey, true);
  }
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  el.scrollTop = 0;
  /* 무대는 스크롤되는 물건이 아니다. 어쩌다 밀렸으면 되돌린다. */
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  await nextFrame();
  el.classList.add('is-visible');
  if (focus) focusStart(el);
  await wait(900);
}

/** @param {HTMLElement|null} back  닫은 뒤 초점을 둘 자리. 없으면 열기 전의 자리. */
export async function closeSheet(el, { back } = {}) {
  el.classList.remove('is-visible');
  await wait(900);
  el.classList.remove('is-open');
  el.setAttribute('aria-hidden', 'true');
  el.removeAttribute('role');
  el.removeAttribute('aria-modal');
  el.innerHTML = '';
  if (open === el) {
    open = null;
    removeEventListener('keydown', onKey, true);
    block(['nodes', 'nav'], false);
    const to = back === undefined ? returnTo : back;
    returnTo = null;
    if (to && to.isConnected) to.focus({ preventScroll: true });
  }
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
  const snd = document.getElementById('sound-toggle');
  if (nav.getAttribute('aria-hidden') !== 'true') nav.classList.toggle('is-on', on);
  if (snd && snd.getAttribute('aria-hidden') !== 'true') snd.classList.toggle('is-on', on);
  nodes.style.transition = 'opacity calc(.8s * var(--rate)) var(--ease-quiet)';
  nodes.style.opacity = on ? '1' : '0';
}

/** 시트 맨 위의 작은 '세계로'. 언제든 나갈 수 있다. */
export const leaveBar = (label = '세계로') => `
  <div class="sheet-top">
    <button class="sheet-leave" type="button">
      <svg viewBox="0 0 20 14" aria-hidden="true"><path d="M19 7H1M7 1 1 7l6 6"
        fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${label}</span>
    </button>
  </div>`;
