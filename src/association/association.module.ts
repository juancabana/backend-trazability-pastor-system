import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssociationEntity } from './domain/entities/association.entity.js';
import { AssociationRepository } from './infrastructure/repositories/association.repository.js';
import { GetAssociationsUseCase } from './application/use-cases/get-associations.use-case.js';
import { CreateAssociationUseCase } from './application/use-cases/create-association.use-case.js';
import { UpdateAssociationUseCase } from './application/use-cases/update-association.use-case.js';
import { AssociationController } from './presentation/association.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AssociationEntity])],
  controllers: [AssociationController],
  providers: [
    AssociationRepository,
    GetAssociationsUseCase,
    CreateAssociationUseCase,
    UpdateAssociationUseCase,
  ],
  exports: [AssociationRepository],
})
export class AssociationModule {}
