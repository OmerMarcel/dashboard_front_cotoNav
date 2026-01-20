'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Chart from '@/components/Chart'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Statistics {
  parType: Array<{ _id: string; count: number }>
  parQuartier: Array<{ _id: string; count: number }>
  parEtat: Array<{ _id: string; count: number }>
  evolution: Array<{ _id: { year: number; month: number }; count: number }>
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics`)
      setStats(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Erreur de chargement</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques Détaillées</h1>
        <p className="text-gray-600 mt-1">Analyse approfondie des données</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Répartition par Type
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
            Répartition par État
          </h2>
          <Chart
            data={stats.parEtat}
            type="pie"
            dataKey="count"
            nameKey="_id"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top Quartiers
          </h2>
          <Chart
            data={stats.parQuartier}
            type="bar"
            dataKey="count"
            nameKey="_id"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Évolution (6 derniers mois)
          </h2>
          <Chart
            data={stats.evolution.map(e => ({
              _id: `${e._id.month}/${e._id.year}`,
              count: e.count
            }))}
            type="bar"
            dataKey="count"
            nameKey="_id"
          />
        </div>
      </div>
    </div>
  )
}

