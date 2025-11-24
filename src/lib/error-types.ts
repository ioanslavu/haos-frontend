/**
 * Error Type Definitions
 * Standardized error types for the application
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Application errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  message: string;
  code?: ErrorCode;
  details?: ApiErrorDetail[];
  status?: number;
}

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status?: number;
  public readonly details?: ApiErrorDetail[];
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    options?: {
      status?: number;
      details?: ApiErrorDetail[];
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
    this.originalError = options?.originalError;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Parse axios error into standardized AppError
 */
export function parseApiError(error: unknown): AppError {
  // Axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: {
        status: number;
        data?: {
          message?: string;
          detail?: string;
          errors?: ApiErrorDetail[];
          non_field_errors?: string[];
        };
      };
      message: string;
    };

    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    // Determine error code based on status
    let code = ErrorCode.UNKNOWN_ERROR;
    if (status === 401) code = ErrorCode.UNAUTHORIZED;
    else if (status === 403) code = ErrorCode.FORBIDDEN;
    else if (status === 404) code = ErrorCode.NOT_FOUND;
    else if (status === 409) code = ErrorCode.CONFLICT;
    else if (status === 422 || status === 400) code = ErrorCode.VALIDATION_ERROR;
    else if (status && status >= 500) code = ErrorCode.SERVER_ERROR;

    // Extract error message
    let message = 'An error occurred';
    if (data?.message) message = data.message;
    else if (data?.detail) message = data.detail;
    else if (data?.non_field_errors?.length) message = data.non_field_errors[0];
    else if (axiosError.message) message = axiosError.message;

    return new AppError(message, code, {
      status,
      details: data?.errors,
      originalError: error,
    });
  }

  // Network error (no response)
  if (error && typeof error === 'object' && 'message' in error) {
    const networkError = error as { message: string };
    if (networkError.message === 'Network Error' || networkError.message.includes('timeout')) {
      return new AppError(
        'Unable to connect to the server. Please check your internet connection.',
        ErrorCode.NETWORK_ERROR,
        { originalError: error }
      );
    }
  }

  // Unknown error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new AppError(message, ErrorCode.UNKNOWN_ERROR, { originalError: error });
}
