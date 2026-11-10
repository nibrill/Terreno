import { Category, FieldDef, FieldType, FormTemplate } from '../models';
import { Lang } from './i18n';
import { newId } from './ids';

type L = [es: string, en: string];

interface FieldSpec {
  l: L;
  type: FieldType;
  required?: boolean;
  unit?: string;
  options?: L[];
  min?: number;
  max?: number;
  sticky?: boolean;
  autofill?: FieldDef['autofill'];
}

export interface Preset {
  key: string;
  category: Category;
  name: L;
  description: L;
  /** Seeded on first launch. */
  starter?: boolean;
  fields: FieldSpec[];
}

const f = (
  l: L,
  type: FieldType,
  o: Omit<FieldSpec, 'l' | 'type'> = {}
): FieldSpec => ({ l, type, ...o });

const operator = f(['Registrado por', 'Recorded by'], 'text', {
  autofill: 'operator',
  sticky: true,
});
const site = f(['Faena / Proyecto', 'Site / Project'], 'text', {
  required: true,
  autofill: 'site',
  sticky: true,
});
const date = f(['Fecha', 'Date'], 'date', { required: true });
const time = f(['Hora', 'Time'], 'time');
const place = f(['Ubicación', 'Location'], 'gps');
const photos = f(['Fotos', 'Photos'], 'photo');
const notes = f(['Observaciones', 'Notes'], 'textarea');

