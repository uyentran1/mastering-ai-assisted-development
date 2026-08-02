## Emerging Patterns in AI Coding: Analysis

### Summary
Detailed analysis of Ralph Loops, Beads, spec-driven development, test-first AI generation, the factory model, and what's coming next

### Patterns that work well
**Spec-driven development**

- The highest-impact practice
- Teams that spec first report 2–3x better AI output
- Structure specs as PRDs covering six areas: commands, testing, project structure, code style, git workflow, and boundaries
**Test-first AI generation**

- Writing or generating tests before implementation gives the AI a target to hit
- Combined with Ralph Loops, this produces reliable code with minimal intervention
- Essentially TDD with an AI partner
**Project memory / rules files**

- CLAUDE.md, .github/copilot-instructions.md, .cursor/rules, custom instructions — encoding standards where the AI reads them automatically
- Table stakes for serious AI-assisted development
**The Ralph Loop**

- Define the goal with clear acceptance criteria, give the AI tests for self-verification, and let it iterate autonomously until all tests pass
- Works excellently for well-scoped, testable tasks
- Set a maximum iteration limit (5–7) to prevent runaway token usage.
**The Beads Pattern**

- "Beads on a string" — sequential, checkpointed tasks where each step's output feeds the next
- Each bead has its own acceptance criteria and commit point
- Provides granular rollback that monolithic agent tasks lack
**The Factory Model**

- The mental shift from writing code to building the factory that builds your software
- Spin up multiple agents in parallel, each with different concerns
- Define outcomes, review results, refine specs
- Quality control parallels: precise specs are precise inputs; vague specs multiply errors across the entire fleet.

### Patterns that need caution
**Multi-agent orchestration**

- Running 3–5 agents in parallel is experimental but maturing
- First-class tooling like Claude Code agent teams (with shared task lists, inbox messaging, and dependency tracking) is reducing coordination overhead
- The sweet spot: independent tasks with clean boundaries
**Meta-Prompting**

- Having AI optimize its own prompts
- Mixed results — sometimes better, sometimes verbose or self-referential
- Useful for brainstorming, not automation
**Zero-Human-Review**

- Letting AI commit directly without human review
- Even with tests, AI can introduce subtle issues
- Always keep a human in the loop

### Patterns fading

- Simple ReAct: Being replaced by more sophisticated loops
- Single-shot generation: Iteration is essential for quality
- Rigid prompt templates: Context-aware skills and memory beat static templates

### Recommendations

- Write better specs (highest ROI)
- Build project memory
- Master the review-iterate loop
- Experiment with Ralph Loops and Beads
- Think in factory model terms as you scale
- One new technique per month — master basics deeply
