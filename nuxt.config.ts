// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    'nuxt-nodemailer',
  ],
  // ssr: false,
  devtools: { enabled: false },

  app: {
    head: {
      title: 'Amaam',
      htmlAttrs: {
        style: 'background-color: light-dark(#ffffff, #111111); color: light-dark(#1f2937, #f0f0f0)',
      },
      meta: [
        { name: 'description', content: 'Amaam: A comprehensive property management platform for landlords and property managers. Easily manage rentals, tenants, and maintenance with our intuitive interface.' },
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#405189', media: '(prefers-color-scheme: light)' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/pwa-16x16.png' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/pwa-16x16.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/pwa-32x32.png',
        },
      ],
    },
    pageTransition: {
      name: 'bounce',
      mode: 'out-in', // default
    },
  },
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  runtimeConfig: {
    apiSecret: '123',
    secret: process.env.NUXT_SESSION_PASSWORD,
    MONGODB_URI: process.env.NUXT_PUBLIC_MONGODB_URI,
    JWT_SECRET: process.env.NUXT_PUBLIC_JWT_SECRET,
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
      maxAge: 60 * 60 * 24,
    },
    MPESA: {
      SHORTCODE: process.env.NUXT_PUBLIC_MPESA_SHORTCODE ? Number(process.env.NUXT_PUBLIC_MPESA_SHORTCODE) : undefined,
      CONSUMER_KEY: process.env.NUXT_PUBLIC_MPESA_CONSUMER_KEY,
      CONSUMER_SECRET: process.env.NUXT_PUBLIC_MPESA_CONSUMER_SECRET,
      PASSKEY: process.env.NUXT_PUBLIC_MPESA_PASSKEY,
      ACCESS_TOKEN_URL: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      STK_PUSH_URL: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
    },
    public: {
      APP_NAME: process.env.NUXT_PUBLIC_APP_NAME,
      APP_URL: process.env.NUXT_PUBLIC_APP_URL || 'https://black-coast-06202c000.2.azurestaticapps.net/',
    },
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'node',
    experimental: {
      tasks: process.env.NODE_ENV === 'production',
    },
    scheduledTasks: process.env.NODE_ENV === 'production'
      ? {
          '0 8,14,20 * * *': ['reminders'],
          '0 9 1 * *': ['monthlyInvoices'],
          '0 10 */3 * *': ['serviceExpense'],
          '1 0 1 1 *': ['propertyYearlyInvoice'],
        }
      : {},
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  nodemailer: {
    from: '"Amaam" <service@amaam.com>',
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'ondericollins80@gmail.com',
      pass: 'nfxkiyyvopyuexvv',
    },
  },
})
