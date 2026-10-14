/* 움직임을 켤지 끌지.

   기본은 기기의 설정(`prefers-reduced-motion`)을 따른다. iOS 에서는
   `동작 줄이기` 뿐 아니라 **저전력 모드**도 이 값을 켠다. 그래서 세계가
   통째로 멈춰 보이는데, 그 까닭이 화면 어디에도 적혀 있지 않았다.

   그래서 사람이 직접 고를 자리를 하나 둔다. 한 번 고르면 그 선택이
   기기 설정보다 앞선다. 고른 적이 없으면 계속 기기를 따른다.

   멈춘다는 것은 연출을 건너뛴다는 뜻이지 건너뛴 채로 끝난다는 뜻이 아니다.
   끝나는 값과 순서는 켜 둔 쪽과 같다. 그 규칙은 anim.js 가 지킨다. */

const KEY = 'boida.motion';

/* 기기가 줄여 달라고 했는가 */
const ASKED = (() => {
  try {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    let on = q.matches;
    const listen = q.addEventListener
      ? (fn) => q.addEventListener('change', fn)
      : (fn) => q.addListener(fn);
    listen((e) => { on = e.matches; apply(); });
    return () => on;
  } catch (e) {
    return () => false;
  }
})();

/** 사람이 고른 값. 'on' | 'off' | null(고른 적 없음) */
function picked() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch (e) { return null; }
}

/** 지금 움직여야 하는가 */
export function motionOn() {
  const mine = picked();
  if (mine) return mine === 'on';
  return !ASKED();
}

/** 기기 설정을 그대로 따르고 있는가 (설정 화면의 덧말에 쓴다) */
export const followsDevice = () => picked() === null;

/** 기기가 줄여 달라고 한 상태인가 */
export const deviceAsksQuiet = () => ASKED();

/* CSS 는 이 표식 하나만 본다. 미디어 질의를 두 번 쓰지 않아도 되고,
   사람이 고른 값이 그대로 반영된다. */
function apply() {
  const el = document.documentElement;
  if (!el) return;
  if (motionOn()) el.removeAttribute('data-quiet');
  else el.setAttribute('data-quiet', '');
}

/** 켜고 끈다. 세계가 이미 그려져 있어도 그 자리에서 바뀐다. */
export function setMotion(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 막아 둔 브라우저 */ }
  apply();
  dispatchEvent(new CustomEvent('boida:motion'));
}

apply();
