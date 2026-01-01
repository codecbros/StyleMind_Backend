# Implementation Plan: Quick Occasion-Based Outfit Generation

**Branch**: `001-quick-outfit-generation` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-quick-outfit-generation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a simplified outfit generation flow where users provide only an occasion (e.g., "wedding reception", "casual Friday at work") and the system automatically generates appropriate outfit combinations from their entire wardrobe using AI. This differs from the existing category-based generation by eliminating manual base item and category selection, reducing user input time by ~70% while maintaining outfit quality through enhanced AI prompts that analyze all wardrobe items for compatibility (color, style, season, material).

## Technical Context

**Language/Version**: TypeScript 5.x with NestJS 11
**Primary Dependencies**:
  - NestJS 11 with Fastify adapter (HTTP server)
  - Vercel AI SDK 3.x (multi-provider AI abstraction)
  - Prisma 5.x (PostgreSQL ORM)
  - Zod 3.x (schema validation for AI responses)
  - class-validator + class-transformer (DTO validation)
  - BullMQ (background job queue - potential future use for async generation)
  - Keyv (two-tier caching: in-memory + Redis)

**Storage**: PostgreSQL with Prisma ORM (existing `Combination`, `WardrobeItem`, `CombinationItem` models will be reused)

**Testing**: Jest (unit tests colocated as `*.spec.ts`, e2e tests in `test/` directory). Tests are OPTIONAL unless explicitly required by spec - current spec does not mandate tests.

**Target Platform**: Node.js server (Linux/macOS) with REST API endpoints

**Project Type**: Backend API (part of existing NestJS monolith at `src/modules/wardrobe/`)

**Performance Goals**:
  - Generation must complete within 30 seconds (FR-014)
  - Support wardrobes containing 10-100 items with consistent quality (SC-002)
  - 90% success rate for adequate wardrobes (SC-005)
  - For 100+ item wardrobes, may need sampling/pre-filtering (Assumption 6)

**Constraints**:
  - Single concurrent generation per user (Assumption 7)
  - Minimum 5 wardrobe items required (FR-007)
  - Maximum 10 items in generated outfit (FR-005)
  - Must display progress indicators during 0-30 second wait (FR-014a)
  - One automatic retry on AI failure, then manual retry option (FR-013)

**Scale/Scope**:
  - Extends existing `wardrobe` module (~15 files currently)
  - Will add: 1 new controller endpoint, 1 new service method, 1 new DTO, 1 new AI prompt
  - Reuses existing database schema (no migrations needed - `Combination.isAIGenerated` already exists)
  - API documentation updates in Swagger

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| **I. AI-Powered Functionality** | ✅ PASS | Feature MUST use `AiService` abstraction layer for outfit generation. Will call `AiService.agent()` with Zod schema (same pattern as existing `generateCombinations`). Multi-provider support (Google/OpenAI/Ollama/LMStudio) already implemented. |
| **II. Modular Architecture** | ✅ PASS | Extends existing `wardrobe` NestJS module. New endpoint in `CombinationsController`, new method in `CombinationsService`. No cross-module implementation access - uses only exported services (`AiService`, `PrismaService`, `MultimediaService`). |
| **III. API-First Design** | ✅ PASS | Will add new REST endpoint `POST /api/combinations/generate-quick` with Swagger documentation. Uses standard HTTP methods semantically. All responses documented in OpenAPI spec at `/api-docs`. |
| **IV. Type Safety** | ✅ PASS | Will define `QuickGenerateCombinationDto` with class-validator decorators. AI response validated via Zod schema. Reuses existing Prisma models (`Combination`, `CombinationItem`). No schema migration needed - existing fields support this feature. |
| **V. Testing Discipline** | ✅ PASS | Feature spec does NOT explicitly require tests, so tests are OPTIONAL per constitution. If added later, unit tests would be colocated as `combinations.service.spec.ts` (already exists for related methods). |
| **VI. Performance & Scalability** | ⚠️ ADVISORY | Generation is synchronous HTTP request (30s max). Constitution recommends BullMQ for AI processing to prevent blocking. However, existing `generateCombinations` is also synchronous with similar AI workload, so maintaining consistency. May revisit if performance issues arise. Progress indicators (FR-014a) improve UX during wait. |
| **VII. Security by Default** | ✅ PASS | Endpoint protected by `@UseGuards(JwtAuthGuard, RoleGuard)` and `@Role(RoleEnum.USER)`. Input validated via `QuickGenerateCombinationDto` with ValidationPipe. Rate limiting enforced globally (15 req/60s). No file uploads in this endpoint. |

**Path Aliases Compliance**: Will use `@/` and `@modules/` aliases consistently (e.g., `@modules/ai/ai.service`, `@shared/services/prisma.service`).

**Configuration Management**: No new configuration needed - reuses existing AI and database configs from respective modules.

**Pre-Phase 0 Gate Decision**: ✅ PASS with advisory note on Principle VI. The synchronous approach is justified by consistency with existing `generateCombinations` implementation. No violations requiring Complexity Tracking section.

## Project Structure

### Documentation (this feature)

