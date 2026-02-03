import { useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UseToastReturn {
  toasts: Toast[]
  toast: (message: string, type?: Toast['type']) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

export function useToast(autoDismissMs = 5000): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-dismiss after specified time
    if (autoDismissMs > 0) {
      setTimeout(() => {
        dismiss(id)
      }, autoDismissMs)
    }
  }, [autoDismissMs, dismiss])

  const toast = useCallback((message: string, type?: Toast['type']) => {
    addToast(message, type)
  }, [addToast])

  const success = useCallback((message: string) => {
    addToast(message, 'success')
  }, [addToast])

  const error = useCallback((message: string) => {
    addToast(message, 'error')
  }, [addToast])

  const info = useCallback((message: string) => {
    addToast(message, 'info')
  }, [addToast])

  return {
    toasts,
    toast,
    success,
    error,
    info,
    dismiss,
    dismissAll,
  }
}

export type { Toast }




