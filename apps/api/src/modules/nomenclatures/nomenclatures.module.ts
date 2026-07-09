import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NomenclatureRule } from './nomenclature-rule.entity';
import { NomenclatureCounter } from './nomenclature-counter.entity';
import { NomenclaturesController } from './nomenclatures.controller';
import { NomenclaturesService } from './nomenclatures.service';

@Module({
  imports: [TypeOrmModule.forFeature([NomenclatureRule, NomenclatureCounter])],
  controllers: [NomenclaturesController],
  providers: [NomenclaturesService],
  exports: [NomenclaturesService],
})
export class NomenclaturesModule {}
