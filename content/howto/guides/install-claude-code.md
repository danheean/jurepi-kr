---
title: 클로드 코드 설치하는 법
slug: install-claude-code
summary: |
  macOS·Windows·Linux에서 Claude Code CLI를 설치하고 첫 실행까지 마치는 단계별 안내.
topic: setup
tags: [claude-code, cli, 설치]
order: 1
updated: 2026-07-06
difficulty: beginner
related: [issue-api-token]
---

## 준비물

- Node.js 20 이상
- 터미널 (zsh / bash / PowerShell)

## 설치 흐름

```mermaid
flowchart TD
  A[Node 버전 확인] --> B{Node 20+?}
  B -->|예| C[npm 전역 설치]
  B -->|아니오| D[Node.js 업그레이드]
  D --> C
  C --> E[claude 로그인]
  E --> F[첫 실행]
  F --> G[버전 확인]
```

## 설치 명령

### macOS / Linux

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

### Windows (PowerShell)

```powershell
npm install -g @anthropic-ai/claude-code
claude --version
```

## 설치 확인

설치가 끝나면 다음 명령으로 버전을 확인할 수 있습니다:

```bash
claude --version
```

출력이 다음과 같으면 설치 완료입니다:

```
claude-code/1.0.0
```

## 첫 실행

```bash
claude
```

로그인 프롬프트가 표시됩니다. API 키를 입력하고 진행하세요.
