import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  copyOutline,
  createOutline,
  downloadOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  ExportLabels,
  buildTable,
  downloadCsv,
  downloadXlsx,
  fieldHeader,
} from '../core/export';
import { formatUtm, utmFromText } from '../core/geo';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';
import { FieldDef, FormTemplate, RecordEntry } from '../models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>{{ i18n.t('records.title') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            [disabled]="!visible().length"
            [attr.aria-label]="i18n.t('records.exportCsv')"
            (click)="exportCsv()"
          >
            CSV
          </ion-button>
          <ion-button
            [disabled]="!visible().length"
            [attr.aria-label]="i18n.t('records.exportXlsx')"
            (click)="exportXlsx()"
          >
            <ion-icon slot="start" name="download-outline"></ion-icon>
            XLSX
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="dark">
        <ion-searchbar
          [placeholder]="i18n.t('records.search')"
          [debounce]="200"
          (ionInput)="query.set(($any($event.target).value ?? '').toString())"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item>
        <ion-select
          [label]="i18n.t('records.filter')"
          [value]="filter()"
          (ionChange)="filter.set($event.detail.value)"
        >
          <ion-select-option value="">{{ i18n.t('records.all') }}</ion-select-option>
          @for (t of store.templates(); track t.id) {
            <ion-select-option [value]="t.id">{{ t.name }}</ion-select-option>
          }
        </ion-select>
        <span slot="end" class="count">
          {{ i18n.t('records.count', { n: visible().length }) }}
        </span>
      </ion-item>

      @if (visible().length === 0) {
        <p class="empty">
          {{ store.records().length ? i18n.t('records.noMatch') : i18n.t('records.empty') }}
        </p>
      }

      <ion-accordion-group>
        @for (r of visible(); track r.id) {
          <ion-accordion [value]="r.id">
            <ion-item slot="header">
              <ion-label>
                <h2>{{ summary(r) }}</h2>
                <p>
                  {{ templateName(r) }} · {{ when(r.createdAt) }}
                  @if (r.updatedAt) {
                    · {{ i18n.t('records.edited') }}
                  }
                </p>
              </ion-label>
            </ion-item>
            <div slot="content" class="detail">
              @if (store.template(r.templateId); as tpl) {
                @for (f of tpl.fields; track f.id) {
                  @if (f.type === 'photo') {
                    @if (photos(r, f).length) {
                      <div class="row">
                        <span class="k">{{ header(f) }}</span>
                        <span class="v thumbs">
                          @for (p of photos(r, f); track $index) {
                            <img [src]="p" alt="" (click)="lightbox.set(p)" />
                          }
                        </span>
                      </div>
                    }
                  } @else {
                    <div class="row">
                      <span class="k">{{ header(f) }}</span>
                      <span class="v">
                        {{ display(f, r) }}
                        @if (f.type === 'gps' && utm(r, f); as u) {
                          <small class="utm">{{ u }}</small>
                        }
                      </span>
                    </div>
                  }
                }
                <div class="actions">
                  <ion-button size="small" fill="outline" (click)="edit(r)">
                    <ion-icon slot="start" name="create-outline"></ion-icon>
                    {{ i18n.t('records.edit') }}
                  </ion-button>
                  <ion-button size="small" fill="outline" (click)="duplicate(r)">
                    <ion-icon slot="start" name="copy-outline"></ion-icon>
                    {{ i18n.t('records.duplicate') }}
                  </ion-button>
                  <ion-button size="small" fill="outline" color="danger" (click)="remove(r)">
                    <ion-icon slot="start" name="trash-outline"></ion-icon>
                    {{ i18n.t('records.delete') }}
                  </ion-button>
                </div>
              } @else {
                <div class="actions">
                  <ion-button size="small" fill="outline" color="danger" (click)="remove(r)">
                    <ion-icon slot="start" name="trash-outline"></ion-icon>
                    {{ i18n.t('records.delete') }}
                  </ion-button>
                </div>
              }
            </div>
          </ion-accordion>
        }
      </ion-accordion-group>

      @if (lightbox(); as src) {
        <div class="lightbox" (click)="lightbox.set(null)">
          <button type="button" class="close" [attr.aria-label]="i18n.t('records.close')">
            <ion-icon name="close-outline"></ion-icon>
          </button>
          <img [src]="src" alt="" />
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 32px 16px;
      }
      .count {
        color: var(--ion-color-medium);
        font-size: 0.85em;
      }
      .detail {
        padding: 8px 16px 16px;
      }
      .row {
        display: flex;
        gap: 12px;
        padding: 4px 0;
      }
      .k {
        flex: 0 0 40%;
        color: var(--ion-color-medium);
      }
      .v {
        flex: 1;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .utm {
        display: block;
        color: var(--ion-color-primary-shade);
        font-variant-numeric: tabular-nums;
      }
      .thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .thumbs img {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border-radius: 6px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        z-index: 10000;
        display: grid;
        place-items: center;
      }
      .lightbox img {
        max-width: 96vw;
        max-height: 90vh;
        object-fit: contain;
      }
      .close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: transparent;
        border: 0;
        color: #fff;
        font-size: 34px;
      }
    `,
  ],
})
export class RecordsPage {
  i18n = inject(I18n);
  store = inject(Store);
  private alerts = inject(AlertController);
  private toast = inject(ToastController);
  private router = inject(Router);

  filter = signal<string>('');
  query = signal('');
  lightbox = signal<string | null>(null);

  visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.store
      .records()
      .filter((r) => !this.filter() || r.templateId === this.filter())
      .filter((r) => !q || this.searchText(r).includes(q));
  });

  header = fieldHeader;

  constructor() {
    addIcons({
      closeOutline,
      copyOutline,
      createOutline,
      downloadOutline,
      trashOutline,
    });
  }

  private searchText(r: RecordEntry): string {
    const tpl = this.store.template(r.templateId);
    const parts = [tpl?.name ?? ''];
    for (const v of Object.values(r.values)) {
      if (typeof v === 'string' || typeof v === 'number') parts.push(String(v));
    }
    return parts.join(' ').toLowerCase();
  }

  templateName(r: RecordEntry): string {
    return this.store.template(r.templateId)?.name ?? this.i18n.t('records.unknownForm');
  }

  when(ts: number): string {
    return new Date(ts).toLocaleString(this.i18n.lang() === 'es' ? 'es-CL' : 'en-US');
  }

  photos(r: RecordEntry, f: FieldDef): string[] {
    const v = r.values[f.id];
    return Array.isArray(v) ? v : [];
  }

  utm(r: RecordEntry, f: FieldDef): string | null {
    const u = utmFromText(String(r.values[f.id] ?? ''));
    return u ? formatUtm(u) : null;
  }

  display(f: FieldDef, r: RecordEntry): string {
    const v = r.values[f.id];
    if (v === null || v === undefined || v === '') return '—';
    if (f.type === 'checkbox') {
      return v === true ? this.i18n.t('records.yes') : this.i18n.t('records.no');
    }
    return Array.isArray(v) ? v.join(', ') : String(v);
  }

  /** First non-empty text-like value, used as the record title. */
  summary(r: RecordEntry): string {
    const tpl = this.store.template(r.templateId);
    if (tpl) {
      const texts = tpl.fields.filter((f) => f.type === 'text');
      // Prefer the 2nd text field (usually the point / well) with the 1st as context.
      const vals = texts
        .map((f) => r.values[f.id])
        .filter((v): v is string => typeof v === 'string' && v !== '');
      if (vals.length >= 2) return `${vals[1]} · ${vals[0]}`;
      if (vals.length === 1) return vals[0];
    }
    return this.when(r.createdAt);
  }

  private labels(): ExportLabels {
    return {
      recordedAt: this.i18n.t('records.recordedAt'),
      yes: this.i18n.t('records.yes'),
      no: this.i18n.t('records.no'),
      photos: this.i18n.t('records.photos'),
      utmNorth: this.i18n.t('records.utmNorth'),
      utmEast: this.i18n.t('records.utmEast'),
      utmZone: this.i18n.t('records.utmZone'),
    };
  }

  private tables() {
    const L = this.labels();
    const groups = new Map<string, RecordEntry[]>();
    // Oldest first reads naturally in a spreadsheet.
    for (const r of [...this.visible()].reverse()) {
      const g = groups.get(r.templateId) ?? [];
      g.push(r);
      groups.set(r.templateId, g);
    }
    const out: { name: string; table: ReturnType<typeof buildTable> }[] = [];
    for (const [id, recs] of groups) {
      const tpl: FormTemplate | undefined = this.store.template(id);
      if (!tpl) continue;
      out.push({ name: tpl.name, table: buildTable(tpl, recs, L) });
    }
    return out;
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async exportCsv() {
    const tables = this.tables();
    if (!tables.length) return;
    for (const t of tables) await downloadCsv(t.table, `${t.name}_${this.stamp()}`);
    await this.say();
  }

  async exportXlsx() {
    const tables = this.tables();
    if (!tables.length) return;
    await downloadXlsx(tables, `terreno_${this.stamp()}`);
    await this.say();
  }

  edit(r: RecordEntry) {
    this.router.navigate(['/fill', r.templateId], { queryParams: { rec: r.id } });
  }

  duplicate(r: RecordEntry) {
    this.router.navigate(['/fill', r.templateId], { queryParams: { copy: r.id } });
  }

  async remove(r: RecordEntry) {
    const a = await this.alerts.create({
      message: this.i18n.t('records.deleteConfirm'),
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        {
          text: this.i18n.t('common.delete'),
          role: 'destructive',
          handler: () => this.store.deleteRecord(r.id),
        },
      ],
    });
    await a.present();
  }

  private async say() {
    const t = await this.toast.create({
      message: this.i18n.t('records.exported'),
      duration: 2000,
    });
    await t.present();
  }
}
