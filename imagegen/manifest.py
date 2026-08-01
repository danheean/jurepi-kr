"""Per-tool prompt provenance manifest.

Each generated image that is actually used records its prompt + model + params +
seed + output path in `docs/image-prompts/<tool>.json`, so any image can later be
reproduced (same seed+model+prompt+size -> byte-identical) or varied. The pure
merge/find logic is unit-tested; load/save do IO.
"""
from __future__ import annotations

import json
from pathlib import Path

# ---- pure logic (unit-tested) ------------------------------------------------


def merge_entry(entries: list[dict], entry: dict) -> list[dict]:
    """Return a new list with `entry` added, replacing any existing entry that has
    the same `id`. Input list is not mutated."""
    entry_id = entry.get("id")
    out = [e for e in entries if e.get("id") != entry_id]
    out.append(entry)
    return out


def find_entry(entries: list[dict], entry_id: str) -> dict | None:
    for e in entries:
        if e.get("id") == entry_id:
            return e
    return None


def slugify_id(name: str) -> str:
    """A filesystem/URL-safe id fragment from a human name."""
    keep = [c.lower() if c.isalnum() else "-" for c in (name or "").strip()]
    s = "".join(keep)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-") or "image"


# ---- IO ----------------------------------------------------------------------


def manifest_path(root: Path, tool: str) -> Path:
    from imagegen.config import MANIFEST_DIR

    return root / MANIFEST_DIR / f"{slugify_id(tool)}.json"


def load(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} is not a JSON list")
    return data


def save(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
