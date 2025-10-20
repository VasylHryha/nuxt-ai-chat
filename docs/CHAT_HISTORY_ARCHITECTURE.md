# Chat History Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. NEW CHAT FLOW
   ┌──────────┐
   │ /ai-chat/new │  (User sends first message)
   └────┬─────┘
        │
        ├─► Frontend: Detects no chatId
        │
        ├─► POST /api/v1/chats/create
        │   └─► createChatForUser()
        │       └─► Creates chat in DB
        │           └─► Returns chatId
        │
        ├─► POST /api/v1/chats/{chatId}/messages (user message)
        │   └─► insertMessage()
        │       └─► Saves to messages table
        │
        ├─► AI SDK streams response
        │
        └─► POST /api/v1/chats/{chatId}/messages (assistant message)
            └─► insertMessage()
                └─► Saves to messages table


2. RESUME CHAT FLOW
   ┌──────────────────┐
   │ /chats           │  (User clicks on old chat)
   └────┬─────────────┘
        │
        ├─► GET /api/v1/chats?email={user}
        │   └─► listChatsByUserEmail()
        │       └─► Returns chat list with:
        │           ├─► Message count
        │           ├─► Last message preview
        │           └─► Metadata
        │
       └─► Navigates to /ai-chat/{id}
            │
            └─► GET /api/v1/chats/{chatId}
                └─► getChatById() + getMessagesByChatId()
                    └─► Returns full conversation
                        └─► Frontend displays messages
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE TABLES                           │
└─────────────────────────────────────────────────────────────────┘

users
├─ id (PK)
├─ email (UNIQUE)
├─ name
└─ created_at

connections
├─ id (PK)
├─ user_id (FK → users)
├─ provider (openai, anthropic, etc.)
├─ model (gpt-5-nano, etc.)
├─ ui (ai-sdk | native | proxy)
├─ settings_json
├─ created_at
├─ updated_at
└─ deleted_at

chats
├─ id (PK)
├─ user_id (FK → users)
├─ connection_id (FK → connections)
├─ title
├─ created_at
├─ updated_at
└─ deleted_at  ← Soft delete

messages
├─ id (PK)
├─ chat_id (FK → chats)
├─ role (user, assistant, system, tool)
├─ content
├─ created_at
└─ provider_generation_id
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND COMPONENTS                         │
└─────────────────────────────────────────────────────────────────┘

app/pages/chats/index.vue
├─ Fetches: GET /api/v1/chats?email={user}
├─ Displays: Chat list with filters
├─ Actions:
│  ├─ Search (client-side)
│  ├─ Filter by provider
│  ├─ Filter by date
│  └─ Delete chat → DELETE /api/v1/chats/{chatId}
└─ Click chat → Navigate using getChatRouteFor(provider, model, id, ui)
   - ui='ai-sdk'   → /ai-chat/{id}
   - ui='proxy'    → /proxy-chat/{id}
   - ui='native'   → /native-chat/{id}

app/pages/ai-chat/new.vue, app/pages/ai-chat/[id].vue
app/pages/proxy-chat/new.vue, app/pages/proxy-chat/[id].vue
app/pages/native-chat/new.vue, app/pages/native-chat/[id].vue
├─ On Mount:
│  └─ If chatId in URL → GET /api/v1/chats/{chatId}
│      └─ Load messages into AI SDK Chat
│
├─ On First Message (no chatId):
│  └─ POST /api/v1/chats/create
│      └─ Store chatId
│      └─ Update URL
│
└─ On Every Message (user/assistant):
   └─ POST /api/v1/chats/{chatId}/messages
       └─ Save to DB
       └─ Update chat timestamp
