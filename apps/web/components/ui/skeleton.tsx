import styles from '../../styles/skeleton.module.css';

type SkeletonVariant = 'text' | 'title' | 'card' | 'circle' | 'table' | 'chart' | 'avatar';

type SkeletonProps = {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
  count?: number;
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const baseClass = [styles.skeleton, styles[variant], className].filter(Boolean).join(' ');

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={baseClass}
          style={{
            width: width || undefined,
            height: height || undefined,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.title} />
      <div className={styles.text} />
      <div className={styles.text} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.table} />
      ))}
    </div>
  );
}
