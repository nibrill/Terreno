import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { download } from '../core/export';
import { I18n, LANGS, Lang } from '../core/i18n';
import { Store } from '../core/store';

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonSelect,
    IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ i18n.t('settings.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item>
          <ion-select
            [label]="i18n.t('settings.language')"
            [value]="i18n.lang()"
            (ionChange)="i18n.setLang($event.detail.value)"
          >
            @for (l of langs; track l.code) {
              <ion-select-option [value]="l.code">{{ l.name }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>{{ i18n.t('settings.data') }}</ion-label>
        </ion-list-header>
        <ion-item lines="none">
          <ion-note class="ion-text-wrap">{{ i18n.t('settings.dataInfo') }}</ion-note>
        </ion-item>
        <div class="buttons">
          <ion-button expand="block" (click)="backup()">
            {{ i18n.t('settings.backup') }}
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="file.click()">
            {{ i18n.t('settings.restore') }}
          </ion-button>
          <ion-note class="ion-text-wrap hint">{{ i18n.t('settings.restoreHint') }}</ion-note>
          <ion-button expand="block" fill="outline" (click)="examples()">
            {{ i18n.t('settings.reset') }}
          </ion-button>
        </div>
        <input
          #file
          type="file"
          accept="application/json,.json"
          hidden
          (change)="restore($event)"
        />
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>{{ i18n.t('settings.about') }}</ion-label>
        </ion-list-header>
        <ion-item lines="none">
          <ion-note class="ion-text-wrap">{{ i18n.t('settings.aboutText') }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .buttons {
        padding: 0 16px 8px;
      }
      .hint {
        display: block;
        margin: 4px 0 12px;
        font-size: 0.85em;
      }
    `,
  ],
})
export class SettingsPage {
  i18n = inject(I18n);
  private store = inject(Store);
  private toast = inject(ToastController);

  langs = LANGS;
  @ViewChild('file') fileInput?: ElementRef<HTMLInputElement>;

  backup() {
    const json = JSON.stringify(this.store.exportBackup(), null, 2);
    download(
      new Blob([json], { type: 'application/json' }),
      `fieldlog-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  async restore(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (f.size > MAX_BACKUP_BYTES) return this.say(this.i18n.t('settings.restoreError'));
    try {
      const result = this.store.importBackup(JSON.parse(await f.text()));
      if (!result) return this.say(this.i18n.t('settings.restoreError'));
      await this.say(
        this.i18n.t('settings.restored', { t: result.templates, r: result.records })
      );
    } catch {
      await this.say(this.i18n.t('settings.restoreError'));
    }
  }

  async examples() {
    this.store.addExamples();
    await this.say(this.i18n.t('settings.resetDone'));
  }

  private async say(message: string) {
    const t = await this.toast.create({ message, duration: 3000 });
    await t.present();
  }
}
