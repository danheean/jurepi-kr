---
term: Harness Engineering
definition: |
  Designing and optimizing the "harness" around an LLM or AI agent — its tools,
  prompts, action space, observation formatting, verification loops, and permissions —
  to get higher task-completion rates from the same model.
examples:
  - "Before swapping models, we did harness engineering and cleaned up the tool definitions first."
  - "Good harness engineering absorbs an agent's failures with observe-and-recover loops."
reading: /ˈhɑːrnəs ˌendʒɪˈnɪərɪŋ/
aliases: [harness engineering, harness design]
origin: Emerged as agentic AI spread and the system *around* a model — not the model alone — increasingly determined performance.
---

A "harness" originally means the gear that safely holds and steers something. In AI it
refers to the **whole system around a model** that makes it actually useful — which
**tools** it gets, how observations (results) are **formatted**, what gets **verified**
and when to **retry**, and what permissions and guardrails apply.

Core activities:

- **Action-space design**: define tools/APIs so the agent doesn't get confused
- **Observation formatting**: shape results and errors for the next decision
- **Verification loops**: pair with iteration so the agent self-checks and recovers
- **Evaluation (evals)**: measure whether a harness change actually raised completion rate

The same model can perform very differently with a better harness, so `improve the
harness before scaling the model` often wins.
