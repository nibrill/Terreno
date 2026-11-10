import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { fieldHeader } from '../core/export';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';
import { FieldDef, FormTemplate, RecordEntry } from '../models';

const COLORS = [
  '#e8730c',
  '#1e88e5',
  '#43a047',
  '#8e24aa',
  '#e53935',
  '#00897b',
  '#6d4c41',
  '#546e7a',
];

interface Pt {
  t: number;
  v: number;
}
interface Series {
  name: string;
  color: string;
  pts: Pt[];
}

/** Date+time of the measurement if the form has them, else when it was saved. */
function recordTime(tpl: FormTemplate, r: RecordEntry): number {
  const d = tpl.fields.find((f) => f.type === 'date');
  const t = tpl.fields.find((f) => f.type === 'time');
  const dv = d ? r.values[d.id] : null;
  if (typeof dv === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dv)) {
    const tv = t ? r.values[t.id] : null;
    const iso = `${dv}T${typeof tv === 'string' && /^\d{2}:\d{2}$/.test(tv) ? tv : '12:00'}`;
    const ms = new Date(iso).getTime();
    if (Number.isFinite(ms)) return ms;
  }
  return r.createdAt;
}

function niceTicks(min: number, max: number, n = 5): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    out.push(Number(v.toFixed(10)));
  }
  return out;
}

