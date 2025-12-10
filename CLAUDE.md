# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StyleMind Backend is a NestJS application for managing a personal wardrobe with AI-powered outfit generation. It uses Fastify as the HTTP server, Prisma as the ORM, and integrates multiple AI providers (Google Gemini, OpenAI, Ollama, LMStudio) through the Vercel AI SDK.

## Development Commands

### Setup
```bash
yarn install
yarn prisma migrate deploy  # Apply database migrations
```

### Development
```bash
yarn dev                    # Start with SWC compiler + watch mode (recommended)
yarn start:dev             # Standard development mode with watch
yarn start:debug           # Debug mode with watch
```

### Building
```bash
yarn build                 # Standard build
yarn build:swc             # Build with SWC (faster)
```

### Testing
```bash
yarn test                  # Run unit tests
yarn test:watch            # Run tests in watch mode
yarn test:cov              # Run tests with coverage
yarn test:debug            # Debug tests
yarn test:e2e              # Run end-to-end tests
```

### Code Quality
```bash
yarn lint                  # Lint and auto-fix TypeScript files
yarn format                # Format code with Prettier
```

### Production
```bash
yarn start:prod            # Start production server
yarn start:migrate:prod    # Run migrations and start production
```

### Database
```bash
yarn prisma migrate dev    # Create and apply new migration
yarn prisma migrate deploy # Apply migrations in production
yarn prisma studio         # Open Prisma Studio GUI
yarn prisma generate       # Regenerate Prisma Client
```

## Architecture

### Module Structure

The codebase follows NestJS module architecture with clear separation of concerns:

- **`src/modules/`** - Feature modules (business logic)
  - `wardrobe/` - Wardrobe items management and outfit combinations
  - `ai/` - AI service abstraction layer supporting multiple providers
  - `multimedia/` - Image upload/processing with Firebase/MinIO support
  - `security/` - Authentication (JWT) and authorization
  - `users/` - User management and profiles
  - `categories/` - Clothing categories and gender associations
  - `admin/` - Administrative functions

- **`src/shared/`** - Shared utilities and infrastructure
  - `services/` - PrismaService and other shared services
  - `config/` - Configuration files loaded via ConfigModule
  - `interceptors/` - Global interceptors (e.g., DateFormatInterceptor)
  - `decorators/` - Custom decorators
  - `dtos/` - Shared DTOs (e.g., PaginationDto)
  - `controllers/` - Shared controllers (e.g., HealthController)

### Path Aliases

TypeScript path aliases are configured for cleaner imports:
- `@/*` - Maps to `src/*`
- `@modules/*` - Maps to `src/modules/*`
- `@shared/*` - Maps to `src/shared/*`

Example: `import { PrismaService } from '@shared/services/prisma.service'`

### Technology Stack

- **Framework:** NestJS with Fastify adapter (not Express)
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Two-tier cache (in-memory + Redis) using Keyv
- **Queue:** BullMQ for background job processing (image processing)
- **AI Integration:** Vercel AI SDK with support for Google, OpenAI, Ollama, LMStudio
- **Storage:** Pluggable storage (Firebase Storage or MinIO)
- **Logging:** Winston with nest-winston integration
- **Validation:** class-validator + class-transformer with global ValidationPipe
- **Security:** Helmet, Throttler, JWT authentication
- **API Documentation:** Swagger/OpenAPI at `/api-docs`

### Key Architectural Patterns

#### AI Service Abstraction
The `AiService` (`src/modules/ai/ai.service.ts`) provides a unified interface for multiple AI providers:
- Configured via `AI_PROVIDER` environment variable
- Supports: `google`, `openai`, `ollama`, `lmstudio`
- Methods: `generateJSON()` for structured output, `generateText()` for text generation
- Used primarily in `CombinationsService` for outfit generation

#### Multimedia Storage
The `MultimediaService` supports two storage backends:
- Configured via `STORAGE_PROVIDER` environment variable (`MINIO` or `FIREBASE`)
- Handles image uploads with Sharp for processing
- Uses BullMQ queue for async image processing
- Consumer: `ImagesConsumer` in `src/modules/multimedia/consumer/`

#### Authentication Flow
- JWT-based authentication via Passport
- Strategy in `src/modules/security/jwt-strategy/`
- Guards protect endpoints that require authentication
- Sessions tracked in database for security audit

#### Database Schema
Core models (see `prisma/schema.prisma`):
- `User` - User accounts with profile and body description
- `WardrobeItem` - Clothing items with attributes (color, style, material, season)
- `Category` - Clothing categories (gender-specific)
- `Combination` - Outfit combinations (user-created or AI-generated)
- `Image` - Images linked to wardrobe items
- `UsageTracking` - Track user usage patterns

#### Configuration System
Configuration is modular using NestJS ConfigModule:
- Each module has its own `config/` directory with typed configs
- Global configs in `src/shared/config/`
- All configs registered in `AppModule` via `ConfigModule.forRoot()`
- Access via `ConfigService` with type safety

## Common Development Patterns

### Creating a New Module
1. Generate with NestJS CLI: `nest g module modules/feature-name`
2. Add controllers, services, DTOs in module directory
3. Import module in `AppModule`
4. Add config file in `config/` subdirectory if needed
5. Register config in module's imports: `ConfigModule.forFeature(featureConfig)`

### Adding Database Models
1. Update `prisma/schema.prisma`
2. Run `yarn prisma migrate dev --name descriptive_name`
3. Prisma Client is auto-generated and available via `PrismaService`

### Working with AI Generation
- Use `AiService.generateJSON()` with Zod schemas for structured responses
- Use `AiService.generateText()` for free-form text
- Create prompts in a `prompts/` subdirectory within your module
- Example: `src/modules/wardrobe/prompts/combinations.prompts.ts`

### File Uploads
- Use Fastify's multipart support (configured in `main.ts`)
- Inject `MultimediaService` for handling uploads
- Files are processed async via BullMQ queue
- Limits: 10MB max file size, 4 files max per request

### Testing Considerations
- Unit tests use Jest, colocated with source files (`*.spec.ts`)
- E2E tests in `test/` directory (`*.e2e-spec.ts`)
- Test environment uses configuration from `.env.test`
- Module path mapping configured in Jest config

## API Structure

- **Base path:** `/api` (global prefix)
- **Swagger docs:** `/api-docs`
- **Health check:** `/api/health` (via TerminusModule)
- Authentication required endpoints use Bearer token (JWT)

## Environment Configuration

Required environment variables (see README.md for complete list):
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration
- `STORAGE_PROVIDER` - `MINIO` or `FIREBASE`
- `AI_PROVIDER` - `google`, `openai`, `ollama`, or `lmstudio`
- `TEXT_MODEL` - Model name for the selected AI provider
- Provider-specific API keys when using cloud services

## Important Notes

- This project uses **Fastify**, not Express. Use Fastify-specific decorators and plugins.
- File uploads use `@fastify/multipart`, not Express multer.
- The app uses **Yarn** as package manager (see `packageManager` field in package.json).
- Date formatting is handled globally by `DateFormatInterceptor`.
- CORS is configured in `main.ts` with origin from `server.origin` config.
- Rate limiting via ThrottlerGuard: 15 requests per 60 seconds.
- Winston logger is available throughout the app via `WINSTON_MODULE_NEST_PROVIDER`.
- Prisma queries should use `PrismaService` injected from `@shared/services/prisma.service`.
