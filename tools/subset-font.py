#!/usr/bin/env python3
"""게임에 실제로 쓰이는 글자만 남긴 웹폰트를 만든다.

한글 웹폰트는 통째로 받으면 수백 KB다. 이 프로토타입에 나오는 글자는
천 자가 되지 않으므로, 쓰는 글자만 잘라 내면 몇십 KB로 줄어든다.

콘텐츠를 고친 뒤에는 다시 돌려야 한다:

    python3 tools/subset-font.py
"""

import io, re, sys, urllib.request
from pathlib import Path
from fontTools.subset import main as pyftsubset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "fonts"

# fonts.gstatic.com 이 내주는 ttf 는 라틴 전용이다. 한글이 든 원본은 저장소에 있다.
REPO = "https://raw.githubusercontent.com/google/fonts/main/ofl/gowunbatang"
SOURCES = {
    400: f"{REPO}/GowunBatang-Regular.ttf",
    700: f"{REPO}/GowunBatang-Bold.ttf",
}
LICENSE = f"{REPO}/OFL.txt"

BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.S)
LINE_COMMENT = re.compile(r"(?m)^\s*//.*$")
HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
HTML_TAG = re.compile(r"<[^>]+>", re.S)

# 항상 포함할 것들
ALWAYS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    " .,?!:;'\"()[]{}/\\-–—…·«»‘’“”→←↑↓%℃°+=&#*@~|"
)


def collect() -> set:
    chars = set(ALWAYS)

    for path in sorted((ROOT / "src").rglob("*.js")):
        text = path.read_text(encoding="utf-8")
        text = BLOCK_COMMENT.sub(" ", text)     # 주석의 한글은 화면에 안 나온다
        text = LINE_COMMENT.sub(" ", text)
        chars |= set(text)

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = HTML_COMMENT.sub(" ", html)
    html = HTML_TAG.sub(" ", html)
    chars |= set(html)

    # 화면에 나올 수 없는 것은 뺀다
    return {c for c in chars if c.isprintable() and not c.isspace()}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=180).read()


def main():
    OUT.mkdir(exist_ok=True)
    chars = collect()
    hangul = sum(1 for c in chars if "가" <= c <= "힣")
    print(f"글자 {len(chars)}자 (한글 음절 {hangul}자)")

    total = 0
    for weight, url in SOURCES.items():
        src = OUT / f".gowun-{weight}.ttf"
        if not src.exists():
            print(f"  내려받는 중 … {weight}")
            src.write_bytes(fetch(url))

        dst = OUT / f"gowun-batang-{weight}.woff2"
        pyftsubset([
            str(src),
            f"--text={''.join(sorted(chars))}",
            "--flavor=woff2",
            "--layout-features=kern,liga,calt",
            "--no-hinting",
            "--desubroutinize",
            f"--output-file={dst}",
        ])
        kb = dst.stat().st_size / 1024
        total += kb
        print(f"  {dst.name}  {kb:.1f} KB  (원본 {src.stat().st_size/1024/1024:.1f} MB)")
        src.unlink()

        with TTFont(dst) as f:
            n = sum(1 for c in f.getBestCmap() if 0xAC00 <= c <= 0xD7A3)
        if n < hangul * 0.9:
            sys.exit(f"한글 글리프가 {n}자뿐입니다. 원본이 잘못됐습니다.")

    lic = OUT / "OFL.txt"
    if not lic.exists():
        lic.write_bytes(fetch(LICENSE))

    print(f"합계 {total:.1f} KB")


if __name__ == "__main__":
    main()
