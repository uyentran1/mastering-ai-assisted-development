# E-Commerce Platform API

## Architecture
- src/routes/ — Express route handlers (thin layer, delegates to services)
- src/services/ — Business logic (the core of the app)
- src/models/ — Database models and types
- src/middleware/ — Express middleware (auth, validation, rate limiting)
- src/lib/ — Shared utilities (logger, redis, email)
- src/config/ — Configuration and environment

## Data Flow
Request → Route → Middleware → Service → Model → Database
Response flows back the same path.

## Key Patterns
- Services never import routes; routes always import services
- All database access goes through model functions
- Errors bubble up as typed AppError instances
- All responses use envelope: { data, error, meta }

## Commands
- `npm test` — run all tests
- `npm run dev` — start dev server with hot reload
- `npm start` — production start

## Conventions
- Use async/await, never callbacks
- All endpoints follow RESTful naming: /api/v1/resource
- Prices stored as integers (cents), never floats
- Timestamps in ISO 8601 format
