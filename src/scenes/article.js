/* 지식 — 알아낸 것을 읽는 자리.
   이 화면에서는 글이 주인공이다. */

import { nextFrame, wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br, revealIn } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';
import { CONCEPT_META } from '../data/library.js';
import { plate } from '../art/plates.js';
import { mountChoices } from './quiz.js';

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

    <h2 class="article-title">${br(node.article.title)}</h2>
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

    나오는 문제가 있으면 글 맨 아래에서 이어 푼다. 화면을 옮기지 않는다.
    `세계로 돌아가기` 는 그 문제를 맞힌 뒤에야 생긴다.
    나오는 문제가 없는 노드는 처음부터 버튼만 있다. */
export function openArticle(node) {
  const el = sheet();
  const q = node.exitQuiz;

  el.innerHTML = `
    <div class="article-inner">
      ${renderArticle(node)}
      ${q ? `
        <section class="article-exit">
          <p class="exit-step">한 번 더 생각해보기</p>
          <h3 class="exit-q">${br(q.prompt)}</h3>
          <div class="exit-body"></div>
        </section>` : ''}
      <div class="article-foot"></div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);

    const foot = el.querySelector('.article-foot');

    const leave = async () => {
      chrome(true);
      await closeSheet(el);
      resolve();
    };

    /** 맞힌 뒤에야 생기는 문. 그전에는 아예 없다. */
    const openDoor = async ({ scroll = false } = {}) => {
      foot.innerHTML =
        '<button class="quiet-action" type="button">세계로 돌아가기</button>';
      await nextFrame();
      const btn = foot.querySelector('.quiet-action');
      btn.classList.add('is-on');
      btn.addEventListener('click', leave, { once: true });
      if (scroll) revealIn(btn);
    };

    if (!q) { openDoor(); return; }

    mountChoices(el.querySelector('.exit-body'), q, {
      onRight: async () => {
        await wait(900);
        openDoor({ scroll: true });
      },
    });
  });
}
