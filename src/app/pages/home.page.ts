import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  constructOutline,
  createOutline,
  diamondOutline,
  documentTextOutline,
  layersOutline,
  leafOutline,
  libraryOutline,
  shieldCheckmarkOutline,
  warningOutline,
  waterOutline,
} from 'ionicons/icons';
import { CATEGORY_META } from '../core/categories';
import { I18n } from '../core/i18n';
import { Store } from '../core/store';
import { CATEGORIES, Category } from '../models';

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
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSearchbar,
    IonChip,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>
          <span class="brand">Field<b>Log</b></span>
          <span class="tag">{{ i18n.t('app.tagline') }}</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="goLibrary()" [attr.aria-label]="i18n.t('home.library')">
            <ion-icon slot="start" name="library-outline"></ion-icon>
            {{ i18n.t('home.library') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="dark">
        <ion-searchbar
          [placeholder]="i18n.t('home.search')"
          [debounce]="150"
          (ionInput)="query.set(($any($event.target).value ?? '').toString())"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!store.persistent()) {
        <div class="warn">
          <ion-icon name="warning-outline"></ion-icon>
          {{ i18n.t('home.storageWarn') }}
        </div>
      }

      @if (store.templates().length > 0) {
        <div class="chips">
          <ion-chip [outline]="cat() !== ''" (click)="cat.set('')">
            {{ i18n.t('home.all') }}
          </ion-chip>
          @for (c of usedCategories(); track c) {
            <ion-chip [outline]="cat() !== c" (click)="cat.set(c)">
              {{ i18n.t('cat.' + c) }}
            </ion-chip>
          }
        </div>
      }

      @if (store.templates().length === 0) {
        <div class="empty">
          <ion-icon name="library-outline"></ion-icon>
          <h2>{{ i18n.t('home.empty') }}</h2>
          <p>{{ i18n.t('home.emptyHint') }}</p>
          <ion-button (click)="goLibrary()">{{ i18n.t('home.library') }}</ion-button>
        </div>
      } @else if (visible().length === 0) {
        <p class="none">{{ i18n.t('home.noMatch') }}</p>
      }

      <ion-list lines="full">
        @for (tpl of visible(); track tpl.id) {
          <ion-item [button]="true" detail="false" (click)="open(tpl.id)">
            <span
              class="badge"
              slot="start"
              [style.background]="meta(tpl.category).color"
            >
              <ion-icon [name]="meta(tpl.category).icon"></ion-icon>
            </span>
            <ion-label>
              <h2>{{ tpl.name }}</h2>
              @if (tpl.description) {
                <p class="desc">{{ tpl.description }}</p>
              }
              <p>
                {{ i18n.t('home.fields', { n: tpl.fields.length }) }} ·
                {{ i18n.t('home.records', { n: store.recordCounts().get(tpl.id) ?? 0 }) }}
              </p>
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              color="medium"
              [attr.aria-label]="i18n.t('home.edit')"
              (click)="edit($event, tpl.id)"
            >
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
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
      .brand {
        font-weight: 400;
        letter-spacing: 0.3px;
      }
      .brand b {
        color: var(--ion-color-primary);
      }
      .tag {
        display: block;
        font-size: 0.65em;
        font-weight: 400;
        opacity: 0.7;
        margin-top: -2px;
      }
      .chips {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding: 8px 12px 0;
        scrollbar-width: none;
      }
      .chips ion-chip {
        flex: 0 0 auto;
      }
      .warn {
        margin: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--ion-color-warning-tint);
        color: #3b2a00;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .empty {
        text-align: center;
        padding: 48px 24px;
        color: var(--ion-color-medium);
      }
      .empty ion-icon {
        font-size: 56px;
        color: var(--ion-color-primary);
      }
      .none {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 24px;
      }
      .badge {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 22px;
        margin-right: 4px;
      }
      .desc {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: normal;
      }
      ion-list {
        padding-bottom: 80px;
      }
    `,
  ],
})
export class HomePage {
  i18n = inject(I18n);
  store = inject(Store);
  private router = inject(Router);

  query = signal('');
  cat = signal<Category | ''>('');

  usedCategories = computed(() => {
    const used = new Set(this.store.templates().map((t) => t.category));
    return CATEGORIES.filter((c) => used.has(c));
  });

  visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const c = this.cat();
    return this.store
      .templates()
      .filter((t) => !c || t.category === c)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name, this.i18n.lang()));
  });

  constructor() {
    addIcons({
      add,
      constructOutline,
      createOutline,
      diamondOutline,
      documentTextOutline,
      layersOutline,
      leafOutline,
      libraryOutline,
      shieldCheckmarkOutline,
      warningOutline,
      waterOutline,
    });
  }

  meta(c: Category) {
    return CATEGORY_META[c] ?? CATEGORY_META.custom;
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

  goLibrary() {
    this.router.navigate(['/library']);
  }
}
