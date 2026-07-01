'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  open?: boolean;
}

// The toast is an inverse-surface pill: bg-text is dark in light theme / light in
// dark theme, so its label uses text-surface (white in light / dark in dark) to
// stay legible in both — on-brand is now a dark honey-ink meant for gold fills only.
const typeClasses: Record<ToastType, string> = {
  success: 'bg-text text-surface before:content-["✓"] before:text-success before:mr-2',
  error: 'bg-text text-surface before:content-["✕"] before:text-danger before:mr-2',
  info: 'bg-text text-surface',
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  open = true,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    setIsVisible(open);
    if (!open) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-4 right-4 px-4 py-3 rounded-md text-body-sm
        shadow-pop transition-opacity duration-300
        ${typeClasses[type]}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {message}
    </div>
  );
}
