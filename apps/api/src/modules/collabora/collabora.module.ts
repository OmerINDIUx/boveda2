import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../storage/storage.module';
import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { CollaboraController } from './collabora.controller';
import { CollaboraService } from './collabora.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentRecord, DocumentVersion, User]),
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'change-me',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [CollaboraController],
  providers: [CollaboraService],
})
export class CollaboraModule {}
