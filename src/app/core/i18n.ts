import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'es';
export const LANGS: { code: Lang; name: string }[] = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

type Dict = Record<string, string>;

const es: Dict = {
  'app.name': 'Terreno',
  'app.tagline': 'Datos de terreno para minería',
  'tab.forms': 'Formularios',
  'tab.records': 'Registros',
  'tab.charts': 'Gráficos',
  'tab.settings': 'Ajustes',

  'cat.hydro': 'Hidrogeología',
  'cat.geology': 'Geología',
  'cat.geotech': 'Geotecnia',
  'cat.env': 'Medio ambiente',
  'cat.safety': 'Seguridad',
  'cat.ops': 'Operaciones',
  'cat.custom': 'Personalizado',

  'home.title': 'Formularios',
  'home.search': 'Buscar formulario…',
  'home.all': 'Todos',
  'home.empty': 'Aún no tienes formularios.',
  'home.emptyHint': 'Agrega formularios listos desde la biblioteca o crea uno propio.',
  'home.noMatch': 'Ningún formulario coincide.',
  'home.library': 'Biblioteca',
  'home.new': 'Nuevo formulario',
  'home.fields': '{n} campos',
  'home.fields.one': '1 campo',
  'home.records': '{n} registros',
  'home.records.one': '1 registro',
  'home.edit': 'Editar formulario',
  'home.storageWarn':
    'Este navegador no permite guardar datos en el dispositivo. Los registros se perderán al cerrar la app.',

  'lib.title': 'Biblioteca de formularios',
  'lib.intro':
    'Formularios listos para faenas mineras en Chile. Agrégalos y adáptalos a tu operación.',
  'lib.add': 'Agregar',
  'lib.added': 'Agregado',
  'lib.addedToast': 'Formulario agregado',

  'fill.save': 'Guardar registro',
  'fill.update': 'Guardar cambios',
  'fill.saved': 'Registro guardado',
  'fill.updated': 'Cambios guardados',
  'fill.required': 'Completa los campos obligatorios.',
  'fill.notFound': 'Formulario no encontrado.',
  'fill.useLocation': 'Usar mi ubicación',
  'fill.locationError': 'No se pudo obtener la ubicación. Revisa los permisos del GPS.',
  'fill.locationOk': 'Ubicación obtenida (±{m} m)',
  'fill.choose': 'Elegir…',
  'fill.addPhoto': 'Agregar foto',
  'fill.photoError': 'No se pudo procesar la imagen.',
  'fill.photoLimit': 'Máximo {n} fotos por campo.',
  'fill.removePhoto': 'Quitar foto',
  'fill.outOfRange': '{label}: {v} está fuera del rango habitual ({min} – {max}). ¿Guardar de todos modos?',
  'fill.review': 'Revisar',
  'fill.saveAnyway': 'Guardar igual',
  'fill.copyOf': 'Copia de un registro anterior',
  'fill.gpsHint': 'lat, lon (grados decimales)',

  'records.title': 'Registros',
  'records.search': 'Buscar en registros…',
  'records.empty': 'Aún no hay registros.',
  'records.noMatch': 'Ningún registro coincide.',
  'records.all': 'Todos los formularios',
  'records.filter': 'Formulario',
  'records.exportCsv': 'Exportar CSV',
  'records.exportXlsx': 'Exportar Excel',
  'records.delete': 'Eliminar',
  'records.edit': 'Editar',
  'records.duplicate': 'Duplicar',
  'records.deleteConfirm': '¿Eliminar este registro? No se puede deshacer.',
  'records.exported': 'Archivo exportado',
  'records.yes': 'Sí',
  'records.no': 'No',
  'records.recordedAt': 'Registrado el',
  'records.unknownForm': '(formulario eliminado)',
  'records.count': '{n} registros',
  'records.count.one': '1 registro',
  'records.photos': 'foto(s)',
  'records.utmNorth': 'Norte UTM',
  'records.utmEast': 'Este UTM',
  'records.utmZone': 'Huso',
  'records.edited': 'editado',
  'records.close': 'Cerrar',

  'chart.title': 'Gráficos',
  'chart.form': 'Formulario',
  'chart.field': 'Variable',
  'chart.series': 'Agrupar por',
  'chart.none': 'Sin agrupar',
  'chart.invert': 'Invertir eje (profundidad)',
  'chart.empty': 'Necesitas al menos 2 registros con datos numéricos para graficar.',
  'chart.noNumeric': 'Este formulario no tiene campos numéricos.',
  'chart.noForms': 'Crea un formulario con campos numéricos para ver gráficos.',
  'chart.points': '{n} puntos',

  'editor.titleNew': 'Nuevo formulario',
  'editor.titleEdit': 'Editar formulario',
  'editor.name': 'Nombre del formulario',
  'editor.description': 'Descripción (opcional)',
  'editor.category': 'Categoría',
  'editor.fields': 'Campos',
  'editor.addField': 'Agregar campo',
  'editor.label': 'Etiqueta',
  'editor.type': 'Tipo',
  'editor.unit': 'Unidad (opcional)',
  'editor.min': 'Mínimo habitual',
  'editor.max': 'Máximo habitual',
  'editor.options': 'Opciones (una por línea)',
  'editor.required': 'Obligatorio',
  'editor.sticky': 'Recordar último valor',
  'editor.autofill': 'Rellenar desde mi perfil',
  'editor.autofillNone': 'No rellenar',
  'editor.save': 'Guardar',
  'editor.delete': 'Eliminar formulario',
  'editor.deleteConfirm':
    '¿Eliminar este formulario y todos sus registros? No se puede deshacer.',
  'editor.needName': 'Ponle un nombre al formulario.',
  'editor.needFields': 'Agrega al menos un campo con etiqueta.',
  'editor.moveUp': 'Subir',
  'editor.moveDown': 'Bajar',
  'editor.removeField': 'Quitar campo',
  'editor.needOptions': 'Los campos de lista necesitan al menos una opción.',
  'autofill.operator': 'Mi nombre',
  'autofill.company': 'Empresa',
  'autofill.site': 'Faena / Proyecto',

  'type.text': 'Texto',
  'type.number': 'Número',
  'type.textarea': 'Texto largo',
  'type.date': 'Fecha',
  'type.time': 'Hora',
  'type.select': 'Lista de opciones',
  'type.checkbox': 'Sí / No',
  'type.gps': 'Ubicación GPS (con UTM)',
  'type.photo': 'Fotos',

  'settings.title': 'Ajustes',
  'settings.profile': 'Mi perfil',
  'settings.profileInfo':
    'Se usa para rellenar automáticamente los formularios (nombre, empresa y faena).',
  'settings.operator': 'Mi nombre',
  'settings.company': 'Empresa',
  'settings.site': 'Faena / Proyecto',
  'settings.language': 'Idioma',
  'settings.data': 'Tus datos',
  'settings.dataInfo':
    'Todo se guarda solo en este dispositivo, incluso sin señal. Descarga respaldos con frecuencia: si borras los datos del navegador, se pierden.',
  'settings.backup': 'Descargar respaldo (JSON)',
  'settings.restore': 'Restaurar desde respaldo',
  'settings.restored': 'Respaldo restaurado: {t} formularios, {r} registros.',
  'settings.restoreError': 'Ese archivo no es un respaldo válido de Terreno.',
  'settings.restoreHint':
    'Restaurar combina el respaldo con tus datos actuales. Los elementos con el mismo id se sobrescriben.',
  'settings.profileSaved': 'Perfil guardado',
  'settings.about': 'Acerca de',
  'settings.aboutText':
    'Terreno es software libre y de código abierto (MIT) para recopilar datos en terreno en faenas mineras: hidrogeología, geología, geotecnia, medio ambiente, seguridad y operaciones. Coordenadas UTM sobre WGS84/SIRGAS.',
  'settings.version': 'Versión {v}',

  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.ok': 'Aceptar',
};

