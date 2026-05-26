// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', 'nuxt-auth-utils', '@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
        file: 'en.json',
      },
      {
        code: 'id',
        name: 'Indonesia',
        language: 'id-ID',
        file: 'id.json',
      },
    ],
  },

  css: ['~/assets/css/main.css'],
})
