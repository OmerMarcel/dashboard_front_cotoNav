'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { FiClock, FiCheck, FiX, FiEye, FiMapPin, FiXCircle } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface PropositionUser {
  id?: string
  nom?: string
  prenom?: string
  email?: string
}

interface PropositionLocalisation {
  adresse?: string
  quartier?: string
  commune?: string
  coordinates?: [number, number]
}

interface PropositionContact {
  telephone?: string
  website?: string
}

interface Proposition {
  id: string
  nom: string
  type: string
  localisation?: PropositionLocalisation
  statut: string
  propose_par?: PropositionUser
  description?: string
  photos?: string[]
  images?: string[]
  contact?: PropositionContact
  horaires?: Record<string, string>
  openingHours?: Record<string, string>
  equipements?: string[]
  equipments?: string[]
  createdAt?: string
  created_at?: string
}

interface CreatedInfrastructure {
  id?: string
  _id?: string
  nom?: string
  localisation?: {
    adresse?: string
    quartier?: string
  }
  type?: string
}

export default function PropositionsPage() {
  const [propositions, setPropositions] = useState<Proposition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedProposition, setSelectedProposition] = useState<Proposition | null>(null)
  const [processingAction, setProcessingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [recentInfrastructure, setRecentInfrastructure] = useState<CreatedInfrastructure | null>(null)

  useEffect(() => {
    fetchPropositions()
  }, [filter])

  const fetchPropositions = async () => {
    try {
      const params = filter ? `?statut=${filter}` : ''
      const response = await axios.get(`${API_URL}/propositions${params}`)
      setPropositions(response.data.data ?? [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setProcessingAction({ id, type: 'approve' })
      const response = await axios.post(`${API_URL}/propositions/${id}/approuver`)
      const infrastructure: CreatedInfrastructure | undefined = response.data?.infrastructure
      
      // Mettre à jour immédiatement le statut dans la liste
      setPropositions((prev) =>
        prev.map((prop) =>
          prop.id === id
            ? { ...prop, statut: 'approuve' }
            : prop
        )
      )
      
      // Mettre à jour aussi la proposition sélectionnée dans la modal si c'est celle-ci
      if (selectedProposition?.id === id) {
        setSelectedProposition({ ...selectedProposition, statut: 'approuve' })
      }
      
      if (infrastructure) {
        setRecentInfrastructure(infrastructure)
      }
      
      // Rafraîchir la liste depuis le serveur
      await fetchPropositions()
      
      // Déclencher un événement pour rafraîchir la page infrastructures si elle est ouverte
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('infrastructureCreated', { 
          detail: { infrastructureId: infrastructure?.id || infrastructure?._id } 
        }))
      }
      
      // Fermer la modal après un court délai pour montrer le succès
      if (selectedProposition?.id === id) {
        setTimeout(() => {
          closeDetails()
        }, 1500)
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'approbation:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erreur lors de l\'approbation de la proposition. Veuillez réessayer.'
      alert(`Erreur: ${errorMessage}`)
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (id: string) => {
    const commentaire = prompt('Raison du rejet (optionnel):')
    try {
      setProcessingAction({ id, type: 'reject' })
      await axios.post(`${API_URL}/propositions/${id}/rejeter`, { commentaire })
      setPropositions((prev) =>
        prev.map((prop) =>
          prop.id === id
            ? { ...prop, statut: 'rejete', commentaire_moderation: commentaire ?? '' }
            : prop
        )
      )
      fetchPropositions()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setProcessingAction(null)
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

  const openDetails = (proposition: Proposition) => {
    setSelectedProposition(proposition)
    setDetailModalOpen(true)
  }

  const closeDetails = () => {
    setDetailModalOpen(false)
    setSelectedProposition(null)
  }

  const formatCoordinate = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '—'
    }
    return value.toFixed(6)
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {recentInfrastructure && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex flex-col gap-3 shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-semibold text-lg">✅ Proposition approuvée avec succès</p>
                <p className="text-green-700 text-sm mt-1">
                  L'infrastructure <strong>{recentInfrastructure.nom || 'Une infrastructure'}</strong> a été automatiquement ajoutée à la liste des infrastructures et est maintenant visible par tous les utilisateurs.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRecentInfrastructure(null)}
              className="text-green-700 hover:text-green-900 p-1 rounded hover:bg-green-100"
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <Link
              href={
                recentInfrastructure.id || recentInfrastructure._id
                  ? `/dashboard/infrastructures/${recentInfrastructure.id || recentInfrastructure._id}`
                  : '/dashboard/infrastructures'
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiMapPin />
              Voir l'infrastructure
            </Link>
            <Link
              href="/dashboard/infrastructures"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 text-sm font-medium rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
            >
              <FiEye />
              Toutes les infrastructures
            </Link>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Propositions</h1>
        <p className="text-gray-600 mt-1">Modérer les propositions d'infrastructures</p>
      </div>

      {/* Filtre */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvées</option>
          <option value="rejete">Rejetées</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {propositions.map((prop) => (
          <div key={prop.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{prop.nom}</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {getTypeLabel(prop.type)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    prop.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                    prop.statut === 'approuve' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {prop.statut === 'en_attente' ? 'En attente' :
                     prop.statut === 'approuve' ? 'Approuvée' : 'Rejetée'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <FiClock className="inline mr-1" />
                  {prop.localisation?.adresse ?? 'Adresse inconnue'}
                  {prop.localisation?.quartier
                    ? `, ${prop.localisation?.quartier}`
                    : ''}
                </p>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const proposer = prop.propose_par
                    const nameParts =
                      proposer != null
                        ? [proposer.prenom, proposer.nom].filter(
                            (value): value is string => {
                              if (typeof value !== 'string') return false
                              return value.trim().length > 0
                            }
                          )
                        : []
                    const displayName =
                      nameParts.length > 0
                        ? nameParts.join(' ')
                        : 'Utilisateur inconnu'
                    const email = proposer?.email ?? 'Email inconnu'
                    return `Proposé par ${displayName} (${email})`
                  })()}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {(() => {
                    const createdOn = prop.createdAt || prop.created_at
                    if (!createdOn) {
                      return 'Date inconnue'
                    }
                    const date = new Date(createdOn)
                    return isNaN(date.getTime())
                      ? 'Date inconnue'
                      : date.toLocaleDateString('fr-FR')
                  })()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openDetails(prop)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                >
                  <FiEye /> Voir les détails
                </button>
                {prop.statut === 'en_attente' ? (
                  <>
                    <button
                      onClick={() => handleApprove(prop.id)}
                      disabled={processingAction?.id === prop.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      <FiCheck />
                      {processingAction?.id === prop.id && processingAction.type === 'approve'
                        ? 'Approbation...'
                        : 'Approuver'}
                    </button>
                    <button
                      onClick={() => handleReject(prop.id)}
                      disabled={processingAction?.id === prop.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      <FiX />
                      {processingAction?.id === prop.id && processingAction.type === 'reject' ? 'Rejet...' : 'Rejeter'}
                    </button>
                  </>
                ) : prop.statut === 'approuve' ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 cursor-default"
                  >
                    <FiCheck /> Déjà approuvée
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg flex items-center gap-2 cursor-default"
                  >
                    <FiX /> Rejetée
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailModalOpen && selectedProposition && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedProposition.nom}</h2>
                <p className="text-gray-500 text-sm">
                  {getTypeLabel(selectedProposition.type)} • Statut :{' '}
                  <span className="font-medium">{selectedProposition.statut}</span>
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {selectedProposition.description || 'Aucune description fournie.'}
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase">Localisation</h4>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <FiMapPin className="text-primary-500" />
                  {selectedProposition.localisation?.adresse || 'Adresse inconnue'}
                </p>
                <p className="text-sm text-gray-600">
                  Quartier : {selectedProposition.localisation?.quartier || '—'}
                </p>
                <p className="text-sm text-gray-600">
                  Commune : {selectedProposition.localisation?.commune || '—'}
                </p>
                <p className="text-xs text-gray-500">
                  Coordonnées : lat {formatCoordinate(selectedProposition.localisation?.coordinates?.[1])} / long{' '}
                  {formatCoordinate(selectedProposition.localisation?.coordinates?.[0])}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase">Contact</h4>
                <p className="text-sm text-gray-600">
                  Téléphone : {selectedProposition.contact?.telephone || 'Non fourni'}
                </p>
                <p className="text-sm text-gray-600">
                  Site web :{' '}
                  {selectedProposition.contact?.website ? (
                    <a
                      href={selectedProposition.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {selectedProposition.contact.website}
                    </a>
                  ) : (
                    'Non fourni'
                  )}
                </p>
              </div>
            </section>

            {(() => {
              const schedule = (selectedProposition.horaires ||
                selectedProposition.openingHours) as Record<string, string> | undefined
              if (!schedule || Object.keys(schedule).length === 0) {
                return null
              }
              const entries = Object.entries(schedule).filter(
                ([, value]) => typeof value === 'string' && value.trim().length > 0
              )
              if (entries.length === 0) {
                return null
              }
              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Horaires d'ouverture</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entries.map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-700"
                      >
                        <span className="font-medium">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {(() => {
              const equipments = selectedProposition.equipements || selectedProposition.equipments
              if (!equipments || equipments.length === 0) {
                return null
              }
              const filteredEquipments = equipments.filter(
                (equipment) => typeof equipment === 'string' && equipment.trim().length > 0
              )
              if (filteredEquipments.length === 0) {
                return null
              }
              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredEquipments.map((equipment) => (
                      <span
                        key={equipment}
                        className="px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-700"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </section>
              )
            })()}

            {(() => {
              const photos =
                (selectedProposition.photos && selectedProposition.photos.length > 0
                  ? selectedProposition.photos
                  : selectedProposition.images) || []

              if (!photos || photos.length === 0) {
                return null
              }

              return (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div
                        key={`${photo}-${index}`}
                        className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1} de ${selectedProposition.nom}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            <div className="flex justify-end">
              {selectedProposition.statut === 'en_attente' ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleApprove(selectedProposition.id)}
                    disabled={processingAction?.id === selectedProposition.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    <FiCheck />
                    {processingAction?.id === selectedProposition.id && processingAction.type === 'approve'
                      ? 'Approbation...'
                      : 'Approuver'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedProposition.id)}
                    disabled={processingAction?.id === selectedProposition.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    <FiX />
                    {processingAction?.id === selectedProposition.id && processingAction.type === 'reject'
                      ? 'Rejet...'
                      : 'Rejeter'}
                  </button>
                </div>
              ) : selectedProposition.statut === 'approuve' ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 cursor-default"
                  >
                    <FiCheck /> Déjà approuvée
                  </button>
                  <button
                    onClick={closeDetails}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg flex items-center gap-2 cursor-default"
                  >
                    <FiX /> Rejetée
                  </button>
                  <button
                    onClick={closeDetails}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

