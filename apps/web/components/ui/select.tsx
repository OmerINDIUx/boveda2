'use client';

import { type SelectHTMLAttributes, forwardRef } from 'react';
import styles from '../../styles/form.module.css';

type SelectOption = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...rest }, ref) => {
    const selectClasses = [styles.input, styles.select, error ? styles.inputError : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.field}>
        {label && <label htmlFor={rest.id}>{label}</label>}
        <select ref={ref} className={selectClasses} id={rest.id} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
