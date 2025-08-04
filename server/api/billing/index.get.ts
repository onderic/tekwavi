import { BillingInvoice } from '~~/server/models/Billing/BillingInvoice'
import { BillingAccount } from '~~/server/models/Billing/Account'
import { Property } from '~~/server/models/Property'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user || user.role !== 'developer') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Only developers can access billing information.',
    })
  }

  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Get developer's billing account
    const billingAccount = await BillingAccount.findOne({
      developerId: user._id,
    }).select('fixedMonthlyRate')

    if (!billingAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Billing account not found',
      })
    }

    // Get all active properties for the developer
    const activeProperties = await Property.countDocuments({
      _id: { $in: user.ownedProperties || [] },
      status: 'active',
    })

    const monthlyRate = billingAccount.fixedMonthlyRate || 5000
    const totalMonthlyCharge = activeProperties * monthlyRate

    const currentMonthInvoice = await BillingInvoice.findOne({
      developerId: user._id,
      year: currentYear,
      month: currentMonth,
    }).select('isPaid dueDate status totalAmount')

    // Determine next billing date
    let nextBillingDate: Date
    let nextBillingMonth: string

    if (currentMonthInvoice?.isPaid) {
      // If current month is paid, next billing is next month
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      nextBillingDate = new Date(nextYear, nextMonth - 1, 1)

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      nextBillingMonth = `${monthNames[nextMonth - 1]} ${nextYear}`
    }
    else {
      // If current month not paid, it's the next billing
      nextBillingDate = currentMonthInvoice?.dueDate || new Date(currentYear, currentMonth - 1, 5)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      nextBillingMonth = `${monthNames[currentMonth - 1]} ${currentYear}`
    }

    // Get all invoices for current year
    const allInvoices = await BillingInvoice.find({
      developerId: user._id,
      year: currentYear,
    })
      .select('month monthName year totalAmount isPaid dueDate status invoiceNumber createdAt')
      .lean()

    // Get previous year's invoices if needed
    let previousYearInvoices: any[] = []
    if (allInvoices.length < 12) {
      const remainingMonths = 12 - allInvoices.length
      previousYearInvoices = await BillingInvoice.find({
        developerId: user._id,
        year: currentYear - 1,
      })
        .select('month monthName year totalAmount isPaid dueDate status invoiceNumber createdAt')
        .sort({ month: -1 })
        .limit(remainingMonths)
        .lean()
    }

    // Combine all invoices
    const allCombinedInvoices = [...allInvoices, ...previousYearInvoices]

    // Sort invoices: current month first, then chronologically (oldest to newest for remaining months)
    const sortedInvoices = allCombinedInvoices.sort((a, b) => {
      // Current month always first
      if (a.year === currentYear && a.month === currentMonth) return -1
      if (b.year === currentYear && b.month === currentMonth) return 1

      // For the rest, sort chronologically (oldest first)
      // First by year ascending
      if (a.year !== b.year) return a.year - b.year

      // Then by month ascending
      return a.month - b.month
    })

    // Format invoices for response
    const formattedInvoices = sortedInvoices.slice(0, 12).map(invoice => ({
      id: invoice._id,
      month: invoice.month,
      monthName: invoice.monthName,
      year: invoice.year,
      amount: invoice.totalAmount,
      isPaid: invoice.isPaid,
      dueDate: invoice.dueDate,
      status: invoice.status,
      invoiceNumber: invoice.invoiceNumber,
      isCurrentMonth: invoice.year === currentYear && invoice.month === currentMonth,
      createdAt: invoice.createdAt,
    }))

    return {
      success: true,
      data: {
        stats: {
          totalActiveProperties: activeProperties,
          monthlyRatePerProperty: monthlyRate,
          totalMonthlyCharge,
          currency: 'KES',
        },
        nextBilling: {
          date: nextBillingDate,
          month: nextBillingMonth,
          amount: totalMonthlyCharge,
          daysUntilDue: Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        },
        currentMonthStatus: {
          isPaid: currentMonthInvoice?.isPaid || false,
          status: currentMonthInvoice?.status || 'pending',
          amount: currentMonthInvoice?.totalAmount || totalMonthlyCharge,
        },
        invoices: formattedInvoices,
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching billing stats:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch billing information',
    })
  }
})
