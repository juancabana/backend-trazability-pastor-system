import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';

@Injectable()
export class GetReportsByPastorUseCase {
  constructor(private readonly reportRepo: DailyReportRepository) {}

  async execute(
    pastorId: string,
    month?: number,
    year?: number,
  ): Promise<DailyReportResponseDto[]> {
    let reports;
    if (month && year) {
      reports = await this.reportRepo.findByPastorAndMonth(
        pastorId,
        year,
        month,
      );
    } else {
      reports = await this.reportRepo.findByPastor(pastorId);
    }

    return reports.map((r) => ({
      id: r.id,
      pastorId: r.pastorId,
      date: r.date,
      activities: r.activities,
      observations: r.observations,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
