import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.PASTOR })
  role: UserRole;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'uuid', nullable: true })
  associationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  districtId: string | null;

  @Column({ type: 'uuid', nullable: true })
  unionId: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  position: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'boolean', default: true })
  mustChangePassword: boolean;

  @Column({ type: 'boolean', default: false })
  canEditAllReports: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
