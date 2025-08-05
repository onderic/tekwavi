<script setup lang="ts">
import { z } from 'zod'
import type { UserType } from '~~/shared/types/user'
import type { Property } from '~/types/property'

const route = useRoute()
const toast = useToast()
const userId = route.params.di as string

const isLoading = ref(false)
const isUpdating = ref(false)
const showAddPropertyModal = ref(false)
const selectedProperties = ref<string[]>([])
const availableProperties = ref<{ label: string, value: string }[]>([])

const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'developer', 'caretaker', 'tenant', 'normal'] as const),
  phone: z.string().optional(),
  isActive: z.boolean(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
})

// User data
const user = ref<UserType>({
  _id: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'normal',
  isActive: true,
  properties: [],
})

// Form state
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  role: 'normal' as UserType['role'],
  phone: '',
  isActive: true,
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
})

// Role options for dropdown
const roleOptions = [
  { label: 'Super Admin', value: 'admin' },
  { label: 'Administrator', value: 'developer' },
  { label: 'Caretaker', value: 'caretaker' },
  { label: 'Tenant', value: 'tenant' },
  { label: 'Normal User', value: 'normal' },
]

// Status options
const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const propertyRoleOptions = [
  { label: 'Administrator', value: 'developer' },
  { label: 'Manager', value: 'manager' },
  { label: 'Caretaker', value: 'caretaker' },
  { label: 'Tenant', value: 'tenant' },
]

definePageMeta({
  title: 'User Details',
})

const { data, pending, error, refresh } = await useLazyAsyncData(
  `user-${userId}`,
  () => $fetch<UserType>(`/api/users/${userId}`),
  {
    server: false,
    watch: [],
  },
)

const fetchAvailableProperties = async () => {
  try {
    const response = await $fetch<{ properties: Property[] }>('/api/properties/my')
    availableProperties.value = response.properties
      .filter(property => property._id !== undefined)
      .map(property => ({
        label: property.propertyName,
        value: property._id as string,
      }))
  }
  catch (error) {
    console.error('Failed to fetch properties:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load available properties',
      color: 'error',
    })
  }
}

// Watch for data changes and update the form
watch(data, (newData) => {
  if (newData) {
    user.value = newData
    form.first_name = newData.first_name
    form.last_name = newData.last_name
    form.email = newData.email
    form.role = newData.role
    form.phone = newData.phone || ''
    form.isActive = newData.isActive !== false

    // Copy address if exists
    if (newData.address) {
      form.address = {
        street: newData.address.street ?? '',
        city: newData.address.city ?? '',
        state: newData.address.state ?? '',
        zipCode: newData.address.zipCode ?? '',
      }
    }
  }
}, { immediate: true })

// Update user information
const updateUser = async () => {
  isUpdating.value = true
  try {
    await $fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role,
        phone: form.phone || undefined,
        isActive: form.isActive,
        address: form.address,
      },
    })

    toast.add({
      title: 'Success',
      description: 'User information updated successfully',
      color: 'primary',
    })

    // Update local data
    refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update user information',
      color: 'error',
    })
  }
  finally {
    isUpdating.value = false
  }
}

// Add properties to user
const addPropertiesToUser = async () => {
  if (!selectedProperties.value.length) {
    toast.add({
      title: 'Warning',
      description: 'Please select at least one property',
      color: 'warning',
    })
    return
  }

  isLoading.value = true
  try {
    await $fetch(`/api/users/${userId}/properties`, {
      method: 'POST',
      body: {
        properties: selectedProperties.value.map(propId => ({
          propertyId: propId,
          role: 'normal',
        })),
      },
    })

    toast.add({
      title: 'Success',
      description: 'Properties assigned successfully',
      color: 'primary',
    })

    showAddPropertyModal.value = false
    selectedProperties.value = []
    refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to assign properties',
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
  }
}

