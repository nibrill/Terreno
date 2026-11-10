import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Backup,
  CATEGORIES,
  Category,
  FIELD_TYPES,
  FieldDef,
  FieldValue,
  FormTemplate,
  Profile,
  RecordEntry,
} from '../models';
import { Db } from './idb';
import { I18n } from './i18n';
import { newId } from './ids';
import { PRESETS, buildFromPreset, presetId } from './library';

const KEY_SEEDED = 'fieldlog.seeded';
const KEY_PROFILE = 'fieldlog.profile';
/** Pre-1.1 releases kept everything in localStorage. */
const LEGACY_TEMPLATES = 'fieldlog.templates';
const LEGACY_RECORDS = 'fieldlog.records';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Terreno: could not persist setting', e);
  }
}

/** Local-first data store: IndexedDB on this device, signals in memory. */
@Injectable({ providedIn: 'root' })
export class Store {
  private i18n = inject(I18n);
  private db: Db | null = null;

  readonly templates = signal<FormTemplate[]>([]);
  readonly records = signal<RecordEntry[]>([]);
  readonly profile = signal<Profile>({
    operator: '',
    company: '',
    site: '',
    ...lsGet<Partial<Profile>>(KEY_PROFILE, {}),
  });
  /** False when the browser refused IndexedDB: data would be lost on close. */
  readonly persistent = signal(true);

