# Components Directory

Vue components that are auto-imported by Nuxt. All `.vue` files in this directory are globally available without explicit imports.

## Component Organization

### Active Components

#### Chat List Components
- **`ChatListHeader.vue`** - Header with title, filters, and "New Chat" button
- **`ChatListItem.vue`** - Individual chat card with metadata and actions
- **`ChatDeleteModal.vue`** - Confirmation modal for chat deletion

**Used by**: `/chats` page

---

## Component Guidelines

### 1. Naming Convention
- **PascalCase** for component files (e.g., `MyComponent.vue`)
- Use descriptive names (e.g., `ChatListItem` not `Item`)
- Prefix related components (e.g., `ChatList*`, `User*`)

### 2. Single Responsibility
Each component should do ONE thing well:

```vue
<!-- ✅ Good: Focused component -->
<ChatListItem :chat="chat" @delete="handleDelete" />

<!-- ❌ Bad: Too many concerns -->
<ChatPage :chats="chats" :user="user" :filters="filters" />
```

### 3. Props and Emits
Always define types explicitly:

```vue
<script setup lang="ts">
interface Props {
  chat: ChatListItem
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'select', chat: ChatListItem): void
}>()
</script>
```

### 4. Component Composition
Prefer composition over large monolithic components:

```
❌ Before: ChatPage.vue (500 lines)

✅ After:
  ChatListHeader.vue (70 lines)
  ChatListFilters.vue (50 lines)
  ChatListItem.vue (100 lines)
  ChatPage.vue (100 lines - orchestration only)
```

### 5. Auto-Import
Nuxt automatically imports all components:

```vue
<!-- No import needed! -->
<template>
  <ChatListItem :chat="chat" />
</template>
```

---

## Component Patterns

### 1. Presentation Components
Pure UI, no business logic:

```vue
<script setup lang="ts">
interface Props {
  title: string
  items: string[]
}
defineProps<Props>()
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>
```

### 2. Container Components
Handle logic and state:

```vue
<script setup lang="ts">
const { list, isLoading } = useChatDirectory()

function handleDelete(id: string) {
  // Business logic here
}
</script>

<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <ChatListItem
      v-for="chat in list"
      :key="chat.id"
      :chat="chat"
      @delete="handleDelete"
    />
  </div>
</template>
```

### 3. v-model Components
Two-way binding for forms:

```vue
<script setup lang="ts">
const modelValue = defineModel<string>({ required: true })
</script>

<template>
  <input v-model="modelValue" type="text" />
</template>

<!-- Usage -->
<MyInput v-model="searchQuery" />
```

### 4. Slot Components
Flexible layouts:

```vue
<template>
  <div class="card">
    <header>
      <slot name="header" />
    </header>
    <main>
      <slot /> <!-- Default slot -->
    </main>
    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>

<!-- Usage -->
<Card>
  <template #header>
    <h2>Title</h2>
  </template>
  <p>Content</p>
  <template #footer>
    <button>Action</button>
  </template>
</Card>
```

---

## Nuxt UI Components

This project uses [Nuxt UI](https://ui.nuxt.com/) for base components:

**Common components**:
- `<UButton>` - Buttons with variants
- `<UInput>` - Form inputs
- `<USelect>` - Dropdowns
- `<UModal>` - Modals
- `<UBadge>` - Status badges
- `<UIcon>` - Icons from Iconify

**Example**:
```vue
<template>
  <UButton color="primary" @click="handleClick">
    <UIcon name="i-heroicons-plus-20-solid" />
    Add Item
  </UButton>
</template>
```

---

## Component Checklist

Before creating a new component, ask:

- [ ] Is this logic reusable across multiple pages?
- [ ] Does this component do ONE thing well?
- [ ] Are props and emits typed?
- [ ] Is the component name descriptive?
- [ ] Can I use an existing Nuxt UI component instead?

If unsure, start with inline template code. Extract to a component when you need it in 2+ places.

---

## Related

- **Pages** (`app/pages/`) - Route components
- **Composables** (`app/composables/`) - Reusable logic
- **Nuxt UI Docs** - https://ui.nuxt.com/
