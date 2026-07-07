---
title: MCP 서버 설정하는 법
slug: mcp-server-setup
summary: |
  Model Context Protocol (MCP) 서버를 로컬 환경에 설정하고 Claude와 연결하는 방법.
topic: setup
tags: [mcp, 설정, 통합]
order: 2
updated: 2026-07-06
difficulty: intermediate
related: [install-claude-code]
---

## MCP란?

Model Context Protocol (MCP)은 Claude가 외부 도구와 데이터를 안전하게 접근할 수 있게 해주는 표준입니다.

## MCP 서버 설치

### Node.js 기반 MCP 서버

```bash
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-filesystem
```

### Python 기반 MCP 서버

```bash
pip install mcp[cli]
pip install mcp-server-sqlite
```

## Claude 설정 파일 수정

Claude 설정 파일을 편집하여 MCP 서버를 등록합니다:

```bash
# macOS/Linux
nano ~/.claude/mcp-servers.json

# Windows
notepad %APPDATA%\.claude\mcp-servers.json
```

다음 JSON을 추가합니다:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "mcp-server-sqlite",
      "args": ["--db", "/path/to/database.db"]
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/path/to/allowed/directory"]
    }
  }
}
```

## MCP 서버 상태 확인

```bash
claude --mcp-status
```

## 트러블슈팅

연결이 안 되면 로그를 확인하세요:

```bash
claude --debug
```
