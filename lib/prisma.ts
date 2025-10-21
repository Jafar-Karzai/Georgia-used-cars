import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Add pgbouncer=true parameter to DATABASE_URL if not already present
// This disables prepared statements for Supabase connection pooling
function getDatasourceUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) return ''

  // Check if pgbouncer parameter is already present
  if (url.includes('pgbouncer=true')) return url

  // Add pgbouncer=true parameter
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}pgbouncer=true`
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
    datasourceUrl: getDatasourceUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
