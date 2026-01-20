'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FiAlertCircle, FiCheck, FiX } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Signalement {
  _id: string
  type: string
  description: string
  statut: string
  infrastructure: {
    nom: string
    type: string
  }
  signalePar?: {
    nom?: string
    prenom?: string
    email?: string
  }
  createdAt: string
}

export default function SignalementsPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchSignalements()
  }, [filter])

  const fetchSignalements = async () => {
    try {
      const params = filter ? `?statut=${filter}` : ''
      const response = await axios.get(`${API_URL}/signalements${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const raw = response.data.signalements || []

      // Normaliser les données pour utiliser signalePar (camelCase) et _id côté frontend
      const mapped: Signalement[] = raw.map((s: any) => ({
        ...s,
        _id: s.id || s._id, // Utiliser id de Supabase comme _id pour le frontend
        signalePar: s.signalePar || s.signale_par || undefined,
      }))

      setSignalements(mapped)
    } catch (error: any) {
      console.error('Erreur lors du chargement des signalements:', error)
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, statut: string) => {
    try {
      // Normaliser l'ID : utiliser id si c'est un _id (Supabase retourne id, pas _id)
      const signalementId = id.includes('_id') ? id : id
      
      const response = await axios.patch(
        `${API_URL}/signalements/${signalementId}`, 
        { statut },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      // Message de confirmation selon le statut
      const messages: Record<string, string> = {
        'en_cours': 'Signalement mis en cours de traitement. Notification envoyée aux utilisateurs.',
        'resolu': 'Signalement résolu. Notification envoyée aux utilisateurs.',
        'rejete': 'Signalement rejeté. Notification envoyée aux utilisateurs.'
      }
      
      if (messages[statut]) {
        alert(messages[statut])
      }
      
      // Rafraîchir la liste
      await fetchSignalements()
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erreur lors de la mise à jour du signalement'
      
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
      } else if (error.response?.status === 404) {
        alert('Signalement non trouvé')
      } else {
        alert(`Erreur: ${errorMessage}`)
      }
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      equipement_degrade: 'Équipement dégradé',
      fermeture_temporaire: 'Fermeture temporaire',
      information_incorrecte: 'Information incorrecte',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
        <p className="text-gray-600 mt-1">Gérer les signalements des utilisateurs</p>
      </div>

      {/* Filtre */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="nouveau">Nouveaux</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {signalements.map((signalement) => (
          <div key={signalement._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FiAlertCircle className="text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {signalement.infrastructure.nom}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {getTypeLabel(signalement.type)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    signalement.statut === 'nouveau' ? 'bg-red-100 text-red-800' :
                    signalement.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                    signalement.statut === 'resolu' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {signalement.statut === 'nouveau' ? 'Nouveau' :
                     signalement.statut === 'en_cours' ? 'En cours' :
                     signalement.statut === 'resolu' ? 'Résolu' : 'Rejeté'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{signalement.description}</p>
                <p className="text-sm text-gray-500">
                  {signalement.signalePar
                    ? <>
                        Signalé par {signalement.signalePar.prenom ?? ''} {signalement.signalePar.nom ?? ''}
                      </>
                    : 'Signalé par un utilisateur'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(signalement.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {signalement.statut === 'nouveau' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(signalement._id || (signalement as any).id, 'en_cours')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    En cours
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(signalement._id || (signalement as any).id, 'resolu')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FiCheck /> Résolu
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(signalement._id || (signalement as any).id, 'rejete')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <FiX /> Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

