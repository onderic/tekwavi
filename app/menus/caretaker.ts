import type { NavigationMenuItem } from '@nuxt/ui'

const caretakerMenu: NavigationMenuItem[] = [
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
    label: 'Expenses',
    icon: 'i-lucide-credit-card',
    to: '/expenses',
  },
  {
    label: 'Maintenance Requests',
    icon: 'i-lucide-wrench',
    to: '/maintenance',
  },

]

export default caretakerMenu
