import { APP_INITIALIZER, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withHashLocation,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { Store } from './app/core/store';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    // Load local data before the first screen renders.
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [Store],
      useFactory: (store: Store) => () => store.init(),
    },
    // Hash routing: works on any static host (GitHub Pages, S3, a USB stick…).
    provideRouter(routes, withHashLocation(), withPreloading(PreloadAllModules)),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch((err) => console.error(err));
