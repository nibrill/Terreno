import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'es';
export const LANGS: { code: Lang; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'app.name': 'FieldLog',
  'tab.forms': 'Forms',
  'tab.records': 'Records',
  'tab.settings': 'Settings',

  'home.title': 'My forms',
  'home.empty': 'No forms yet. Create your first one.',
  'home.new': 'New form',
  'home.records': '{n} records',
  'home.fields': '{n} fields',
  'home.edit': 'Edit form',

  'fill.saved': 'Record saved',
  'fill.save': 'Save record',
  'fill.required': 'Please complete the required fields.',
  'fill.notFound': 'Form not found.',
  'fill.useLocation': 'Use my location',
  'fill.locating': 'Locating…',
  'fill.locationError': 'Could not get your location.',
  'fill.choose': 'Choose…',

  'records.title': 'Records',
  'records.empty': 'No records yet.',
  'records.all': 'All forms',
  'records.filter': 'Form',
  'records.exportCsv': 'Export CSV',
  'records.exportXlsx': 'Export Excel',
  'records.delete': 'Delete',
  'records.deleteConfirm': 'Delete this record? This cannot be undone.',
  'records.exported': 'File exported',
  'records.yes': 'Yes',
  'records.no': 'No',
  'records.recordedAt': 'Recorded at',
  'records.unknownForm': '(deleted form)',

  'editor.titleNew': 'New form',
  'editor.titleEdit': 'Edit form',
  'editor.name': 'Form name',
  'editor.description': 'Description (optional)',
  'editor.fields': 'Fields',
  'editor.addField': 'Add field',
  'editor.label': 'Label',
  'editor.type': 'Type',
  'editor.unit': 'Unit (optional)',
  'editor.options': 'Options (one per line)',
  'editor.required': 'Required',
  'editor.save': 'Save form',
  'editor.delete': 'Delete form',
  'editor.deleteConfirm':
    'Delete this form and all of its records? This cannot be undone.',
  'editor.needName': 'Give the form a name.',
  'editor.needFields': 'Add at least one field with a label.',
  'editor.newFieldLabel': 'New field',
  'editor.moveUp': 'Move up',
  'editor.moveDown': 'Move down',
  'editor.removeField': 'Remove field',
  'editor.needOptions': 'Select fields need at least one option.',

  'type.text': 'Text',
  'type.number': 'Number',
  'type.textarea': 'Long text',
  'type.date': 'Date',
  'type.time': 'Time',
  'type.select': 'Choice list',
  'type.checkbox': 'Yes / No',
  'type.gps': 'GPS location',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.data': 'Your data',
  'settings.dataInfo':
    'Everything is stored only on this device. Use backups to move data between devices.',
  'settings.backup': 'Download backup (JSON)',
  'settings.restore': 'Restore from backup',
  'settings.restored': 'Backup restored: {t} forms, {r} records.',
  'settings.restoreError': 'That file is not a valid FieldLog backup.',
  'settings.restoreHint':
    'Restoring merges the backup with your current data. Items with the same id are overwritten.',
  'settings.reset': 'Add example forms',
  'settings.resetDone': 'Example forms added.',
  'settings.about': 'About',
  'settings.aboutText':
    'FieldLog is free, open-source software (MIT). Build forms, collect data in the field, export it anywhere.',

  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.ok': 'OK',

  // Example templates
  'tpl.gw.name': 'Groundwater level',
  'tpl.gw.desc': 'Water-level measurement in a monitoring well.',
  'tpl.gw.project': 'Project',
  'tpl.gw.well': 'Well',
  'tpl.gw.location': 'Location',
  'tpl.gw.date': 'Date',
  'tpl.gw.time': 'Time',
  'tpl.gw.inclination': 'Well inclination',
  'tpl.gw.refHeight': 'Measuring point height',
  'tpl.gw.depth': 'Depth to water below ground',
  'tpl.gw.piezometer': 'Piezometer / probe ID',
  'tpl.gw.person': 'Measured by',
  'tpl.gw.notes': 'Notes',
  'tpl.wq.name': 'Water quality sample',
  'tpl.wq.desc': 'Field parameters for a water sample.',
  'tpl.wq.site': 'Site',
  'tpl.wq.date': 'Date',
  'tpl.wq.time': 'Time',
  'tpl.wq.location': 'Location',
  'tpl.wq.ph': 'pH',
  'tpl.wq.temp': 'Temperature',
  'tpl.wq.cond': 'Conductivity',
  'tpl.wq.do': 'Dissolved oxygen',
  'tpl.wq.source': 'Sample source',
  'tpl.wq.src1': 'River',
  'tpl.wq.src2': 'Well',
  'tpl.wq.src3': 'Lake',
  'tpl.wq.src4': 'Tap',
  'tpl.wq.notes': 'Notes',
  'tpl.si.name': 'Site inspection',
  'tpl.si.desc': 'A generic checklist for visiting a site.',
  'tpl.si.site': 'Site',
  'tpl.si.date': 'Date',
  'tpl.si.location': 'Location',
  'tpl.si.inspector': 'Inspector',
  'tpl.si.condition': 'Condition',
  'tpl.si.c1': 'Good',
  'tpl.si.c2': 'Fair',
  'tpl.si.c3': 'Poor',
  'tpl.si.action': 'Action required',
  'tpl.si.notes': 'Notes',
};

