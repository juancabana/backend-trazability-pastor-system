import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './domain/entities/audit-log.entity.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository.js';
import { AuditLogBuffer } from './infrastructure/audit-log.buffer.js';
import { AsyncAuditInterceptor } from './application/interceptors/async-audit.interceptor.js';
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs.use-case.js';
import { AuditLogController } from './presentation/audit-log.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogBuffer,
    AsyncAuditInterceptor,
    GetAuditLogsUseCase,
  ],
  exports: [AuditLogBuffer],
})
export class AuditLogModule {}
