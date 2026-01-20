'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartProps {
  data: Array<{ _id: string; count: number }>
  type: 'pie' | 'bar'
  dataKey: string
  nameKey: string
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Chart({ data, type, dataKey, nameKey }: ChartProps) {
  const formattedData = data.map(item => ({
    name: item._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.count
  }))

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#0ea5e9" />
      </BarChart>
    </ResponsiveContainer>
  )
}

