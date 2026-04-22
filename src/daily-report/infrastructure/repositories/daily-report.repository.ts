import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyReportEntity } from '../../domain/entities/daily-report.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';
import { formatMonthRange } from '../../../common/utils/date-range.util.js';

@Injectable()
export class DailyReportRepository extends BaseRepository<DailyReportEntity> {
  constructor(
    @InjectRepository(DailyReportEntity)
    repo: Repository<DailyReportEntity>,
  ) {
    super(repo);
  }

  findByPastor(pastorId: string): Promise<DailyReportEntity[]> {
    return this.repo.find({
      where: { pastorId },
      order: { date: 'DESC' },
    });
  }

  findByPastorAndMonth(
    pastorId: string,
    year: number,
    month: number,
  ): Promise<DailyReportEntity[]> {
    const { startDate, endDate } = formatMonthRange(year, month);
    return this.repo.find({
      where: {
        pastorId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });
  }

  findByPastorAndDate(
    pastorId: string,
    date: string,
  ): Promise<DailyReportEntity | null> {
    return this.repo.findOne({ where: { pastorId, date } });
  }

  findByAssociationPastors(
    pastorIds: string[],
    year: number,
    month: number,
  ): Promise<DailyReportEntity[]> {
    if (pastorIds.length === 0) return Promise.resolve([]);
    const { startDate, endDate } = formatMonthRange(year, month);

    return this.repo
      .createQueryBuilder('report')
      .where('report.pastorId IN (:...pastorIds)', { pastorIds })
      .andWhere('report.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('report.date', 'ASC')
      .getMany();
  }
}
