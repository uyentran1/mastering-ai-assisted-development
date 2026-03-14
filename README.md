# Mastering AI-Assisted Development
This is the repository for the LinkedIn Learning course `Mastering AI-Assisted Development`. The full course is available from [LinkedIn Learning][lil-course-url].

![lil-thumbnail-url]

## Course Description

Building on the foundations from *AI-Native Engineering Foundations*, this course progresses through three paradigms of AI-assisted development: **advanced vibe coding** (pushing single-prompt projects to their limits), the **conductor** mindset (customizing a single AI agent with Skills, MCP servers, and Hooks), and the **orchestrator** paradigm (coordinating multiple autonomous agents working in parallel). You'll build impressive projects, master autonomous agent patterns, and learn production workflows for scaling AI development across teams.

### Prerequisites
- Completion of *AI-Native Engineering Foundations* (or equivalent experience with AI-assisted coding, prompting techniques, and context files like CLAUDE.md)
- Node.js 18+ and npm installed
- A code editor (VS Code, Cursor, or similar)
- Claude Code CLI installed (or equivalent AI coding agent)

## Course Outline

### Chapter 1: Advanced Vibe Coding
*Push AI-assisted development to its limits. See what's possible with well-crafted specs, then learn the power-user setup to get there.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 1.1 | What's Possible: Advanced Vibe Coding | `1.1-demo-orchestrator-intro` | How far can a single well-crafted prompt go? Build a complete Three.js animal herd simulation — the AI makes hundreds of autonomous decisions about geometry, animation, and particles while you set the goal. |
| 1.2 | Claude Code Power User Setup | `1.2-demo-power-user-setup` | Pro tips that 10x your workflow: hooks, slash commands, model switching, memory management, and settings that matter. |
| 1.3 | Building Impressive Projects Fast | `1.3-demo-showcase-projects` | Build three jaw-dropping projects in minutes: a 3D retrowave racing game, a polished marketing landing page, and an interactive data visualization. Spec-driven development at its peak. |

### Chapter 2: Agent Skills Deep Dive
*Make your AI agent dramatically smarter with reusable Skills. Study the Frontend Design Skill, examine the PPTX Skill, and learn to write your own. Enhanced by Hooks for automated quality gates.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 2.1 | Agent Skills: The Frontend Design Skill | `2.1-demo-frontend-design-skill` | What are Agent Skills? See the Frontend Design Skill transform a generic "AI slop" page into a polished, professional interface — distinctive typography, cohesive color systems, orchestrated animations. |
| 2.2 | The PPTX Skill & Writing Your Own | `2.2-demo-pptx-skill-authoring` | Study the PPTX Presentation skill, understand the anatomy of a skill file, then write a custom API Design skill from scratch — with before/after examples. |
| 2.3 | Hooks & Automation — Quality on Autopilot | `2.3-demo-hooks-automation` | Set up pre-commit hooks, lint-on-save automation, and notification triggers that run automatically without manual intervention. |

### Chapter 3: MCP — Extending Your Agent
*Connect your agent to the outside world with Model Context Protocol. Pull live documentation with Context7, debug with Chrome DevTools MCP, and build custom servers for internal tools.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 3.1 | MCP & Context7 — Live Documentation | `3.1-demo-context7-mcp` | Understand MCP (the "USB-C for AI"), then use Context7 to give Claude access to up-to-date, version-specific library documentation. No more hallucinated APIs. |
| 3.2 | Chrome DevTools MCP — Browser Debugging | `3.2-demo-devtools-mcp` | Give Claude direct access to Chrome DevTools — screenshots, console messages, network inspection, and performance traces. Debug web apps without copy-pasting from the browser. |
| 3.3 | Building a Custom MCP Server | `3.3-demo-custom-mcp-server` | Build a custom MCP server that exposes feature flags, service health, and internal documentation to Claude. When the ecosystem doesn't have what you need, build it yourself. |