```

## API Endpoint Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────┘

GET    /api/v1/chats
       Query: email, provider?, model?, startDate?, endDate?
       Returns: Chat[] with message count, last message, and ui
       File: server/api/v1/chats/index.get.ts

POST   /api/v1/chats/create
       Body: { provider, model, title? }
       Returns: { id, title, provider, model, createdAt, updatedAt }
       File: server/api/v1/chats/create.post.ts

GET    /api/v1/chats/{chatId}
       Returns: { chat, messages[] }
       File: server/api/v1/chats/[chatId].get.ts

POST   /api/v1/chats/{chatId}/messages
       Body: { role, content, providerGenerationId? }
       Returns: { id, role, content, createdAt }
       File: server/api/v1/chats/[chatId]/messages.post.ts

DELETE /api/v1/chats/{chatId}
       Returns: { success: true, message }
       File: server/api/v1/chats/[chatId].delete.ts
```

## Database Layer Functions

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (server/db/)                   │
└─────────────────────────────────────────────────────────────────┘

server/db/chats.ts
├─ createChatForUser(input)
│  └─ Creates chat + connection
│  └─ Returns chat row
│
├─ listChatsByUserEmail(opts)
│  └─ Filters by user, provider, model
│  └─ Returns chat[] with provider/model
│
├─ getChatById(chatId, userId)
│  └─ Verifies ownership
│  └─ Returns chat or null
│
├─ updateChatTimestamp(chatId, userId)
│  └─ Updates updated_at field
│
├─ softDeleteChat(chatId, userId)
│  └─ Sets deleted_at timestamp
│
└─ updateChatTitle(chatId, userId, title)
   └─ Updates title field

server/db/messages.ts
├─ insertMessage(input)
│  └─ Inserts message row
│  └─ Returns message
│
├─ getMessagesByChatId(chatId, userId)
│  └─ Verifies chat ownership
│  └─ Returns messages[] ordered by created_at
│
├─ getMessageCountByChatId(chatId)
│  └─ Returns count
│
└─ getLastMessageByChatId(chatId)
   └─ Returns last message or null
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

