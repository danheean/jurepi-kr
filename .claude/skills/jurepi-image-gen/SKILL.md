---
name: jurepi-image-gen
description: >-
  개발 시점에 Jurepi.kr 도구/콘텐츠에 들어갈 이미지(삽화·커버·배경·장식·OG 이미지)를 로컬 Ollama 모델
  (Z-Image Turbo / FLUX.2 Klein)로 생성한다. "이미지 생성/만들어", "삽화/일러스트/커버 이미지/배경
  이미지/OG 이미지 필요", "flux/z-image/ollama로 이미지", "도구/콘텐츠에 이미지가 필요해" 같은 요청에
  사용. 여러 후보를 만들어 가장 부합하는 것을 고르고, 프롬프트·모델·시드를 도구별로 기록해 재사용/재현한다.
  마스코트(사용자가 항상 직접 제공)와 실인물 초상은 생성하지 않는다. 파이썬은 개발 전용 — Jurepi.kr
  런타임/빌드에는 포함되지 않는다.
---

# Jurepi 이미지 생성 (jurepi-image-gen)

도구/콘텐츠 페이지에 이미지가 필요할 때, 로컬 Ollama 이미지 모델로 **무료·오프라인**으로 만든다.
생성이 공짜이므로 **항상 후보를 3장 이상 만들어 가장 부합하는 것을 고른다.** 실제로 쓴 이미지의
프롬프트·모델·시드는 **도구별 매니페스트**(`docs/image-prompts/<tool>.json`)에 기록되어 나중에
동일하게 재현하거나 변형할 수 있다.

## 언제 쓰나

- 도구 상세/허브에 장식 삽화·배경이 필요할 때
- howto 가이드 커버(1000×560), 콘텐츠 삽화, OG/소셜 이미지가 필요할 때
- 텍스트 없는 브랜드 톤(바이올렛 `#6c5ce7`·크림) 일러스트가 필요할 때

**쓰지 않는 경우:**
- **도구 마스코트** (`public/characters/<slug>.webp`) — 사용자가 항상 직접 제공한다. 이 스킬은 건드리지 않는다.
- **실인물 초상** (dev-people 등) — 라이선스 실사진만 사용(likeness·fact-check 규칙). AI 생성 금지.

## 사전 조건

- macOS + Ollama 실행 중(이미지 생성은 experimental·macOS/MLX 전용). `ollama serve` 또는 앱 실행.
- 모델이 pull 되어 있어야 함: `x/z-image-turbo:latest`, `x/flux2-klein:9b` (`ollama list`로 확인).
- 파이썬 도구는 루트 uv 환경으로 구동: `uv sync --extra dev` (최초 1회). 이후 `uv run jurepi-imagegen …`.
- 서버 확인: `curl -s localhost:11434/api/version`.

## 모델 라우팅 (실측 기반)

| 모델 (`--model`) | 성격 | 언제 |
|---|---|---|
| `z-image-turbo` (기본/auto) | ~13s@512·~28s@1024, 깔끔한 플랫 일러스트·아이콘·그라디언트 | **대부분의 경우** — 빠른 반복 |
| `flux-klein` (9B) | ~30% 느림, **프롬프트 충실도·구성·디테일 우세**, 영문 타이포 깔끔 | 리치한 장면·커버·고품질/영문 텍스트 필요 시 |

**⚠️ 한글 텍스트는 두 모델 모두 신뢰 불가** — 글자가 깨진다("무료 도구"→"무료 도고"/"무뻀 도구").
그러므로 **이미지에는 텍스트를 굽지 말고**, 텍스트(특히 한글)는 앱/디자인 레이어(HTML·SVG·CSS)나
후처리로 얹는다. 프롬프트에 `no text`를 넣어 텍스트 없는 이미지를 생성하라. (영문 단어 하나 정도는
`flux-klein`이 비교적 잘 하지만, 신뢰하려면 후보 여러 장에서 고른다.)

**프롬프트 팁:** 브랜드 톤 = "flat vector illustration, playful, soft rounded shapes, violet
(`#6c5ce7`) and cream palette, plain white background, no text". 스타일 형용사 + 구체 대상 + 배경/팔레트 +
`no text`.

## 워크플로우: 생성 → 고르기 → 확정

### 1) 후보 생성 (≥3장)

```bash
uv run jurepi-imagegen generate \
  --tool <slug> \
  --prompt "flat vector illustration of …, violet and cream, plain white background, no text" \
  --size 1000x560 --n 4 --model auto
```

- `--tool` = 매니페스트 버킷(도구/콘텐츠 slug). `--size` = **최종 목표 크기**(WxH).
- 후보는 `.imagegen/candidates/<tool>/<name>/cand_XX_seedYYY.png`(gitignore)에 저장되고
  각 후보는 서로 다른 시드를 갖는다.
