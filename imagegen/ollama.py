"""Thin client for Ollama's OpenAI-compatible image endpoint.

POST /v1/images/generations  {model, prompt, size:"WxH", seed, n:1}
  -> {created, data:[{b64_json}]}

This endpoint honors BOTH `size` (exact px) and `seed` (byte-reproducible), which
the native /api/generate does not (it ignores width/height). Verified empirically.
"""
from __future__ import annotations

import base64

import httpx

from imagegen.config import IMAGES_ENDPOINT


class OllamaError(RuntimeError):
    pass


def generate(
    model_ref: str,
    prompt: str,
    size: str,
    seed: int,
    steps: int | None = None,
    negative: str | None = None,
    timeout: float = 900.0,
) -> bytes:
    """Generate ONE image, return raw PNG bytes. Deterministic for a fixed
    (model_ref, prompt, size, seed)."""
    body: dict = {"model": model_ref, "prompt": prompt, "size": size, "seed": seed, "n": 1}
    # Best-effort passthrough; Ollama ignores unknown keys for a given model.
    if steps is not None:
        body["steps"] = steps
    if negative:
        body["negative_prompt"] = negative

    try:
        resp = httpx.post(IMAGES_ENDPOINT, json=body, timeout=timeout)
    except httpx.ConnectError as e:
        raise OllamaError(
            f"Cannot reach Ollama at {IMAGES_ENDPOINT}. Is it running? "
            f"Start it with `ollama serve` (image gen is macOS-only). ({e})"
        ) from e
    except httpx.ReadTimeout as e:
        raise OllamaError(
            f"Ollama timed out after {timeout}s. Cold-start model load can be slow — "
            f"warm the model once, then retry. ({e})"
        ) from e

    if resp.status_code != 200:
        raise OllamaError(
            f"Ollama returned {resp.status_code}: {resp.text[:300]}"
        )

    payload = resp.json()
    try:
        b64 = payload["data"][0]["b64_json"]
    except (KeyError, IndexError, TypeError) as e:
        raise OllamaError(f"Unexpected response shape: {str(payload)[:300]}") from e
    return base64.b64decode(b64)
