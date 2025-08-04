<script setup lang="ts">
import { z } from 'zod'
import type { Notification } from '~/types/notification'
import type { Property } from '~/types/property'
import { UserRole } from '~~/shared/enums/roles'

type InvitableUserRole = 'caretaker' | 'developer'

const { user } = useUserSession()

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['invite', 'update:open'])

const isAdmin = computed(() => user.value?.role === UserRole.ADMIN)

const schema = computed(() => {
  const baseSchema = {
    phone: z.string()
      .length(10, 'Phone number must be exactly 10 characters'),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
    role: isAdmin.value
      ? z.enum(['caretaker', 'developer'] as const)
      : z.literal('caretaker'),
  }

  if (!isAdmin.value) {
    return z.object({
      ...baseSchema,
      propertyId: z.string().min(1, 'Please select a property'),
    })
  }

  return z.object(baseSchema)
})

const form = ref({
  phone: '',
  email: '',
  role: 'caretaker' as InvitableUserRole,
  propertyId: '',
})

const roleOptions = computed(() => {
  if (isAdmin.value) {
    return [
      { label: 'Caretaker', value: 'caretaker' as const },
      { label: 'Developer', value: 'developer' as const },
    ]
  }

  // Non-admin users can only invite caretakers
  return [
    { label: 'Caretaker', value: 'caretaker' as const },
  ]
})

const { data: propertiesData } = useLazyAsyncData(
  'invite-properties',
  () => $fetch<{ properties: Property[] }>('/api/properties/list'),
  {
    immediate: !isAdmin.value,
  },
)

const properties = computed(() => {
  if (!propertiesData.value?.properties) return []

  return propertiesData.value.properties.map(property => ({
    label: property.propertyName,
    value: property._id,
  }))
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      phone: '',
      email: '',
      role: 'caretaker', // Always default to caretaker
      propertyId: '',
    }
  }
})

const getNotification = (role: InvitableUserRole): Notification['type'] => {
  switch (role) {
    case 'developer':
      return 'invite_property_owner'
    case 'caretaker':
      return 'invite_caretaker'
    default:
      return 'system'
  }
}

const getInvitationMessage = (role: InvitableUserRole): string => {
  const senderName = user.value?.first_name || 'System'

  if (isAdmin.value && role === 'developer') {
    return `${senderName} has invited you to join as a property developer on the platform.`
  }

  const propertyName = properties.value.find(p => p.value === form.value.propertyId)?.label || 'a property'

  switch (role) {
    case 'developer':
      return `${senderName} has invited you to join as a property administrator for ${propertyName}.`
    case 'caretaker':
      return `${senderName} has invited you to join as a caretaker for ${propertyName}.`
    default:
      return `${senderName} has invited you to join the platform.`
  }
}

const getExpirationDate = (): string => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString()
}

const handleSubmit = async () => {
  if (!user.value) return

  if (!isAdmin.value && !form.value.propertyId) return

  let selectedProperty = null
  let propertyDetails = null

  if (!isAdmin.value && form.value.propertyId) {
    const property = properties.value.find(p => p.value === form.value.propertyId)
    selectedProperty = {
      id: form.value.propertyId,
      name: property?.label || 'Unknown property',
    }

    if (propertiesData.value?.properties) {
      const fullProperty = propertiesData.value.properties.find(p => p._id === form.value.propertyId)
      if (fullProperty) {
        propertyDetails = {
          propertyId: fullProperty._id,
          propertyName: fullProperty.propertyName,
        }
      }
    }
  }

  const notification: Partial<Notification> = {
    phone: form.value.phone,
    email: form.value.email || undefined,
    role: form.value.role,
    senderId: user.value._id,
    title: `Invitation to join as ${form.value.role}`,
    message: getInvitationMessage(form.value.role),
    type: getNotification(form.value.role),
    status: 'pending',
    isRead: false,
    isActionable: true,
    actionUrl: isAdmin.value
      ? `/auth/accept-invitation?phone=${encodeURIComponent(form.value.phone)}&role=${form.value.role}`
      : `/auth/accept-invitation?phone=${encodeURIComponent(form.value.phone)}&role=${form.value.role}&propertyId=${form.value.propertyId}`,
    expiresAt: getExpirationDate(),
    metadata: {
      invitedBy: {
        id: user.value._id,
        name: `${user.value.first_name} ${user.value.last_name || ''}`.trim(),
        role: user.value.role,
        email: user.value.email,
      },
      ...(selectedProperty && { property: selectedProperty }),
      ...(propertyDetails && { propertyData: propertyDetails }),
    },
  }

  emit('invite', notification)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Invite New User"
    description="Send an invitation via SMS"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <div class="space-y-4">
          <UFormField
            label="Phone Number"
            name="phone"
            help="The invitation will be sent via SMS to this number"
            required
          >
            <UInput
              v-model="form.phone"
              placeholder="0712345678"
              type="tel"
              autocomplete="tel"
              :disabled="props.loading"
              icon="i-lucide-phone"
            />
          </UFormField>

          <UFormField
            label="Email (Optional)"
            name="email"
            help="We'll also send a copy to this email if provided"
          >
            <UInput
              v-model="form.email"
              placeholder="user@example.com"
              type="email"
              autocomplete="email"
              :disabled="props.loading"
              icon="i-lucide-mail"
            />
          </UFormField>

          <UFormField
            label="Role"
            name="role"
          >
            <USelect
              v-model="form.role"
              class="w-full"
              :items="roleOptions"
              placeholder="Select a role"
              :disabled="props.loading || !isAdmin"
            />
          </UFormField>

          <UFormField
            v-if="!isAdmin"
            label="Property"
            name="propertyId"
            help="Select the property to assign this user to"
          >
            <USelect
              v-model="form.propertyId"
              class="w-full"
              :items="properties"
              searchable
              placeholder="Select a property"
              :disabled="props.loading"
            />
          </UFormField>
        </div>

        <div class="flex justify-end items-end gap-3">
          <UButton
            type="button"
            label="Cancel"
            color="tertiary"
            variant="outline"
            :disabled="props.loading"
            @click="emit('update:open', false)"
          />
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-message-circle-plus"
            :loading="props.loading"
            :disabled="props.loading"
          >
            {{ props.loading ? 'Sending...' : 'Send Invitation' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
