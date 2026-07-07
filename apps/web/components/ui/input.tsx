'use client';

import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from '../../styles/form.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helpText?: string;
  success?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, success, className = '', type, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputClasses = [
      styles.input,
      type === 'textarea' ? styles.textarea : '',
      error ? styles.inputError : '',
      success ? styles.inputSuccess : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={styles.field}>
        {label && <label htmlFor={rest.id}>{label}</label>}
        <div style={{ position: 'relative' }}>
          <input ref={ref} className={inputClasses} type={actualType} id={rest.id} {...rest} />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
        {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
