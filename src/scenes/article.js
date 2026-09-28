/* 지식 — 알아낸 것을 읽는 자리.
   이 화면에서는 글이 주인공이다.

   읽다가 나갈 수 있다. 나가면 읽던 자리를 기억해 두고, 다시 열면 거기서
   이어진다. 나오는 문제를 맞힌 뒤에 나가도 그 사실이 남는다. */

import { nextFrame, wait } from '../core/anim.js';
import { openSheet, closeSheet, chrome, br, revealIn, leaveBar } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';
import { CONCEPT_META } from '../data/library.js';
import { plate } from '../art/plates.js';
import { diagram } from '../art/diagrams.js';
import { mountChoices, DONE, LEFT } from './quiz.js';

const sheet = () => document.getElementById('article');

/* 승인본의 소제목(### )과 강조(**…**)를 그대로 살린다 */
const fmt = (t) => br(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const para = (t) => (String(t).startsWith('### ')
  ? `<h3 class="article-h">${fmt(String(t).slice(4))}</h3>`
  : `<p>${fmt(t)}</p>`);

/* 꼭 읽지 않아도 되는 대목은 접어 둔다.

   details 를 그대로 쓴다. 키보드로도 보조기술로도 이미 열리고 닫히는 물건이라
   따로 만들 것이 없다. 스스로 열거나 닫지 않는다.
   접혀 있어도 핵심 설명은 바깥에 남아 있어야 한다. */
const fold = (t, n) => `
  <details class="article-fold" data-fold="${n}">
    <summary class="fold-head">
      <span class="fold-tag">조금 더 알아보기</span>
      <span class="fold-title">${br(t.more)}</span>
    </summary>
    <div class="fold-body">${t.body.map(para).join('')}</div>
  </details>`;

/* 설명 도식.

   본문이 이미 말한 관계 하나를 눈으로 잡게 한다. 그림 자체는 aria-hidden 이고,
   제목 · 설명 · 캡션이 실제 글자로 그 옆에 있다. 선과 도형을 하나씩 읽어 주는
   대신 그 글자만 읽으면 비교가 서는 구조다.
   그릴 것이 없는 이름이면 figure 를 아예 만들지 않는다. 빈 자리는 남기지 않는다. */
const fig = (t) => {
  const drawn = diagram(t.figure);
  if (!drawn) return '';
  return `<figure class="article-fig">
    <figcaption class="fig-cap">${drawn.head}${t.caption ? `<span class="fig-cap-t">${fmt(t.caption)}</span>` : ''}</figcaption>
    ${drawn.body}
  </figure>`;
};

/** 본문 한 덩어리. 문단이거나, 소제목이거나, 접힌 대목이거나, 도식이다. */
function block(t, state) {
  if (t && typeof t === 'object' && t.more) return fold(t, state.folds++);
  if (t && typeof t === 'object' && t.figure) return fig(t);
  return para(t);
}

export function renderArticle(node) {
  const ids = [].concat(node.concept || []);
  const found = ids.map((id) => CONCEPTS[id]).filter(Boolean);
  const linked = ids
    .flatMap((id) => (CONCEPT_META[id] ? CONCEPT_META[id].siblings : []))
    .slice(0, 3);

  const art = plate(node.article.plate);
  const lead = node.article.lead || [];
  const state = { folds: 0 };

  /* 읽는 것이 먼저다.
     제목 → (도판) → 본문 → 분류를 돕는 것 순으로 둔다.
     개념명과 연결 원리는 글을 읽기 전에 외워야 할 것이 아니라,
     읽고 난 뒤 어디에 걸어 둘지 알려 주는 표시다. 그래서 뒤로 보낸다.
     둘 다 없으면 빈 자리를 남기지 않는다. */
  const more = found.length || linked.length;

  return `
    <h2 class="article-title" data-focus tabindex="-1">${br(node.article.title)}</h2>

    ${lead.length ? `<div class="article-lead">
      ${lead.map((t) => `<p>${fmt(t)}</p>`).join('')}
    </div>` : ''}

    ${art ? `<figure class="article-plate">${art}</figure>` : ''}

    <div class="article-body">
      ${node.article.body.map((t) => block(t, state)).join('')}
    </div>

    ${more ? `<aside class="article-more">
      ${found.length ? `<ul class="article-concepts">
        ${found.map((c) => `<li class="article-concept">${c.name}
          <span class="article-concept-en">${c.en}</span></li>`).join('')}
      </ul>` : ''}
      ${linked.length ? `<p class="article-rel">
        <b>연결 원리</b><span class="article-rel-sep">|</span
        ><span class="article-rel-list">${linked.join(' · ')}</span></p>` : ''}
    </aside>` : ''}`;
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
 *  @param {number[]} o.folds      펼쳐 두었던 대목
 *  @param {Function} o.onStep     단계가 바뀔 때 ('article' | 'door')
 *  @param {Function} o.onScroll   읽던 자리가 바뀔 때
 *  @param {Function} o.onFolds    펼치거나 접을 때
 *  @returns {Promise<{done: boolean}>}
 */
export function openArticle(node, {
  passedExit = false, scroll = 0, folds = [], onStep, onScroll, onFolds,
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

    /* 펼쳐 두었던 대목을 먼저 되살린다. 접힘이 달라지면 글의 높이가 달라지므로
       이것이 먼저다. 그다음에 읽던 높이를 맞춘다. */
    const all = [...el.querySelectorAll('.article-fold')];
    all.forEach((d, i) => { if (folds.includes(i)) d.open = true; });

    const tellFolds = () => onFolds && onFolds(
      all.map((d, i) => (d.open ? i : -1)).filter((i) => i >= 0));
    all.forEach((d) => d.addEventListener('toggle', tellFolds));

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
