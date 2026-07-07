'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import { Button } from './button';
import styles from '../../styles/confirm-dialog.module.css';

type ConfirmVariant = 'danger' | 'warning' | 'info';

type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  icon?: ReactNode;
};

const variantIcons: Record<ConfirmVariant, ReactNode> = {
  danger: <OctagonAlert size={32} />,
  warning: <AlertTriangle size={32} />,
  info: <Info size={32} />,
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) onCancel();
        if (e.key === 'Tab') {
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [open, onCancel, loading]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={loading ? undefined : onCancel}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[variant]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.icon}>{icon ?? variantIcons[variant]}</div>
          <h2 className={styles.title} id="confirm-title">
            {title}
          </h2>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'info' ? 'primary' : 'danger'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
