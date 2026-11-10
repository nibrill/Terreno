import { TestBed } from '@angular/core/testing';
import { Store } from './store';

function wipe(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('fieldlog');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

describe('Store', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await wipe();
  });

  it('seeds starter forms on first launch only', async () => {
    const s = TestBed.inject(Store);
    await s.init();
    expect(s.templates().length).toBe(3);
    s.deleteTemplate(s.templates()[0].id);
    TestBed.resetTestingModule();
    const s2 = TestBed.inject(Store);
    await s2.init();
    expect(s2.templates().length).toBe(2);
  });

  it('persists records across instances', async () => {
    const s = TestBed.inject(Store);
    await s.init();
    const tpl = s.templates()[0];
    s.addRecord({ templateId: tpl.id, values: { a: 'x' } });
    await new Promise((r) => setTimeout(r, 100));
    TestBed.resetTestingModule();
    const s2 = TestBed.inject(Store);
    await s2.init();
    expect(s2.records().length).toBe(1);
  });

  it('remembers sticky values from the latest record', async () => {
    const s = TestBed.inject(Store);
    await s.init();
    const tpl = s.templates()[0];
    s.addRecord({ templateId: tpl.id, values: { f: 'one' } });
    s.addRecord({ templateId: tpl.id, values: { f: 'two' } });
    expect(s.lastValue(tpl.id, 'f')).toBe('two');
  });

  it('adds library forms once', async () => {
    const s = TestBed.inject(Store);
    await s.init();
    expect(s.addFromLibrary(['drill-log'])).toBe(1);
    expect(s.addFromLibrary(['drill-log'])).toBe(0);
  });

  it('rejects invalid backups and sanitises valid ones', async () => {
    const s = TestBed.inject(Store);
    await s.init();
    expect(s.importBackup({ foo: 1 })).toBeNull();
    expect(s.importBackup(null)).toBeNull();
    const good = 'data:image/jpeg;base64,AAAA';
    const res = s.importBackup({
      app: 'fieldlog',
      templates: [
        { id: 'x', name: 'X', fields: [{ id: 'f', label: 'F', type: 'bogus' }, { id: 'g', label: 'G', type: 'text' }] },
        { nope: true },
      ],
      records: [
        {
          id: 'r',
          templateId: 'x',
          values: { g: 'hi', evil: { a: 1 }, p: [good, 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA'] },
        },
      ],
    });
    expect(res).toEqual({ templates: 1, records: 1 });
    expect(s.template('x')!.fields.length).toBe(1);
    expect(s.template('x')!.category).toBe('custom');
    expect(s.record('r')!.values).toEqual({ g: 'hi', p: [good] });
  });
});
