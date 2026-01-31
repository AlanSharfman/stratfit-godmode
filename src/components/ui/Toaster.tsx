import React from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToasterProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      iconColor: 'text-red-400',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
  }

  const c = config[toast.type]

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${c.bg} border ${c.border} backdrop-blur-xl shadow-lg animate-slide-in-right`}
    >
      <span className={c.iconColor}>{c.icon}</span>
      <span className="text-white text-sm">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Export types for external use
export type { Toast, ToasterProps }





