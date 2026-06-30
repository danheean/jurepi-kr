'use client';

import { ReactNode, useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-surface rounded-xxl shadow-pop max-w-[28rem] w-full p-6 max-h-[90vh] overflow-auto">
          {title && (
            <h2 className="font-headline text-text mb-4">{title}</h2>
          )}
          <div className="font-body text-text mb-6">{children}</div>
          {footer ? (
            footer
          ) : (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
