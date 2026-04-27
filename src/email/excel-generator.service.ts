import { Injectable } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';
import type {
  AssociationConsolidatedResponseDto,
  CategoryConsolidated,
} from '../consolidated/application/dtos/consolidated.response.dto.js';
import {
  COMPLIANCE_THRESHOLD,
  COMPLIANCE_AMBER_THRESHOLD,
} from '../config/constants.js';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface PastorEmailDetail {
  pastorId: string;
  pastorName: string;
  districtName: string | null;
  position: string | null;
  totalReports: number;
  totalActivities: number;
  totalHours: number;
  totalTransportAmount: number;
  compliance: number;
  daysWithReports: number;
  daysInPeriod: number;
  categories: CategoryConsolidated[];
}

// ── Colores (mismos que frontend EXPORT_BRAND.excel) ─────────────────────────

const E = {
  teal:      'FF0D9488',
  tealDark:  'FF0F766E',
  tealLight: 'FFE6FFFA',
  slate:     'FF475569',
  slateLight:'FFF8FAFC',
  border:    'FFE2E8F0',
  rowAlt:    'FFF9FAFB',
  white:     'FFFFFFFF',
  green:  { bg: 'FFDCFCE7', text: 'FF15803D' },
  amber:  { bg: 'FFFEF3C7', text: 'FF92400E' },
  red:    { bg: 'FFFEE2E2', text: 'FFB91C1C' },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function xlFill(argb: string) {
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } };
}

function xlFont(opts: { bold?: boolean; size?: number; color?: string }) {
  return {
    name: 'Calibri',
    bold: opts.bold ?? false,
    size: opts.size ?? 11,
    color: { argb: opts.color ?? 'FF1E293B' },
  };
}

