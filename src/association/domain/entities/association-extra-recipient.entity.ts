import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@Entity('association_extra_recipients')
@Unique(['associationId', 'email'])
export class AssociationExtraRecipientEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid' })
  associationId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;
}
