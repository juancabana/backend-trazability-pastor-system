import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DistrictRepository } from '../../infrastructure/repositories/district.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { ChurchRepository } from '../../../church/infrastructure/repositories/church.repository.js';

@Injectable()
export class DeleteDistrictUseCase {
  constructor(
    private readonly districtRepo: DistrictRepository,
    private readonly userRepo: UserRepository,
    private readonly churchRepo: ChurchRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const district = await this.districtRepo.findById(id);
    if (!district) {
      throw new NotFoundException('Distrito no encontrado');
    }

    // Check no churches are assigned
    const churchCount = await this.churchRepo.countByDistrict(id);
    if (churchCount > 0) {
      throw new ConflictException(
        'No se puede eliminar: hay iglesias asignadas a este distrito',
      );
    }

    // Check no pastors are assigned
    const users = await this.userRepo.findByDistrict(id);
    if (users.length > 0) {
      throw new ConflictException(
        'No se puede eliminar: hay pastores asignados a este distrito',
      );
    }

    await this.districtRepo.delete(id);
  }
}
