---
title: How to Use Claude Code Slash Commands
summary: |
  Learn about the slash commands available in Claude Code (/plan, /sketch, /build, etc.) and their uses.
---

## Slash Commands Overview

Claude Code provides slash commands that let you quickly perform specific tasks.

## Main Commands

### /plan - Create a Plan

Write an implementation plan for a project or feature:

```
/plan Build a todo app with React
```

Response includes:
- Architecture overview
- Step-by-step implementation plan
- Estimated time

### /sketch - Quick Sketch

Use this for rapid prototyping:

```
/sketch Create a counter component
```

This command provides a simpler output than `/plan`.

### /build - Full Build

Generate a complete implementation:

```
/build Implement user authentication
```

This command includes:
- Full code implementation
- Test cases
- Documentation

### /review - Code Review

Get feedback on your code:

```
/review
```

The current file is analyzed and improvements are suggested.

## Combining Commands

Use multiple commands together:

```bash
/plan Build authentication
/build Implement login form
/review
```

## Tips

- You can cancel any command anytime (Ctrl+C)
- Provide detailed context for better results
- Start with `/plan` for systematic development
