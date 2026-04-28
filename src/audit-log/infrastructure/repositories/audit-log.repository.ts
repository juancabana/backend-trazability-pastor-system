import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository.js';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity.js';

export interface AuditLogFilters {
  userId?: string;
  eventType?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {
    super(auditRepo);
  }

  /** Single INSERT statement for N rows — one DB round-trip */
  async insertBatch(entries: Partial<AuditLogEntity>[]): Promise<void> {
    if (entries.length === 0) return;
    await this.auditRepo.insert(
      entries as Parameters<typeof this.auditRepo.insert>[0],
    );
  }

  async findPaginated(
    filters: AuditLogFilters,
    page: number,
    limit: number,
  ): Promise<[AuditLogEntity[], number]> {
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.userId) {
      qb.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    if (filters.eventType) {
      qb.andWhere('log.eventType = :eventType', { eventType: filters.eventType });
    }
    if (filters.from) {
      qb.andWhere('log.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('log.createdAt <= :to', { to: filters.to });
    }

    return qb.getManyAndCount();
  }
}
