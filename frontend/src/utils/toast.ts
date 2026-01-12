import toast from 'react-hot-toast';

/**
 * Show success toast notification
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

/**
 * Show error toast notification
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

/**
 * Show info toast notification
 */
export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#2563EB',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    icon: 'ℹ️',
  });
};

/**
 * Show loading toast with promise
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#fff',
      color: '#111827',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Show promise-based toast (loading -> success/error)
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-right',
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
};
