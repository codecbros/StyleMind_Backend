# Data Model: Quick Occasion-Based Outfit Generation

**Feature**: 001-quick-outfit-generation
**Date**: 2025-12-28
**Status**: Phase 1 Design

## Overview

This feature reuses existing Prisma models with no schema migrations required. The existing `Combination`, `CombinationItem`, and `WardrobeItem` models already support the necessary fields for occasion-based generation.

## Entities

### 1. QuickGenerateCombinationDto (Input)

**Type**: Request DTO (class-validator)
**Location**: `src/modules/wardrobe/dtos/combinations.dto.ts`

**Purpose**: Validate user input for quick outfit generation endpoint

```typescript
export class QuickGenerateCombinationDto {
  @ApiProperty({
    description: 'The occasion or purpose for the outfit',
    example: 'casual Friday at work',
    minLength: 3,
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  occasion: string;

  @ApiPropertyOptional({
    description: 'Optional flag to request an alternative outfit for the same occasion',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  requestAlternative?: boolean;
}
```

**Validation Rules**:
- `occasion`: Required, 3-500 characters (prevents empty or excessively long inputs)
- `requestAlternative`: Optional boolean, defaults to false

**Business Logic Validation** (in service layer):
- User must have at least 5 wardrobe items (FR-007)
- Only one concurrent generation per user (Assumption 7)

---

### 2. QuickGenerationResponse (Output)

**Type**: Response Interface
**Location**: `src/modules/wardrobe/interfaces/combinations.interface.ts`

**Purpose**: Type-safe response structure for quick generation endpoint

```typescript
export interface QuickGenerationResponse {
  outfit: {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string | null;
    images: {
      id: string;
      url: string;
    }[];
  }[];
  explanation: string;
  occasion: string;
  itemCount: number;
  generatedAt: Date;
}
```

**Field Descriptions**:
- `outfit`: Array of simplified wardrobe items in the generated combination (3-10 items per FR-005)
- `explanation`: AI-generated text explaining why items were chosen together (2-4 sentences per research.md)
- `occasion`: Echo of the input occasion for frontend display
- `itemCount`: Number of items in outfit (convenience field for frontend)
- `generatedAt`: Timestamp of generation for cache/session tracking

**Notes**:
- This is a **transient response** - not persisted unless user explicitly saves (FR-002, clarification)
- Simplified item structure (no full wardrobe details) to reduce response size

---

### 3. GenerationSession (Cache Entity)

**Type**: In-memory cache structure (Keyv)
**Location**: Managed in `CombinationsService` (no dedicated file)

**Purpose**: Track previously shown combinations for alternative generation (FR-011a)

```typescript
interface GenerationSession {
  userId: string;
  occasion: string; // Normalized (lowercase, trimmed)
  previousOutfits: {
    itemIds: string[];
    generatedAt: Date;
  }[];
  createdAt: Date;
  ttl: number; // 3600000 (1 hour)
}
```

**Cache Key Format**: `quick-gen:${userId}:${hashOccasion(occasion)}`

**Lifecycle**:
1. Created on first generation for an occasion
2. Updated on each alternative request (adds current outfit to `previousOutfits`)
3. Deleted when user saves a combination (FR-011b)
4. Auto-expires after 1 hour (TTL)

**Storage Backend**: Keyv (two-tier: in-memory + Redis)

---

### 4. Combination (Prisma Model - Reused)

**Type**: Database entity (existing)
**Location**: `prisma/schema.prisma` (NO CHANGES)

**Purpose**: Persist saved outfits from quick generation

```prisma
model Combination {
  id            String   @id @default(cuid())
  name          String
  description   String?  @db.Text
  status        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()
  userId        String   @map("user_id")
  user          User     @relation(fields: [userId], references: [id])
  isAIGenerated Boolean  @default(false) @map("is_ai_generated") // ✅ Will set to TRUE
  occasions     String[] // ✅ Will store [occasion] from input
  aiDescription String?  @map("ai_description") @db.Text // ✅ Will store explanation

  items             CombinationItem[]
  savedCombinations SavedCombination[]

  @@map("combinations")
}
```

**Fields Used by This Feature**:
- `isAIGenerated`: Set to `true` to mark as AI-generated (FR-010)
- `occasions`: Store the occasion text as single-element array (reuses existing field)
- `aiDescription`: Store the AI explanation (reuses existing field added in recent commit)
- `name`: Auto-generated from occasion (e.g., "Outfit for casual Friday at work")

