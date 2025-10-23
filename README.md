# Nuxt AI Chat Starter

A **Nuxt 4** starter template demonstrating secure AI chat integration with multiple providers, JWT authentication, and SQLite persistence. Built with modern tooling and best practices as a foundation for AI-powered applications.

> ⚠️ **Project Status:** This is a **learning and experimentation project** used to test different architectural approaches, patterns, and AI integrations. While it demonstrates working patterns and includes test coverage, it's **not production-ready** and contains experimental code. The goal is to explore what works best and eventually polish it into a production-grade solution. Use this as a learning resource, reference implementation, or starting point for your own project - not a drop-in production solution.

## What This Project Does

This is a **fully functional starting point** for building AI chat applications with:

- 🤖 **Multi-Provider AI Chat** - OpenAI, Anthropic, Google, OpenRouter with streaming support
- 🔐 **JWT Authentication** - Secure login/signup with Argon2 password hashing and httpOnly cookies
- 💾 **SQLite Database** - User management, chat persistence, connection settings
- ⚡ **Modern Stack** - Nuxt 4 + Vue 3 + Pinia + Bun + TypeScript + Tailwind v4
- 🏗️ **Extensible Architecture** - Three provider patterns (AI SDK, Proxy, Native) for easy integration
- 🧪 **Test-Ready** - Vitest setup with in-memory SQLite and network mocks (tests coming soon)

## Use Cases

This project is ideal for:
- **Learning & Experimentation** - Explore modern Nuxt 4 patterns with AI integration
- **Testing Approaches** - Try different architectural patterns, providers, and workflows
- **Rapid Prototyping** - Quickly spin up AI chat features to test ideas
- **Reference Implementation** - Study working examples of auth, streaming, and persistence
- **Starting Point** - Fork and customize as the foundation for your own project
- **Educational Resource** - Understand how to build secure AI-powered applications

**Not suitable for:** Direct production deployment without significant polish and hardening.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3 (Composition API), Pinia, Nuxt UI, Tailwind v4
- **Backend**: Nitro, H3, Vercel AI SDK, Bun native SQLite (`bun:sqlite`)
- **Auth**: Custom JWT (HS256), @node-rs/argon2 password hashing
- **AI Providers**: OpenAI, Anthropic, Google, OpenRouter (via AI SDK and HTTP proxies)
- **Runtime**: Bun (required for native SQLite)
- **Database**: SQLite with migrations and seed scripts

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) and [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md) to learn more about this project's architecture.

## Prerequisites

