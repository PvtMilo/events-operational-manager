// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', 'nuxt-auth-utils'],

  colorMode: {
    preference: 'light',
  },

  runtimeConfig: {
    public: {
      demoMode: process.env.NUXT_PUBLIC_DEMO_MODE === "true",
    },
  },

  css: ['~/assets/css/main.css'],
})
