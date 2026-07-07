---
title: How to Issue an API Token
summary: |
  Generate a Claude API token from the Anthropic Console and set it as an environment variable.
---

## Issue token

1. Visit [api.anthropic.com](https://api.anthropic.com)
2. Click "Profile" at top-right
3. Select "API Keys"
4. Click "+ Create API Key"
5. Enter a token name (e.g., "cli-dev")
6. Copy the generated token

## Set as environment variable

### macOS / Linux (bash/zsh)

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

For permanent setup, add to `.zshrc` or `.bashrc`:

```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Windows (PowerShell)

```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

For permanent setup:

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "your-api-key-here", "User")
```

## Verify

Check that the token is set correctly:

```bash
echo $ANTHROPIC_API_KEY
```

Or:

```bash
claude --version
```

No error means the token is active.
