import { FieldDef, FieldType, FormTemplate } from '../models';
import { newId } from './ids';

type T = (key: string) => string;

function f(
  label: string,
  type: FieldType,
  required = false,
  extra: Partial<FieldDef> = {}
): FieldDef {
  return { id: newId('f'), label, type, required, ...extra };
}

/** Example forms. `seedKey` makes ids stable so re-adding them doesn't duplicate. */
export function buildDefaultTemplates(t: T): FormTemplate[] {
  const now = Date.now();
  const mk = (
    seedKey: string,
    name: string,
    description: string,
    fields: FieldDef[]
  ): FormTemplate => ({
    id: `example-${seedKey}`,
    name,
    description,
    fields,
    createdAt: now,
    updatedAt: now,
  });

  return [
    mk('groundwater', t('tpl.gw.name'), t('tpl.gw.desc'), [
      f(t('tpl.gw.project'), 'text', true),
      f(t('tpl.gw.well'), 'text', true),
      f(t('tpl.gw.location'), 'gps'),
      f(t('tpl.gw.date'), 'date', true),
      f(t('tpl.gw.time'), 'time', true),
      f(t('tpl.gw.inclination'), 'number', false, { unit: '°' }),
      f(t('tpl.gw.refHeight'), 'number', false, { unit: 'm' }),
      f(t('tpl.gw.depth'), 'number', true, { unit: 'm' }),
      f(t('tpl.gw.piezometer'), 'text'),
      f(t('tpl.gw.person'), 'text'),
      f(t('tpl.gw.notes'), 'textarea'),
    ]),
    mk('water-quality', t('tpl.wq.name'), t('tpl.wq.desc'), [
      f(t('tpl.wq.site'), 'text', true),
      f(t('tpl.wq.date'), 'date', true),
      f(t('tpl.wq.time'), 'time'),
      f(t('tpl.wq.location'), 'gps'),
      f(t('tpl.wq.source'), 'select', false, {
        options: [
          t('tpl.wq.src1'),
          t('tpl.wq.src2'),
          t('tpl.wq.src3'),
          t('tpl.wq.src4'),
        ],
      }),
      f(t('tpl.wq.ph'), 'number'),
      f(t('tpl.wq.temp'), 'number', false, { unit: '°C' }),
      f(t('tpl.wq.cond'), 'number', false, { unit: 'µS/cm' }),
      f(t('tpl.wq.do'), 'number', false, { unit: 'mg/L' }),
      f(t('tpl.wq.notes'), 'textarea'),
    ]),
    mk('site-inspection', t('tpl.si.name'), t('tpl.si.desc'), [
      f(t('tpl.si.site'), 'text', true),
      f(t('tpl.si.date'), 'date', true),
      f(t('tpl.si.location'), 'gps'),
      f(t('tpl.si.inspector'), 'text'),
      f(t('tpl.si.condition'), 'select', true, {
        options: [t('tpl.si.c1'), t('tpl.si.c2'), t('tpl.si.c3')],
      }),
      f(t('tpl.si.action'), 'checkbox'),
      f(t('tpl.si.notes'), 'textarea'),
    ]),
  ];
}