### Chapter 4: Autonomous Agent Patterns
*Master the patterns that let agents work independently: self-improving loops, modular task chains, and multi-phase planning.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 4.1 | The RALPH Loop — Self-Improving Agents | `4.1-demo-ralph-loop` | Implement the RALPH pattern: agents that pick a task, implement, validate, commit, and loop — building compound knowledge with each iteration via AGENTS.md. |
| 4.2 | Tasks — Dependency Tracking & Cross-Session Persistence | `4.2-demo-claude-tasks` | Use Claude Code's native task system to break specs into tracked, dependency-aware tasks that persist across sessions and coordinate between agents. |
| 4.3 | Multi-Phase Planning for Large Refactors | `4.3-demo-multi-phase-planning` | Tackle large-scale changes by breaking them into phases with checkpoints: plan → scaffold → implement → test → integrate. Real example: migrating an Express API to a new architecture. |

### Chapter 5: The Orchestrator Paradigm
*The big shift: from conducting one agent to orchestrating many. Understand the paradigm, then put it into practice with subagents, swarms, and a fullstack team.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 5.1 | From Conductor to Orchestrator | `5.1-demo-orchestrator-paradigm` | The paradigm shift: conductors guide one agent step-by-step; orchestrators oversee a symphony of autonomous agents working in parallel. Survey of modern orchestrator tools: Copilot Agent, Jules, Codex, Claude Code for Web, Cursor Background Agents. |
| 5.2 | Subagents — Delegating to Specialists | `5.2-demo-subagents` | Use Claude Code's built-in subagent support to delegate focused tasks (research, testing, documentation) while the main agent orchestrates. |
| 5.3 | Agent Swarms — Parallel Coordination | `5.3-demo-agent-swarms` | Coordinate multiple agents working in parallel: a team lead distributes tasks, teammates work concurrently on different files, and results merge cleanly. |
| 5.4 | Fullstack App with Agent Teams | `5.4-demo-fullstack-agent-team` | Build a complete task management app (React + Express + Auth) using coordinated agents: one for the API, one for the frontend, one for tests. |

### Chapter 6: Production Workflows
*Take AI-assisted development from prototype to production: generative media, testing, and building your personal playbook.*

| Video | Title | Demo | Description |
|-------|-------|------|-------------|
| 6.1 | Generative Media for Your Apps | `6.1-demo-generative-media` | Integrate AI-generated images (Nano Banana), video (Veo), and audio (Advanced TTS) into your applications using Google's models in AI Studio. |
| 6.2 | AI-Powered Testing & Debugging | `6.2-demo-testing-debugging` | Use Claude Code and DevTools MCP for test generation, TDD with AI, and automated UX testing pipelines. Turn AI from a code generator into a quality engineer. |
| 6.3 | Your AI Development Playbook | `6.3-demo-ai-playbook` | Capstone: design your personal AI development workflow — a decision framework, reusable template library, and feedback loop for continuous improvement. |

## Demo Structure

Each demo has two versions:
- **`X.Y-demo-name`** — The completed project with all code, configurations, and examples
- **`X.Y-demo-name-clean`** — A minimal starting point for hands-on practice

## Installing
1. To use these exercise files, you must have the following installed:
	- Node.js 18+ and npm
	- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
	- Git
2. Clone this repository into your local machine using the terminal (Mac), CMD (Windows), or a GUI tool like SourceTree.
3. Run `./setup.sh` to install all dependencies at once, or `npm install` in each demo directory individually.

## Instructor

Addy Osmani

Engineering Leader and author focused on AI-assisted development, web performance, and developer tooling.

Check out my other courses on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/).

[lil-course-url]: https://www.linkedin.com/learning/
[lil-thumbnail-url]: https://media.licdn.com/dms/image/v2/D4E0DAQG0eDHsyOSqTA/learning-public-crop_675_1200/B4EZVdqqdwHUAY-/0/1741033220778?e=2147483647&v=beta&t=FxUDo6FA8W8CiFROwqfZKL_mzQhYx9loYLfjN-LNjgA
