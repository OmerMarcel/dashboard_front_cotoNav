import { IconType } from 'react-icons'
import { useEffect, useState } from 'react'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: IconType
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
}

export default function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [previousValue, setPreviousValue] = useState(value)

  useEffect(() => {
    if (value !== previousValue) {
      setIsUpdating(true)
      setPreviousValue(value)
      const timer = setTimeout(() => setIsUpdating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [value, previousValue])

  return (
    <div className="bg-white rounded-lg shadow p-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p 
            className={`text-3xl font-bold text-gray-900 mt-2 transition-all duration-300 ${
              isUpdating ? 'scale-110 text-primary-600' : ''
            }`}
          >
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg transition-all duration-300 ${colorClasses[color]} ${isUpdating ? 'scale-110' : ''}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

