// server/utils/redis.ts
import Redis from 'ioredis'

class MemoryCache {
  private cache = new Map<string, { value: string; expiresAt: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiresAt })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }
}

const memoryCache = new MemoryCache()

interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

let cacheClient: CacheClient

const redisUrl = process.env.REDIS_URL || process.env.KV_URL

if (redisUrl) {
  try {
    console.log('🔄 Intentando conectar al servidor de Redis...')
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true, // No bloquear el inicio si no hay conexión
    })

    client.on('error', (err) => {
      console.warn('⚠️ Evento de error en cliente Redis (usando fallback local):', err.message)
    })

    cacheClient = {
      async get(key: string) {
        try {
          return await client.get(key)
        } catch (err) {
          console.warn('⚠️ Falló lectura en Redis. Usando fallback de caché en memoria.')
          return memoryCache.get(key)
        }
      },
      async set(key: string, value: string, ttlSeconds: number) {
        try {
          await client.set(key, value, 'EX', ttlSeconds)
        } catch (err) {
          console.warn('⚠️ Falló escritura en Redis. Usando fallback de caché en memoria.')
          await memoryCache.set(key, value, ttlSeconds)
        }
      },
      async del(key: string) {
        try {
          await client.del(key)
        } catch (err) {
          console.warn('⚠️ Falló borrado en Redis. Usando fallback de caché en memoria.')
          await memoryCache.del(key)
        }
      }
    }

    // Intentar conectar en segundo plano
    client.connect().then(() => {
      console.log('✅ Conexión a Redis establecida exitosamente.')
    }).catch((err) => {
      console.warn('⚠️ Falló conexión inicial de Redis. Se usará el caché de respaldo en memoria:', err.message)
    })

  } catch (e) {
    console.warn('⚠️ Excepción al inicializar Redis. Usando fallback en memoria.', e)
    cacheClient = memoryCache
  }
} else {
  console.log('ℹ️ REDIS_URL no está configurada. Usando caché en memoria para desarrollo local.')
  cacheClient = memoryCache
}

export const cache = cacheClient
