import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['createdAt'])
@Index(['eventType'])
export class AuditLogEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 150 })
  userName: string;

  @Column({ type: 'varchar', length: 30 })
  userRole: string;

  @Column({ type: 'varchar', length: 10 })
  httpMethod: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'int' })
  statusCode: number;

  /** 'http_request' | 'login' | 'login_failed' */
  @Column({ type: 'varchar', length: 30 })
  eventType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
