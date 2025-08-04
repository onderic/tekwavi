<template>
  <BasePage
    title="Expenses"
    icon="i-lucide-credit-card"
    :status="status === 'pending'"
  >
    <template #headerActions>
      <UButton
        color="primary"
        variant="solid"
        label="Add Expense"
        :loading="isLoading"
        icon="i-lucide-plus"
        @click="showExpenseModal = true"
      />
    </template>

    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <UInput
          v-model="searchQuery"
          class="w-full sm:max-w-sm"
          icon="i-lucide-search"
          placeholder="Search expenses..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <USelect
            v-model="categoryFilter"
            :items="[
              { label: 'All Categories', value: 'all' },
              { label: 'Maintenance', value: 'maintenance' },
              { label: 'Utilities', value: 'utilities' },
              { label: 'Repairs', value: 'repairs' },
              { label: 'Supplies', value: 'supplies' },
              { label: 'Salary', value: 'salary' },
              { label: 'Other', value: 'other' },
            ]"
            placeholder="Filter by category"
            size="sm"
            class="min-w-40 w-full sm:w-auto"
          />

          <USelect
            v-model="dateFilter"
            :items="[
              { label: 'All Time', value: 'all' },
              { label: 'This Month', value: 'this_month' },
              { label: 'Last Month', value: 'last_month' },
              { label: 'This Quarter', value: 'this_quarter' },
              { label: 'This Year', value: 'this_year' },
            ]"
            placeholder="Filter by date"
            size="sm"
            class="min-w-40 w-full sm:w-auto"
          />
        </div>
      </div>

      <UTable
        ref="expensesTable"
        :loading="status === 'pending'"
        loading-animation="carousel"
        :data="filteredExpenses"
        :columns="columns"
        class="flex-1"
        :empty-state="{
          icon: 'i-lucide-receipt',
          label: 'No expenses found',
        }"
      >
        <template #property-cell="{ row }">
          <div
            class="capitalize"
          >
            {{ row.original.propertyName }}
          </div>
        </template>
        <template #description-cell="{ row }">
          <div class="max-w-md truncate">
            {{ row.original.description }}
          </div>
        </template>

        <template #amount-cell="{ row }">
          <div class="font-medium">
            {{ formatCurrency(row.original.amount) }}
          </div>
        </template>

        <template #category-cell="{ row }">
          <div
            class="capitalize"
          >
            {{ row.original.category }}
          </div>
        </template>

        <template #date-cell="{ row }">
          {{ formatDate(row.original.date) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <!-- <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-eye"
              size="xs"
              @click="viewExpense(row.original)"
            /> -->
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-edit"
              size="xs"
              @click="editExpense(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div
        v-if="totalExpenses >= 10"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-default pt-4 mt-4"
      >
        <div class="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0 break-words">
          Showing {{ (currentPage - 1) * limit + 1 }}-{{ Math.min(currentPage * limit, totalExpenses) }} of {{ totalExpenses }} expenses
        </div>
        <div class="flex items-center gap-1.5 self-end sm:self-auto">
          <UPagination
            v-model:page="currentPage"
            :page-count="totalPages"
            :total="totalExpenses"
            :items-per-page="limit"
            class="flex-shrink-0"
          />
        </div>
      </div>
    </UCard>

    <ClientOnly>
      <ExpensesAdd
        v-if="showExpenseModal"
        v-model:open="showExpenseModal"
        :expense="selectedExpense"
        :loading="isLoading"
        @save="handleSubmit"
      />
    </ClientOnly>
  </BasePage>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Expense } from '@/types/expense'

definePageMeta({
  title: 'Expenses',
})

const toast = useToast()
const isLoading = ref(false)
const showExpenseModal = ref(false)
const selectedExpense = ref<Expense | null>(null)
const searchQuery = ref('')
const categoryFilter = ref('all')
const dateFilter = ref('all')
const currentPage = ref(1)
const limit = ref(20)

const { user } = useUserSession()

const { propertyId: currentPropertyId } = useCurrentProperty()
const propertyId = computed(() => currentPropertyId.value || user.value?.assignedProperty || '')

const { formatCurrency, formatDate } = useFormatters()

const columns: TableColumn<Expense>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'propertyName',
    header: 'Property',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
  },
]

const { data, status, refresh } = await useLazyAsyncData(
  'PropertyExpenses',
  () => {
    if (!propertyId.value) return Promise.resolve(null)

    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
      search: searchQuery.value,
      category: categoryFilter.value !== 'all' ? categoryFilter.value : '',
      dateFilter: dateFilter.value !== 'all' ? dateFilter.value : '',
    })

    return $fetch<{
      expenses: Expense[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/api/expenses/${propertyId.value}/?${queryParams.toString()}`)
  },
  {
    watch: [currentPage, limit, searchQuery, categoryFilter, dateFilter, propertyId],
    default: () => ({
      expenses: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
      summary: {
        total: 0,
        thisMonth: 0,
        topCategory: {
          name: '',
          amount: 0,
        },
      },
    }),
  },
)

const expenses = computed(() => data.value?.expenses || [])
const totalPages = computed(() => data.value?.pagination.pages || 0)
const totalExpenses = computed(() => data.value?.pagination.total || 0)

const filteredExpenses = computed(() => {
  let filtered = [...expenses.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(expense =>
      expense.title.toLowerCase().includes(query)
      || expense?.description?.toLowerCase().includes(query),
    )
  }

  return filtered
})

// const viewExpense = (expense: Expense) => {
//   console.log('View expense:', expense)
// }

const editExpense = (expense: Expense) => {
  selectedExpense.value = expense
  showExpenseModal.value = true
}

const handleSubmit = async (form: Expense) => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    const method = selectedExpense.value ? 'POST' : 'POST'
    const url = selectedExpense.value
      ? `/api/expenses/${selectedExpense.value._id}`
      : '/api/expenses'

    await $fetch(url, {
      method,
      body: form,
    })

    toast.add({
      title: selectedExpense.value ? 'Expense updated' : 'Expense created',
      description: `The expense has been ${selectedExpense.value ? 'updated' : 'created'} successfully`,
      color: 'success',
      icon: 'i-lucide-check',
    })

    showExpenseModal.value = false
    selectedExpense.value = null
    refresh()
  }
  catch (error: any) {
    if (error && typeof error === 'object' && 'statusMessage' in error) {
      toast.add({
        color: 'error',
        title: `Failed to ${selectedExpense.value ? 'update' : 'create'} expense`,
        description: error.statusMessage as string,
      })
    }
    else {
      console.error(error)
      toast.add({
        color: 'error',
        title: `Failed to ${selectedExpense.value ? 'update' : 'create'} expense`,
        description: error?.message || 'An unexpected error occurred',
      })
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>
