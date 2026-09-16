/* 문제 — 교육앱이 아니다.
   점수도, 목숨도, 타이머도 없다. 문제와 보기만 남긴다.

   한 노드에는 문제가 둘까지 있다.

     들어가는 문제 (quiz)      배우기 전의 직관을 건드린다. 이 화면에서 푼다
     나오는 문제 (exitQuiz)    방금 읽은 것을 새 상황에 대 본다.
                              화면을 따로 두지 않고 글 맨 아래에서 이어 푼다

   보기를 고르는 방식은 두 자리가 같다. 그 부분만 mountChoices 로 떼어 두었다. */

import { wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br, revealIn } from '../core/sheet.js';

const sheet = () => document.getElementById('quiz');

export const hasExitQuiz = (node) => Boolean(node && node.exitQuiz);

/**
 * 보기를 고르고, 맞힐 때까지 몇 번이든 다시 고르는 부분.
 * 맞히면 고른 보기의 한마디를 남기고 onRight 를 부른다.
 */
export function mountChoices(root, q, { onRight } = {}) {
  root.innerHTML = `
    <ul class="choices">
      ${q.choices.map((c) => `
        <li class="choice" data-key="${c.key}" role="button" tabindex="0">${br(c.text)}</li>`).join('')}
    </ul>
    <p class="quiz-nudge"></p>`;

  const list  = root.querySelector('.choices');
  const nudge = root.querySelector('.quiz-nudge');
  let busy = false;

  /* 글이 길면 답말이 화면 밖에 있을 수 있다. 딱 필요한 만큼만 내린다. */
  const say = (text) => {
    nudge.innerHTML = br(text);
    nudge.classList.add('is-on');
    revealIn(nudge);
  };

  const pick = async (li) => {
    if (busy || li.classList.contains('is-spent')) return;
    busy = true;
    nudge.classList.remove('is-on');
    li.classList.add('is-picked');

    /* 곧바로 판정하지 않는다. 아주 짧은 정적. */
    await wait(420);

    const choice = q.choices.find((c) => c.key === li.dataset.key);

    if (li.dataset.key !== q.answer) {
      li.classList.remove('is-picked');
      li.classList.add('is-spent');
      say(choice.hint || '아직 아닙니다.');
      busy = false;
      return;
    }

    list.querySelectorAll('.choice').forEach((n) => {
      if (n !== li) n.classList.add('is-hushed');
    });
    li.classList.add('is-right');
    if (choice.hint) say(choice.hint);
    onRight && onRight(choice);
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
}

/** 들어가는 문제. 맞히면 resolve 하고 글로 넘어간다. */
export function openQuiz(node) {
  const el = sheet();
  const q = node.quiz;
  el.innerHTML = `
    <div class="quiz-inner">
      <p class="quiz-step">생각해보기</p>
      <h2 class="quiz-q">${br(q.prompt)}</h2>
      <div class="quiz-body"></div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);

    mountChoices(el.querySelector('.quiz-body'), q, {
      onRight: async (choice) => {
        await wait(choice.hint ? 2600 : 1500);
        el.querySelector('.quiz-inner').classList.add('is-leaving');
        await wait(850);
        await closeSheet(el);
        resolve();
      },
    });
  });
}
