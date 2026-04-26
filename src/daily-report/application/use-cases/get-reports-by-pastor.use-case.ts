import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';
import { DailyReportEntity } from '../../domain/entities/daily-report.entity.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { isDateEditable } from '../../../common/utils/period.util.js';
import { parseBogotaDate } from '../../../common/utils/bogota-time.util.js';
import { DEFAULT_REPORT_DEADLINE_DAY } from '../../../config/constants.js';

@Injectable()
export class GetReportsByPastorUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly userRepo: UserRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    pastorId: string,
    month?: number,
    year?: number,
  ): Promise<DailyReportResponseDto[]> {
    let reports: DailyReportEntity[];
    if (month && year) {
      reports = await this.reportRepo.findByPastorAndMonth(
        pastorId,
        year,
        month,
      );
    } else {
      reports = await this.reportRepo.findByPastor(pastorId);
    }

    const pastor = await this.userRepo.findById(pastorId);
    const association = pastor?.associationId
      ? await this.associationRepo.findById(pastor.associationId)
      : null;
    const deadlineDay =
      association?.reportDeadlineDay ?? DEFAULT_REPORT_DEADLINE_DAY;
    const canEditAll = pastor?.canEditAllReports ?? false;

    return reports.map((r) => ({
      id: r.id,
      pastorId: r.pastorId,
      date: r.date,
      activities: r.activities,
      observations: r.observations,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isEditable:
        canEditAll || isDateEditable(parseBogotaDate(r.date), deadlineDay),
    }));
  }
}
