import { NotificationType, UserRole } from './types'

export function getAllowedNotificationTypes(role: UserRole): NotificationType[] {
  // super_admin et admin: tout
  if (role === 'super_admin' || role === 'admin') {
    return ['proposition', 'signalement', 'favori', 'utilisateur']
  }

  // agent_communal: uniquement signalement, proposition, favori
  if (role === 'agent_communal') {
    return ['proposition', 'signalement', 'favori']
  }

  // fallback: rien (ou adapter si d’autres rôles existent)
  return []
}



