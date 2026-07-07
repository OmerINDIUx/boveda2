import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../contract.entity';
import { ContractObligation } from '../contract-obligation.entity';
import { ContractPayment } from '../entities/contract-payment.entity';
import { ReportRequest, ReportResult, ReportRow } from './report-types';

@Injectable()
export class ReportGeneratorService {
  constructor(
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractObligation)
    private readonly obligations: Repository<ContractObligation>,
    @InjectRepository(ContractPayment) private readonly payments: Repository<ContractPayment>
  ) {}

  async generate(request: ReportRequest, projectIds: string[]): Promise<ReportResult> {
    switch (request.type) {
      case 'contracts_by_status':
        return this.contractsByStatus(projectIds);
      case 'contracts_by_type':
        return this.contractsByType(projectIds);
      case 'expiration_forecast':
        return this.expirationForecast(projectIds, request.dateFrom, request.dateTo);
      case 'obligations_summary':
        return this.obligationsSummary(projectIds);
      case 'payments_summary':
        return this.paymentsSummary(projectIds);
      case 'financial_overview':
        return this.financialOverview(projectIds);
      default:
        return {
          type: request.type,
          title: 'Reporte no disponible',
          generatedAt: new Date().toISOString(),
          rows: [],
          total: 0,
        };
    }
  }

  private async contractsByStatus(projectIds: string[]): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const counts = new Map<string, number>();
    for (const c of contracts) {
      counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    }
    const labels: Record<string, string> = {
      draft: 'Borrador',
      in_review: 'En revisión',
      approved: 'Aprobado',
      active: 'Vigente',
      expiring_soon: 'Por vencer',
      expired: 'Vencido',
      renewed: 'Renovado',
      closed: 'Cerrado',
    };
    const rows: ReportRow[] = [...counts.entries()].map(([key, value]) => ({
      label: labels[key] ?? key,
      value,
    }));
    return {
      type: 'contracts_by_status',
      title: 'Contratos por estado',
      generatedAt: new Date().toISOString(),
      rows,
      total: contracts.length,
    };
  }

  private async contractsByType(projectIds: string[]): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const counts = new Map<string, number>();
    for (const c of contracts) {
      const key = c.contractType ?? 'Sin tipo';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const rows: ReportRow[] = [...counts.entries()].map(([label, value]) => ({ label, value }));
    return {
      type: 'contracts_by_type',
      title: 'Contratos por tipo',
      generatedAt: new Date().toISOString(),
      rows,
      total: contracts.length,
    };
  }

  private async expirationForecast(
    projectIds: string[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const filtered = contracts.filter((c) => {
      if (!c.endDate) return false;
      if (dateFrom && c.endDate < dateFrom) return false;
      if (dateTo && c.endDate > dateTo) return false;
      return true;
    });
    const rows: ReportRow[] = filtered.map((c) => ({
      label: c.name,
      value: 1,
      metadata: { endDate: c.endDate, status: c.status, supplier: c.supplierName },
    }));
    return {
      type: 'expiration_forecast',
      title: 'Pronóstico de vencimientos',
      generatedAt: new Date().toISOString(),
      rows,
      total: filtered.length,
    };
  }

  private async obligationsSummary(projectIds: string[]): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const contractIds = contracts.map((c) => c.id);
    if (!contractIds.length)
      return {
        type: 'obligations_summary',
        title: 'Resumen de obligaciones',
        generatedAt: new Date().toISOString(),
        rows: [],
        total: 0,
      };
    const obligations = await this.obligations.find({
      where: contractIds.map((id) => ({ contractId: id })),
    });
    const counts = new Map<string, number>();
    for (const o of obligations) {
      counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    }
    const labels: Record<string, string> = {
      pending: 'Pendientes',
      in_progress: 'En progreso',
      completed: 'Completadas',
      waived: 'Renunciadas',
      overdue: 'Vencidas',
    };
    const rows: ReportRow[] = [...counts.entries()].map(([key, value]) => ({
      label: labels[key] ?? key,
      value,
    }));
    return {
      type: 'obligations_summary',
      title: 'Resumen de obligaciones',
      generatedAt: new Date().toISOString(),
      rows,
      total: obligations.length,
    };
  }

  private async paymentsSummary(projectIds: string[]): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const contractIds = contracts.map((c) => c.id);
    if (!contractIds.length)
      return {
        type: 'payments_summary',
        title: 'Resumen de pagos',
        generatedAt: new Date().toISOString(),
        rows: [],
        total: 0,
      };
    const payments = await this.payments.find({
      where: contractIds.map((id) => ({ contractId: id })),
    });
    const counts = new Map<string, number>();
    let totalAmount = 0;
    for (const p of payments) {
      counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
      totalAmount += Number(p.amount);
    }
    const labels: Record<string, string> = {
      pending: 'Pendientes',
      paid: 'Pagados',
      overdue: 'Vencidos',
      cancelled: 'Cancelados',
    };
    const rows: ReportRow[] = [...counts.entries()].map(([key, value]) => ({
      label: labels[key] ?? key,
      value,
    }));
    rows.push({ label: 'Monto total', value: totalAmount });
    return {
      type: 'payments_summary',
      title: 'Resumen de pagos',
      generatedAt: new Date().toISOString(),
      rows,
      total: payments.length,
    };
  }

  private async financialOverview(projectIds: string[]): Promise<ReportResult> {
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    let totalContracted = 0;
    let countWithAmount = 0;
    for (const c of contracts) {
      if (c.amount) {
        totalContracted += Number(c.amount);
        countWithAmount++;
      }
    }
    const payments = countWithAmount
      ? await this.payments.find({ where: contracts.map((c) => ({ contractId: c.id })) })
      : [];
    let totalPaid = 0;
    for (const p of payments) {
      if (p.status === 'paid') totalPaid += Number(p.amount);
    }
    return {
      type: 'financial_overview',
      title: 'Panorama financiero',
      generatedAt: new Date().toISOString(),
      rows: [
        { label: 'Total contratado', value: totalContracted },
        { label: 'Total pagado', value: totalPaid },
        { label: 'Por pagar', value: totalContracted - totalPaid },
        { label: 'Contratos con monto', value: countWithAmount },
      ],
      total: countWithAmount,
    };
  }
}
