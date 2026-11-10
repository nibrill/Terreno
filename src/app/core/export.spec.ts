import { buildTable, neutraliseFormula, safeFileName, sheetName, toCsv } from './export';
import { FormTemplate, RecordEntry } from '../models';

describe('export helpers', () => {
  const tpl: FormTemplate = {
    id: 't',
    name: 'T',
    createdAt: 0,
    updatedAt: 0,
    fields: [
      { id: 'a', label: 'Name', type: 'text', required: true },
      { id: 'b', label: 'Depth', type: 'number', required: false, unit: 'm' },
      { id: 'c', label: 'Ok', type: 'checkbox', required: false },
    ],
  };
  const rec: RecordEntry = {
    id: 'r',
    templateId: 't',
    createdAt: Date.UTC(2026, 0, 1),
    values: { a: 'He said "hi", ok', b: -3.5, c: true },
  };

  it('neutralises formula-looking text but not numbers', () => {
    expect(neutraliseFormula('=1+1')).toBe("'=1+1");
    expect(neutraliseFormula('@x')).toBe("'@x");
    expect(neutraliseFormula(-5)).toBe(-5);
    expect(neutraliseFormula('plain')).toBe('plain');
  });

  it('builds a CSV with units, quoting and BOM', () => {
    const csv = toCsv(buildTable(tpl, [rec], 'At', 'Yes', 'No'));
    const lines = csv.replace('﻿', '').split('\r\n');
    expect(csv.startsWith('﻿')).toBeTrue();
    expect(lines[0]).toBe('At,Name,Depth [m],Ok');
    expect(lines[1]).toBe('2026-01-01T00:00:00.000Z,"He said ""hi"", ok",-3.5,Yes');
  });

  it('makes valid, unique sheet names and file names', () => {
    const used = new Set<string>();
    expect(sheetName('A/B:C', used)).toBe('A B C');
    expect(sheetName('a b c', used)).toBe('a b c 2');
    expect(sheetName('x'.repeat(40), used).length).toBe(31);
    expect(safeFileName('Nivel / agua ñ')).toMatch(/^[\w-]+$/);
  });
});
