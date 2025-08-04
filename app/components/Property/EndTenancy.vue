<template>
  <UModal
    :open="props.open"
    :title="'End Tenancy for ' + (tenant?.firstName || '') + ' ' + (tenant?.lastName || '') + ' (Unit ' + (unit?.unitNumber || '') + ')'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UForm
          :state="form"
          @submit="handleEndTenancy"
        >
          <div class="flex items-start">
            <UIcon
              name="i-lucide-alert-triangle"
              class="flex-shrink-0 h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5"
            />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-orange-800 dark:text-orange-300">
                Warning - This action cannot be undone
              </h3>
              <div class="mt-2 text-sm text-orange-700 dark:text-orange-400">
                <p>Ending this tenancy will:</p>
                <ul class="list-disc pl-5 mt-1 space-y-1">
                  <li>Mark the tenant as moved out</li>
                  <li>Make the unit available for new tenants</li>
                  <li>Preserve payment history and records</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <UFormField
              label="Move-out Date"
              name="moveOutDate"
            >
              <UInput
                v-model="form.moveOutDate"
                type="date"
                :max="today"
              />
              <template #help>
                <span class="text-xs text-gray-500">When did/will the tenant move out?</span>
              </template>
            </UFormField>

            <UFormField
              label="Reason for Moving Out"
              name="moveOutReason"
            >
              <UTextarea
                v-model="form.moveOutReason"
                placeholder="e.g., End of lease term, Requested by tenant, etc."
                class="w-full"
              />
            </UFormField>

            <USeparator label="Deposit Details" />
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <UButton
              color="neutral"
              variant="soft"
              label="Cancel"
              :disabled="isSubmitting"
              @click="emit('update:open', false)"
            />
            <UButton
              type="submit"
              color="error"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              icon="i-lucide-log-out"
            >
              Confirm End Tenancy
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  tenant: {
    type: Object,
    default: () => ({}),
  },
  unit: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:open', 'tenancy-ended'])
const toast = useToast()
const isSubmitting = ref(false)
const today = new Date().toISOString().split('T')[0]

const form = ref({
  moveOutDate: today,
  moveOutReason: '',
  notes: 'End of lease term, Requested by tenant',
})

async function handleEndTenancy() {
  if (!props.tenant?._id) {
    toast.add({
      title: 'Error',
      description: 'Tenant information is missing',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(`/api/tenants/${props.tenant._id}/end-tenancy`, {
      method: 'POST',
      body: {
        moveOutDate: form.value.moveOutDate,
        moveOutReason: form.value.moveOutReason || 'Tenancy ended',
        notes: form.value.notes,
      },
    })

    toast.add({
      title: 'Tenancy Ended',
      description: `${props.tenant.firstName} ${props.tenant.lastName}'s tenancy has been ended successfully.`,
      color: 'success',
      icon: 'i-lucide-check',
    })

    emit('tenancy-ended')
    emit('update:open', false)
  }
  catch (error: any) {
    console.error('Error ending tenancy:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to end tenancy',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
