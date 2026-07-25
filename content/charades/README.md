# 몸으로 말해요 (Charades) — Content Authoring Guide

Decks live as markdown pairs in `content/charades/decks/`: a Korean file (`<deck>.md`, canonical for
`category`/`difficulty`/`words`) and its English counterpart (`<deck>_en.md`, per-locale `title` +
optional per-locale `words`; if `words` is omitted the English deck inherits the Korean terms verbatim).

Adding a deck is a content-only change — drop the pair in `content/charades/decks/`, run
`node scripts/generate-charades.mjs` (or `pnpm dev` / `pnpm build`, which run it automatically via
`predev`/`prebuild`), and it appears in the deck browser with zero code changes.

## The one rule that matters: mimeable without speech

This tool's entire reason for existing (as distinct from the sibling `speed-quiz` tool) is that every
prompt word must be **physically demonstrable in silence** — no talking, no spelling, no sound effects,
no pointing at real objects in the room. Before adding a word, run it through this checklist:

- [ ] Can a person identify this from gesture/posture/facial-expression ALONE, without knowing any
      spoken word, brand name, or written phrase?
- [ ] Is it distinguishable by MOVEMENT/POSTURE rather than by SOUND (avoid animals/actions where the
      only differentiator is a noise, e.g. a cicada, a ringing phone)?
- [ ] Is it a generic noun/role/action/emotion, NOT a specific copyrighted character or brand (use
      "닌자"/"해적"/"마법사" as archetypal roles, never a named franchise character)?
- [ ] Is it concrete and physical, NOT an abstract concept, proverb, idiom, or four-character phrase
      (those stay in speed-quiz's `proverbs` deck — don't duplicate them here)?
- [ ] Is it unique within its deck (no near-duplicates)?
- [ ] **Is the term a NOUN, not a verb phrase with a "-하기/타기/만들기/찍기/쓰기" suffix?** Guessers shout the exact
      word they think is correct — a verb phrase ("눈사람 만들기") leaves them unsure whether to say the full
      phrase or just the object, while a noun ("눈사람") has one unambiguous answer. Use the mimed object's name
      ("자전거", "기타") or the activity's own established noun form ("낚시", "저글링", "다림질", "세수"). If no
      clean noun exists for a candidate word, swap it for a different one rather than forcing an awkward reduction.

See `docs/services/fun/charades/SPEC.md`'s `content_curation_policy` section for the full policy,
the six category definitions, and a list of words explicitly considered and rejected (so future authors
don't re-add them).

## Categories — A/B team-battle format

Every category has **exactly two decks — Team A and Team B** (`<category>-a`/`<category>-b`, e.g.
`actions-a.md` + `actions-b.md`), each with exactly 10 words, so a facilitator can run two team rounds
with disjoint, comparably-difficulty word sets. Team A and Team B share the same `category`/`difficulty`
but must not share any words. Titles carry the team suffix: `"<제목> A팀"` / `"<제목> B팀"` (ko),
`"<Title> Team A"` / `"<Title> Team B"` (en) — mirrors the sibling `speed-quiz` tool's convention.

`actions` (easy) · `animals` (easy) · `occupations` (normal) · `characters` (normal) · `sports` (normal) ·
`emotions` (hard).

**Difficulty balance between A and B** has no schema field (same as speed-quiz) — it's an authoring
discipline: informally tier your candidate words (easy/medium/hard to mime), then distribute tiers evenly
across the A and B lists (a "snake draft") so neither team's deck is harder than the other's.

## Field reference

| Field | Required (ko) | Required (en) | Notes |
|---|---|---|---|
| `title` | yes | yes | Per-locale display name, include the ` A팀`/` B팀` (ko) or ` Team A`/` Team B` (en) suffix |
| `slug` | no | n/a (ko canonical) | ASCII, `[a-z0-9-]+`; derived from filename if omitted |
| `category` | yes | no (inherits ko) | One of the six categories above |
| `difficulty` | yes | no (inherits ko) | `easy` \| `normal` \| `hard` — same value for a category's A and B deck |
| `words` | yes, exactly 10 | no (inherits ko verbatim if omitted) | `{ term: string, hint?: string (≤30 chars) }` |

## Validation (build-time, fails the build on any violation)

- Every Korean file must have a matching English file (and vice versa).
- Korean file must have `category`, `difficulty`, and exactly 10 `words` (not 9, not 11).
- English file must have a non-empty `title`.
- If English `words` is present, its length must match the Korean `words` length.
- Word `term`s must be unique within a deck (both ko and en).
- `slug` must be globally unique across all decks (not just within a category).

Run `node scripts/generate-charades.mjs` directly to see validation errors with file/field/reason.
