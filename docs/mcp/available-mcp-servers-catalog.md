## Available MCP Servers: Catalog

### Summary
**Updated catalog of public MCP servers organized by category:** version control, databases, design tools, monitoring, and more

### Overview
The MCP ecosystem is growing rapidly. This catalog lists the most useful public MCP servers, organized by category.

### Version control
GitHub (`@modelcontextprotocol/server-github`)
Issues, PRs, commits, CI status, repository information; requires a personal access token with repo scope

GitLab (community)
Similar capabilities for GitLab repositories

## Databases
PostgreSQL (`@modelcontextprotocol/server-postgres)`
Schema queries, table inspection, SQL execution; use read-only credentials for safety.

MySQL (`@modelcontextprotocol/server-mysql`)
Schema and query support for MySQL databases

SQLite (community)
Local database access for development

## File systems and browser
Filesystem (`@modelcontextprotocol/server-filesystem`)
Extended file operations beyond what's available in the AI tool natively

Puppeteer (`@modelcontextprotocol/server-puppeteer`)
Browser automation, screenshots, page interaction

Playwright (community)
Alternative browser automation with cross-browser support

## Project management and communication
Linear (community)
Issue tracking, sprint management, project queries

Jira (community)
Atlassian issue tracking integration

Slack (community)
Team communication, channel queries, message posting

## Monitoring and observability
Sentry (community)
Error tracking, issue investigation, stack trace analysis

Datadog (community)
Metrics, monitoring, alerting

## Design
Figma (community)
Design file access, component inspection, design token extraction

## Setup pattern
All MCP servers follow the same configuration pattern in your AI tool's settings.
The key fields are:

- Server name
- Command (usually `npx`)
- Args (the npm package)
- Env (credentials as environment variables)

## Recommendations

- Start with GitHub MCP — it's the most immediately useful for most developers.
- Add database MCP next if you work with databases regularly.
- Be selective — each server adds tools to the context window.
- Check the MCP ecosystem regularly for new servers.
