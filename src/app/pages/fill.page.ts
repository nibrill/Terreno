import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
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
import { locateOutline } from 'ionicons/icons';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';
import { FieldDef, FieldValue, FormTemplate } from '../models';
import { fieldHeader } from '../core/export';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
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
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/forms"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ tpl()?.name ?? i18n.t('app.name') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (!tpl()) {
        <p>{{ i18n.t('fill.notFound') }}</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <ion-list lines="full">
            @for (f of tpl()!.fields; track f.id) {
              <ion-item>
                @switch (f.type) {
                  @case ('textarea') {
                    <ion-textarea
                      [label]="label(f)"
                      labelPlacement="stacked"
                      [autoGrow]="true"
                      [formControlName]="f.id"
                    ></ion-textarea>
                  }
                  @case ('select') {
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
                  }
                  @case ('checkbox') {
                    <ion-checkbox [formControlName]="f.id" justify="space-between">
                      {{ f.label }}
                    </ion-checkbox>
                  }
                  @case ('gps') {
                    <ion-input
                      [label]="label(f)"
                      labelPlacement="stacked"
                      inputmode="decimal"
                      placeholder="lat, lon"
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
                  }
                  @default {
                    <ion-input
                      [label]="label(f)"
                      labelPlacement="stacked"
                      [type]="f.type"
                      [inputmode]="f.type === 'number' ? 'decimal' : undefined"
                      [step]="f.type === 'number' ? 'any' : undefined"
                      [formControlName]="f.id"
                    ></ion-input>
                  }
                }
              </ion-item>
            }
          </ion-list>
          <ion-button expand="block" type="submit" class="ion-margin-top">
            {{ i18n.t('fill.save') }}
          </ion-button>
        </form>
      }
    </ion-content>
  `,
})
export class FillPage implements OnInit {
  i18n = inject(I18n);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastController);

  tpl = signal<FormTemplate | undefined>(undefined);
  locating = signal<string | null>(null);
  form = new FormGroup({} as Record<string, AbstractControl>);

  constructor() {
    addIcons({ locateOutline });
  }

  ngOnInit() {
    const t = this.store.template(this.route.snapshot.paramMap.get('id'));
    this.tpl.set(t);
    if (t) this.buildForm(t);
  }

  label(f: FieldDef): string {
    return fieldHeader(f) + (f.required ? ' *' : '');
  }

  private defaultFor(f: FieldDef): FieldValue {
    if (f.type === 'checkbox') return false;
    if (f.type === 'date') return today();
    if (f.type === 'time') return nowTime();
    return '';
  }

  private buildForm(t: FormTemplate) {
    for (const key of Object.keys(this.form.controls)) {
      this.form.removeControl(key);
    }
    for (const f of t.fields) {
      this.form.addControl(
        f.id,
        new FormControl(
          this.defaultFor(f),
          f.required && f.type !== 'checkbox' ? [Validators.required] : []
        )
      );
    }
  }

  async locate(f: FieldDef) {
    if (!('geolocation' in navigator)) {
      return this.say(this.i18n.t('fill.locationError'));
    }
    this.locating.set(f.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.form.controls[f.id].setValue(
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );
        this.locating.set(null);
      },
      () => {
        this.locating.set(null);
        this.say(this.i18n.t('fill.locationError'));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async submit() {
    const t = this.tpl();
    if (!t) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return this.say(this.i18n.t('fill.required'));
    }
    const raw = this.form.getRawValue();
    const values: Record<string, FieldValue> = {};
    for (const f of t.fields) {
      const v = raw[f.id];
      if (f.type === 'number') {
        const n = v === '' || v === null || v === undefined ? NaN : Number(v);
        values[f.id] = Number.isFinite(n) ? n : null;
      } else if (f.type === 'checkbox') {
        values[f.id] = v === true;
      } else {
        values[f.id] = v === undefined || v === null ? '' : String(v);
      }
    }
    this.store.addRecord({ templateId: t.id, values });
    this.buildForm(t);
    await this.say(this.i18n.t('fill.saved'));
  }

  private async say(message: string) {
    const el = await this.toast.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await el.present();
  }
}
