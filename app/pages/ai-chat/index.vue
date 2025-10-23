<script setup lang="ts">
import { generateId } from 'ai'

// Generate new chat ID and navigate with state
const newChatId = `chat__${generateId()}`
await navigateTo(`/ai-chat/${newChatId}`)
</script>
