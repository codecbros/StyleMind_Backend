<!--
SYNC IMPACT REPORT
==================
Version Change: Initial creation → 1.0.0
Modified Principles: N/A (initial version)
Added Sections: All sections newly created
Removed Sections: None
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns with principles
  ✅ .specify/templates/spec-template.md - Requirements structure aligns with principles
  ✅ .specify/templates/tasks-template.md - Task categorization reflects principle-driven development
Follow-up TODOs: None
-->

# StyleMind Backend Constitution

## Core Principles

### I. AI-Powered Functionality
StyleMind Backend MUST leverage Generative AI as a core feature, not an optional add-on. Every outfit combination generation MUST utilize the AI Service abstraction layer. The AI Service MUST support multiple providers (Google Gemini, OpenAI, Ollama, LMStudio) through a unified interface, ensuring vendor flexibility and avoiding lock-in.

**Rationale**: The project's primary value proposition is AI-driven wardrobe management. Provider abstraction ensures business continuity if any single AI service becomes unavailable or cost-prohibitive.

### II. Modular Architecture
Features MUST be organized as self-contained NestJS modules with clear boundaries. Each module MUST manage its own configuration, services, controllers, and DTOs. Modules MUST NOT directly access other modules' internal implementations—only through explicit exports and imports.

**Rationale**: Modular architecture enables independent testing, parallel development, and easier maintenance. Clear module boundaries prevent tight coupling and facilitate future refactoring.

### III. API-First Design
All functionality MUST be exposed through well-documented REST API endpoints. APIs MUST use standard HTTP methods (GET, POST, PUT, DELETE, PATCH) semantically. All endpoints MUST be documented in Swagger/OpenAPI specification accessible at `/api-docs`.

**Rationale**: API-first design supports multiple frontends (web, mobile, CLI) and enables third-party integrations. Swagger documentation ensures API discoverability and correct usage.

### IV. Type Safety
All data structures MUST be type-safe using TypeScript interfaces, Prisma models, and class-validator decorators. Database schema changes MUST be versioned through Prisma migrations. DTOs MUST validate input data using class-validator with explicit ValidationPipe configuration.

**Rationale**: Type safety prevents runtime errors, improves developer experience with IDE autocomplete, and ensures data integrity across the application stack.

### V. Testing Discipline
Tests are OPTIONAL unless explicitly required by feature specifications. When tests are required, they MUST be written BEFORE implementation (TDD). Unit tests MUST be colocated with source files (`*.spec.ts`). Integration tests MUST reside in `test/` directory. Test coverage MUST NOT be a metric that drives feature development decisions.

**Rationale**: Test-first ensures design thinking and prevents implementation bias. However, over-testing creates maintenance burden. Tests should validate critical business logic and integration points, not achieve arbitrary coverage percentages.

### VI. Performance & Scalability
The application MUST use two-tier caching (in-memory + Redis) for frequently accessed data. Background jobs (image processing, AI generation) MUST use BullMQ queues to prevent blocking HTTP requests. Database queries MUST use Prisma's query optimization features and MUST NOT perform N+1 queries.

**Rationale**: Real-world wardrobe applications handle user-uploaded images and AI processing, both CPU/network intensive. Async processing and caching ensure responsive user experience under load.

### VII. Security by Default
All endpoints requiring user context MUST be protected by JWT authentication guards. User passwords MUST be hashed using bcrypt with appropriate cost factor. File uploads MUST be validated for type, size (10MB max), and count (4 files max). Rate limiting MUST be enforced (15 requests per 60 seconds) to prevent abuse.

**Rationale**: Security is non-negotiable in applications handling personal data (wardrobe items, user profiles). Defense-in-depth ensures multiple layers protect against common attack vectors.

## Technology Standards

### Required Stack
- **Framework**: NestJS 11 with Fastify adapter (NOT Express)
- **AI Integration**: Vercel AI SDK 3 with provider abstraction
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Keyv with Redis backend + in-memory tier
- **Queue**: BullMQ for background job processing
- **Storage**: Pluggable (Firebase Storage or MinIO)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI via @nestjs/swagger
- **Package Manager**: Yarn (specified in package.json `packageManager` field)

### Path Aliases
- `@/*` → `src/*`
- `@modules/*` → `src/modules/*`
- `@shared/*` → `src/shared/*`

These MUST be used consistently to avoid relative path hell (`../../..`).

### Configuration Management
Each module MUST define its configuration in a `config/` subdirectory using NestJS ConfigModule. Configuration MUST be type-safe and registered via `ConfigModule.forFeature()`. Environment variables MUST be validated at startup, failing fast if required values are missing.

## Development Workflow

### Code Quality Gates
Code MUST be formatted with Prettier (`yarn format`). Pre-commit hooks are RECOMMENDED but not enforced (developers can bypass if needed for WIP commits).

### Database Migrations
Schema changes MUST use Prisma migrations (`yarn prisma migrate dev`). Migrations MUST be tested locally before merging. Production deployments MUST run `yarn prisma migrate deploy` before starting the application.

### File Uploads
File uploads MUST use Fastify's `@fastify/multipart` plugin (NOT Express multer). Uploaded files MUST be processed asynchronously via the `ImagesConsumer` BullMQ worker. Storage backend MUST be abstracted through `MultimediaService` to support both MinIO and Firebase.

### AI Service Usage
AI generation MUST use `AiService.generateJSON()` or `AiService.agent()` for structured outputs with Zod schema validation. AI prompts SHOULD be organized in module-specific `prompts/` directories. AI provider selection MUST be configurable via `AI_PROVIDER` environment variable without code changes.

## Governance

### Amendment Process
This constitution can be amended through pull requests that update this file. Amendments MUST include:
1. Clear rationale for the change in the PR description
2. Impact analysis on existing codebase
3. Migration plan if principles change (e.g., moving from Express to Fastify)
4. Update to dependent templates (plan-template.md, spec-template.md, tasks-template.md)

### Version Bumping Rules
- **MAJOR**: Backward-incompatible changes (e.g., removing a principle, changing stack requirements)
- **MINOR**: New principles added, material expansions to guidance
- **PATCH**: Clarifications, typo fixes, non-semantic improvements

### Compliance Review
All pull requests MUST verify compliance with this constitution. Complexity that violates principles (e.g., adding a 4th storage provider, introducing a non-NestJS framework) MUST be justified in the "Complexity Tracking" section of implementation plans. Unjustified violations MUST be rejected.

### Runtime Guidance
For day-to-day development guidance not covered in this constitution, developers MUST reference [CLAUDE.md](../../CLAUDE.md) at the repository root. CLAUDE.md provides tactical information (commands, file structure, development patterns) while this constitution defines strategic constraints.

**Version**: 1.0.0 | **Ratified**: 2025-12-28 | **Last Amended**: 2025-12-28
