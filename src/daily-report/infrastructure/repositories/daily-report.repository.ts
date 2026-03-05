import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyReportEntity } from '../../domain/entities/daily-report.entity.js';

@Injectable()
export class DailyReportRepository {
  constructor(
    @InjectRepository(DailyReportEntity)
    private readonly repo: Repository<DailyReportEntity>,
  ) {}

  async findByPastor(pastorId: string): Promise<DailyReportEntity[]> {
    return this.repo.find({
      where: { pastorId },
      order: { date: 'DESC' },
    });
  }

  async findByPastorAndMonth(
    pastorId: string,
    year: number,
    month: number,
  ): Promise<DailyReportEntity[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return this.repo.find({
      where: {
        pastorId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });
  }

  async findByPastorAndDate(
    pastorId: string,
    date: string,
  ): Promise<DailyReportEntity | null> {
    return this.repo.findOne({ where: { pastorId, date } });
  }

  async findByAssociationPastors(
    pastorIds: string[],
    year: number,
    month: number,
  ): Promise<DailyReportEntity[]> {
    if (pastorIds.length === 0) return [];
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

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

  async findById(id: string): Promise<DailyReportEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(
    data: Partial<DailyReportEntity>,
  ): Promise<DailyReportEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<DailyReportEntity>,
  ): Promise<DailyReportEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
