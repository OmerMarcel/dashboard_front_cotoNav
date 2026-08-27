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
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
  green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
  yellow: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
  red: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
  purple: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/50',
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
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-gray-100/80 dark:border-slate-700/70 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#96D0EE]/30 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors">{title}</p>
          <p 
            className={`text-3xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight transition-all duration-300 ${
              isUpdating ? 'scale-110 text-[#004B70] dark:text-[#96D0EE]' : ''
            }`}
          >
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl border transition-all duration-300 ${colorClasses[color]} ${isUpdating ? 'scale-110 shadow-sm' : ''} group-hover:scale-110 group-hover:shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

