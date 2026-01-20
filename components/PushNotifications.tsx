'use client'

import { useAuth } from '@/contexts/AuthContext'
import { initMessagingAndGetToken, listenForegroundMessages } from '@/lib/firebase/messaging'
import axios from 'axios'
import { useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

/**
 * Active FCM Web Push:
 * - enregistre le service worker
 * - demande la permission
 * - récupère le token navigateur
 * - envoie le token au backend pour lier un utilisateur à un device
 */
export default function PushNotifications() {
  const { user, token } = useAuth()
  const didInit = useRef(false)

  useEffect(() => {
    if (!user?.id || !token) return
    if (didInit.current) return
    didInit.current = true

    ;(async () => {
      try {
        if (!('serviceWorker' in navigator)) return

        // Enregistrer le SW FCM
        await navigator.serviceWorker.register('/firebase-messaging-sw.js')

        // Demander permission (si déjà accordée => pas de popup)
        if (Notification.permission === 'default') {
          await Notification.requestPermission()
        }
        if (Notification.permission !== 'granted') return

        const { token: fcmToken } = await initMessagingAndGetToken()
        if (!fcmToken) return

        // Envoyer au backend (à implémenter côté API)
        await axios.post(
          `${API_URL}/notifications/fcm-token`,
          { token: fcmToken, platform: 'web' },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Foreground: afficher une notif native si la page est ouverte
        await listenForegroundMessages((payload) => {
          const title = payload?.notification?.title || 'Notification'
          const body = payload?.notification?.body || ''
          const href = payload?.data?.href

          // Affichage natif
          const n = new Notification(title, {
            body,
            icon: '/images/logo1.png',
            data: { href },
          })

          n.onclick = () => {
            n.close()
            if (href) window.open(href, '_blank')
          }
        })
      } catch (e) {
        console.error('PushNotifications init error:', e)
      }
    })()
  }, [token, user?.id])

  return null
}


