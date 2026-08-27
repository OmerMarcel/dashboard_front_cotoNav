'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FiUser, FiX, FiCheck, FiTrash2 } from 'react-icons/fi'
import LogoLoader from '@/components/LogoLoader'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface User {
  id?: string
  _id?: string
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  contributions?: {
    infrastructuresProposees?: number
    avisLaisses?: number
    signalements?: number
  }
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: '',
    actif: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.actif) params.append('actif', filters.actif)

      const response = await axios.get(`${API_URL}/users?${params}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_URL}/users/${id}/actif`, { actif: !currentStatus })
      fetchUsers()
    } catch (err: any) {
      console.error('Erreur:', err)
      alert(err.response?.data?.message || 'Erreur lors de la suspension / réactivation.')
    }
  }

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await axios.patch(`${API_URL}/users/${id}/role`, { role: newRole })
      fetchUsers()
    } catch (err: any) {
      console.error('Erreur:', err)
      alert(err.response?.data?.message || 'Erreur lors du changement de rôle.')
    }
  }

  const handleDelete = async (user: User) => {
    const id = user.id || user._id
    if (!id) return
    const name = [user.prenom, user.nom].filter(Boolean).join(' ') || user.email
    if (!confirm(`Supprimer définitivement l'utilisateur "${name}" ? Cette action est irréversible.`)) return
    try {
      await axios.delete(`${API_URL}/users/${id}`)
      fetchUsers()
    } catch (err: any) {
      console.error('Erreur:', err)
      alert(err.response?.data?.message || 'Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LogoLoader size="lg" text="Chargement des utilisateurs..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Gérer les utilisateurs de l'application</p>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous les rôles</option>
          <option value="citoyen">Citoyen</option>
          <option value="agent_communal">Agent communal</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <select
          value={filters.actif}
          onChange={(e) => setFilters({ ...filters, actif: e.target.value })}
          className="border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
        >
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/70">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contributions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-gray-100 dark:divide-slate-700/50">
              {users.map((user) => {
                const uid = user.id || user._id || ''
                return (
                <tr key={uid} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 shadow-sm flex-shrink-0">
                        {(user.prenom || '').charAt(0)}{(user.nom || '').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {user.prenom} {user.nom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(uid, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#96D0EE]"
                    >
                      <option value="citoyen">Citoyen</option>
                      <option value="agent_communal">Agent communal</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                    <div className="text-xs">
                      {user.contributions?.infrastructuresProposees ?? 0} propositions,{' '}
                      {user.contributions?.avisLaisses ?? 0} avis,{' '}
                      {user.contributions?.signalements ?? 0} signalements
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.actif ? (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300">
                        Suspendu
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(uid, user.actif)}
                        title={user.actif ? 'Suspendre' : 'Réactiver'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          user.actif
                            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'
                        }`}
                      >
                        {user.actif ? <><FiX className="w-4 h-4" /> <span>Suspendre</span></> : <><FiCheck className="w-4 h-4" /> <span>Réactiver</span></>}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        title="Supprimer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      >
                        <FiTrash2 className="w-4 h-4" /> <span>Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

