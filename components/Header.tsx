'use client'

import { useAuth } from '@/contexts/AuthContext'
import { getDb } from '@/lib/firebase/client'
import { getAllowedNotificationTypes } from '@/lib/notifications/roleFilter'
import { AppNotification } from '@/lib/notifications/types'
import {
  Timestamp,
  arrayUnion,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
} from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FiBell, FiSearch, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi'

export default function Header() {
  const { user, logout, token, firebaseAuthenticated } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notifError, setNotifError] = useState<string>('')
  const [retryingAuth, setRetryingAuth] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrateur',
      admin: 'Administrateur',
      agent_communal: 'Agent Communal',
      citoyen: 'Citoyen',
    }
    return labels[role] || role
  }

  const allowedTypes = useMemo(() => {
    return getAllowedNotificationTypes(user?.role || '')
  }, [user?.role])

  const unreadCount = useMemo(() => {
    if (!user?.id) return 0
    return notifications.filter((n) => !(n.readBy || []).includes(user.id)).length
  }, [notifications, user?.id])

  // Vérifier et réessayer l'authentification Firebase si nécessaire
  useEffect(() => {
    if (!user?.id || !token || firebaseAuthenticated) return
    
    const checkAndRetryAuth = async () => {
      try {
        const { getAuthInstance } = require('@/lib/firebase/client')
        const auth = getAuthInstance()
        
        // Si l'utilisateur n'est pas authentifié avec Firebase mais qu'on a un token JWT
        if (!auth.currentUser && !retryingAuth) {
          console.log('🔄 Tentative de réauthentification Firebase...')
          setRetryingAuth(true)
          
          try {
            const axios = require('axios')
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
            
            const tokenResponse = await axios.get(`${API_URL}/auth/firebase-token`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            if (tokenResponse.data.firebaseToken) {
              const { authenticateWithFirebase } = require('@/lib/firebase/client')
              await authenticateWithFirebase(tokenResponse.data.firebaseToken)
              console.log('✅ Réauthentification Firebase réussie')
              setNotifError('')
            }
          } catch (retryError) {
            console.error('❌ Erreur lors de la réauthentification Firebase:', retryError)
          } finally {
            setRetryingAuth(false)
          }
        }
      } catch (error) {
        console.error('Erreur vérification Firebase Auth:', error)
        setRetryingAuth(false)
      }
    }
    
    checkAndRetryAuth()
  }, [user?.id, token, firebaseAuthenticated, retryingAuth])

  // Désactiver temporairement les notifications Firebase pour éviter les erreurs
  // TODO: Configurer Supabase pour les notifications ou corriger la configuration Firebase
  useEffect(() => {
    setNotifications([])
    setNotifError('')
    return () => {}
  }, [user?.id, allowedTypes.length])

  const markAsRead = async (notifId: string) => {
    console.log('🔔 Notifications désactivées - markAsRead non fonctionnel')
    // TODO: Implémenter avec Supabase
  }

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      proposition: "Nouvelle proposition d'infrastructure",
      signalement: 'Nouveau signalement',
      favori: 'Nouveau favori',
      utilisateur: 'Nouvel utilisateur',
    }
    return labels[type] || type
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Recherche - masquée sur mobile */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif((v) => !v)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Notifications"
            >
            <FiBell className="w-5 h-5 md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] leading-[18px] rounded-full text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
          </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)}></div>
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Notifications</div>
                    <div className="text-xs text-gray-500">
                      {unreadCount} non lue(s)
                    </div>
                  </div>

                  {notifError && (
                    <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                      {notifError}
                    </div>
                  )}

                  <div className="max-h-[420px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune notification pour le moment.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((n) => {
                          const isUnread = user?.id ? !((n.readBy || []).includes(user.id)) : false
                          const created = (n.createdAt as any)?.toDate?.()
                            ? (n.createdAt as any).toDate()
                            : null
                          return (
                            <div
                              key={n.id}
                              className={`px-4 py-3 hover:bg-gray-50 ${isUnread ? 'bg-primary-50/40' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs uppercase tracking-wide text-gray-400">
                                    {typeLabel(n.type)}
                                  </div>
                                  <div className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                    {n.title}
                                  </div>
                                  {n.message ? (
                                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {n.message}
                                    </div>
                                  ) : null}
                                  {created ? (
                                    <div className="text-[11px] text-gray-400 mt-1">
                                      {created.toLocaleString('fr-FR')}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                  {n.href ? (
                                    <Link
                                      href={n.href}
                                      onClick={async () => {
                                        await markAsRead(n.id)
                                        setShowNotif(false)
                                      }}
                                      className="text-xs text-primary-700 hover:text-primary-900 whitespace-nowrap"
                                    >
                                      Ouvrir
                                    </Link>
                                  ) : null}
                                  {isUnread ? (
                                    <button
                                      onClick={() => markAsRead(n.id)}
                                      className="text-xs text-gray-600 hover:text-gray-900 whitespace-nowrap"
                                      title="Marquer comme lu"
                                    >
                                      Lu
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 md:gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.prenom} {user?.nom}
              </div>
                <div className="text-xs text-gray-500">{getRoleLabel(user?.role || '')}</div>
            </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm md:text-base">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
              <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 md:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-4 border-b border-gray-200 md:hidden">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.prenom} {user?.nom}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
                    <div className="text-xs text-gray-500 mt-1">{getRoleLabel(user?.role || '')}</div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        router.push('/dashboard/profil')
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      Mon Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

