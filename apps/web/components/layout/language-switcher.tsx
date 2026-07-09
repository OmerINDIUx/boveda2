'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { apiPatch } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    window.localStorage.setItem('holocron_lang', lang);
    const token = getSessionToken();
    if (token) {
      await apiPatch('/users/me/language', { language: lang }, token).catch(() => {});
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <Globe size={14} style={{ color: 'var(--text-tertiary)' }} />
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-xs)',
          cursor: 'pointer',
          outline: 'none',
          padding: '2px 4px',
          borderRadius: 'var(--radius-sm)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-strong)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <option value="es">{t('user.language.es')}</option>
        <option value="en">{t('user.language.en')}</option>
      </select>
    </div>
  );
}
