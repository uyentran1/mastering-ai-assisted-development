## The 70% Problem: Hard Truths About AI-Assisted Coding

### What happens after AI gets you most of the way there
There's a pattern that emerges consistently when developers adopt AI coding tools: the AI gets you about 70% of the way to a working solution surprisingly fast. The remaining 30% — making it production-ready — is where the real engineering happens.

### The pattern in practice
A typical AI-assisted development session looks like thiås:

1. You describe what you want. The AI generates a first draft in seconds.
2. The code looks good. It compiles, it runs, basic tests pass.
3. You start looking closer. Edge cases are missing. The error handling is generic. There's a potential security issue.
4. You iterate. Each fix introduces new complexity. Some AI suggestions help; others create new problems.
5. Eventually, you're doing careful, manual engineering work to get the last 30% right.
This isn't a criticism of AI tools — it's a recognition of where they excel and where they don't.

### What the 70% includes

- Boilerplate and project scaffolding
- Standard patterns (CRUD endpoints, form components, data transformations)
- Common algorithms and data structures
- Basic test generation
- Documentation and comments
- Code transformations and refactoring

### What the 30% requires

- Architectural decisions that fit your specific system
- Edge case handling for your specific domain
- Security hardening (input validation, authentication, authorization)
- Performance optimization for your specific scale
- Integration with existing systems and conventions
- Product judgment—does this actually solve the user's problem?

### The knowledge paradox
Here's the counterintuitive finding: senior engineers get more value from AI tools than junior engineers. This is the "knowledge paradox."

Senior engineers can evaluate AI output immediately, spot hallucinated APIs, catch security issues, and guide the AI toward better solutions. They use AI to accelerate work they already know how to do.** **

Less experienced developers may accept incorrect patterns, miss vulnerabilities, and build systems they don't fully understand. The AI's confident output can mask a lack of foundational knowledge.

The implication: AI tools are a multiplier, not a replacement for skill. Invest in your engineering fundamentals, and AI tools will amplify that investment.

### Working with the 70/30 split
The most effective approach is to embrace the split:

- Let AI handle the 70%—generation, boilerplate, first drafts, common patterns.
- Focus your energy on the 30%—architecture, security, edge cases, product decisions.
- Use the review-iterate workflow to bridge the gap systematically.
- Build your engineering skills—they become more valuable, not less, in an AI-assisted world.
