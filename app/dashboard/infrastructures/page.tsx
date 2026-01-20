'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FiMapPin, FiEdit, FiTrash2, FiCheck, FiX, FiEye } from 'react-icons/fi'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Infrastructure {
  _id?: string
  id?: string
  nom: string
  type: string
  localisation: {
    adresse: string
    quartier: string
  }
  etat: string
  valide: boolean
  noteMoyenne?: number
  note_moyenne?: number
  nombreAvis?: number
  nombre_avis?: number
}

export default function InfrastructuresPage() {
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    quartier: '',
    valide: '',
    etat: ''
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchInfrastructures()
  }, [page, filters])

  // Écouter les événements de création d'infrastructure depuis les propositions
  useEffect(() => {
    const handleInfrastructureCreated = (event: Event) => {
      const customEvent = event as CustomEvent
      const infrastructureId = customEvent.detail?.infrastructureId
      
      console.log('🔄 Nouvelle infrastructure créée, rafraîchissement de la liste...', infrastructureId)
      
      // Rafraîchir la liste des infrastructures quand une nouvelle est créée
      fetchInfrastructures()
      
      // Si on est sur la première page, on reste, sinon on pourrait revenir à la page 1
      // pour voir la nouvelle infrastructure
      if (page !== 1) {
        setPage(1)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('infrastructureCreated', handleInfrastructureCreated as EventListener)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('infrastructureCreated', handleInfrastructureCreated as EventListener)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchInfrastructures = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (filters.type) params.append('type', filters.type)
      if (filters.quartier) params.append('quartier', filters.quartier)
      if (filters.valide) params.append('valide', filters.valide)
      if (filters.etat) params.append('etat', filters.etat)

      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/infrastructures?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setInfrastructures(response.data.infrastructures)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`${API_URL}/infrastructures/${id}/valider`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      fetchInfrastructures()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette infrastructure ? Cette action est irréversible et supprimera l\'infrastructure de la base de données.')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/infrastructures/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      // Rafraîchir la liste et les favoris
      await fetchInfrastructures()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.response?.data?.message || 'Erreur lors de la suppression de l\'infrastructure')
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      toilettes_publiques: 'Toilettes publiques',
      parc_jeux: 'Parc de jeux',
      centre_sante: 'Centre de santé',
      installation_sportive: 'Installation sportive',
      espace_divertissement: 'Espace de divertissement',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  const getEtatColor = (etat: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-100 text-green-800',
      bon: 'bg-blue-100 text-blue-800',
      moyen: 'bg-yellow-100 text-yellow-800',
      degrade: 'bg-orange-100 text-orange-800',
      ferme: 'bg-red-100 text-red-800'
    }
    return colors[etat] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Infrastructures</h1>
          <p className="text-gray-600 mt-1">Gérer les infrastructures publiques</p>
        </div>
        <Link
          href="/dashboard/infrastructures/nouveau"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          + Ajouter
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les types</option>
          <option value="toilettes_publiques">Toilettes publiques</option>
          <option value="parc_jeux">Parc de jeux</option>
          <option value="centre_sante">Centre de santé</option>
          <option value="installation_sportive">Installation sportive</option>
          <option value="espace_divertissement">Espace de divertissement</option>
        </select>

        <input
          type="text"
          placeholder="Quartier"
          value={filters.quartier}
          onChange={(e) => setFilters({ ...filters, quartier: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />

        <select
          value={filters.valide}
          onChange={(e) => setFilters({ ...filters, valide: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous</option>
          <option value="true">Validées</option>
          <option value="false">En attente</option>
        </select>

        <select
          value={filters.etat}
          onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les états</option>
          <option value="excellent">Excellent</option>
          <option value="bon">Bon</option>
          <option value="moyen">Moyen</option>
          <option value="degrade">Dégradé</option>
          <option value="ferme">Fermé</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quartier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {infrastructures.map((infra) => {
                const infraId = infra.id || infra._id || ''
                if (!infraId) return null
                return (
                <tr key={infraId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{infra.nom}</div>
                    <div className="text-sm text-gray-500">{infra.localisation.adresse}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTypeLabel(infra.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {infra.localisation.quartier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEtatColor(infra.etat)}`}>
                      {infra.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((infra.noteMoyenne ?? infra.note_moyenne) || 0).toFixed(1)}/5 ({(infra.nombreAvis ?? infra.nombre_avis) || 0} avis)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {infra.valide ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Validée
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {/* Bouton Voir les détails */}
                      <Link
                        href={`/dashboard/infrastructures/${infraId}`}
                        className="p-2 rounded-lg text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                        title="Voir les détails"
                      >
                        <FiEye className="w-5 h-5" />
                      </Link>

                      {/* Bouton Modifier */}
                      <Link
                        href={`/dashboard/infrastructures/${infraId}/edit`}
                        className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Modifier l'infrastructure"
                      >
                        <FiEdit className="w-5 h-5" />
                      </Link>

                      {/* Bouton Valider (seulement si non validé) */}
                      {!infra.valide && (
                        <button
                          onClick={() => handleValidate(infraId)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                          title="Valider l'infrastructure"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                      )}

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => handleDelete(infraId)}
                        className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Supprimer l'infrastructure"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-700">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

