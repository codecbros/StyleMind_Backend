# Research: Quick Occasion-Based Outfit Generation

**Date**: 2025-12-28
**Feature**: 001-quick-outfit-generation
**Purpose**: Document key technical decisions, best practices, and implementation patterns

## Research Areas

### 1. Large Wardrobe Handling (100+ Items)

**Research Question**: How should the system handle wardrobes with 100+ items to stay within the 30-second generation constraint?

**Decision**: Intelligent pre-filtering based on occasion context
- **Rationale**:
  - Sending 100+ full item descriptions to AI would exceed context limits and increase latency
  - Most occasions have implicit seasonal/style constraints that naturally filter items
  - The existing `generateCombinations` method already demonstrates successful AI generation with smaller item sets

**Implementation Strategy**:
1. **Season filtering** (when detectable from occasion):
   - Extract season hints from occasion text (e.g., "beach" → summer, "winter gala" → winter)
   - Filter items by `WardrobeItem.season` field before AI call
   - Fallback: Use current date to determine season if not specified

2. **Category relevance** (for extreme cases):
   - If wardrobe > 150 items after season filtering, prioritize core categories (tops, bottoms, shoes, outerwear)
   - Accessories/extras included only if item count allows

3. **Random sampling as last resort**:
   - If still > 200 items, randomly sample while ensuring coverage across all category types
   - Log warning for analytics to track if this occurs frequently

**Alternatives Considered**:
- **Vector embeddings + similarity search**: Rejected due to added complexity (new vector DB dependency) and unclear benefit for current scale
- **Caching frequent occasion patterns**: Rejected as premature optimization - defer until user data shows repeated patterns
- **Pagination (generate in batches)**: Rejected as it conflicts with "complete outfit in 30 seconds" requirement

**Code Reference**: Will implement in `CombinationsService.generateQuickCombination()` before calling `AiService.agent()`

---

### 2. AI Prompt Engineering for Whole-Wardrobe Analysis

**Research Question**: How should the prompt be structured to ensure quality outfit generation from an entire wardrobe without base items?

**Decision**: Structured JSON prompt with explicit compatibility rules and occasion-first reasoning

**Prompt Structure**:
```typescript
// Pseudo-structure (actual implementation in combinations.prompts.ts)
{
  systemContext: "You are a professional stylist creating outfits from a wardrobe",
  task: "Generate ONE complete outfit for: {occasion}",
  availableItems: [...filteredWardrobeItems],
  rules: [
    "Select 3-10 items total",
    "Ensure color harmony (complementary or analogous colors)",
    "Match style consistency (all casual, all formal, or intentional mix)",
    "Consider season appropriateness",
    "Ensure material compatibility (don't mix athletic with formal)"
  ],
  outputFormat: {
    outfitRecommendation: [{ id: string }],
    overallExplanation: string
  }
}
```

**Best Practices from Vercel AI SDK**:
- Use `generateObject()` or `agent()` with Zod schema (already used in existing `generateCombinations`)
- Provide explicit output schema to avoid parsing errors
- Include occasion context early in prompt to anchor AI reasoning
- List compatibility rules explicitly rather than assuming AI knowledge

**Alternatives Considered**:
- **Multi-turn conversation**: Rejected - adds latency and complexity
- **Separate compatibility checker pass**: Rejected - existing prompt already handles this in one pass
- **Few-shot examples**: Considered but deferred - start with zero-shot and add examples if quality issues arise

**Code Reference**: New function `generateQuickCombinationsPrompt()` in `src/modules/wardrobe/prompts/combinations.prompts.ts`

---

### 3. Progress Indicator Implementation (FR-014a)

**Research Question**: How to implement progress indicators for a synchronous HTTP request in NestJS/Fastify?

**Decision**: Frontend-driven polling approach (backend returns static status, frontend animates)

**Rationale**:
- NestJS/Fastify synchronous endpoints cannot stream progress updates mid-request without SSE or WebSocket
- SSE/WebSocket adds significant complexity for a 30-second operation
- Progress indicators can be simulated client-side based on elapsed time since request started

**Backend Implementation**:
```typescript
// No backend changes needed for progress indicators
// Generation remains synchronous request-response
async generateQuickCombination(dto: QuickGenerateCombinationDto, userId: string) {
  // Standard synchronous processing
  // Frontend handles progress animation based on request timing
}
```

**Frontend Guidance** (for frontend team):
```typescript
// Example frontend implementation (NOT part of backend feature)
const stages = [
  { time: 0, message: "Analyzing your wardrobe..." },
  { time: 10000, message: "Finding matching items..." },
  { time: 20000, message: "Finalizing your outfit..." }
];
// Show stages based on elapsed time since request start
```

**Alternatives Considered**:
- **Server-Sent Events (SSE)**: Rejected - requires separate endpoint, connection management, and frontend SSE client
- **WebSocket**: Rejected - overkill for one-way progress updates
- **Background job with polling**: Rejected - adds Redis queue overhead for a 30-second operation that's acceptable as blocking

**Trade-off**: Progress messages won't reflect actual backend processing stage, but provide perceived performance improvement through user feedback

