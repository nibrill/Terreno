import { FieldValue, FormTemplate, RecordEntry } from '../models';

export interface Table {
  headers: string[];
  rows: FieldValue[][];
}

export function fieldHeader(f: { label: string; unit?: string }): string {
  return f.unit ? `${f.label} [${f.unit}]` : f.label;
}

/** Turns the records of one template into a flat table. */
export function buildTable(
  tpl: FormTemplate,
  records: RecordEntry[],
  recordedAtHeader: string,
  yes: string,
  no: string
): Table {
  const headers = [recordedAtHeader, ...tpl.fields.map(fieldHeader)];
  const rows = records.map((r) => [
    new Date(r.createdAt).toISOString(),
    ...tpl.fields.map((f) => {
      const v = r.values[f.id] ?? null;
      if (f.type === 'checkbox') return v === true ? yes : v === false ? no : '';
      return v;
    }),
  ]);
  return { headers, rows };
}

/**
 * Spreadsheet apps execute cells that start with = + - @ as formulas
 * (CSV/formula injection). Neutralise text values; leave real numbers alone.
 */
export function neutraliseFormula(v: FieldValue): FieldValue {
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) return `'${v}`;
  return v;
}

function csvCell(v: FieldValue): string {
  const s = v === null ? '' : String(neutraliseFormula(v));
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(table: Table): string {
  const lines = [table.headers, ...table.rows].map((row) =>
    row.map((c) => csvCell(c as FieldValue)).join(',')
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
      .slice(0, 60) || 'fieldlog'
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

export function downloadCsv(table: Table, baseName: string): void {
  download(
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
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(aoa),
      sheetName(name, used)
    );
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${safeFileName(baseName)}.xlsx`
  );
}
