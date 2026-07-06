'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.NOTIFICATION_DEFAULTS = exports.NOTIFICATION_TYPES = void 0;
exports.NOTIFICATION_TYPES = [
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
  'document_approval_result',
];
exports.NOTIFICATION_DEFAULTS = {
  document_expiring_soon: { inApp: true, email: true, label: 'Documento próximo a vencer' },
  document_expired: { inApp: true, email: true, label: 'Documento vencido' },
  approval_assigned: { inApp: true, email: true, label: 'Flujo de aprobación asignado' },
  approval_stopped: { inApp: true, email: true, label: 'Flujo detenido' },
  rfi_assigned: { inApp: true, email: true, label: 'RFI asignado' },
  rfi_overdue: { inApp: true, email: true, label: 'RFI vencido' },
  contract_expiring_soon: { inApp: true, email: true, label: 'Contrato próximo a vencer' },
  contract_expired: { inApp: true, email: true, label: 'Contrato vencido' },
  contract_obligation_pending: {
    inApp: true,
    email: true,
    label: 'Obligación contractual pendiente',
  },
  document_new_version: { inApp: true, email: true, label: 'Nueva versión de documento' },
  document_approval_result: { inApp: true, email: true, label: 'Documento aprobado o rechazado' },
};
//# sourceMappingURL=notifications.constants.js.map
