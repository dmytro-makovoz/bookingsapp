import { toast } from 'react-toastify';

// Custom toast configurations for different types
export const showSuccessToast = (message) => {
  toast.success(message, {
    icon: '✅',
    className: 'toast-success',
    progressClassName: 'toast-progress-success',
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    icon: '❌',
    className: 'toast-error',
    progressClassName: 'toast-progress-error',
  });
};

export const showInfoToast = (message) => {
  toast.info(message, {
    icon: 'ℹ️',
    className: 'toast-info',
    progressClassName: 'toast-progress-info',
  });
};

export const showWarningToast = (message) => {
  toast.warning(message, {
    icon: '⚠️',
    className: 'toast-warning',
    progressClassName: 'toast-progress-warning',
  });
};

// Special toast for login success with user name
export const showWelcomeToast = (userName) => {
  toast.success(`🎉 Welcome back, ${userName}!`, {
    autoClose: 5000,
    className: 'toast-welcome',
  });
};

// Special toast for signup success
export const showSignupSuccessToast = (userName) => {
  toast.success(`🚀 Welcome to Bookings App, ${userName}! Your account has been created successfully.`, {
    autoClose: 6000,
    className: 'toast-welcome',
  });
};

// Loading toast for async operations
export const showLoadingToast = (message = 'Loading...') => {
  return toast.loading(message, {
    className: 'toast-loading',
  });
};

// Update loading toast to success
export const updateToastToSuccess = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: 'success',
    isLoading: false,
    autoClose: 4000,
    icon: '✅',
  });
};

// Update loading toast to error
export const updateToastToError = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: 'error',
    isLoading: false,
    autoClose: 4000,
    icon: '❌',
  });
}; 