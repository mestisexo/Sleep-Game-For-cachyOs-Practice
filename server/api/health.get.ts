export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  return {
    status: 'ok',
    service: config.serviceName,
    version: config.appVersion,
    timestamp: new Date().toISOString(),
  }
})