const en: Dict = {
  'app.name': 'Terreno',
  'app.tagline': 'Field data for mining',
  'tab.forms': 'Forms',
  'tab.records': 'Records',
  'tab.charts': 'Charts',
  'tab.settings': 'Settings',

  'cat.hydro': 'Hydrogeology',
  'cat.geology': 'Geology',
  'cat.geotech': 'Geotechnics',
  'cat.env': 'Environment',
  'cat.safety': 'Safety',
  'cat.ops': 'Operations',
  'cat.custom': 'Custom',

  'home.title': 'Forms',
  'home.search': 'Search forms…',
  'home.all': 'All',
  'home.empty': 'You have no forms yet.',
  'home.emptyHint': 'Add ready-made forms from the library or create your own.',
  'home.noMatch': 'No forms match.',
  'home.library': 'Library',
  'home.new': 'New form',
  'home.fields': '{n} fields',
  'home.fields.one': '1 field',
  'home.records': '{n} records',
  'home.records.one': '1 record',
  'home.edit': 'Edit form',
  'home.storageWarn':
    'This browser does not allow saving data on the device. Records will be lost when you close the app.',

  'lib.title': 'Form library',
  'lib.intro':
    'Ready-made forms for mining operations. Add them and adapt them to your site.',
  'lib.add': 'Add',
  'lib.added': 'Added',
  'lib.addedToast': 'Form added',

  'fill.save': 'Save record',
  'fill.update': 'Save changes',
  'fill.saved': 'Record saved',
  'fill.updated': 'Changes saved',
  'fill.required': 'Please complete the required fields.',
  'fill.notFound': 'Form not found.',
  'fill.useLocation': 'Use my location',
  'fill.locationError': 'Could not get the location. Check GPS permissions.',
  'fill.locationOk': 'Location acquired (±{m} m)',
  'fill.choose': 'Choose…',
  'fill.addPhoto': 'Add photo',
  'fill.photoError': 'Could not process the image.',
  'fill.photoLimit': 'Maximum {n} photos per field.',
  'fill.removePhoto': 'Remove photo',
  'fill.outOfRange': '{label}: {v} is outside the usual range ({min} – {max}). Save anyway?',
  'fill.review': 'Review',
  'fill.saveAnyway': 'Save anyway',
  'fill.copyOf': 'Copy of a previous record',
  'fill.gpsHint': 'lat, lon (decimal degrees)',

  'records.title': 'Records',
  'records.search': 'Search records…',
  'records.empty': 'No records yet.',
  'records.noMatch': 'No records match.',
  'records.all': 'All forms',
  'records.filter': 'Form',
  'records.exportCsv': 'Export CSV',
  'records.exportXlsx': 'Export Excel',
  'records.delete': 'Delete',
  'records.edit': 'Edit',
  'records.duplicate': 'Duplicate',
  'records.deleteConfirm': 'Delete this record? This cannot be undone.',
  'records.exported': 'File exported',
  'records.yes': 'Yes',
  'records.no': 'No',
  'records.recordedAt': 'Recorded at',
  'records.unknownForm': '(deleted form)',
  'records.count': '{n} records',
  'records.count.one': '1 record',
  'records.photos': 'photo(s)',
  'records.utmNorth': 'UTM North',
  'records.utmEast': 'UTM East',
  'records.utmZone': 'Zone',
  'records.edited': 'edited',
  'records.close': 'Close',

  'chart.title': 'Charts',
  'chart.form': 'Form',
  'chart.field': 'Variable',
  'chart.series': 'Group by',
  'chart.none': 'No grouping',
  'chart.invert': 'Invert axis (depth)',
  'chart.empty': 'You need at least 2 records with numeric data to plot.',
  'chart.noNumeric': 'This form has no numeric fields.',
  'chart.noForms': 'Create a form with numeric fields to see charts.',
  'chart.points': '{n} points',

  'editor.titleNew': 'New form',
  'editor.titleEdit': 'Edit form',
  'editor.name': 'Form name',
  'editor.description': 'Description (optional)',
  'editor.category': 'Category',
  'editor.fields': 'Fields',
  'editor.addField': 'Add field',
  'editor.label': 'Label',
  'editor.type': 'Type',
  'editor.unit': 'Unit (optional)',
  'editor.min': 'Usual minimum',
  'editor.max': 'Usual maximum',
  'editor.options': 'Options (one per line)',
  'editor.required': 'Required',
  'editor.sticky': 'Remember last value',
  'editor.autofill': 'Fill from my profile',
  'editor.autofillNone': "Don't fill",
  'editor.save': 'Save',
  'editor.delete': 'Delete form',
  'editor.deleteConfirm':
    'Delete this form and all of its records? This cannot be undone.',
  'editor.needName': 'Give the form a name.',
  'editor.needFields': 'Add at least one field with a label.',
  'editor.moveUp': 'Move up',
  'editor.moveDown': 'Move down',
  'editor.removeField': 'Remove field',
  'editor.needOptions': 'Select fields need at least one option.',
  'autofill.operator': 'My name',
  'autofill.company': 'Company',
  'autofill.site': 'Site / Project',

  'type.text': 'Text',
  'type.number': 'Number',
  'type.textarea': 'Long text',
  'type.date': 'Date',
  'type.time': 'Time',
  'type.select': 'Choice list',
  'type.checkbox': 'Yes / No',
  'type.gps': 'GPS location (with UTM)',
  'type.photo': 'Photos',

  'settings.title': 'Settings',
  'settings.profile': 'My profile',
  'settings.profileInfo':
    'Used to pre-fill forms automatically (name, company and site).',
  'settings.operator': 'My name',
  'settings.company': 'Company',
  'settings.site': 'Site / Project',
  'settings.language': 'Language',
  'settings.data': 'Your data',
  'settings.dataInfo':
    'Everything is stored only on this device, even without signal. Download backups often: clearing browser data deletes it.',
  'settings.backup': 'Download backup (JSON)',
  'settings.restore': 'Restore from backup',
  'settings.restored': 'Backup restored: {t} forms, {r} records.',
  'settings.restoreError': 'That file is not a valid Terreno backup.',
  'settings.restoreHint':
    'Restoring merges the backup with your current data. Items with the same id are overwritten.',
  'settings.profileSaved': 'Profile saved',
  'settings.about': 'About',
  'settings.aboutText':
    'Terreno is free, open-source software (MIT) for collecting field data at mine sites: hydrogeology, geology, geotechnics, environment, safety and operations. UTM coordinates on WGS84/SIRGAS.',
  'settings.version': 'Version {v}',

  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.ok': 'OK',
};

const DICTS: Record<Lang, Dict> = { en, es };
const LANG_KEY = 'fieldlog.lang';

/** Spanish by default (Chile); English only if the device asks for it. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
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
    const d = DICTS[this.lang()];
    const k = params?.['n'] === 1 && d[key + '.one'] ? key + '.one' : key;
    let text = d[k] ?? es[k] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v));
      }
    }
    return text;
  }
}
