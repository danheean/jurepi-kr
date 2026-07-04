---
# ──────────────────────────────────────────────────────────────
# 개발 인물 사전 — 인물 마크다운 템플릿 (Korean / 한국어)
# 
# 참고: 이 파일은 테스트 템플릿입니다. 실제 인물 파일을 만들 때 복사하고 
# 모든 주석(#)과 가이드를 제거한 후 실제 데이터를 입력하세요.
# ──────────────────────────────────────────────────────────────

# REQUIRED (필수)
name: 그레이스 호퍼
slug: grace-hopper  # ASCII only: 영문 소문자, 숫자, 하이픈만 사용. 생략 가능 (이름에서 자동 유도)

# REQUIRED (필수) — 50자 이상
knownFor: |
  COBOL 프로그래밍 언어 발명자이자 컴파일러 개념의 선구자.
  미 해군 최초의 여성 제독 중 한 명으로 컴퓨터 과학 역사에 큰 영향을 미침.

# REQUIRED for Korean file (한국어 파일 필수) — 최소 1개 이상
# 허용 태그: java, python, javascript, c, cpp, linux, git, ai, deep-learning, 
#           clean-code, architecture, tdd, agile, refactoring, design-patterns,
#           free-software, web, game, education, youtube
tags:
  - c
  - architecture
  - education

# REQUIRED for Korean file (한국어 파일 필수) — 시대 구간
# 허용: 1940-1960 | 1960-1980 | 1980-2000 | 2000-present
era: 1960-1980

# REQUIRED for Korean file (한국어 파일 필수) — 국가명 또는 ISO 코드
nationality: US

# ──────────────────────────────────────────────────────────────
# OPTIONAL (선택)
# ──────────────────────────────────────────────────────────────

# 생년 (1800 이상, 현재 연도 이하)
birthYear: 1906

# 사망년 (생년이 있을 때만 가능, 생년 > 사망년 불가)
deathYear: 1992

# 프로필 사진 파일명 (public/images/dev-people/ 폴더에 저장)
# 누락 가능하나 있으면 photoCredit 필수
photo: grace-hopper.jpg

# 사진 출처 / 라이선스 (사진 파일이 있으면 필수)
photoCredit: "Wikimedia Commons, Public Domain"

# 주요 업적 (연도순 정렬, ko 파일 정본)
achievements:
  - year: 1952
    title: 최초의 컴파일러 A-0 시스템 개발
  - year: 1959
    title: COBOL 언어 설계 주도

# 저서 (ko 파일 정본, 제목만 en 파일에서 번역)
books:
  - title: "Understanding Computers"
    year: 1984
    url: "https://example.com/book"

# 검색 별칭 (이름 외 검색어)
aliases:
  - 호퍼 제독
  - Grace Murray Hopper

# 관련 인물 (다른 인물의 slug로 참조, 반드시 존재해야 함)
related:
  - alan-turing
  - ada-lovelace

# 외부 참조 링크 (http(s)만 허용)
links:
  - label: "Wikipedia"
    url: "https://ko.wikipedia.org/wiki/그레이스_호퍼"
  - label: "IEEE History"
    url: "https://www.ieee.org"

---

## 소개

그레이스 호퍼에 관한 전기. 2단락 이상, 100자 이상의 실질 텍스트가 필요합니다.
여기에 인물의 배경, 주요 업적, 역사적 의의를 설명합니다.

이 섹션은 검색 엔진과 AI 크롤러가 색인하는 핵심 내용입니다.
깊이 있고 명확한 설명을 작성해주세요.

## 일화

흥미로운 일화나 발언. 1~3단락.
