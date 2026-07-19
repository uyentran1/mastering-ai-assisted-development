## Claude Code Hooks: Complete Guide

### What are hooks? And why hooks matter
**PreToolUse:**

**PostToolUse:**

- Safety: Prevent destructive commands (rm -rf, git push --force, credential exposure).
- Quality: Auto-lint, format, test before code lands in your repo
- Compliance: Log all code changes for audit trails.
- Consistency: Enforce repo conventions automatically.

### PreToolUse Hooks: Gatekeeper and confirmation
**Common PreToolUse patterns:**

**1. Reject dangerous bash patterns:**

```
if (toolName === "bash" && command.includes("rm -rf")) {
  return {
    status: "blocked",
    reason: "Destructive commands not allowed"
  };
}
```
**2. Require approval for sensitive operations:**

```
if (toolName === "bash" && command.includes("git push")) {
  return {
    status: "requires_approval",
    prompt: "This will push to remote. Approve?"
  };
}
```
**3. Transform/sanitize commands:**

```
if (toolName === "file_write" && path.includes(".env")) {
  return {
    status: "transform",
    newCommand: "Write to .env.example instead",
    newParams: { path: path.replace(".env", ".env.example") }
  };
}
```

### PostToolUse Hooks: Quality gates and cleanup
**Common PostToolUse patterns:**

**1. Auto-lint generated JavaScript/TypeScript:**

```
if (toolName === "file_write" && filename.endsWith(".ts")) {
  const lintResult = await exec("eslint --fix " + filename);
  return {
    status: "success",
    message: "File written and linted: " + lintResult.output
  };
}
```
**2. Run tests on modified files:**

```
if (toolName === "file_write" && filename.includes("__tests__")) {
  const testResult = await exec("npm test -- " + filename);
  if (!testResult.success) {
    return { status: "warning", message: "Tests failed" };
  }
  return { status: "success" };
}
```
**3. Format code with prettier:**

```
if (toolName === "file_write" && /\.(js|ts|jsx|tsx|json)$/.test(filename)) {
  await exec("prettier --write " + filename);
  return { status: "success", message: "Code formatted" };
}
```
**4. Prevent credential exposure:**

```
if (toolName === "bash" && result.stdout.match(/password|token|secret|key=/i)) {
  return {
    status: "blocked",
    reason: "Output contains sensitive data"
  };
}
```

### Hook configuration: .claude/hooks.json

```
{
  "preToolUse": [
    {
      "name": "block_dangerous_bash",
      "toolName": "bash",
      "rules": [
        { "pattern": "rm -rf", "action": "block" },
        { "pattern": "git push --force", "action": "require_approval" }
      ]
    }
  ],
  "postToolUse": [
    {
      "name": "auto_lint_ts",
      "toolName": "file_write",
      "filePattern": ".*\\.ts",
      "commands": [
        "eslint --fix {filepath}",
        "prettier --write {filepath}"
      ]
    }
  ]
}
```
**Configuration options:**

- name: unique identifier for the hook
- toolName: which tool this hook applies to (bash, file_write, git, etc.)
- rules: conditions and actions (block, require_approval, transform, log)
- commands: Shell commands to run (for PostToolUse)
- filePattern: Regex to match files (for PostToolUse)

### Real examples: Practical hook configurations
**Example 1: Protect .env files**

```
{
  "preToolUse": [{
    "name": "protect_env_files",
    "toolName": "file_write",
    "rules": [
      {
        "pattern": "^\\.env",
        "action": "block",
        "message": "Use .env.example or .env.local instead"
      }
    ]
  }]
}
```
**Example 2: Auto-format and test on file write**

```
{
  "postToolUse": [{
    "name": "format_and_test",
    "toolName": "file_write",
    "filePattern": "src/.*\\.tsx",
    "commands": [
      "prettier --write {filepath}",
      "eslint --fix {filepath}",
      "npm test -- --testPathPattern={filepath}"
    ]
  }]
}
```
**Example 3: Require approval for git operations**

```
{
  "preToolUse": [{
    "name": "git_safety",
    "toolName": "bash",
    "rules": [
      {
        "pattern": "git push.*--force",
        "action": "block",
        "message": "Force push not allowed"
      },
      {
        "pattern": "git push.*main",
        "action": "require_approval",
        "message": "Pushing to main requires approval"
      }
    ]
  }]
}
```
**Example 4: Log all database migrations**

```
{
  "postToolUse": [{
    "name": "audit_migrations",
    "toolName": "file_write",
    "filePattern": "migrations/.*\\.sql",
    "commands": [
      "echo Modified: {filepath} >> AUDIT_LOG.txt"
    ]
  }]
}
```
**Example 5: Prevent secrets in commits**

```
{
  "preToolUse": [{
    "name": "prevent_secret_commits",
    "toolName": "bash",
    "rules": [
      {
        "pattern": "git add.*\\.env",
        "action": "block",
        "message": ".env files should not be committed"
      },
      {
        "pattern": "echo.*password|echo.*token",
        "action": "block",
        "message": "Never echo secrets"
      }
    ]
  }]
}
```

### Debugging hooks: Troubleshooting common issues
**Hook not running?**

1. Check .claude/hooks.json exists in project root.
2. Verify JSON syntax (use a linter).
3. Ensure toolName matches exactly (case-sensitive).
4. Check filePattern regex with a regex tester.
**Hook blocking too much?**

1. Tighten your regex patterns.
2. Use filePattern to scope to specific files.
3. Switch from block to require_approval if the pattern is legitimate but sensitive.
**Commands not executing in PostToolUse?**

1. Test the command manually in bash (syntax may be wrong).
2. Use absolute paths for executables.
3. Ensure {filepath} is being replaced with the actual filename.
4. Check command timeout settings if operations are slow.

### Security hooks: Preventing data leaks
**Best practices for security-focused hooks:**

**1. Block credential patterns in output:**

```
{
  "postToolUse": [{
    "name": "block_credential_output",
    "toolName": "bash",
    "rules": [
      {
        "outputPattern": "password|token|secret|api_key",
        "action": "block",
        "message": "Output contains sensitive data"
      }
    ]
  }]
}
```
**2. Prevent writing to shared locations:**

```
{
  "preToolUse": [{
    "name": "isolate_sensitive_files",
    "toolName": "file_write",
    "rules": [
      {
        "path": "/tmp|/var/log|/etc/",
        "action": "block",
        "message": "Cannot write to system directories"
      }
    ]
  }]
}
```
**3. Audit sensitive bash commands:**

```
{
  "preToolUse": [{
    "name": "audit_sensitive_ops",
    "toolName": "bash",
    "rules": [
      {
        "pattern": "curl.*Authorization|wget.*auth",
        "action": "require_approval",
        "message": "HTTP request with credentials"
      }
    ]
  }]
}
```

### Summary

- PreToolUse: Block dangerous patterns, require approval for sensitive operations, transform commands.
- PostToolUse: Auto-lint, format, test, audit, and log code changes.
- Configuration: Use .claude/hooks.json with clear rules, patterns, and actions.
- Debug: Check JSON syntax, regex patterns, tool names, and command paths.
- Security: Prevent credential exposure, isolate system directories, audit sensitive operations.
