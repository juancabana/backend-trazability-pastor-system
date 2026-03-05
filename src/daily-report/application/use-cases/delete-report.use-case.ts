import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DailyReportRepository } from '../../infrastructure/repositories/daily-report.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { isDateEditable } from '../../../common/utils/period.util.js';

@Injectable()
export class DeleteReportUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    reportId: string,
    pastorId: string,
    associationId: string,
  ): Promise<void> {
    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (report.pastorId !== pastorId) {
      throw new ForbiddenException('No puedes eliminar reportes de otro pastor');
    }

    const association = await this.associationRepo.findById(associationId);
    if (!association) {
      throw new ForbiddenException('Asociacion no encontrada');
    }

    const reportDate = new Date(report.date + 'T00:00:00');
    if (!isDateEditable(reportDate, association.reportDeadlineDay)) {
      throw new ForbiddenException(
        'No se puede eliminar un reporte fuera del periodo actual',
      );
    }

    await this.reportRepo.delete(reportId);
  }
}
