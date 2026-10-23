import pkg from './package.json' with { type: 'json' }

export default defineNuxtConfig({
  // El HTML de /terminal debe ser determinista también en desarrollo; las
  // DevTools inyectan un `timeSsrStart` distinto en cada respuesta.
  devtools: { enabled: false },
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    appVersion: pkg.version,
    serviceName: pkg.name,
    public: {
      appName: 'Sleepgame',
    },
  },
})
