import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssociationEntity } from '../../domain/entities/association.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class AssociationRepository extends BaseRepository<AssociationEntity> {
  constructor(
    @InjectRepository(AssociationEntity)
    repo: Repository<AssociationEntity>,
  ) {
    super(repo);
  }

  findAll(): Promise<AssociationEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findByUnion(unionId: string): Promise<AssociationEntity[]> {
    return this.repo.find({ where: { unionId }, order: { name: 'ASC' } });
  }
}
