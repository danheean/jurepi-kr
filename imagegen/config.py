"""Static config: Ollama endpoint, model aliases, defaults."""
from __future__ import annotations

import os
from pathlib import Path

OLLAMA_BASE = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
IMAGES_ENDPOINT = f"{OLLAMA_BASE}/v1/images/generations"

# Friendly aliases -> concrete Ollama model refs the user has pulled.
MODEL_ALIASES: dict[str, str] = {
    "z-image-turbo": "x/z-image-turbo:latest",
    "z-image": "x/z-image-turbo:latest",
    "flux-klein": "x/flux2-klein:9b",
    "flux": "x/flux2-klein:9b",
    "flux-klein-4b": "x/flux2-klein:4b",
}

# Empirically (see SKILL.md "모델 평가"): z-image-turbo is the fast default; flux-klein
# has stronger prompt adherence / detail. Neither renders Korean reliably, so "auto"
# just picks the fast default — text is added as a real layer, not baked in.
DEFAULT_MODEL = "z-image-turbo"
AUTO_MODEL = "z-image-turbo"

DEFAULT_N = 3          # generate >=3 candidates, then pick the best fit
DEFAULT_SIZE = "1024x1024"
MAX_GEN_DIM = 1024     # Ollama image gen caps at 1024
GEN_MULTIPLE = 16      # diffusion sizes should be multiples of 16

# Committed, per-tool prompt provenance (reusable record — NOT gitignored).
MANIFEST_DIR = Path("docs/image-prompts")
# Gitignored staging area for candidate images awaiting selection.
STAGING_DIR = Path(".imagegen/candidates")


def resolve_model(name: str) -> str:
    """Map an alias or 'auto' to a concrete Ollama model ref."""
    if not name or name == "auto":
        name = AUTO_MODEL
    if name in MODEL_ALIASES:
        return MODEL_ALIASES[name]
    if "/" in name or ":" in name:  # already a concrete ref like x/flux2-klein:9b
        return name
    raise ValueError(
        f"Unknown model '{name}'. Use one of {sorted(MODEL_ALIASES)} or a full ref."
    )


_CANONICAL_ALIASES = ("z-image-turbo", "flux-klein", "flux-klein-4b")


def model_alias(concrete: str) -> str:
    """Reverse-map a concrete ref to its canonical alias for display/manifest."""
    for alias in _CANONICAL_ALIASES:
        if MODEL_ALIASES.get(alias) == concrete:
            return alias
    return concrete
