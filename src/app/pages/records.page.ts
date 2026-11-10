import { Component, computed, inject, signal } from '@angular/core';
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, trashOutline } from 'ionicons/icons';
import {
  buildTable,
  downloadCsv,
  downloadXlsx,
  fieldHeader,
} from '../core/export';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';
import { FormTemplate, RecordEntry } from '../models';

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
    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
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
      </ion-item>

      @if (visible().length === 0) {
        <p class="empty">{{ i18n.t('records.empty') }}</p>
      }

      <ion-accordion-group>
        @for (r of visible(); track r.id) {
          <ion-accordion [value]="r.id">
            <ion-item slot="header">
              <ion-label>
                <h2>{{ summary(r) }}</h2>
                <p>{{ templateName(r) }} · {{ when(r.createdAt) }}</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="detail">
              @if (store.template(r.templateId); as tpl) {
                @for (f of tpl.fields; track f.id) {
                  <div class="row">
                    <span class="k">{{ header(f) }}</span>
                    <span class="v">{{ display(tpl, f.id, r) }}</span>
                  </div>
                }
              }
              <ion-button
                color="danger"
                fill="outline"
                size="small"
                (click)="remove(r)"
              >
                <ion-icon slot="start" name="trash-outline"></ion-icon>
                {{ i18n.t('records.delete') }}
              </ion-button>
            </div>
          </ion-accordion>
        }
      </ion-accordion-group>
    </ion-content>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 32px 16px;
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
      ion-button {
        margin-top: 12px;
      }
    `,
  ],
})
export class RecordsPage {
  i18n = inject(I18n);
  store = inject(Store);
  private alerts = inject(AlertController);
  private toast = inject(ToastController);

  filter = signal<string>('');
  visible = computed(() =>
    this.store
      .records()
      .filter((r) => !this.filter() || r.templateId === this.filter())
  );

  constructor() {
    addIcons({ downloadOutline, trashOutline });
  }

  header = fieldHeader;

  templateName(r: RecordEntry): string {
    return this.store.template(r.templateId)?.name ?? this.i18n.t('records.unknownForm');
  }

  when(ts: number): string {
    return new Date(ts).toLocaleString(this.i18n.lang());
  }

  display(tpl: FormTemplate, fieldId: string, r: RecordEntry): string {
    const f = tpl.fields.find((x) => x.id === fieldId);
    const v = r.values[fieldId];
    if (v === null || v === undefined || v === '') return '—';
    if (f?.type === 'checkbox') {
      return v === true ? this.i18n.t('records.yes') : this.i18n.t('records.no');
    }
    return String(v);
  }

  /** First non-empty text-like value, used as the record title. */
  summary(r: RecordEntry): string {
    const tpl = this.store.template(r.templateId);
    if (tpl) {
      for (const f of tpl.fields) {
        const v = r.values[f.id];
        if (typeof v === 'string' && v && f.type !== 'date' && f.type !== 'time') {
          return v;
        }
      }
    }
    return this.when(r.createdAt);
  }

  private tables() {
    const yes = this.i18n.t('records.yes');
    const no = this.i18n.t('records.no');
    const head = this.i18n.t('records.recordedAt');
    const groups = new Map<string, RecordEntry[]>();
    for (const r of this.visible()) {
      const g = groups.get(r.templateId) ?? [];
      g.push(r);
      groups.set(r.templateId, g);
    }
    const out: { name: string; table: ReturnType<typeof buildTable> }[] = [];
    for (const [id, recs] of groups) {
      const tpl = this.store.template(id);
      if (!tpl) continue;
      out.push({ name: tpl.name, table: buildTable(tpl, recs, head, yes, no) });
    }
    return out;
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async exportCsv() {
    const tables = this.tables();
    if (!tables.length) return;
    // CSV has no sheets: one file per form.
    for (const t of tables) downloadCsv(t.table, `${t.name}_${this.stamp()}`);
    await this.say();
  }

  async exportXlsx() {
    const tables = this.tables();
    if (!tables.length) return;
    await downloadXlsx(tables, `fieldlog_${this.stamp()}`);
    await this.say();
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
