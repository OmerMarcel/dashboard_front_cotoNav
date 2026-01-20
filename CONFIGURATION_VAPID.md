# Configuration de la clé VAPID Firebase

## 📋 Étape 1 : Créer le fichier `.env.local`

### Option A : Utiliser le script automatique (recommandé)

**Sur Windows (PowerShell)** :
```powershell
cd dashboard
.\create-env-local.ps1
```

**Sur Linux/Mac (Bash)** :
```bash
cd dashboard
chmod +x create-env-local.sh
./create-env-local.sh
```

### Option B : Créer manuellement

Créez un fichier `.env.local` à la racine du dossier `dashboard/` avec le contenu suivant :

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BF2EdrcsPG6AUzyGsvZ03aOUmRZuHOEnfIszRSZd44_hKDHhSPJy638oSDcvbyag9uMTd2QxKucgyUnR5RmP5J0

# API URL du backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📋 Étape 2 : Redémarrer le serveur de développement

Après avoir créé le fichier `.env.local`, **redémarrez** le serveur Next.js :

```bash
cd dashboard
npm run dev
```

## ✅ Vérification

Une fois le serveur redémarré :

1. Connectez-vous au dashboard
2. Le navigateur devrait vous demander la permission pour les notifications
3. Acceptez la permission
4. Le token FCM sera automatiquement envoyé au backend et enregistré

## 🔍 Où trouver la clé VAPID ?

Si vous avez besoin de régénérer la clé VAPID :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet (`geoloc-cotonou`)
3. Allez dans **Project Settings** (⚙️)
4. Onglet **Cloud Messaging**
5. Section **Web Push certificates**
6. Copiez la clé VAPID (ou générez-en une nouvelle si nécessaire)

## ⚠️ Important

- Le fichier `.env.local` est ignoré par Git (ne sera pas commité)
- Ne partagez jamais votre clé VAPID publiquement
- En production, configurez cette variable d'environnement dans votre plateforme d'hébergement (Vercel, Netlify, etc.)

