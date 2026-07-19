## Template Library: Prompts for Common Coding Tasks
Copy‑paste prompt templates for everyday **AI‑assisted development**. Replace the `[bracketed placeholders]` with your specifics.

### Code generation
`Create a [module/class/function] in [language]:`
`- Name: [specific name]`
`- Input: [input type and description]`
`- Output: [return type and shape]`
`- Algorithm: [approach to use]`
`- Constraints: [limitations and requirements]`
`- Edge cases: [specific scenarios to handle]`
`Include type definitions and JSDoc/docstring comments.`** **

### Bug fixing
`I have a bug in [file/function]:`
`Error: [paste error message]`
`Expected: [what should happen]`
`Actual: [what happens]`
`Context: [relevant code or @file references]`
`Find the root cause and suggest a fix.`
`Do NOT change unrelated code.`

### Refactoring
`Refactor [function/class/module] to:`
`- [Specific improvement]`
`- [Constraint: preserve public API]`
`- [Quality goal]`
`Do NOT:`
`- Change function signatures`
`- Add new dependencies`
`- Modify test files`

### Test generation
`Write [framework] tests for [module/function]:`
`- Happy path with typical input`
`- Edge cases: [empty, null, boundary values]`
`- Error cases: [invalid input, failures]`
`- [Domain-specific scenarios]`
`Mock: [external dependencies]`
`Structure: [describe/it blocks or test classes]`

### Code review
`Review this code for:`
`1. Correctness — logic errors, edge cases`
`2. Security — injection, auth, data leakage`
`3. Performance — bottlenecks, memory`
`4. Maintainability — clarity, structure`
`Rate issues by severity.`
`Do NOT suggest style changes.`

### Documentation
`Write documentation for [module/API]:`
`- Overview: what it does and when to use it`
`- API reference: each public function/method`
`- Examples: 2-3 usage examples`
`- Error handling: what can go wrong`
`Format: [Markdown/JSDoc/docstring]`
`Audience: [developers on the team]`

### Performance optimization
`Analyze [function/module] for performance:`
`- Identify bottlenecks`
`- Suggest optimizations with trade-offs`
`- Estimate impact (high/medium/low)`
`- Preserve correctness`
`Context: [expected data volume, frequency of calls]`
