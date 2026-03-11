# Backend Rules (loaded when editing src/server/** or src/api/**)
# In Cline, place rules in .clinerules/ so they load automatically for the project.

## API Conventions
- All endpoints return { data, error } envelope
- Use Express error middleware for error handling
- Validate all inputs with Zod
- Use async/await, never callbacks
