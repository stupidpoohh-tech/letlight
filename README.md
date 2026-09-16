# 보이ㄷㅏ — Let There Be Light

> 알수록 보이ㄷㅏ

모바일 지식 탐험 게임의 **First Playable Prototype**.

이 프로토타입이 확인하려는 것은 하나다.

> 질문을 푼다 → 지식을 읽는다 → 세계가 실제로 변한다 → 새 질문이 열린다
>
> 이 루프가 재미있는가?

---

## 실행

빌드 도구가 없다. 정적 파일을 그대로 띄우면 된다.
(ES 모듈이라 `file://` 로는 열 수 없고, 서버가 하나 필요하다.)

```bash
npx http-server -p 8080 -c-1 .
# 또는
python3 -m http.server 8080
```

세로 화면 기준이다. 데스크톱 브라우저라면
개발자도구의 기기 모드(390 × 844 정도)로 보는 것을 권한다.

| 주소 | 하는 일 |
|---|---|
| `/` | 처음부터 (오프닝 포함) |
| `/#skip` | 오프닝을 건너뛰고 세계에서 시작 |
| `/#skip&from=seedWater` | 앞 노드를 풀린 것으로 두고 씨앗 노드부터 |
| `/#skip&from=plantGrowth` | 식물 노드부터 |

`from=` 은 확인용 지름길이다. 앞선 세계 변화(구름 · 비)는 재생하지 않는다.

진행 상황은 저장하지 않는다. 새로고침하면 언제나 처음부터다.
첫 경험을 반복해서 검증하는 것이 목적이기 때문이다.

---

## 구현한 플레이 흐름

```
Opening → World Reveal → Node 1 → Cloud Appears → Node 2 → Rain Falls
```

1. **오프닝** — 완전한 검정 → `빛이 있으라.` → `빛은 입자이면서 파동이다.`
2. **최초의 빛** — `빛은 입자이면서 파동이다.` 를 누르면
   그 자리에서 점 하나가 생기고 퍼진다. 플레이어의 터치가 최초의 관측이다
3. **세계 reveal** — 검정 → 광원 → 지평선 실루엣 → 지형 → 질감 → 색
   (한 번에 밝아지지 않는다. 빛이 세계를 발견해 간다)
4. **첫 월드** — 하늘 / 지평선 / 둥근 지형 / 땅. 구름도 비도 식물도 없다
5. **Node 1** — 하늘의 빈 자리에 `구름은 왜 흰색으로 보일까?` 가 떠오른다
6. **문제** — 4지선다. 고른 뒤 바로 판정하지 않고 아주 짧게 멈춘다.
   오답은 왜 아닌지 한 줄만 일러 주고 다시 고를 수 있다. 목숨도 점수도 없다
7. **지식** — 세계 위로 글 한 편이 올라온다. 다 읽고 `세계로 돌아가기`
8. **세계의 변화 ①** — 하늘 한 부분이 옅어지고, 안개 같은 형태가 모여
   흰 구름 하나가 된다. 그리고 아주 천천히 흐르기 시작한다
9. **Node 2** — 구름 아래에 `구름은 물로 이루어져 있는데,
   왜 처음부터 비가 내리지는 않을까?`
10. **세계의 변화 ②** — 구름의 밀도가 조금 높아지고, 안에서 무언가 움직이고,
    첫 물방울 하나 → 드문 몇 방울 → 일정한 비 → 땅이 젖는다
11. **Node 3** — 젖은 땅 위에 마른 씨앗 하나가 놓이고
    `씨앗은 물을 만나면 왜 깨어날까?`
12. **세계의 변화 ③** — 씨앗이 부풀고 → 씨껍질이 갈라지고 →
    배근이 아래로 나오고 → 싹이 지면 위로 올라온다
13. **Node 4** — `우리는 먹어야 살 수 있는데,
    식물은 어떻게 흙과 물, 빛만으로 자랄까?`
14. **세계의 변화 ④** — 바깥의 빛이 식물에 닿고 첫 잎이 펼쳐진다
15. **끝 상태** — 하늘 / 지형 / 구름 / 비 / 젖은 땅 / 첫 잎이 펼쳐진 식물
16. **백과사전** — 네 편의 글을 언제든 다시 열람할 수 있다

