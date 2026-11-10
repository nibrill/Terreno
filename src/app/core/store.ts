import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Backup,
  FIELD_TYPES,
  FieldDef,
  FormTemplate,
  RecordEntry,
} from '../models';
import { buildDefaultTemplates } from './default-templates';
import { I18n } from './i18n';
import { newId } from './ids';

const KEY_TEMPLATES = 'fieldlog.templates';
const KEY_RECORDS = 'fieldlog.records';
const KEY_SEEDED = 'fieldlog.seeded';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('FieldLog: could not persist data', e);
  }
}

/** Local-first data store. Everything lives in localStorage on this device. */
@Injectable({ providedIn: 'root' })
export class Store {
  private i18n = inject(I18n);

  readonly templates = signal<FormTemplate[]>(read(KEY_TEMPLATES, []));
  readonly records = signal<RecordEntry[]>(read(KEY_RECORDS, []));

  readonly recordCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.records()) {
      counts.set(r.templateId, (counts.get(r.templateId) ?? 0) + 1);
    }
    return counts;
  });

  constructor() {
    // First launch: offer the example forms so the app isn't empty.
    if (read<boolean>(KEY_SEEDED, false) === false) {
      if (this.templates().length === 0) this.addExamples();
      write(KEY_SEEDED, true);
    }
  }

  template(id: string | null | undefined): FormTemplate | undefined {
    return this.templates().find((t) => t.id === id);
  }

  saveTemplate(tpl: FormTemplate): void {
    const next = { ...tpl, updatedAt: Date.now() };
    const list = this.templates();
    const i = list.findIndex((t) => t.id === tpl.id);
    this.templates.set(
      i >= 0 ? list.map((t, j) => (j === i ? next : t)) : [...list, next]
    );
    write(KEY_TEMPLATES, this.templates());
  }

  deleteTemplate(id: string): void {
    this.templates.set(this.templates().filter((t) => t.id !== id));
    this.records.set(this.records().filter((r) => r.templateId !== id));
    write(KEY_TEMPLATES, this.templates());
    write(KEY_RECORDS, this.records());
  }

  addRecord(rec: Omit<RecordEntry, 'id' | 'createdAt'>): RecordEntry {
    const entry: RecordEntry = { ...rec, id: newId('r'), createdAt: Date.now() };
    this.records.set([entry, ...this.records()]);
    write(KEY_RECORDS, this.records());
    return entry;
  }

  deleteRecord(id: string): void {
    this.records.set(this.records().filter((r) => r.id !== id));
    write(KEY_RECORDS, this.records());
  }

  /** Adds the built-in examples that are not already present. */
  addExamples(): void {
    const have = new Set(this.templates().map((t) => t.id));
    const fresh = buildDefaultTemplates((k) => this.i18n.t(k)).filter(
      (t) => !have.has(t.id)
    );
    if (fresh.length) {
      this.templates.set([...this.templates(), ...fresh]);
      write(KEY_TEMPLATES, this.templates());
    }
  }

  exportBackup(): Backup {
    return {
      app: 'fieldlog',
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: this.templates(),
      records: this.records(),
    };
  }

  /**
   * Merges a backup into current data. Returns counts, or null when the input
   * is not a valid backup. Input is validated and sanitised: it comes from a
   * file the user picked and must never be trusted blindly.
   */
  importBackup(input: unknown): { templates: number; records: number } | null {
    const b = input as Partial<Backup> | null;
    if (
      !b ||
      typeof b !== 'object' ||
      b.app !== 'fieldlog' ||
      !Array.isArray(b.templates) ||
      !Array.isArray(b.records)
    ) {
      return null;
    }
    const tpls = b.templates
      .map(sanitizeTemplate)
      .filter((t): t is FormTemplate => t !== null);
    const recs = b.records
      .map(sanitizeRecord)
      .filter((r): r is RecordEntry => r !== null);

    const mergeById = <T extends { id: string }>(cur: T[], inc: T[]): T[] => {
      const map = new Map(cur.map((x) => [x.id, x]));
      for (const x of inc) map.set(x.id, x);
      return [...map.values()];
    };
    this.templates.set(mergeById(this.templates(), tpls));
    this.records.set(
      mergeById(this.records(), recs).sort((a, c) => c.createdAt - a.createdAt)
    );
    write(KEY_TEMPLATES, this.templates());
    write(KEY_RECORDS, this.records());
    return { templates: tpls.length, records: recs.length };
  }
}

const str = (v: unknown, max = 500): string | null =>
  typeof v === 'string' ? v.slice(0, max) : null;

function sanitizeField(raw: unknown): FieldDef | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return null;
  const id = str(o['id'], 100);
  const label = str(o['label']);
  const type = o['type'] as FieldDef['type'];
  if (!id || label === null || !FIELD_TYPES.includes(type)) return null;
  const field: FieldDef = { id, label, type, required: o['required'] === true };
  const unit = str(o['unit'], 30);
  if (unit) field.unit = unit;
  if (type === 'select' && Array.isArray(o['options'])) {
    field.options = (o['options'] as unknown[])
      .map((x) => str(x, 200))
      .filter((x): x is string => !!x);
  }
  return field;
}

function sanitizeTemplate(raw: unknown): FormTemplate | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return null;
  const id = str(o['id'], 100);
  const name = str(o['name']);
  if (!id || !name || !Array.isArray(o['fields'])) return null;
  const fields = (o['fields'] as unknown[])
    .map(sanitizeField)
    .filter((x): x is FieldDef => x !== null);
  const now = Date.now();
  return {
    id,
    name,
    description: str(o['description'], 1000) ?? undefined,
    fields,
    createdAt: typeof o['createdAt'] === 'number' ? o['createdAt'] : now,
    updatedAt: typeof o['updatedAt'] === 'number' ? o['updatedAt'] : now,
  };
}

function sanitizeRecord(raw: unknown): RecordEntry | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return null;
  const id = str(o['id'], 100);
  const templateId = str(o['templateId'], 100);
  const values = o['values'] as Record<string, unknown> | null;
  if (!id || !templateId || !values || typeof values !== 'object') return null;
  const clean: RecordEntry['values'] = {};
  for (const [k, v] of Object.entries(values)) {
    if (
      v === null ||
      typeof v === 'boolean' ||
      (typeof v === 'number' && Number.isFinite(v)) ||
      typeof v === 'string'
    ) {
      clean[k] = typeof v === 'string' ? v.slice(0, 20000) : v;
    }
  }
  return {
    id,
    templateId,
    createdAt: typeof o['createdAt'] === 'number' ? o['createdAt'] : Date.now(),
    values: clean,
  };
}
