'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Sector,
  TooltipProps,
} from 'recharts'
import { useState } from 'react'
import { BRAND, THEME_PALETTE, SUPPORT } from '@/lib/chartTheme'
import { useTheme } from '@/contexts/ThemeContext'

// ─── Palette dérivée du thème projet (brand-dark → brand-light) ─────────────────
const PALETTE = [
  { solid: THEME_PALETTE[0], light: BRAND.pale   }, // brand-dark
  { solid: THEME_PALETTE[2], light: BRAND.pale   }, // primary-500
  { solid: THEME_PALETTE[4], light: BRAND.lighter}, // primary-400
  { solid: THEME_PALETTE[7], light: '#ccfbf1'    }, // teal accent
  { solid: THEME_PALETTE[1], light: BRAND.pale   }, // primary-700
  { solid: THEME_PALETTE[5], light: BRAND.lighter}, // primary-600
  { solid: THEME_PALETTE[6], light: BRAND.lighter}, // primary-300
  { solid: THEME_PALETTE[3], light: BRAND.pale   }, // brand-light
  { solid: THEME_PALETTE[8], light: BRAND.pale   }, // primary-800
  { solid: THEME_PALETTE[9], light: BRAND.pale   }, // primary-200
]

const SOLIDS = PALETTE.map((p) => p.solid)

// ─── Tooltip personnalisé (Bar / Line / Area) ────────────────────────────────
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs"
      >
        <p className="text-slate-400 font-medium mb-1">
          {label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} className="text-slate-100 font-bold text-sm m-0">
            <span style={{ color: entry.color ?? SOLIDS[0] }}>●</span>{' '}
            {Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Tooltip personnalisé pour Pie ──────────────────────────────────────────
const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div
        className="bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs"
      >
        <p className="text-slate-400 font-medium mb-1">
          {d.name}
        </p>
        <p className="text-slate-100 font-bold text-sm m-0">
          <span style={{ color: d.payload?.fill }}>●</span>{' '}
          {Number(d.value).toLocaleString()}
          <span className="text-slate-400 text-xs font-normal">
            {' '}({((d.payload?.percent ?? 0) * 100).toFixed(1)}%)
          </span>
        </p>
      </div>
    )
  }
  return null
}

// ─── Secteur actif pour le Donut ────────────────────────────────────────────
const createRenderActiveShape = (isDark: boolean) => (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props

  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subTextColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={textColor} style={{ fontSize: 14, fontWeight: 700 }}>
        {payload.name.length > 14 ? payload.name.slice(0, 13) + '…' : payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={fill} style={{ fontSize: 20, fontWeight: 800 }}>
        {value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" fill={subTextColor} style={{ fontSize: 12 }}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  )
}

// ─── Légende personnalisée pour Pie ─────────────────────────────────────────
const CustomLegend = ({ data, isDark }: { data: Array<{ name: string; value: number; fill: string }>; isDark: boolean }) => {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: item.fill,
              boxShadow: `0 0 6px ${item.fill}88`
            }}
          />
          <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {item.name.length > 18 ? item.name.slice(0, 17) + '…' : item.name}
          </span>
          <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Gradient IDs uniques par instance ──────────────────────────────────────
let gradientCounter = 0

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChartProps {
  data: Array<{ _id: string; count: number }>
  type: 'pie' | 'bar' | 'line' | 'area'
  dataKey: string
  nameKey: string
  xAxisFontSize?: number
  height?: number
  color?: string // couleur principale pour bar/line/area (optionnel)
  showLegend?: boolean // Afficher la légende sous le graphique (défaut : false)
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function Chart({
  data,
  type,
  dataKey,
  nameKey,
  xAxisFontSize,
  height = 320,
  color,
  showLegend = false,
}: ChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const { isDark } = useTheme()

  const formattedData = data.map((item) => ({
    name: item._id
      ? item._id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Inconnu',
    value: item.count ?? 0,
  }))

  const axisTickColor = isDark ? '#94a3b8' : '#64748b'
  const gridLineColor = isDark ? '#33415555' : '#e2e8f0'

  // ── Donut / Pie ────────────────────────────────────────────────────────────
  if (type === 'pie') {
    const pieData = formattedData.map((d, i) => ({
      ...d,
      fill: SOLIDS[i % SOLIDS.length],
    }))

    return (
      <div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              {PALETTE.map((p, i) => (
                <radialGradient key={i} id={`pieGrad-${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={p.solid} stopOpacity={1} />
                  <stop offset="100%" stopColor={p.solid} stopOpacity={0.7} />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={height * 0.25}
              outerRadius={height * 0.40}
              dataKey="value"
              nameKey="name"
              activeIndex={activeIndex}
              activeShape={createRenderActiveShape(isDark)}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              paddingAngle={2.5}
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGrad-${index % PALETTE.length})`}
                  stroke={entry.fill}
                  strokeWidth={1}
                  style={{ filter: `drop-shadow(0 0 4px ${entry.fill}44)`, cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {showLegend && <CustomLegend data={pieData} isDark={isDark} />}
      </div>
    )
  }

  // ── Bar ───────────────────────────────────────────────────────────────────
  if (type === 'bar') {
    const gradId = `barGrad-${gradientCounter++}`
    const primaryColor = color ?? (isDark ? '#38bdf8' : BRAND.dark)
    const primaryColorEnd = color ?? (isDark ? '#0284c7' : BRAND.light)

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={formattedData}
          margin={{ top: 8, right: 16, left: 0, bottom: xAxisFontSize ? 80 : 40 }}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
              <stop offset="100%" stopColor={primaryColorEnd} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
          <XAxis
            dataKey="name"
            angle={formattedData.length > 6 ? -40 : 0}
            textAnchor={formattedData.length > 6 ? 'end' : 'middle'}
            height={formattedData.length > 6 ? 80 : 36}
            interval={0}
            tick={{
              fontSize: xAxisFontSize ?? (formattedData.length > 10 ? 9 : 11),
              fill: axisTickColor,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axisTickColor }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: isDark ? '#38bdf812' : '#6366f108', radius: 6 }}
          />
          <Bar
            dataKey="value"
            fill={`url(#${gradId})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {formattedData.map((_, index) => (
              <Cell
                key={`bar-cell-${index}`}
                fill={`url(#${gradId})`}
                style={{ filter: `drop-shadow(0 2px 6px ${isDark ? 'rgba(56,189,248,0.25)' : 'rgba(99,102,241,0.25)'})` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // ── Line ──────────────────────────────────────────────────────────────────
  if (type === 'line') {
    const primaryColor = color ?? (isDark ? '#38bdf8' : BRAND.base)
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={formattedData}
          margin={{ top: 8, right: 16, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: xAxisFontSize ?? 11, fill: axisTickColor, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: axisTickColor }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={primaryColor}
            strokeWidth={2.5}
            dot={{ fill: primaryColor, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: primaryColor, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // ── Area ──────────────────────────────────────────────────────────────────
  if (type === 'area') {
    const areaGradId = `areaGrad-${gradientCounter++}`
    const primaryColor = color ?? (isDark ? '#38bdf8' : BRAND.dark)
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={formattedData}
          margin={{ top: 8, right: 16, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={isDark ? 0.35 : 0.25} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: xAxisFontSize ?? 11, fill: axisTickColor, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: axisTickColor }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={primaryColor}
            strokeWidth={2.5}
            fill={`url(#${areaGradId})`}
            dot={{ fill: primaryColor, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: primaryColor, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return null
}
