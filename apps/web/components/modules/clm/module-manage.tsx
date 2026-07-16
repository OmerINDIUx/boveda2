'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import type { ContractDetail } from './types';
import { buildFallbackDetail, formatCurrency, formatDate } from './utils';

type ModuleKey =
  | 'obligations'
  | 'milestones'
  | 'attachments'
  | 'comments'
  | 'versions'
  | 'payments'
  | 'signatures'
  | 'negotiations'
  | 'amendments';

const moduleMeta: Record<
  ModuleKey,
  {
    title: string;
    createLabel: string;
    createHref: (id: string) => string;
    empty: string;
  }
> = {
  obligations: {
    title: 'Obligaciones',
    createLabel: 'Nueva obligacion',
    createHref: (id) => `/clm/${id}/obligations/new`,
    empty: 'Aun no hay obligaciones registradas.',
  },
  milestones: {
    title: 'Hitos',
    createLabel: 'Nuevo hito',
    createHref: (id) => `/clm/${id}/milestones/new`,
    empty: 'Aun no hay hitos registrados.',
  },
  attachments: {
    title: 'Anexos',
    createLabel: 'Subir anexo',
    createHref: (id) => `/clm/${id}/attachments/new`,
    empty: 'Aun no hay anexos registrados.',
  },
  comments: {
    title: 'Comentarios',
    createLabel: 'Nuevo comentario',
    createHref: (id) => `/clm/${id}/comments/new`,
    empty: 'Aun no hay comentarios registrados.',
  },
  versions: {
    title: 'Versiones',
    createLabel: 'Subir version',
    createHref: (id) => `/clm/${id}/versions/new`,
    empty: 'Aun no hay versiones registradas.',
  },
  payments: {
    title: 'Pagos',
    createLabel: 'Nuevo pago',
    createHref: (id) => `/clm/${id}/payments/new`,
    empty: 'Aun no hay pagos registrados.',
  },
  signatures: {
    title: 'Firmas',
    createLabel: 'Enviar a firma',
    createHref: (id) => `/clm/${id}/signatures/new`,
    empty: 'Aun no hay solicitudes de firma registradas.',
  },
  negotiations: {
    title: 'Negociacion',
    createLabel: 'Nueva ronda',
    createHref: (id) => `/clm/${id}/negotiations/new`,
    empty: 'Aun no hay rondas de negociacion registradas.',
  },
  amendments: {
    title: 'Enmiendas',
    createLabel: 'Nueva enmienda',
    createHref: (id) => `/clm/${id}/amendments/new`,
    empty: 'Aun no hay enmiendas registradas.',
  },
};

function renderModuleItems(module: ModuleKey, detail: ContractDetail) {
  switch (module) {
    case 'obligations':
      return detail.obligations.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.description}</strong>
          <small>
            {item.responsibleUser?.name ?? 'Sin responsable'} · {formatDate(item.commitmentDate)} ·{' '}
            {normalizeLabel(item.status)}
          </small>
          <span>{item.comments ?? 'Sin comentarios.'}</span>
        </div>
      ));
    case 'milestones':
      return detail.milestones.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.name}</strong>
          <small>
            {item.responsibleUser?.name ?? 'Sin responsable'} · {formatDate(item.milestoneDate)} ·{' '}
            {normalizeLabel(item.status)}
          </small>
          <span>{item.notes ?? 'Sin notas.'}</span>
        </div>
      ));
    case 'attachments':
      return detail.attachments.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.name}</strong>
          <small>{item.fileName}</small>
          <span>{item.notes ?? 'Sin notas.'}</span>
        </div>
      ));
    case 'comments':
      return detail.comments.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.author?.name ?? 'Usuario'}</strong>
          <small>{new Date(item.createdAt).toLocaleString()}</small>
          <span>{item.body}</span>
        </div>
      ));
    case 'versions':
      return detail.versions.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.versionLabel}</strong>
          <small>{item.fileName}</small>
          <span>{item.changeSummary ?? 'Sin resumen de cambios.'}</span>
        </div>
      ));
    case 'payments':
      return detail.payments.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.concept}</strong>
          <small>
            {formatCurrency(item.amount, item.currency)} · {normalizeLabel(item.status)}
          </small>
          <span>
            {item.invoiceNumber ? `Factura: ${item.invoiceNumber} · ` : ''}
            Vence: {formatDate(item.dueDate)}
          </span>
        </div>
      ));
    case 'signatures':
      return detail.signatures.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{normalizeLabel(item.provider)}</strong>
          <small>
            {normalizeLabel(item.status)} ·{' '}
            {item.signedAt ? `Firmado: ${formatDate(item.signedAt)}` : 'Pendiente'}
          </small>
          <span>
            {item.createdBy?.name
              ? `Creado por ${item.createdBy.name}`
              : 'Sin responsable visible.'}
          </span>
        </div>
      ));
    case 'negotiations':
      return detail.negotiations.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>{item.partyName}</strong>
          <small>
            {normalizeLabel(item.status)} · {formatDate(item.createdAt)}
          </small>
          <span>{item.proposedText ?? item.originalText ?? 'Sin texto registrado.'}</span>
        </div>
      ));
    case 'amendments':
      return detail.amendments.map((item) => (
        <div key={item.id} className="simple-document-item">
          <strong>
            {item.amendmentNumber} · {item.title}
          </strong>
          <small>
            {formatDate(item.amendmentDate)} · {normalizeLabel(item.status)}
          </small>
          <span>{item.description ?? 'Sin descripcion.'}</span>
        </div>
      ));
  }
}

function getCount(module: ModuleKey, detail: ContractDetail) {
  switch (module) {
    case 'obligations':
      return detail.obligations.length;
    case 'milestones':
      return detail.milestones.length;
    case 'attachments':
      return detail.attachments.length;
    case 'comments':
      return detail.comments.length;
    case 'versions':
      return detail.versions.length;
    case 'payments':
      return detail.payments.length;
    case 'signatures':
      return detail.signatures.length;
    case 'negotiations':
      return detail.negotiations.length;
    case 'amendments':
      return detail.amendments.length;
  }
}

export function ContractModuleManagePage({ module }: { module: ModuleKey }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const result = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`);
        if (!active) return;
        setDetail(result);
      } catch {
        if (!active) return;
        const fallback = buildFallbackDetail(contractId);
        if (fallback) {
          setDetail(fallback);
          setMessage('Vista de respaldo sin conexión a la API.');
        } else {
          setMessage('No se pudo cargar el módulo.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  const meta = moduleMeta[module];
  const items = useMemo(() => (detail ? renderModuleItems(module, detail) : []), [detail, module]);
  const count = detail ? getCount(module, detail) : 0;

  if (!detail && loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando módulo...</p>
        </article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{message || 'No se encontró el contrato.'}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{meta.title}</h1>
          <p className="muted">Gestión del módulo dentro del contrato {detail.name}.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
          <Link className="button" href={meta.createHref(detail.id)}>
            {meta.createLabel}
          </Link>
        </div>
      </div>
      {message ? <article className="card muted">{message}</article> : null}
      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-4 project-metric info">
          <span className="muted">Registros</span>
          <strong>{count}</strong>
        </article>
      </div>
      <article className="card">
        <div className="simple-document-list">
          {items}
          {!items.length ? <div className="simple-document-item">{meta.empty}</div> : null}
        </div>
      </article>
    </section>
  );
}
