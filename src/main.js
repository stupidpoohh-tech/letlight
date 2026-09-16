/* 보이ㄷㅏ — Let There Be Light
   First Playable Prototype

   알수록 보이ㄷㅏ */

import { wait } from './core/anim.js';
import { syncStageUnits } from './core/stage.js';
import { state, solvedIds, availableIds, markSolved } from './core/state.js';
import { NODES, NODE_ORDER } from './data/nodes.js';
import { runOpening } from './scenes/opening.js';
import { mountWorld, showNode, wireNodes, hideNodes, restoreWorld } from './scenes/world.js';
import { openCodex, closeCodex } from './scenes/codex.js';
import { unlock, isMuted, setMuted } from './core/sound.js';

const nav = document.getElementById('nav');
const sndBtn = document.getElementById('sound-toggle');
const navItems = [...nav.querySelectorAll('.nav-item')];
const codexBtn = navItems.find((b) => b.dataset.view === 'codex');

let view = 'world';
let switching = false;

async function goto(next) {
  if (switching || next === view) return;
  switching = true;
  navItems.forEach((b) => b.classList.toggle('is-active', b.dataset.view === next));

  if (next === 'codex') {
    view = 'codex';
    hideNodes(true);
    /* 도감에는 제 손잡이가 따로 있다. 세계 위의 것은 물러난다. */
    sndBtn.classList.remove('is-on');
    codexBtn.classList.remove('is-fresh');
    await openCodex({ onExit: () => { switching = false; goto('world'); } });
  } else {
    view = 'world';
    await closeCodex();
    hideNodes(false);
    if (sndBtn.getAttribute('aria-hidden') !== 'true') sndBtn.classList.add('is-on');
  }
  switching = false;
}

nav.addEventListener('click', (e) => {
  const b = e.target.closest('.nav-item');
  if (b) goto(b.dataset.view);
});

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

  const skip = location.hash.includes('skip');

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
    if (solvedIds().length) codexBtn.classList.add('is-fresh');
    for (const id of availableIds()) await showNode(id, { delay: 400 });
    return;
  }

  /* 세계가 완전히 드러난 뒤 잠시 아무 일도 일어나지 않는다 */
  await showNode('cloudWhite', { delay: skip ? 500 : 1900 });
}

start();
