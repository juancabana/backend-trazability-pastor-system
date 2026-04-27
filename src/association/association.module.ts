import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssociationEntity } from './domain/entities/association.entity.js';
import { AssociationExtraRecipientEntity } from './domain/entities/association-extra-recipient.entity.js';
import { AssociationRepository } from './infrastructure/repositories/association.repository.js';
import { ExtraRecipientRepository } from './infrastructure/repositories/extra-recipient.repository.js';
import { GetAssociationsUseCase } from './application/use-cases/get-associations.use-case.js';
import { CreateAssociationUseCase } from './application/use-cases/create-association.use-case.js';
import { UpdateAssociationUseCase } from './application/use-cases/update-association.use-case.js';
import { UpdateAssociationDeadlineUseCase } from './application/use-cases/update-association-deadline.use-case.js';
import { GetExtraRecipientsUseCase } from './application/use-cases/get-extra-recipients.use-case.js';
import { AddExtraRecipientUseCase } from './application/use-cases/add-extra-recipient.use-case.js';
import { RemoveExtraRecipientUseCase } from './application/use-cases/remove-extra-recipient.use-case.js';
import { AssociationController } from './presentation/association.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssociationEntity,
      AssociationExtraRecipientEntity,
    ]),
  ],
  controllers: [AssociationController],
  providers: [
    AssociationRepository,
    ExtraRecipientRepository,
    GetAssociationsUseCase,
    CreateAssociationUseCase,
    UpdateAssociationUseCase,
    UpdateAssociationDeadlineUseCase,
    GetExtraRecipientsUseCase,
    AddExtraRecipientUseCase,
    RemoveExtraRecipientUseCase,
  ],
  exports: [AssociationRepository, ExtraRecipientRepository],
})
export class AssociationModule {}
