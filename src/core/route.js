/* 어디를 보고 있는가 — 한 군데에서만 정한다.

   화면을 바꾸는 길이 여럿이면(아래 메뉴, 도감 안의 뒤로, 기기의 뒤로 가기)
   같은 이동이 두 번 일어나거나 서로 어긋나기 쉽다.
   그래서 '지금 어디' 는 여기 하나만 들고 있고, 화면은 그것을 따라 그린다.

   기록 한 칸의 모양:

     { n, view, trail }

     n      우리가 쌓은 칸의 번호. 0 이면 처음 들어온 자리다.
     view   'world' | 'codex'
     trail  도감 안에서 지나온 길 — [{ screen, arg }, …]

   길을 통째로 들고 다니므로, 뒤로도 앞으로도 그 칸이 적힌 대로 그리면 된다.
   몇 칸을 건너뛰어도 셈을 다시 할 일이 없다.

   주소는 건드리지 않는다. `#skip`, `#from=`, `#reset` 은 페이지를 처음 열 때
   한 번 읽는 것이라, 기록을 오가도 다시 실행되지 않는다. */

let current = { n: 0, view: 'world', trail: [] };
let apply = null;
let live = false;

const same = (a, b) =>
  a.view === b.view && JSON.stringify(a.trail) === JSON.stringify(b.trail);

function onPop(e) {
  const s = e.state && e.state.boida;
  /* 우리 기록이 아니면 손대지 않는다. 브라우저가 제 갈 길을 간다. */
  if (!s || !apply) return;
  current = s;
  apply(s, { back: true });
}

/** @param {Function} fn  기록 한 칸을 화면에 반영하는 함수 */
export function startRoute(fn) {
  apply = fn;
  live = true;
  try {
    history.replaceState({ boida: current }, '');
    addEventListener('popstate', onPop);
  } catch (e) {
    /* 기록을 쓸 수 없는 자리에서도 앱은 그대로 돈다. 뒤로 가기만 빠진다. */
    live = false;
  }
}

export const routeNow = () => current;

/** 새 자리로 간다. 같은 자리면 기록을 늘리지 않는다. */
export function pushRoute(next) {
  const to = { n: current.n + 1, view: next.view, trail: next.trail || [] };
  if (same(to, current)) return false;
  current = to;
  if (live) { try { history.pushState({ boida: to }, ''); } catch (e) { /* 위와 같다 */ } }
  apply && apply(to, { back: false });
  return true;
}

/** 지금 칸의 내용만 고쳐 쓴다. 기록은 늘지 않는다. */
export function replaceRoute(next) {
  const to = { n: current.n, view: next.view, trail: next.trail || [] };
  if (same(to, current)) { current = to; return; }
  current = to;
  if (live) { try { history.replaceState({ boida: to }, ''); } catch (e) { /* 위와 같다 */ } }
}

/** 한 칸 뒤로. 우리가 쌓은 것이 없으면 기록을 건드리지 않고 그냥 알린다. */
export function backRoute(fallback) {
  if (live && current.n > 0) { history.back(); return true; }
  fallback && fallback();
  return false;
}
