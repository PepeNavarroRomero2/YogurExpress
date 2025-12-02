import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';

import { AppComponent } from './app/app.component';
import { appConfig }   from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...appConfig.providers
  ]
}).catch(err => console.error(err));

