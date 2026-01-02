# Tasks: Quick Occasion-Based Outfit Generation

**Input**: Design documents from `/specs/001-quick-outfit-generation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/quick-generate-endpoint.yaml

**Tests**: OPTIONAL - Not explicitly required in feature specification (per constitution V)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: NestJS monolith backend
- All source files in `src/modules/wardrobe/`
- Database: PostgreSQL with Prisma (no migrations needed - existing schema sufficient)

---

## Phase 1: Setup

**Purpose**: Verify prerequisites and environment readiness

- [X] T001 Verify branch `001-quick-outfit-generation` is checked out and up to date
- [X] T002 [P] Verify Prisma schema has required fields (`Combination.isAIGenerated`, `Combination.occasions`, `Combination.aiDescription`)
- [X] T003 [P] Verify existing wardrobe module structure matches plan.md expectations in `src/modules/wardrobe/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core interfaces and types that MUST be complete before ANY user story can be implemented

**No foundational tasks required** - This feature extends existing infrastructure:
- `AiService` already exists and supports `agent()` method
- `PrismaService` already configured
- Cache manager (Keyv) already configured
- Authentication guards already in place

**Checkpoint**: Foundation ready - user story implementation can proceed

---

## Phase 3: User Story 1 - Quick Outfit Generation from Occasion (Priority: P1) MVP

**Goal**: User provides an occasion and receives a complete outfit from their entire wardrobe

**Independent Test**: Call `POST /api/combinations/generate-quick` with `{ "occasion": "casual Friday at work" }` and receive outfit with 3-10 items plus explanation

### Implementation for User Story 1

- [X] T004 [P] [US1] Add `QuickGenerateCombinationDto` class in `src/modules/wardrobe/dtos/combinations.dto.ts`
- [X] T005 [P] [US1] Add `QuickGenerationResponse` interface in `src/modules/wardrobe/interfaces/combinations.interface.ts`
- [X] T006 [P] [US1] Add `generateQuickCombinationsPrompt()` function in `src/modules/wardrobe/prompts/combinations.prompts.ts`
- [X] T007 [US1] Add `_fetchWardrobeItems()` private helper with FR-015 season context detection in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T008 [US1] Add `_attemptGeneration()` private helper with retry logic in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T009 [US1] Add `_fetchOutfitDetails()` private helper method in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T010 [US1] Add core `generateQuickCombination()` service method in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T011 [US1] Add `POST generate-quick` endpoint with Swagger decorators in `src/modules/wardrobe/controllers/combinations/combinations.controller.ts`
- [X] T012 [US1] Add minimum wardrobe validation (5 items) in `generateQuickCombination()` method
- [X] T013 [US1] Add AI response validation (3-10 items, valid IDs) and FR-008 error handling (no suitable combination) in `generateQuickCombination()` method

**Checkpoint**: User Story 1 complete - Users can generate outfits from occasion input. This is the MVP.

---

## Phase 4: User Story 2 - Save and Manage Quick-Generated Outfits (Priority: P2)

**Goal**: User can save generated outfits with occasion details and AI-generated flag

**Independent Test**: Generate outfit, then call save endpoint with `{ "isAIGenerated": true, "occasions": ["casual Friday"] }` and verify combination is persisted with correct flags

### Implementation for User Story 2

- [X] T014 [P] [US2] Verify `SaveCombinationDto` supports `isAIGenerated` and `occasions` fields in `src/modules/wardrobe/dtos/combinations.dto.ts`
- [X] T015 [US2] Update `saveCombination()` to accept and persist `isAIGenerated: true` and `occasions` array in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T016 [US2] Verify saved combinations display correctly with AI-generated marker in list queries

**Checkpoint**: User Story 2 complete - Users can save quick-generated outfits with proper metadata

---

## Phase 5: User Story 3 - Regenerate Alternative Outfits (Priority: P3)

**Goal**: User can request alternative outfits for the same occasion, excluding previously shown items

**Independent Test**: Generate first outfit, then call with `{ "occasion": "same occasion", "requestAlternative": true }` and receive different items

### Implementation for User Story 3

