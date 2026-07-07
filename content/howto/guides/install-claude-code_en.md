---
title: How to Install Claude Code
summary: |
  A step-by-step guide to installing the Claude Code CLI on macOS, Windows, and Linux, through first run.
---

## Prerequisites

- Node.js 20 or later
- Terminal (zsh / bash / PowerShell)

## Install flow

```mermaid
flowchart TD
  A[Check Node version] --> B{Node 20+?}
  B -->|Yes| C[Global npm install]
  B -->|No| D[Upgrade Node.js]
  D --> C
  C --> E[claude login]
  E --> F[First run]
  F --> G[Check version]
```

## Install command

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

## Verify installation

After installation, verify with:

```bash
claude --version
```

Output should be:

```
claude-code/1.0.0
```

## First run

```bash
claude
```

A login prompt appears. Enter your API key to proceed.
