/* 문제 — 교육앱이 아니다.
   점수도, 목숨도, 타이머도 없다. 문제와 보기만 남긴다. */

import { wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';

const sheet = () => document.getElementById('quiz');

/** 정답을 맞히면 resolve 한다. 오답은 몇 번이든 다시 고를 수 있다. */
export function openQuiz(node) {
  const el = sheet();
  const q = node.quiz;
  el.innerHTML = `
    <div class="quiz-inner">
      <h2 class="quiz-q">${br(q.prompt)}</h2>
      <ul class="choices">
        ${q.choices.map((c) => `
          <li class="choice" data-key="${c.key}" role="button" tabindex="0">${c.text}</li>`).join('')}
      </ul>
      <p class="quiz-nudge"></p>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);

    const list  = el.querySelector('.choices');
    const nudge = el.querySelector('.quiz-nudge');
    let busy = false;

    const succeed = async (li) => {
      list.querySelectorAll('.choice').forEach((n) => {
        if (n !== li) n.classList.add('is-hushed');
      });
      li.classList.add('is-right');
      await wait(1500);

      el.querySelector('.quiz-inner').classList.add('is-leaving');
      await wait(850);
      await closeSheet(el);
      resolve();
    };

    const fail = async (li, choice) => {
      li.classList.remove('is-picked');
      li.classList.add('is-spent');
      nudge.innerHTML = br(choice.hint || '아직 아닙니다.');
      nudge.classList.add('is-on');
      busy = false;
    };

    const pick = async (li) => {
      if (busy || li.classList.contains('is-spent')) return;
      busy = true;
      nudge.classList.remove('is-on');
      li.classList.add('is-picked');

      /* 곧바로 판정하지 않는다. 아주 짧은 정적. */
      await wait(420);

      const choice = q.choices.find((c) => c.key === li.dataset.key);
      if (li.dataset.key === q.answer) succeed(li);
      else fail(li, choice);
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