1. Authentication Middleware
   server/middleware/01.auth.ts
   ├─ Runs on ALL /api/v1/* requests
   ├─ Verifies JWT token
   ├─ Attaches event.context.user
   └─ Returns 401 if invalid

2. Route Guards
   ├─ requireUser(event)
   │  └─ Throws 401 if no user in context
   │
   └─ Ownership Verification
      ├─ getChatById(chatId, userId)
      ├─ getMessagesByChatId(chatId, userId)
      ├─ updateChatTimestamp(chatId, userId)
      └─ softDeleteChat(chatId, userId)
         └─ All verify user owns the resource

3. Client Middleware
   app/middleware/auth.global.ts
   ├─ Runs on ALL route navigations
   ├─ Checks if user authenticated
   └─ Redirects to /auth/login if not
```

## Data Flow: Creating First Message

```
┌─────────────────────────────────────────────────────────────────┐
│              DETAILED FLOW: FIRST MESSAGE                        │
└─────────────────────────────────────────────────────────────────┘

1. USER TYPES: "How do I install Nuxt?"

2. FRONTEND (app/pages/ai-chat/new.vue and app/pages/ai-chat/[id].vue)
   ├─ chat.sendMessage({ text: "How do I install Nuxt?" })
   └─ watch() detects new message
      └─ If no currentChatId → createChatInDB()

3. CREATE CHAT (POST /api/v1/chats/create)
   ├─ Body: {
   │    provider: "openai",
   │    model: "gpt-5-nano",
   │    title: "How do I install Nuxt?"
   │  }
   │
   └─ Backend (server/api/v1/chats/create.post.ts)
      ├─ requireUser(event) → Gets user
      ├─ createChatForUser() → Creates chat
      │  ├─ getOrCreateConnection() → Gets connection
      │  └─ INSERT INTO chats VALUES (...)
      │
      └─ Returns: { id: "chat_abc123", ... }

4. FRONTEND RECEIVES chatId
   ├─ currentChatId.value = "chat_abc123"
   └─ router.replace({ query: { chatId: "chat_abc123" } })
      └─ URL becomes: /ai-chat/chat_abc123

5. SAVE USER MESSAGE (POST /api/v1/chats/chat_abc123/messages)
   ├─ Body: {
   │    role: "user",
   │    content: "How do I install Nuxt?"
   │  }
   │
   └─ Backend (server/api/v1/chats/[chatId]/messages.post.ts)
      ├─ getChatById() → Verify ownership
      ├─ insertMessage() → INSERT INTO messages
      └─ updateChatTimestamp() → UPDATE chats SET updated_at

6. AI SDK STREAMS RESPONSE
   ├─ Calls: POST /api/v1/ai/chats
   │  └─ Uses AI SDK to stream from OpenAI
   │
   └─ Frontend displays response in real-time

7. SAVE ASSISTANT MESSAGE
   ├─ watch() detects assistant message
   └─ POST /api/v1/chats/chat_abc123/messages
      ├─ Body: {
      │    role: "assistant",
      │    content: "To install Nuxt, run: npx nuxi init my-app"
      │  }
      └─ Saved to DB

8. RESULT
   ├─ Chat exists in database
   ├─ Two messages saved
   ├─ URL has chatId for sharing/bookmarking
   └─ User can navigate away and come back
```

## Filter Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILTER ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────┘

Client-Side (JavaScript):
├─ Search Query
│  └─ filteredChats = chats.filter(chat =>
│       chat.title.includes(query) ||
│       chat.lastMessage?.content.includes(query)
│     )
│
└─ (Fast, no network request)

Server-Side (SQL):
├─ Provider Filter
│  └─ WHERE k.provider = ?
│
├─ Model Filter
│  └─ WHERE k.model = ?
│
└─ Date Range Filter
   ├─ startDate → WHERE c.updated_at >= ?
   └─ endDate → WHERE c.updated_at <= ?
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE NOTES                             │
└─────────────────────────────────────────────────────────────────┘

Current Implementation:
├─ Chat List: O(n) where n = chats per user
│  ├─ Main query: 1 SQL query
│  ├─ Message count: n SQL queries (N+1)
│  └─ Last message: n SQL queries (N+1)
│
├─ Load Chat: O(m) where m = messages in chat
│  ├─ Chat query: 1 SQL query
│  └─ Messages query: 1 SQL query
│
└─ Save Message: O(1)
   ├─ Insert message: 1 SQL query
   └─ Update timestamp: 1 SQL query

Scalability:
├─ Works well for: <1000 chats per user
├─ Acceptable for: <10,000 chats per user
└─ Needs optimization at: >10,000 chats per user

Future Optimizations:
├─ Add message_count column to chats table
├─ Add last_message_content column to chats table
├─ Add pagination (load 20 chats at a time)
└─ Add message pagination (load 50 messages at a time)
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                               │
└─────────────────────────────────────────────────────────────────┘

1. Chat Not Found (404)
   ├─ Cause: Invalid chatId or deleted chat
   ├─ Behavior: Frontend shows error, redirects to /chats
   └─ User Action: Select different chat

2. Access Denied (403)
   ├─ Cause: User trying to access another user's chat
   ├─ Behavior: API returns 403
   └─ User Action: Must log in as correct user

3. Not Authenticated (401)
   ├─ Cause: Invalid/expired JWT token
   ├─ Behavior: Middleware redirects to /auth/login
   └─ User Action: Log in again

4. Create Chat Failed (500)
   ├─ Cause: Invalid provider/model, DB error
   ├─ Behavior: Frontend shows error message
   └─ User Action: Retry with valid data

5. Save Message Failed (500)
   ├─ Cause: DB error, network issue
   ├─ Behavior: Console error, message still visible in UI
   └─ User Action: Message displayed but not persisted
```

## Key Takeaways

1. **Clean Separation**: Database layer → API layer → Frontend
2. **Security First**: All operations verify user ownership
3. **Progressive Enhancement**: Works with localStorage fallback
4. **Real-time Sync**: Every message saved immediately
5. **User-Friendly**: Auto-titles, soft delete, filters
6. **Extensible**: Easy to add new features (pagination, export, etc.)

---

**Implementation Complete**: All features working and tested! ✅
