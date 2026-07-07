import type { HTMLAttributes, ReactNode } from 'react';
import styles from '../../styles/card.module.css';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  header?: ReactNode;
  footer?: ReactNode;
};

export function Card({
  hoverable = false,
  clickable = false,
  padding = 'md',
  header,
  footer,
  children,
  className = '',
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    hoverable ? styles.cardHoverable : '',
    clickable ? styles.cardClickable : '',
    padding !== 'md'
      ? styles[`cardPadding${padding.charAt(0).toUpperCase() + padding.slice(1)}`]
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {header && <div className={styles.cardHeader}>{header}</div>}
      {children && <div className={styles.cardBody}>{children}</div>}
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
}