---

## 그림

세계와 구름은 저장소 루트에 올린 원본 그림을 쓴다.

| 원본 | 쓰는 곳 |
|---|---|
| `home.png` | 세계 배경 |
| `cloud3.png` | 세계에 나타나는 구름, 구름 도판 |
| `cloud4.png` | 비 도판 |
| `cloud1·2·5.png` | 아직 안 씀. 변환만 해 둔다 |

씨앗에서 첫 잎까지는 아직 원본이 없다. 루트에 아래 PNG 를 올리고
`tools/build-assets.py` 를 돌리면 `assets/` 에 같은 이름의 webp 가 생기고
바로 연결된다. 투명 배경 PNG 를 권한다.

| 올릴 원본 | 만들어지는 것 | 쓰이는 순간 |
|---|---|---|
| `seed-dry.png` | `assets/seed-dry.webp` | 비가 그친 뒤 땅에 놓이는 마른 씨앗 |
| `seed-swollen.png` | `assets/seed-swollen.webp` | 물을 흡수해 부푼 씨앗 |
| `seed-cracked.png` | `assets/seed-cracked.webp` | 씨껍질이 갈라진 씨앗 |
| `seed-radicle.png` | `assets/seed-radicle.webp` | 배근이 아래로 나온 씨앗 |
| `sprout.png` | `assets/sprout.webp` | 지면 위로 올라온 싹 |
| `plant-first-leaves.png` | `assets/plant-first-leaves.webp` | 첫 잎이 펼쳐진 식물 |

모두 같은 지점에 심긴 것처럼 아래를 기준으로 겹쳐 그려진다.
그림이 아직 없으면 그 단계는 보이지 않고, 흐름과 진행은 그대로 흐른다.

`home.png` 는 시안이라 상태바 · 톱니바퀴 · 하단바가 함께 그려져 있다.
`tools/build-assets.py` 가 위쪽 UI 를 지우고 아래쪽 하단바를 잘라 낸 뒤
`assets/` 에 webp 로 저장한다. 시안의 하단바 자리는 게임의 하단바가 덮는다.

원본을 다시 올린 뒤에는 다시 돌려야 한다.

```bash
pip install Pillow
python3 tools/build-assets.py
```

`assets/` 만 화면에 쓰인다. 루트의 원본 PNG 는 아무 데서도 읽지 않는다.

---

## 구조

```
index.html              무대(stage) 뼈대
_headers                Cloudflare Pages 캐시 설정
home.png, cloudN.png    올린 원본 그림
assets/                 그것을 게임용으로 줄인 것 (webp)
fonts/                  쓰는 글자만 남긴 본문 웹폰트
tools/
  build-assets.py       원본 그림 → assets/
  subset-font.py        쓰는 글자만 남긴 폰트 만들기
styles/
  tokens.css            색 · 서체 · 리듬
  app.css               화면 전체
src/
  main.js               전체 진행과 하단 이동
  core/
    rng.js              시드 난수
    anim.js             tween / easing / loop
    state.js            world state — 노드 상태, 구름, 비
    sheet.js            시트 열고 닫기
  data/
    nodes.js            content — 질문 · 문제 · 지식 · 세계의 변화
  art/
    cloud.js            구름 — 형성 · 표류 · 밀도 · 뒤척임
    rain.js             비
    plates.js           백과사전 도판
  scenes/               presentation
    opening.js          오프닝 연출 전체
    world.js            노드 배치와 세계의 변화
    quiz.js             4지선다
    article.js          지식 (세계 위로 올라오는 글)
    codex.js            백과사전
```

`content(nodes.js)` · `world state(state.js)` · `presentation(scenes/)` 세 층만 나눠 두었다.
노드를 하나 더하려면 `nodes.js` 에 항목을 쓰고,
새 세계 변화가 필요하면 `art/` 에 그림 하나와 `world.js` 의 `EFFECTS` 에 한 줄을 더하면 된다.

### 속도

모든 연출의 속도는 손잡이 하나로 조절한다.

- `src/core/anim.js` 의 `RATE`
- `styles/tokens.css` 의 `--rate`

