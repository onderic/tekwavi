<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-bold">
        Occupation History
      </h2>
    </template>

    <div>
      <UTable
        :columns="occupationColumns"
        :data="occupationHistory"
      >
        <template #tenant-cell="{ row }">
          <div class="flex items-center gap-2 font-bold dark:text-white text-gray-900">
            <UAvatar
              size="sm"
              :text="getTenantInitials(row.original.firstName, row.original.lastName)"
            />
            {{ row.original.firstName }} {{ row.original.lastName }}
          </div>
        </template>

        <template #leaseStartDate-cell="{ row }">
          {{ formatDate(row.original.leaseStartDate) }}
        </template>

        <template #moveOutDate-cell="{ row }">
          {{ row.original.moveOutDate ? formatDate(row.original.moveOutDate) : 'Current' }}
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.isActive ? 'primary' : 'neutral'"
            variant="subtle"
          >
            {{ row.original.isActive ? 'Active' : 'Ended' }}
          </UBadge>
        </template>

        <template #rentAmount-cell="{ row }">
          {{ formatCurrency(row.original.rentAmount) }}
        </template>
      </UTable>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useFormatters } from '~/composables/formatters'

interface Props {
  occupationHistory: any[]
}

defineProps<Props>()

const { formatDate, formatCurrency, getTenantInitials } = useFormatters()

const occupationColumns: TableColumn<any>[] = [
  {
    id: 'tenant',
    header: 'Tenant',
  },
  {
    accessorKey: 'leaseStartDate',
    header: 'Move In',
  },
  {
    accessorKey: 'moveOutDate',
    header: 'Move Out',
  },
  {
    id: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'rentAmount',
    header: 'Rent',
  },
]
</script>
