import { provideHttpClient } from '@angular/common/http'
import type { ApplicationConfig } from '@angular/core'
import { initializeApp, provideFirebaseApp } from '@angular/fire/app'
import { getAuth, provideAuth } from '@angular/fire/auth'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'

const firebaseConfig = {
  apiKey: import.meta.env.NG_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.NG_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.NG_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.NG_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.NG_APP_FIREBASE_APP_ID,
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
}
