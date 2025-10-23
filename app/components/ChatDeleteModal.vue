<script setup lang="ts">
const props = defineProps<{
  title: string
  loading?: boolean
  onConfirm?: () => Promise<void> | void
}>()

const emit = defineEmits(['close'])

async function handleConfirm() {
  await props.onConfirm?.()
  emit('close')
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <UModal>
    <template #content>
      <div class="p-6">
        <h2 class="text-xl font-semibold text-fg mb-2">
          Delete Chat
        </h2>
        <p class="text-fg-muted mb-6">
          Are you sure you want to delete "<strong>{{ title }}</strong>"? This action cannot be undone.
        </p>

        <div class="flex gap-3 justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="loading"
            @click="handleCancel"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="loading"
            :disabled="loading"
            @click="handleConfirm"
          >
            Delete
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
