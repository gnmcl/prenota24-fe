import type { ApiErrorResponse } from "../types";

/**
 * Type-guard to check whether an unknown rejection is our normalised API error.
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  );
}

/**
 * Extract a user-facing message from any thrown value.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}
