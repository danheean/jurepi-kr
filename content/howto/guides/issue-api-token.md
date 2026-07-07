---
title: API 토큰 발급하는 법
slug: issue-api-token
summary: |
  Anthropic 콘솔에서 Claude API 토큰을 발급받고, 환경변수로 설정하는 방법.
topic: api
tags: [api, 토큰, 인증]
order: 1
updated: 2026-07-06
difficulty: beginner
related: [install-claude-code]
---

## 토큰 발급 단계

1. [api.anthropic.com](https://api.anthropic.com) 방문
2. 상단 우측 "프로필" 클릭
3. "API 키" 메뉴 선택
4. "+ API 키 생성" 버튼 클릭
5. 토큰명 입력 (예: "cli-dev")
6. 생성된 토큰 복사

## 환경변수 설정

### macOS / Linux (bash/zsh)

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

`.zshrc` 또는 `.bashrc`에 추가하여 영구 설정:

```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Windows (PowerShell)

```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

영구 설정:

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "your-api-key-here", "User")
```

## 검증

토큰이 제대로 설정되었는지 확인:

```bash
echo $ANTHROPIC_API_KEY
```

또는:

```bash
claude --version
```

오류가 없으면 토큰이 활성화된 것입니다.