```text
specs/001-quick-outfit-generation/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── quick-generate-endpoint.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Project Type**: Backend API (NestJS monolith)

```text
src/
├── modules/
│   ├── wardrobe/                              # Target module for this feature
│   │   ├── controllers/
│   │   │   └── combinations/
│   │   │       ├── combinations.controller.ts # 🔧 MODIFY: Add generateQuick endpoint
│   │   │       └── combinations.controller.spec.ts
│   │   ├── services/
│   │   │   ├── combinations.service.ts        # 🔧 MODIFY: Add generateQuickCombination method
│   │   │   └── combinations.service.spec.ts
│   │   ├── dtos/
│   │   │   └── combinations.dto.ts            # 🔧 MODIFY: Add QuickGenerateCombinationDto
│   │   ├── prompts/
│   │   │   └── combinations.prompts.ts        # 🔧 MODIFY: Add generateQuickCombinationsPrompt
│   │   └── interfaces/
│   │       └── combinations.interface.ts      # 🔧 MODIFY: Add QuickGenerationResponse interface
│   ├── ai/
│   │   └── ai.service.ts                      # ✅ REUSE: Existing service
│   └── multimedia/
│       └── services/
│           └── multimedia.service.ts          # ✅ REUSE: For retrieving item images
├── shared/
│   ├── services/
│   │   └── prisma.service.ts                  # ✅ REUSE: Database access
│   └── dtos/
│       └── pagination.dto.ts                  # ✅ REUSE: Pagination utilities
└── main.ts                                    # No changes needed

prisma/
└── schema.prisma                              # ✅ NO MIGRATION: Reuse existing Combination model

test/                                          # Optional e2e tests (not required by spec)
└── wardrobe/
    └── quick-combinations.e2e-spec.ts         # 📝 OPTIONAL: E2E test if needed
```

**Structure Decision**: This is a backend-only feature extending the existing `wardrobe` module in the NestJS monolith. The module already contains combinations functionality, so we're adding a new generation method alongside the existing category-based approach. No new modules or database migrations required - we're enhancing existing code with a simpler user flow while reusing the same data models and AI infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - this section is empty because all Constitution principles are satisfied.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion (per workflow requirement)*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. AI-Powered Functionality** | ✅ PASS | Design confirmed: Uses `AiService.agent()` with Zod schema. Prompt in `generateQuickCombinationsPrompt()` follows existing patterns. Multi-provider support unchanged. |
| **II. Modular Architecture** | ✅ PASS | Design confirmed: No new modules created. All code extends existing `wardrobe` module. Clear separation: DTOs in `dtos/`, services in `services/`, prompts in `prompts/`. No tight coupling introduced. |
| **III. API-First Design** | ✅ PASS | Design confirmed: OpenAPI contract in `contracts/quick-generate-endpoint.yaml` documents full API. Endpoint: `POST /api/combinations/generate-quick`. Swagger decorators in controller ensure `/api-docs` updated. |
| **IV. Type Safety** | ✅ PASS | Design confirmed: `QuickGenerateCombinationDto` with class-validator. `QuickGenerationResponse` TypeScript interface. AI response validated via Zod. Prisma models ensure DB type safety. Zero `any` types in design. |
| **V. Testing Discipline** | ✅ PASS | Design confirmed: Tests optional per constitution. Quickstart includes manual testing checklist. If tests added later, would use Jest with existing patterns (`combinations.service.spec.ts`). |
| **VI. Performance & Scalability** | ✅ PASS (Advisory) | Design confirmed: Synchronous approach maintained for consistency with existing `generateCombinations`. Research.md addresses 100+ item wardrobes via pre-filtering. Session cache uses Keyv (existing two-tier cache). Retry logic with 2s delay prevents rate limit hammering. Performance monitoring metrics defined in quickstart.md. |
| **VII. Security by Default** | ✅ PASS | Design confirmed: Endpoint protected by `@UseGuards(JwtAuthGuard, RoleGuard)`. Input validated via `QuickGenerateCombinationDto` + ValidationPipe. Rate limiting enforced globally (existing ThrottlerGuard). No file uploads. Session keys use userId (prevents cross-user access). |

**Post-Design Gate Decision**: ✅ PASS - All principles satisfied. Design artifacts (data-model.md, contracts/, quickstart.md) confirm constitutional compliance. Ready for task generation (Phase 2) and implementation.

**Change from Pre-Design Check**: Advisory note on Principle VI remains - synchronous approach justified by consistency. Research.md provides mitigation strategy for large wardrobes (season-based pre-filtering).

---

## Phase 2 Next Steps

**Status**: Phase 0 (Research) and Phase 1 (Design) complete ✅

**Deliverables Generated**:
- ✅ `plan.md` - This file (implementation plan)
- ✅ `research.md` - Technical research and key decisions
- ✅ `data-model.md` - Entity definitions and validation rules
- ✅ `contracts/quick-generate-endpoint.yaml` - OpenAPI specification
- ✅ `quickstart.md` - Developer implementation guide
- ✅ Agent context updated (`CLAUDE.md`)

**Next Command**: Run `/speckit.tasks` to generate actionable task breakdown in `tasks.md`

**After Task Generation**: Run `/speckit.implement` to execute implementation (or implement manually using `quickstart.md` as guide)

**Branch**: `001-quick-outfit-generation` (already checked out per git status)

**No Breaking Changes**: This feature extends existing functionality without modifying existing endpoints or data models.
