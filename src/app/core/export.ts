import { FieldDef, FieldValue, FormTemplate, RecordEntry } from '../models';
import { utmFromText } from './geo';

export type Cell = string | number | boolean | null;

export interface Table {
  headers: string[];
  rows: Cell[][];
}

export interface ExportLabels {
  recordedAt: string;
  yes: string;
  no: string;
  photos: string; // e.g. "foto(s)"
  utmNorth: string;
  utmEast: string;
  utmZone: string;
}

export function fieldHeader(f: { label: string; unit?: string }): string {
  return f.unit ? `${f.label} [${f.unit}]` : f.label;
}

/** Columns a single field expands to (GPS fields also yield UTM columns). */
function columnsFor(f: FieldDef, L: ExportLabels): string[] {
  const h = fieldHeader(f);
  return f.type === 'gps'
    ? [h, `${f.label} ${L.utmNorth}`, `${f.label} ${L.utmEast}`, `${f.label} ${L.utmZone}`]
    : [h];
}

function cellsFor(f: FieldDef, v: FieldValue | undefined, L: ExportLabels): Cell[] {
  const value = v ?? null;
  switch (f.type) {
    case 'checkbox':
      return [value === true ? L.yes : value === false ? L.no : ''];
    case 'photo':
      return [Array.isArray(value) && value.length ? `${value.length} ${L.photos}` : ''];
    case 'gps': {
      const text = typeof value === 'string' ? value : '';
      const u = utmFromText(text);
      return u
        ? [text, Math.round(u.northing), Math.round(u.easting), `${u.zone}${u.hemisphere}`]
        : [text, '', '', ''];
    }
    default:
      return [Array.isArray(value) ? value.join('; ') : value];
  }
}

/** Turns the records of one template into a flat table. */
export function buildTable(
  tpl: FormTemplate,
  records: RecordEntry[],
  L: ExportLabels
): Table {
  const headers = [L.recordedAt, ...tpl.fields.flatMap((f) => columnsFor(f, L))];
  const rows = records.map((r) => [
    new Date(r.createdAt).toISOString(),
    ...tpl.fields.flatMap((f) => cellsFor(f, r.values[f.id], L)),
  ]);
  return { headers, rows };
}

/**
 * Spreadsheet apps execute cells that start with = + - @ as formulas
 * (CSV/formula injection). Neutralise text values; leave real numbers alone.
 */
export function neutraliseFormula(v: Cell): Cell {
  if (typeof v !== 'string') return v;
  // A number or a "lat, lon" pair (e.g. "-33.44, -70.65") cannot be a formula.
  if (NUMERIC_TEXT.test(v)) return v;
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

const NUMERIC_TEXT =
  /^-?\d+(?:[.,]\d+)?(?:(?:\s*[,;]\s*|\s+)-?\d+(?:[.,]\d+)?)?$/;

function csvCell(v: Cell): string {
  const s = v === null ? '' : String(neutraliseFormula(v));
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(table: Table): string {
  const lines = [table.headers, ...table.rows].map((row) =>
    row.map((c) => csvCell(c)).join(',')
  );
  // BOM so Excel opens UTF-8 (accents, µ, °) correctly.
  return '﻿' + lines.join('\r\n');
}

export function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${n++}`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function safeFileName(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[^\w\-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'terreno'
  );
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * On phones, offer the native share sheet (WhatsApp, e-mail, Drive…) which is
 * how field crews actually move files. Falls back to a normal download.
 */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
  };
  const coarse =
    typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (coarse && nav.share && nav.canShare) {
    const file = new File([blob], filename, { type: blob.type });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return; // user cancelled
      }
    }
  }
  download(blob, filename);
}

export async function downloadCsv(table: Table, baseName: string): Promise<void> {
  await saveFile(
    new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }),
    `${safeFileName(baseName)}.csv`
  );
}

/** One sheet per table. SheetJS is loaded lazily so it stays out of the main bundle. */
export async function downloadXlsx(
  tables: { name: string; table: Table }[],
  baseName: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const { name, table } of tables) {
    const aoa = [
      table.headers,
      ...table.rows.map((r) => r.map((c) => neutraliseFormula(c))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = table.headers.map((h, i) => ({
      wch: Math.min(
        40,
        Math.max(
          h.length,
          ...table.rows.slice(0, 200).map((r) => String(r[i] ?? '').length)
        ) + 2
      ),
    }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName(name, used));
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await saveFile(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${safeFileName(baseName)}.xlsx`
  );
}
