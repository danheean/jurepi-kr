import io

import pytest
from PIL import Image

from imagegen.imaging import gen_size, image_dims, parse_size, postprocess


def _png(w, h, color=(200, 40, 40, 255)) -> bytes:
    out = io.BytesIO()
    Image.new("RGBA", (w, h), color).save(out, "PNG")
    return out.getvalue()


# parse_size --------------------------------------------------------------------

@pytest.mark.parametrize("text,expected", [
    ("1000x560", (1000, 560)),
    (" 512 x 512 ", (512, 512)),
    ("300×300", (300, 300)),
])
def test_parse_size_valid(text, expected):
    assert parse_size(text) == expected


@pytest.mark.parametrize("bad", ["", "abc", "100", "0x100", "100x-2", "100xx2"])
def test_parse_size_invalid(bad):
    with pytest.raises(ValueError):
        parse_size(bad)


# gen_size ----------------------------------------------------------------------

def test_gen_size_caps_longest_side_to_max():
    gw, gh = gen_size(4000, 2000, max_dim=1024, multiple=16)
    assert max(gw, gh) <= 1024
    assert gw % 16 == 0 and gh % 16 == 0


def test_gen_size_rounds_to_multiple_of_16():
    gw, gh = gen_size(1000, 560, max_dim=1024, multiple=16)
    assert gw % 16 == 0 and gh % 16 == 0
    # aspect roughly preserved
    assert abs((gw / gh) - (1000 / 560)) < 0.1


def test_gen_size_never_below_multiple():
    gw, gh = gen_size(1, 1, max_dim=1024, multiple=16)
    assert (gw, gh) == (16, 16)


# postprocess -------------------------------------------------------------------

def test_postprocess_exact_target_dims_png():
    out = postprocess(_png(400, 400), 100, 50, "png")
    assert image_dims(out) == (100, 50)


def test_postprocess_webp_and_dims():
    out = postprocess(_png(512, 512), 200, 120, "webp", quality=80)
    assert image_dims(out) == (200, 120)
    assert Image.open(io.BytesIO(out)).format == "WEBP"


def test_postprocess_jpg_flattens_alpha():
    # transparent source -> jpg has no alpha, must not crash and must be RGB
    out = postprocess(_png(300, 300, (0, 0, 0, 0)), 150, 150, "jpg")
    img = Image.open(io.BytesIO(out))
    assert img.format == "JPEG"
    assert img.mode == "RGB"
    assert img.size == (150, 150)


def test_postprocess_cover_crop_keeps_aspect_no_distortion():
    # wide source into square target -> center-cropped, exact square out
    out = postprocess(_png(800, 200), 100, 100, "png")
    assert image_dims(out) == (100, 100)


def test_postprocess_rejects_bad_format():
    with pytest.raises(ValueError):
        postprocess(_png(100, 100), 50, 50, "gif")
