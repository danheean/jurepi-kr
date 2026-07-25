---
title: 일상 동작 A팀
category: actions
difficulty: easy
words:
  - term: 자전거
  - term: 낚시
    hint: 물가에서 하는 활동
  - term: 양치질
  - term: 설거지
  - term: 줄넘기
  - term: 눈사람
  - term: 기타
  - term: 저글링
  - term: 사진
  - term: 우산
---

This is the Korean template for charades ("몸으로 말해요") decks.

Replace title, category, difficulty, and words with your own content.

- **title**: A short, descriptive deck name in Korean, **plus the team suffix** — decks come in pairs, one
  per team, sharing a category (e.g. "일상 동작 A팀" + "일상 동작 B팀", "동물 A팀" + "동물 B팀"). Never ship
  a deck without its A/B sibling — a lone deck breaks the team-battle format this tool exists for.
- **category**: One of: actions, animals, occupations, characters, sports, emotions
- **difficulty**: One of: easy, normal, hard — use the SAME value for a category's A and B deck
- **words**: Array of exactly 10 objects with `term` (required) and optional `hint` (≤30 chars,
  performer-only private cue — never shown to guessers)

**Curation checklist (apply to every word before adding it):**
- [ ] Can a person identify this from gesture/posture/facial-expression ALONE, without knowing any spoken word, brand name, or written phrase?
- [ ] Is it distinguishable by MOVEMENT/POSTURE rather than by SOUND (avoid animals/actions where the only differentiator is a noise)?
- [ ] Is it a generic noun/role/action/emotion, NOT a specific copyrighted character or brand?
- [ ] Is it concrete and physical, NOT an abstract concept, proverb, idiom, or four-character phrase (those belong to the speed-quiz tool instead)?
- [ ] Is it unique within its deck (no near-duplicates)?
- [ ] **Is the term a NOUN, not a verb phrase with a "-하기/타기/만들기/찍기/쓰기" suffix?** (e.g. "눈사람", not
  "눈사람 만들기") — guessers shout one unambiguous word, not a full instruction. If no clean noun exists for
  a candidate, pick a different word instead of forcing an awkward reduction.

Rules:
- Exactly 10 words per deck (not fewer, not more — the build rejects both)
- Every category ships as an A/B pair with disjoint words and a comparable difficulty spread between them
  (informally tier candidates easy/medium/hard, then distribute tiers evenly across A and B)
- All terms must be unique within the deck
- Hints are optional; use them sparingly for the trickier words in `normal`/`hard` decks
- Keep terms concrete and mimeable in silence — see `content_curation_policy` in `docs/services/fun/charades/SPEC.md` for the full policy and rejected-word examples
