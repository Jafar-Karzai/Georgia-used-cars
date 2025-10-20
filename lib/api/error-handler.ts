/**
 * Centralized API error handling utilities
 * Provides consistent error responses and sanitization across all endpoints
 */

import { NextResponse } from 'next/server'

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Sanitize error messages to remove sensitive information
 * Prevents leaking database credentials, connection strings, etc.
 */
export function sanitizeError(error: string | Error): string {
  const message = error instanceof Error ? error.message : error

  return message
    .replace(/connection string.*?failed/gi, 'database connection failed')
    .replace(/password.*?@/gi, 'credentials@')
    .replace(/user:.*?@/gi, 'user:***@')
    .replace(/postgresql:\/\/.*?@/gi, 'postgresql://***@')
    .replace(/SUPABASE_.*?KEY/gi, '***KEY')
    .replace(/ERROR: (.*?)$/gm, 'database error')
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string
): [ApiErrorResponse, { status: number }] {
  return [
    {
      success: false,
      error: message,
      ...(details && { details })
    },
    { status }
  ]
}

/**
 * Create a standardized success response
 */
export function successResponse<T = any>(
  data?: T,
  message?: string,
  pagination?: ApiSuccessResponse['pagination']
): ApiSuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(pagination && { pagination })
  }
}

/**
 * Handle validation errors with consistent formatting
 */
export function validationErrorResponse(errors: Array<{ field: string; message: string }>) {
  const details = errors.map(e => `${e.field}: ${e.message}`).join(', ')
  return errorResponse('Validation failed', 400, details)
}

/**
 * Handle common API errors
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Error handler for authentication failures
 */
export function authenticationError(reason: string = 'Authentication required') {
  return errorResponse(reason, 401)
}

/**
 * Error handler for authorization failures
 */
export function authorizationError(reason: string = 'Insufficient permissions') {
  return errorResponse(reason, 403)
}

/**
 * Error handler for not found errors
 */
export function notFoundError(resource: string = 'Resource') {
  return errorResponse(`${resource} not found`, 404)
}

/**
 * Error handler for conflict errors (e.g., duplicate VIN)
 */
export function conflictError(reason: string) {
  return errorResponse(reason, 409)
}

/**
 * Error handler for bad requests
 */
export function badRequestError(reason: string) {
  return errorResponse(reason, 400)
}

/**
 * Generic error handler that determines status code based on error type
 */
export function handleError(error: unknown, context: string = 'operation'): [ApiErrorResponse, { status: number }] {
  console.error(`Error in ${context}:`, error)

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.status, error.details)
  }

  if (error instanceof Error) {
    const message = error.message

    // Determine status code based on error message
    if (message.includes('not found')) {
      return errorResponse('Resource not found', 404)
    }
    if (message.includes('already exists')) {
      return errorResponse(message, 409)
    }
    if (message.includes('Unauthorized')) {
      return errorResponse('Authentication required', 401)
    }
    if (message.includes('Forbidden')) {
      return errorResponse('Insufficient permissions', 403)
    }

    // Sanitize and return generic error
    return errorResponse(sanitizeError(message), 500)
  }

  return errorResponse('An unexpected error occurred', 500)
}

/**
 * Wrap async route handlers with automatic error handling
 * Usage: export const GET = withErrorHandling(async (request) => { ... })
 */
export function withErrorHandling(handler: (req: any) => Promise<NextResponse>) {
  return async (request: any, context?: any) => {
    try {
      return await handler(request)
    } catch (error) {
      const [errorData, options] = handleError(error, 'api_handler')
      return NextResponse.json(errorData, options)
    }
  }
}
