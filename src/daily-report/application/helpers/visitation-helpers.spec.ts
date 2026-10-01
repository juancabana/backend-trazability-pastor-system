import { ActivityEntry } from '../../domain/entities/daily-report.entity.js';
import { VISITATION_SUBCATEGORY_ID } from '../../../config/constants.js';
import {
  ActivityEntryDraft,
  findIncompleteVisitations,
  normalizeActivitiesForRead,
  prepareActivitiesForPersistence,
} from './visitation-helpers.js';

const buildVisitation = (
  overrides: Partial<ActivityEntryDraft> = {},
): ActivityEntryDraft => ({
  subcategoryId: VISITATION_SUBCATEGORY_ID,
  categoryId: 'confraternidad',
  description: '',
  quantity: 2,
  ...overrides,
});

const buildOtherActivity = (
  overrides: Partial<ActivityEntryDraft> = {},
): ActivityEntryDraft => ({
  subcategoryId: 'campanas',
  categoryId: 'predicacion',
  description: 'Campana',
  quantity: 1,
  ...overrides,
});

describe('visitation-helpers', () => {
  describe('normalizeActivitiesForRead', () => {
    it('should convert legacy single-visit fields into a visits list', () => {
      // Arrange
      const legacy = buildVisitation({
        churchName: 'Iglesia Central',
        visitedName: 'Maria Perez',
        whatsappPhone: '+57 300 123 4567',
        visitReason: 'Acompanamiento',
      }) as ActivityEntry;

      // Act
      const [result] = normalizeActivitiesForRead([legacy]);

      // Assert
      expect(result.visits).toEqual([
        {
          id: 'legacy-1',
          churchName: 'Iglesia Central',
          visitedName: 'Maria Perez',
          whatsappPhone: '+57 300 123 4567',
          visitReason: 'Acompanamiento',
        },
      ]);
      expect(result).not.toHaveProperty('visitedName');
      expect(result).not.toHaveProperty('visitReason');
    });

    it('should keep stored visits and the activity quantity unchanged', () => {
      // Arrange
      const visits = [
        { id: 'a', visitedName: 'Ana', visitReason: 'Oracion' },
        { id: 'b', visitedName: 'Luis', visitReason: 'Consejeria' },
      ];
      const stored = buildVisitation({ visits, quantity: 3 }) as ActivityEntry;

      // Act
      const [result] = normalizeActivitiesForRead([stored]);

      // Assert
      expect(result.visits).toEqual(visits);
      expect(result.quantity).toBe(3);
    });

    it('should return an empty visits list when a visitation has no visit data', () => {
      // Arrange
      const empty = buildVisitation({
        visitedName: '  ',
        visitReason: '',
      }) as ActivityEntry;

      // Act
      const [result] = normalizeActivitiesForRead([empty]);

      // Assert
      expect(result.visits).toEqual([]);
    });

    it('should not add visit data to non-visitation activities', () => {
      // Arrange
      const other = buildOtherActivity() as ActivityEntry;

      // Act
      const [result] = normalizeActivitiesForRead([other]);

      // Assert
      expect(result).toEqual(other);
      expect(result).not.toHaveProperty('visits');
    });
  });

  describe('prepareActivitiesForPersistence', () => {
    it('should generate ids only for visits that do not have one', () => {
      // Arrange
      const generateId = jest.fn().mockReturnValueOnce('generated-1');
      const draft = buildVisitation({
        visits: [
          { id: 'kept', visitedName: 'Ana', visitReason: 'Oracion' },
          { visitedName: 'Luis', visitReason: 'Consejeria' },
        ],
      });

      // Act
      const [result] = prepareActivitiesForPersistence([draft], generateId);

      // Assert
      expect(result.visits?.map((visit) => visit.id)).toEqual([
        'kept',
        'generated-1',
      ]);
      expect(generateId).toHaveBeenCalledTimes(1);
    });

    it('should replace duplicated visit ids with new ones', () => {
      // Arrange
      const generateId = jest.fn().mockReturnValueOnce('generated-1');
      const draft = buildVisitation({
        visits: [
          { id: 'same', visitedName: 'Ana', visitReason: 'Oracion' },
          { id: 'same', visitedName: 'Luis', visitReason: 'Consejeria' },
        ],
      });

      // Act
      const [result] = prepareActivitiesForPersistence([draft], generateId);

      // Assert
      expect(result.visits?.map((visit) => visit.id)).toEqual([
        'same',
        'generated-1',
      ]);
    });

    it('should trim visit fields and drop blank optional fields', () => {
      // Arrange
      const draft = buildVisitation({
        visits: [
          {
            id: 'a',
            churchName: '   ',
            visitedName: '  Ana  ',
            whatsappPhone: '',
            visitReason: ' Oracion ',
          },
        ],
      });

      // Act
      const [result] = prepareActivitiesForPersistence([draft], jest.fn());

      // Assert
      expect(result.visits).toEqual([
        { id: 'a', visitedName: 'Ana', visitReason: 'Oracion' },
      ]);
    });

    it('should convert a legacy payload into a visit with a generated id', () => {
      // Arrange
      const generateId = jest.fn().mockReturnValue('generated-1');
      const legacy = buildVisitation({
        visitedName: 'Maria',
        visitReason: 'Visita familiar',
      });

      // Act
      const [result] = prepareActivitiesForPersistence([legacy], generateId);

      // Assert
      expect(result.visits).toEqual([
        {
          id: 'generated-1',
          visitedName: 'Maria',
          visitReason: 'Visita familiar',
        },
      ]);
      expect(result).not.toHaveProperty('visitedName');
    });

    it('should discard visit data sent for non-visitation activities', () => {
      // Arrange
      const other = buildOtherActivity({
        visits: [{ id: 'x', visitedName: 'Ana', visitReason: 'Oracion' }],
        visitedName: 'Ana',
      });

      // Act
      const [result] = prepareActivitiesForPersistence([other], jest.fn());

      // Assert
      expect(result).not.toHaveProperty('visits');
      expect(result).not.toHaveProperty('visitedName');
      expect(result.quantity).toBe(1);
    });
  });

  describe('findIncompleteVisitations', () => {
    it('should flag a visitation without visits', () => {
      // Arrange
      const visitation = buildVisitation({ visits: [] }) as ActivityEntry;

      // Act
      const result = findIncompleteVisitations([visitation]);

      // Assert
      expect(result).toEqual([visitation]);
    });

    it('should flag a visitation when any visit lacks name or reason', () => {
      // Arrange
      const visitation = buildVisitation({
        visits: [
          { id: 'a', visitedName: 'Ana', visitReason: 'Oracion' },
          { id: 'b', visitedName: 'Luis', visitReason: '   ' },
        ],
      }) as ActivityEntry;

      // Act
      const result = findIncompleteVisitations([visitation]);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should accept complete visitations and ignore other activities', () => {
      // Arrange
      const visitation = buildVisitation({
        visits: [{ id: 'a', visitedName: 'Ana', visitReason: 'Oracion' }],
      }) as ActivityEntry;
      const other = buildOtherActivity() as ActivityEntry;

      // Act
      const result = findIncompleteVisitations([visitation, other]);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
