import type { NavigationMenuItem } from '@nuxt/ui'

const developerMenu: NavigationMenuItem[] = [

  {
    label: 'Layout',
    icon: 'i-lucide-layout-dashboard',
    to: '/properties',
  },
  {
    label: 'Units',
    icon: 'i-lucide-door-open',
    to: '/units',
  },
  {
    label: 'Revenue',
    icon: 'i-lucide-bar-chart-3',
    children: [
      {
        label: 'Expenses',
        to: '/expenses',
      },
      {
        label: 'Rental Income',
        to: '/income',
      },
      {
        label: 'Unit sales',
        to: '/sales',
      },
      {
        label: 'Disbursements',
        to: '/disbursements',
      },
    ],
  },
  {
    label: 'Services',
    icon: 'i-lucide-briefcase',
    children: [
      {
        label: 'Tenant Services',
        to: '/services/tenant',
      },
      {
        label: 'Unit Commission',
        to: '/services/owner',
      },
    ],
  },
  {
    label: 'Maintenance',
    icon: 'i-lucide-wrench',
    to: '/maintenance',
  },
  {
    label: 'Users',
    icon: 'i-lucide-users',
    children: [
      // {
      //   label: 'Owners',
      //   to: '/users/owners',
      // },
      {
        label: 'Admins',
        to: '/users',
      },
      {
        label: 'Tenants',
        to: '/tenants/list',
      },
    ],
  },
  {
    label: 'Billing',
    icon: 'i-lucide-scroll',
    to: '/billing',
  },

]

export default developerMenu
