import { Timestamp } from 'firebase/firestore'

export type NotificationType = 'proposition' | 'signalement' | 'favori' | 'utilisateur'

export type UserRole = 'super_admin' | 'admin' | 'agent_communal' | string

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  createdAt: Timestamp | Date | null
  // Ids utilisateurs (dashboard) ayant déjà lu
  readBy?: string[]
  // optionnel: cibler des rôles spécifiques côté backend
  targetRoles?: UserRole[]
  // optionnel: lien interne vers la page concernée
  href?: string
}



