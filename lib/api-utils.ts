import { NextResponse } from "next/server";

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
};

/**
 * Creates a standardized successful API response
 */
export function successResponse<T = Record<string, any>>(
  data: T,
  message: string = "Success",
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse<T = null>(
  message: string = "Internal Server Error",
  status: number = 500
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: false, message, data: null as T },
    { status }
  );
}

/**
 * Handles API errors in a consistent way
 */
export function handleApiError(
  error: unknown,
  customMessage?: string
): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  const message = customMessage || "An unexpected error occurred";
  return errorResponse(message, 500);
}

/**
 * Wraps an API handler with standard error handling
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  errorContext: string
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler();
    return successResponse<T>(result); // Use explicit generic
  } catch (error) {
    console.error(`Error in ${errorContext}:`, error);
    return errorResponse(`Failed to ${errorContext.toLowerCase()}`, 500);
  }
}

/**
 * Checks if the user is authenticated and returns an error response if not
 */
export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Unauthorized", 401);
}

/**
 * Returns a not found error response
 */
export function notFoundResponse(resource: string): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Returns a forbidden error response
 */
export function forbiddenResponse(message?: string): NextResponse<ApiResponse> {
  return errorResponse(message || "Not authorized to perform this action", 403);
}

/**
 * Returns a bad request error response
 */
export function badRequestResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 400);
}