**Code Reference**: No backend code changes needed. Document in API response spec that frontend should implement client-side progress animation.

---

### 4. Session Management for Alternative Generation (FR-011a, FR-011b)

**Research Question**: How to track previously shown combinations for the current occasion to enable "request alternative" functionality?

**Decision**: In-memory session cache with user+occasion composite key

**Implementation**:
```typescript
// Pseudo-code structure
interface GenerationSession {
  userId: string;
  occasion: string;
  previousItemIds: string[][]; // Array of item ID arrays (each inner array is one outfit)
  createdAt: Date;
}

// Store in Keyv (existing two-tier cache: in-memory + Redis)
const sessionKey = `quick-gen:${userId}:${hashOccasion(occasion)}`;
await cache.set(sessionKey, session, 3600000); // 1-hour TTL
```

**Session Lifecycle**:
1. **First generation**: Create session with empty `previousItemIds`
2. **Request alternative**: Retrieve session, add current outfit IDs to `previousItemIds`, exclude these items in next AI prompt
3. **Save combination**: Delete session (user found what they wanted)
4. **Explicit abandon**: Optional DELETE endpoint to clear session (or let TTL expire)

**Storage Choice**: Keyv (existing caching layer)
- Already configured in project
- Supports both in-memory and Redis backends
- Automatic TTL expiration
- No schema migration needed

**Alternatives Considered**:
- **Database table**: Rejected - temporary data doesn't warrant DB schema addition and query overhead
- **HTTP session cookies**: Rejected - large data (arrays of UUIDs) exceeds practical cookie size limits
- **Client-side state**: Rejected - client could manipulate to request same outfit repeatedly

**Edge Cases Handled**:
- Session expires after 1 hour (TTL)
- If user changes occasion text slightly, create new session (use hash of normalized occasion string)
- If no more alternatives possible (all items tried), return error message: "No viable alternatives exist with your current wardrobe items"

**Code Reference**: New private method `_getOrCreateGenerationSession()` in `CombinationsService`

---

### 5. Retry Logic for AI Service Failures (FR-013)

**Research Question**: How to implement automatic retry with exponential backoff for AI service calls?

**Decision**: Simple retry wrapper with single attempt, then error propagation to frontend

**Implementation**:
```typescript
async generateQuickCombination(dto: QuickGenerateCombinationDto, userId: string) {
  try {
    return await this._attemptGeneration(dto, userId);
  } catch (error) {
    this.logger.warn(`Quick generation attempt 1 failed: ${error.message}`);

    try {
      // Single retry after 2-second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await this._attemptGeneration(dto, userId);
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
```

**Rationale**:
- Spec requires "one automatic retry" (FR-013) - not multiple
- Most AI failures are transient (rate limits, temporary network issues)
- If both attempts fail, user gets clear error with manual retry option (frontend responsibility)
- 2-second delay prevents immediate re-trigger of rate limits

**Alternatives Considered**:
- **Exponential backoff library** (e.g., `retry`): Rejected - overkill for single retry requirement
- **Circuit breaker pattern**: Rejected - premature optimization, no evidence of systemic AI failures
- **Fallback to simpler generation**: Rejected - no fallback strategy defined in spec

**Error Response Structure**:
```json
{
  "statusCode": 500,
  "message": "Failed to generate outfit. Please try again.",
  "error": "Internal Server Error",
  "retryable": true,
  "code": "GENERATION_FAILED"
}
```

Frontend can detect `retryable: true` and show manual retry button.

**Code Reference**: Implement in `CombinationsService.generateQuickCombination()` with try-catch wrapper

---

## Summary of Key Decisions

| Decision Area | Chosen Approach | Key Trade-off |
|---------------|----------------|---------------|
| Large wardrobes | Season-based pre-filtering | Accuracy vs. performance (acceptable - most occasions have seasonal context) |
| AI prompt design | Structured JSON with explicit rules | Simplicity vs. sophistication (start simple, iterate if needed) |
| Progress indicators | Frontend-driven simulation | Real-time accuracy vs. implementation complexity (UX benefit outweighs inaccuracy) |
| Session management | Keyv in-memory cache | Persistence vs. performance (acceptable - sessions are temporary by nature) |
| Retry logic | Single retry with 2s delay | Resilience vs. latency (acceptable - meets spec requirement) |

---

## Open Questions for Implementation Phase

1. **Occasion normalization**: Should "beach party" and "party at beach" be treated as same session? → Decision: Yes, implement basic text normalization (lowercase, trim, remove punctuation)

2. **Minimum category coverage**: Should outfit always include top+bottom+shoes, or allow AI flexibility? → Decision: Let AI decide based on occasion (some occasions like "loungewear" may not need shoes)

3. **Color harmony validation**: Should backend validate AI's color choices? → Decision: No, trust AI model - add validation only if user feedback indicates issues

4. **Localization**: Should occasion text be translated before AI processing? → Decision: No, AI models handle multiple languages natively (spec Assumption 3 states multi-language support)

---

**Phase 0 Complete**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1 (Design & Contracts).
