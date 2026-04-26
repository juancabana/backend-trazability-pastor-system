import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DailyReportEntity } from '../../domain/entities/daily-report.entity.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { CreateDailyReportDto } from '../dtos/create-daily-report.dto.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';
import { isDateEditable } from '../../../common/utils/period.util.js';
import { parseBogotaDate } from '../../../common/utils/bogota-time.util.js';

@Injectable()
export class CreateOrUpdateReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly associationRepo: AssociationRepository,
    private readonly userRepo: UserRepository,
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

    const reportDate = parseBogotaDate(dto.date);
    if (!isDateEditable(reportDate, association.reportDeadlineDay)) {
      const pastor = await this.userRepo.findById(pastorId);
      if (!pastor?.canEditAllReports) {
        throw new ForbiddenException(
          'No se puede editar un reporte fuera del periodo actual',
        );
      }
    }

    const report = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DailyReportEntity);
      const existing = await repo.findOne({
        where: { pastorId, date: dto.date },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        await repo.update(existing.id, {
          activities: dto.activities,
          observations: dto.observations ?? '',
        });
        return repo.findOne({ where: { id: existing.id } });
      }

      const entity = repo.create({
        pastorId,
        date: dto.date,
        activities: dto.activities,
        observations: dto.observations ?? '',
      });
      return repo.save(entity);
    });

    return {
      id: report!.id,
      pastorId: report!.pastorId,
      date: report!.date,
      activities: report!.activities,
      observations: report!.observations,
      createdAt: report!.createdAt,
      updatedAt: report!.updatedAt,
      isEditable: isDateEditable(
        parseBogotaDate(report!.date),
        association.reportDeadlineDay,
      ),
    };
  }
}
