import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, closeCircle, locateOutline } from 'ionicons/icons';
import { fieldHeader } from '../core/export';
import { formatUtm, utmFromText } from '../core/geo';
import { I18n } from '../core/i18n';
import { compressPhoto } from '../core/photo';
import { Store } from '../core/store';
import { FieldDef, FieldValue, FormTemplate } from '../models';

const MAX_PHOTOS = 10;
const pad = (n: number) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

@Component({
  selector: 'app-fill',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="editing() ? '/records' : '/forms'"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ tpl()?.name ?? i18n.t('app.name') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="wrap">
        @if (!tpl()) {
          <p class="ion-padding">{{ i18n.t('fill.notFound') }}</p>
        } @else {
          @if (copied()) {
            <p class="note">{{ i18n.t('fill.copyOf') }}</p>
          }
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <ion-list lines="full">
              @for (f of tpl()!.fields; track f.id) {
                @switch (f.type) {
                  @case ('textarea') {
                    <ion-item>
                      <ion-textarea
                        [label]="label(f)"
                        labelPlacement="stacked"
                        [autoGrow]="true"
                        [formControlName]="f.id"
                      ></ion-textarea>
                    </ion-item>
                  }
                  @case ('select') {
                    <ion-item>
                      <ion-select
                        [label]="label(f)"
                        labelPlacement="stacked"
                        [placeholder]="i18n.t('fill.choose')"
                        [formControlName]="f.id"
                      >
                        @for (o of f.options ?? []; track o) {
                          <ion-select-option [value]="o">{{ o }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                  }
                  @case ('checkbox') {
                    <ion-item>
                      <ion-checkbox [formControlName]="f.id" justify="space-between">
                        {{ f.label }}
                      </ion-checkbox>
                    </ion-item>
                  }
                  @case ('gps') {
                    <ion-item>
                      <ion-input
                        [label]="label(f)"
                        labelPlacement="stacked"
                        inputmode="decimal"
                        [placeholder]="i18n.t('fill.gpsHint')"
                        [formControlName]="f.id"
                      ></ion-input>
                      <ion-button
                        slot="end"
                        fill="clear"
                        [attr.aria-label]="i18n.t('fill.useLocation')"
                        [disabled]="locating() === f.id"
                        (click)="locate(f)"
                      >
                        <ion-icon slot="icon-only" name="locate-outline"></ion-icon>
                      </ion-button>
                    </ion-item>
                    @if (utm(f); as u) {
                      <p class="utm">{{ u }}</p>
                    }
                  }
                  @case ('photo') {
                    <ion-item lines="none">
                      <div class="photos">
                        <div class="photos-label">{{ label(f) }}</div>
                        <div class="thumbs">
                          @for (p of photosOf(f); track $index) {
                            <div class="thumb">
                              <img [src]="p" alt="" />
                              <button
                                type="button"
                                class="rm"
                                [attr.aria-label]="i18n.t('fill.removePhoto')"
                                (click)="removePhoto(f, $index)"
                              >
                                <ion-icon name="close-circle"></ion-icon>
                              </button>
                            </div>
                          }
                          <button type="button" class="add" (click)="picker.click()">
                            <ion-icon name="camera-outline"></ion-icon>
                            <span>{{ i18n.t('fill.addPhoto') }}</span>
                          </button>
                        </div>
                        <input
                          #picker
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          (change)="addPhotos(f, $event)"
                        />
                      </div>
                    </ion-item>
                  }
                  @default {
                    <ion-item>
                      <ion-input
                        [label]="label(f)"
                        labelPlacement="stacked"
                        [type]="f.type"
                        [inputmode]="f.type === 'number' ? 'decimal' : undefined"
                        [step]="f.type === 'number' ? 'any' : undefined"
                        [formControlName]="f.id"
                      ></ion-input>
                    </ion-item>
                  }
                }
              }
            </ion-list>
            <ion-button expand="block" type="submit" class="save">
              {{ editing() ? i18n.t('fill.update') : i18n.t('fill.save') }}
            </ion-button>
          </form>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .wrap {
        max-width: 720px;
        margin: 0 auto;
        padding: 0 0 32px;
      }
      .save {
        margin: 16px;
      }
      .note {
        margin: 12px 16px 0;
        color: var(--ion-color-medium);
        font-size: 0.9em;
      }
      .utm {
        margin: -4px 16px 8px;
        font-size: 0.85em;
        color: var(--ion-color-primary-shade);
        font-variant-numeric: tabular-nums;
      }
      .photos {
        width: 100%;
        padding: 12px 0;
      }
      .photos-label {
        font-size: 0.85em;
        margin-bottom: 8px;
      }
      .thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .thumb {
        position: relative;
        width: 84px;
        height: 84px;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }
      .rm {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #fff;
        border-radius: 50%;
        border: 0;
        padding: 0;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        color: var(--ion-color-danger);
        font-size: 24px;
      }
      .add {
        width: 84px;
        height: 84px;
        border-radius: 8px;
        border: 2px dashed var(--ion-color-medium);
        background: transparent;
        color: var(--ion-color-medium);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 0.7em;
        gap: 2px;
      }
      .add ion-icon {
        font-size: 26px;
      }
    `,
  ],
})
export class FillPage implements OnInit {
  i18n = inject(I18n);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastController);
  private alerts = inject(AlertController);

  tpl = signal<FormTemplate | undefined>(undefined);
  editing = signal(false);
  copied = signal(false);
  locating = signal<string | null>(null);
  form = new FormGroup({} as Record<string, AbstractControl>);
  private editId: string | null = null;

  constructor() {
    addIcons({ cameraOutline, closeCircle, locateOutline });
  }

  ngOnInit() {
    const snap = this.route.snapshot;
    const t = this.store.template(snap.paramMap.get('id'));
    this.tpl.set(t);
    if (!t) return;
    const editId = snap.queryParamMap.get('rec');
    const copyId = snap.queryParamMap.get('copy');
    const source = this.store.record(editId ?? copyId);
    this.editing.set(!!editId && !!source);
    this.copied.set(!editId && !!source);
    this.editId = editId && source ? editId : null;
    this.buildForm(t, source?.values, !source);
  }

  label(f: FieldDef): string {
    return fieldHeader(f) + (f.required ? ' *' : '');
  }

  utm(f: FieldDef): string | null {
    const u = utmFromText(String(this.form.controls[f.id]?.value ?? ''));
    return u ? formatUtm(u) : null;
  }

  photosOf(f: FieldDef): string[] {
    const v = this.form.controls[f.id]?.value;
    return Array.isArray(v) ? v : [];
  }

  private defaultFor(t: FormTemplate, f: FieldDef): FieldValue {
    if (f.type === 'checkbox') return false;
    if (f.type === 'photo') return [];
    if (f.type === 'date') return today();
    if (f.type === 'time') return nowTime();
    if (f.autofill) {
      const p = this.store.profile();
      const v = p[f.autofill];
      if (v) return v;
    }
    if (f.sticky) {
      const last = this.store.lastValue(t.id, f.id);
      if (last !== undefined && last !== null) return last;
    }
    return '';
  }

  private buildForm(
    t: FormTemplate,
    values?: Record<string, FieldValue>,
    fresh = true
  ) {
    for (const key of Object.keys(this.form.controls)) {
      this.form.removeControl(key);
    }
    for (const f of t.fields) {
      let v: FieldValue;
      if (values && f.id in values) {
        v = values[f.id];
        // A duplicated record gets a fresh date and time.
        if (!this.editing() && (f.type === 'date' || f.type === 'time')) {
          v = this.defaultFor(t, f);
        }
        if (f.type === 'number' && v === null) v = '';
      } else {
        v = fresh || !values ? this.defaultFor(t, f) : '';
      }
      this.form.addControl(
        f.id,
        new FormControl(
          v,
          f.required && f.type !== 'checkbox' && f.type !== 'photo'
            ? [Validators.required]
            : []
        )
      );
    }
  }

  async addPhotos(f: FieldDef, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const ctl = this.form.controls[f.id];
    const current = [...this.photosOf(f)];
    for (const file of files) {
      if (current.length >= MAX_PHOTOS) {
        await this.say(this.i18n.t('fill.photoLimit', { n: MAX_PHOTOS }));
        break;
      }
      try {
        current.push(await compressPhoto(file));
      } catch (e) {
        console.error(e);
        await this.say(this.i18n.t('fill.photoError'));
      }
    }
    ctl.setValue(current);
  }

  removePhoto(f: FieldDef, i: number) {
    const next = this.photosOf(f).filter((_, j) => j !== i);
    this.form.controls[f.id].setValue(next);
  }

  locate(f: FieldDef) {
    if (!('geolocation' in navigator)) {
      this.say(this.i18n.t('fill.locationError'));
      return;
    }
    this.locating.set(f.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        this.form.controls[f.id].setValue(
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );
        this.locating.set(null);
        this.say(this.i18n.t('fill.locationOk', { m: Math.round(accuracy) }));
      },
      () => {
        this.locating.set(null);
        this.say(this.i18n.t('fill.locationError'));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  private collect(t: FormTemplate): Record<string, FieldValue> {
    const raw = this.form.getRawValue();
    const values: Record<string, FieldValue> = {};
    for (const f of t.fields) {
      const v = raw[f.id];
      if (f.type === 'number') {
        const n =
          v === '' || v === null || v === undefined
            ? NaN
            : Number(String(v).replace(',', '.'));
        values[f.id] = Number.isFinite(n) ? n : null;
      } else if (f.type === 'checkbox') {
        values[f.id] = v === true;
      } else if (f.type === 'photo') {
        values[f.id] = Array.isArray(v) ? v : [];
      } else {
        values[f.id] = v === undefined || v === null ? '' : String(v);
      }
    }
    return values;
  }

  private outOfRange(t: FormTemplate, values: Record<string, FieldValue>) {
    const issues: string[] = [];
    for (const f of t.fields) {
      const v = values[f.id];
      if (f.type !== 'number' || typeof v !== 'number') continue;
      const lo = f.min ?? -Infinity;
      const hi = f.max ?? Infinity;
      if (v < lo || v > hi) {
        issues.push(
          this.i18n.t('fill.outOfRange', {
            label: f.label,
            v,
            min: f.min ?? '−∞',
            max: f.max ?? '∞',
          })
        );
      }
    }
    return issues;
  }

  async submit() {
    const t = this.tpl();
    if (!t) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.say(this.i18n.t('fill.required'));
      return;
    }
    const values = this.collect(t);
    const issues = this.outOfRange(t, values);
    if (issues.length && !(await this.confirm(issues))) return;

    if (this.editId) {
      this.store.updateRecord(this.editId, values);
      await this.say(this.i18n.t('fill.updated'));
      await this.router.navigate(['/records']);
      return;
    }
    this.store.addRecord({ templateId: t.id, values });
    this.copied.set(false);
    this.buildForm(t);
    await this.say(this.i18n.t('fill.saved'));
  }

  private async confirm(issues: string[]): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const a = await this.alerts.create({
        message: issues.join('\n\n'),
        buttons: [
          { text: this.i18n.t('fill.review'), role: 'cancel' },
          { text: this.i18n.t('fill.saveAnyway'), role: 'confirm' },
        ],
      });
      a.onDidDismiss().then((r) => resolve(r.role === 'confirm'));
      await a.present();
    });
  }

  private async say(message: string) {
    const el = await this.toast.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await el.present();
  }
}
