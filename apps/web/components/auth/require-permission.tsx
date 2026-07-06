'use client';

import { ShieldAlert } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { hasPermission } from '../../lib/auth';

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(hasPermission(permission));
  }, [permission]);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div className="card">
        <ShieldAlert color="var(--danger)" size={28} />
        <h1>Acceso bloqueado</h1>
        <p className="muted">Tu usuario no tiene permiso para abrir esta seccion.</p>
      </div>
    );
  }

  return <>{children}</>;
}
