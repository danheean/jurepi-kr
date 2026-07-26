---
# English Bookmark Topic Template
# REQUIRED:
#   - title: Topic title (e.g., "Harness Engineering")
#   - description: Topic description (≤200 chars, plain text)
#   - sections: Array of sections (≥1)
#
# OPTIONAL:
#   - slug: Custom ID (omit — KO file canonical, EN inherits)
#   - field, asOfDate, sourceNote, sourceUrl: Not used for bookmarks (rankings only)
#
# sections structure:
#   - heading: Section title (e.g., "Meta Skills")
#   - links: Array of links (≥1, but topic total ≥3)
#     - label: Link title (required)
#     - url: Valid http(s) URL (required, rel=noopener)
#     - description: Link description (optional, ≤100 chars)

title: "Enter topic title here"
description: "Enter a short description of this topic. Maximum 200 characters."
sections:
  - heading: "First Section"
    links:
      - label: "Link Title"
        url: "https://example.com"
        description: "Optional: short description of the link"
      - label: "Second Link"
        url: "https://example.com/another"
  - heading: "Second Section"
    links:
      - label: "Third Link"
        url: "https://example.com/third"
        description: "Description"
---

## Body (optional) — long-form SEO prose

The markdown body below the frontmatter is **optional**. If present, it renders as
long-form prose beneath the link list on the detail (spoke) page, feeding search &
AI discoverability (SEO/GEO). If absent, only the links are shown.

- **No H1 (`#`)** — the page already renders the title as its H1. Start at `##`
  (a single leading `#` line is stripped by the generator, but prefer `##`).
- Standard markdown is supported (paragraphs, `##`/`###`, **bold**, lists, links);
  raw HTML is disabled.
- A unique paragraph per item (song, tool, person, …) helps discoverability.

## Required Rules

- **KO + EN pair required**: Create both `<topic>.md` (Korean) and `<topic>_en.md` (English)
- **Slug canonical from KO**: Korean file defines slug; English inherits
- **Minimum 3 links per topic**: Total links ≥ 3
- **URL validity**: Must start with `http://` or `https://`
- **Text length limits**: title ≤200 chars, link description ≤100 chars (plain text)

## Example filenames

- `harness-engineering.md` + `harness-engineering_en.md`
- `frontend-resources.md` + `frontend-resources_en.md`