export const PRESETS: Preset[] = [
  // ───────────── Hidrogeología ─────────────
  {
    key: 'gw-level',
    category: 'hydro',
    starter: true,
    name: ['Nivel freático', 'Groundwater level'],
    description: [
      'Medición de nivel de agua en pozos de monitoreo y piezómetros.',
      'Water-level measurement in monitoring wells and piezometers.',
    ],
    fields: [
      site,
      f(['Pozo / Piezómetro', 'Well / Piezometer'], 'text', { required: true }),
      place,
      date,
      time,
      f(['Inclinación del pozo', 'Well inclination'], 'number', { unit: '°', min: 0, max: 90 }),
      f(['Altura punto de medición', 'Measuring point height'], 'number', { unit: 'm' }),
      f(['Nivel respecto al terreno', 'Depth to water below ground'], 'number', {
        unit: 'mbnt',
        required: true,
        min: 0,
        max: 2000,
      }),
      f(['Sonda / Piezómetro N°', 'Probe / Piezometer ID'], 'text'),
      f(['Estado del pozo', 'Well condition'], 'select', {
        options: [
          ['Operativo', 'Operational'],
          ['Obstruido', 'Obstructed'],
          ['Dañado', 'Damaged'],
          ['Sin acceso', 'No access'],
          ['Seco', 'Dry'],
        ],
      }),
      operator,
      photos,
      notes,
    ],
  },
  {
    key: 'water-quality',
    category: 'hydro',
    starter: true,
    name: ['Calidad de agua in situ', 'In-situ water quality'],
    description: [
      'Parámetros de terreno de una muestra de agua (pH, CE, T°, OD).',
      'Field parameters of a water sample (pH, EC, temperature, DO).',
    ],
    fields: [
      site,
      f(['Punto de muestreo', 'Sampling point'], 'text', { required: true }),
      place,
      date,
      time,
      f(['Tipo de punto', 'Point type'], 'select', {
        options: [
          ['Pozo', 'Well'],
          ['Vertiente', 'Spring'],
          ['Río / Estero', 'River / Stream'],
          ['Laguna / Salar', 'Lake / Salar'],
          ['Descarga / Efluente', 'Discharge / Effluent'],
          ['Otro', 'Other'],
        ],
      }),
      f(['pH', 'pH'], 'number', { min: 0, max: 14 }),
      f(['Temperatura', 'Temperature'], 'number', { unit: '°C', min: -5, max: 100 }),
      f(['Conductividad eléctrica', 'Electrical conductivity'], 'number', { unit: 'µS/cm', min: 0 }),
      f(['Oxígeno disuelto', 'Dissolved oxygen'], 'number', { unit: 'mg/L', min: 0, max: 30 }),
      f(['Potencial redox (ORP)', 'Redox potential (ORP)'], 'number', { unit: 'mV' }),
      f(['Turbidez', 'Turbidity'], 'number', { unit: 'NTU', min: 0 }),
      f(['Código de muestra / cadena de custodia', 'Sample code / chain of custody'], 'text'),
      operator,
      photos,
      notes,
    ],
  },
  {
    key: 'flow-gauging',
    category: 'hydro',
    name: ['Aforo de caudal', 'Flow gauging'],
    description: [
      'Medición de caudal en vertientes, canales y ríos.',
      'Flow measurement in springs, canals and rivers.',
    ],
    fields: [
      site,
      f(['Punto de aforo', 'Gauging point'], 'text', { required: true }),
      place,
      date,
      time,
      f(['Método', 'Method'], 'select', {
        options: [
          ['Volumétrico', 'Volumetric'],
          ['Flotador', 'Float'],
          ['Molinete', 'Current meter'],
          ['Vertedero', 'Weir'],
          ['ADCP', 'ADCP'],
        ],
      }),
      f(['Caudal', 'Flow'], 'number', { unit: 'L/s', required: true, min: 0 }),
      f(['Ancho de sección', 'Section width'], 'number', { unit: 'm', min: 0 }),
      f(['Profundidad media', 'Mean depth'], 'number', { unit: 'm', min: 0 }),
      operator,
      photos,
      notes,
    ],
  },
  {
    key: 'pump-test',
    category: 'hydro',
    name: ['Prueba de bombeo', 'Pumping test'],
    description: [
      'Una lectura por registro: tiempo, caudal y nivel dinámico.',
      'One reading per record: time, rate and drawdown level.',
    ],
    fields: [
      site,
      f(['Pozo', 'Well'], 'text', { required: true, sticky: true }),
      date,
      time,
      f(['Tiempo desde inicio', 'Time since start'], 'number', { unit: 'min', required: true, min: 0 }),
      f(['Caudal de bombeo', 'Pumping rate'], 'number', { unit: 'L/s', min: 0 }),
      f(['Nivel dinámico', 'Dynamic water level'], 'number', { unit: 'mbnt', required: true, min: 0 }),
      operator,
      notes,
    ],
  },

  // ───────────── Geología ─────────────
  {
    key: 'drill-log',
    category: 'geology',
    name: ['Logueo de sondaje', 'Drill core log'],
    description: [
      'Descripción de testigos por intervalo: litología, alteración, RQD.',
      'Core description per interval: lithology, alteration, RQD.',
    ],
    fields: [
      site,
      f(['Sondaje', 'Drillhole'], 'text', { required: true, sticky: true }),
      date,
      f(['Desde', 'From'], 'number', { unit: 'm', required: true, min: 0 }),
      f(['Hasta', 'To'], 'number', { unit: 'm', required: true, min: 0 }),
      f(['Litología', 'Lithology'], 'select', {
        options: [
          ['Andesita', 'Andesite'],
          ['Granodiorita', 'Granodiorite'],
          ['Diorita', 'Diorite'],
          ['Brecha', 'Breccia'],
          ['Pórfido', 'Porphyry'],
          ['Sedimentaria', 'Sedimentary'],
          ['Gravas / Sobrecarga', 'Gravel / Overburden'],
        ],
      }),
      f(['Alteración', 'Alteration'], 'select', {
        options: [
          ['Potásica', 'Potassic'],
          ['Fílica', 'Phyllic'],
          ['Propilítica', 'Propylitic'],
          ['Argílica', 'Argillic'],
          ['Silicificación', 'Silicification'],
          ['Sin alteración', 'None'],
        ],
      }),
      f(['Mineralización', 'Mineralization'], 'select', {
        options: [
          ['Calcopirita', 'Chalcopyrite'],
          ['Bornita', 'Bornite'],
          ['Calcosina', 'Chalcocite'],
          ['Pirita', 'Pyrite'],
          ['Óxidos de cobre', 'Copper oxides'],
          ['Estéril', 'Barren'],
        ],
      }),
      f(['RQD', 'RQD'], 'number', { unit: '%', min: 0, max: 100 }),
      f(['Recuperación', 'Recovery'], 'number', { unit: '%', min: 0, max: 100 }),
      f(['Descripción', 'Description'], 'textarea'),
      operator,
      photos,
    ],
  },
  {
    key: 'geo-map',
    category: 'geology',
    name: ['Mapeo geológico', 'Geological mapping'],
    description: [
      'Estaciones de afloramiento con estructuras y muestras.',
      'Outcrop stations with structures and samples.',
    ],
    fields: [
      site,
      f(['Estación', 'Station'], 'text', { required: true }),
      place,
      date,
      f(['Litología', 'Lithology'], 'text'),
      f(['Rumbo', 'Strike'], 'number', { unit: '°', min: 0, max: 360 }),
      f(['Manteo', 'Dip'], 'number', { unit: '°', min: 0, max: 90 }),
      f(['Código de muestra', 'Sample code'], 'text'),
      f(['Descripción', 'Description'], 'textarea'),
      operator,
      photos,
    ],
  },

  // ───────────── Geotecnia ─────────────
  {
    key: 'geotech-map',
    category: 'geotech',
    name: ['Mapeo geotécnico', 'Geotechnical mapping'],
    description: [
      'Discontinuidades en banco o talud: orientación, persistencia, apertura.',
      'Discontinuities on bench or slope: orientation, persistence, aperture.',
    ],
    fields: [
      site,
      f(['Estación / Banco', 'Station / Bench'], 'text', { required: true }),
      place,
      date,
      f(['Rumbo', 'Strike'], 'number', { unit: '°', min: 0, max: 360 }),
      f(['Manteo', 'Dip'], 'number', { unit: '°', min: 0, max: 90 }),
      f(['Persistencia', 'Persistence'], 'number', { unit: 'm', min: 0 }),
      f(['Apertura', 'Aperture'], 'number', { unit: 'mm', min: 0 }),
      f(['Rugosidad', 'Roughness'], 'select', {
        options: [
          ['Rugosa', 'Rough'],
          ['Lisa', 'Smooth'],
          ['Pulida', 'Slickensided'],
        ],
      }),
      f(['Relleno', 'Infill'], 'select', {
        options: [
          ['Sin relleno', 'None'],
          ['Duro', 'Hard'],
          ['Blando', 'Soft'],
        ],
      }),
      f(['Presencia de agua', 'Water presence'], 'select', {
        options: [
          ['Seco', 'Dry'],
          ['Húmedo', 'Damp'],
          ['Goteo', 'Dripping'],
          ['Flujo', 'Flowing'],
        ],
      }),
      f(['RMR estimado', 'Estimated RMR'], 'number', { min: 0, max: 100 }),
      operator,
      photos,
      notes,
    ],
  },
  {
    key: 'tailings-inspection',
    category: 'geotech',
    name: ['Inspección de tranque / botadero', 'Tailings / dump inspection'],
    description: [
      'Ronda de inspección visual de muro, laguna y drenajes.',
      'Visual round of wall, pond and drains.',
    ],
    fields: [
      site,
      f(['Instalación', 'Facility'], 'text', { required: true, sticky: true }),
      place,
      date,
      time,
      f(['Revancha (borde libre)', 'Freeboard'], 'number', { unit: 'm', min: 0 }),
      f(['Grietas o asentamientos', 'Cracks or settlement'], 'checkbox'),
      f(['Filtraciones', 'Seepage'], 'checkbox'),
      f(['Erosión', 'Erosion'], 'checkbox'),
      f(['Drenajes obstruidos', 'Blocked drains'], 'checkbox'),
      f(['Condición general', 'Overall condition'], 'select', {
        required: true,
        options: [
          ['Normal', 'Normal'],
          ['Observación', 'Watch'],
          ['Alerta', 'Alert'],
          ['Alarma', 'Alarm'],
        ],
      }),
      operator,
      photos,
      notes,
    ],
  },

  // ───────────── Medio ambiente ─────────────
  {
    key: 'env-monitoring',
    category: 'env',
    name: ['Monitoreo ambiental (ruido y polvo)', 'Environmental monitoring (noise & dust)'],
    description: [
      'Ruido, material particulado y condiciones meteorológicas.',
      'Noise, particulate matter and weather conditions.',
    ],
    fields: [
      site,
      f(['Estación / Receptor', 'Station / Receptor'], 'text', { required: true }),
      place,
      date,
      time,
      f(['Ruido', 'Noise'], 'number', { unit: 'dB(A)', min: 0, max: 150 }),
      f(['PM10', 'PM10'], 'number', { unit: 'µg/m³', min: 0 }),
      f(['PM2.5', 'PM2.5'], 'number', { unit: 'µg/m³', min: 0 }),
      f(['Velocidad del viento', 'Wind speed'], 'number', { unit: 'm/s', min: 0 }),
      f(['Temperatura ambiente', 'Ambient temperature'], 'number', { unit: '°C' }),
      operator,
      photos,
      notes,
    ],
  },
  {
    key: 'spill-report',
    category: 'env',
    name: ['Reporte de derrame', 'Spill report'],
    description: [
      'Registro de derrames de hidrocarburos o sustancias.',
      'Record of hydrocarbon or substance spills.',
    ],
    fields: [
      site,
      date,
      time,
      place,
      f(['Sustancia', 'Substance'], 'text', { required: true }),
      f(['Volumen estimado', 'Estimated volume'], 'number', { unit: 'L', min: 0 }),
      f(['Llegó a suelo o agua', 'Reached soil or water'], 'checkbox'),
      f(['Contención aplicada', 'Containment applied'], 'checkbox'),
      f(['Descripción', 'Description'], 'textarea', { required: true }),
      operator,
      photos,
    ],
  },

  // ───────────── Seguridad ─────────────
  {
    key: 'incident-report',
    category: 'safety',
    starter: true,
    name: ['Reporte de incidente / condición', 'Incident / hazard report'],
    description: [
      'Incidentes, cuasi accidentes y condiciones o actos subestándar.',
      'Incidents, near misses and substandard conditions or acts.',
    ],
    fields: [
      site,
      date,
      time,
      place,
      f(['Tipo de evento', 'Event type'], 'select', {
        required: true,
        options: [
          ['Incidente', 'Incident'],
          ['Cuasi accidente', 'Near miss'],
          ['Condición subestándar', 'Substandard condition'],
          ['Acto subestándar', 'Substandard act'],
        ],
      }),
      f(['Nivel de riesgo', 'Risk level'], 'select', {
        required: true,
        options: [
          ['Bajo', 'Low'],
          ['Medio', 'Medium'],
          ['Alto', 'High'],
          ['Crítico', 'Critical'],
        ],
      }),
      f(['Área', 'Area'], 'text'),
      f(['Descripción', 'Description'], 'textarea', { required: true }),
      f(['Acción inmediata', 'Immediate action'], 'textarea'),
      operator,
      photos,
    ],
  },
  {
    key: 'toolbox-talk',
    category: 'safety',
    name: ['Charla de seguridad (5 minutos)', 'Safety talk (toolbox)'],
    description: [
      'Charla de inicio de turno.',
      'Start-of-shift safety talk.',
    ],
    fields: [
      site,
      date,
      time,
      f(['Área / Frente', 'Area / Front'], 'text'),
      f(['Tema', 'Topic'], 'text', { required: true }),
      f(['Expositor', 'Presenter'], 'text', { autofill: 'operator', sticky: true }),
      f(['N° de asistentes', 'Attendees'], 'number', { min: 0 }),
      notes,
    ],
  },

  // ───────────── Operaciones ─────────────
  {
    key: 'vehicle-check',
    category: 'ops',
    name: ['Check list pre-uso (vehículo / equipo)', 'Pre-use checklist (vehicle / equipment)'],
    description: [
      'Verificación antes de operar camionetas, camiones o equipos.',
      'Check before operating pickups, trucks or equipment.',
    ],
    fields: [
      site,
      f(['Equipo / Patente', 'Equipment / Plate'], 'text', { required: true, sticky: true }),
      date,
      time,
      f(['Horómetro / Kilometraje', 'Hour meter / Odometer'], 'number', { min: 0 }),
      f(['Frenos', 'Brakes'], 'checkbox'),
      f(['Luces y baliza', 'Lights and beacon'], 'checkbox'),
      f(['Neumáticos', 'Tyres'], 'checkbox'),
      f(['Niveles (aceite, agua)', 'Fluids (oil, coolant)'], 'checkbox'),
      f(['Extintor y botiquín', 'Extinguisher and first aid'], 'checkbox'),
      f(['Cinturón y alarma de retroceso', 'Seat belt and reverse alarm'], 'checkbox'),
      f(['Apto para operar', 'Fit to operate'], 'checkbox'),
      operator,
      photos,
      notes,
    ],
  },
];

export function presetName(p: Preset, lang: Lang): string {
  return p.name[lang === 'es' ? 0 : 1];
}

/** Stable id so a library form can be added only once. */
export const presetId = (key: string) => `lib-${key}`;

export function buildFromPreset(p: Preset, lang: Lang): FormTemplate {
  const i = lang === 'es' ? 0 : 1;
  const now = Date.now();
  return {
    id: presetId(p.key),
    name: p.name[i],
    description: p.description[i],
    category: p.category,
    createdAt: now,
    updatedAt: now,
    fields: p.fields.map((s) => {
      const def: FieldDef = {
        id: newId('f'),
        label: s.l[i],
        type: s.type,
        required: s.required === true,
      };
      if (s.unit) def.unit = s.unit;
      if (s.options) def.options = s.options.map((o) => o[i]);
      if (s.min !== undefined) def.min = s.min;
      if (s.max !== undefined) def.max = s.max;
      if (s.sticky) def.sticky = true;
      if (s.autofill) def.autofill = s.autofill;
      return def;
    }),
  };
}
