# AI Development Decision Framework

## Quick Reference: Which Pattern Should I Use?

### By Task Type

**"I need a prototype or visual project fast"**
→ **Vibe Coding** (Module 1): Write a spec with technology + visual + interaction + constraints. Let Claude build it autonomously. Best for: games, dashboards, landing pages, demos.

**"I keep doing the same thing and getting inconsistent results"**
→ **Skills** (Module 2.1-2.2): Encode your expertise in a .claude/skills/ file. Five sections: Purpose, Principles, Patterns, Anti-Patterns, Checklist.

**"I repeat the same prompts over and over"**
→ **Slash Commands** (Module 2.3): Turn the prompt into a .claude/commands/ file. One-word trigger, same result every time.

**"Claude uses outdated APIs or hallucinates library usage"**
→ **MCP + Context7** (Module 3.1): `claude mcp add context7` — fetches real, versioned docs at query time.

**"I need to debug something in the browser"**
→ **DevTools MCP** (Module 3.2): Screenshots, console, network, performance traces. Be specific about what to check.

**"I need to connect Claude to an internal system"**
→ **Custom MCP Server** (Module 3.3): Node.js process registering tools with names, descriptions, and Zod schemas.

**"This task is too big for one context window"**
→ **RALPH Loop** (Module 4.1): Autonomous iteration with fresh context per cycle. Or **Tasks** (Module 4.2): Structured dependency tracking across sessions.

**"I need to refactor a large codebase"**
→ **Multi-Phase Planning** (Module 4.3): Plan → Scaffold → Implement → Test → Integrate. Commit at each phase.

**"This feature has cleanly separable concerns"**
→ **Subagents** (Module 5.2): Sequential specialists, each in their own context. Or **Swarms** (Module 5.3): Parallel workers with shared task board.

**"I need to build a full application"**
→ **Agent Teams** (Module 5.4): Backend + Frontend + Testing teammates with shared types as contract.

**"I need to validate quality and catch bugs"**
→ **AI Testing** (Module 6.2): Test generation, TDD with AI, runtime debugging with DevTools MCP.

### By Complexity

```
Simple (minutes)     → Vibe coding, slash commands
Medium (hours)       → Skills + MCP, RALPH loop, Tasks
Complex (days)       → Multi-phase planning, subagents
Large (weeks)        → Agent teams, swarms
```

### By Team Size

```
Solo developer       → Skills, commands, MCP, RALPH loop
Small team (2-5)     → Shared CLAUDE.md, shared skills, agent teams
Larger team (5+)     → Skill catalogs, MCP server library, plugins
```

## Anti-Patterns to Avoid

**Over-orchestrating simple tasks**: Don't set up a 3-agent team to build a utility function. Match complexity to the task.

**Skipping the spec**: Vibe coding without a spec produces generic results. The spec is what makes it work.

**One giant context window**: If Claude starts losing track of earlier instructions, you've hit the context ceiling. Break the work into phases or use subagents.

**Not saving what works**: If a prompt produced great results, save it. As a spec template, a skill, or a slash command. Future-you will thank you.

**Ignoring test output**: When Claude generates tests and some fail, those failures often reveal real bugs. Don't skip them.
