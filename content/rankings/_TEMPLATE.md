---
# Required: English-friendly title for this ranking
title: "[제목 또는 'Best X' 형식]"

# Required: Stable slug for URL/references
slug: "[optional, auto-derived from filename if omitted]"

# Required: Category of this ranking (choose one)
field: ai | programming | tech | games | movies | music

# Required: As-of date (ISO: YYYY-MM or YYYY-MM-DD)
asOfDate: "2026-06"

# Required: Provenance note (≤200 chars)
# Format: "[Source name] · [date description]"
sourceNote: "[기준이 되는 리스트/조사 이름] · [날짜]"

# Optional: Clickable source URL (valid http(s) URL)
sourceUrl: "https://..."

# Required: ≥3 items, each with rank/name/description
items:
  - rank: 1
    name: "[항목 이름]"
    description: "[plain text, ≤200 chars]"
    link: "https://..." # optional, external link
    imageUrl: "https://..." # optional, requires imageWidth+imageHeight
    imageWidth: 100 # required if imageUrl
    imageHeight: 100 # required if imageUrl
  - rank: 2
    name: "[항목 이름]"
    description: "[plain text, ≤200 chars]"
---

# Body (optional, currently unused)
# Markdown body content reserved for future use.
