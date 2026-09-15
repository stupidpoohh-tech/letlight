/* 결정적 난수 — 같은 시드는 언제나 같은 세계를 만든다.
   손으로 그린 듯한 흔들림은 무작위처럼 보이되 매번 같아야 한다. */

export function makeRng(seed = 20260915) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** [min, max) 구간의 실수 */
export const between = (rng, min, max) => min + rng() * (max - min);

/** 부드러운 1차원 값잡음. 능선의 기복에 쓴다. */
export function makeNoise(seed = 7) {
  const rng = makeRng(seed);
  const table = Array.from({ length: 256 }, () => rng());
  const fade = (t) => t * t * (3 - 2 * t);
  return function noise(x) {
    const i = Math.floor(x);
    const f = x - i;
    const a = table[((i % 256) + 256) % 256];
    const b = table[(((i + 1) % 256) + 256) % 256];
    return a + (b - a) * fade(f);
  };
}

/** 여러 옥타브를 겹쳐 자연스러운 기복을 만든다 */
export function fbm(noise, x, octaves = 3) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}
