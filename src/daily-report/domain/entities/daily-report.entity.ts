import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export interface ActivityEntry {
  subcategoryId: string;
  categoryId: string;
  description: string;
  quantity: number;
  hours?: number;
  amount?: number;
  evidenceUrls?: string[];
}

@Entity('daily_reports')
@Unique(['pastorId', 'date'])
export class DailyReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  pastorId: string;

  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'jsonb', default: [] })
  activities: ActivityEntry[];

  @Column({ type: 'text', default: '' })
  observations: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
