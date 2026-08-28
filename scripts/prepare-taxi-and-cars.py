"""Cut the hero taxi PNG and restyle fleet photos as Indian cars on white."""
from __future__ import annotations

import io
import json
import shutil
import urllib.parse
import urllib.request
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(r"D:\STT")
IMG = ROOT / "assets" / "img"
CREDITS = IMG / "credits.json"
UA = "SamriddhiToursSiteBuilder/1.0 (local static site; contact via site footer)"

SRC_TAXI = Path(
    r"C:\Users\aloks\.cursor\projects\d-STT\assets"
    r"\c__Users_aloks_AppData_Roaming_Cursor_User_workspaceStorage"
    r"_9a8272216ea076e14741da06c927f2f9_images_car-1-c79f055e-08d1-43c2-88b5-577ad9fd3bf5.png"
)

CARS = {
    "car-dzire.jpg": "Maruti Suzuki Dzire VXi VVT - Subcompact Car - Kolkata 2018-01-17 7574.JPG",
    "car-ertiga.jpg": "Maruti Suzuki Ertiga(2).jpg",
    "car-innova.jpg": "Toyota Innova Crysta 2.4 GX (India) (1).jpg",
    "car-crysta.jpg": "Toyota Innova Crysta 2.4 Z front right.jpg",
    "car-scorpio.jpg": "Mahindra Scorpio Classic S11 2WD (1).jpg",
    "car-city.jpg": "Honda City 2020.jpg",
    "car-tempo.jpg": "Force Traveller Luxury.jpg",
    "car-bus.jpg": "Force Traveller 26 Seater.jpg",
    "car-fortuner.jpg": "Toyota Fortuner 2.8 4x4 AT (India) front view.jpg",
    "car-luxury.jpg": "2018 Toyota Camry XLE, Front Left, 10-11-2020.jpg",
}

FALLBACK = {
    "car-innova.jpg": "Toyota Innova Crysta 2.4 Z front right.jpg",
    "car-scorpio.jpg": "Mahindra Scorpio-N Z8L 4WD (3).jpg",
    "car-bus.jpg": "Force Traveller Luxury.jpg",
    "car-fortuner.jpg": "Toyota Fortuner (AN160) 2.8 GD-6 4x4 (2015-11-06).jpg",
    "car-luxury.jpg": "Toyota Camry Hybrid (XV70) 2019.jpg",
}


def flood_cut_black(im: Image.Image, thresh: int = 28) -> Image.Image:
    """Make near-black pixels connected to the edges transparent."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    seen = bytearray(w * h)
    q = deque()

    def dark(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and r <= thresh and g <= thresh and b <= thresh

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not dark(x, y):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return rgba


def bbox_opaque(im: Image.Image, pad: int = 12) -> Image.Image:
    alpha = im.split()[-1]
    box = alpha.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def fetch_commons(title: str, dest: Path) -> bool:
    url = (
        "https://commons.wikimedia.org/wiki/Special:FilePath/"
        + urllib.parse.quote(title)
        + "?width=1800"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            data = res.read()
        if len(data) < 20_000:
            print("  tiny", title, len(data))
            return False
        dest.write_bytes(data)
        print("  saved", dest.name, len(data))
        return True
    except Exception as e:
        print("  fail", title, e)
        return False


SESSION = None


def get_session():
    global SESSION
    if SESSION is None:
        from rembg import new_session

        SESSION = new_session("u2netp")
    return SESSION


def cut_subject(path: Path) -> Image.Image:
    try:
        from rembg import remove

        cut = Image.open(
            io.BytesIO(remove(path.read_bytes(), session=get_session()))
        ).convert("RGBA")
        print("  rembg", path.name)
        return cut
    except Exception as e:
        print("  rembg skip", path.name, e)
        return flood_cut_black(Image.open(path).convert("RGBA"))

def to_white_studio(src: Path, dest: Path) -> None:
    cut = bbox_opaque(cut_subject(src), pad=20)
    canvas_w, canvas_h = 1600, 1000
    canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    max_w, max_h = int(canvas_w * 0.86), int(canvas_h * 0.78)
    ratio = min(max_w / cut.width, max_h / cut.height)
    nw, nh = max(1, int(cut.width * ratio)), max(1, int(cut.height * ratio))
    cut = cut.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (canvas_w - nw) // 2
    y = canvas_h - nh - 70
    canvas.paste(cut, (x, y), cut)
    canvas.save(dest, "JPEG", quality=88, optimize=True)
    print("  white", dest.name, dest.stat().st_size)


def copy_varanasi() -> None:
    pairs = {
        "hero-4.jpg": "about-boat.jpg",
        "cta-road.jpg": "page-about.jpg",
        "page-packages.jpg": "hero-2.jpg",
        "page-fleet.jpg": "hero-1.jpg",
    }
    credits = json.loads(CREDITS.read_text(encoding="utf-8"))
    by_file = {c["file"]: c for c in credits}
    for dest, src in pairs.items():
        shutil.copyfile(IMG / src, IMG / dest)
        if src in by_file:
            row = dict(by_file[src])
            row["file"] = dest
            by_file[dest] = row
        print("copied", src, "->", dest)
    CREDITS.write_text(json.dumps(list(by_file.values()), indent=2), encoding="utf-8")


def main() -> None:

    IMG.mkdir(parents=True, exist_ok=True)
    copy_varanasi()

    taxi = bbox_opaque(cut_subject(SRC_TAXI), pad=8)
    out_png = IMG / "taxi-hero.png"
    taxi.save(out_png, "PNG")
    print("taxi-hero", taxi.size, out_png.stat().st_size)

    tmp = IMG / "_car-src"
    tmp.mkdir(exist_ok=True)
    for dest_name, title in CARS.items():
        raw = tmp / dest_name.replace(".jpg", "-raw.jpg")
        ok = fetch_commons(title, raw)
        if not ok and dest_name in FALLBACK:
            ok = fetch_commons(FALLBACK[dest_name], raw)
        if not ok:
            print("KEEP existing", dest_name)
            src = IMG / dest_name
            if src.exists():
                to_white_studio(src, IMG / dest_name)
            continue
        to_white_studio(raw, IMG / dest_name)

    print("done")


if __name__ == "__main__":
    main()
