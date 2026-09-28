/* 보이ㄷㅏ — Let There Be Light
   First Playable Prototype

   알수록 보이ㄷㅏ */

import { wait } from './core/anim.js';
import { syncStageUnits } from './core/stage.js';
import { state, solvedIds, availableIds, markSolved, isSolved } from './core/state.js';
import { anyResume } from './core/resume.js';
import { NODES, NODE_ORDER } from './data/nodes.js';
import { runOpening } from './scenes/opening.js';
import { mountWorld, showNode, wireNodes, hideNodes, restoreWorld,
         refreshResumeMarks } from './scenes/world.js';
import { openCodex, closeCodex, codexTrail, setCodexTrail } from './scenes/codex.js';
import { startRoute, pushRoute, routeNow } from './core/route.js';
import { unlock, isMuted, setMuted } from './core/sound.js';

const nav = document.getElementById('nav');
const sndBtn = document.getElementById('sound-toggle');
const navItems = [...nav.querySelectorAll('.nav-item')];
const codexBtn = navItems.find((b) => b.dataset.view === 'codex');

let view = 'world';

/* 화면을 바꾸는 일은 한 줄로 세워 둔다. 빠르게 눌러도 순서가 꼬이지 않는다. */
let queue = Promise.resolve();
const serial = (fn) => { queue = queue.then(fn).catch(() => {}); return queue; };

function paintNav(next) {
  navItems.forEach((b) => {
    const on = b.dataset.view === next;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', String(on));
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

/* 마지막으로 가려던 자리. 빠르게 여러 번 눌리면 중간은 건너뛰고
   마지막 자리로 한 번에 맞춘다. */
let wanted = null;

/** 기록 한 칸을 화면에 그대로 옮긴다. 이동을 결정하지는 않는다. */
function applyRoute(r, opts = {}) {
  wanted = { r, opts };
  serial(async () => {
    while (wanted) {
      const { r: at, opts: o } = wanted;
      wanted = null;
      await settle(at, o);
    }
  });
}

async function settle(r, { back = false } = {}) {
  {
    paintNav(r.view);

    if (r.view === 'codex') {
      if (view !== 'codex') {
        view = 'codex';
        hideNodes(true);
        /* 도감에는 제 손잡이가 따로 있다. 세계 위의 것은 물러난다. */
        sndBtn.classList.remove('is-on');
        codexBtn.classList.remove('is-fresh');
        await openCodex({
          trail: r.trail,
          onExit: () => goto('world'),
        });
      } else {
        setCodexTrail(r.trail, { restore: back });
      }
      return;
    }

    if (view === 'codex') {
      view = 'world';
      await closeCodex();
      hideNodes(false);
      if (sndBtn.getAttribute('aria-hidden') !== 'true') sndBtn.classList.add('is-on');
    }
  }
}

/** 아래 메뉴로 옮길 때. 도감에서 보던 길은 그대로 들고 간다.
    지금 어디인지는 기록만 보고 정한다. 화면은 그 뒤를 따라온다. */
function goto(next) {
  if (next === routeNow().view) return;
  pushRoute({ view: next, trail: codexTrail() });
}

startRoute(applyRoute);

nav.addEventListener('click', (e) => {
  const b = e.target.closest('.nav-item');
  if (b) goto(b.dataset.view);
});

/* 세계 쪽에서 '백과사전 열기' 를 골랐을 때 */
addEventListener('boida:goCodex', () => goto('codex'));

/* 오프닝을 건너뛰었으면 오프닝의 터치도 없다. 그때는 첫 손길이 소리를 연다. */
addEventListener('pointerdown', unlock, { once: true });
addEventListener('keydown', unlock, { once: true });

/* 소리 손잡이는 세계 위에도, 도감 아래에도 있다. 한쪽을 만지면 둘 다 따라온다. */
const paintSound = () => {
  sndBtn.classList.toggle('is-muted', isMuted());
  sndBtn.setAttribute('aria-pressed', String(!isMuted()));
  sndBtn.setAttribute('aria-label', isMuted() ? '소리 켜기' : '소리 끄기');
};
sndBtn.addEventListener('click', () => { unlock(); setMuted(!isMuted()); });
addEventListener('boida:sound', paintSound);
paintSound();

/* 틀 안에서는 vh 가 맞지 않는다. 무대 높이를 따로 내보낸다. */
syncStageUnits();
addEventListener('resize', syncStageUnits);
addEventListener('orientationchange', syncStageUnits);

async function start() {
  /* 도감에 새로 들어온 것이 있음을 아주 조용히 알린다 */
  mountWorld({ onStateChange: () => {
    if (solvedIds().length) codexBtn.classList.add('is-fresh');
  }});

  /* 지난번 자리가 있으면 오프닝을 다시 강요하지 않는다.
     초기화한 사람에게는 처음부터 보여 준다. */
  const been = solvedIds().length > 0 || anyResume(isSolved);
  const skip = location.hash.includes('skip') || been;

  if (skip) {
    document.getElementById('veil').style.opacity = '0';
    document.getElementById('world-layer').style.setProperty('--mr', '400vmax');
    document.getElementById('opening').remove();
  } else {
    await runOpening();
  }
  state.openingComplete = true;

  /* UI 는 세계가 자리를 잡은 뒤에야 조용히 올라온다 */
  await wait(skip ? 200 : 1200);
  nav.classList.add('is-on');
  nav.setAttribute('aria-hidden', 'false');
  sndBtn.classList.add('is-on');
  sndBtn.setAttribute('aria-hidden', 'false');

  wireNodes();

  /* 확인용 지름길: #from=seedWater 처럼 중간 노드부터 볼 수 있다. */
  const from = (location.hash.match(/from=([A-Za-z]+)/) || [])[1];
  if (from && NODES[from]) {
    NODE_ORDER.slice(0, NODE_ORDER.indexOf(from)).forEach(markSolved);
  }

  /* 지난번에 알아낸 것이 있으면 그 세계를 그대로 돌려놓는다.
     연출은 다시 틀지 않는다. */
  if (solvedIds().length) {
    await restoreWorld();
    codexBtn.classList.add('is-fresh');
    for (const id of availableIds()) await showNode(id, { delay: 400 });
    refreshResumeMarks();
    return;
  }

  /* 알아낸 것은 없지만 읽다 만 질문이 있는 경우 */
  if (anyResume(isSolved)) {
    for (const id of availableIds()) await showNode(id, { delay: 300 });
    refreshResumeMarks();
    return;
  }

  /* 세계가 완전히 드러난 뒤 잠시 아무 일도 일어나지 않는다 */
  await showNode('cloudWhite', { delay: skip ? 500 : 1900 });
}

start();
