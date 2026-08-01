# 이미지 프롬프트 매니페스트 (image-prompts)

이 디렉토리는 `jurepi-image-gen` 스킬이 도구/콘텐츠용으로 **실제 생성해 사용한 이미지**의 프롬프트·모델·
파라미터·시드를 도구별로 기록한다. 목적은 **재현·변형·스타일 일관성** — 나중에 같은 이미지를 그대로 다시
만들거나(동일 시드 → byte-identical), 같은 톤으로 변형할 수 있게 한다.

- 파일 1개 = 도구/콘텐츠 slug 1개: `docs/image-prompts/<slug>.json`.
- **이 매니페스트는 커밋한다**(팀 재사용 자산). 반면 파이썬 dev 도구(`.venv`)와 후보 스테이징
  (`.imagegen/`)은 gitignore.
- 실제 이미지 파일은 `public/…`에 별도로 커밋된다(여기엔 경로만 기록).

## 엔트리 형식

```json
[
  {
    "id": "howto-cover-1001",          // 안정적 식별자 (name + seed)
    "out": "public/images/howto/x/cover.png",
    "prompt": "flat vector illustration …, no text",
    "negative": null,
    "model": "z-image-turbo",          // 별칭
    "model_ref": "x/z-image-turbo:latest",
    "target_size": "1000x560",         // 최종 저장 크기
    "gen_size": "1008x560",            // Ollama에 요청한 생성 크기(16의 배수·≤1024)
    "steps": null,
    "seed": 1001,                      // 재현 키
    "raw_md5": "…",                    // 생성 raw PNG의 md5 (reproduce 검증용)
    "format": "png",
    "quality": 90,
    "createdAt": "2026-…Z",
    "note": "howto 커버"
  }
]
```

## 사용

```bash
uv run jurepi-imagegen list --tool <slug>
uv run jurepi-imagegen reproduce --tool <slug> --id <id>   # raw md5 MATCH 확인
```

작성/갱신은 스킬 CLI(`generate` → `select`)가 자동으로 한다. 수기 편집은 지양(형식 깨짐 주의).
자세한 워크플로우는 `.claude/skills/jurepi-image-gen/SKILL.md`.