- [X] T017 [P] [US3] Add `GenerationSession` interface in `src/modules/wardrobe/interfaces/combinations.interface.ts`
- [X] T018 [US3] Inject cache manager in `CombinationsService` constructor in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T019 [US3] Add `_getOrCreateSession()` private helper for session management in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T020 [US3] Add `_updateSession()` private helper to track shown outfits in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T021 [US3] Add `_deleteGenerationSession()` method to clear session on save in `src/modules/wardrobe/services/combinations.service.ts`
- [X] T022 [US3] Update `generateQuickCombination()` to handle `requestAlternative` flag and exclude previous items
- [X] T023 [US3] Update `saveCombination()` to call `_deleteGenerationSession()` when saving quick-generated outfit
- [X] T024 [US3] Add "no viable alternatives" error handling (404 response) when all items exhausted

**Checkpoint**: User Story 3 complete - Users can request alternative outfits with variety

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T025 [P] Verify Swagger documentation at `/api-docs` shows new endpoint with all schemas
- [X] T026 [P] Verify rate limiting (15 req/60s) applies to new endpoint (existing guards apply to all endpoints)
- [ ] T027 Run quickstart.md testing checklist to validate all scenarios (requires running server)
- [X] T028 Update `CLAUDE.md` with feature completion notes via `.specify/scripts/bash/update-agent-context.sh claude`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify environment
- **Foundational (Phase 2)**: No tasks - existing infrastructure sufficient
- **User Story 1 (Phase 3)**: Depends on Setup - core MVP functionality
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs generation to test save)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (extends generation with sessions)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - **can be delivered as MVP**
- **User Story 2 (P2)**: Uses output from US1 to save - integrates but independently testable
- **User Story 3 (P3)**: Extends US1 with session management - integrates but independently testable

### Task Dependencies Within Phases

**Phase 3 (US1):**
- T004, T005, T006 can run in parallel (different files)
- T007, T008, T009 depend on T005 (need interface)
- T010 depends on T007, T008, T009 (uses helpers)
- T011 depends on T004, T010 (needs DTO and service)
- T012, T013 are refinements to T010

**Phase 5 (US3):**
- T017 can run in parallel with Phase 4
- T018-T021 depend on T017 (need interface)
- T022-T024 depend on T019-T021 (use session methods)

---

## Parallel Execution Examples

### Phase 3: User Story 1 (Initial Tasks)

```bash
# Launch these tasks in parallel (different files):
Task T004: "Add QuickGenerateCombinationDto in src/modules/wardrobe/dtos/combinations.dto.ts"
Task T005: "Add QuickGenerationResponse in src/modules/wardrobe/interfaces/combinations.interface.ts"
Task T006: "Add generateQuickCombinationsPrompt in src/modules/wardrobe/prompts/combinations.prompts.ts"
```

### Phase 6: Polish (Final Tasks)

```bash
# Launch these tasks in parallel:
Task T025: "Verify Swagger documentation"
Task T026: "Verify rate limiting"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Skip Phase 2: No foundational tasks needed
3. Complete Phase 3: User Story 1 (T004-T013)
4. **STOP and VALIDATE**: Test with `/api/combinations/generate-quick`
5. Deploy/demo core generation functionality

### Incremental Delivery

1. Setup → Ready
2. User Story 1 → Test independently → **Deploy MVP!**
3. User Story 2 → Test independently → Deploy save functionality
4. User Story 3 → Test independently → Deploy alternatives feature
5. Polish → Final validation

### Single Developer Strategy

1. Complete T004-T006 in parallel (10 min)
2. Complete T007-T009 sequentially (20 min)
3. Complete T010-T013 sequentially (30 min)
4. **MVP Complete** - validate before continuing
5. Complete T014-T016 (15 min)
6. Complete T017-T024 (45 min)
7. Complete T025-T028 (15 min)

---

## File Summary

| File | Tasks | Changes |
|------|-------|---------|
| `src/modules/wardrobe/dtos/combinations.dto.ts` | T004, T014 | Add `QuickGenerateCombinationDto`, verify `SaveCombinationDto` |
| `src/modules/wardrobe/interfaces/combinations.interface.ts` | T005, T017 | Add `QuickGenerationResponse`, `GenerationSession` |
| `src/modules/wardrobe/prompts/combinations.prompts.ts` | T006 | Add `generateQuickCombinationsPrompt()` |
| `src/modules/wardrobe/services/combinations.service.ts` | T007-T010, T012-T013, T015, T018-T024 | Core implementation |
| `src/modules/wardrobe/controllers/combinations/combinations.controller.ts` | T011 | Add `generate-quick` endpoint |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No database migrations required - existing schema is sufficient
- Tests are OPTIONAL per constitution (not explicitly required in spec)
- All endpoints protected by existing `JwtAuthGuard` and `RoleGuard`
- Commit after each task or logical group for clean git history
