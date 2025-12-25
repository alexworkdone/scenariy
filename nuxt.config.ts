// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  content: {
    watch: { enabled: false },
  },

  devtools: { enabled: false },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      preload: false,
      global: false,
    },
  ],
})
