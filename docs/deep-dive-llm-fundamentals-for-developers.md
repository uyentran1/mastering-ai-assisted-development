## Deep Dive: LLM Fundamentals for Developers
How AI coding models work—and why they fail the way they do

- To use AI coding tools effectively, it helps to understand what's happening under the hood. You don't need a PhD in machine learning, but knowing the basics of how large language models (LLMs) work explains both their impressive capabilities and their characteristic failure modes.

### What is an LLM?

- Large language models are neural networks trained on vast amounts of text data — including billions of lines of code. When you give an LLM a prompt, it predicts the most likely next tokens (words or code fragments) based on patterns it learned during training.
- Key insight: LLMs don't "understand" code the way you do. They recognize patterns and generate statistically likely continuations. This is why they can produce syntactically correct code that's logically wrong—the pattern looks right even when the logic isn't.

### How code generation works

- When you ask an AI to write code, here's what happens:
- Your prompt is tokenized—broken into small pieces the model can process.
- The model considers all the context it has: your prompt, any files you've provided, system instructions, and conversation history.
- It generates tokens one at a time, each one being the statistically most likely next token given everything before it.
- The output is assembled into the code you see.
- This explains several behaviors:
- Why AI code looks convincing—it follows the statistical patterns of well-written code.
- Why specificity matters—more context narrows the probability space to better outputs.
- Why AI "hallucinates"—it generates plausible-looking but nonexistent API calls because the pattern matches even when the specific function doesn't exist.

### The context window

- Every LLM has a context window — the maximum amount of text it can "see" at once. Modern coding models typically have windows of 100K-200K tokens (roughly 75,000-150,000 words). This context window includes:
- System instructions (from the tool)
- Your conversation history
- Any files or code you've provided as context
- The AI's own previous responses
- When the conversation gets too long, older context gets "pushed out" of the window. This is why starting fresh conversations for new tasks often produces better results than continuing very long threads.

### Why AI code fails

- Understanding the mechanism helps you predict and catch failures:
- Hallucinated APIs: The model has seen patterns like library.method(args) thousands of times. It can generate a method call that looks right but doesn't exist, because the pattern is statistically common even if that specific method isn't real.
- Training data cutoff: Models are trained on data up to a certain date. They don't know about APIs released after that date, and they may suggest deprecated patterns from older library versions.
- Confident incorrectness: The token-by-token generation process doesn't have a "I'm not sure" mechanism. The model generates the most likely next token regardless of whether it's correct.
- Context sensitivity: The same prompt with different surrounding context can produce very different outputs, because the statistical patterns shift based on what the model "sees."

### Models used in coding tools

- Different AI coding tools use different underlying models:
- Claude (Anthropic) — Used in Claude Code, Cursor, and others. Known for strong reasoning and long context windows.
- GPT-4 / GPT-4o (OpenAI) — Used in GitHub Copilot and ChatGPT. Strong general-purpose coding.
- Gemini (Google) — Used in Gemini CLI and Google tools. Good integration with Google ecosystem.
- DeepSeek, Qwen, and others — Open-weight models gaining ground in coding tasks.
- The choice of model matters less than how you use it. The techniques in this course — specific prompts, rich context, review-iterate workflows — improve results across all models.

### Key takeaways

- LLMs predict probable code; they don't reason about correctness.
- More context = better predictions = better code.
- Hallucinations aren't bugs — they're a natural consequence of pattern-matching.
- Understanding these mechanics makes you better at directing AI and catching its mistakes.
