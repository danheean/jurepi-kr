"""jurepi-imagegen CLI.

Workflow (agent-driven):
  1) generate  -> makes N candidates (distinct seeds) into a gitignored staging dir
  2) (agent views the candidates and picks the best fit)
  3) select    -> post-processes the chosen candidate to the exact target size/format,
                  writes it to public/..., and records prompt+model+seed in the
                  per-tool manifest (docs/image-prompts/<tool>.json)
  reproduce    -> regenerate any manifest entry (same seed -> identical raw bytes)
  list         -> show a tool's recorded prompts
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from imagegen import config, manifest, ollama
from imagegen.imaging import gen_size, image_dims, parse_size, postprocess


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in [here, *here.parents]:
        if (parent / ".git").exists():
            return parent
    return Path.cwd()


ROOT = _repo_root()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def _staging(tool: str, name: str) -> Path:
    return ROOT / config.STAGING_DIR / manifest.slugify_id(tool) / manifest.slugify_id(name)


def _rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


# ---- generate ----------------------------------------------------------------


def cmd_generate(a: argparse.Namespace) -> int:
    model_ref = config.resolve_model(a.model)
    model_alias = config.model_alias(model_ref)
    tw, th = parse_size(a.size)
    gw, gh = gen_size(tw, th)
    gsize = f"{gw}x{gh}"
    name = a.name or f"{manifest.slugify_id(a.tool)}-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}"
    base_seed = a.seed if a.seed is not None else random.randint(1, 2_000_000_000)

    stage = _staging(a.tool, name)
    stage.mkdir(parents=True, exist_ok=True)

    meta = {
        "tool": a.tool,
        "name": name,
        "prompt": a.prompt,
        "negative": a.negative,
        "model_alias": model_alias,
        "model_ref": model_ref,
        "target_size": f"{tw}x{th}",
        "gen_size": gsize,
        "steps": a.steps,
        "candidates": [],
    }

    print(f"Generating {a.n} candidate(s) with {model_alias} @ {gsize} "
          f"(final target {tw}x{th})…", file=sys.stderr)
    for i in range(a.n):
        seed = base_seed + i
        try:
            raw = ollama.generate(model_ref, a.prompt, gsize, seed, a.steps, a.negative)
        except ollama.OllamaError as e:
            print(f"  candidate {i}: FAILED — {e}", file=sys.stderr)
            return 1
        fname = f"cand_{i:02d}_seed{seed}.png"
        (stage / fname).write_bytes(raw)
        meta["candidates"].append({"index": i, "seed": seed, "file": fname,
                                    "raw_md5": _md5(raw)})
        print(f"  candidate {i}: {_rel(stage / fname)}  (seed={seed})", file=sys.stderr)

    (stage / "candidates.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("\nCandidates ready. View them, then promote the best with:")
    print(f"  jurepi-imagegen select --candidate {_rel(stage)}/cand_XX_seedYYY.png "
          f"--out public/images/<path>.png")
    print("\nCandidate files:")
    for c in meta["candidates"]:
        print(f"  {(_rel(stage / c['file']))}")
    return 0


# ---- select ------------------------------------------------------------------


def _load_candidate_meta(candidate: Path) -> tuple[dict, dict]:
    meta_file = candidate.parent / "candidates.json"
    if not meta_file.exists():
        raise SystemExit(f"No candidates.json next to {candidate}. Run `generate` first.")
    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    entry = next((c for c in meta["candidates"] if c["file"] == candidate.name), None)
    if entry is None:
        raise SystemExit(f"{candidate.name} is not listed in {meta_file}.")
    return meta, entry


def cmd_select(a: argparse.Namespace) -> int:
    candidate = Path(a.candidate)
    if not candidate.is_absolute():
        candidate = ROOT / candidate
    if not candidate.exists():
        raise SystemExit(f"Candidate not found: {candidate}")
    meta, cand = _load_candidate_meta(candidate)

    out = Path(a.out)
    if not out.is_absolute():
        out = ROOT / out
    fmt = (a.format or out.suffix.lstrip(".") or "png").lower()
    tw, th = parse_size(a.size) if a.size else parse_size(meta["target_size"])

    raw = candidate.read_bytes()
    final = postprocess(raw, tw, th, fmt, a.quality)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(final)
    fw, fh = image_dims(final)

    entry = {
        "id": manifest.slugify_id(f"{meta['name']}-{cand['seed']}"),
        "out": _rel(out),
        "prompt": meta["prompt"],
        "negative": meta["negative"],
        "model": meta["model_alias"],
        "model_ref": meta["model_ref"],
        "target_size": f"{tw}x{th}",
        "gen_size": meta["gen_size"],
        "steps": meta["steps"],
        "seed": cand["seed"],
        "raw_md5": cand.get("raw_md5"),
        "format": fmt,
        "quality": a.quality,
        "createdAt": _now(),
        "note": a.note,
    }
    mpath = manifest.manifest_path(ROOT, meta["tool"])
    entries = manifest.merge_entry(manifest.load(mpath), entry)
    manifest.save(mpath, entries)

    print(f"Wrote {_rel(out)}  ({fw}x{fh} {fmt})")
    print(f"Recorded in {_rel(mpath)}  (id={entry['id']}, seed={entry['seed']})")
    return 0


# ---- reproduce ---------------------------------------------------------------


def cmd_reproduce(a: argparse.Namespace) -> int:
    mpath = manifest.manifest_path(ROOT, a.tool)
    entry = manifest.find_entry(manifest.load(mpath), a.id)
    if entry is None:
        raise SystemExit(f"No entry id={a.id} in {_rel(mpath)}")

    raw = ollama.generate(entry["model_ref"], entry["prompt"], entry["gen_size"],
                          entry["seed"], entry.get("steps"), entry.get("negative"))
    new_md5 = _md5(raw)
    old_md5 = entry.get("raw_md5")
    match = "MATCH" if old_md5 and new_md5 == old_md5 else (
        "DIFFER" if old_md5 else "no baseline")
    print(f"raw md5: new={new_md5} recorded={old_md5}  -> {match}")

    out = Path(a.out) if a.out else (ROOT / entry["out"])
    if not out.is_absolute():
        out = ROOT / out
    tw, th = parse_size(entry["target_size"])
    final = postprocess(raw, tw, th, entry.get("format", "png"), entry.get("quality") or 90)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(final)
    print(f"Wrote {_rel(out)} ({tw}x{th} {entry.get('format','png')})")
    return 0 if match != "DIFFER" else 2


# ---- list --------------------------------------------------------------------


def cmd_list(a: argparse.Namespace) -> int:
    mpath = manifest.manifest_path(ROOT, a.tool)
    entries = manifest.load(mpath)
    if not entries:
        print(f"No manifest at {_rel(mpath)}")
        return 0
    print(f"{_rel(mpath)}  ({len(entries)} image(s)):\n")
    for e in entries:
        print(f"  [{e['id']}]  {e['out']}")
        print(f"     model={e['model']} seed={e['seed']} size={e['target_size']} "
              f"fmt={e.get('format')}")
        print(f"     prompt: {e['prompt'][:100]}")
        if e.get("note"):
            print(f"     note: {e['note']}")
        print()
    return 0


# ---- parser ------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="jurepi-imagegen",
        description="Dev-only local image generation for Jurepi.kr (Ollama).",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("generate", help="make N candidates for a tool/content")
    g.add_argument("--prompt", required=True)
    g.add_argument("--tool", required=True, help="tool/content slug (manifest bucket)")
    g.add_argument("--name", help="basename for this image set (default: tool+timestamp)")
    g.add_argument("--model", default="auto",
                   help="auto | z-image-turbo | flux-klein | flux-klein-4b | <ref>")
    g.add_argument("--size", default=config.DEFAULT_SIZE, help="final target WxH")
    g.add_argument("--n", type=int, default=config.DEFAULT_N, help="candidate count (>=3)")
    g.add_argument("--steps", type=int)
    g.add_argument("--negative")
    g.add_argument("--seed", type=int, help="base seed (candidates use seed, seed+1, …)")
    g.set_defaults(func=cmd_generate)

    s = sub.add_parser("select", help="promote a candidate to final + record manifest")
    s.add_argument("--candidate", required=True, help="path to chosen cand_XX_seedYYY.png")
    s.add_argument("--out", required=True, help="final path, e.g. public/images/x/cover.png")
    s.add_argument("--format", help="png|webp|jpg (default: from --out extension)")
    s.add_argument("--size", help="override final WxH (default: candidate's target)")
    s.add_argument("--quality", type=int, default=90)
    s.add_argument("--note")
    s.set_defaults(func=cmd_select)

    r = sub.add_parser("reproduce", help="regenerate a recorded image from its manifest")
    r.add_argument("--tool", required=True)
    r.add_argument("--id", required=True)
    r.add_argument("--out", help="override output path")
    r.set_defaults(func=cmd_reproduce)

    ls = sub.add_parser("list", help="show a tool's recorded prompts")
    ls.add_argument("--tool", required=True)
    ls.set_defaults(func=cmd_list)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
