---
term: SOLID
tags: [design principles, development, object-oriented]
definition: |
  An acronym for five object-oriented design principles — Single
  Responsibility, Open/Closed, Liskov Substitution, Interface Segregation,
  and Dependency Inversion — used as a guide for writing maintainable,
  extensible code.
examples:
  - "This class violates the Single Responsibility Principle from SOLID, so it needs refactoring."
  - "Following SOLID keeps the amount of code you touch small when requirements change."
reading: /ˈsɒlɪd/
aliases: [SOLID principles]
origin: The five principles were articulated by Robert C. Martin in papers and talks through the late 1990s and early 2000s; the SOLID acronym itself was coined around 2004 by Michael Feathers.
---

## Description

**SOLID** is an acronym for five object-oriented design principles.

- **S** — Single Responsibility Principle: a class should have only one reason to change.
- **O** — Open/Closed Principle: software entities should be open for extension but closed for modification.
- **L** — Liskov Substitution Principle: subtypes must be substitutable for their base types.
- **I** — Interface Segregation Principle: clients shouldn't be forced to depend on interfaces they don't use.
- **D** — Dependency Inversion Principle: high-level modules should depend on abstractions, not low-level modules.

Applying these five principles together narrows the blast radius of
changes when requirements shift, and keeps the codebase easy to test.
SOLID is also frequently cited as the theoretical foundation behind
architectural patterns like `Clean Architecture`.
