<template>
  <div>
    <BasePage
      title="Profile"
      icon="i-lucide-user"
    >
      <template #headerActions>
        <UButton
          color="primary"
          variant="solid"
          label="Edit Profile"
          icon="i-lucide-edit"
          size="sm"
          @click="isUpdateModalOpen = true"
        />
      </template>
      <div>
        <UCard>
          <h3 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Profile
          </h3>
          <div class="flex flex-col space-y-6">
            <UCard>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <UAvatar
                    size="2xl"
                    :src="avatarUrl"
                    class="ring-4 ring-white dark:ring-gray-800 w-24 h-24"
                  />

                  <div>
                    <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {{ user?.first_name || 'First' }} {{ user?.last_name || 'Last' }}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {{ user?.role?.replace(/_/g, ' ') || 'Not Provided' }}
                      <span
                        v-if="user?.assignedProperty"
                        class="mx-1"
                      >| Assigned Property</span>
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Status: {{ user?.isActive ? 'Active' : 'Inactive' }}
                      <span
                        v-if="user?.isVerified"
                        class="ml-2"
                      >
                        <UIcon
                          name="i-lucide-badge-check"
                          class="text-green-500"
                        />
                        Verified
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <UIcon
                    color="gray"
                    name="i-heroicons-pencil-square"
                    class="cursor-pointer"
                    @click="isUpdateModalOpen = true"
                  />
                </div>
              </div>
            </UCard>

            <UCard>
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 lg:mb-6">
                  Personal Information
                </h4>

                <div class="flex items-start justify-between mt-8">
                  <div class="grid grid-cols-2 gap-8 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        First Name
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.first_name || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Last Name
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.last_name || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Email address
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.email || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Phone
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.phone || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Role
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {{ user?.role?.replace(/_/g, ' ') || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Account Status
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.isActive ? 'Active' : 'Inactive' }}
                      </p>
                    </div>

                    <div v-if="user?.lastLogin">
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Last Login
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ formatDate(user.lastLogin) }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Member Since
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ formatDate(user?.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <div>
                    <UIcon
                      color="gray"
                      name="i-heroicons-pencil-square"
                      class="cursor-pointer"
                      @click="isUpdateModalOpen = true"
                    />
                  </div>
                </div>
              </div>
            </UCard>

            <UCard>
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 lg:mb-6">
                  Address
                </h4>

                <div class="flex items-start justify-between mt-8">
                  <div class="grid grid-cols-2 gap-8 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Street Address
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.address?.street || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        City
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.address?.city || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        State/Province
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.address?.state || 'Not Provided' }}
                      </p>
                    </div>

                    <div>
                      <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Country
                      </p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Not Provided
                      </p>
                    </div>
                  </div>

                  <div>
                    <UIcon
                      color="gray"
                      name="i-heroicons-pencil-square"
                      class="cursor-pointer"
                      @click="isUpdateModalOpen = true"
                    />
                  </div>
                </div>
              </div>
            </UCard>

            <!-- <UCard v-if="user?.role === 'developer' && user?.ownedProperties?.length">
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Owned Properties
                  </h4>
                  <UBadge
                    :label="`${user.ownedProperties.length} ${user.ownedProperties.length === 1 ? 'Property' : 'Properties'}`"
                    color="primary"
                    variant="subtle"
                  />
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Property IDs: {{ user.ownedProperties.join(', ') }}
                </p>
              </div>
            </UCard>

            <UCard v-if="user?.role === 'caretaker' && user?.assignedProperty">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Assigned Property
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Property ID: {{ user.assignedProperty }}
                </p>
              </div>
            </UCard>

            <UCard v-if="user?.role === 'tenant' && (user?.rentedUnits?.length || user?.ownedUnits?.length)">
              <div>
                <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Units
                </h4>
                <div
                  v-if="user?.rentedUnits?.length"
                  class="mb-4"
                >
                  <h5 class="text-sm font-medium text-gray-700 mb-2">
                    Rented Units
                  </h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ user.rentedUnits.join(', ') }}
                  </p>
                </div>
                <div v-if="user?.ownedUnits?.length">
                  <h5 class="text-sm font-medium text-gray-700 mb-2">
                    Owned Units
                  </h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ user.ownedUnits.join(', ') }}
                  </p>
                </div>
              </div>
            </UCard> -->
          </div>
        </UCard>

        <UModal
          v-model:open="isUpdateModalOpen"
          :title="'Update Profile'"
        >
          <template #body>
            <UForm
              :schema="schema"
              :state="state"
              @submit="updateUser"
            >
              <div class="space-y-4">
                <UFormField
                  label="First Name"
                  name="first_name"
                >
                  <UInput
                    v-model="state.first_name"
                    placeholder="Enter your first name"
                  />
                </UFormField>
                <UFormField
                  label="Last Name"
                  name="last_name"
                >
                  <UInput
                    v-model="state.last_name"
                    placeholder="Enter your last name"
                  />
                </UFormField>
                <UFormField
                  label="Email"
                  name="email"
                >
                  <UInput
                    v-model="state.email"
                    disabled
                    type="email"
                    placeholder="Enter your email"
                  />
                </UFormField>
                <UFormField
                  label="Phone Number"
                  name="phone"
                >
                  <UInput
                    v-model="state.phone"
                    disabled
                    placeholder="Enter your phone number"
                  />
                </UFormField>
                <UFormField
                  label="Street Address"
                  name="street"
                >
                  <UTextarea
                    v-model="state.street"
                    class="w-full"
                    placeholder="Enter your street address"
                  />
                </UFormField>
                <UFormField
                  label="City"
                  name="city"
                >
                  <UInput
                    v-model="state.city"
                    placeholder="Enter your city"
                  />
                </UFormField>
                <UFormField
                  label="State/Province"
                  name="state"
                >
                  <UInput
                    v-model="state.state"
                    placeholder="Enter your state/province"
                  />
                </UFormField>
              </div>
              <div class="flex items-center justify-between pt-6">
                <UButton
                  color="error"
                  variant="ghost"
                  :loading="loading"
                  @click="cancel"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  :loading="loading"
                >
                  Update Profile
                </UButton>
              </div>
            </UForm>
          </template>
        </UModal>
      </div>
    </BasePage>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'

