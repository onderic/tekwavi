import type { Invoice } from '~/types/unitOccupation'

export function useFormatters() {
  /**
   * Format a date to a localized string
   */
  function formatDate(date: string | Date | undefined) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  /**
   * Format a currency amount in KES
   */
  function formatCurrency(amount: number | null | undefined) {
    if (amount === undefined || amount === null) return 'KES 0'
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * Format a furnishing string by replacing underscores with spaces
   */
  function formatFurnishing(furnishing: string | null | undefined) {
    if (!furnishing) return '-'
    return furnishing.replace(/_/g, ' ')
  }

  /**
   * Format a phone number or return a default if empty
   */
  function formatPhoneNumber(phoneNumber: string | undefined) {
    if (!phoneNumber) return '-'
    return phoneNumber
  }

  /**
   * Format payment method by replacing underscores with spaces
   */
  function formatPaymentMethod(method: string | undefined) {
    if (!method) return '-'
    return method.replace(/_/g, ' ')
  }

  /**
   * Get initials from tenant's name
   */
  function getTenantInitials(firstName?: string, lastName?: string) {
    if (!firstName) return ''

    if (lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }

    const parts = firstName.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return firstName.substring(0, 2).toUpperCase()
  }

  /**
   * Get month name from month number
   */
  function getMonthName(monthNumber: number) {
    return new Date(0, monthNumber - 1).toLocaleString('default', { month: 'long' })
  }

  /**
   * Get appropriate color for payment status
   */
  function getPaymentStatusColor(payment: Invoice) {
    if (payment.isPaid) return 'success'
    if (payment.isLate) return 'error'
    return 'warning'
  }

  /**
   * Get appropriate color for rent status
   */
  function getRentStatusColor(status: string | null) {
    if (!status) return 'neutral'
    if (status === 'Paid') return 'success'
    if (status === 'Overdue') return 'error'
    return 'warning'
  }

  return {
    formatDate,
    formatCurrency,
    formatFurnishing,
    formatPhoneNumber,
    formatPaymentMethod,
    getTenantInitials,
    getMonthName,
    getPaymentStatusColor,
    getRentStatusColor,
  }
}
