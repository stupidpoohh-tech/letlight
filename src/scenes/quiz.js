/* 문제 — 교육앱이 아니다.
   점수도, 목숨도, 타이머도 없다. 문제와 보기만 남긴다.

   한 노드에는 문제가 둘까지 있다.

     들어가는 문제 (quiz)      배우기 전의 직관을 건드린다. 이 화면에서 푼다
     나오는 문제 (exitQuiz)    방금 읽은 것을 새 상황에 대 본다.
                              화면을 따로 두지 않고 글 맨 아래에서 이어 푼다

   보기를 고르는 방식은 두 자리가 같다. 그 부분만 mountChoices 로 떼어 두었다.

   이 화면은 언제든 닫을 수 있다. 닫고 나간 것과 끝까지 간 것은 서로 다른
   결과로 돌려준다. 부르는 쪽이 그것을 보고 세계를 바꿀지 말지 정한다. */

import { wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br, revealIn, leaveBar } from '../core/sheet.js';
import { cue } from '../core/sound.js';

const sheet = () => document.getElementById('quiz');

export const hasExitQuiz = (node) => Boolean(node && node.exitQuiz);

/* 끝까지 갔는가, 중간에 나갔는가 */
export const DONE = { done: true };
export const LEFT = { done: false };

/**
 * 보기를 고르고, 맞힐 때까지 몇 번이든 다시 고르는 부분.
 * 맞히면 고른 보기의 한마디를 남기고 onRight 를 부른다.
 */
export function mountChoices(root, q, { onRight } = {}) {
  root.innerHTML = `
    <ul class="choices">
      ${q.choices.map((c) => `
        <li><button class="choice" type="button" data-key="${c.key}">${br(c.text)}</button></li>`).join('')}
    </ul>
    <p class="quiz-nudge" role="status" aria-live="polite"></p>`;

  const list  = root.querySelector('.choices');
  const nudge = root.querySelector('.quiz-nudge');
  let busy = false;
  let settled = false;

  /* 글이 길면 답말이 화면 밖에 있을 수 있다. 딱 필요한 만큼만 내린다. */
  const say = (text) => {
    nudge.innerHTML = br(text);
    nudge.classList.add('is-on');
    revealIn(nudge);
  };

  const pick = async (btn) => {
    if (busy || settled || btn.getAttribute('aria-disabled') === 'true') return;
    busy = true;
    nudge.classList.remove('is-on');
    btn.classList.add('is-picked');

    /* 곧바로 판정하지 않는다. 아주 짧은 정적. */
    await wait(420);
    if (!root.isConnected) return;

    const choice = q.choices.find((c) => c.key === btn.dataset.key);

    if (btn.dataset.key !== q.answer) {
      btn.classList.remove('is-picked');
      btn.classList.add('is-spent');
      btn.setAttribute('aria-disabled', 'true');
      say(choice.hint || '아직 아닙니다.');
      busy = false;
      return;
    }

    settled = true;
    list.querySelectorAll('.choice').forEach((n) => {
      if (n !== btn) {
        n.classList.add('is-hushed');
        n.setAttribute('aria-disabled', 'true');
      }
    });
    btn.classList.add('is-right');
    cue('right');
    if (choice.hint) say(choice.hint);
    onRight && onRight(choice);
  };

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice');
    if (btn) pick(btn);
  });
}

/** 들어가는 문제.
 *
 *  맞히면 설명을 남기고, 사용자가 '이유 읽기' 를 눌러야 글로 넘어간다.
 *  타이머로 저 혼자 넘어가지 않는다.
 *
 *  @returns {Promise<{done: boolean}>}
 */
export function openQuiz(node, { hint = '' } = {}) {
  const el = sheet();
  const q = node.quiz;
  el.innerHTML = `
    ${leaveBar()}
    <div class="quiz-inner">
      <p class="quiz-step">생각해보기</p>
      <h2 class="quiz-q" data-focus tabindex="-1">${br(q.prompt)}</h2>
      ${hint ? `<p class="quiz-tip">${br(hint)}</p>` : ''}
      <div class="quiz-body"></div>
      <div class="quiz-foot"></div>
    </div>`;

  return new Promise(async (resolve) => {
    let closing = false;
    chrome(false);
    await openSheet(el);

    /* 어느 쪽으로 끝나든 한 번만 닫는다 */
    const finish = async (result) => {
      if (closing) return;
      closing = true;
      if (result.done) {
        el.querySelector('.quiz-inner').classList.add('is-leaving');
        await wait(850);
      }
      chrome(true);
      await closeSheet(el, { back: null });
      resolve(result);
    };

    el.querySelector('.sheet-leave').addEventListener('click', () => finish(LEFT));

    mountChoices(el.querySelector('.quiz-body'), q, {
      onRight: async () => {
        /* 손잡이는 붙기 전에 먼저 눌릴 일을 받아 둔다.
           빨리 누르는 사람이 빈 버튼을 만나지 않게. */
        const btn = document.createElement('button');
        btn.className = 'quiet-action';
        btn.type = 'button';
        btn.textContent = '이유 읽기';
        btn.addEventListener('click', () => finish(DONE), { once: true });
        el.querySelector('.quiz-foot').appendChild(btn);
        await wait(400);
        btn.classList.add('is-on');
        revealIn(btn);
      },
    });
  });
}
