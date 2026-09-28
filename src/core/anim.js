/* 모든 움직임은 slow / quiet / deliberate.
   튕김 없음. 폭발 없음.

   RATE 는 전체 속도를 한 번에 조절하는 손잡이다.
   1 이 원래 속도, 작을수록 빠르다.
   CSS 쪽은 tokens.css 의 --rate 가 같은 값을 들고 있으니 함께 고쳐야 한다. */

export const RATE = 0.74;

/* 움직임을 줄여 달라고 한 기기.
   CSS 는 tokens/app.css 가 따로 받는다. 여기는 자바스크립트로 도는 연출 쪽이다.
   연출을 건너뛰어도 끝나는 값과 순서는 같아야 한다. 그래서 멈추는 것이 아니라
   마지막 값으로 곧장 간다. 기다림도 거의 남기지 않는다. */
const QUIET_MOTION = (() => {
  try {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    let on = q.matches;
    const listen = q.addEventListener
      ? (fn) => q.addEventListener('change', fn)
      : (fn) => q.addListener(fn);
    listen((e) => { on = e.matches; });
    return () => on;
  } catch (e) {
    return () => false;
  }
})();

export const reducedMotion = () => QUIET_MOTION();

export const ease = {
  linear:  (t) => t,
  inOut:   (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  outCubic:(t) => 1 - Math.pow(1 - t, 3),
  outQuint:(t) => 1 - Math.pow(1 - t, 5),
  inQuad:  (t) => t * t,
  /* 빛이 세계를 찾아가는 속도 — 처음엔 머뭇거리고, 중간에 열리고,
     끝에서 아주 길게 정착한다 */
  discover:(t) => {
    const e = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2.4) / 2;
    return e;
  },
};

export const wait = (ms) =>
  new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms * RATE));

/**
 * 값 하나를 시간에 따라 옮긴다.
 * @returns {Promise<void>} & .cancel()
 */
export function tween({ from = 0, to = 1, duration = 1000, delay = 0,
                        easing = ease.inOut, onUpdate, onDone }) {
  const quiet = reducedMotion();
  duration *= quiet ? 0 : RATE;
  delay *= quiet ? 0 : RATE;
  let raf = 0, timer = 0, killed = false;
  const p = new Promise((resolve) => {
    if (quiet) {
      /* 마지막 값만 한 번 얹고 끝낸다. 세계가 닿는 자리는 그대로다. */
      timer = setTimeout(() => {
        if (killed) return;
        onUpdate && onUpdate(to, 1);
        onDone && onDone();
        resolve();
      }, 0);
      return;
    }
    const start = () => {
      const t0 = performance.now();
      const step = (now) => {
        if (killed) return;
        const t = Math.min(1, (now - t0) / duration);
        onUpdate && onUpdate(from + (to - from) * easing(t), t);
        if (t < 1) raf = requestAnimationFrame(step);
        else { onDone && onDone(); resolve(); }
      };
      raf = requestAnimationFrame(step);
    };
    if (delay > 0) timer = setTimeout(start, delay); else start();
  });
  p.cancel = () => { killed = true; cancelAnimationFrame(raf); clearTimeout(timer); };
  return p;
}

/** 끝없이 도는 갱신 루프 (구름의 표류 등) */
export function loop(fn) {
  let raf = 0, last = performance.now(), killed = false;
  const step = (now) => {
    if (killed) return;
    const dt = Math.min(64, now - last);
    last = now;
    fn(dt, now);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { killed = true; cancelAnimationFrame(raf); };
}

/** CSS 트랜지션이 붙은 요소에 클래스를 붙이되, 한 프레임 뒤에 붙인다 */
export function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 0..1 범위를 부분 구간으로 잘라 쓴다. reveal 단계 제어용. */
export function slice(v, a, b) {
  return clamp((v - a) / (b - a), 0, 1);
}
