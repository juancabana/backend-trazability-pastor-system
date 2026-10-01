import {
  ActivityEntry,
  VisitDetail,
} from '../../domain/entities/daily-report.entity.js';
import { VISITATION_SUBCATEGORY_ID } from '../../../config/constants.js';

export type VisitDetailDraft = Partial<VisitDetail>;
export type ActivityEntryDraft = Omit<ActivityEntry, 'visits'> & {
  visits?: VisitDetailDraft[];
};
export type VisitIdGenerator = () => string;

type VisitIdResolver = (draft: VisitDetailDraft, index: number) => string;

const cleanText = (value?: string): string => value?.trim() ?? '';

export function isVisitationActivity(entry: {
  subcategoryId: string;
}): boolean {
  return entry.subcategoryId === VISITATION_SUBCATEGORY_ID;
}

export function isVisitComplete(visit: VisitDetailDraft): boolean {
  return (
    cleanText(visit.visitedName) !== '' && cleanText(visit.visitReason) !== ''
  );
}

function toVisit(draft: VisitDetailDraft, id: string): VisitDetail {
  const visit: VisitDetail = {
    id,
    visitedName: cleanText(draft.visitedName),
    visitReason: cleanText(draft.visitReason),
  };
  const churchName = cleanText(draft.churchName);
  const whatsappPhone = cleanText(draft.whatsappPhone);
  if (churchName) visit.churchName = churchName;
  if (whatsappPhone) visit.whatsappPhone = whatsappPhone;
  return visit;
}

function extractLegacyVisit(entry: ActivityEntryDraft): VisitDetailDraft[] {
  const { churchName, visitedName, whatsappPhone, visitReason } = entry;
  const legacy = { churchName, visitedName, whatsappPhone, visitReason };
  const hasData = Object.values(legacy).some(
    (value) => cleanText(value) !== '',
  );
  return hasData ? [legacy] : [];
}

function collectVisitDrafts(entry: ActivityEntryDraft): VisitDetailDraft[] {
  return entry.visits?.length ? entry.visits : extractLegacyVisit(entry);
}

function omitVisitFields(
  entry: ActivityEntryDraft,
): Omit<ActivityEntry, 'visits'> {
  const base = { ...entry };
  delete base.visits;
  delete base.churchName;
  delete base.visitedName;
  delete base.whatsappPhone;
  delete base.visitReason;
  return base;
}

function normalizeEntry(
  entry: ActivityEntryDraft,
  resolveId: VisitIdResolver,
): ActivityEntry {
  const base = omitVisitFields(entry);
  if (!isVisitationActivity(entry)) return base;
  return {
    ...base,
    visits: collectVisitDrafts(entry).map((draft, index) =>
      toVisit(draft, resolveId(draft, index)),
    ),
  };
}

/**
 * Normaliza actividades leidas de BD: convierte el formato legado de una sola
 * visita (campos planos) a `visits[]`. Determinista: no genera IDs aleatorios.
 */
export function normalizeActivitiesForRead(
  activities: ActivityEntry[],
): ActivityEntry[] {
  return activities.map((entry) =>
    normalizeEntry(
      entry,
      (draft, index) => cleanText(draft.id) || `legacy-${index + 1}`,
    ),
  );
}

/**
 * Prepara actividades para persistir: normaliza visitas, asegura IDs unicos
 * por reporte y descarta datos de visita en subcategorias que no los usan.
 */
export function prepareActivitiesForPersistence(
  activities: ActivityEntryDraft[],
  generateId: VisitIdGenerator,
): ActivityEntry[] {
  const usedIds = new Set<string>();
  const resolveUniqueId: VisitIdResolver = (draft) => {
    const candidate = cleanText(draft.id);
    const id = candidate && !usedIds.has(candidate) ? candidate : generateId();
    usedIds.add(id);
    return id;
  };
  return activities.map((entry) => normalizeEntry(entry, resolveUniqueId));
}

export function findIncompleteVisitations(
  activities: ActivityEntry[],
): ActivityEntry[] {
  return activities.filter(
    (entry) =>
      isVisitationActivity(entry) &&
      (!entry.visits?.length || !entry.visits.every(isVisitComplete)),
  );
}
