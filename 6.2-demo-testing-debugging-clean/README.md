# 6.2 AI-Powered Testing & Debugging — Clean Version

## Overview

This is the **starting point** for the Testing & Debugging demo. You'll use Claude Code and DevTools MCP to write comprehensive test suites, catch regressions, and debug runtime issues.

## What You'll Practice

Three workflows:
1. **Test Generation** — Claude writes tests from specs and existing code
2. **TDD with AI** — Write spec, agent writes tests, agent implements until green
3. **Automated UX Testing** — DevTools MCP runs repeatable UX audits

## Prerequisites

- Node.js + TypeScript
- Jest + Supertest
- Chrome DevTools MCP configured:
  ```bash
  claude mcp add chrome-devtools -- npx @anthropic-ai/chrome-devtools-mcp@latest
  ```

## Getting Started

1. Read the completed version in `6.2-demo-testing-debugging/README.md` for the full walkthrough
2. Set up a simple Express API with intentional gaps (missing validation, untested edge cases)
3. Ask Claude to generate comprehensive tests and watch it find bugs
4. Try TDD: write a spec, let Claude write tests first, then implement

## See the Completed Version

Check `6.2-demo-testing-debugging/` for the full guide with demo app, slash commands, and step-by-step flow.
