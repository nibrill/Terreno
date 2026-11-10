export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'gps'
  | 'photo';

export const FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'textarea',
  'date',
  'time',
  'select',
  'checkbox',
  'gps',
  'photo',
];

export type Category =
  | 'hydro'
  | 'geology'
  | 'geotech'
  | 'env'
  | 'safety'
  | 'ops'
  | 'custom';

export const CATEGORIES: Category[] = [
  'hydro',
  'geology',
  'geotech',
  'env',
  'safety',
  'ops',
  'custom',
];

/** Values a text field can be pre-filled with from the user's profile. */
export type Autofill = 'operator' | 'company' | 'site';

export interface FieldDef {
  /** Stable key, never shown to the user. */
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  /** Optional unit, shown next to the label and in exports (e.g. "m", "°C"). */
  unit?: string;
  /** Choices for `select` fields. */
  options?: string[];
  /** Soft limits for numbers: out-of-range values ask for confirmation. */
  min?: number;
  max?: number;
  /** Keep the last value when starting a new record (project, operator…). */
  sticky?: boolean;
  /** Pre-fill a text field from the profile. */
  autofill?: Autofill;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: Category;
  fields: FieldDef[];
  createdAt: number;
  updatedAt: number;
}

/** Photos are stored as compressed data URLs. */
export type FieldValue = string | number | boolean | string[] | null;

export interface RecordEntry {
  id: string;
  templateId: string;
  createdAt: number;
  updatedAt?: number;
  values: Record<string, FieldValue>;
}

export interface Profile {
  operator: string;
  company: string;
  site: string;
}

/** Shape of a full backup file. */
export interface Backup {
  app: 'fieldlog';
  version: 1 | 2;
  exportedAt: string;
  templates: FormTemplate[];
  records: RecordEntry[];
}
