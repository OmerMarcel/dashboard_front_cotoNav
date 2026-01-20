# FCM Web Push (Dashboard)

Ce dashboard supporte les **notifications push web** via Firebase Cloud Messaging (FCM).

## 1) Variables d’environnement (obligatoire)

### ⚠️ ACTION REQUISE : Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du dossier `dashboard/` avec le contenu suivant :

```env
# Firebase Configuration - Clé VAPID (OBLIGATOIRE)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BF2EdrcsPG6AUzyGsvZ03aOUmRZuHOEnfIszRSZd44_hKDHhSPJy638oSDcvbyag9uMTd2QxKucgyUnR5RmP5J0

# API URL du backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Important** : Après avoir créé ce fichier, **redémarrez** le serveur Next.js (`npm run dev`).

### Variables disponibles

- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` : la clé VAPID WebPush (OBLIGATOIRE - déjà fournie ci-dessus)

Optionnel (recommandé en prod):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 2) Service worker

Le service worker FCM est ici:

- `public/firebase-messaging-sw.js`

Il est enregistré automatiquement au login (composant `components/PushNotifications.tsx`).

## 3) Endpoint backend attendu

Le dashboard envoie le token FCM au backend:

- `POST /api/notifications/fcm-token`
  - body: `{ token: string, platform: 'web' }`
  - auth: `Authorization: Bearer <jwt>`

Le backend doit stocker ce token (lié à l’utilisateur) pour pouvoir envoyer des push.

## 4) Payload push attendu (recommandé)

Quand le backend envoie un push, inclure:

- `notification.title`
- `notification.body`
- `data.href` (optionnel, pour ouvrir une page au clic)


