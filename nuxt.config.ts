// nuxt.config.ts
export default defineNuxtConfig({
  // Registro de módulos para el Frontend
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  // Variables de entorno y configuración segura para el Backend (Nitro)
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'clave_secreta_desarrollo_enbus_2026',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Variables accesibles tanto en el Servidor como en el Cliente
    public: {
      apiBase: '/api'
    }
  },

  // Habilitar las herramientas de desarrollo de Nuxt en el navegador
  devtools: { enabled: true },

  compatibilityDate: '2026-05-23'
})
