/* 모든 움직임은 slow / quiet / deliberate.
   튕김 없음. 폭발 없음.

   RATE 는 전체 속도를 한 번에 조절하는 손잡이다.
   1 이 원래 속도, 작을수록 빠르다.
   CSS 쪽은 tokens.css 의 --rate 가 같은 값을 들고 있으니 함께 고쳐야 한다. */

export const RATE = 0.48;

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

export const wait = (ms) => new Promise((r) => setTimeout(r, ms * RATE));

/**
 * 값 하나를 시간에 따라 옮긴다.
 * @returns {Promise<void>} & .cancel()
 */
export function tween({ from = 0, to = 1, duration = 1000, delay = 0,
                        easing = ease.inOut, onUpdate, onDone }) {
  duration *= RATE;
  delay *= RATE;
  let raf = 0, timer = 0, killed = false;
  const p = new Promise((resolve) => {
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
