import { Component, inject } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  listOutline,
  settingsOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { I18n } from '../core/i18n';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="forms">
          <ion-icon name="document-text-outline"></ion-icon>
          <ion-label>{{ i18n.t('tab.forms') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="records">
          <ion-icon name="list-outline"></ion-icon>
          <ion-label>{{ i18n.t('tab.records') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="charts">
          <ion-icon name="stats-chart-outline"></ion-icon>
          <ion-label>{{ i18n.t('tab.charts') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <ion-icon name="settings-outline"></ion-icon>
          <ion-label>{{ i18n.t('tab.settings') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  i18n = inject(I18n);
  constructor() {
    addIcons({
      documentTextOutline,
      listOutline,
      settingsOutline,
      statsChartOutline,
    });
  }
}