**Why No Migration Needed**: All necessary fields already exist in schema (added in recent commits per git history)

---

### 5. CombinationItem (Prisma Model - Reused)

**Type**: Database entity (existing)
**Location**: `prisma/schema.prisma` (NO CHANGES)

**Purpose**: Junction table linking combinations to wardrobe items

```prisma
model CombinationItem {
  id             String       @id @default(cuid())
  combinationId  String       @map("combination_id")
  wardrobeItemId String       @map("wardrobe_item_id")
  combination    Combination  @relation(fields: [combinationId], references: [id])
  wardrobeItem   WardrobeItem @relation(fields: [wardrobeItemId], references: [id])
  status         Boolean      @default(true)
  aiDescription  String?      @map("ai_description") @db.Text
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt      DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  @@map("combination_items")
}
```

**Usage**: Standard junction table, no changes needed. Each outfit item gets one `CombinationItem` record.

---

### 6. WardrobeItem (Prisma Model - Read Only)

**Type**: Database entity (existing)
**Location**: `prisma/schema.prisma` (NO CHANGES)

**Purpose**: Source data for outfit generation

```prisma
model WardrobeItem {
  id             String   @id @default(cuid())
  name           String
  description    String?  @db.Text
  status         Boolean  @default(true)
  userId         String   @map("user_id")
  season         String?  // Used for filtering (research.md decision)
  primaryColor   String   @map("primary_color")
  secondaryColor String?  @map("secondary_color")
  style          String
  material       String?
  size           String

  images       Image[]
  categories   WardrobeCategory[]
  combinations CombinationItem[]

  @@map("wardrobe_items")
}
```

**Fields Used**:
- All fields sent to AI for outfit generation
- `season`, `primaryColor`, `style`, `material` used for pre-filtering and compatibility analysis
- `images` relation used to include image URLs in response

---

## Data Flow

### Generation Flow (POST /api/combinations/generate-quick)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST { occasion: "wedding reception" }
       ▼
┌─────────────────────────────────┐
│  QuickGenerateCombinationDto    │ ← class-validator
│  - occasion: "wedding reception"│
│  - requestAlternative: false    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  CombinationsService            │
│  .generateQuickCombination()    │
└──────┬──────────────────────────┘
       │
       ├─→ Check user wardrobe count (≥5 items?) → Throw error if insufficient
       │
       ├─→ Retrieve GenerationSession from cache (if requestAlternative=true)
       │
       ├─→ Query WardrobeItem (filter by userId, status=true, exclude previous IDs)
       │   └─→ Apply season pre-filtering if wardrobe > 100 items
       │
       ├─→ Call AiService.agent() with prompt + Zod schema
       │   └─→ Retry once on failure (2-second delay)
       │
       ├─→ Validate AI response (3-10 items, valid IDs)
       │
       ├─→ Fetch full item details + images from DB
       │
       ├─→ Update/create GenerationSession in cache
       │
       └─→ Return QuickGenerationResponse
           │
           ▼
       ┌─────────────────────────────────┐
       │  QuickGenerationResponse        │
       │  - outfit: [...]                │
       │  - explanation: "..."           │
       │  - occasion: "wedding reception"│
       └─────────────────────────────────┘
```

### Save Flow (Reuses existing POST /api/combinations/save)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST { name: "...", items: [...], explanation: "..." }
       ▼
┌─────────────────────────────────┐
│  SaveCombinationDto (existing)  │
│  + isAIGenerated: true          │ ← New field added to DTO
│  + occasions: ["..."]           │ ← New field added to DTO
│  + aiDescription: "..."         │ ← Existing field
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  CombinationsService.save()     │
└──────┬──────────────────────────┘
       │
       ├─→ Create Combination record (isAIGenerated=true, occasions=[...], aiDescription=...)
       │
       ├─→ Create CombinationItem records (one per outfit item)
       │
       ├─→ Delete GenerationSession from cache (FR-011b - session cleared on save)
       │
       └─→ Return saved combination with ID
```

---

## Validation Rules Summary

### Input Validation (DTO)
- `occasion`: 3-500 chars, string, not empty
- `requestAlternative`: boolean, optional

