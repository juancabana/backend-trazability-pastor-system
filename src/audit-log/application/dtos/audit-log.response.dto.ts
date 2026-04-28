import { ApiProperty } from '@nestjs/swagger';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity.js';

export class AuditLogResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() userName: string;
  @ApiProperty() userRole: string;
  @ApiProperty() httpMethod: string;
  @ApiProperty() endpoint: string;
  @ApiProperty() ipAddress: string;
  @ApiProperty() statusCode: number;
  @ApiProperty() eventType: string;
  @ApiProperty() createdAt: Date;

  static fromEntity(e: AuditLogEntity): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = e.id;
    dto.userId = e.userId;
    dto.userName = e.userName;
    dto.userRole = e.userRole;
    dto.httpMethod = e.httpMethod;
    dto.endpoint = e.endpoint;
    dto.ipAddress = e.ipAddress;
    dto.statusCode = e.statusCode;
    dto.eventType = e.eventType;
    dto.createdAt = e.createdAt;
    return dto;
  }
}

export class PaginatedAuditLogResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] }) data: AuditLogResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
