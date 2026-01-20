'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { 
  FiMapPin, 
  FiCheckCircle, 
  FiClock, 
  FiUsers, 
  FiAlertCircle,
  FiMessageSquare,
  FiHeart
} from 'react-icons/fi'
import StatCard from '@/components/StatCard'
import Chart from '@/components/Chart'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Statistics {
  general: {
    totalInfrastructures: number
    infrastructuresValidees: number
    infrastructuresEnAttente: number
    totalPropositions: number
    propositionsEnAttente: number
    totalSignalements: number
    signalementsNouveaux: number
    totalUsers: number
    totalAvis: number
    totalFavoris: number
  }
  parType: Array<{ _id: string; count: number }>
  parQuartier: Array<{ _id: string; count: number }>
  parEtat: Array<{ _id: string; count: number }>
  evolution: Array<{ _id: { year: number; month: number }; count: number }>
  topInfrastructures: Array<{
    _id: string
    nom: string
    type: string
    noteMoyenne: number
    nombreAvis: number
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatistics = async (silent = false) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setStats(response.data)
    } catch (error) {
      if (!silent) {
        console.error('Erreur lors du chargement des statistiques:', error)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Chargement initial
    fetchStatistics()

    // Mise à jour en temps réel toutes les 3 secondes
    const interval = setInterval(() => {
      fetchStatistics(true) // Mode silencieux pour les mises à jour automatiques
    }, 3000) // 3 secondes

    // Nettoyage de l'intervalle lors du démontage du composant
    return () => {
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Erreur de chargement des données</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des infrastructures publiques</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Infrastructures"
          value={stats.general.totalInfrastructures}
          subtitle={`${stats.general.infrastructuresValidees} validées`}
          icon={FiMapPin}
          color="blue"
        />
        <StatCard
          title="Propositions"
          value={stats.general.totalPropositions}
          subtitle={`${stats.general.propositionsEnAttente} en attente`}
          icon={FiClock}
          color="yellow"
        />
        <StatCard
          title="Signalements"
          value={stats.general.totalSignalements}
          subtitle={`${stats.general.signalementsNouveaux} nouveaux`}
          icon={FiAlertCircle}
          color="red"
        />
        <StatCard
          title="Utilisateurs"
          value={stats.general.totalUsers}
          subtitle={`${stats.general.totalAvis} avis`}
          icon={FiUsers}
          color="green"
        />
        <StatCard
          title="Favoris"
          value={stats.general.totalFavoris}
          subtitle="infrastructures favorites"
          icon={FiHeart}
          color="red"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Infrastructures par Type
          </h2>
          <Chart
            data={stats.parType}
            type="pie"
            dataKey="count"
            nameKey="_id"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top 10 Quartiers
          </h2>
          <Chart
            data={stats.parQuartier}
            type="bar"
            dataKey="count"
            nameKey="_id"
          />
        </div>
      </div>

      {/* Top infrastructures */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiHeart className="text-red-500 fill-current" />
          Top 5 Infrastructures les mieux notées
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note moyenne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre d'avis
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topInfrastructures.map((infra, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {infra.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {infra.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiHeart className="text-red-500 fill-current" />
                      {infra.noteMoyenne.toFixed(1)}/5
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {infra.nombreAvis}
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

