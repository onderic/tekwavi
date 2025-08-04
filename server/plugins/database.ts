import mongoose from 'mongoose'
import { ServerApiVersion } from 'mongodb'

let isConnected = false

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const mongoUri = config.MONGODB_URI

  if (isConnected || mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected. Skipping reconnect.')
    return
  }

  const clientOptions = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  } as any

  try {
    await mongoose.connect(mongoUri, clientOptions)

    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 })
    }

    isConnected = true
    console.log('✅ Connected to MongoDB and ping successful')

    mongoose.connection.on('disconnected', async () => {
      isConnected = false
      console.error('❌ MongoDB disconnected. Attempting reconnect...')
      try {
        await mongoose.connect(mongoUri, clientOptions)
        isConnected = true
        console.log('✅ MongoDB reconnected.')
      }
      catch (reconnectErr) {
        console.error('❌ Reconnection failed:', reconnectErr)
      }
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err)
    })
  }
  catch (error) {
    console.error('❌ Initial MongoDB connection error:', error)
  }
})
