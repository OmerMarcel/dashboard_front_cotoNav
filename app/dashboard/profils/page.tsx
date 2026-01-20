'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiTrash2, 
  FiEye, 
  FiChevronRight,
  FiUsers,
  FiShield,
  FiBriefcase,
  FiX,
  FiPlus,
  FiSave
} from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  avatar?: string
  role: string
  zone_id?: string
  zone?: {
    id: string
    nom: string
    type: string
  }
  actif: boolean
  created_at: string
  cree_par?: {
    id: string
    nom: string
    prenom: string
    email: string
  }
}

interface UserDetails {
  infrastructuresCreesCount: number
  propositionsValideesCount: number
  signalementsTraitesCount: number
  signalementsAssignesCount: number
  tachesAssigneesCount: number
}

export default function ProfilsPage() {
  const { user: currentUser, token } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'agent_communal' | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [zones, setZones] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingZones, setLoadingZones] = useState(false)
  
  // Formulaire de création d'agent
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
    zone_id: '',
    zone_nom: '', // Nom de zone personnalisé
  })

  useEffect(() => {
    if (!currentUser) return

    // Seuls Super Admin et Admin peuvent accéder à cette page
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
    fetchZones()
  }, [currentUser, selectedRole, token])

  const fetchZones = async () => {
    try {
      setLoadingZones(true)
      const response = await axios.get(`${API_URL}/zones`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { actif: true }
      })
      setZones(response.data.zones || [])
    } catch (err: any) {
      console.error('Erreur lors du chargement des zones:', err)
    } finally {
      setLoadingZones(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      // Super Admin peut voir tous les admins et agents
      // Admin peut voir uniquement les agents de sa zone
      let url = `${API_URL}/roles/`
      if (selectedRole === 'admin') {
        url += 'admins'
      } else if (selectedRole === 'agent_communal') {
        url += 'agents'
      } else {
        // Récupérer tous les admins et agents
        const [adminsRes, agentsRes] = await Promise.all([
          axios.get(`${API_URL}/roles/admins`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/roles/agents`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        
        setUsers([...adminsRes.data.admins, ...agentsRes.data.agents])
        setLoading(false)
        return
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (selectedRole === 'admin') {
        setUsers(response.data.admins || [])
      } else {
        setUsers(response.data.agents || [])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUserDetails(response.data.details)
      setShowDetailsModal(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des détails')
    }
  }

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${user.prenom} ${user.nom} ?`)) {
      return
    }

    try {
      await axios.delete(`${API_URL}/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSuccess(`Compte de ${user.prenom} ${user.nom} supprimé avec succès`)
      fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrateur',
      admin: 'Administrateur',
      agent_communal: 'Agent Communal',
    }
    return labels[role] || role
  }

  const getRoleIcon = (role: string) => {
    if (role === 'super_admin' || role === 'admin') {
      return <FiShield className="w-5 h-5" />
    }
    return <FiBriefcase className="w-5 h-5" />
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      // Déterminer la zone : Admin utilise sa zone, Super Admin peut choisir une zone ou laisser vide
      let zoneId = null
      
      if (currentUser?.role === 'admin') {
        // Admin utilise automatiquement sa zone
        zoneId = (currentUser as any).zone_id
      } else if (currentUser?.role === 'super_admin') {
        // Super Admin peut choisir une zone existante ou laisser vide (optionnel)
        // Si zone_nom est fourni, on essaiera de créer ou trouver une zone avec ce nom
        if (formData.zone_id) {
          // Zone existante sélectionnée
          zoneId = formData.zone_id
        } else if (formData.zone_nom && formData.zone_nom.trim()) {
          // Zone personnalisée saisie - créer une zone temporaire ou laisser null
          // Pour l'instant, on laisse null et on pourra améliorer plus tard
          // pour créer automatiquement une zone avec ce nom
          zoneId = null
        }
        // Si ni zone_id ni zone_nom, zoneId reste null (agent sans zone)
      }

      // Préparer les données à envoyer
      const agentData: any = {
        email: formData.email,
        password: formData.password,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone || undefined,
      }

      // Gérer la zone selon le rôle
      if (currentUser?.role === 'admin') {
        // Admin : zone_id est toujours requis (sa zone)
        agentData.zone_id = zoneId
      } else if (currentUser?.role === 'super_admin') {
        // Super Admin : peut envoyer zone_id ou zone_nom
        if (formData.zone_id) {
          // Zone existante sélectionnée
          agentData.zone_id = formData.zone_id
        } else if (formData.zone_nom && formData.zone_nom.trim()) {
          // Zone personnalisée saisie - le backend créera automatiquement la zone
          agentData.zone_nom = formData.zone_nom.trim()
        }
        // Si ni zone_id ni zone_nom, on ne les inclut pas (agent sans zone)
      }

      const response = await axios.post(
        `${API_URL}/roles/agents`,
        agentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setSuccess(`Agent communal créé avec succès : ${response.data.agent.email}${formData.zone_nom ? ` (Zone: ${formData.zone_nom})` : ''}`)
      setShowCreateModal(false)
      setFormData({
        email: '',
        password: '',
        nom: '',
        prenom: '',
        telephone: '',
        zone_id: '',
        zone_nom: '',
      })
      fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'agent')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Super Admin peut voir admins et agents, Admin peut voir uniquement les agents
  const canViewAdmins = currentUser?.role === 'super_admin'
  const canViewAgents = currentUser?.role === 'super_admin' || currentUser?.role === 'admin'

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestion des Profils</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {currentUser?.role === 'super_admin' 
              ? 'Gérer les administrateurs et agents communaux' 
              : 'Gérer les agents communaux de votre zone'}
          </p>
        </div>
        {canViewAgents && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>Créer un Agent</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {canViewAdmins && (
            <button
              onClick={() => setSelectedRole('admin')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'admin'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiShield className="inline w-4 h-4 mr-2" />
              Administrateurs
            </button>
          )}
          {canViewAgents && (
            <button
              onClick={() => setSelectedRole('agent_communal')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'agent_communal'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiBriefcase className="inline w-4 h-4 mr-2" />
              Agents Communaux
            </button>
          )}
          {canViewAdmins && canViewAgents && (
            <button
              onClick={() => setSelectedRole('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRole === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiUsers className="inline w-4 h-4 mr-2" />
              Tous
            </button>
          )}
        </div>
      </div>

      {/* Liste des utilisateurs - Mobile (cartes) */}
      <div className="md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.prenom} ${user.nom}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                      {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleIcon(user.role)}
                      <span className="text-xs text-gray-500">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      fetchUserDetails(user.id)
                    }}
                    className="text-primary-600 hover:text-primary-900 p-2"
                    title="Voir les détails"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                  {(currentUser?.role === 'super_admin' || 
                    (currentUser?.role === 'admin' && user.role === 'agent_communal')) && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Supprimer"
                      disabled={user.id === currentUser?.id}
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t">
                {user.telephone && (
                  <div className="text-sm">
                    <span className="text-gray-500">Téléphone:</span>{' '}
                    <span className="text-gray-900">{user.telephone}</span>
                  </div>
                )}
                {user.zone ? (
                  <div className="text-sm">
                    <span className="text-gray-500">Zone:</span>{' '}
                    <span className="text-gray-900">{user.zone.nom}</span>
                    <span className="text-xs text-gray-400 ml-1">({user.zone.type})</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Zone: Non assigné</div>
                )}
                <div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Liste des utilisateurs - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.prenom} ${user.nom}`}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                            {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getRoleIcon(user.role)}
                            <span className="text-xs text-gray-500">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.telephone && (
                        <div className="text-sm text-gray-500">{user.telephone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.zone ? (
                        <div>
                          <div className="text-sm text-gray-900">{user.zone.nom}</div>
                          <div className="text-xs text-gray-500">{user.zone.type}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            fetchUserDetails(user.id)
                          }}
                          className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                          title="Voir les détails"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {(currentUser?.role === 'super_admin' || 
                          (currentUser?.role === 'admin' && user.role === 'agent_communal')) && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                            title="Supprimer le compte"
                            disabled={user.id === currentUser?.id}
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création d'agent */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Créer un Agent Communal
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    Remplissez les informations pour créer un nouveau compte agent
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({
                      email: '',
                      password: '',
                      nom: '',
                      prenom: '',
                      telephone: '',
                      zone_id: '',
                      zone_nom: '',
                    })
                    setError('')
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAgent} className="space-y-4 md:space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+229..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone <span className="text-xs text-gray-500">(optionnel)</span>
                    </label>
                    {currentUser?.role === 'admin' ? (
                      <>
                        <input
                          type="text"
                          value={(currentUser as any).zone?.nom || 'Zone assignée à l\'admin'}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          L'agent sera automatiquement assigné à votre zone
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={formData.zone_id}
                          onChange={(e) => setFormData({ ...formData, zone_id: e.target.value, zone_nom: '' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          disabled={loadingZones}
                        >
                          <option value="">Sélectionner une zone existante (optionnel)</option>
                          {zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.nom} ({zone.type})
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <span className="text-xs text-gray-500">OU</span>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                        <input
                          type="text"
                          value={formData.zone_nom}
                          onChange={(e) => setFormData({ ...formData, zone_nom: e.target.value, zone_id: '' })}
                          placeholder="Saisir une zone personnalisée (optionnel)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500">
                          Vous pouvez sélectionner une zone existante ou saisir une zone personnalisée
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({
                        email: '',
                        password: '',
                        nom: '',
                        prenom: '',
                        telephone: '',
                        zone_id: '',
                        zone_nom: '',
                      })
                      setError('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FiSave className="w-5 h-5" />
                    Créer l'Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Profil de {selectedUser.prenom} {selectedUser.nom}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mt-1">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedUser(null)
                    setUserDetails(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Rôle</label>
                    <p className="font-medium">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                  {selectedUser.telephone && (
                    <div>
                      <label className="text-sm text-gray-500">Téléphone</label>
                      <p className="font-medium">{selectedUser.telephone}</p>
                    </div>
                  )}
                  {selectedUser.zone && (
                    <div>
                      <label className="text-sm text-gray-500">Zone assignée</label>
                      <p className="font-medium">{selectedUser.zone.nom}</p>
                      <p className="text-sm text-gray-400">{selectedUser.zone.type}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500">Membre depuis</label>
                    <p className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedUser.cree_par && (
                    <div>
                      <label className="text-sm text-gray-500">Créé par</label>
                      <p className="font-medium">
                        {selectedUser.cree_par.prenom} {selectedUser.cree_par.nom}
                      </p>
                      <p className="text-sm text-gray-400">{selectedUser.cree_par.email}</p>
                    </div>
                  )}
                </div>

                {userDetails && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Statistiques</h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="bg-primary-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Infrastructures créées</p>
                        <p className="text-2xl font-bold text-primary-600 mt-1">
                          {userDetails.infrastructuresCreesCount}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Propositions validées</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {userDetails.propositionsValideesCount}
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Signalements traités</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-1">
                          {userDetails.signalementsTraitesCount}
                        </p>
                      </div>
                      {selectedUser.role === 'agent_communal' && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Signalements assignés</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {userDetails.signalementsAssignesCount}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

