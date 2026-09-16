/* 지식 — 알아낸 것을 읽는 자리.
   이 화면에서는 글이 주인공이다. */

import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';
import { CONCEPT_META } from '../data/library.js';
import { plate } from '../art/plates.js';

const sheet = () => document.getElementById('article');

export function renderArticle(node) {
  const ids = [].concat(node.concept || []);
  const found = ids.map((id) => CONCEPTS[id]).filter(Boolean);
  const linked = ids
    .flatMap((id) => (CONCEPT_META[id] ? CONCEPT_META[id].siblings : []))
    .slice(0, 3);

  const art = plate(node.article.plate);

  return `
    ${linked.length ? `<p class="article-rel">
        <b>연결 원리</b><span>|</span>${linked.join(' · ')}</p>` : ''}

    ${art ? `<div class="article-plate">${art}</div>` : ''}

    <h2 class="article-title">${br(node.article.title)}</h2>
    ${found.map((c) => `
      <p class="article-concept">${c.name}</p>
      <p class="article-concept-en">${c.en}</p>`).join('')}

    <div class="article-rule"></div>

    <div class="article-body">
      ${node.article.body.map((t) => `<p>${br(t)}</p>`).join('')}
    </div>`;
}

/** 문제를 맞힌 뒤 읽는다. 다 읽으면 세계로 돌아간다. */
export function openArticle(node) {
  const el = sheet();
  el.innerHTML = `
    <div class="article-inner">
      ${renderArticle(node)}
      <div class="article-foot">
        <button class="quiet-action is-on" type="button">세계로 돌아가기</button>
      </div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);
    el.querySelector('.quiet-action').addEventListener('click', async () => {
      chrome(true);
      await closeSheet(el);
      resolve();
    }, { once: true });
  });
}