function xlBorder(color: string = E.border) {
  const side = { style: 'thin' as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function xlSheetHeader(ws: Worksheet, title: string, cols: number, argb: string) {
  ws.mergeCells(1, 1, 1, cols);
  const cell = ws.getCell(1, 1);
  cell.value = title;
  cell.fill = xlFill(argb);
  cell.font = xlFont({ bold: true, size: 13, color: E.white });
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;
}

function xlColHeaders(ws: Worksheet, row: number, headers: string[], argb: string) {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.fill = xlFill(argb);
    cell.font = xlFont({ bold: true, size: 10, color: E.white });
    cell.border = xlBorder(argb);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  ws.getRow(row).height = 20;
}

function xlSetColWidths(ws: Worksheet, widths: number[]) {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

function xlDataCell(
  ws: Worksheet,
  row: number,
  col: number,
  value: string | number,
  opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; fillArgb?: string; textArgb?: string } = {},
) {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = xlFont({ bold: opts.bold, color: opts.textArgb });
  cell.fill = xlFill(opts.fillArgb ?? (row % 2 === 0 ? E.rowAlt : E.white));
  cell.border = xlBorder();
  cell.alignment = { horizontal: opts.align ?? 'left', vertical: 'middle' };
}

function xlComplianceFill(pct: number): { bg: string; text: string } {
  if (pct >= COMPLIANCE_THRESHOLD * 100) return E.green;
  if (pct >= COMPLIANCE_AMBER_THRESHOLD * 100) return E.amber;
  return E.red;
}

function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `FF${clean.toUpperCase()}`;
}

function formatCurrency(amount: number): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable()
export class ExcelGeneratorService {

  /** Excel consolidado de asociación — 3 hojas: Resumen, Pastores, Actividades */
  async generateConsolidatedExcel(
    data: AssociationConsolidatedResponseDto,
    periodLabel: string,
  ): Promise<Buffer> {
    const wb = new Workbook();
    wb.creator = 'Sistema de Trazabilidad Pastoral';
    wb.created = new Date();

    // ── Hoja 1: Resumen ────────────────────────────────────────────────────
    const wsRes = wb.addWorksheet('Resumen');
    xlSetColWidths(wsRes, [30, 22]);
    xlSheetHeader(wsRes, `Consolidado Pastoral — ${periodLabel}`, 2, E.teal);

    const avgCompliance =
      data.pastorSummaries.length > 0
        ? data.pastorSummaries.reduce((s, p) => s + p.compliance, 0) /
          data.pastorSummaries.length
        : 0;

    const resRows: [string, string | number][] = [
      ['Periodo', periodLabel],
      ['Total pastores', data.pastorSummaries.length],
      ['Total actividades', data.totals.totalActivities],
      ['Total horas', Number(data.totals.totalHours.toFixed(1))],
      ['Cumplimiento promedio', `${Math.round(avgCompliance * 100)}%`],
      ['Total transporte', formatCurrency(data.totalTransportAmount)],
      ['Generado el', formatDate(new Date())],
    ];

    resRows.forEach(([label, value], i) => {
      const r = i + 2;
      const fill = i % 2 === 0 ? E.tealLight : E.white;
      const c1 = wsRes.getCell(r, 1);
      c1.value = label; c1.font = xlFont({ bold: true, size: 10 });
      c1.fill = xlFill(fill); c1.border = xlBorder(); c1.alignment = { vertical: 'middle' };
      const c2 = wsRes.getCell(r, 2);
      c2.value = value; c2.font = xlFont({ size: 10 });
      c2.fill = xlFill(fill); c2.border = xlBorder(); c2.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // ── Hoja 2: Pastores ───────────────────────────────────────────────────
    const wsPast = wb.addWorksheet('Pastores');
    xlSetColWidths(wsPast, [36, 18, 26, 13, 14, 12, 18, 15]);

    const pastorHeaders = ['Pastor', 'Posición', 'Distrito', 'Informes', 'Actividades', 'Horas', 'Transporte', 'Cumplimiento'];
    xlSheetHeader(wsPast, `Pastores — ${periodLabel}`, pastorHeaders.length, E.teal);
    xlColHeaders(wsPast, 2, pastorHeaders, E.tealDark);
    wsPast.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: pastorHeaders.length } };

    const sorted = [...data.pastorSummaries].sort((a, b) => b.compliance - a.compliance);
    sorted.forEach((p, i) => {
      const r = i + 3;
      const pct = Math.round(p.compliance * 100);
      const rowFill = i % 2 === 0 ? E.white : E.rowAlt;
      const cf = xlComplianceFill(pct);
      const rowData: (string | number)[] = [
        p.pastorName, p.position ?? '—', p.districtName ?? '—',
        p.totalReports, p.totalActivities,
        Number(p.totalHours.toFixed(1)),
        formatCurrency(p.totalTransportAmount),
        pct,
      ];
      rowData.forEach((val, ci) => {
        const isCompliance = ci === 7;
        xlDataCell(wsPast, r, ci + 1, val, {
          align: ci >= 3 ? 'right' : 'left',
          fillArgb: isCompliance ? cf.bg : rowFill,
          textArgb: isCompliance ? cf.text : undefined,
          bold: isCompliance,
        });
      });
    });

    // Fila de totales
    const totalRow = sorted.length + 3;
    const totalPct = Math.round(avgCompliance * 100);
    const totals: (string | number)[] = [
      'TOTAL', '', '',
      sorted.reduce((s, p) => s + p.totalReports, 0),
      data.totals.totalActivities,
      Number(data.totals.totalHours.toFixed(1)),
      formatCurrency(data.totalTransportAmount),
      `${totalPct}%`,
    ];
    totals.forEach((val, ci) => {
      xlDataCell(wsPast, totalRow, ci + 1, val, {
        bold: true, align: ci >= 3 ? 'right' : 'left',
        fillArgb: E.slate, textArgb: E.white,
      });
    });

    // ── Hoja 3: Actividades ────────────────────────────────────────────────
    const wsAct = wb.addWorksheet('Actividades');
    xlSetColWidths(wsAct, [52, 16, 14, 12, 18]);
    xlSheetHeader(wsAct, `Actividades por Categoría — ${periodLabel}`, 5, E.teal);

    let actRow = 2;
    for (const cat of data.categories) {
      const activeSubs = cat.subcategories.filter((s) => s.totalQuantity > 0);
      if (activeSubs.length === 0) continue;

      const bulletArgb = hexToArgb(cat.color);
      wsAct.mergeCells(actRow, 1, actRow, 5);
      const catCell = wsAct.getCell(actRow, 1);
      catCell.value = cat.categoryName.toUpperCase();
      catCell.fill = xlFill(bulletArgb);
      catCell.font = xlFont({ bold: true, size: 10, color: E.white });
      catCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      catCell.border = xlBorder(bulletArgb);
      wsAct.getRow(actRow).height = 18;
      actRow++;

      xlColHeaders(wsAct, actRow, ['Subcategoría', 'Unidad', 'Cantidad', 'Horas', 'Monto'], E.slate);
      actRow++;

      activeSubs.forEach((s, si) => {
        const rowFill = si % 2 === 0 ? E.white : E.rowAlt;
        const subData: (string | number)[] = [
          s.subcategoryName, s.unit, s.totalQuantity,
          Number(s.totalHours.toFixed(1)),
          s.totalAmount > 0 ? s.totalAmount : '—',
        ];
        subData.forEach((val, ci) => {
          xlDataCell(wsAct, actRow, ci + 1, val, { align: ci >= 2 ? 'right' : 'left', fillArgb: rowFill });
        });
        actRow++;
      });

      const catQty = activeSubs.reduce((s, x) => s + x.totalQuantity, 0);
      const catHrs = activeSubs.reduce((s, x) => s + x.totalHours, 0);
      const catAmt = activeSubs.reduce((s, x) => s + x.totalAmount, 0);
      const subtotal: (string | number)[] = ['Subtotal', '', catQty, Number(catHrs.toFixed(1)), catAmt > 0 ? catAmt : '—'];
      subtotal.forEach((val, ci) => {
        xlDataCell(wsAct, actRow, ci + 1, val, { bold: true, align: ci >= 2 ? 'right' : 'left', fillArgb: E.slateLight });
      });
      actRow += 2;
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /** Excel individual de un pastor — 2 hojas: Resumen, Actividades */
  async generatePastorExcel(
    pastor: PastorEmailDetail,
    periodLabel: string,
  ): Promise<Buffer> {
    const wb = new Workbook();
    wb.creator = 'Sistema de Trazabilidad Pastoral';
    wb.created = new Date();

    // ── Hoja 1: Resumen ────────────────────────────────────────────────────
    const wsRes = wb.addWorksheet('Resumen');
    xlSetColWidths(wsRes, [28, 22]);

    const title = pastor.position
      ? `${pastor.pastorName} · ${pastor.position} — ${periodLabel}`
      : `${pastor.pastorName} — ${periodLabel}`;
    xlSheetHeader(wsRes, title, 2, E.teal);

    const pct = Math.round(pastor.compliance * 100);
    const resRows: [string, string | number][] = [
      ['Pastor', pastor.pastorName],
      ...(pastor.position ? [['Posición', pastor.position] as [string, string]] : []),
      ...(pastor.districtName ? [['Distrito', pastor.districtName] as [string, string]] : []),
      ['Periodo', periodLabel],
      ['Días reportados', `${pastor.daysWithReports} de ${pastor.daysInPeriod}`],
      ['Total actividades', pastor.totalActivities],
      ['Total horas', Number(pastor.totalHours.toFixed(1))],
      ['Cumplimiento', `${pct}%`],
      ['Total transporte', formatCurrency(pastor.totalTransportAmount)],
      ['Generado el', formatDate(new Date())],
    ];

    resRows.forEach(([label, value], i) => {
      const r = i + 2;
      const fill = i % 2 === 0 ? E.tealLight : E.white;
      const c1 = wsRes.getCell(r, 1);
      c1.value = label; c1.font = xlFont({ bold: true, size: 10 });
      c1.fill = xlFill(fill); c1.border = xlBorder(); c1.alignment = { vertical: 'middle' };
      const c2 = wsRes.getCell(r, 2);
      c2.value = value; c2.font = xlFont({ size: 10 });
      c2.fill = xlFill(fill); c2.border = xlBorder(); c2.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // ── Hoja 2: Actividades ────────────────────────────────────────────────
    const wsAct = wb.addWorksheet('Actividades');
    xlSetColWidths(wsAct, [52, 16, 14, 12, 18]);
    xlSheetHeader(wsAct, `Actividades — ${pastor.pastorName} — ${periodLabel}`, 5, E.teal);

    let actRow = 2;
    for (const cat of pastor.categories) {
      const activeSubs = cat.subcategories.filter((s) => s.totalQuantity > 0);
      if (activeSubs.length === 0) continue;

      const bulletArgb = hexToArgb(cat.color);
      wsAct.mergeCells(actRow, 1, actRow, 5);
      const catCell = wsAct.getCell(actRow, 1);
      catCell.value = cat.categoryName.toUpperCase();
      catCell.fill = xlFill(bulletArgb);
      catCell.font = xlFont({ bold: true, size: 10, color: E.white });
      catCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      catCell.border = xlBorder(bulletArgb);
      wsAct.getRow(actRow).height = 18;
      actRow++;

      xlColHeaders(wsAct, actRow, ['Subcategoría', 'Unidad', 'Cantidad', 'Horas', 'Monto'], E.slate);
      actRow++;

      activeSubs.forEach((s, si) => {
        const rowFill = si % 2 === 0 ? E.white : E.rowAlt;
        const subData: (string | number)[] = [
          s.subcategoryName, s.unit, s.totalQuantity,
          Number(s.totalHours.toFixed(1)),
          s.totalAmount > 0 ? s.totalAmount : '—',
        ];
        subData.forEach((val, ci) => {
          xlDataCell(wsAct, actRow, ci + 1, val, { align: ci >= 2 ? 'right' : 'left', fillArgb: rowFill });
        });
        actRow++;
      });

      const catQty = activeSubs.reduce((s, x) => s + x.totalQuantity, 0);
      const catHrs = activeSubs.reduce((s, x) => s + x.totalHours, 0);
      const catAmt = activeSubs.reduce((s, x) => s + x.totalAmount, 0);
      const subtotal: (string | number)[] = ['Subtotal', '', catQty, Number(catHrs.toFixed(1)), catAmt > 0 ? catAmt : '—'];
      subtotal.forEach((val, ci) => {
        xlDataCell(wsAct, actRow, ci + 1, val, { bold: true, align: ci >= 2 ? 'right' : 'left', fillArgb: E.slateLight });
      });
      actRow += 2;
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
