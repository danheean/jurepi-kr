---
title: How to Set Up an MCP Server
summary: |
  A step-by-step guide to configuring a Model Context Protocol server and connecting it to Claude.
---

## What is MCP?

Model Context Protocol (MCP) is a standard that enables Claude to securely access external tools and data.

## Installing an MCP Server

### Node.js-based MCP Server

```bash
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-filesystem
```

### Python-based MCP Server

```bash
pip install mcp[cli]
pip install mcp-server-sqlite
```

## Modifying Claude's Configuration File

Edit the Claude configuration file to register an MCP server:

```bash
# macOS/Linux
nano ~/.claude/mcp-servers.json

# Windows
notepad %APPDATA%\.claude\mcp-servers.json
```

Add the following JSON:

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

## Checking MCP Server Status

```bash
claude --mcp-status
```

## Troubleshooting

If the connection fails, check the logs:

```bash
claude --debug
```
