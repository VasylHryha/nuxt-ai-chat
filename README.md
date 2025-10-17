# Nuxt AI Chat Starter

A production-ready **Nuxt 4** starter template demonstrating secure AI chat integration with multiple providers, JWT authentication, and SQLite persistence. Built with modern tooling and best practices as a foundation for AI-powered applications.

## What This Project Does

This is a **fully functional starting point** for building AI chat applications with:

- 🤖 **Multi-Provider AI Chat** - OpenAI, Anthropic, Google, OpenRouter with streaming support
- 🔐 **JWT Authentication** - Secure login/signup with Argon2 password hashing and httpOnly cookies
- 💾 **SQLite Database** - User management, chat persistence, connection settings
- ⚡ **Modern Stack** - Nuxt 4 + Vue 3 + Pinia + Bun + TypeScript + Tailwind v4
- 🏗️ **Extensible Architecture** - Three provider patterns (AI SDK, Proxy, Native) for easy integration
- 🧪 **Test-Ready** - Vitest setup with in-memory SQLite and network mocks (tests coming soon)

## Use Cases

This starter is designed for:
- **Rapid prototyping** of AI chat applications
- **Learning** modern Nuxt patterns with AI integration
- **Testing** different AI providers and models
- **Production foundation** that can evolve into full applications
- **Reference implementation** for secure authentication + AI workflows

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3 (Composition API), Pinia, Nuxt UI, Tailwind v4
- **Backend**: Nitro, H3, Vercel AI SDK, better-sqlite3
- **Auth**: Custom JWT (HS256), @node-rs/argon2 password hashing
- **AI Providers**: OpenAI, Anthropic, Google (via AI SDK and HTTP proxies)
- **Runtime**: Bun (recommended) or Node.js
- **Database**: SQLite with migrations and seed scripts

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) and [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md) to learn more about this project's architecture.

## Quick Start

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

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=./db/sqlite/dev.db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# AI Provider Keys (add the ones you plan to use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
```

### 3. Initialize Database

Run migrations to create the database schema:
```bash
bun run db:migrate
```

Optionally, seed with a test user:
```bash
bun run db/scripts/seeds.js your-email@example.com
```

This creates a user with password `"password"` for testing.

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
    headers: { 'Authorization': `Bearer ${myProviderApiKey}` },
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
bun run dev              # Start dev server

# Database
bun run db:migrate       # Run database migrations
bun run db/scripts/seeds.js <email>  # Seed test user

# Production
bun run build            # Build for production
bun run preview          # Preview production build

# Code Quality
bunx eslint . --fix      # Lint and fix code style
bunx tsc --noEmit        # Type check without emitting files

# Testing (coming soon)
bunx nuxt test           # Run test suite with Vitest
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

## Future Development

This starter is designed to evolve. Potential enhancements:

- 🎨 **UI Components** - Chat list, user management modals, provider selector
- 🔄 **Real-time Streaming** - SSE for AI SDK streaming in UI
- 🧪 **Comprehensive Tests** - Full test coverage for all features
- 🔌 **More Providers** - Mistral, Cohere, local LLMs (Ollama)
- 🛡️ **Rate Limiting** - Request throttling per user
- 📊 **Analytics** - Usage tracking and cost monitoring
- 🌐 **i18n** - Multi-language support
- 🎭 **Roles & Permissions** - Admin/user role management
- 💬 **WebSocket Chat** - Real-time collaborative features

## Documentation

- **Architecture Guide**: [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md)
- **Nuxt Documentation**: https://nuxt.com/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Pinia Store**: https://pinia.vuejs.org/

## License

MIT

---

**Built with ❤️ using Nuxt 4, Bun, and modern web technologies.**