Before starting, ensure you have:
- **Bun** v1.1.0 or higher ([install](https://bun.sh/docs/installation))
- At least one AI provider API key (OpenAI, OpenRouter, etc.)
- Basic knowledge of Nuxt/Vue and TypeScript

## Quick Start

Follow these steps to get the app running locally:

### 1. Install Dependencies

Using **Bun** (recommended):
```bash
bun install
```

Or npm/pnpm/yarn:
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (or `.env` for production):

```bash
# Database (absolute path to SQLite file)
NUXT_DB_PATH=/absolute/path/to/db/sqlite/app.db
# Or use relative path (default: ./db/sqlite/app.db)

# JWT Secret (generate with: openssl rand -base64 32)
NUXT_JWT_SECRET=your-secret-key-here

# AI Provider Keys (add the ones you plan to use)
NUXT_OPENAI_API_KEY=sk-...
NUXT_OPENROUTER_API_KEY=sk-or-...
NUXT_TAVILY_API_KEY=tvly-...

# Optional: For agent tools with web search
NUXT_BRAVE_API_KEY=BSA...

# Public config (optional - has defaults)
NUXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini
NUXT_PUBLIC_OPENROUTER_MODEL=deepseek/deepseek-r1:free
NUXT_PUBLIC_APP_TITLE=Nuxt AI Chat
```

**Note**: Nuxt uses `NUXT_` prefix for runtime config. The dev server reads from `.env.local` by default.

### 3. Initialize Database

Run migrations to create the database schema:
```bash
bun run db:migrate
```

Seed with a test user:
```bash
bun run db:seed your-email@example.com
```

This creates a user account for the specified email. You'll need to use the signup endpoint to set a password.

### 4. Start Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:3000`

## Features Overview

### Authentication System
- **JWT-based auth** with httpOnly cookies and Bearer token support
- **Signup/Login** endpoints at `/api/v1/auth/signup` and `/api/v1/auth/login`
- **Password hashing** with Argon2 (secure, memory-hard algorithm)
- **Global middleware** protecting all API routes except auth and public endpoints
- **User management** API at `/api/v1/users` for creating and listing users

### AI Chat System
- **Multi-provider support**: Switch between OpenAI, Anthropic, Google, OpenRouter
- **Three integration patterns**:
  - **AI SDK**: Streaming with Vercel AI SDK (OpenAI, Anthropic, Google)
  - **Proxy**: Simple HTTP proxies for third-party APIs (OpenRouter)
  - **Native**: Direct SDK integration with full provider features
- **Reasoning support**: Display thinking process for models like DeepSeek R1
- **Chat persistence**: Dual-layer storage (localStorage + SQLite) with conflict resolution
- **Message history**: Full conversation context with timestamps

### Database Structure
- **users** - User accounts with email and name
- **credentials** - Secure password storage with Argon2 hashes
- **connections** - AI provider configurations per user (API keys, models, settings)
- **chats** - Conversation threads with titles and metadata
- **messages** - Full message history with role, content, reasoning, timestamps

### State Management
- **Pinia stores** for reactive state:
  - `auth` - Authentication state and session management
  - `users` - User list with SWR caching (1-minute TTL)
  - `chat.sessions` - Chat sessions with profile support
  - `chat.runtime` - UI state (sending, errors, abort control)
- **Composables** for provider resolution and data access
- **Repository pattern** for data persistence with background sync

## Adding a New AI Provider

This project makes it easy to add new providers. You have two options:

### Option A: Use the Generic Proxy Factory (Simplest)

For providers with a simple HTTP API:

1. Add to the registry in `app/services/providers/index.ts`:
```ts
'my-provider': () => createProxyProvider('my-provider', 'my-provider')
```

2. Create server endpoint `server/api/v1/my-provider/chat.post.ts`:
```ts
export default defineEventHandler(async (event) => {
  const { messages, model, temperature } = await readBody(event)
  const { myProviderApiKey } = useRuntimeConfig()

  // Call your provider's API
  const response = await fetch('https://api.provider.com/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${myProviderApiKey}` },
    body: JSON.stringify({ messages, model, temperature })
  })

  const data = await response.json()
  return {
    content: data.message,
    reasoning: data.reasoning, // optional
    provider: 'my-provider',
    model
  }
})
```

3. Add API key to `.env`:
```bash
MY_PROVIDER_API_KEY=...
```

That's it! The provider is now available throughout the app.

### Option B: Custom Integration (AI SDK or Advanced Features)

For providers needing streaming, tool calling, or complex features, see `docs/AI_AGENT_BRIEF.md` section on "Provider Architecture Patterns".

## Available Scripts

```bash
# Development
bun run dev              # Start dev server (reads .env.local)

# Database
bun run db:migrate       # Run database migrations
bun run db:seed <email>  # Seed test user
bun run db:reset         # Reset database (delete + migrate)

# Production
bun run build            # Build for production
bun run preview          # Preview production build

# Code Quality
bun run lint             # Check code style
bun run lint:fix         # Lint and fix code style
bunx tsc --noEmit        # Type check without emitting files

# Testing (coming soon)
bun test                 # Run test suite with Vitest
```

## Testing

Test infrastructure is ready with Vitest + in-memory SQLite. Tests will be added soon for:
- ✅ Auth flow (login, signup, JWT validation)
- ✅ AI provider integrations
- ✅ Chat persistence and conflict resolution
- ✅ User management

The Vitest setup includes:
- In-memory SQLite database (isolated per test)
- Network mocks for external APIs
- Auth token generation helpers
- Automatic cleanup between tests

See `tests/setup/test-env.ts` for test utilities.

## Project Structure

```
app/
├── components/         # Vue components
├── composables/        # Composition API composables
├── pages/             # Nuxt pages (routes)
├── services/          # Business logic and repositories
│   └── providers/     # AI provider adapters
├── stores/            # Pinia stores
└── types/             # TypeScript type definitions

