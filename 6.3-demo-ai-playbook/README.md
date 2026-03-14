# Your AI Development Playbook

## Overview

This is the capstone: designing your personal AI development workflow that combines everything from the course. Instead of following a prescribed system, you'll build your own playbook — a decision framework for when to use which pattern, tuned to how you work.

**What you'll build**:
1. A personal **decision framework** — which AI pattern for which situation
2. A reusable **template library** — specs, skills, commands, and agent configs you'll actually use
3. A **feedback loop** — how to evaluate and improve your workflow over time

## The Playbook Framework

### Choosing Your Approach

Not every task needs the same level of AI involvement. The course covered a spectrum from simple to complex:

```
Situation                          → Pattern            → Module
─────────────────────────────────────────────────────────────────
Quick prototype / visual project   → Vibe Coding        → 1.1, 1.3
Consistent code quality            → Skills + Commands  → 2.1-2.3
External data / live docs          → MCP Servers        → 3.1-3.3
Multi-step feature (one agent)     → RALPH / Tasks      → 4.1-4.2
Large refactor                     → Multi-Phase Plan   → 4.3
Feature with separable concerns    → Subagents          → 5.2
Independent parallel work          → Agent Swarms       → 5.3
Full application                   → Agent Teams        → 5.4
Testing & hardening                → AI Testing         → 6.2
```

### Decision Checklist

When starting a new task, ask yourself:

1. **Can I describe the output visually?** → Vibe coding with a spec (Module 1)
2. **Is this a repeating pattern I do often?** → Write a skill or slash command (Module 2)
3. **Do I need data from external systems?** → Set up or use an MCP server (Module 3)
4. **Is this too big for one context window?** → Break into phases or tasks (Module 4)
5. **Can concerns be cleanly separated?** → Use subagents or teams (Module 5)
6. **Do I need to validate quality?** → AI-powered testing and DevTools MCP (Module 6.2)

## Building Your Template Library

### The Templates

This demo includes starter templates you can customize:

#### 1. Spec Template (`templates/SPEC.md.template`)
A reusable project specification following the formula from Module 1:
- Technology constraints
- Visual / functional requirements
- Performance targets
- Interaction model

#### 2. Skill Template (`templates/SKILL.md.template`)
The five-section skill structure from Module 2:
- Purpose (when to activate)
- Principles (domain expertise)
- Patterns (code examples)
- Anti-Patterns (what to avoid)
- Checklist (verification steps)

#### 3. CLAUDE.md Template (`templates/CLAUDE.md.template`)
A project-level constitution covering:
- Project context and architecture
- Code style and conventions
- Testing requirements
- Common commands

#### 4. Agent Config Template (`templates/AGENT.md.template`)
Subagent definition from Module 5:
- Name and description
- Allowed tools
- Model selection
- System prompt with expertise

### Slash Commands

- `.claude/commands/evaluate.md` — Assess which AI pattern fits a given task
- `.claude/commands/retro.md` — Run a retrospective on your last AI-assisted session

## The Feedback Loop

### After Each Session: Quick Retro

Use the `/retro` command or ask yourself:

1. **What worked?** — Which prompts, specs, or patterns produced good results?
2. **What didn't?** — Where did Claude struggle, hallucinate, or go off track?
3. **What should I save?** — Any prompt, spec, or approach worth reusing?
4. **What should I tune?** — Any skill, command, or CLAUDE.md rule to adjust?

### Track Your Patterns

Keep a lightweight log of what works:

```
| Date       | Task                  | Pattern Used    | Result | Notes                          |
|------------|-----------------------|-----------------|--------|--------------------------------|
| 2025-03-10 | Dashboard prototype   | Vibe coding     | Great  | Saved spec as template         |
| 2025-03-11 | API refactor          | Multi-phase     | Good   | Phase 3 needed manual help     |
| 2025-03-12 | Component library     | Agent swarms    | Great  | Types contract was key         |
| 2025-03-13 | Bug investigation     | DevTools MCP    | Good   | Found memory leak in 2 min     |
```

Over time, you'll see which patterns you reach for most, and which need refinement.

### Growing Your Library

```
Week 1:  Save your best spec as a template
Week 2:  Write one skill for your most common code pattern
Week 3:  Create one slash command for a repeated workflow
Week 4:  Set up one MCP server for a tool you use daily
Month 2: Create a subagent for a domain you work in often
Month 3: Share your best templates with your team
```

Small, consistent investment compounds. A single well-crafted skill saves you time on every project that uses it.

## Files in This Demo

```
6.3-demo-ai-playbook/
├── README.md                           ← This file (the playbook framework)
├── playbook/
│   ├── decision-framework.md           ← When to use which pattern
│   └── pattern-log.md                  ← Template for tracking what works
├── templates/
│   ├── SPEC.md.template                ← Reusable project spec
│   ├── SKILL.md.template               ← Skill authoring starter
│   ├── CLAUDE.md.template              ← Project constitution starter
│   └── AGENT.md.template               ← Subagent config starter
└── .claude/
    └── commands/
        ├── evaluate.md                 ← Assess which pattern fits a task
        └── retro.md                    ← Session retrospective
```

## Key Takeaway

The best AI development workflow is the one you actually use. Start with the patterns that match your current projects, save what works as templates, and refine based on real experience. Your playbook will look different from everyone else's — and that's the point.
