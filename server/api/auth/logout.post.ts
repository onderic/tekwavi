export default defineEventHandler(async (event) => {
  try {
    await clearUserSession(event)

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }
  catch (error: any) {
    console.error('Logout error:', error)

    try {
      await clearUserSession(event)
    }
    catch (clearError) {
      console.error('Failed to clear session:', clearError)
    }

    return {
      success: false,
      message: 'Logout completed with errors',
    }
  }
})
