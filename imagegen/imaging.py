"""Pure image helpers: size parsing, generation-size rounding, and post-processing
(cover-resize + format/quality encode). No network, no Ollama — unit-tested."""
from __future__ import annotations

import io
import re

from PIL import Image

from imagegen.config import GEN_MULTIPLE, MAX_GEN_DIM

_SIZE_RE = re.compile(r"^\s*(\d+)\s*[x×]\s*(\d+)\s*$")

FORMATS = ("png", "webp", "jpg", "jpeg")


def parse_size(text: str) -> tuple[int, int]:
    """'1000x560' -> (1000, 560). Accepts 'x' or '×'. Raises on bad input."""
    m = _SIZE_RE.match(text or "")
    if not m:
        raise ValueError(f"Bad size '{text}'. Expected WxH, e.g. 1000x560.")
    w, h = int(m.group(1)), int(m.group(2))
    if w <= 0 or h <= 0:
        raise ValueError(f"Size must be positive, got {w}x{h}.")
    return w, h


def gen_size(
    target_w: int,
    target_h: int,
    max_dim: int = MAX_GEN_DIM,
    multiple: int = GEN_MULTIPLE,
) -> tuple[int, int]:
    """Pick the size to *request* from Ollama for a desired final size.

    Scales so the longest side is <= max_dim, then rounds each side to the nearest
    multiple of `multiple` (>= multiple). The final exact size is reached later by
    post-processing (cover-resize). Aspect ratio is preserved approximately.
    """
    longest = max(target_w, target_h)
    scale = min(1.0, max_dim / longest)

    def snap(v: float) -> int:
        return max(multiple, int(round(v * scale / multiple)) * multiple)

    return snap(target_w), snap(target_h)


def _cover_resize(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Scale to fully cover tw×th, then center-crop to exactly tw×th."""
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(tw, round(sw * scale)), max(th, round(sh * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def _encode(img: Image.Image, fmt: str, quality: int) -> bytes:
    fmt = fmt.lower()
    if fmt not in FORMATS:
        raise ValueError(f"Unsupported format '{fmt}'. Use one of {FORMATS}.")
    out = io.BytesIO()
    if fmt in ("jpg", "jpeg"):
        # JPEG has no alpha — flatten onto white (matches site light surfaces).
        bg = Image.new("RGB", img.size, (255, 255, 255))
        alpha = img.split()[-1] if img.mode == "RGBA" else None
        bg.paste(img.convert("RGB") if alpha is None else img, mask=alpha)
        bg.save(out, "JPEG", quality=quality)
    elif fmt == "webp":
        img.save(out, "WEBP", quality=quality)
    else:  # png
        img.save(out, "PNG")
    return out.getvalue()


def postprocess(
    png_bytes: bytes,
    target_w: int,
    target_h: int,
    fmt: str,
    quality: int = 90,
) -> bytes:
    """Resize raw model PNG bytes to an exact target size + encode to fmt.

    Cover-crops to the exact target (no distortion). Keeps alpha for png/webp,
    flattens onto white for jpg.
    """
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    img = _cover_resize(img, target_w, target_h)
    return _encode(img, fmt, quality)


def image_dims(data: bytes) -> tuple[int, int]:
    """(width, height) of encoded image bytes."""
    return Image.open(io.BytesIO(data)).size