const W = 640;
const H = 340;
const M = { l: 56, r: 14, t: 14, b: 34 };

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>{{ i18n.t('chart.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="wrap">
        @if (formsWithNumbers().length === 0) {
          <p class="empty">{{ i18n.t('chart.noForms') }}</p>
        } @else {
          <ion-item>
            <ion-select
              [label]="i18n.t('chart.form')"
              [value]="tplId()"
              (ionChange)="tplId.set($event.detail.value)"
            >
              @for (t of formsWithNumbers(); track t.id) {
                <ion-select-option [value]="t.id">{{ t.name }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select
              [label]="i18n.t('chart.field')"
              [value]="fieldId()"
              (ionChange)="fieldId.set($event.detail.value)"
            >
              @for (f of numberFields(); track f.id) {
                <ion-select-option [value]="f.id">{{ header(f) }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select
              [label]="i18n.t('chart.series')"
              [value]="seriesId()"
              (ionChange)="seriesId.set($event.detail.value)"
            >
              <ion-select-option value="">{{ i18n.t('chart.none') }}</ion-select-option>
              @for (f of groupFields(); track f.id) {
                <ion-select-option [value]="f.id">{{ f.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-toggle
              [checked]="invert()"
              (ionChange)="invert.set($event.detail.checked)"
              justify="space-between"
            >
              {{ i18n.t('chart.invert') }}
            </ion-toggle>
          </ion-item>

          @if (view(); as v) {
            <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="chart" role="img">
              @for (y of v.yTicks; track y.label) {
                <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="y.pos" [attr.y2]="y.pos" class="grid" />
                <text [attr.x]="M.l - 8" [attr.y]="y.pos + 4" text-anchor="end" class="tick">
                  {{ y.label }}
                </text>
              }
              @for (x of v.xTicks; track x.label) {
                <text
                  [attr.x]="x.pos"
                  [attr.y]="H - 10"
                  [attr.text-anchor]="x.anchor"
                  class="tick"
                >
                  {{ x.label }}
                </text>
              }
              <line [attr.x1]="M.l" [attr.x2]="M.l" [attr.y1]="M.t" [attr.y2]="H - M.b" class="axis" />
              <line [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="H - M.b" [attr.y2]="H - M.b" class="axis" />
              @for (s of v.series; track s.name) {
                <polyline [attr.points]="s.path" [attr.stroke]="s.color" fill="none" stroke-width="2" />
                @for (p of s.dots; track $index) {
                  <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" [attr.fill]="s.color">
                    <title>{{ p.tip }}</title>
                  </circle>
                }
              }
            </svg>
            <div class="legend">
              @for (s of v.series; track s.name) {
                <span><i [style.background]="s.color"></i>{{ s.name }}</span>
              }
              <span class="pts">{{ i18n.t('chart.points', { n: v.count }) }}</span>
            </div>
          } @else {
            <p class="empty">{{ numberFields().length ? i18n.t('chart.empty') : i18n.t('chart.noNumeric') }}</p>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .wrap {
        max-width: 860px;
        margin: 0 auto;
      }
      .empty {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 32px 16px;
      }
      .chart {
        width: 100%;
        height: auto;
        display: block;
        margin-top: 12px;
      }
      .grid {
        stroke: var(--ion-color-light-shade);
        stroke-width: 1;
      }
      .axis {
        stroke: var(--ion-color-medium);
        stroke-width: 1;
      }
      .tick {
        fill: var(--ion-color-medium);
        font-size: 11px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 16px;
        padding: 8px 16px 24px;
        font-size: 0.85em;
      }
      .legend i {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
      }
      .pts {
        margin-left: auto;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class ChartPage {
  i18n = inject(I18n);
  private store = inject(Store);

  readonly W = W;
  readonly H = H;
  readonly M = M;
  header = fieldHeader;

  tplId = signal('');
  fieldId = signal('');
  seriesId = signal('');
  invert = signal(false);

  formsWithNumbers = computed(() =>
    this.store.templates().filter((t) => t.fields.some((f) => f.type === 'number'))
  );
  private tpl = computed(() => this.store.template(this.tplId()));
  numberFields = computed(() => this.tpl()?.fields.filter((f) => f.type === 'number') ?? []);
  groupFields = computed(
    () => this.tpl()?.fields.filter((f) => f.type === 'text' || f.type === 'select') ?? []
  );

  constructor() {
    // Keep the selections valid as forms/fields change.
    effect(
      () => {
        const forms = this.formsWithNumbers();
        if (!forms.find((t) => t.id === this.tplId())) {
          // Prefer the form with the most records.
          const counts = this.store.recordCounts();
          const best = [...forms].sort(
            (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
          )[0];
          this.tplId.set(best?.id ?? '');
        }
      },
      { allowSignalWrites: true }
    );
    effect(
      () => {
        const nf = this.numberFields();
        if (!nf.find((f) => f.id === this.fieldId())) {
          // Prefer a "depth / level" style variable, otherwise the last numeric field.
          const pick =
            nf.find((f) => /terreno|nivel|depth|level|profund/i.test(f.label)) ??
            nf.find((f) => f.required) ??
            nf[0];
          this.fieldId.set(pick?.id ?? '');
        }
        const gf = this.groupFields();
        if (this.seriesId() && !gf.find((f) => f.id === this.seriesId())) {
          this.seriesId.set('');
        }
      },
      { allowSignalWrites: true }
    );
    // Depth-like variables read better with the axis inverted.
    effect(
      () => {
        const f = this.numberFields().find((x) => x.id === this.fieldId());
        this.invert.set(!!f && /terreno|bajo|depth|profund|nivel din|dynamic/i.test(f.label));
      },
      { allowSignalWrites: true }
    );
    // Group by the second text field (e.g. well / point) by default.
    effect(
      () => {
        const gf = this.groupFields();
        if (!this.seriesId() && gf.length) {
          const texts = gf.filter((f) => f.type === 'text');
          const guess = texts[1] ?? texts[0];
          if (guess) this.seriesId.set(guess.id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  view = computed(() => {
    const tpl = this.tpl();
    const field = this.numberFields().find((f) => f.id === this.fieldId());
    if (!tpl || !field) return null;

    const recs = this.store.records().filter((r) => r.templateId === tpl.id);
    const groups = new Map<string, Pt[]>();
    for (const r of recs) {
      const v = r.values[field.id];
      if (typeof v !== 'number') continue;
      const key = this.seriesId()
        ? String(r.values[this.seriesId()] ?? '').trim() || '—'
        : field.label;
      const arr = groups.get(key) ?? [];
      arr.push({ t: recordTime(tpl, r), v });
      groups.set(key, arr);
    }
    const all = [...groups.values()].flat();
    if (all.length < 2) return null;

    let tMin = Math.min(...all.map((p) => p.t));
    let tMax = Math.max(...all.map((p) => p.t));
    if (tMin === tMax) {
      tMin -= 43200000;
      tMax += 43200000;
    }
    const yt = niceTicks(Math.min(...all.map((p) => p.v)), Math.max(...all.map((p) => p.v)));
    const yMin = yt[0];
    const yMax = yt[yt.length - 1];
    const sx = (t: number) => M.l + ((t - tMin) / (tMax - tMin)) * (W - M.l - M.r);
    const sy = (v: number) => {
      const f = (v - yMin) / (yMax - yMin || 1);
      return this.invert() ? M.t + f * (H - M.t - M.b) : H - M.b - f * (H - M.t - M.b);
    };
    const fmtDate = (t: number) =>
      new Date(t).toLocaleDateString(this.i18n.lang() === 'es' ? 'es-CL' : 'en-US', {
        day: '2-digit',
        month: 'short',
      });

    const series = [...groups.entries()].map(([name, pts], i) => {
      const sorted = [...pts].sort((a, b) => a.t - b.t);
      const dots = sorted.map((p) => ({
        x: sx(p.t),
        y: sy(p.v),
        tip: `${name}: ${p.v}${field.unit ? ' ' + field.unit : ''} · ${new Date(p.t).toLocaleString(
          this.i18n.lang() === 'es' ? 'es-CL' : 'en-US'
        )}`,
      }));
      return {
        name,
        color: COLORS[i % COLORS.length],
        dots,
        path: dots.map((d) => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' '),
      };
    });

    return {
      series,
      count: all.length,
      yTicks: yt.map((v) => ({ pos: sy(v), label: String(v) })),
      xTicks: [0, 1, 2, 3].map((i) => {
        const t = tMin + ((tMax - tMin) * i) / 3;
        return {
          pos: sx(t),
          label: fmtDate(t),
          anchor: i === 0 ? 'start' : i === 3 ? 'end' : 'middle',
        };
      }),
    };
  });
}
