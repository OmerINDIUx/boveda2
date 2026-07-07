'use client';

import { type TextareaHTMLAttributes, forwardRef } from 'react';
import styles from '../../styles/form.module.css';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helpText?: string;
  showCount?: boolean;
  maxLength?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, showCount, maxLength, className = '', value, ...rest }, ref) => {
    const textareaClasses = [
      styles.input,
      styles.textarea,
      error ? styles.inputError : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={styles.field}>
        {label && <label htmlFor={rest.id}>{label}</label>}
        <textarea
          ref={ref}
          className={textareaClasses}
          id={rest.id}
          maxLength={maxLength}
          value={value}
          {...rest}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          {error ? (
            <span className={styles.errorMessage}>{error}</span>
          ) : helpText ? (
            <span className={styles.helpText}>{helpText}</span>
          ) : (
            <span />
          )}
          {showCount && maxLength && (
            <span>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
