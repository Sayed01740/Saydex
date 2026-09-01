import React from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useProtocol();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[var(--info)] shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="pointer-events-auto bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] rounded-xl p-3.5 shadow-xl flex items-start gap-3 backdrop-blur-md"
          >
            <div className="mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
              {toast.actionUrl && (
                <a
                  href={toast.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline mt-1.5"
                >
                  <span>{toast.actionText || 'View details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