### Business Logic Validation (Service)
- User must have ≥5 wardrobe items with status=true (FR-007)
- Concurrent generation check: Only one active generation per user (Assumption 7)
- AI response must contain 3-10 items (FR-005)
- All item IDs in AI response must exist in user's wardrobe

### Database Constraints (Prisma)
- All existing constraints on `Combination`, `CombinationItem`, `WardrobeItem` apply
- No new constraints added

---

## State Transitions

### GenerationSession States

```
[No Session]
    │
    │ First generation for occasion
    ▼
[Active Session] ← Contains: userId, occasion, previousOutfits: []
    │
    │ Request alternative
    ├─→ Add current outfit IDs to previousOutfits
    │   └─→ [Active Session Updated]
    │
    │ User saves combination
    ├─→ Delete session (FR-011b)
    │   └─→ [No Session]
    │
    │ TTL expires (1 hour)
    └─→ Auto-delete
        └─→ [No Session]
```

---

## Migration Plan

**Required Migrations**: None ✅

**Rationale**:
- `Combination.isAIGenerated` already exists (added in previous feature)
- `Combination.occasions` already exists (added in previous feature)
- `Combination.aiDescription` already exists (added in commit 242c15e per git history)
- All other fields have existed since initial schema

**Database Compatibility**: PostgreSQL 12+ (existing requirement)

---

## Indexing Recommendations (Future Optimization)

**Not required for MVP**, but consider if performance issues arise:

```sql
-- Index for fast wardrobe item retrieval by user + season
CREATE INDEX idx_wardrobe_user_season ON wardrobe_items(user_id, season) WHERE status = true;

-- Index for combination queries by AI generation flag
CREATE INDEX idx_combinations_ai_generated ON combinations(user_id, is_ai_generated) WHERE status = true;
```

**Decision**: Defer indexing until performance testing with realistic data volumes (100+ items per user)

---

## Edge Case Handling Strategy

The following edge cases are handled by the AI model or service layer without requiring explicit backend logic:

### AI-Handled Edge Cases (No Backend Logic Required)

| Edge Case | Handling Strategy | Rationale |
|-----------|-------------------|-----------|
| **Vague occasion** (e.g., "something nice") | AI interprets context and generates appropriate outfit | Modern LLMs handle ambiguous inputs gracefully; no backend validation needed |
| **Contradictory occasion** (e.g., "casual formal") | AI selects most reasonable interpretation (typically smart-casual) | AI models resolve contradictions based on training; explicit parsing would be brittle |
| **Missing category coverage** (only tops + shoes) | AI generates best possible outfit from available items | Prompt instructs AI to work with available items; validation would frustrate users |
| **Occasion requires unavailable items** (e.g., "black-tie" with no formal wear) | AI selects closest appropriate alternatives + explanation notes limitations | AI explanation field communicates any compromises made |
| **Different language input** | AI processes natively (supports EN, ES, and others) | Vercel AI SDK providers handle multilingual input without translation layer |

### Backend-Validated Edge Cases

| Edge Case | Validation | Error Response |
|-----------|------------|----------------|
| **Wardrobe < 5 items** | `wardrobeCount < 5` check in service | 400: `INSUFFICIENT_ITEMS` - "You need at least 5 items..." |
| **No viable alternatives** | `allItems.length === 0` after exclusion | 404: `NO_ALTERNATIVES` - "No viable alternatives exist..." |
| **AI generation failure** | Retry logic + exception handling | 500: `GENERATION_FAILED` - "Failed to generate outfit. Please try again." (retryable: true) |
| **Invalid AI response** | Zod schema validation (3-10 items, valid IDs) | 500: Internal error, triggers retry |

### Error Response Structure

All error responses follow this format (per contracts/quick-generate-endpoint.yaml):

```typescript
interface ErrorResponse {
  statusCode: number;      // HTTP status code (400, 404, 500)
  message: string;         // Human-readable error message
  error: string;           // Error type ("Bad Request", "Not Found", "Internal Server Error")
  code?: string;           // Machine-readable code (INSUFFICIENT_ITEMS, NO_ALTERNATIVES, GENERATION_FAILED)
  retryable?: boolean;     // Only on 500 errors - indicates manual retry is possible
}
```

---

**Phase 1 Data Model Complete**: All entities documented, no schema changes needed, validation rules defined.