두 값은 **같아야 한다**. `RATE` 는 `tween()` 과 `wait()` 의 시간을 곱하고,
`--rate` 는 CSS 의 `transition-duration` 을 `calc()` 로 곱한다.
JS 가 CSS 전환이 끝나기를 기다리는 자리가 있어서, 둘이 어긋나면 타이밍이 틀어진다.

현재 `0.74`. 1 이 원래 속도이고, 작을수록 빠르다.

### 구름이 만들어지는 방식

그림 한 장을 그냥 띄우지 않는다.
같은 그림을 여러 겹 겹쳐 두고 겹마다 다르게 움직인다.

- **형성** — 흩어진 조각 세 개가 흐릿하게 떠 있다가 가운데로 모여들고,
  그동안 본체가 흐림 → 또렷함으로 밀도를 올린다
- **표류** — 다 만들어진 뒤 아주 느리게 흐른다 (초당 2px 남짓)
- **밀도** — 비가 오기 직전, 어둡게 보정한 겹이 아주 약간 올라온다
- **뒤척임** — 밝게 보정한 겹이 1% 안쪽으로 흔들려 안에서 뭔가 움직이는 느낌을 준다

비는 CSS 로만 떨어진다. transform 만 움직이므로 프레임을 잡아먹지 않는다.

---

## 무게

한 번 무거워졌다가 줄인 기록이다.

| | 절차 생성 SVG 시절 | 지금 (그림) |
|---|---|---|
| 전송량 | 451 KB | **378 KB** |
| 요청 수 | 30 | **21** (외부 요청 0) |
| 스타일시트 | 190 KB | **18 KB** |
| 서체 | 372 KB | **98 KB** |
| 프레임 (CPU 4배 조임) | 33.4 ms | **16.7 ms** |

세 가지가 원인이었다.

**서체.** Google Fonts 의 한글 웹폰트는 유니코드 구간별로 120개 남짓 쪼개져 있어서,
그 목록을 담은 CSS 만 172 KB 였다. 그 CSS 가 렌더링을 막고 있었다.
지금은 게임에 실제로 나오는 글자만 잘라 내 `fonts/` 에 직접 두고, 외부 요청을 없앴다.

```bash
pip install fonttools brotli
python3 tools/subset-font.py    # 글을 고치면 다시 돌린다
```

없는 글자는 기기 서체로 대체되므로, 깜빡해도 화면이 깨지지는 않는다.

**필터.** 지형을 SVG 로 그리던 시절, 겹마다 `feTurbulence` 를 걸어
같은 난류를 스물몇 번 계산하고 있었다.
배경이 그림 한 장이 되면서 이 비용은 통째로 사라졌다.

**그림.** 원본 2.2 MB PNG 를 1180px webp 로 줄여 170 KB 로 만들었다.
휴대폰에서 필요한 해상도(약 1090px)에 맞춘 크기다.

---

## 배포 (Cloudflare Pages)

빌드가 없으므로 저장소를 그대로 올리면 된다.

1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → `stupidpoohh-tech/letlight` 선택
2. 빌드 설정

   | 항목 | 값 |
   |---|---|
   | Framework preset | `None` |
   | Build command | *(비워 둔다)* |
   | Build output directory | `/` |
   | Production branch | `claude/boidda-first-playable-sf7fuw` |

3. **Save and Deploy**

`https://<프로젝트명>.pages.dev` 가 나온다.
이후 이 브랜치에 푸시할 때마다 자동으로 다시 배포된다.

---

## 이번 범위 밖

로그인 · 서버 · 저장 · 결제 · 업적 · 레벨 · XP · 코인 · 소셜 ·
AI 생성 · CMS · 식물 · 추가 지식 노드는 만들지 않았다.

placeholder 로 남은 것:

- **씨앗 · 식물 그림** — 위 표의 여섯 장. 올라오기 전까지는
  해당 단계가 보이지 않고 도감 도판은 빈 틀로 남는다
- **다음 노드** — `plantGrowth` 다음은 아직 정하지 않았다
- **서체** — Freesentation 은 `--font-ui` 스택 맨 앞에 두었다.
  기기에 설치되어 있으면 잡히고, 없으면 기기 기본 고딕으로 내려간다
- **저장 없음** — 새로고침하면 처음부터다
