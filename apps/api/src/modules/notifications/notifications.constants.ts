export const NOTIFICATION_TYPES = [
  'document_expiring_soon',
  'document_expired',
  'approval_assigned',
  'approval_stopped',
  'rfi_assigned',
  'rfi_overdue',
  'contract_expiring_soon',
  'contract_expired',
  'contract_obligation_pending',
  'document_new_version',
  'document_approval_result'
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_DEFAULTS: Record<NotificationType, { inApp: boolean; email: boolean; label: string }> = {
  document_expiring_soon: { inApp: true, email: true, label: 'Documento próximo a vencer' },
  document_expired: { inApp: true, email: true, label: 'Documento vencido' },
  approval_assigned: { inApp: true, email: true, label: 'Flujo de aprobación asignado' },
  approval_stopped: { inApp: true, email: true, label: 'Flujo detenido' },
  rfi_assigned: { inApp: true, email: true, label: 'RFI asignado' },
  rfi_overdue: { inApp: true, email: true, label: 'RFI vencido' },
  contract_expiring_soon: { inApp: true, email: true, label: 'Contrato próximo a vencer' },
  contract_expired: { inApp: true, email: true, label: 'Contrato vencido' },
  contract_obligation_pending: { inApp: true, email: true, label: 'Obligación contractual pendiente' },
  document_new_version: { inApp: true, email: true, label: 'Nueva versión de documento' },
  document_approval_result: { inApp: true, email: true, label: 'Documento aprobado o rechazado' }
};
