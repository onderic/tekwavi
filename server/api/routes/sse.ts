import { MpesaTransaction } from '~~/server/models/MpesaTransaction'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const query = getQuery(event)
  const checkoutRequestId = query.checkoutRequestId as string

  let transactionCompleted = false

  const transactionTimeout = setTimeout(async () => {
    if (!transactionCompleted) {
      await eventStream.push(JSON.stringify({
        type: 'mpesa_update',
        success: false,
        data: {
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 'TIMEOUT',
          ResultDesc: 'Transaction timed out after 2 minutes with no response',
          status: 'Expired',
        },
      }))
    }
  }, 2 * 60 * 1000)

  const mpesaChangeStream = MpesaTransaction.watch([
    {
      $match: {
        'operationType': { $in: ['insert', 'update'] },
        'fullDocument.CheckoutRequestID': checkoutRequestId,
      },
    },
  ], {
    fullDocument: 'updateLookup',
  })

  mpesaChangeStream.on('change', async (change) => {
    const transaction = change.fullDocument

    if (transaction && transaction.CheckoutRequestID === checkoutRequestId) {
      const success = transaction.ResultCode === 0

      transactionCompleted = true

      const message = transaction.ResultDesc || 'Transaction processing status unknown'

      await eventStream.push(JSON.stringify({
        type: 'mpesa_update',
        success,
        data: {
          CheckoutRequestID: transaction.CheckoutRequestID,
          ResultCode: transaction.ResultCode,
          ResultDesc: message,
          MpesaReceiptNumber: transaction.MpesaReceiptNumber,
          Amount: transaction.Amount,
          TransactionDate: transaction.TransactionDate,
          status: transaction.status,
        },
      }))
    }
  })

  const heartbeatInterval = setInterval(async () => {
    await eventStream.push(JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
    }))
  }, 2000)

  eventStream.onClosed(async () => {
    clearInterval(heartbeatInterval)
    clearTimeout(transactionTimeout)
    await mpesaChangeStream.close()
    await eventStream.close()
  })

  return eventStream.send()
})
