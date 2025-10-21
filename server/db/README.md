# Database Layer (`server/db/`)

**SQLite database access layer using Bun's native driver**

## What's Here

Database schema, query functions, and the SQLite connection singleton.

## Technology: Bun SQLite

**Why `bun:sqlite` instead of `better-sqlite3`?**
- ✅ Native Bun integration (no native module ABI conflicts)
- ✅ Works seamlessly in dev mode with Vite
- ✅ Pure Bun runtime, no Node.js C++ bindings
- ✅ Consistent API across dev/production

**Trade-off:** Bun-specific, but this project is already Bun-first.

## Database Schema

### Core Tables

**`users`** - User accounts
- `id` (TEXT, PK) - Nanoid user ID
- `email` (TEXT, UNIQUE) - User email
- `name` (TEXT) - Display name
- `created_at` (INTEGER) - Unix timestamp

**`credentials`** - Authentication secrets
- `id` (TEXT, PK)
- `user_id` (TEXT, FK → users) - Owner
- `kind` (TEXT) - 'password' | 'oauth' | 'magic'
- `password_hash` (TEXT) - Argon2id hash (if kind='password')
- `password_algo` (TEXT) - 'argon2id'
- **UNIQUE** (user_id, kind) - One password per user

**Why separate table?**
- ✅ Never accidentally expose hashes (separate JOIN required)
- ✅ Support multiple auth methods per user
- ✅ Easy to add OAuth later

### AI Chat Tables

**`connections`** - AI provider configurations per user
- `id` (TEXT, PK)
- `user_id` (TEXT, FK → users)
- `provider` (TEXT) - 'openai' | 'anthropic' | 'google' | 'openrouter'
- `model` (TEXT) - Model name (e.g., 'gpt-4o-mini')
- `ui` (TEXT) - 'ai-sdk' | 'native' | 'proxy'
- `deleted_at` (INTEGER, nullable) - Soft delete

**`chats`** - Conversation threads
- `id` (TEXT, PK) - Nanoid chat ID
- `user_id` (TEXT, FK → users)
- `connection_id` (TEXT, FK → connections)
- `title` (TEXT) - Chat title (first message preview)
- `created_at`, `updated_at`, `deleted_at` (INTEGER)

**`messages`** - Message history
- `id` (TEXT, PK)
- `chat_id` (TEXT, FK → chats)
- `role` (TEXT) - 'system' | 'user' | 'assistant' | 'tool'
- `content` (TEXT) - Message text
- `created_at` (INTEGER)
- `provider_generation_id` (TEXT, nullable) - Provider's message ID

### Indexes

```sql
idx_users_email        ON users(email)
idx_credentials_user   ON credentials(user_id)
idx_conn_user          ON connections(user_id, updated_at)
idx_chats_user         ON chats(user_id, updated_at)
idx_msgs_chat          ON messages(chat_id, created_at)
```

## File Structure

```
server/db/
├── main.ts          # SQLite singleton + DB instance export
├── users.ts         # User CRUD + password hash queries
├── chats.ts         # Chat CRUD (list, get, create, update, delete)
├── messages.ts      # Message CRUD (insert, list by chat)
├── connections.ts   # Connection CRUD
└── request.ts       # Request logging (unused, legacy?)
```

## Usage Pattern

### In API Routes (must import)

```typescript
import { getChatById, updateChatTimestamp } from '@/server/db/chats'
import { insertMessage } from '@/server/db/messages'

export default defineEventHandler(async (event) => {
  const authUser = requireUser(event)

  const chat = getChatById(chatId, authUser.id)
  insertMessage({ chatId, role: 'user', content: 'Hello' })
})
```

**IMPORTANT:** Database functions are NOT auto-imported - you must import them explicitly.

## Key Functions by File

### `main.ts`
- `db` - Exported SQLite database instance
- Used by all other query files

### `users.ts`
- `getUserById(id)` → UserRow | undefined
- `getUserByEmail(email)` → UserRow | undefined
- `getPasswordHashByEmail(email)` → { user, hash } | undefined
- `createUser({ email, name, passwordHash })` → UserRow
- `getAllUsers()` → UserRow[]

### `chats.ts`
- `createChat({ userId, provider, model, title, ui })` → string (chatId)
- `getChatById(chatId, userId)` → ChatRow | undefined
- `updateChatTimestamp(chatId, userId)` → void
- `softDeleteChat(chatId, userId)` → boolean
- `listChats(userId, filters?)` → ChatRow[] (with message count, preview)

### `messages.ts`
- `insertMessage({ chatId, role, content, providerGenerationId? })` → MessageRow
- `getMessagesByChatId(chatId)` → MessageRow[]

