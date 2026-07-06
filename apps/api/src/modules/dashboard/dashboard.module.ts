import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Contract } from '../clm/contract.entity';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { Rfi } from '../rfis/rfi.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProjectsModule, TypeOrmModule.forFeature([Project, DocumentRecord, ApprovalRequest, Rfi, Contract, ContractObligation])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
