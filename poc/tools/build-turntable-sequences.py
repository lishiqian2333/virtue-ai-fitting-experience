from __future__ import annotations

import os
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path

from PIL import Image

os.environ.setdefault("NUMBA_DISABLE_JIT", "1")

from rembg import new_session, remove


ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "video"
OUTPUT_DIR = ROOT / "assets" / "seq"
VIDEO_MAP = {
    "r1": "V-R1.mp4",
    "r2": "V-R2.mp4",
    "h1": "V-H1.mp4",
    "h2": "V-H2.mp4",
    "s1": "V-S1.mp4",
    "s2": "V-S2.mp4",
}
FRAME_COUNT = 60
CANVAS_SIZE = (427, 640)


def extract_frames(video: Path, output: Path) -> list[Path]:
    pattern = output / "%03d.png"
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(video),
            "-vf",
            "fps=12",
            "-frames:v",
            str(FRAME_COUNT),
            str(pattern),
        ],
        check=True,
    )
    return sorted(output.glob("*.png"))


def subject_cutout(source: Path, session) -> Image.Image:
    result = remove(source.read_bytes(), session=session)
    return Image.open(BytesIO(result)).convert("RGBA")


def union_bbox(images: list[Image.Image]) -> tuple[int, int, int, int]:
    boxes = [image.getchannel("A").getbbox() for image in images]
    valid = [box for box in boxes if box is not None]
    if not valid:
        raise RuntimeError("No foreground subject detected")
    return (
        min(box[0] for box in valid),
        min(box[1] for box in valid),
        max(box[2] for box in valid),
        max(box[3] for box in valid),
    )


def normalize_frame(image: Image.Image, bbox: tuple[int, int, int, int]) -> Image.Image:
    cropped = image.crop(bbox)
    max_width, max_height = CANVAS_SIZE[0] - 20, CANVAS_SIZE[1] - 10
    scale = min(max_width / cropped.width, max_height / cropped.height)
    resized = cropped.resize(
        (round(cropped.width * scale), round(cropped.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = (CANVAS_SIZE[0] - resized.width) // 2
    y = CANVAS_SIZE[1] - resized.height
    canvas.alpha_composite(resized, (x, y))
    return canvas


def build_sequence(key: str, filename: str, session) -> None:
    target = OUTPUT_DIR / key
    target.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"turntable-{key}-") as temporary:
        raw_frames = extract_frames(VIDEO_DIR / filename, Path(temporary))
        cutouts = [subject_cutout(frame, session) for frame in raw_frames]
        bbox = union_bbox(cutouts)
        for index, cutout in enumerate(cutouts, 1):
            normalized = normalize_frame(cutout, bbox)
            normalized.save(
                target / f"{index:03d}.webp",
                "WEBP",
                quality=82,
                method=6,
            )
    print(f"{key}: generated {len(cutouts)} frames in {target}")


def main() -> None:
    session = new_session("u2net_human_seg")
    for key, filename in VIDEO_MAP.items():
        build_sequence(key, filename, session)


if __name__ == "__main__":
    main()
