/* 오프닝 — LET THERE BE LIGHT

   플레이어는 시작 버튼을 누르는 것이 아니다.
   자신의 손으로 빛을 만들고, 그 빛으로 세계를 처음 본다. */

import { tween, ease, wait, clamp, slice } from '../core/anim.js';

/* 어둠이 걷히는 단계.  [reveal, 어둠의 농도] */
const VEIL_STOPS = [
  [0.00, 1.00],   // 완전한 검정
  [0.10, 0.965],  // 희미한 광원
  [0.26, 0.865],  // 하늘과 지평선 실루엣
  [0.46, 0.570],  // 언덕과 지형
  [0.70, 0.235],  // 질감
  [1.00, 0.000],  // 색
];

function veilAt(r) {
  for (let i = 0; i < VEIL_STOPS.length - 1; i++) {
    const [a, va] = VEIL_STOPS[i];
    const [b, vb] = VEIL_STOPS[i + 1];
    if (r <= b) return va + (vb - va) * ((r - a) / (b - a));
  }
  return 0;
}

export function runOpening() {
  const el = {
    opening: document.getElementById('opening'),
    fiat:    document.getElementById('line-fiat'),
    after:   document.getElementById('line-after'),
    law:     document.getElementById('line-law'),
    veil:    document.getElementById('veil'),
    glow:    document.getElementById('glow'),
    layer:   document.getElementById('world-layer'),
    art:     document.getElementById('world-art'),
  };

  const setReveal = (r) => {
    const maxDim = Math.max(innerWidth, innerHeight);
    const radius = Math.pow(r, 1.42) * maxDim * 2.05;
    el.layer.style.setProperty('--mr', `${radius.toFixed(0)}px`);
    el.veil.style.opacity = veilAt(r).toFixed(3);

    const bright = 0.42 + 0.58 * slice(r, 0.18, 0.88);
    const sat    = slice(r, 0.52, 0.97);
    const cont   = 1.3 - 0.3 * slice(r, 0.28, 0.92);
    el.art.style.filter =
      `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)}) contrast(${cont.toFixed(3)})`;
  };

  setReveal(0);

  return new Promise((resolve) => {
    let armed = false;

    const overture = async () => {
      await wait(1500);

      /* 빛이 있으라. */
      await tween({
        duration: 2700, easing: ease.inOut,
        onUpdate: (v) => { el.fiat.style.opacity = v.toFixed(3); },
      });

      await wait(1700);

      /* 빛은 입자이면서 파동이다. — 텍스트 자체가 인터랙션이다 */
      await tween({
        from: 0, to: 0.5, duration: 2500, easing: ease.inOut,
        onUpdate: (v) => { el.law.style.opacity = v.toFixed(3); },
      });
      el.law.style.opacity = '';
      el.law.classList.add('is-breathing');
      armed = true;
    };

    const touch = async (ev) => {
      if (!armed) return;
      armed = false;
      el.law.removeEventListener('pointerdown', touch);
      el.law.removeEventListener('keydown', onKey);

      /* 최초의 관측 지점 */
      const px = ev && ev.clientX ? ev.clientX : innerWidth / 2;
      const py = ev && ev.clientY ? ev.clientY : innerHeight * 0.56;
      el.glow.style.left = `${px}px`;
      el.glow.style.top  = `${py}px`;
      el.layer.style.setProperty('--mx', `${px}px`);
      el.layer.style.setProperty('--my', `${py}px`);

      /* A. 거의 점에 가까운 빛 하나 */
      el.glow.style.width = '340px';
      el.glow.style.height = '340px';
      el.glow.style.margin = '-170px 0 0 -170px';
      el.glow.style.transform = 'scale(0.006)';
      el.glow.style.opacity = '1';

      /* 터치한 문장은 조용히 물러난다 */
      el.law.classList.remove('is-breathing');
      tween({
        from: 0.5, to: 0, duration: 1100, easing: ease.inOut,
        onUpdate: (v) => { el.law.style.opacity = v.toFixed(3); },
      });

      /* B. 빛이 천천히 퍼진다 */
      tween({
        from: 0.006, to: 1, duration: 2900, easing: ease.outQuint,
        onUpdate: (v) => { el.glow.style.transform = `scale(${v.toFixed(4)})`; },
      });
      tween({
        from: 1, to: 0.42, duration: 5200, delay: 1400, easing: ease.inOut,
        onUpdate: (v) => { el.glow.style.opacity = v.toFixed(3); },
      });

      let saidAfter = false;

      /* D. 빛이 세계를 발견해 간다 */
      const reveal = tween({
        duration: 9000, easing: ease.discover,
        onUpdate: (r) => {
          setReveal(r);

          /* C. 선언이 사실로 바뀐다 */
          if (r > 0.045 && !saidAfter) {
            saidAfter = true;
            tween({
              from: 1, to: 0, duration: 1500, easing: ease.inOut,
              onUpdate: (v) => { el.fiat.style.opacity = v.toFixed(3); },
            });
            tween({
              duration: 2400, delay: 1300, easing: ease.inOut,
              onUpdate: (v) => { el.after.style.opacity = v.toFixed(3); },
            });
            /* E. 그 문장도 결국 사라지고, 세계만 남는다 */
            tween({
              from: 1, to: 0, duration: 3400, delay: 6000, easing: ease.inOut,
              onUpdate: (v) => { el.after.style.opacity = v.toFixed(3); },
            });
          }
        },
      });

      /* 빛의 잔상은 마지막에 세계에 스며든다 */
      tween({
        from: 0.42, to: 0, duration: 3800, delay: 5400, easing: ease.inOut,
        onUpdate: (v) => { el.glow.style.opacity = v.toFixed(3); },
      });

      await reveal;
      el.art.style.filter = '';
      el.art.style.willChange = '';
      el.layer.style.setProperty('--mr', '400vmax');
      await wait(900);
      el.opening.remove();
      resolve();
    };

    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touch(null); }
    };

    el.art.style.willChange = 'filter';
    el.law.addEventListener('pointerdown', touch);
    el.law.addEventListener('keydown', onKey);
    overture();
  });
}
