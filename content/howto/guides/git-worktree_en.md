---
title: How to Work with Multiple Branches Using Git Worktree
summary: |
  Use git worktree to work on multiple branches simultaneously.
---

## What is worktree

Git worktree allows you to work on multiple branches of the same repository at the same time.

## Create a new worktree

```bash
git worktree add ../project-feature feature-branch
cd ../project-feature
```

## Work in the worktree

```bash
# Modify code in the current worktree
git add .
git commit -m "feat: new feature"
git push origin feature-branch
```

## Remove a worktree

```bash
cd ..
git worktree remove ../project-feature
```

## List worktrees

```bash
git worktree list
```
