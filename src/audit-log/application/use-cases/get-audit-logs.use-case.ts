import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository.js';
import { AuditLogQueryDto } from '../dtos/audit-log-query.dto.js';
import {
  AuditLogResponseDto,
  PaginatedAuditLogResponseDto,
} from '../dtos/audit-log.response.dto.js';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly repo: AuditLogRepository) {}

  async execute(query: AuditLogQueryDto): Promise<PaginatedAuditLogResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const [entities, total] = await this.repo.findPaginated(
      {
        userId: query.userId,
        eventType: query.eventType,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      page,
      limit,
    );

    const result = new PaginatedAuditLogResponseDto();
    result.data = entities.map(AuditLogResponseDto.fromEntity);
    result.total = total;
    result.page = page;
    result.limit = limit;
    result.totalPages = Math.ceil(total / limit);
    return result;
  }
}
