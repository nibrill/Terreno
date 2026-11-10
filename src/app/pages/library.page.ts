import { Component, computed, inject } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { I18n } from '../core/i18n';
import { PRESETS, Preset, presetId, presetName } from '../core/library';
import { Store } from '../core/store';
import { CATEGORIES } from '../models';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
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
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/forms"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ i18n.t('lib.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p class="intro">{{ i18n.t('lib.intro') }}</p>
      @for (g of groups(); track g.category) {
        <ion-list lines="full">
          <ion-list-header>
            <ion-label>{{ i18n.t('cat.' + g.category) }}</ion-label>
          </ion-list-header>
          @for (p of g.items; track p.key) {
            <ion-item>
              <ion-label class="ion-text-wrap">
                <h2>{{ name(p) }}</h2>
                <p>{{ p.description[idx()] }}</p>
                <p>{{ i18n.t('home.fields', { n: p.fields.length }) }}</p>
              </ion-label>
              @if (has(p)) {
                <span slot="end" class="done">
                  <ion-icon name="checkmark-circle"></ion-icon>
                  {{ i18n.t('lib.added') }}
                </span>
              } @else {
                <ion-button slot="end" size="small" (click)="add(p)">
                  {{ i18n.t('lib.add') }}
                </ion-button>
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    `
      .intro {
        padding: 12px 16px 0;
        margin: 0;
        color: var(--ion-color-medium);
      }
      .done {
        color: var(--ion-color-success);
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.9em;
      }
    `,
  ],
})
export class LibraryPage {
  i18n = inject(I18n);
  private store = inject(Store);
  private toast = inject(ToastController);

  idx = computed(() => (this.i18n.lang() === 'es' ? 0 : 1));

  groups = computed(() =>
    CATEGORIES.map((category) => ({
      category,
      items: PRESETS.filter((p) => p.category === category),
    })).filter((g) => g.items.length)
  );

  constructor() {
    addIcons({ checkmarkCircle });
  }

  name(p: Preset) {
    return presetName(p, this.i18n.lang());
  }

  has(p: Preset): boolean {
    return !!this.store.template(presetId(p.key));
  }

  async add(p: Preset) {
    this.store.addFromLibrary([p.key]);
    const t = await this.toast.create({
      message: this.i18n.t('lib.addedToast'),
      duration: 1500,
    });
    await t.present();
  }
}
