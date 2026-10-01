import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrUpdateReportUseCase } from './create-or-update-report.use-case.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { CreateDailyReportDto } from '../dtos/create-daily-report.dto.js';
import { VISITATION_SUBCATEGORY_ID } from '../../../config/constants.js';
import { DailyReportEntity } from '../../domain/entities/daily-report.entity.js';

const REPORT_DATE = '2026-10-01';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const buildDto = (
  visits: CreateDailyReportDto['activities'][number]['visits'],
): CreateDailyReportDto => ({
  date: REPORT_DATE,
  observations: '',
  activities: [
    {
      subcategoryId: VISITATION_SUBCATEGORY_ID,
      categoryId: 'confraternidad',
      description: '',
      quantity: 2,
      visits,
    },
  ],
});

describe('CreateOrUpdateReportUseCase', () => {
  let useCase: CreateOrUpdateReportUseCase;
  let ormRepo: {
    findOne: jest.Mock;
    create: jest.Mock<object, [Partial<DailyReportEntity>]>;
    save: jest.Mock;
    update: jest.Mock;
  };
  let transaction: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-01T17:00:00Z') });

    ormRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: Partial<DailyReportEntity>) => ({
        id: 'report-1',
        ...data,
      })),
      save: jest.fn((entity: object) =>
        Promise.resolve({
          ...entity,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: jest.fn(),
    };
    transaction = jest.fn((work: (manager: unknown) => Promise<unknown>) =>
      work({ getRepository: () => ormRepo }),
    );
    const associationRepo = {
      findById: jest.fn().mockResolvedValue({ reportDeadlineDay: 19 }),
    };
    const userRepo = { findById: jest.fn() };

    useCase = new CreateOrUpdateReportUseCase(
      { transaction } as unknown as DataSource,
      associationRepo as unknown as AssociationRepository,
      userRepo as unknown as UserRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should persist every visit of a visitation with a stable id', async () => {
    // Arrange
    const dto = buildDto([
      { visitedName: 'Ana', visitReason: 'Oracion' },
      {
        visitedName: 'Luis',
        visitReason: 'Consejeria',
        churchName: 'Iglesia Central',
      },
    ]);

    // Act
    const result = await useCase.execute('pastor-1', 'association-1', dto);

    // Assert
    const [persisted] = ormRepo.create.mock.calls[0];
    const persistedVisits = persisted.activities?.[0].visits ?? [];
    expect(persistedVisits.map((visit) => visit.visitedName)).toEqual([
      'Ana',
      'Luis',
    ]);
    persistedVisits.forEach((visit) => expect(visit.id).toMatch(UUID_PATTERN));
    expect(result.activities[0].visits).toHaveLength(2);
  });

  it('should reject a visitation without complete visits before touching the database', async () => {
    // Arrange
    const dto = buildDto([{ visitedName: 'Ana', visitReason: '   ' }]);

    // Act
    const execution = useCase.execute('pastor-1', 'association-1', dto);

    // Assert
    await expect(execution).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('should reject a visitation that has no visits', async () => {
    // Arrange
    const dto = buildDto([]);

    // Act
    const execution = useCase.execute('pastor-1', 'association-1', dto);

    // Assert
    await expect(execution).rejects.toBeInstanceOf(BadRequestException);
  });
});
