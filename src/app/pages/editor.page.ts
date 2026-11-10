import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  arrowDownOutline,
  arrowUpOutline,
  closeCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { I18n } from '../core/i18n';
import { newId } from '../core/ids';
import { Store } from '../core/store';
import { FIELD_TYPES, FieldDef, FormTemplate } from '../models';

interface EditableField extends FieldDef {
  /** Textarea-friendly version of `options`. */
  optionsText: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/forms"></ion-back-button>
        </ion-buttons>
        <ion-title>
          {{ isNew ? i18n.t('editor.titleNew') : i18n.t('editor.titleEdit') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()">{{ i18n.t('editor.save') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="full">
        <ion-item>
          <ion-input
            [label]="i18n.t('editor.name')"
            labelPlacement="stacked"
            [(ngModel)]="name"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-textarea
            [label]="i18n.t('editor.description')"
            labelPlacement="stacked"
            [autoGrow]="true"
            [(ngModel)]="description"
          ></ion-textarea>
        </ion-item>
      </ion-list>

      <ion-list lines="full">
        <ion-list-header>
          <ion-label>{{ i18n.t('editor.fields') }}</ion-label>
        </ion-list-header>

        @for (f of fields(); track f.id; let i = $index; let first = $first; let last = $last) {
          <div class="field">
            <ion-item>
              <ion-input
                [label]="i18n.t('editor.label')"
                labelPlacement="stacked"
                [(ngModel)]="f.label"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-select
                [label]="i18n.t('editor.type')"
                labelPlacement="stacked"
                [(ngModel)]="f.type"
              >
                @for (t of types; track t) {
                  <ion-select-option [value]="t">{{ i18n.t('type.' + t) }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
            @if (f.type === 'number') {
              <ion-item>
                <ion-input
                  [label]="i18n.t('editor.unit')"
                  labelPlacement="stacked"
                  [(ngModel)]="f.unit"
                ></ion-input>
              </ion-item>
            }
            @if (f.type === 'select') {
              <ion-item>
                <ion-textarea
                  [label]="i18n.t('editor.options')"
                  labelPlacement="stacked"
                  [autoGrow]="true"
                  [(ngModel)]="f.optionsText"
                ></ion-textarea>
              </ion-item>
            }
            <ion-item>
              <ion-toggle [(ngModel)]="f.required" justify="space-between">
                {{ i18n.t('editor.required') }}
              </ion-toggle>
              <ion-buttons slot="end">
                <ion-button
                  [disabled]="first"
                  [attr.aria-label]="i18n.t('editor.moveUp')"
                  (click)="move(i, -1)"
                >
                  <ion-icon slot="icon-only" name="arrow-up-outline"></ion-icon>
                </ion-button>
                <ion-button
                  [disabled]="last"
                  [attr.aria-label]="i18n.t('editor.moveDown')"
                  (click)="move(i, 1)"
                >
                  <ion-icon slot="icon-only" name="arrow-down-outline"></ion-icon>
                </ion-button>
                <ion-button
                  color="danger"
                  [attr.aria-label]="i18n.t('editor.removeField')"
                  (click)="remove(i)"
                >
                  <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-item>
          </div>
        }
      </ion-list>

      <ion-button expand="block" fill="outline" (click)="addField()">
        <ion-icon slot="start" name="add"></ion-icon>
        {{ i18n.t('editor.addField') }}
      </ion-button>

      @if (!isNew) {
        <ion-button expand="block" color="danger" fill="clear" (click)="confirmDelete()">
          <ion-icon slot="start" name="trash-outline"></ion-icon>
          {{ i18n.t('editor.delete') }}
        </ion-button>
      }
    </ion-content>
  `,
  styles: [
    `
      .field {
        border: 1px solid var(--ion-color-light-shade);
        border-radius: 8px;
        margin: 12px 0;
        overflow: hidden;
      }
      ion-button {
        margin-top: 8px;
      }
    `,
  ],
})
export class EditorPage implements OnInit {
  i18n = inject(I18n);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alerts = inject(AlertController);
  private toast = inject(ToastController);

  types = FIELD_TYPES;
  isNew = true;
  private id = '';
  private createdAt = Date.now();
  name = '';
  description = '';
  fields = signal<EditableField[]>([]);

  constructor() {
    addIcons({
      add,
      arrowDownOutline,
      arrowUpOutline,
      closeCircleOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    const param = this.route.snapshot.paramMap.get('id');
    const existing = param && param !== 'new' ? this.store.template(param) : undefined;
    if (existing) {
      this.isNew = false;
      this.id = existing.id;
      this.createdAt = existing.createdAt;
      this.name = existing.name;
      this.description = existing.description ?? '';
      this.fields.set(
        existing.fields.map((f) => ({
          ...f,
          optionsText: (f.options ?? []).join('\n'),
        }))
      );
    } else {
      this.id = newId('t');
      this.addField();
    }
  }

  addField() {
    this.fields.update((list) => [
      ...list,
      {
        id: newId('f'),
        label: '',
        type: 'text',
        required: false,
        optionsText: '',
      },
    ]);
  }

  remove(i: number) {
    this.fields.update((list) => list.filter((_, j) => j !== i));
  }

  move(i: number, delta: number) {
    this.fields.update((list) => {
      const next = [...list];
      const j = i + delta;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async save() {
    const name = this.name.trim();
    if (!name) return this.say(this.i18n.t('editor.needName'));

    const fields: FieldDef[] = [];
    for (const f of this.fields()) {
      const label = f.label.trim();
      if (!label) continue;
      const def: FieldDef = {
        id: f.id,
        label,
        type: f.type,
        required: f.required,
      };
      if (f.type === 'number' && f.unit?.trim()) def.unit = f.unit.trim();
      if (f.type === 'select') {
        def.options = f.optionsText
          .split('\n')
          .map((o) => o.trim())
          .filter(Boolean);
        if (!def.options.length) return this.say(this.i18n.t('editor.needOptions'));
      }
      fields.push(def);
    }
    if (!fields.length) return this.say(this.i18n.t('editor.needFields'));

    const tpl: FormTemplate = {
      id: this.id,
      name,
      description: this.description.trim() || undefined,
      fields,
      createdAt: this.createdAt,
      updatedAt: Date.now(),
    };
    this.store.saveTemplate(tpl);
    await this.router.navigate(['/forms']);
  }

  async confirmDelete() {
    const a = await this.alerts.create({
      message: this.i18n.t('editor.deleteConfirm'),
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        {
          text: this.i18n.t('common.delete'),
          role: 'destructive',
          handler: () => {
            this.store.deleteTemplate(this.id);
            this.router.navigate(['/forms']);
          },
        },
      ],
    });
    await a.present();
  }

  private async say(message: string) {
    const t = await this.toast.create({ message, duration: 2500 });
    await t.present();
  }
}
