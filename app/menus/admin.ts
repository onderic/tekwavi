import type { NavigationMenuItem } from '@nuxt/ui'

const developer: NavigationMenuItem[] = [
  {
    label: 'Properties',
    icon: 'i-lucide-building',
    to: '/properties',
  },
  {
    label: 'Tenants',
    icon: 'i-lucide-user-circle',
    to: '/tenants',
  },
  {
    label: 'Users',
    icon: 'i-lucide-users',
    to: '/users',
  },
]

export default developer
