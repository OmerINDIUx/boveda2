'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from '../../styles/button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {iconLeft && !loading && <span className={styles.iconLeft}>{iconLeft}</span>}
      {children}
      {iconRight && !loading && <span className={styles.iconRight}>{iconRight}</span>}
    </button>
  );
}