// Remove property from user
const removeProperty = async (propertyId: string) => {
  isLoading.value = true
  try {
    await $fetch(`/api/users/${userId}/properties/${propertyId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Success',
      description: 'Property removed successfully',
      color: 'primary',
    })

    refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to remove property',
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
  }
}

// Update property role
const updatePropertyRole = async (propertyId: string, role: string) => {
  isLoading.value = true
  try {
    await $fetch(`/api/users/${userId}/properties/${propertyId}`, {
      method: 'PATCH',
      body: {
        role,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Property role updated successfully',
      color: 'primary',
    })

    refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update property role',
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
  }
}

// Open add property modal
const openAddPropertyModal = async () => {
  await fetchAvailableProperties()
  showAddPropertyModal.value = true
}

// Format date
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Calculate user account age
const accountAge = computed(() => {
  if (!user.value?.createdAt) return 'N/A'

  const createdAt = new Date(user.value.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - createdAt.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} days`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
  return `${Math.floor(diffDays / 365)} years`
})
</script>

<template>
  <BasePage
    :title="`User: ${user.first_name} ${user.last_name}`"
    icon="i-lucide-user"
    :loading="pending"
    back-to="/users"
  >
    <div
      v-if="error"
      class="p-4 mb-6 text-red-500 border border-red-200 rounded-lg bg-red-50"
    >
      <p class="font-medium">
        Error loading user data
      </p>
      <p>{{ error.message }}</p>
    </div>

    <div
      v-else
      class="space-y-8"
    >
      <UCard>
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              :text="`${user.first_name?.charAt(0)}${user.last_name?.charAt(0)}`"
              size="xl"
              color="primary"
            />
            <div>
              <h2 class="text-xl font-semibold">
                {{ user.first_name }} {{ user.last_name }}
              </h2>
              <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <UIcon
                  name="i-lucide-mail"
                  class="w-4 h-4"
                />
                <span>{{ user.email }}</span>
              </div>
              <div
                v-if="user.phone"
                class="flex items-center gap-2 mt-1 text-sm text-gray-500"
              >
                <UIcon
                  name="i-lucide-phone"
                  class="w-4 h-4"
                />
                <span>{{ user.phone }}</span>
              </div>
              <div class="flex items-center gap-3 mt-2">
                <UBadge
                  :color="user.isActive ? 'primary' : 'error'"
                  variant="subtle"
                  class="capitalize"
                >
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </UBadge>
                <UBadge
                  color="primary"
                  variant="subtle"
                  class="capitalize"
                >
                  {{ user.role }}
                </UBadge>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <UButton
              icon="i-lucide-refresh-cw"
              size="sm"
              :loading="pending"
              @click="refresh()"
            >
              Refresh
            </UButton>
            <UDropdown
              :items="[
                [
                  {
                    label: 'Copy User ID',
                    icon: 'i-lucide-copy',
                    click: () => {
                    },
                  },
                ],
                [
                  {
                    label: user.isActive ? 'Deactivate User' : 'Activate User',
                    icon: user.isActive ? 'i-lucide-user-x' : 'i-lucide-user-check',
                    color: user.isActive ? 'red' : 'green',
                    click: async () => {
                      form.isActive = !user.isActive;
                      await updateUser();
                    },
                  },
                ],
              ]"
            >
              <UButton
                icon="i-lucide-more-horizontal"
                variant="soft"
                size="sm"
              />
            </UDropdown>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 md:grid-cols-4">
          <div class="p-4 border rounded-lg">
            <div class="text-sm text-gray-500">
              Account Created
            </div>
            <div class="font-medium">
              {{ formatDate(user.createdAt) }}
            </div>
          </div>
          <div class="p-4 border rounded-lg">
            <div class="text-sm text-gray-500">
              Last Login
            </div>
            <div class="font-medium">
              {{ formatDate(user.lastLogin) }}
            </div>
          </div>
          <div class="p-4 border rounded-lg">
            <div class="text-sm text-gray-500">
              Account Age
            </div>
            <div class="font-medium">
              {{ accountAge }}
            </div>
          </div>
          <div class="p-4 border rounded-lg">
            <div class="text-sm text-gray-500">
              Properties
            </div>
            <div class="font-medium">
              {{ user.properties?.length || 0 }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- User Edit Form -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">
              Edit User Information
            </h3>
          </div>
        </template>

        <UForm
          :schema="userSchema"
          :state="form"
          class="space-y-4"
          @submit="updateUser"
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField
              name="first_name"
              label="First Name"
            >
              <UInput
                v-model="form.first_name"
                placeholder="First Name"
              />
            </UFormField>

            <UFormField
              name="last_name"
              label="Last Name"
            >
              <UInput
                v-model="form.last_name"
                placeholder="Last Name"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField
              name="email"
              label="Email Address"
            >
              <UInput
                v-model="form.email"
                placeholder="Email"
                type="email"
              />
            </UFormField>

            <UFormField
              name="phone"
              label="Phone Number"
            >
              <UInput
                v-model="form.phone"
                placeholder="Phone Number"
                type="tel"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField
              name="role"
              label="User Role"
            >
              <USelect
                v-model="form.role"
                :options="roleOptions"
                placeholder="Select Role"
              />
            </UFormField>

            <UFormField
              name="isActive"
              label="User Status"
            >
              <USelect
                v-model="form.isActive"
                :options="statusOptions"
              />
            </UFormField>
          </div>

          <div class="pt-4 mt-4 border-t">
            <h4 class="mb-4 text-sm font-medium text-gray-700">
              Address Information
            </h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField
                name="address.street"
                label="Street Address"
              >
                <UInput
                  v-model="form.address.street"
                  placeholder="Street Address"
                />
              </UFormField>

              <UFormField
                name="address.city"
                label="City"
              >
                <UInput
                  v-model="form.address.city"
                  placeholder="City"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <UFormField
                name="address.state"
                label="State/Province"
              >
                <UInput
                  v-model="form.address.state"
                  placeholder="State/Province"
                />
              </UFormField>

              <UFormField
                name="address.zipCode"
                label="ZIP/Postal Code"
              >
                <UInput
                  v-model="form.address.zipCode"
                  placeholder="ZIP/Postal Code"
                />
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end">
            <UButton
              type="submit"
              color="primary"
              :loading="isUpdating"
              :disabled="isUpdating"
            >
              {{ isUpdating ? 'Saving...' : 'Save Changes' }}
            </UButton>
          </div>
        </UForm>
      </UCard>

      <!-- User Properties Management -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">
              Assigned Properties
            </h3>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              @click="openAddPropertyModal"
            >
              Add Property
            </UButton>
          </div>
        </template>

        <div
          v-if="!user.properties?.length"
          class="py-8 text-center text-gray-500"
        >
          <UIcon
            name="i-lucide-home"
            class="mx-auto mb-2 w-9 h-9 opacity-50"
          />
          <p>No properties assigned to this user yet.</p>
          <UButton
            class="mt-4"
            size="sm"
            icon="i-lucide-plus"
            @click="openAddPropertyModal"
          >
            Add Property
          </UButton>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="property in user.properties"
            :key="property.propertyId"
            class="flex flex-col p-4 border rounded-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div class="font-medium">
                {{ property.name }}
              </div>
              <div class="text-sm text-gray-500">
                <span class="inline-flex items-center">
                  <UIcon
                    name="i-lucide-tag"
                    class="mr-1 w-3.5 h-3.5"
                  />
                  {{ property.role }}
                </span>
              </div>
              <div
                v-if="property.associatedAt"
                class="mt-1 text-xs text-gray-400"
              >
                Added {{ formatDate(property.associatedAt) }}
              </div>
            </div>

            <div class="flex items-center gap-2 mt-4 sm:mt-0">
              <USelect
                v-model="property.role"
                :options="propertyRoleOptions"
                size="sm"
                class="w-32"
                @change="updatePropertyRole(property.propertyId, property.role)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="sm"
                :loading="isLoading"
                @click="removeProperty(property.propertyId)"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Modal for adding properties -->
      <UModal
        v-model="showAddPropertyModal"
      >
        <UCard>
          <template #header>
            <h3 class="text-lg font-medium">
              Add Properties
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-500">
              Select properties to assign to this user
            </p>

            <USelect
              v-model="selectedProperties"
              :options="availableProperties"
              multiple
              searchable
              placeholder="Select properties"
            />

            <div
              v-if="!availableProperties.length"
              class="text-sm text-amber-600"
            >
              No properties available to assign
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                variant="ghost"
                @click="showAddPropertyModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="isLoading"
                :disabled="isLoading || !selectedProperties.length"
                @click="addPropertiesToUser"
              >
                Assign Properties
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </BasePage>
</template>

<style scoped>

</style>
