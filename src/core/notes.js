/* 한 번만 하는 안내.

   조작을 처음 만나는 자리에만 짧게 붙이고, 본 뒤로는 다시 꺼내지 않는다.
   내용이 아니라 조작에 대한 안내만 여기에 들어간다. */

const KEY = 'boida.notes.v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (e) {
    return {};
  }
}

let held = null;
const all = () => (held || (held = read()));

export const seen = (id) => Boolean(all()[id]);

export function markSeen(id) {
  if (seen(id)) return;
  all()[id] = true;
  try { localStorage.setItem(KEY, JSON.stringify(all())); } catch (e) { /* 저장 없이 간다 */ }
}

export function clearNotes() {
  held = {};
  try { localStorage.removeItem(KEY); } catch (e) { /* 위와 같다 */ }
}
