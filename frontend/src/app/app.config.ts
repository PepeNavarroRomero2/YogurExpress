import { importProvidersFrom } from '@angular/core';
import { provideRouter }       from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    // importProvidersFrom(SomeModule), si hace falta
  ]
};
