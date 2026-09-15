/* 문서 전체가 공유하는 SVG 정의.
   판화의 선질, 인쇄 질감, 구름의 실루엣이 여기서 만들어진다. */

const DEFS = `
<svg id="art-defs" width="0" height="0" aria-hidden="true"
     style="position:absolute;width:0;height:0;overflow:hidden">
<defs>

  <!-- 손으로 그린 듯한 흔들림 (지형) -->
  <filter id="hand" x="-8%" y="-8%" width="116%" height="116%"
          filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.013"
                  numOctaves="2" seed="12" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="15"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>

  <!-- 작은 요소용 (바위, 잔풀) -->
  <filter id="hand-fine" x="-25%" y="-25%" width="150%" height="150%"
          color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.028 0.036"
                  numOctaves="2" seed="5" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="6"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>

  <!-- 물결 -->
  <filter id="hand-water" x="-12%" y="-12%" width="124%" height="124%"
          color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05"
                  numOctaves="2" seed="21" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="8"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>

  <!-- 골 그림자용 번짐 -->
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="19"/>
  </filter>

  <!-- 구름의 몸: 흩어진 원들을 하나의 실루엣으로 녹인다 -->
  <filter id="cloud-body" x="-32%" y="-60%" width="164%" height="220%"
          color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.009 0.021"
                  numOctaves="3" seed="31" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="30"
                       xChannelSelector="R" yChannelSelector="G" result="w"/>
    <feGaussianBlur in="w" stdDeviation="6" result="b"/>
    <feColorMatrix in="b" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 19 -8.6"/>
  </filter>

  <!-- 구름의 윤곽선: 실루엣에서 안쪽을 깎아 가는 테두리만 남긴다 -->
  <filter id="cloud-ink" x="-32%" y="-60%" width="164%" height="220%"
          color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.009 0.021"
                  numOctaves="3" seed="31" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="30"
                       xChannelSelector="R" yChannelSelector="G" result="w"/>
    <feGaussianBlur in="w" stdDeviation="6" result="b"/>
    <feColorMatrix in="b" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 19 -8.6" result="goo"/>
    <feMorphology in="goo" operator="erode" radius="1.1" result="er"/>
    <feComposite in="goo" in2="er" operator="out" result="rim"/>
    <feFlood flood-color="#7c765f" flood-opacity="0.52" result="c"/>
    <feComposite in="c" in2="rim" operator="in"/>
  </filter>

  <!-- 하늘 -->
  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#b3ccd9"/>
    <stop offset="34%"  stop-color="#c8d7d8"/>
    <stop offset="62%"  stop-color="#dfe0cd"/>
    <stop offset="86%"  stop-color="#eee0bd"/>
    <stop offset="100%" stop-color="#f3e6c4"/>
  </linearGradient>

  <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%"   stop-color="#fdf4dc" stop-opacity="0.95"/>
    <stop offset="26%"  stop-color="#f6e2a8" stop-opacity="0.55"/>
    <stop offset="58%"  stop-color="#f0d79a" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#f0d79a" stop-opacity="0"/>
  </radialGradient>

  <radialGradient id="sunDisc" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%"   stop-color="#fffbef"/>
    <stop offset="70%"  stop-color="#fdf2d4"/>
    <stop offset="100%" stop-color="#f6e2a8"/>
  </radialGradient>

  <radialGradient id="rayFade" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%"   stop-color="#fff" stop-opacity="0.9"/>
    <stop offset="40%"  stop-color="#fff" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>

  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#e7e0c4"/>
    <stop offset="22%"  stop-color="#cfdcd9"/>
    <stop offset="100%" stop-color="#aec6cd"/>
  </linearGradient>

  <!-- 젖은 땅 -->
  <linearGradient id="wetGrad" gradientUnits="userSpaceOnUse" x1="0" y1="1140" x2="0" y2="2050">
    <stop offset="0%"   stop-color="#6d7f74" stop-opacity="0"/>
    <stop offset="38%"  stop-color="#63776c" stop-opacity="0.26"/>
    <stop offset="100%" stop-color="#4f6559" stop-opacity="0.48"/>
  </linearGradient>

  <!-- 판화 해칭 -->
  <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse"
           patternTransform="rotate(40)">
    <line x1="0" y1="0" x2="0" y2="9" stroke="#2f2e27" stroke-width="1.15"/>
  </pattern>
  <pattern id="hatch-fine" width="6" height="6" patternUnits="userSpaceOnUse"
           patternTransform="rotate(-32)">
    <line x1="0" y1="0" x2="0" y2="6" stroke="#2f2e27" stroke-width="0.8"/>
  </pattern>

</defs>
</svg>`;

let installed = false;

export function installDefs() {
  if (installed) return;
  document.body.insertAdjacentHTML('afterbegin', DEFS);
  installed = true;
}
