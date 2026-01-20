'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FiUser, FiEdit, FiX, FiCheck } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface User {
  _id: string
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  contributions: {
    infrastructuresProposees: number
    avisLaisses: number
    signalements: number
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
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await axios.patch(`${API_URL}/users/${id}/role`, { role: newRole })
      fetchUsers()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-600 mt-1">Gérer les utilisateurs de l'application</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-2 gap-4">
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les rôles</option>
          <option value="citoyen">Citoyen</option>
          <option value="moderateur">Modérateur</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={filters.actif}
          onChange={(e) => setFilters({ ...filters, actif: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {user.prenom.charAt(0)}{user.nom.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="citoyen">Citoyen</option>
                      <option value="moderateur">Modérateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-xs">
                      {user.contributions.infrastructuresProposees} propositions,{' '}
                      {user.contributions.avisLaisses} avis,{' '}
                      {user.contributions.signalements} signalements
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.actif ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(user._id, user.actif)}
                      className={`${
                        user.actif
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.actif ? <FiX className="w-5 h-5" /> : <FiCheck className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

