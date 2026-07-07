import type { ReactNode } from 'react';
import styles from '../../styles/badge.module.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md' | 'lg';

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  const classes = [styles.badge, styles[variant], size !== 'md' ? styles[size] : '', className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
