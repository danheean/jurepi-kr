# New Word Glossary — Content Authoring Guide

Add new terms to the New Word glossary by creating markdown file pairs in the `terms/` folder.

## Quick Start

1. **Copy the templates** (`_TEMPLATE.md` and `_TEMPLATE_en.md`) as a starting point.
2. **Create a pair** of files:
   - `<slug>.md` — Korean content (mandatory)
   - `<slug>_en.md` — English content (mandatory)
3. **Fill in frontmatter** — required fields: `term`, `definition`, `examples` (≥1).
4. **Rebuild** — `pnpm dev` or `pnpm build` auto-generates `terms.generated.json`.

Example:
```
vibe-coding.md
vibe-coding_en.md
```

## Pairing Rule (CRITICAL)

Every term MUST have **both** Korean and English files with the same base name (minus `_en` suffix):
- `god-saeng.md` ↔ `god-saeng_en.md` ✓ Correct
- `god-saeng.md` (missing `_en`) ✗ Build fails

Files starting with `_` (like templates) are **excluded** by the generator.

## File Structure

```
content/new-word/
├── _TEMPLATE.md          ← Copy this for new terms
├── _TEMPLATE_en.md
├── README.md             ← You are here
└── terms/
    ├── vibe-coding.md
    ├── vibe-coding_en.md
    ├── god-saeng.md
    ├── god-saeng_en.md
    └── …
```

## Required Fields (per locale)

Both Korean and English files must include:

```yaml
term: "용어"              # Non-empty string (display name)
definition: |            # Non-empty string (1–3 sentences)
  의미를 설명합니다.
examples:                # Array with ≥1 non-empty items
  - "예시 1"
  - "예시 2"
```

**Missing required fields → build error + term excluded.**

## Optional Fields

Structural metadata (canonical in Korean file; English inherits if omitted):

| Field | Type | Example |
|-------|------|---------|
| `slug` | string | `vibe-coding` (ASCII, unique, `/^[a-z0-9-]+$/`) |
| `topic` | enum | `mz` or `tech` |
| `tags` | string[] | `[AI, 개발, 트렌드]` |
| `coinedYear` | number | `2025` |
| `related` | string[] | `[loop-engineering, prompt-engineering]` (slugs; must exist) |

Per-locale optional fields (independent):

| Field | Type | Example |
|-------|------|---------|
| `reading` | string | `바이브 코딩` or `/vaɪb ˈkoʊdɪŋ/` |
| `aliases` | string[] | `[바이브코딩, 바코]` |
| `origin` | string | `2025년 개발자 커뮤니티에서 확산됨` |

## Topic List

| ID | Korean | English | Usage |
|----|--------|---------|-------|
| `mz` | MZ 용어 | MZ Slang | Modern Korean slang, internet culture, trends |
| `tech` | 기술 용어 | Tech Terms | Software, AI, engineering terms |

## Slug Naming

- **Auto-derive from filename** (default): `vibe-coding.md` → slug is `vibe-coding`
- **Explicit in frontmatter** (override): add `slug: my-slug` to frontmatter
- **Rules**: lowercase, letters/numbers/hyphens only; unique in catalog
- **Stability**: slugs are immutable identifiers used in related references, favorites, and recents. Changing a slug breaks existing links.

## Canonical Rule

**Structural metadata is canonical in the Korean file:**

If both files have `topic`, they must match exactly. If English omits it, it inherits from Korean.

Example (✓ OK):
```yaml
# god-saeng.md
topic: mz
tags: [MZ, 라이프스타일]

# god-saeng_en.md
# (no topic/tags — inherits from Korean)
```

Example (✗ ERROR):
```yaml
# god-saeng.md
topic: mz

# god-saeng_en.md
topic: tech  # Conflict! Build fails.
```

**Locale-specific content is independent:**

- `term`, `definition`, `examples`, `reading`, `aliases`, `origin` are translated independently per locale.
- No conflict if they differ.

## Related References

Link terms via the `related` array (slugs):

```yaml
related: [loop-engineering, prompt-engineering]
```

**Rules:**
- List slugs of existing terms.
- Build fails if any slug doesn't exist.
- Circular references are allowed (not harmful).
- Self-reference is allowed.

## Markdown Body (Optional)

Beyond the structured frontmatter, you can add optional markdown:

```markdown
---
term: "용어"
definition: "…"
examples:
  - "…"
---

## Extended Explanation

Optional paragraph(s) in markdown format. Use **bold**, `code`, [links](url), etc.

- **No raw HTML** (forbidden)
- **No scripts** (forbidden)
- **Plain text rendering** — safe by design
```

