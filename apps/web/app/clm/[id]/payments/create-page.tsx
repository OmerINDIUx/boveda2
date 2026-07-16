'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiPost } from '../../../../lib/api';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function PaymentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    currency: 'MXN',
    paymentDate: '',
    dueDate: '',
    status: 'pending',
    invoiceNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!contractId || !form.concept.trim() || !form.amount) {
      setError('Completa concepto y monto.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/payments`, form, getToken());
      router.push(`/clm/${contractId}/payments`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo pago</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}/payments`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="quick-filters-grid">
          <div className="field">
            <label>Concepto</label>
            <input
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Monto</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="field">
            <label>Fecha de pago</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Fecha de vencimiento</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Factura</label>
            <input
              value={form.invoiceNumber}
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Notas</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </article>
    </section>
  );
}
