# 개발 인물 사전 — 작성 가이드

이 디렉토리에서 소프트웨어 역사의 영향력 있는 인물들의 전기를 작성합니다.

## 파일 구조

```
content/dev-people/
├── _TEMPLATE.md          # 한국어 템플릿 (실제 파일 작성 시 참고)
├── _TEMPLATE_en.md       # 영문 템플릿
├── README.md             # 이 파일
└── people/
    ├── grace-hopper.md          # 한국어 파일 (정본)
    ├── grace-hopper_en.md       # 영문 파일 (상속)
    ├── guido-van-rossum.md
    ├── guido-van-rossum_en.md
    └── ... (13 인물 쌍)
```

## 파일명 규칙

- **파일명**: `<slug>.md` (한국어) + `<slug>_en.md` (영문)
- **슬러그**: ASCII 소문자, 숫자, 하이픈만 사용 (예: `grace-hopper`, `guido-van-rossum`)
- **쌍**: 한국어 파일과 영문 파일이 반드시 같은 이름으로 존재해야 함
- **제외**: `_` 접두사 파일은 생성기가 무시 (예: `_TEMPLATE.md`)

## 작성 순서

### 1단계: 파일 생성

1. `_TEMPLATE.md`를 복사하여 새 파일 생성: `content/dev-people/people/<slug>.md`
2. `_TEMPLATE_en.md`를 복사하여: `content/dev-people/people/<slug>_en.md`
3. 템플릿의 모든 주석 제거 및 실제 데이터 입력

### 2단계: 필드 작성

#### 한국어 파일 필드 (필수)

| 필드 | 설명 | 제약 |
|------|------|------|
| `name` | 한국식 표기 인물명 | 필수, 1자 이상 |
| `knownFor` | 핵심 업적 요약 | 필수, 50자 이상 |
| `tags` | 기술/분야 태그 | 필수, ≥1개, 하단 목록만 허용 |
| `era` | 활동 시대 | 필수, 지정 4개만 허용 |
| `nationality` | 국가 | 필수, ISO 코드 또는 국명 |
| `slug` | URL 안전 식별자 | 선택, 생략하면 name에서 자동 유도 |
| `biography_body` | 본문 마크다운 | 생성기가 마크다운 파일 본문에서 채움 |
| `birthYear` | 생년 | 선택, 1800 이상 |
| `deathYear` | 사망년 | 선택, birthYear > deathYear 불가 |
| `photo` | 사진 파일명 | 선택, 있으면 photoCredit 필수 |
| `photoCredit` | 사진 출처/라이선스 | 선택, photo 있으면 필수 |
| `achievements` | 주요 업적 배열 | 선택, en 파일과 연도·개수 일치 필수 |
| `books` | 저서 배열 | 선택, en 파일과 연도·개수 일치 필수 |
| `aliases` | 검색 별칭 | 선택 |
| `related` | 관련 인물 슬러그 | 선택, 모두 실존해야 함 |
| `links` | 외부 참조 | 선택, http(s)만 허용 |

#### 영문 파일 필드

- `name`: 영문 인물명 (필수)
- `knownFor`: 영문 업적 요약 (필수, 50자 이상)
- `achievements`, `books`: 제목만 영문 번역 (ko 파일과 연도/개수 일치)
- `aliases`: 영문 별칭 (선택)
- `tags`, `era`, `nationality`, `birthYear`, `deathYear`, `photo`, `photoCredit`, `related`, `links`: 한국어 파일에서 상속됨 (중복 입력 시 일치 여부 검증)

### 3단계: 본문 마크다운 작성

마크다운 파일의 frontmatter(---) 뒤에 본문을 작성합니다.

#### 필수 구조

**한국어 파일**:
```markdown
## 소개

2단락 이상, 100자 이상의 실질 텍스트

## 일화

흥미로운 일화 (1~3단락)
```

**영문 파일**:
```markdown
## About

2+ paragraphs, 100+ characters minimum

## Anecdotes

Interesting anecdotes (1-3 paragraphs)
```

#### 마크다운 가이드

