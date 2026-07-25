---
term: Clean Architecture
definition: |
  An architectural principle that organizes software into concentric
  layers (entities → use cases → interface adapters → frameworks/drivers)
  so dependencies always point inward toward business logic. Proposed by
  Robert C. Martin.
examples:
  - "Our project follows Clean Architecture, so the domain logic doesn't depend on any framework."
  - "Under Clean Architecture's dependency rule, inner layers must know nothing about outer layers."
reading: /kliːn ˈɑːrkɪtɛktʃər/
aliases: [Clean Arch]
origin: Introduced by Robert C. Martin ("Uncle Bob") in a 2012 blog post titled "The Clean Architecture," later expanded into his 2017 book of the same name.
---

## Description

**Clean Architecture** organizes a system into concentric layers and
enforces a **Dependency Rule**: outer layers may depend on inner layers,
but never the reverse.

A typical layer breakdown looks like this:

- **Entities**: the innermost layer — core business rules, independent of any framework
- **Use Cases**: application-specific logic
- **Interface Adapters**: controllers, presenters, and similar glue code
- **Frameworks & Drivers**: the outermost layer — databases, web frameworks, UI

By separating these concerns, you can swap out details like the UI or the
database without touching core business logic, which improves
**testability, maintainability, and reusability**. It's frequently
mentioned alongside `Hexagonal Architecture` (the ports-and-adapters
pattern), which shares the same underlying goal.
