import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../domain/entities/user.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    repo: Repository<UserEntity>,
  ) {
    super(repo);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findAll(): Promise<UserEntity[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  findByAssociation(associationId: string): Promise<UserEntity[]> {
    return this.repo.find({
      where: { associationId },
      order: { createdAt: 'ASC' },
    });
  }

  findByAssociationPaginated(
    associationId: string,
    page: number,
    limit: number,
  ): Promise<[UserEntity[], number]> {
    return this.repo.findAndCount({
      where: { associationId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findAllPaginated(page: number, limit: number): Promise<[UserEntity[], number]> {
    return this.repo.findAndCount({
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findByDistrict(districtId: string): Promise<UserEntity[]> {
    return this.repo.find({
      where: { districtId },
      order: { createdAt: 'ASC' },
    });
  }

  findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids })
      .orderBy('user.createdAt', 'ASC')
      .getMany();
  }
}
