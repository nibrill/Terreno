export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'gps';

export const FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'textarea',
  'date',
  'time',
  'select',
  'checkbox',
  'gps',
];

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
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: FieldDef[];
  createdAt: number;
  updatedAt: number;
}

export type FieldValue = string | number | boolean | null;

export interface RecordEntry {
  id: string;
  templateId: string;
  createdAt: number;
  values: Record<string, FieldValue>;
}

/** Shape of a full backup file. */
export interface Backup {
  app: 'fieldlog';
  version: 1;
  exportedAt: string;
  templates: FormTemplate[];
  records: RecordEntry[];
}
