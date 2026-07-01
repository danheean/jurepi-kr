---
# ── required ──
term: "용어"              # Display term name (Korean)
slug: "slug-identifier"   # ASCII stable identifier (Korean file canonical). Must be unique. Related/favorites/recents reference this.
topic: mz                 # Topic: mz | tech (Phase 2: internet | business | culture …)
definition: |
  한두 문장으로 용어의 의미를 설명합니다.
  명확하고 간결하게.
examples:
  - "예시 1번입니다."
  - "예시 2번입니다."
# ── optional ──
reading: "발음"           # Pronunciation/reading aid (optional)
aliases: [별칭1, 별칭2]   # Search aliases (optional)
tags: [태그1, 태그2]      # Filter/display tags (optional)
origin: "2024년 SNS에서 확산된 표현."  # Etymology (optional)
coinedYear: 2024          # Appearance date (optional)
related: [slug1, slug2]   # Related term slugs (optional, must exist in catalog)
---

## 설명

선택적 마크다운 본문입니다. 단락, 굵은 글자(**bold**), `code` 등을 사용할 수 있습니다.

**주의사항:**
- HTML과 스크립트는 금지됩니다.
- 마크다운은 안전하게 처리됩니다.
