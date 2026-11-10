import { TestBed } from '@angular/core/testing';
import { Store } from './store';

describe('Store', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('seeds example forms on first launch only', () => {
    const s = TestBed.inject(Store);
    expect(s.templates().length).toBe(3);
    s.deleteTemplate(s.templates()[0].id);
    TestBed.resetTestingModule();
    expect(TestBed.inject(Store).templates().length).toBe(2);
  });

  it('rejects invalid backups and sanitises valid ones', () => {
    const s = TestBed.inject(Store);
    expect(s.importBackup({ foo: 1 })).toBeNull();
    expect(s.importBackup(null)).toBeNull();
    const res = s.importBackup({
      app: 'fieldlog',
      templates: [
        { id: 'x', name: 'X', fields: [{ id: 'f', label: 'F', type: 'bogus' }, { id: 'g', label: 'G', type: 'text' }] },
        { nope: true },
      ],
      records: [{ id: 'r', templateId: 'x', values: { g: 'hi', evil: { a: 1 } } }],
    });
    expect(res).toEqual({ templates: 1, records: 1 });
    expect(s.template('x')!.fields.length).toBe(1);
    expect(s.records()[0].values).toEqual({ g: 'hi' });
  });
});
