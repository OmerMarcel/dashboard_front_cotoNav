'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { FiArrowLeft, FiMapPin, FiPhone, FiMail, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Infrastructure {
  id?: string
  _id?: string
  nom: string
  type: string
  description?: string
  localisation?: {
    type?: string
    coordinates?: number[]
    adresse?: string
    quartier?: string
    commune?: string
  }
  contact?: {
    telephone?: string
    email?: string
  }
  etat: string
  niveau_frequentation?: string
  niveauFrequentation?: string
  accessibilite?: {
    pmr: boolean
    enfants: boolean
  }
  equipements?: string[]
  horaires?: {
    [key: string]: {
      ouvert: boolean
      debut: string
      fin: string
    }
  }
  photos?: Array<{ url: string; uploadedAt?: string }>
  note_moyenne?: number
  noteMoyenne?: number
  nombre_avis?: number
  nombreAvis?: number
  valide?: boolean
  cree_par?: any
  valide_par?: any
}

const joursLabels: Record<string, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
}

export default function InfrastructureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [infrastructure, setInfrastructure] = useState<Infrastructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (id) {
      fetchInfrastructure()
    }
  }, [id])

  const fetchInfrastructure = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/infrastructures/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setInfrastructure(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'infrastructure')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette infrastructure ? Cette action est irréversible.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/infrastructures/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      router.push('/dashboard/infrastructures')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !infrastructure) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/infrastructures"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Infrastructure non trouvée'}
        </div>
      </div>
    )
  }

  const infraId = infrastructure.id || infrastructure._id || ''

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/infrastructures"
            className="text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{infrastructure.nom}</h1>
            <p className="text-gray-600 mt-1">{getTypeLabel(infrastructure.type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/infrastructures/${infraId}/edit`}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Modifier"
          >
            <FiEdit className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Supprimer"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {infrastructure.description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700">{infrastructure.description}</p>
            </div>
          )}

          {/* Photos */}
          {infrastructure.photos && infrastructure.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {infrastructure.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Horaires */}
          {infrastructure.horaires && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiClock className="w-5 h-5" />
                Horaires d'ouverture
              </h2>
              <div className="space-y-2">
                {Object.entries(infrastructure.horaires).map(([jour, horaire]) => (
                  <div key={jour} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{joursLabels[jour] || jour}</span>
                    {horaire.ouvert ? (
                      <span className="text-gray-600">{horaire.debut} - {horaire.fin}</span>
                    ) : (
                      <span className="text-red-600">Fermé</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Équipements */}
          {infrastructure.equipements && infrastructure.equipements.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Équipements</h2>
              <div className="flex flex-wrap gap-2">
                {infrastructure.equipements.map((equipement, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {equipement}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations principales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">État</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEtatColor(infrastructure.etat)}`}>
                    {infrastructure.etat}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Niveau de fréquentation</label>
                <p className="mt-1 text-gray-900">
                  {infrastructure.niveau_frequentation || infrastructure.niveauFrequentation || 'Non renseigné'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Note moyenne</label>
                <p className="mt-1 text-gray-900">
                  {((infrastructure.note_moyenne ?? infrastructure.noteMoyenne) || 0).toFixed(1)}/5
                  {` (${(infrastructure.nombre_avis ?? infrastructure.nombreAvis) || 0} avis)`}
                </p>
              </div>

              {infrastructure.valide !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    {infrastructure.valide ? (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                        Validée
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          {infrastructure.localisation && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin className="w-5 h-5" />
                Localisation
              </h2>
              <div className="space-y-3">
                {infrastructure.localisation.adresse && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adresse</label>
                    <p className="mt-1 text-gray-900">{infrastructure.localisation.adresse}</p>
                  </div>
                )}
                {infrastructure.localisation.quartier && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quartier</label>
                    <p className="mt-1 text-gray-900">{infrastructure.localisation.quartier}</p>
                  </div>
                )}
                {infrastructure.localisation.commune && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commune</label>
                    <p className="mt-1 text-gray-900">{infrastructure.localisation.commune}</p>
                  </div>
                )}
                {infrastructure.localisation.coordinates && infrastructure.localisation.coordinates.length >= 2 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coordonnées GPS</label>
                    <p className="mt-1 text-gray-900 text-xs">
                      {infrastructure.localisation.coordinates[1]?.toFixed(6)}, {infrastructure.localisation.coordinates[0]?.toFixed(6)}
                    </p>
                  </div>
                )}
                {!infrastructure.localisation.adresse && !infrastructure.localisation.quartier && !infrastructure.localisation.commune && !infrastructure.localisation.coordinates && (
                  <p className="text-gray-500 text-sm">Aucune information de localisation disponible</p>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          {infrastructure.contact && (infrastructure.contact.telephone || infrastructure.contact.email) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                {infrastructure.contact.telephone && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${infrastructure.contact.telephone}`} className="text-primary-600 hover:text-primary-800">
                      {infrastructure.contact.telephone}
                    </a>
                  </div>
                )}
                {infrastructure.contact.email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${infrastructure.contact.email}`} className="text-primary-600 hover:text-primary-800">
                      {infrastructure.contact.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Accessibilité */}
          {infrastructure.accessibilite && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Accessibilité</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${infrastructure.accessibilite.pmr ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-700">Accessible PMR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${infrastructure.accessibilite.enfants ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-700">Adapté aux enfants</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

