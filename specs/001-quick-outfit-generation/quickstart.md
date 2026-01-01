# Quickstart: Quick Occasion-Based Outfit Generation

**Feature**: 001-quick-outfit-generation
**Branch**: `001-quick-outfit-generation`
**Estimated Implementation Time**: 4-6 hours

## Overview

This guide provides a step-by-step implementation plan for adding quick occasion-based outfit generation to the StyleMind Backend.

## Prerequisites

- NestJS 11+ with Fastify adapter
- Vercel AI SDK configured with at least one provider (Google Gemini, OpenAI, Ollama, or LMStudio)
- Prisma ORM connected to PostgreSQL
- Existing `wardrobe` module with combinations functionality
- Keyv cache configured (in-memory + Redis)

## Implementation Steps

### Step 1: Add DTO (15 minutes)

**File**: `src/modules/wardrobe/dtos/combinations.dto.ts`

Add the new DTO for quick generation input:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

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
  requestAlternative?: boolean = false;
}
```

---

### Step 2: Add Response Interface (10 minutes)

**File**: `src/modules/wardrobe/interfaces/combinations.interface.ts`

Add the response interface:

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

// Internal interface for session management
export interface GenerationSession {
  userId: string;
  occasion: string;
  previousOutfits: {
    itemIds: string[];
    generatedAt: Date;
  }[];
  createdAt: Date;
}
```

---

### Step 3: Add AI Prompt (30 minutes)

**File**: `src/modules/wardrobe/prompts/combinations.prompts.ts`

Add the new prompt function:

```typescript
import { ClothingItem } from '../interfaces/combinations.interface';

export function generateQuickCombinationsPrompt(
  allItems: ClothingItem[],
  occasion: string,
  excludeItemIds: string[] = [],
  currentSeason?: string
): string {
  const availableItems = allItems.filter(item => !excludeItemIds.includes(item.id));

  return `You are a professional stylist creating an outfit from a user's wardrobe.

OCCASION: ${occasion}

AVAILABLE WARDROBE ITEMS:
${availableItems.map((item, index) => `
${index + 1}. ID: ${item.id}
   Name: ${item.name}
   Description: ${item.description || 'N/A'}
   Primary Color: ${item.primaryColor}
   Secondary Color: ${item.secondaryColor || 'N/A'}
   Style: ${item.style}
   Material: ${item.material || 'N/A'}
   Season: ${item.season || 'N/A'}
   Size: ${item.size}
`).join('\n')}

${currentSeason ? `CURRENT SEASON: ${currentSeason}` : ''}

TASK:
Generate ONE complete outfit from the available items that is appropriate for the occasion.

