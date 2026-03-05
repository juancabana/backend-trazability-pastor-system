import { Injectable, NotFoundException } from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { DailyReportResponseDto } from '../dtos/daily-report.response.dto.js';

@Injectable()
export class GetReportByPastorAndDateUseCase {
  constructor(private readonly reportRepo: DailyReportRepository) {}

  async execute(
    pastorId: string,
    date: string,
  ): Promise<DailyReportResponseDto> {
    const report = await this.reportRepo.findByPastorAndDate(pastorId, date);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return {
      id: report.id,
      pastorId: report.pastorId,
      date: report.date,
      activities: report.activities,
      observations: report.observations,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}
