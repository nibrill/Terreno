import { buildTable, neutraliseFormula, safeFileName, sheetName, toCsv } from './export';
import { ExportLabels } from './export';
import { FormTemplate, RecordEntry } from '../models';

const L: ExportLabels = {
  recordedAt: 'At', yes: 'Yes', no: 'No', photos: 'photo(s)',
  utmNorth: 'N', utmEast: 'E', utmZone: 'Z',
};

describe('export helpers', () => {
  const tpl: FormTemplate = {
    id: 't',
    name: 'T',
    category: 'custom',
    createdAt: 0,
    updatedAt: 0,
    fields: [
      { id: 'a', label: 'Name', type: 'text', required: true },
      { id: 'b', label: 'Depth', type: 'number', required: false, unit: 'm' },
      { id: 'c', label: 'Ok', type: 'checkbox', required: false },
      { id: 'd', label: 'Pos', type: 'gps', required: false },
      { id: 'e', label: 'Pics', type: 'photo', required: false },
    ],
  };
  const rec: RecordEntry = {
    id: 'r',
    templateId: 't',
    createdAt: Date.UTC(2026, 0, 1),
    values: { a: 'He said "hi", ok', b: -3.5, c: true, d: '-33.4372, -70.6506', e: ['x', 'y'] },
  };

  it('neutralises formula-looking text but not numbers', () => {
    expect(neutraliseFormula('=1+1')).toBe("'=1+1");
    expect(neutraliseFormula('@x')).toBe("'@x");
    expect(neutraliseFormula(-5)).toBe(-5);
    expect(neutraliseFormula('-33.4, -70.6')).toBe('-33.4, -70.6');
    expect(neutraliseFormula('-5-5')).toBe("'-5-5");
    expect(neutraliseFormula('plain')).toBe('plain');
  });

  it('builds a CSV with units, quoting and BOM', () => {
    const csv = toCsv(buildTable(tpl, [rec], L));
    const lines = csv.replace('﻿', '').split('\r\n');
    expect(csv.startsWith('﻿')).toBeTrue();
    expect(lines[0]).toBe('At,Name,Depth [m],Ok,Pos,Pos N,Pos E,Pos Z,Pics');
    expect(lines[1].startsWith('2026-01-01T00:00:00.000Z,"He said ""hi"", ok",-3.5,Yes,"-33.4372, -70.6506",')).toBeTrue();
    expect(lines[1].endsWith(',19S,2 photo(s)')).toBeTrue();
  });

  it('makes valid, unique sheet names and file names', () => {
    const used = new Set<string>();
    expect(sheetName('A/B:C', used)).toBe('A B C');
    expect(sheetName('a b c', used)).toBe('a b c 2');
    expect(sheetName('x'.repeat(40), used).length).toBe(31);
    expect(safeFileName('Nivel / agua ñ')).toMatch(/^[\w-]+$/);
  });
});
