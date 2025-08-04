export const useSidebar = () => {
  const isSidebarOpen = useState('sidebar-open', () => false)

  const toggleSidebar = () => {
  }

  return {
    isSidebarOpen,
    toggleSidebar,
  }
}
