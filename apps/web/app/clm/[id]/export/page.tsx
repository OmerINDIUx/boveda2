'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { apiGet } from '../../../../lib/api';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

type ContractExportItem = {
  id: string;
};

type ContractExportObligation = ContractExportItem & {
  description: string;
  status: string;
};

type ContractExportMilestone = ContractExportItem & {
  name: string;
  milestoneDate: string;
  status: string;
};

type ContractExportVersion = ContractExportItem & {
  versionLabel: string;
  fileName: string;
};

type ContractExportPayment = ContractExportItem & {
  concept: string;
  amount: number;
  currency: string;
  status: string;
};

type ContractExportData = {
  contract?: {
    name?: string;
    status?: string;
    supplierName?: string;
    clientName?: string;
    contractType?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    currency?: string;
  };
  obligations?: ContractExportObligation[];
  milestones?: ContractExportMilestone[];
  versions?: ContractExportVersion[];
  payments?: ContractExportPayment[];
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [data, setData] = useState<ContractExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contractId) return;
    async function load() {
      try {
        const d = await apiGet<ContractExportData>(
          `/clm/contracts/${contractId}/export`,
          getToken()
        );
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [contractId]);

  async function printPDF() {
    if (!ref.current) return;
    try {
      window.print();
    } catch {
      alert('Error al generar PDF.');
    }
  }

  if (loading)
    return (
      <section className="projects-workspace">
        <p className="muted">Cargando...</p>
      </section>
    );

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Exportar contrato</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Volver
          </Link>
          <button className="button" type="button" onClick={printPDF}>
            Guardar PDF
          </button>
        </div>
      </div>
      <div ref={ref} style={{ padding: 20, background: 'white', color: '#000' }}>
        <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8 }}>
          {data?.contract?.name ?? 'Contrato'}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <tbody>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Estado</td>
              <td style={{ padding: 4 }}>{data?.contract?.status}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Proveedor</td>
              <td style={{ padding: 4 }}>{data?.contract?.supplierName}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Cliente</td>
              <td style={{ padding: 4 }}>{data?.contract?.clientName}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Tipo</td>
              <td style={{ padding: 4 }}>{data?.contract?.contractType}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Inicio</td>
              <td style={{ padding: 4 }}>{data?.contract?.startDate}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Vencimiento</td>
              <td style={{ padding: 4 }}>{data?.contract?.endDate}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, fontWeight: 700 }}>Monto</td>
              <td style={{ padding: 4 }}>
                {data?.contract?.amount} {data?.contract?.currency}
              </td>
            </tr>
          </tbody>
        </table>
        <h3 style={{ marginTop: 16 }}>Obligaciones</h3>
        <ul>
          {data?.obligations?.map((o) => (
            <li key={o.id}>
              {o.description} ({o.status})
            </li>
          ))}
        </ul>
        <h3>Hitos</h3>
        <ul>
          {data?.milestones?.map((m) => (
            <li key={m.id}>
              {m.name} - {m.milestoneDate} ({m.status})
            </li>
          ))}
        </ul>
        <h3>Versiones</h3>
        <ul>
          {data?.versions?.map((v) => (
            <li key={v.id}>
              {v.versionLabel} - {v.fileName}
            </li>
          ))}
        </ul>
        <h3>Pagos</h3>
        <ul>
          {data?.payments?.map((p) => (
            <li key={p.id}>
              {p.concept}: {p.amount} {p.currency} ({p.status})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
