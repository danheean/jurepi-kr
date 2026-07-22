---
title: 일상 동작
category: actions
difficulty: easy
words:
  - term: 자전거 타기
  - term: 낚시하기
    hint: 물가에서 하는 활동
  - term: 양치질하기
  - term: 설거지하기
  - term: 줄넘기
  - term: 눈사람 만들기
  - term: 기타 치기
  - term: 요리하기
  - term: 빨래 널기
  - term: 저글링하기
---

This is the Korean template for charades ("몸으로 말해요") decks.

Replace title, category, difficulty, and words with your own content.

- **title**: A short, descriptive deck name in Korean — describe what's actually in the deck (e.g., "일상 동작", "동물원 동물"). Don't just append a letter to the category name ("동작 A") — with one deck per category today, that suffix implies a nonexistent "B" variant and just repeats the category heading already shown above the card.
- **category**: One of: actions, animals, occupations, characters, sports, emotions
- **difficulty**: One of: easy, normal, hard
- **words**: Array of objects with `term` (required) and optional `hint` (≤30 chars, performer-only private cue — never shown to guessers)

**Curation checklist (apply to every word before adding it):**
- [ ] Can a person identify this from gesture/posture/facial-expression ALONE, without knowing any spoken word, brand name, or written phrase?
- [ ] Is it distinguishable by MOVEMENT/POSTURE rather than by SOUND (avoid animals/actions where the only differentiator is a noise)?
- [ ] Is it a generic noun/role/action/emotion, NOT a specific copyrighted character or brand?
- [ ] Is it concrete and physical, NOT an abstract concept, proverb, idiom, or four-character phrase (those belong to the speed-quiz tool instead)?
- [ ] Is it unique within its deck (no near-duplicates)?

Rules:
- Minimum 10 words per deck
- All terms must be unique within the deck
- Hints are optional; use them sparingly for the trickier words in `normal`/`hard` decks
- Keep terms concrete and mimeable in silence — see `content_curation_policy` in `docs/services/fun/charades/SPEC.md` for the full policy and rejected-word examples
