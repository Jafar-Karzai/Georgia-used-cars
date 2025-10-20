import { PrismaClient } from '@prisma/client'

// Workaround for pgbouncer/prepared statement issues on hosted Postgres (e.g., Supabase)
// https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/working-with-connection-pools
if (!process.env.PRISMA_DISABLE_PREPARED_STATEMENTS) {
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = 'true'
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
