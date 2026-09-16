/* 오프닝 — LET THERE BE LIGHT

   빛이 있으라.            창조의 선언
   빛은 입자이면서 파동이다.  인간이 알아낸 법칙 — 여기를 누른다
   그러자 빛이 있었다.      지식이 세계의 존재로 바뀐다

   플레이어의 터치가 최초의 관측이다. */

import { tween, ease, wait, slice } from '../core/anim.js';

/* 어둠이 걷히는 단계.  [reveal, 어둠의 농도] */
const VEIL_STOPS = [
  [0.00, 1.00],   // 완전한 검정
  [0.10, 0.965],  // 희미한 광원
  [0.26, 0.865],  // 하늘과 지평선 실루엣
  [0.46, 0.570],  // 지형
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
    grain:   document.getElementById('paper-fx'),
  };

  /* 화면을 다 덮고 나면 마스크는 더 이상 할 일이 없다.
     매 프레임 전체 화면 그라디언트를 다시 만들지 않도록 떼어낸다. */
  const reach = Math.hypot(innerWidth, innerHeight) * 1.08;
  let masked = true;
  let lastFilter = '';

  const setReveal = (r) => {
    const radius = Math.pow(r, 1.42) * Math.max(innerWidth, innerHeight) * 2.05;
    if (masked) {
      if (radius > reach) {
        masked = false;
        el.layer.style.webkitMaskImage = 'none';
        el.layer.style.maskImage = 'none';
      } else {
        el.layer.style.setProperty('--mr', `${radius.toFixed(0)}px`);
      }
    }

    el.veil.style.opacity = veilAt(r).toFixed(3);

    const bright = 0.42 + 0.58 * slice(r, 0.18, 0.88);
    const sat    = slice(r, 0.52, 0.97);
    const cont   = 1.3 - 0.3 * slice(r, 0.28, 0.92);
    const fx = `saturate(${sat.toFixed(2)}) brightness(${bright.toFixed(2)}) contrast(${cont.toFixed(2)})`;
    if (fx !== lastFilter) { el.art.style.filter = fx; lastFilter = fx; }

    /* 질감은 늦게 온다 */
    if (el.grain) el.grain.style.opacity = (0.34 * slice(r, 0.5, 0.9)).toFixed(3);
  };

  /* 어두운 서곡 동안 세계를 미리 그려 둔다. 검은 장막이 덮고 있으므로 보이지 않는다. */
  el.layer.style.setProperty('--mr', '400vmax');
  setReveal(0);
  el.grain.style.opacity = '0';
  el.art.style.willChange = 'filter';

  return new Promise((resolve) => {
    let armed = false;

    const overture = async () => {
      await wait(1100);

      /* 빛이 있으라. */
      await tween({
        duration: 2100, easing: ease.inOut,
        onUpdate: (v) => { el.fiat.style.opacity = v.toFixed(3); },
      });

      await wait(1200);

      /* 빛은 입자이면서 파동이다. */
      await tween({
        from: 0, to: 0.55, duration: 1900, easing: ease.inOut,
        onUpdate: (v) => { el.law.style.opacity = v.toFixed(3); },
      });

      el.law.classList.add('is-breathing');
      armed = true;
    };

    const onTap = () => advance();
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    };

    const advance = async () => {
      if (!armed) return;
      armed = false;
      el.law.removeEventListener('pointerdown', onTap);
      el.law.removeEventListener('keydown', onKey);
      el.law.classList.remove('is-breathing');

      /* 최초의 빛은 누른 자리에서 태어난다 */
      const r = el.law.getBoundingClientRect();
      const px = r.width ? r.left + r.width / 2 : innerWidth / 2;
      const py = r.height ? r.top + r.height / 2 : innerHeight * 0.54;
      el.glow.style.left = `${px}px`;
      el.glow.style.top  = `${py}px`;
      el.layer.style.setProperty('--mx', `${px}px`);
      el.layer.style.setProperty('--my', `${py}px`);
      el.layer.style.setProperty('--mr', '0px');

      /* A. 거의 점에 가까운 빛 하나 */
      el.glow.style.width = '340px';
      el.glow.style.height = '340px';
      el.glow.style.margin = '-170px 0 0 -170px';
      el.glow.style.transform = 'scale(0.006)';
      el.glow.style.opacity = '1';

      /* 법칙은 조용히 물러난다 */
      tween({
        from: 0.55, to: 0, duration: 900, easing: ease.inOut,
        onUpdate: (v) => { el.law.style.opacity = v.toFixed(3); },
      });

      /* B. 빛이 퍼진다 */
      tween({
        from: 0.006, to: 1, duration: 2300, easing: ease.outQuint,
        onUpdate: (v) => { el.glow.style.transform = `scale(${v.toFixed(4)})`; },
      });
      tween({
        from: 1, to: 0.42, duration: 3800, delay: 1100, easing: ease.inOut,
        onUpdate: (v) => { el.glow.style.opacity = v.toFixed(3); },
      });

      let saidAfter = false;

      /* D. 빛이 세계를 발견해 간다 */
      const reveal = tween({
        duration: 7200, easing: ease.discover,
        onUpdate: (v) => {
          setReveal(v);

          /* C. 선언이 사실로 바뀐다 */
          if (v > 0.045 && !saidAfter) {
            saidAfter = true;
            tween({
              from: 1, to: 0, duration: 1100, easing: ease.inOut,
              onUpdate: (o) => { el.fiat.style.opacity = o.toFixed(3); },
            });
            tween({
              duration: 1700, delay: 900, easing: ease.inOut,
              onUpdate: (o) => { el.after.style.opacity = o.toFixed(3); },
            });
            /* E. 그 문장도 결국 사라지고, 세계만 남는다 */
            tween({
              from: 1, to: 0, duration: 2400, delay: 4400, easing: ease.inOut,
              onUpdate: (o) => { el.after.style.opacity = o.toFixed(3); },
            });
          }
        },
      });

      /* 빛의 잔상은 마지막에 세계에 스며든다 */
      tween({
        from: 0.42, to: 0, duration: 2800, delay: 4200, easing: ease.inOut,
        onUpdate: (v) => { el.glow.style.opacity = v.toFixed(3); },
      });

      await reveal;
      el.art.style.filter = '';
      el.art.style.willChange = '';
      el.grain.style.opacity = '';
      el.layer.style.webkitMaskImage = 'none';
      el.layer.style.maskImage = 'none';
      await wait(600);
      el.opening.remove();
      resolve();
    };

    el.law.addEventListener('pointerdown', onTap);
    el.law.addEventListener('keydown', onKey);
    overture();
  });
}
