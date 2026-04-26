import { Injectable, NotFoundException } from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { isDateEditable } from '../../../common/utils/period.util.js';
import { parseBogotaDate } from '../../../common/utils/bogota-time.util.js';
import { DEFAULT_REPORT_DEADLINE_DAY } from '../../../config/constants.js';

@Injectable()
export class GetReportByPastorAndDateUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly userRepo: UserRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    pastorId: string,
    date: string,
  ): Promise<DailyReportResponseDto> {
    const report = await this.reportRepo.findByPastorAndDate(pastorId, date);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    const pastor = await this.userRepo.findById(pastorId);
    const association = pastor?.associationId
      ? await this.associationRepo.findById(pastor.associationId)
      : null;
    const deadlineDay =
      association?.reportDeadlineDay ?? DEFAULT_REPORT_DEADLINE_DAY;
    const canEditAll = pastor?.canEditAllReports ?? false;

    return {
      id: report.id,
      pastorId: report.pastorId,
      date: report.date,
      activities: report.activities,
      observations: report.observations,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      isEditable:
        canEditAll || isDateEditable(parseBogotaDate(report.date), deadlineDay),
    };
  }
}
