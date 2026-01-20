/* eslint-disable no-undef */
// Firebase Messaging service worker for Web Push (FCM)
// IMPORTANT: Keep this file at /public/firebase-messaging-sw.js

// We use the compat build inside service worker for simplicity.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// NOTE: Un service worker ne voit pas les variables d'env Next.js.
// On met donc la config directement. Si vous changez de projet Firebase,
// mettez ces valeurs à jour (ou générez un fichier sw spécifique à votre env).
firebase.initializeApp({
  apiKey: 'AIzaSyDPAKyaXFXOQUDrCADfMAOS3yPSRDvuHGI',
  authDomain: 'geoloc-cotonou.firebaseapp.com',
  projectId: 'geoloc-cotonou',
  storageBucket: 'geoloc-cotonou.firebasestorage.app',
  messagingSenderId: '191342105680',
  appId: '1:191342105680:android:842ebafae0e595eb19ed55',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Notification'
  const options = {
    body: payload?.notification?.body || '',
    icon: '/images/logo1.png',
    data: payload?.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification?.data?.href

  if (href) {
    event.waitUntil(clients.openWindow(href))
  }
})


