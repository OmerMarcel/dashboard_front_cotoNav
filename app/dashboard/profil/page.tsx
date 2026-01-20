'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX, FiLogOut } from 'react-icons/fi'

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
  created_at: string
}

interface UserStats {
  infrastructuresCrees: number
  propositionsValidees: number
  signalementsTraites: number
  avisLaissee: number
}

export default function ProfilPage() {
  const { user: currentUser, token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    avatar: '',
  })

  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setProfile(response.data.user)
      setStats(response.data.stats)
      setFormData({
        nom: response.data.user.nom,
        prenom: response.data.user.prenom,
        telephone: response.data.user.telephone || '',
        avatar: response.data.user.avatar || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await axios.patch(`${API_URL}/profile/me`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setProfile(response.data.user)
      setEditing(false)
      setSuccess('Profil mis à jour avec succès')
      
      // Recharger le profil après quelques secondes pour masquer le message de succès
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profil non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mon Profil</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
          >
            <FiEdit2 /> Modifier
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

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    nom: profile.nom,
                    prenom: profile.prenom,
                    telephone: profile.telephone || '',
                    avatar: profile.avatar || '',
                  })
                  setError('')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FiX /> Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiSave /> Enregistrer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
              {profile.avatar && (
                <img
                  src={profile.avatar}
                  alt={`${profile.prenom} ${profile.nom}`}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-primary-100 flex-shrink-0"
                />
              )}
              {!profile.avatar && (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-100 flex items-center justify-center text-2xl md:text-3xl font-bold text-primary-600 flex-shrink-0">
                  {profile.prenom?.[0]?.toUpperCase() || profile.nom?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                  {profile.prenom} {profile.nom}
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1 break-words">{profile.email}</p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs md:text-sm font-medium">
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t">
              <div className="flex items-start gap-3">
                <FiUser className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium">{profile.prenom} {profile.nom}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {profile.telephone && (
                <div className="flex items-start gap-3">
                  <FiPhone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{profile.telephone}</p>
                  </div>
                </div>
              )}

              {profile.zone && (
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Zone assignée</p>
                    <p className="font-medium">{profile.zone.nom}</p>
                    <p className="text-xs text-gray-400">{profile.zone.type}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FiUser className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {stats && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'agent_communal') && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Infrastructures créées</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {stats.infrastructuresCrees}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Propositions validées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.propositionsValidees}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Signalements traités</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.signalementsTraites}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Avis laissés</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.avisLaissee}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

