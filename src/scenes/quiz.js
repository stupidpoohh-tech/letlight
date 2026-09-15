/* 문제 — 교육앱이 아니다.
   점수도, 하트도, 타이머도, 성공 애니메이션도 없다.
   문제와 선택지만 남긴다. */

import { wait, nextFrame } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';
import { CONCEPTS } from '../data/knowledge.js';

const sheet = () => document.getElementById('quiz');

const NUDGES = [
  '아직 아닙니다.',
  '아직 아닙니다.\n빛이 어떻게 흩어지는지 생각해 보세요.',
];

/** 4지선다 한 문항. 정답을 맞히면 resolve 한다. */
export function openQuiz(q) {
  const el = sheet();
  el.classList.remove('is-preview');
  el.innerHTML = `
    <div class="quiz-inner">
      <h2 class="quiz-q">${br(q.quiz.prompt)}</h2>
      <ul class="choices">
        ${q.quiz.choices.map((c) => `
          <li class="choice" data-key="${c.key}" role="button" tabindex="0">${c.text}</li>`).join('')}
      </ul>
      <p class="quiz-nudge"></p>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);

    const inner   = el.querySelector('.quiz-inner');
    const prompt  = el.querySelector('.quiz-q');
    const list    = el.querySelector('.choices');
    const nudge   = el.querySelector('.quiz-nudge');
    let   wrong   = 0;
    let   busy    = false;

    const succeed = async (li) => {
      /* 아주 짧은 정적 */
      await wait(950);

      list.querySelectorAll('.choice').forEach((n) => {
        if (n !== li) n.classList.add('is-hushed');
      });
      await wait(1100);

      list.style.transition = 'opacity 1.1s var(--ease-quiet)';
      list.style.opacity = '0';
      prompt.style.opacity = '0.42';
      nudge.classList.remove('is-on');
      await wait(1150);
      list.remove();
      nudge.remove();

      const concept = CONCEPTS[q.concept];
      inner.insertAdjacentHTML('beforeend', `
        <p class="verdict">정답입니다.</p>
        <div class="explain">
          ${q.quiz.explain.map((t) => `<p>${br(t)}</p>`).join('')}
        </div>
        ${concept ? `<p class="concept-tag">발견한 개념 &nbsp;<b>${concept.name}</b></p>` : ''}
        <button class="quiet-action" type="button">세계로 돌아가기</button>`);

      const verdict = inner.querySelector('.verdict');
      const lines   = [...inner.querySelectorAll('.explain p')];
      const tag     = inner.querySelector('.concept-tag');
      const action  = inner.querySelector('.quiet-action');

      await nextFrame();
      verdict.classList.add('is-on');
      await wait(1700);

      for (const p of lines) { p.classList.add('is-on'); await wait(1500); }
      await wait(500);
      if (tag) { tag.classList.add('is-on'); await wait(1200); }
      action.classList.add('is-on');

      action.addEventListener('click', async () => {
        chrome(true);
        await closeSheet(el);
        resolve('solved');
      }, { once: true });
    };

    const fail = async (li) => {
      await wait(800);
      li.classList.remove('is-picked');
      li.classList.add('is-spent');
      nudge.innerHTML = br(NUDGES[Math.min(wrong, NUDGES.length - 1)]);
      nudge.classList.add('is-on');
      wrong += 1;
      busy = false;
    };

    const pick = (li) => {
      if (busy || li.classList.contains('is-spent')) return;
      busy = true;
      nudge.classList.remove('is-on');
      li.classList.add('is-picked');
      if (li.dataset.key === q.quiz.answer) succeed(li);
      else fail(li);
    };

    list.addEventListener('click', (e) => {
      const li = e.target.closest('.choice');
      if (li) pick(li);
    });
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const li = e.target.closest('.choice');
      if (li) { e.preventDefault(); pick(li); }
    });
  });
}

/** 아직 열리지 않은 질문 — 지식이 이 방향으로 계속 이어진다는 감각만 남긴다. */
export function openPreview(q) {
  const el = sheet();
  el.classList.add('is-preview');
  el.innerHTML = `
    <div class="preview-inner">
      <p class="preview-kicker">다음 발견</p>
      <h2 class="preview-q">${br(q.text)}</h2>
      <p class="preview-hint">${br(q.hint || '')}</p>
      <div><button class="quiet-action is-on" type="button">세계로 돌아가기</button></div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);
    el.querySelector('.quiet-action').addEventListener('click', async () => {
      chrome(true);
      await closeSheet(el);
      el.classList.remove('is-preview');
      resolve();
    }, { once: true });
  });
}
