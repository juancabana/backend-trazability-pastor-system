import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export interface VisitDetail {
  id: string;
  churchName?: string;
  visitedName: string;
  whatsappPhone?: string;
  visitReason: string;
}

export interface ActivityEntry {
  subcategoryId: string;
  categoryId: string;
  description: string;
  quantity: number;
  hours?: number;
  amount?: number;
  evidenceUrls?: string[];
  /** Detalle de cada visita (solo subcategoria visitacion). */
  visits?: VisitDetail[];
  /** @deprecated Formato de una sola visita; se migra a `visits` al leer/escribir. */
  churchName?: string;
  /** @deprecated Formato de una sola visita; se migra a `visits` al leer/escribir. */
  visitedName?: string;
  /** @deprecated Formato de una sola visita; se migra a `visits` al leer/escribir. */
  whatsappPhone?: string;
  /** @deprecated Formato de una sola visita; se migra a `visits` al leer/escribir. */
  visitReason?: string;
}

@Entity('daily_reports')
@Unique(['pastorId', 'date'])
export class DailyReportEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
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