- `--seed N`을 주면 후보 시드는 `N, N+1, …`로 결정적. 안 주면 랜덤 베이스.

### 2) 후보 보기 → 가장 부합하는 것 선택

에이전트가 각 `cand_XX_*.png`를 **Read로 열어** 브랜드/의도 부합도를 보고 하나를 고른다.
(공짜이므로 마음에 안 들면 프롬프트를 다듬어 다시 `generate`.)

### 3) 확정: 최종 파일 저장 + 매니페스트 기록

```bash
uv run jurepi-imagegen select \
  --candidate .imagegen/candidates/<tool>/<name>/cand_01_seed1001.png \
  --out public/images/<tool>/cover.png \
  --note "howto 커버"
```

- 후보를 정확한 목표 크기로 **cover-crop 리사이즈** + 포맷 변환(확장자로 결정: png/webp/jpg)해
  `--out`에 저장.
- 선택한 후보의 프롬프트·모델·시드·크기를 `docs/image-prompts/<tool>.json`에 **append**(커밋 대상).
- `--size WxH`로 최종 크기 override, `--format`·`--quality` 조절 가능.

## 재현 / 조회

```bash
uv run jurepi-imagegen list --tool <slug>                 # 기록된 프롬프트 목록
uv run jurepi-imagegen reproduce --tool <slug> --id <id>  # 동일 시드로 재생성(raw md5 MATCH 확인)
```

동일 `(model, prompt, size, seed)` → **byte-identical** raw 이미지(검증됨). 매니페스트에 `raw_md5`를
저장하므로 `reproduce`가 일치 여부를 출력한다. 스타일 일관성이 필요하면(같은 도구의 여러 이미지)
매니페스트의 시드/프롬프트를 참고해 변형한다.

## 흔한 크기 타깃

| 용도 | 크기 | 포맷 | 저장 경로 예 |
|---|---|---|---|
| howto 커버 | 1000×560 | png | `public/images/howto/<slug>/cover.png` |
| 콘텐츠 삽화/배경 | 자유 | webp/png | `public/images/<tool>/…` |
| OG/소셜 | 1200×630 | png | `public/images/og/<slug>.png` |

Next는 정적 export(`unoptimized:true`)이므로 **실제 서빙 크기로 저장**한다(오버사이즈 소스 금지). CWV(CLS<0.1)를
위해 참조하는 `<Image>`에 명시적 width/height를 준다.

## 매니페스트(프롬프트 프로버넌스)

- 위치: `docs/image-prompts/<tool>.json` (커밋 — 팀 재사용 자산). dev-only 파이썬(`.venv`/`.imagegen`,
  gitignore)과 달리 이건 버전관리한다.
- 엔트리: `{ id, out, prompt, negative, model, model_ref, target_size, gen_size, steps, seed, raw_md5,
  format, quality, createdAt, note }`.
- 형식/규칙은 `docs/image-prompts/README.md` 참고.

## 제약 (비타협)

- 마스코트·실인물 초상 생성 금지(위 "쓰지 않는 경우").
- 프리셋 프롬프트 레시피 라이브러리를 미리 만들지 않는다 — 필요할 때 만들고, 매니페스트에 실제 기록만 쌓는다.
- **파이썬/venv는 개발 전용** — `src/`·Next 빌드·정적 export와 무관(gitignore). 생성 이미지 자산만 `public/`에 커밋.
- 최종 이미지에 한글 텍스트를 굽지 않는다(텍스트는 앱 레이어).

## 트러블슈팅

- `Cannot reach Ollama …` → `ollama serve`(또는 Ollama 앱) 실행 확인, `curl localhost:11434/api/version`.
- 첫 생성이 느림 → 콜드 스타트(모델 로드). 한 번 워밍 후 재시도(웜 ~13–37s).
- 크기가 안 맞음 → `select`가 cover-crop으로 정확히 맞춘다. 생성은 16의 배수·≤1024로 요청 후 최종 리사이즈.
- 후보가 다 별로 → 프롬프트에 스타일/팔레트/`no text`를 더 구체화하고 `--n`을 늘려 재생성.
- 텍스트가 깨짐 → 정상(모델 한계). 텍스트는 앱/디자인 레이어로.

## 내부 구조

- `pyproject.toml`(루트) + `imagegen/`(패키지): `ollama.py`(`/v1/images/generations` 클라이언트,
  size+seed 지원)·`imaging.py`(순수 리사이즈/포맷, 단위테스트)·`manifest.py`(순수 merge/find, 단위테스트)·
  `cli.py`(generate/select/reproduce/list).
- 테스트: `uv run pytest`(순수 함수). Ollama 호출은 위 워크플로우로 스모크 검증.
