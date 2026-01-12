import { AxiosError } from 'axios';
import { showError } from './toast';

/**
 * Handle API errors and return user-friendly messages
 */
export const handleApiError = (error: unknown): string => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    // Handle specific status codes
    if (axiosError.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      return 'Session expired. Please login again.';
    }

    if (axiosError.response?.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    if (axiosError.response?.status === 404) {
      return 'The requested resource was not found.';
    }

    if (axiosError.response?.status === 409) {
      return axiosError.response.data?.error || 'A conflict occurred. This resource may already exist.';
    }

    if (axiosError.response?.status === 422) {
      return axiosError.response.data?.error || 'Invalid data provided. Please check your input.';
    }

    if (axiosError.response?.status === 429) {
      return 'Too many requests. Please slow down and try again in a moment.';
    }

    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later or contact support if the problem persists.';
    }

    if (axiosError.response?.status === 503) {
      return 'Service temporarily unavailable. Please try again in a few moments.';
    }

    // Return error message from response if available
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Network errors
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection and try again.';
    }

    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}

/**
 * Handle API error and show toast notification
 */
export const handleApiErrorWithToast = (error: unknown): string => {
  const message = handleApiError(error);
  showError(message);
  return message;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Password is too long (max 128 characters)' };
  }

  // Optional: Check for complexity
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return { valid: true, message: 'Password is valid' };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