const es: Dict = {
  'app.name': 'FieldLog',
  'tab.forms': 'Formularios',
  'tab.records': 'Registros',
  'tab.settings': 'Ajustes',

  'home.title': 'Mis formularios',
  'home.empty': 'Aún no hay formularios. Crea el primero.',
  'home.new': 'Nuevo formulario',
  'home.records': '{n} registros',
  'home.fields': '{n} campos',
  'home.edit': 'Editar formulario',

  'fill.saved': 'Registro guardado',
  'fill.save': 'Guardar registro',
  'fill.required': 'Completa los campos obligatorios.',
  'fill.notFound': 'Formulario no encontrado.',
  'fill.useLocation': 'Usar mi ubicación',
  'fill.locating': 'Ubicando…',
  'fill.locationError': 'No se pudo obtener tu ubicación.',
  'fill.choose': 'Elegir…',

  'records.title': 'Registros',
  'records.empty': 'Aún no hay registros.',
  'records.all': 'Todos los formularios',
  'records.filter': 'Formulario',
  'records.exportCsv': 'Exportar CSV',
  'records.exportXlsx': 'Exportar Excel',
  'records.delete': 'Eliminar',
  'records.deleteConfirm': '¿Eliminar este registro? No se puede deshacer.',
  'records.exported': 'Archivo exportado',
  'records.yes': 'Sí',
  'records.no': 'No',
  'records.recordedAt': 'Registrado el',
  'records.unknownForm': '(formulario eliminado)',

  'editor.titleNew': 'Nuevo formulario',
  'editor.titleEdit': 'Editar formulario',
  'editor.name': 'Nombre del formulario',
  'editor.description': 'Descripción (opcional)',
  'editor.fields': 'Campos',
  'editor.addField': 'Agregar campo',
  'editor.label': 'Etiqueta',
  'editor.type': 'Tipo',
  'editor.unit': 'Unidad (opcional)',
  'editor.options': 'Opciones (una por línea)',
  'editor.required': 'Obligatorio',
  'editor.save': 'Guardar formulario',
  'editor.delete': 'Eliminar formulario',
  'editor.deleteConfirm':
    '¿Eliminar este formulario y todos sus registros? No se puede deshacer.',
  'editor.needName': 'Ponle un nombre al formulario.',
  'editor.needFields': 'Agrega al menos un campo con etiqueta.',
  'editor.newFieldLabel': 'Nuevo campo',
  'editor.moveUp': 'Subir',
  'editor.moveDown': 'Bajar',
  'editor.removeField': 'Quitar campo',
  'editor.needOptions': 'Los campos de lista necesitan al menos una opción.',

  'type.text': 'Texto',
  'type.number': 'Número',
  'type.textarea': 'Texto largo',
  'type.date': 'Fecha',
  'type.time': 'Hora',
  'type.select': 'Lista de opciones',
  'type.checkbox': 'Sí / No',
  'type.gps': 'Ubicación GPS',

  'settings.title': 'Ajustes',
  'settings.language': 'Idioma',
  'settings.data': 'Tus datos',
  'settings.dataInfo':
    'Todo se guarda solo en este dispositivo. Usa los respaldos para mover datos entre dispositivos.',
  'settings.backup': 'Descargar respaldo (JSON)',
  'settings.restore': 'Restaurar desde respaldo',
  'settings.restored': 'Respaldo restaurado: {t} formularios, {r} registros.',
  'settings.restoreError': 'Ese archivo no es un respaldo válido de FieldLog.',
  'settings.restoreHint':
    'Restaurar combina el respaldo con tus datos actuales. Los elementos con el mismo id se sobrescriben.',
  'settings.reset': 'Agregar formularios de ejemplo',
  'settings.resetDone': 'Formularios de ejemplo agregados.',
  'settings.about': 'Acerca de',
  'settings.aboutText':
    'FieldLog es software libre y de código abierto (MIT). Crea formularios, recopila datos en terreno y expórtalos donde quieras.',

  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.ok': 'Aceptar',

  'tpl.gw.name': 'Nivel de agua subterránea',
  'tpl.gw.desc': 'Medición de nivel de agua en un pozo de monitoreo.',
  'tpl.gw.project': 'Proyecto',
  'tpl.gw.well': 'Pozo',
  'tpl.gw.location': 'Ubicación',
  'tpl.gw.date': 'Fecha',
  'tpl.gw.time': 'Hora',
  'tpl.gw.inclination': 'Inclinación del pozo',
  'tpl.gw.refHeight': 'Altura del punto de medición',
  'tpl.gw.depth': 'Nivel respecto al terreno',
  'tpl.gw.piezometer': 'ID del piezómetro / sonda',
  'tpl.gw.person': 'Medido por',
  'tpl.gw.notes': 'Observaciones',
  'tpl.wq.name': 'Muestra de calidad de agua',
  'tpl.wq.desc': 'Parámetros de terreno de una muestra de agua.',
  'tpl.wq.site': 'Sitio',
  'tpl.wq.date': 'Fecha',
  'tpl.wq.time': 'Hora',
  'tpl.wq.location': 'Ubicación',
  'tpl.wq.ph': 'pH',
  'tpl.wq.temp': 'Temperatura',
  'tpl.wq.cond': 'Conductividad',
  'tpl.wq.do': 'Oxígeno disuelto',
  'tpl.wq.source': 'Origen de la muestra',
  'tpl.wq.src1': 'Río',
  'tpl.wq.src2': 'Pozo',
  'tpl.wq.src3': 'Lago',
  'tpl.wq.src4': 'Grifo',
  'tpl.wq.notes': 'Observaciones',
  'tpl.si.name': 'Inspección de sitio',
  'tpl.si.desc': 'Lista de verificación genérica para visitas a terreno.',
  'tpl.si.site': 'Sitio',
  'tpl.si.date': 'Fecha',
  'tpl.si.location': 'Ubicación',
  'tpl.si.inspector': 'Inspector',
  'tpl.si.condition': 'Condición',
  'tpl.si.c1': 'Buena',
  'tpl.si.c2': 'Regular',
  'tpl.si.c3': 'Mala',
  'tpl.si.action': 'Requiere acción',
  'tpl.si.notes': 'Observaciones',
};

const DICTS: Record<Lang, Dict> = { en, es };
const LANG_KEY = 'fieldlog.lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(detectLang());

  constructor() {
    document.documentElement.lang = this.lang();
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    let text = DICTS[this.lang()][key] ?? en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v));
      }
    }
    return text;
  }
}
