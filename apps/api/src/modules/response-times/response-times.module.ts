import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaDefinition } from './sla-definition.entity';
import { ResponseTimeRecord } from './response-time-record.entity';
import { EmailWorkflowAction } from './email-workflow-action.entity';
import { ResponseTimesController } from './response-times.controller';
import { ResponseTimesService } from './response-times.service';

@Module({
  imports: [TypeOrmModule.forFeature([SlaDefinition, ResponseTimeRecord, EmailWorkflowAction])],
  controllers: [ResponseTimesController],
  providers: [ResponseTimesService],
  exports: [ResponseTimesService],
})
export class ResponseTimesModule {}
