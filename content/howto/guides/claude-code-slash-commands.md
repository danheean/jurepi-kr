---
title: Claude Code 슬래시 명령어 사용하는 법
slug: claude-code-slash-commands
summary: |
  Claude Code에서 사용할 수 있는 슬래시 명령어(/plan, /sketch, /build 등)와 각각의 용도를 학습합니다.
topic: cli
tags: [claude-code, 명령어, 팁]
order: 1
updated: 2026-07-06
difficulty: beginner
related: [install-claude-code]
---

## 슬래시 명령어 개요

Claude Code에서는 특정 작업을 빠르게 수행할 수 있는 슬래시 명령어를 제공합니다.

## 주요 명령어

### /plan - 계획 수립

프로젝트나 기능의 구현 계획을 작성합니다:

```
/plan Build a todo app with React
```

응답:
- 아키텍처 개요
- 단계별 구현 계획
- 예상 소요 시간

### /sketch - 빠른 스케치

빠르게 초안을 만들 때 사용합니다:

```
/sketch Create a counter component
```

이 명령은 `/plan`보다 간단한 출력을 제공합니다.

### /build - 전체 빌드

완전한 구현을 생성합니다:

```
/build Implement user authentication
```

이 명령은 다음을 포함합니다:
- 전체 코드 구현
- 테스트 케이스
- 문서

### /review - 코드 리뷰

작성한 코드를 검토받습니다:

```
/review
```

현재 파일을 분석하고 개선 사항을 제안합니다.

## 명령어 조합 사용

여러 명령어를 조합하여 사용할 수 있습니다:

```bash
/plan Build authentication
/build Implement login form
/review
```

## 팁

- 명령어는 언제든 취소할 수 있습니다 (Ctrl+C)
- 상세한 맥락을 제공할수록 더 좋은 결과를 얻습니다
- `/plan`부터 시작하면 체계적인 개발이 가능합니다
