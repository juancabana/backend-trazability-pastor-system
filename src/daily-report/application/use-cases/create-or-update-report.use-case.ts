import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { CreateDailyReportDto } from '../dtos/create-daily-report.dto.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';
import { isDateEditable } from '../../../common/utils/period.util.js';

@Injectable()
export class CreateOrUpdateReportUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    pastorId: string,
    associationId: string,
    dto: CreateDailyReportDto,
  ): Promise<DailyReportResponseDto> {
    const association = await this.associationRepo.findById(associationId);
    if (!association) {
      throw new BadRequestException('Asociacion no encontrada');
    }

    const reportDate = new Date(dto.date + 'T00:00:00');
    if (!isDateEditable(reportDate, association.reportDeadlineDay)) {
      throw new ForbiddenException(
        'No se puede editar un reporte fuera del periodo actual',
      );
    }

    const existing = await this.reportRepo.findByPastorAndDate(
      pastorId,
      dto.date,
    );

    let report;
    if (existing) {
      report = await this.reportRepo.update(existing.id, {
        activities: dto.activities,
        observations: dto.observations ?? '',
      });
    } else {
      report = await this.reportRepo.save({
        pastorId,
        date: dto.date,
        activities: dto.activities,
        observations: dto.observations ?? '',
      });
    }

    return {
      id: report!.id,
      pastorId: report!.pastorId,
      date: report!.date,
      activities: report!.activities,
      observations: report!.observations,
      createdAt: report!.createdAt,
      updatedAt: report!.updatedAt,
    };
  }
}