The body is optional and MVP ignores it in the UI (can be extended in Phase 2).

## Example Term: Vibe Coding

**Ko (`vibe-coding.md`):**
```yaml
---
term: 바이브 코딩
slug: vibe-coding
topic: tech
definition: |
  AI에게 자연어로 원하는 바를 설명하고,
  코드를 한 줄씩 읽기보다 '느낌(vibe)'대로
  받아들이며 소프트웨어를 만드는 방식.
examples:
  - "요즘은 바이브 코딩으로 주말 프로젝트를 하루 만에 만든다."
  - "바이브 코딩은 빠르지만, 프로덕션에선 검증이 필요하다."
reading: 바이브 코딩
tags: [AI, 개발, 트렌드]
origin: 2024년 개발자 커뮤니티에서 확산됨
coinedYear: 2024
related: [loop-engineering, prompt-engineering]
---

AI와 협업하는 현대적 개발 방식입니다.
```

**En (`vibe-coding_en.md`):**
```yaml
---
term: Vibe Coding
definition: |
  Building software by describing intent to an AI in natural language
  and accepting the output by "vibe" rather than reading every line of code.
examples:
  - "I vibe-coded the whole weekend project in a day."
  - "Vibe coding is fast, but production still needs review."
reading: /vaɪb ˈkoʊdɪŋ/
origin: Popularized in developer communities in 2024.
---

A modern approach to software development with AI collaboration.
```

## Build Process

When you `pnpm dev` or `pnpm build`:

1. **Generator runs** (`scripts/generate-glossary.mjs`)
   - Scans `content/new-word/terms/` for `.md` files
   - Excludes files starting with `_`
   - Groups into ko/en pairs
   - Parses frontmatter with YAML
   - Validates required fields, types, uniqueness
   - Checks related references exist
2. **Output**: `src/components/tools/new-word/data/terms.generated.json`
   - Deterministic (same content → same output)
   - Sorted by topic, then by coinedYear descending
3. **Error Reporting**: If ANY term is invalid:
   - Build **fails** with clear file + field + reason
   - Fix and rebuild

## Validation Rules (Strict)

| Rule | Failure | Fix |
|------|---------|-----|
| Missing pair (ko-only or en-only) | Build fails | Create both files |
| Empty `term`, `definition`, or `examples` | Build fails | Fill in required fields |
| `slug` not matching `/^[a-z0-9-]+$/` | Build fails | Use ASCII letters, numbers, hyphens only |
| Duplicate `slug` in catalog | Build fails | Rename to a unique slug |
| `related` references non-existent slug | Build fails | Check slug exists or remove the reference |
| Structural field mismatch (e.g., topic differs) | Build fails | Make EN inherit or match KO |

## Tips & Best Practices

1. **Use filenames as slugs**: `god-saeng.md` → slug auto-derives to `god-saeng`.
2. **Keep definitions concise**: Aim for 1–3 sentences (150–400 chars).
3. **Provide 2+ examples**: Show real usage, not just abstract definitions.
4. **Tag generously**: Tags aid search and categorization (e.g., `[AI, 개발, 트렌드]`).
5. **Link related terms**: Use `related` to help readers explore.
6. **Use clear language**: Avoid jargon or explain it.
7. **Bilingual symmetry**: Ko and En definitions should be roughly equivalent in detail.

## Troubleshooting

**Error: "missing Korean file"**
- Create the `.md` (without `_en`) in the same folder.

**Error: "term required"**
- Add `term: "..."` to frontmatter. Must be non-empty.

**Error: "≥1 example required"**
- Add at least one example: `examples: ["example 1"]`

**Error: "Duplicate slug"**
- Check two files have the same slug. Rename one.

**Error: "related references missing slug"**
- A `related` item doesn't exist. Verify spelling or create the referenced term.

**Generator doesn't run on `pnpm dev`?**
- Check `package.json` has `"predev": "node scripts/generate-glossary.mjs"`.
- Manually run: `node scripts/generate-glossary.mjs`

## Adding 12 Seed Terms

The initial glossary includes:

**Tech (6):**
- vibe-coding (바이브 코딩)
- loop-engineering (루프 엔지니어링)
- prompt-engineering (프롬프트 엔지니어링)
- ai-agent (AI 에이전트)
- context-window (컨텍스트 윈도우)
- rag (검색 증강 생성)

**MZ (6):**
- god-saeng (갓생)
- eok-kka (억까)
- aljaldakkkalsen (알잘딱깔센)
- sbuljae (스불재)
- wannaes (완내스)
- king-batda (킹받다)

Each is a complete ko/en pair with high-quality definitions and examples.
