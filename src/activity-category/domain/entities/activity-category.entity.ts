import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface SubCategory {
  id: string;
  name: string;
  unit: 'cantidad' | 'horas' | 'veces' | 'dias' | 'noches';
  hasHours: boolean;
  description?: string;
}

@Entity('activity_categories')
export class ActivityCategoryEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  color: string;

  @Column({ type: 'varchar', length: 20 })
  bgColor: string;

  @Column({ type: 'varchar', length: 20 })
  borderColor: string;

  @Column({ type: 'jsonb' })
  subcategories: SubCategory[];

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
