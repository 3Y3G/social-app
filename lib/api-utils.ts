import { NextResponse } from "next/server"

type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, any>
}

/**
 * Creates a standardized successful API response
 */
export function successResponse<T>(data: T, meta?: Record<string, any>, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status },
  )
}

/**
 * Creates a standardized error API response
 */
export function errorResponse(error: string, status = 500): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  )
}

/**
 * Handles API errors in a consistent way
 */
export function handleApiError(error: unknown, customMessage?: string): NextResponse<ApiResponse> {
  console.error("API Error:", error)

  const message = customMessage || "An unexpected error occurred"
  return errorResponse(message, 500)
}

/**
 * Wraps an API handler with standard error handling
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  errorContext: string,
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler()
    return successResponse(result)
  } catch (error) {
    console.error(`Error in ${errorContext}:`, error)
    return errorResponse(`Failed to ${errorContext.toLowerCase()}`, 500)
  }
}

/**
 * Checks if the user is authenticated and returns an error response if not
 */
export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Unauthorized", 401)
}

/**
 * Returns a not found error response
 */
export function notFoundResponse(resource: string): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404)
}

/**
 * Returns a forbidden error response
 */
export function forbiddenResponse(message?: string): NextResponse<ApiResponse> {
  return errorResponse(message || "Not authorized to perform this action", 403)
}

/**
 * Returns a bad request error response
 */
export function badRequestResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 400)
}
