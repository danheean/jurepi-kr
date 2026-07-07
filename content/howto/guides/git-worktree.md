---
title: Git Worktree로 멀티 브랜치 작업하는 법
slug: git-worktree
summary: |
  git worktree를 사용하여 동시에 여러 브랜치를 작업하는 방법.
topic: git
tags: [git, worktree, 브랜치]
order: 2
updated: 2026-07-06
difficulty: intermediate
related: []
---

## Worktree란

Git worktree는 동일한 저장소의 여러 브랜치를 동시에 작업할 수 있게 하는 기능입니다.

## 새로운 Worktree 생성

```bash
git worktree add ../project-feature feature-branch
cd ../project-feature
```

## Worktree 작업

```bash
# 현재 worktree에서 코드 수정
git add .
git commit -m "feat: 새로운 기능"
git push origin feature-branch
```

## Worktree 삭제

```bash
cd ..
git worktree remove ../project-feature
```

## Worktree 목록

```bash
git worktree list
```
