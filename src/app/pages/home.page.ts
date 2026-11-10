import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, createOutline } from 'ionicons/icons';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ i18n.t('home.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (store.templates().length === 0) {
        <p class="empty">{{ i18n.t('home.empty') }}</p>
      }
      <ion-list>
        @for (tpl of store.templates(); track tpl.id) {
          <ion-item [button]="true" detail="false" (click)="open(tpl.id)">
            <ion-label>
              <h2>{{ tpl.name }}</h2>
              @if (tpl.description) {
                <p>{{ tpl.description }}</p>
              }
              <p>
                {{ i18n.t('home.fields', { n: tpl.fields.length }) }} ·
                {{ i18n.t('home.records', { n: store.recordCounts().get(tpl.id) ?? 0 }) }}
              </p>
            </ion-label>
            <ion-buttons slot="end">
              <ion-button
                fill="clear"
                [attr.aria-label]="i18n.t('home.edit')"
                (click)="edit($event, tpl.id)"
              >
                <ion-icon slot="icon-only" name="create-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        }
      </ion-list>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button [attr.aria-label]="i18n.t('home.new')" (click)="create()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 32px 16px;
      }
    `,
  ],
})
export class HomePage {
  i18n = inject(I18n);
  store = inject(Store);
  private router = inject(Router);

  constructor() {
    addIcons({ add, createOutline });
  }

  open(id: string) {
    this.router.navigate(['/fill', id]);
  }

  edit(ev: Event, id: string) {
    ev.stopPropagation();
    this.router.navigate(['/editor', id]);
  }

  create() {
    this.router.navigate(['/editor', 'new']);
  }
}
