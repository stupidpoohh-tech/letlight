/* 지식 — 알아낸 것을 읽는 자리.
   이 화면에서는 글이 주인공이다.

   읽다가 나갈 수 있다. 나가면 읽던 자리를 기억해 두고, 다시 열면 거기서
   이어진다. 나오는 문제를 맞힌 뒤에 나가도 그 사실이 남는다. */

import { nextFrame, wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br, revealIn, leaveBar } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';
import { CONCEPT_META } from '../data/library.js';
import { plate } from '../art/plates.js';
import { mountChoices, DONE, LEFT } from './quiz.js';

const sheet = () => document.getElementById('article');

/* 승인본의 소제목(### )과 강조(**…**)를 그대로 살린다 */
const fmt = (t) => br(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const block = (t) => (t.startsWith('### ')
  ? `<h3 class="article-h">${fmt(t.slice(4))}</h3>`
  : `<p>${fmt(t)}</p>`);

export function renderArticle(node) {
  const ids = [].concat(node.concept || []);
  const found = ids.map((id) => CONCEPTS[id]).filter(Boolean);
  const linked = ids
    .flatMap((id) => (CONCEPT_META[id] ? CONCEPT_META[id].siblings : []))
    .slice(0, 3);

  const art = plate(node.article.plate);

  return `
    ${linked.length ? `<p class="article-rel">
        <b>연결 원리</b><span class="article-rel-sep">|</span
        ><span class="article-rel-list">${linked.join(' · ')}</span></p>` : ''}

    ${art ? `<div class="article-plate">${art}</div>` : ''}

    <h2 class="article-title" data-focus tabindex="-1">${br(node.article.title)}</h2>
    ${found.length ? `<ul class="article-concepts">
      ${found.map((c) => `<li class="article-concept">${c.name}
        <span class="article-concept-en">${c.en}</span></li>`).join('')}
    </ul>` : ''}

    <div class="article-rule"></div>

    <div class="article-body">
      ${node.article.body.map(block).join('')}
    </div>`;
}

/** 문제를 맞힌 뒤 읽는다.
 *
 *  나오는 문제가 있으면 글 맨 아래에서 이어 푼다. 화면을 옮기지 않는다.
 *  `세계로 돌아가기` 는 그 문제를 맞힌 뒤에야 생긴다.
 *  나오는 문제가 없는 노드는 처음부터 버튼만 있다.
 *
 *  @param {object} o
 *  @param {boolean} o.passedExit  나오는 문제를 이미 맞히고 나갔던 자리인가
 *  @param {number}  o.scroll      읽던 자리
 *  @param {Function} o.onStep     단계가 바뀔 때 ('article' | 'door')
 *  @param {Function} o.onScroll   읽던 자리가 바뀔 때
 *  @returns {Promise<{done: boolean}>}
 */
export function openArticle(node, {
  passedExit = false, scroll = 0, onStep, onScroll,
} = {}) {
  const el = sheet();
  const q = node.exitQuiz;
  const needQuiz = Boolean(q) && !passedExit;

  el.innerHTML = `
    ${leaveBar()}
    <div class="article-inner">
      ${renderArticle(node)}
      ${needQuiz ? `
        <section class="article-exit">
          <p class="exit-step">한 번 더 생각해보기</p>
          <h3 class="exit-q">${br(q.prompt)}</h3>
          <div class="exit-body"></div>
        </section>` : ''}
      <div class="article-foot"></div>
    </div>`;

  return new Promise(async (resolve) => {
    let closing = false;
    let opened = passedExit || !q;     // 세계로 돌아가는 문이 열렸는가

    chrome(false);
    await openSheet(el);

    /* 읽던 자리로 되돌린다. 글이 다 그려진 뒤라야 높이가 맞다. */
    if (scroll > 0) {
      await nextFrame();
      el.scrollTop = Math.min(scroll, Math.max(0, el.scrollHeight - el.clientHeight));
    }

    let last = el.scrollTop;
    const track = () => {
      if (closing || Math.abs(el.scrollTop - last) < 24) return;
      last = el.scrollTop;
      onScroll && onScroll(last);
    };
    el.addEventListener('scroll', track, { passive: true });

    const foot = el.querySelector('.article-foot');

    const finish = async (result) => {
      if (closing) return;
      closing = true;
      el.removeEventListener('scroll', track);
      onScroll && onScroll(el.scrollTop);
      chrome(true);
      await closeSheet(el, { back: null });
      resolve(result);
    };

    el.querySelector('.sheet-leave').addEventListener('click', () => finish(LEFT));

    /** 맞힌 뒤에야 생기는 문. 그전에는 아예 없다. */
    const openDoor = async ({ scrollTo = false } = {}) => {
      if (foot.querySelector('.quiet-action')) return;
      opened = true;
      onStep && onStep('door');
      /* 손잡이는 붙기 전에 먼저 눌릴 일을 받아 둔다 */
      const btn = document.createElement('button');
      btn.className = 'quiet-action';
      btn.type = 'button';
      btn.textContent = '세계로 돌아가기';
      btn.addEventListener('click', () => finish(DONE), { once: true });
      foot.appendChild(btn);
      await nextFrame();
      btn.classList.add('is-on');
      if (scrollTo) revealIn(btn);
    };

    if (!needQuiz) { openDoor(); return; }

    onStep && onStep('article');
    mountChoices(el.querySelector('.exit-body'), q, {
      onRight: async () => {
        await wait(900);
        if (closing) return;
        openDoor({ scrollTo: true });
      },
    });
  });
}