  readonly recordCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.records()) {
      counts.set(r.templateId, (counts.get(r.templateId) ?? 0) + 1);
    }
    return counts;
  });

  /** Load data. Called once before the app starts (APP_INITIALIZER). */
  async init(): Promise<void> {
    this.db = await Db.open();
    this.persistent.set(this.db !== null);
    if (this.db) {
      this.templates.set(await this.db.all<FormTemplate>('templates'));
      this.records.set(
        sortRecords(await this.db.all<RecordEntry>('records'))
      );
      // Ask the browser not to evict our data under storage pressure.
      try {
        await navigator.storage?.persist?.();
      } catch {
        /* optional */
      }
    }
    await this.migrateLegacy();
    if (lsGet<boolean>(KEY_SEEDED, false) === false) {
      if (this.templates().length === 0) this.addStarterForms();
      lsSet(KEY_SEEDED, true);
    }
  }

  private async migrateLegacy() {
    const t = lsGet<FormTemplate[]>(LEGACY_TEMPLATES, []);
    const r = lsGet<RecordEntry[]>(LEGACY_RECORDS, []);
    if (!t.length && !r.length) return;
    this.importBackup({ app: 'fieldlog', templates: t, records: r });
    try {
      localStorage.removeItem(LEGACY_TEMPLATES);
      localStorage.removeItem(LEGACY_RECORDS);
    } catch {
      /* ignore */
    }
  }

  // ── Templates ─────────────────────────────────────────────

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
    this.persist(() => this.db?.put('templates', next));
  }

  deleteTemplate(id: string): void {
    const doomed = this.records().filter((r) => r.templateId === id);
    this.templates.set(this.templates().filter((t) => t.id !== id));
    this.records.set(this.records().filter((r) => r.templateId !== id));
    this.persist(async () => {
      await this.db?.delete('templates', id);
      await this.db?.deleteMany('records', doomed.map((r) => r.id));
    });
  }

  /** Adds library forms that are not already present. */
  addFromLibrary(keys: string[]): number {
    const have = new Set(this.templates().map((t) => t.id));
    const fresh = PRESETS.filter(
      (p) => keys.includes(p.key) && !have.has(presetId(p.key))
    ).map((p) => buildFromPreset(p, this.i18n.lang()));
    if (fresh.length) {
      this.templates.set([...this.templates(), ...fresh]);
      this.persist(() => this.db?.putMany('templates', fresh));
    }
    return fresh.length;
  }

  addStarterForms(): void {
    this.addFromLibrary(PRESETS.filter((p) => p.starter).map((p) => p.key));
  }

  // ── Records ───────────────────────────────────────────────

  record(id: string | null | undefined): RecordEntry | undefined {
    return this.records().find((r) => r.id === id);
  }

  addRecord(rec: Omit<RecordEntry, 'id' | 'createdAt'>): RecordEntry {
    const entry: RecordEntry = { ...rec, id: newId('r'), createdAt: Date.now() };
    this.records.set([entry, ...this.records()]);
    this.persist(() => this.db?.put('records', entry));
    return entry;
  }

  updateRecord(id: string, values: Record<string, FieldValue>): void {
    const cur = this.record(id);
    if (!cur) return;
    const next = { ...cur, values, updatedAt: Date.now() };
    this.records.set(this.records().map((r) => (r.id === id ? next : r)));
    this.persist(() => this.db?.put('records', next));
  }

  deleteRecord(id: string): void {
    this.records.set(this.records().filter((r) => r.id !== id));
    this.persist(() => this.db?.delete('records', id));
  }

  /** Most recent value for a field, used by "sticky" fields. */
  lastValue(templateId: string, fieldId: string): FieldValue | undefined {
    for (const r of this.records()) {
      if (r.templateId === templateId && fieldId in r.values) {
        return r.values[fieldId];
      }
    }
    return undefined;
  }

  // ── Profile ───────────────────────────────────────────────

  setProfile(p: Profile): void {
    this.profile.set(p);
    lsSet(KEY_PROFILE, p);
  }

  // ── Backup ────────────────────────────────────────────────

  exportBackup(): Backup {
    return {
      app: 'fieldlog',
      version: 2,
      exportedAt: new Date().toISOString(),
      templates: this.templates(),
      records: this.records(),
    };
  }

  /**
   * Merges a backup into current data. Returns counts, or null when the input
   * is not a valid backup. Input comes from a file the user picked and is
   * validated and sanitised, never trusted blindly.
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
    this.records.set(sortRecords(mergeById(this.records(), recs)));
    this.persist(async () => {
      await this.db?.putMany('templates', tpls);
      await this.db?.putMany('records', recs);
    });
    return { templates: tpls.length, records: recs.length };
  }

  private persist(op: () => Promise<unknown> | undefined | void) {
    try {
      const p = op();
      if (p) p.catch((e) => this.fail(e));
    } catch (e) {
      this.fail(e);
    }
  }

  private fail(e: unknown) {
    console.error('Terreno: could not save to device storage', e);
    this.persistent.set(false);
  }
}

const sortRecords = (list: RecordEntry[]) =>
  [...list].sort((a, b) => b.createdAt - a.createdAt);

// ── Sanitising ───────────────────────────────────────────────

const str = (v: unknown, max = 500): string | null =>
  typeof v === 'string' ? v.slice(0, max) : null;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO_CHARS = 3_000_000;
const MAX_PHOTOS = 20;

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
  const min = num(o['min']);
  const max = num(o['max']);
  if (min !== undefined) field.min = min;
  if (max !== undefined) field.max = max;
  if (o['sticky'] === true) field.sticky = true;
  if (['operator', 'company', 'site'].includes(o['autofill'] as string)) {
    field.autofill = o['autofill'] as FieldDef['autofill'];
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
  const category = CATEGORIES.includes(o['category'] as Category)
    ? (o['category'] as Category)
    : 'custom';
  return {
    id,
    name,
    description: str(o['description'], 1000) ?? undefined,
    category,
    fields,
    createdAt: num(o['createdAt']) ?? now,
    updatedAt: num(o['updatedAt']) ?? now,
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
    if (v === null || typeof v === 'boolean') clean[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) clean[k] = v;
    else if (typeof v === 'string') clean[k] = v.slice(0, 20000);
    else if (Array.isArray(v)) {
      clean[k] = v
        .filter(
          (p): p is string =>
            typeof p === 'string' &&
            p.length <= MAX_PHOTO_CHARS &&
            PHOTO_RE.test(p)
        )
        .slice(0, MAX_PHOTOS);
    }
  }
  return {
    id,
    templateId,
    createdAt: num(o['createdAt']) ?? Date.now(),
    updatedAt: num(o['updatedAt']),
    values: clean,
  };
}
