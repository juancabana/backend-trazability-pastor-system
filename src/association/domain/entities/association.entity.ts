import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DEFAULT_REPORT_DEADLINE_DAY } from '../../../config/constants.js';

@Entity('associations')
export class AssociationEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'uuid' })
  unionId: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'int', default: DEFAULT_REPORT_DEADLINE_DAY })
  reportDeadlineDay: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