- **제목**: `##`로만 사용 (다른 레벨 금지)
- **강조**: `**bold**`, `*italic*` 허용
- **링크**: `[텍스트](URL)` 허용 (http(s)만)
- **목록**: `-`, `*` 불릿 허용
- **코드**: 인라인 `` `code` `` 또는 ` ``` ` 코드 블록 허용
- **HTML**: 금지 (sanitized output)

## 태그 제어어휘 (20개)

```
java
python
javascript
c
cpp
linux
git
ai
deep-learning
clean-code
architecture
tdd
agile
refactoring
design-patterns
free-software
web
game
education
youtube
```

**선택 기준**: 인물이 기여한 주요 기술/분야 3개 선택 권장

## 시대 구간

```
1940-1960   # 초기 컴퓨터 시대
1960-1980   # 미니컴퓨터, 언어 설계
1980-2000   # PC, 오픈 소스 초기
2000-present # 클라우드, 인공지능
```

## 사진 등록

1. **저장 위치**: `public/images/dev-people/`
2. **파일명**: `<slug>.jpg` (예: `grace-hopper.jpg`)
3. **크기**: 300×400 ~ 500×600px (종횡비 3:4 권장)
4. **포맷**: JPEG 또는 PNG
5. **라이선스**: 상용/재배포 허용 라이선스 확인
6. **Attribution**: `photoCredit` 필드에 출처 명시 (예: "Wikimedia Commons, Public Domain" 또는 "© 2023 Name, CC BY 4.0")

### 사진 없을 때 대체

머리글자 아바타가 자동 생성됩니다 (이름의 처음 2자 + 카테고리 컬러).

## 검증 규칙

생성기는 다음을 자동 검증합니다:

| 규칙 | 위반 시 |
|------|---------|
| 쌍 무결성 (ko + en 모두 존재) | ❌ 빌드 실패 |
| 필드 필수 (ko: name/knownFor/tags/era/nationality, en: name/knownFor) | ❌ 빌드 실패 |
| 슬러그 유일성 | ❌ 빌드 실패 |
| 슬러그 ASCII 유효성 | ❌ 빌드 실패 |
| 태그 어휘 확인 | ❌ 빌드 실패 |
| 연도 적절성 (1800 ≤ birthYear ≤ 현재, birthYear ≤ deathYear) | ❌ 빌드 실패 |
| 사진 파일 존재 (photo 있으면) | ❌ 빌드 실패 |
| 사진 크레딧 필수 (photo 있으면) | ❌ 빌드 실패 |
| Achievements/books 개수 일치 (ko ↔ en) | ❌ 빌드 실패 |
| Achievements/books 연도 일치 (ko ↔ en) | ❌ 빌드 실패 |
| 관련 인물 참조 유효성 (related 슬러그 존재) | ❌ 빌드 실패 |
| 링크 URL 스킴 (http(s)만) | ❌ 빌드 실패 |
| 본문 존재 및 길이 (≥100자, "## 소개"/"## About" 헤딩) | ❌ 빌드 실패 |

## 빌드 실행

```bash
# 로컬 검증
pnpm run predev

# 또는 빌드
pnpm build
```

오류가 발생하면 터미널에서 파일명·필드·위반 규칙을 확인하고 수정합니다.

## 예시

### 완성된 인물 파일 구조

```yaml
---
name: 그레이스 호퍼
slug: grace-hopper
knownFor: COBOL 발명자...
tags: [c, architecture, education]
era: 1960-1980
nationality: US
birthYear: 1906
deathYear: 1992
photo: grace-hopper.jpg
photoCredit: "Wikimedia Commons, Public Domain"
achievements:
  - year: 1952
    title: A-0 컴파일러 개발
books:
  - title: "Understanding Computers"
    year: 1984
    url: "https://example.com"
aliases:
  - 호퍼 제독
related:
  - alan-turing
links:
  - label: Wikipedia
    url: "https://ko.wikipedia.org/wiki/..."
---

## 소개

[본문...]

## 일화

[일화...]
```

## 자주 묻는 질문

**Q: 슬러그를 생략하면?**
A: 인물명을 영문 소문자로 변환하고 공백을 하이픈으로 바꿈 (자동 유도)

**Q: 영문 파일에 한국어를 쓰면?**
A: 빌드 시 경고 없음. 검색/크롤링 시 영문 사용자가 한글을 못 봄. 항상 영문으로 작성

**Q: 사진을 나중에 추가할 수 있나?**
A: 네. `photo`/`photoCredit` 필드를 먼저 공란으로 두고, 나중에 사진 파일을 추가한 뒤 필드를 채우면 됨

**Q: 관련 인물이 아직 등록 안 됐는데?**
A: `related` 필드는 선택. 모두 실존해야 하므로 누락하거나, 먼저 그 인물의 파일을 등록하고 추가

## 지원

빌드 오류나 질문이 있으면 터미널의 오류 메시지를 확인하거나, 이 README의 검증 규칙 섹션을 참고하세요.