server/
├── api/v1/            # REST API endpoints
│   ├── auth/          # Authentication endpoints
│   ├── ai/            # AI SDK streaming endpoints
│   ├── openai/        # OpenAI native endpoints
│   ├── openrouter/    # OpenRouter proxy
│   ├── users/         # User management
│   └── chats/         # Chat persistence
├── db/                # Database helpers
├── middleware/        # Server middleware (auth)
└── utils/             # Server utilities (JWT, auth, AI)

db/
├── migrations/        # SQL migration scripts
├── scripts/           # Seed and utility scripts
└── types.ts           # Database type definitions

docs/
└── AI_AGENT_BRIEF.md  # Detailed architecture documentation
```

## Current Status & Roadmap

### What's Working ✅
- ✅ JWT authentication with secure cookies
- ✅ Multiple AI providers (OpenAI, OpenRouter, Anthropic, Google)
- ✅ Three integration patterns (AI SDK, Proxy, Native)
- ✅ Chat persistence with SQLite
- ✅ Streaming responses with AI SDK
- ✅ Agent tools (web search, calculator, date/time)
- ✅ Basic test coverage for core features

### Known Limitations 🚧
- 🚧 **Experimental Code** - Contains multiple approaches being tested (some may be refactored or removed)
- 🚧 **UI Polish** - Interface is functional but not production-grade
- 🚧 **Error Handling** - Some edge cases may not be gracefully handled
- 🚧 **Test Coverage** - Core features tested, but not comprehensive
- 🚧 **Documentation** - Some areas need more detailed documentation
- 🚧 **Performance** - Not optimized for high-traffic production use
- 🚧 **Security Hardening** - Auth works but needs production-grade security review

### Future Direction 🎯
As this project matures, planned improvements include:
- 🎨 **UI/UX Polish** - Production-ready interface components
- 🧪 **Full Test Coverage** - Comprehensive test suite
- 🛡️ **Production Hardening** - Rate limiting, security audit, error handling
- 📊 **Monitoring** - Analytics, usage tracking, cost monitoring
- 🔌 **More Integrations** - Additional providers, local LLMs (Ollama)
- 🌐 **i18n** - Multi-language support
- 🎭 **Advanced Features** - Roles/permissions, WebSocket support

## Troubleshooting

### Database Issues

**Problem**: Migration fails or database not found
```bash
# Solution: Ensure directory exists
mkdir -p db/sqlite

# Reset and recreate database
bun run db:reset
```

**Problem**: "SQLITE_BUSY: database is locked"
```bash
# Solution: Stop dev server and delete .db-wal and .db-shm files
rm db/sqlite/app.db-wal db/sqlite/app.db-shm
```

### Environment Variable Issues

**Problem**: API key not found or undefined
- Verify `.env.local` file exists in project root
- Ensure keys have `NUXT_` prefix (e.g., `NUXT_OPENAI_API_KEY`)
- Restart dev server after changing `.env.local`

**Problem**: JWT errors on login
```bash
# Solution: Generate a new secret
openssl rand -base64 32
# Add to .env.local as NUXT_JWT_SECRET
```

### Bun-Specific Issues

**Problem**: "bun:sqlite" module not found
- Ensure you're using Bun v1.1.0 or higher: `bun --version`
- Do not use `--bun` flag with `nuxt dev` command

**Problem**: Native module conflicts
- This project uses Bun's native SQLite, not `better-sqlite3`
- If you see native module errors, ensure you're running with Bun, not Node

### Development Server Issues

**Problem**: Port 3000 already in use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 bun run dev
```

## Documentation

### 📚 For Developers & AI Assistants
- **🤖 AI Collaboration Playbook**: [docs/AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md) - **START HERE!** Essential rules for working on this project
- **🏗️ Architecture Guide**: [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md) - System design and patterns
- **✅ TODO & Priorities**: [TODO.md](./TODO.md) - Current tasks and roadmap

### 🔗 External Resources
- **Nuxt Documentation**: https://nuxt.com/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Pinia Store**: https://pinia.vuejs.org/

## License

MIT

---

**Built with ❤️ using Nuxt 4, Bun, and modern web technologies.**