### `connections.ts`
- `getOrCreateDefaultConnection(userId, provider, model, ui)` → string (connectionId)
- Used internally by chat creation

## Data Types

### Database Rows (snake_case)
```typescript
// server/db/types.ts
interface UserRow {
  id: string
  email: string
  name: string
  created_at: number  // Unix timestamp
}

interface MessageRow {
  id: string
  chat_id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  created_at: number
  provider_generation_id: string | null
}
```

### API DTOs (camelCase)
```typescript
// Converted in API routes before returning
interface Message {
  id: string
  role: string
  content: string
  createdAt: string  // ISO 8601
  providerGenerationId?: string
}
```

## Migrations

**Location:** `/db/migrations/001_init.sql`

**Run migrations:**
```bash
bun run db:migrate
```

**Runner:** `/db/scripts/migrate.js`
- Checks `_migrations` table
- Runs pending `.sql` files
- Records applied migrations

## Soft Deletes

**Pattern:** `deleted_at` column (nullable INTEGER)

```typescript
// Soft delete
softDeleteChat(chatId, userId)  // Sets deleted_at = Date.now()

// Exclude deleted in queries
const chats = listChats(userId) // WHERE deleted_at IS NULL
```

**Why?**
- ✅ Recoverable (admin can restore)
- ✅ Audit trail
- ✅ Foreign key cascade still works for hard deletes

## Timestamps

**All timestamps are Unix milliseconds (INTEGER):**
```typescript
created_at: Date.now()
```

**Convert to ISO 8601 for API responses:**
```typescript
createdAt: new Date(row.created_at).toISOString()
```

## Foreign Keys

**Enabled globally:**
```sql
PRAGMA foreign_keys = ON;
```

**Cascade deletes:**
- Delete user → deletes credentials, chats, connections
- Delete chat → deletes messages
- Delete connection → deletes associated chats

## WAL Mode

```sql
PRAGMA journal_mode = WAL;
```

**Write-Ahead Logging:**
- ✅ Better concurrency (readers don't block writers)
- ✅ Faster writes
- ✅ Creates `.db-wal` and `.db-shm` files (normal)

## Query Patterns

### Synchronous (current)
```typescript
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
```

**Why not async?**
- SQLite is file-based, blocking I/O is fine
- Bun's SQLite driver is synchronous
- No network latency like Postgres

### Prepared Statements (cached)
```typescript
// Good: prepared once, reused
const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
const user1 = stmt.get(id1)
const user2 = stmt.get(id2)
```

## Security Notes

1. **Never expose password hashes:**
   - `credentials` table is separate
   - Only `getPasswordHashByEmail()` returns hash (server-only)
   - All public APIs return user data WITHOUT hash

2. **Always validate ownership:**
   ```typescript
   getChatById(chatId, userId) // Checks user_id in WHERE clause
   ```

3. **Use parameterized queries:**
   ```typescript
   db.prepare('SELECT * FROM users WHERE id = ?').get(id)  // ✅ Safe
   db.exec(`SELECT * FROM users WHERE id = '${id}'`)       // ❌ SQL injection!
   ```

## Common Patterns

### Create chat with default connection
```typescript
import { createChat } from '@/server/db/chats'

const chatId = createChat({
  userId,
  provider: 'openai',
  model: 'gpt-4o-mini',
  title: 'New conversation',
  ui: 'ai-sdk'
})
```

### Get chat with messages
```typescript
import { getChatById } from '@/server/db/chats'
import { getMessagesByChatId } from '@/server/db/messages'

const chat = getChatById(chatId, userId)
if (!chat) throw createError({ statusCode: 404 })

const messages = getMessagesByChatId(chatId)
```

### Insert message during streaming
```typescript
import { insertMessage } from '@/server/db/messages'

insertMessage({
  chatId,
  role: 'assistant',
  content: aiResponse,
  providerGenerationId: 'msg-abc123'
})
```

## Troubleshooting

**Database locked:**
- WAL mode helps, but multiple concurrent writes can still lock
- Retry with backoff or serialize writes

**Foreign key constraint failed:**
- Check parent record exists
- Verify `PRAGMA foreign_keys = ON`

**`.db-wal` file growing:**
- Normal in WAL mode
- Checkpoints automatically merge to `.db` file
- Run `PRAGMA wal_checkpoint(TRUNCATE)` to force

## Future Improvements

- [ ] Add transactions for multi-step operations
- [ ] Connection pooling (if needed for high load)
- [ ] Full-text search on messages (FTS5)
- [ ] Message attachments (file references)
