// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // Evitar múltiples instancias de Prisma Client en desarrollo durante los recargos en caliente (HMR)
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient
  }
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient()
  }
  prisma = globalWithPrisma.prisma
}

export { prisma }
