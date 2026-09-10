import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider'
    );
  }

  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  // Add toast
  const addToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id =
        Date.now() + Math.random();

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      // Automatically remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, duration = 3000) => {
      return addToast(
        message,
        'success',
        duration
      );
    },
    [addToast]
  );

  const error = useCallback(
    (message, duration = 3000) => {
      return addToast(
        message,
        'error',
        duration
      );
    },
    [addToast]
  );

  const warning = useCallback(
    (message, duration = 3000) => {
      return addToast(
        message,
        'warning',
        duration
      );
    },
    [addToast]
  );

  const info = useCallback(
    (message, duration = 3000) => {
      return addToast(
        message,
        'info',
        duration
      );
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;