import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { getFirebaseApp } from './client'

export async function initMessagingAndGetToken() {
  const supported = await isSupported()
  if (!supported) return { token: null as string | null, reason: 'not_supported' as const }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) return { token: null as string | null, reason: 'missing_vapid_key' as const }

  const messaging = getMessaging(getFirebaseApp())
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  })

  return { token, reason: 'ok' as const }
}

export async function listenForegroundMessages(
  onPayload: (payload: any) => void
) {
  const supported = await isSupported()
  if (!supported) return () => {}
  const messaging = getMessaging(getFirebaseApp())
  return onMessage(messaging, onPayload)
}


