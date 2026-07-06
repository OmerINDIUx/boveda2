'use client';

import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { apiPost } from '../../lib/api';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      const result = await apiPost<LoginResponse>('/auth/login', { email, password });
      window.localStorage.setItem('holocron_token', result.accessToken);
      window.localStorage.setItem('holocron_user', JSON.stringify(result.user));
      window.location.href = '/dashboard';
    } catch {
      setError('No fue posible iniciar sesion.');
    }
  }

  return (
    <section className="grid">
      <div className="card span-6">
        <LockKeyhole color="var(--primary)" size={34} />
        <h1>Acceso a Holocron</h1>
        <form>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label>Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
          <button className="button" type="button" onClick={submit}>
            Entrar
          </button>
        </form>
      </div>
    </section>
  );
}
