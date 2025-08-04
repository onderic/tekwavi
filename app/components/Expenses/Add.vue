<template>
  <UModal
    :open="props.open"
    :title="getModalTitle"
    :description="getModalDescription"
    :close="{ onClick: () => emit('update:open', false),
              color: 'primary',
              variant: 'outline',
              class: 'rounded-full' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Title"
          name="title"
          help="Enter a descriptive title for this expense"
        >
          <UInput
            v-model="form.title"
            placeholder="Enter expense title"
            :disabled="props.loading"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          help="Optional details about the expense"
        >
          <UTextarea
            v-model="form.description"
            placeholder="Enter expense details"
            class="min-h-24 w-full"
            :disabled="props.loading"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Amount"
            name="amount"
          >
            <UInput
              v-model.number="form.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="props.loading"
            >
              <template #leading>
                <span class="text-gray-500">KES</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField
            label="Date"
            name="date"
          >
            <UInput
              v-model="form.date"
              type="date"
              :max="today"
              :disabled="props.loading"
            />
          </UFormField>
        </div>

        <UFormField
          label="Category"
          name="category"
        >
          <USelect
            v-model="form.category"
            :items="categoryOptions"
            placeholder="Select a category"
            :disabled="props.loading"
          />
        </UFormField>

        <UFormField
          label="Payment Method"
          name="paymentMethod"
        >
          <USelect
            v-model="form.paymentMethod"
            :items="paymentMethodOptions"
            placeholder="Select payment method"
            :disabled="props.loading"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
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
            icon="i-lucide-save"
            :loading="props.loading"
            :disabled="props.loading"
          >
            {{ expense ? 'Update Expense' : 'Save Expense' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { Expense } from '@/types/expense'

interface Props {
  open: boolean
  loading: boolean
  expense: Expense | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:open', 'save'])
const propertyStore = usePropertyStore()
const { user } = useUserSession()

const today = computed(() => {
  const now = new Date()
  return now.toISOString().split('T')[0]
})

const { propertyId: currentPropertyId } = useCurrentProperty()
const propertyId = computed(() => currentPropertyId.value || user.value?.assignedProperty || '')
const propertyName = computed(() => propertyStore.currentProperty?.propertyName || 'Property')

const getModalTitle = computed(() => {
  if (props.expense) {
    return `Edit Expense - ${propertyName.value}`
  }
  return `Add New Expense - ${propertyName.value}`
})

const getModalDescription = computed(() => {
  if (props.expense) {
    return `Edit the expense details for ${propertyName.value}`
  }
  return `Add a new expense record for ${propertyName.value}`
})

const categoryOptions = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Repairs', value: 'repairs' },
  { label: 'Supplies', value: 'supplies' },
  { label: 'Salary', value: 'salary' },
  { label: 'Other', value: 'other' },
]

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Check', value: 'check' },
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Other', value: 'other' },
]

const schema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  }).positive('Amount must be greater than zero'),
  date: z.string().min(1, 'Date is required'),
  category: z.enum(['maintenance', 'utilities', 'repairs', 'supplies', 'salary', 'other']),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'mobile_money', 'credit_card', 'other']),
})

const form = ref<{
  _id: string
  title: string
  description: string
  amount: number
  date: string
  category: 'maintenance' | 'utilities' | 'repairs' | 'supplies' | 'salary' | 'other'
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'mobile_money' | 'credit_card' | 'other'
}>({
  _id: '',
  title: '',
  description: '',
  amount: 0,
  date: String(today.value),
  category: 'maintenance',
  paymentMethod: 'cash',
})

watch(() => props.expense, (newExpense) => {
  if (newExpense) {
    form.value = {
      _id: newExpense._id,
      title: newExpense.title,
      description: newExpense.description || '',
      amount: newExpense.amount,
      date: String(new Date(newExpense.date).toISOString().split('T')[0]),
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
    }
  }
  else {
    form.value = {
      _id: '',
      title: '',
      description: '',
      amount: 0,
      date: String(today.value),
      category: 'maintenance',
      paymentMethod: 'cash',
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (props.loading) return
  const expenseData = {
    ...form.value,
    date: form.value.date,
    propertyId: propertyId.value,
    propertyName: propertyName.value,
  }

  emit('save', expenseData)
}
</script>
