import { KeepWarm } from '../models/KeepWarm'

export default defineTask({
  meta: {
    name: 'keepWarm',
    description: 'Simple ping to keep the app warm and prevent sleeping',
  },

  async run({ payload }) {
    const startTime = Date.now()
    const timestamp = new Date()

    const triggeredBy = payload?.triggeredBy || 'scheduled'
    const source = payload?.source || 'unknown'

    try {
      // Simple read operation to keep DB connection alive
      const dbStartTime = Date.now()
      const recordCount = await KeepWarm.countDocuments()
      const dbResponseTime = Date.now() - dbStartTime

      const responseTime = Date.now() - startTime
      const uptime = process.uptime()

      return {
        result: {
          success: true,
          timestamp: timestamp.toISOString(),
          status: 'app-warm',
          responseTime,
          dbResponseTime,
          uptime,
          triggeredBy,
          source,
          dbConnected: true,
          recordCount,
        },
      }
    }
    catch (error: any) {
      const responseTime = Date.now() - startTime
      console.error(`❌ Keep-warm ping failed:`, error.message)

      return {
        result: {
          success: false,
          timestamp: timestamp.toISOString(),
          status: 'failed',
          error: error.message,
          responseTime,
          dbResponseTime: 0,
          uptime: process.uptime(),
          triggeredBy,
          source,
          dbConnected: false,
          recordCount: 0,
        },
      }
    }
  },
})
