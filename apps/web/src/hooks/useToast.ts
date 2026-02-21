/**
 * useToast — Toast notification queue with auto-dismiss.
 * Hover-pause behavior is handled in the Toast component itself.
 */

import { useState, useCallback, useRef } from 'react';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface UseToastReturn {
  toasts: Toast[];
  addToast: (message: string, variant: Toast['variant']) => void;
  removeToast: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: Toast['variant']) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

      setToasts((prev) => [...prev, { id, message, variant }]);

      const timer = setTimeout(() => {
        removeToast(id);
      }, AUTO_DISMISS_MS);

      timers.current.set(id, timer);
    },
    [removeToast],
  );

  return { toasts, addToast, removeToast };
}