RULES:
1. Select between 3 and 10 items total
2. Ensure color harmony (complementary or analogous colors, or intentional contrast)
3. Maintain style consistency (all casual, all formal, or intentional smart-casual mix)
4. Consider season appropriateness for the occasion
5. Ensure material compatibility (avoid mixing athletic with formal unless justified)
6. Prioritize items that clearly match the occasion's formality level
7. Include at least one top, one bottom (unless occasion doesn't require, e.g., dress/jumpsuit), and footwear

OUTPUT FORMAT:
{
  "outfitRecommendation": [
    { "id": "item-id-1" },
    { "id": "item-id-2" },
    // ... 3-10 items
  ],
  "overallExplanation": "2-4 sentences explaining why these items work together for this occasion, focusing on style harmony and appropriateness."
}

Only include item IDs from the AVAILABLE WARDROBE ITEMS list above.`;
}
```

**Testing**: Manually test this prompt with sample data to ensure AI generates valid responses.

---

### Step 4: Add Service Method (90 minutes)

**File**: `src/modules/wardrobe/services/combinations.service.ts`

Add the following imports and helper methods:

```typescript
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QuickGenerateCombinationDto } from '../dtos/combinations.dto';
import { QuickGenerationResponse, GenerationSession } from '../interfaces/combinations.interface';
import { generateQuickCombinationsPrompt } from '../prompts/combinations.prompts';

// In the constructor, inject cache manager:
constructor(
  private db: PrismaService,
  private ai: AiService,
  private logger: Logger,
  private multimediaService: MultimediaService,
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
) {}

// Add the main method:
async generateQuickCombination(
  payload: QuickGenerateCombinationDto,
  userId: string
): Promise<QuickGenerationResponse> {
  // 1. Validate minimum wardrobe size
  const wardrobeCount = await this.db.wardrobeItem.count({
    where: { userId, status: true }
  });

  if (wardrobeCount < 5) {
    throw new BadRequestException({
      message: 'Insufficient wardrobe items. You need at least 5 items to generate an outfit. Please add more items to your wardrobe.',
      code: 'INSUFFICIENT_ITEMS'
    });
  }

  // 2. Retrieve or create generation session
  const session = await this._getOrCreateSession(userId, payload.occasion);
  const excludeItemIds = payload.requestAlternative
    ? session.previousOutfits.flatMap(o => o.itemIds)
    : [];

  // 3. Fetch all active wardrobe items (with pre-filtering for large wardrobes)
  const allItems = await this._fetchWardrobeItems(userId, excludeItemIds);

  if (allItems.length === 0) {
    throw new NotFoundException({
      message: 'No viable alternatives exist with your current wardrobe items. Try adding more items or starting a new search with a different occasion.',
      code: 'NO_ALTERNATIVES'
    });
  }

  // 4. Generate outfit with AI (includes retry logic)
  const aiResponse = await this._attemptGeneration(allItems, payload.occasion);

  // 5. Validate AI response
  if (aiResponse.outfitRecommendation.length < 3 || aiResponse.outfitRecommendation.length > 10) {
    throw new InternalServerErrorException('AI generated invalid outfit size');
  }

  // 6. Fetch full item details with images
  const outfitItems = await this._fetchOutfitDetails(aiResponse.outfitRecommendation.map(i => i.id));

  // 7. Update session with new outfit
  await this._updateSession(userId, payload.occasion, aiResponse.outfitRecommendation.map(i => i.id));

  // 8. Return response
  return {
    outfit: outfitItems,
    explanation: aiResponse.overallExplanation,
    occasion: payload.occasion,
    itemCount: outfitItems.length,
    generatedAt: new Date()
  };
}

// Helper: Get or create session
private async _getOrCreateSession(userId: string, occasion: string): Promise<GenerationSession> {
  const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;

  let session = await this.cacheManager.get<GenerationSession>(sessionKey);

  if (!session) {
    session = {
      userId,
      occasion: normalizedOccasion,
      previousOutfits: [],
      createdAt: new Date()
    };
    await this.cacheManager.set(sessionKey, session, 3600000); // 1-hour TTL
  }

  return session;
}

// Helper: Update session
private async _updateSession(userId: string, occasion: string, itemIds: string[]): Promise<void> {
  const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;

  const session = await this.cacheManager.get<GenerationSession>(sessionKey);
  if (session) {
    session.previousOutfits.push({
      itemIds,
      generatedAt: new Date()
    });
    await this.cacheManager.set(sessionKey, session, 3600000);
  }
}

// Helper: Delete session (call this from saveCombination method)
async _deleteGenerationSession(userId: string, occasion: string): Promise<void> {
  const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const sessionKey = `quick-gen:${userId}:${normalizedOccasion}`;
  await this.cacheManager.del(sessionKey);
}

// Helper: Fetch wardrobe items with pre-filtering
private async _fetchWardrobeItems(userId: string, excludeIds: string[]) {
  const items = await this.db.wardrobeItem.findMany({
    where: {
      userId,
      status: true,
      id: { notIn: excludeIds }
    },
    select: {
      id: true,
      name: true,
      description: true,
      season: true,
      primaryColor: true,
      secondaryColor: true,
      style: true,
      material: true,
      size: true
    }
  });

  // If > 100 items, apply season filtering (see research.md)
  // Implementation detail: detect current season and filter
  // This is simplified; enhance based on requirements
  return items;
}

// Helper: AI generation with retry
private async _attemptGeneration(items: any[], occasion: string) {
  const prompt = generateQuickCombinationsPrompt(items, occasion);
  const schema = z.object({
    outfitRecommendation: z.array(z.object({ id: z.string() })),
    overallExplanation: z.string()
  });

  try {
    return await this.ai.agent(prompt, schema) as z.infer<typeof schema>;
  } catch (error) {
    this.logger.warn(`Quick generation attempt 1 failed: ${error.message}`);

    // Single retry after 2-second delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      return await this.ai.agent(prompt, schema) as z.infer<typeof schema>;
    } catch (retryError) {
      this.logger.error(`Quick generation attempt 2 failed: ${retryError.message}`);
      throw new InternalServerErrorException({
        message: 'Failed to generate outfit. Please try again.',
        retryable: true,
        code: 'GENERATION_FAILED'
      });
    }
  }
}

// Helper: Fetch outfit details
private async _fetchOutfitDetails(itemIds: string[]) {
  const items = await this.db.wardrobeItem.findMany({
    where: { id: { in: itemIds } },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      secondaryColor: true,
      images: {
        where: { status: true },
        select: { id: true, url: true }
      }
    }
  });

  return items;
}
```

**Modification to existing saveCombination method**: Add session cleanup:

```typescript
async saveCombination(payload: SaveCombinationDto, userId: string) {
  // ... existing save logic ...

  // NEW: If this was a quick-generated combination, clear session
  if (payload.occasions && payload.occasions.length > 0) {
    await this._deleteGenerationSession(userId, payload.occasions[0]);
  }

  return result;
}
```

---

### Step 5: Add Controller Endpoint (20 minutes)

**File**: `src/modules/wardrobe/controllers/combinations/combinations.controller.ts`

Add the new endpoint:

```typescript
import { QuickGenerateCombinationDto } from '../../dtos/combinations.dto';

@Post('generate-quick')
@ApiOperation({
  summary: 'Generate quick outfit from occasion',
  description: 'Generate a complete outfit from the entire wardrobe based on a single occasion input. Faster than category-based generation.',
  operationId: 'generateQuickCombination',
})
async generateQuickCombination(
  @Body() payload: QuickGenerateCombinationDto,
  @CurrentSession() user: InfoUserInterface
) {
  return this.combinationsService.generateQuickCombination(payload, user.id);
}
```

---

### Step 6: Test Locally (45 minutes)

1. **Start the server**:
   ```bash
   yarn dev
   ```

2. **Open Swagger UI**: Navigate to `http://localhost:3000/api-docs`

3. **Authenticate**: Use existing login endpoint to get JWT token

4. **Test Generation**:
   - Endpoint: `POST /api/combinations/generate-quick`
   - Body:
     ```json
     {
       "occasion": "casual Friday at work",
       "requestAlternative": false
     }
     ```

5. **Verify Response**: Should return outfit with 3-10 items and explanation

6. **Test Edge Cases**:
   - User with < 5 wardrobe items → Should return 400 error
   - Request alternative → Should return different items
   - Invalid occasion (too short) → Should return validation error

---

### Step 7: Update Swagger Documentation (10 minutes)

The `@nestjs/swagger` decorators should auto-generate the API docs. Verify by visiting `/api-docs` and checking that the new endpoint appears with correct request/response schemas.

---

### Step 8: Update Agent Context (5 minutes)

Run the update script to add this feature to agent context:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will update `CLAUDE.md` or the appropriate agent context file with information about the new feature.

---

## Testing Checklist

- [ ] User with ≥5 items can generate outfit
- [ ] User with <5 items gets error message
- [ ] Generated outfit contains 3-10 items
- [ ] Explanation is present and descriptive
- [ ] Request alternative returns different items
- [ ] Session is cleared on save
- [ ] AI failure triggers retry and eventually returns error
- [ ] Response includes image URLs for all items
- [ ] Endpoint is protected by JWT auth
- [ ] Rate limiting works (15 req/60s)
- [ ] Swagger documentation is accurate

---

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.implement` to execute tasks (if using speckit workflow)
3. Create PR following [CLAUDE.md](../../../CLAUDE.md#creating-pull-requests) guidelines
4. Update frontend to consume new endpoint

---

## Edge Case Handling

For comprehensive edge case documentation, see **[data-model.md](./data-model.md#edge-case-handling-strategy)**.

Key points:
- **AI-handled cases** (vague occasions, contradictory inputs, missing categories): No backend validation needed - AI resolves gracefully
- **Backend-validated cases** (< 5 items, no alternatives, AI failure): Explicit error responses defined

---

## Common Issues & Solutions

### Issue: AI returns items not in user's wardrobe
**Solution**: Validate `aiResponse.outfitRecommendation` item IDs against `allItems` before fetching details

### Issue: Generation takes > 30 seconds
**Solution**: Reduce wardrobe size sent to AI by implementing season filtering (see research.md section 1)

### Issue: Session not persisting across requests
**Solution**: Verify Keyv cache is configured correctly and Redis is running

### Issue: "No viable alternatives" error too early
**Solution**: Check `excludeItemIds` logic - ensure it's only excluding when `requestAlternative: true`

---

## API Usage Examples

### Example 1: Generate First Outfit

```bash
curl -X POST http://localhost:3000/api/combinations/generate-quick \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "job interview",
    "requestAlternative": false
  }'
```

### Example 2: Request Alternative

```bash
curl -X POST http://localhost:3000/api/combinations/generate-quick \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "occasion": "job interview",
    "requestAlternative": true
  }'
```

### Example 3: Save Generated Outfit

```bash
curl -X POST http://localhost:3000/api/combinations/save \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Interview Outfit",
    "occasions": ["job interview"],
    "items": ["item-id-1", "item-id-2", "item-id-3"],
    "aiDescription": "Professional and polished...",
    "isAIGenerated": true
  }'
```

---

## Performance Monitoring

Monitor these metrics in production:

- **Generation latency** (p50, p95, p99) - should be <30s for p95
- **AI failure rate** - should be <10%
- **Session cache hit rate** - higher is better for alternative requests
- **Outfit quality feedback** - track save rate (target: 75% per SC-003)

---

**Quickstart Complete**: Follow steps sequentially for smooth implementation. Refer to `data-model.md`, `research.md`, and API contract for detailed specifications.
