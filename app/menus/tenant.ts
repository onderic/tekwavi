import type { NavigationMenuItem } from '@nuxt/ui'

const tenantMenu: NavigationMenuItem[] = [
  {
    label: 'Maintenance',
    icon: 'i-lucide-wrench',
    to: '/maintenance/tenant',
  },
  // {
  //   label: 'My Unit',
  //   icon: 'i-lucide-door',
  //   to: '/tenants',
  // },
  // {
  //   label: 'Payments',
  //   icon: 'i-lucide-credit-card',
  //   to: '/payments',
  // },
  // {
  //   label: 'Maintenance Requests',
  //   icon: 'i-lucide-wrench',
  //   to: '/maintenance',
  // },
]

export default tenantMenu
