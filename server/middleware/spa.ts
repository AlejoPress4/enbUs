// Sirve el index.html de React para todas las rutas SPA (no-API, no-assets)
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (
    path.startsWith('/api/') ||
    path.startsWith('/_nuxt/') ||
    /\.\w+$/.test(path)
  ) {
    return
  }

  const html = await useStorage('assets:server').getItem<string>('index.html')
  if (!html) return

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