definePageMeta({
  title: 'Profile',
  layout: 'default',
})

const { user, fetch } = useUserSession()

const isUpdateModalOpen = ref(false)
const loading = ref(false)

const schema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

const state = reactive({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
  email: user.value?.email || '',
  phone: user.value?.phone || '',
  street: user.value?.address?.street || '',
  city: user.value?.address?.city || '',
  state: user.value?.address?.state || '',
})

const avatarUrl = computed(() => {
  const firstName = user.value?.first_name || 'F'
  const lastName = user.value?.last_name || 'L'
  return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`
})

const updateUser = async () => {
  loading.value = true
  const toast = useToast()

  try {
    await $fetch('/api/users/profile/', {
      method: 'POST',
      body: {
        first_name: state.first_name,
        last_name: state.last_name,
        phone: state.phone,
        street: state.street,
        city: state.city,
        state: state.state,
      },
    })

    toast.add({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
      icon: 'i-lucide-check-circle',
    })
    await fetch()

    isUpdateModalOpen.value = false
  }
  catch (error: any) {
    console.error('Error updating profile:', error)
    toast.add({
      title: 'Update Failed',
      description: error?.data?.message || 'Failed to update profile. Please try again.',
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

const cancel = () => {
  isUpdateModalOpen.value = false
  Object.assign(state, {
    first_name: user.value?.first_name || '',
    last_name: user.value?.last_name || '',
    email: user.value?.email || '',
    phone: user.value?.phone || '',
    street: user.value?.address?.street || '',
    city: user.value?.address?.city || '',
    state: user.value?.address?.state || '',
  })
}

const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style>

</style>
