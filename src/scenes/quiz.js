/* 문제 — 교육앱이 아니다.
   점수도, 목숨도, 타이머도 없다. 문제와 보기만 남긴다.

   한 노드에는 문제가 둘까지 있다.

     들어가는 문제 (quiz)      배우기 전의 직관을 건드린다
     나오는 문제 (exitQuiz)    방금 읽은 것을 새 상황에 대 본다

   나오는 문제는 없을 수도 있다. 없으면 글을 읽고 바로 세계로 돌아간다. */

import { wait, nextFrame } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';

const sheet = () => document.getElementById('quiz');

const STEP = { entry: '생각해보기', exit: '한 번 더 생각해보기' };

export const hasExitQuiz = (node) => Boolean(node && node.exitQuiz);

/**
 * 정답을 맞히면 resolve 한다. 오답은 몇 번이든 다시 고를 수 있다.
 *
 * 나오는 문제에서는 맞히고 나서 곧바로 닫지 않는다.
 * 방금 얻은 모델을 한 번 더 짚어 주고, 그때에야
 * `세계로 돌아가기` 가 생긴다. 그전에는 버튼 자체가 없다.
 */
export function openQuiz(node, { kind = 'entry' } = {}) {
  const el = sheet();
  const q = kind === 'exit' ? node.exitQuiz : node.quiz;
  el.innerHTML = `
    <div class="quiz-inner">
      <p class="quiz-step">${STEP[kind]}</p>
      <h2 class="quiz-q">${br(q.prompt)}</h2>
      <ul class="choices">
        ${q.choices.map((c) => `
          <li class="choice" data-key="${c.key}" role="button" tabindex="0">${br(c.text)}</li>`).join('')}
      </ul>
      <p class="quiz-nudge"></p>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);

    const inner = el.querySelector('.quiz-inner');
    const list  = el.querySelector('.choices');
    const nudge = el.querySelector('.quiz-nudge');
    let busy = false;

    /* 글이 길면 답말이 화면 밖에 있을 수 있다. 딱 필요한 만큼만 내린다. */
    const reveal = (n) => n.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const leave = async () => {
      inner.classList.add('is-leaving');
      await wait(850);
      await closeSheet(el);
      resolve();
    };

    /** 맞힌 뒤에야 생기는 문. 정답 전에는 DOM 에 없다. */
    const openDoor = async () => {
      const foot = document.createElement('div');
      foot.className = 'quiz-foot';
      foot.innerHTML = '<button class="quiet-action" type="button">세계로 돌아가기</button>';
      inner.appendChild(foot);
      await nextFrame();
      const btn = foot.querySelector('.quiet-action');
      btn.classList.add('is-on');
      btn.addEventListener('click', leave, { once: true });
      reveal(foot);
    };

    const succeed = async (li, choice) => {
      list.querySelectorAll('.choice').forEach((n) => {
        if (n !== li) n.classList.add('is-hushed');
      });
      li.classList.add('is-right');

      if (choice.hint) {
        nudge.innerHTML = br(choice.hint);
        nudge.classList.add('is-on');
        reveal(nudge);
      }

      if (kind === 'exit') {
        await wait(900);
        await openDoor();          // 여기서는 기다린다
        return;
      }
      await wait(choice.hint ? 2600 : 1500);
      leave();
    };

    const fail = (li, choice) => {
      li.classList.remove('is-picked');
      li.classList.add('is-spent');
      nudge.innerHTML = br(choice.hint || '아직 아닙니다.');
      nudge.classList.add('is-on');
      reveal(nudge);
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
      if (li.dataset.key === q.answer) succeed(li, choice);
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
