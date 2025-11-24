/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import { toast } from '@/hooks/use-toast';
import { AppError, ErrorCode, parseApiError } from './error-types';

export interface ErrorHandlerOptions {
  /**
   * Context for the error (e.g., "updating campaign", "fetching data")
   * Used in error messages
   */
  context?: string;

  /**
   * Whether to show a toast notification to the user
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast title (overrides default)
   */
  toastTitle?: string;

  /**
   * Custom toast description (overrides error message)
   */
  toastDescription?: string;

  /**
   * Whether to log to console (useful for debugging)
   * @default true in development, false in production
   */
  logToConsole?: boolean;

  /**
   * Whether to log to error tracking service (e.g., Sentry)
   * @default true
   */
  logToSentry?: boolean;

  /**
   * Callback function to execute after error handling
   */
  onError?: (error: AppError) => void;
}

/**
 * Handle API errors with consistent UX
 */
export function handleApiError(error: unknown, options: ErrorHandlerOptions = {}) {
  const {
    context,
    showToast = true,
    toastTitle,
    toastDescription,
    logToConsole = import.meta.env.DEV,
    logToSentry = !import.meta.env.DEV,
    onError,
  } = options;

  // Parse error into standardized format
  const appError = parseApiError(error);

  // Log to console in development
  if (logToConsole) {
    console.error('[Error Handler]', {
      context,
      error: appError,
      originalError: appError.originalError,
    });
  }

  // Log to Sentry in production (if configured)
  if (logToSentry && typeof window !== 'undefined' && 'Sentry' in window) {
    // @ts-ignore - Sentry global
    window.Sentry?.captureException(appError.originalError || appError, {
      tags: { context, code: appError.code },
      extra: { status: appError.status, details: appError.details },
    });
  }

  // Show toast notification
  if (showToast) {
    const title = toastTitle || getErrorTitle(appError.code, context);
    const description = toastDescription || getErrorDescription(appError);

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  // Execute callback
  if (onError) {
    onError(appError);
  }

  return appError;
}

/**
 * Get user-friendly error title based on error code
 */
function getErrorTitle(code: ErrorCode, context?: string): string {
  const action = context ? ` ${context}` : '';

  switch (code) {
    case ErrorCode.NETWORK_ERROR:
      return 'Connection Error';
    case ErrorCode.UNAUTHORIZED:
      return 'Authentication Required';
    case ErrorCode.FORBIDDEN:
      return 'Access Denied';
    case ErrorCode.NOT_FOUND:
      return 'Not Found';
    case ErrorCode.VALIDATION_ERROR:
      return 'Validation Error';
    case ErrorCode.CONFLICT:
      return 'Conflict';
    case ErrorCode.SERVER_ERROR:
      return 'Server Error';
    default:
      return `Error${action}`;
  }
}

/**
 * Get user-friendly error description
 */
function getErrorDescription(error: AppError): string {
  // If we have validation details, show the first error
  if (error.details && error.details.length > 0) {
    const firstError = error.details[0];
    return firstError.field
      ? `${firstError.field}: ${firstError.message}`
      : firstError.message;
  }

  return error.message;
}

/**
 * Handle form validation errors specifically
 */
export function handleValidationError(
  error: unknown,
  setError?: (field: string, error: { message: string }) => void
) {
  const appError = handleApiError(error, {
    context: 'validating form',
    showToast: !setError, // Don't show toast if we're setting field errors
  });

  // Set field-specific errors if setError function is provided
  if (setError && appError.details) {
    appError.details.forEach((detail) => {
      if (detail.field) {
        setError(detail.field, { message: detail.message });
      }
    });
  }

  return appError;
}

/**
 * Handle errors in async operations with loading states
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleApiError(error, options);
    return null;
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);

        if (onRetry) {
          onRetry(attempt, error);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
