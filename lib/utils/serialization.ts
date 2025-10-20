/**
 * API Response Serialization Utilities
 * Converts between camelCase and snake_case
 * - Outgoing: Prisma camelCase → API snake_case
 * - Incoming: API snake_case → Form camelCase
 */

/**
 * Convert a string from camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert a string from snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Recursively convert all object keys from camelCase to snake_case
 * Handles nested objects, arrays, null, and primitive types
 */
export function serializeToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeToSnakeCase(item))
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString()
  }

  // Handle Decimal objects from Prisma (convert to number)
  if (obj.constructor?.name === 'Decimal' || (typeof obj === 'object' && 'toNumber' in obj)) {
    return Number(obj)
  }

  // Handle plain objects - convert keys to snake_case and recursively process values
  const converted: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key)
    converted[snakeKey] = serializeToSnakeCase(value)
  }

  return converted
}

/**
 * Convert multiple items to snake_case
 */
export function serializeArrayToSnakeCase(items: any[]): any[] {
  return items.map(item => serializeToSnakeCase(item))
}

/**
 * Serialize Prisma response with pagination info
 */
export function serializeWithPagination(data: any[], pagination?: any) {
  return {
    success: true,
    data: serializeArrayToSnakeCase(data),
    ...(pagination && { pagination })
  }
}

/**
 * Convert snake_case API response to camelCase for client-side use
 * Handles Decimal conversion to numbers for form compatibility
 */
export function serializeToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeToCamelCase(item))
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj
  }

  // Handle Decimal objects from Prisma (convert to number for form compatibility)
  if (obj.constructor?.name === 'Decimal' || (typeof obj === 'object' && 'toNumber' in obj)) {
    return Number(obj)
  }

  // Handle plain objects - convert keys to camelCase and recursively process values
  const converted: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    converted[camelKey] = serializeToCamelCase(value)
  }

  return converted
}

/**
 * Convert multiple snake_case items to camelCase
 */
export function serializeArrayToCamelCase(items: any[]): any[] {
  return items.map(item => serializeToCamelCase(item))
}
