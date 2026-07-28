'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiPost } from '../../lib/api';
import { setSession } from '../../lib/auth';
import { brand } from '../../lib/brand';
import { Button } from '../../components/ui/button';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    language?: string;
    roles: string[];
    permissions: string[];
  };
};

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function getFriendlyLoginError(error: unknown) {
    if (!(error instanceof Error)) {
      return 'No fue posible iniciar sesión. Intenta nuevamente.';
    }

    const message = error.message.toLowerCase();
    if (message.includes('credenciales invalidas')) {
      return 'El correo o la contraseña no coinciden.';
    }
    if (message.includes('usuario inactivo')) {
      return 'Tu usuario está inactivo. Necesita reactivarse en administración.';
    }
    if (message.includes('aborterror')) {
      return 'La solicitud tardó demasiado. Revisa la conexión con la API.';
    }
    if (message.includes('failed to fetch')) {
      return 'La aplicación no logró comunicarse con la API. Revisa que ambos servicios estén encendidos.';
    }

    return 'No fue posible iniciar sesión por un problema de comunicación o sesión. Intenta nuevamente.';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiPost<LoginResponse>('/auth/login', { email, password });
      setSession(result.accessToken, result.user);
      window.location.href = '/dashboard';
    } catch (error) {
      setError(getFriendlyLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f7f8fb',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Left Panel - Branding */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0066f9 0%, #0057d6 52%, #003d99 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '3rem',
        }}
      >
        {/* Abstract decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.04) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.04) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Decorative dots grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '5rem',
              height: '5rem',
              borderRadius: '1.5rem',
              background: '#ffffff',
              backdropFilter: 'blur(12px)',
              marginBottom: '1.5rem',
              boxShadow: '0 12px 34px rgba(0,37,94,0.24)',
              overflow: 'hidden',
            }}
          >
            <Image src={brand.logo} alt={brand.companyName} width={64} height={64} priority />
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            {t('app.name')}
          </h1>
          <div
            style={{
              margin: '0 auto 0.75rem',
              color: '#dbeafe',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Tecnología Holocom
          </div>
          <p
            style={{
              fontSize: '1.125rem',
              opacity: 0.8,
              margin: '0 0 2rem',
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            {t('app.tagline')}
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 400,
            }}
          >
            {[t('documents.title'), t('nav.approvals'), t('nav.ai_query'), t('nav.contracts')].map(
              (feat) => (
                <span
                  key={feat}
                  style={{
                    padding: '0.375rem 1rem',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.1)',
                    fontSize: '0.8125rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {feat}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            animation: 'fadeIn 400ms ease',
          }}
        >
          {/* Welcome */}
          <div style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 0 0.375rem',
                color: 'var(--text)',
              }}
            >
              {t('auth.login.title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {t('auth.login.email')}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                {t('auth.login.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '2.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 0.75rem 0 2.5rem',
                    background: 'var(--surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 160ms ease, box-shadow 160ms ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 102, 249, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                {t('auth.login.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '2.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 2.75rem 0 2.5rem',
                    background: 'var(--surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 160ms ease, box-shadow 160ms ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 102, 249, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
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
                    color: 'var(--text-tertiary)',
                    padding: '0.375rem',
                    display: 'flex',
                    borderRadius: '6px',
                    transition: 'color 120ms ease, background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--surface-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                Recordar sesión
              </label>
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-danger-light)',
                  border: '1px solid var(--color-danger-lighter)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: '0.8125rem',
                  animation: 'fadeIn 200ms ease',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" loading={loading} size="lg" style={{ width: '100%' }}>
              {t('auth.login.button')}
            </Button>
          </form>

          {/* Footer */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '2rem',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('app.name')} v0.1.0 · {t('app.tagline')}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          div[style*="flex"] > div:first-child { display: none !important; }
          div[style*="flex"] > div:last-child { flex: 1 !important; }
        }
      `}</style>
    </div>
  );
}
