'use client'

/**
 * Chart3D.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Composant de graphiques statistiques 3D basé sur ECharts.
 * Couleurs 100% alignées sur le thème du projet (brand-dark #004B70 → brand-light #96D0EE).
 *
 * Types disponibles :
 *   • bar3d     – Histogramme 3D
 *   • pie3d     – Camembert 3D (empilé)
 *   • scatter3d – Nuage de points 3D
 *   • bar       – Barre 2D ECharts (thème projet)
 *   • line      – Courbe 2D ECharts (thème projet)
 *   • area      – Aire 2D ECharts (thème projet)
 *   • donut     – Donut 2D ECharts (thème projet)
 */

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import {
  BRAND,
  THEME_PALETTE,
  SUPPORT,
  brandGradient,
  themeColor,
} from '@/lib/chartTheme'
import { useTheme } from '@/contexts/ThemeContext'

// ECharts chargé côté client uniquement (évite les erreurs SSR)
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────────
export type Chart3DType = 'bar3d' | 'pie3d' | 'scatter3d' | 'bar' | 'line' | 'area' | 'donut'

interface DataItem {
  _id: string
  count: number
}

interface Chart3DProps {
  data: DataItem[]
  type?: Chart3DType
  height?: number
  title?: string
  /** Clé de valeur numérique  (défaut : "count") */
  valueKey?: keyof DataItem
  /** Clé de label             (défaut : "_id")   */
  nameKey?: keyof DataItem
}

// ── Formatage des labels ───────────────────────────────────────────────────────
const fmt = (s: string | null | undefined): string =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Inconnu'

// ── Tooltip commun ─────────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(51, 65, 85, 0.8)',
  borderWidth: 1,
  textStyle: { color: '#f1f5f9', fontFamily: 'Inter, sans-serif', fontSize: 13 },
  extraCssText:
    'border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.28);backdrop-filter:blur(8px);',
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function Chart3D({
  data,
  type = 'bar',
  height = 360,
  title,
  valueKey = 'count',
  nameKey = '_id',
}: Chart3DProps) {
  const { isDark } = useTheme()
  const items = useMemo(
    () =>
      data.map((d) => ({
        name: fmt(String(d[nameKey] ?? '')),
        value: Number(d[valueKey] ?? 0),
      })),
    [data, nameKey, valueKey],
  )

  const axisLabelColor = isDark ? '#94a3b8' : SUPPORT.textSecondary
  const gridLineColor = isDark ? 'rgba(51, 65, 85, 0.4)' : SUPPORT.grid

  const axisStyle = {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: axisLabelColor, fontSize: 11, fontFamily: 'Inter, sans-serif' },
    splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
  }

  const option = useMemo(() => {
    // ── Titre commun ────────────────────────────────────────────────────────────
    const titleObj = title
      ? {
          text: title,
          textStyle: {
            color: isDark ? '#38bdf8' : BRAND.dark,
            fontSize: 14,
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
          },
          left: 'center',
          top: 4,
        }
      : undefined

    // ────────────────────────────────────────────────────────────────────────────
    // BAR 3D
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'bar3d') {
      return {
        title: titleObj,
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        backgroundColor: 'transparent',
        grid3D: {
          boxWidth: 200,
          boxDepth: 60,
          boxHeight: 100,
          viewControl: {
            alpha: 20,
            beta: 30,
            autoRotate: false,
            rotateSensitivity: 2,
          },
          light: {
            main: { intensity: 1.2, shadow: true },
            ambient: { intensity: 0.4 },
          },
          axisPointer: { show: false },
        },
        xAxis3D: {
          type: 'category',
          data: items.map((d) => d.name),
          axisLabel: { color: SUPPORT.textSecondary, fontSize: 10, fontFamily: 'Inter, sans-serif', interval: 0 },
          axisLine: { lineStyle: { color: SUPPORT.grid } },
        },
        yAxis3D: {
          type: 'value',
          axisLabel: { color: SUPPORT.textMuted, fontSize: 10, fontFamily: 'Inter, sans-serif' },
          axisLine: { lineStyle: { color: SUPPORT.grid } },
          splitLine: { lineStyle: { color: SUPPORT.grid, type: 'dashed' } },
        },
        zAxis3D: { type: 'category', data: [''] },
        series: [
          {
            type: 'bar3D',
            data: items.map((d, i) => ({
              value: [d.name, d.value, ''],
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0,   color: themeColor(i) },
                    { offset: 0.5, color: themeColor(i) + 'cc' },
                    { offset: 1,   color: themeColor(i) + '66' },
                  ],
                },
                opacity: 0.92,
              },
            })),
            shading: 'lambert',
            label: { show: false },
            emphasis: {
              itemStyle: { opacity: 1, color: BRAND.light },
            },
          },
        ],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // PIE 3D (empilé avec effet 3D)
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'pie3d') {
      return {
        title: titleObj,
        backgroundColor: 'transparent',
        tooltip: {
          ...tooltipStyle,
          trigger: 'item',
          formatter: (p: any) =>
            `<b style="color:${p.color}">${p.name}</b><br/>${p.value.toLocaleString()} <span style="color:${SUPPORT.textMuted}">(${p.percent}%)</span>`,
        },
        legend: {
          orient: 'horizontal',
          bottom: 0,
          textStyle: { color: SUPPORT.textSecondary, fontSize: 11, fontFamily: 'Inter, sans-serif' },
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10,
        },
        series: [
          // Ombre portée (cercle décoratif)
          {
            type: 'pie',
            radius: ['30%', '70%'],
            center: ['50%', '48%'],
            startAngle: 225,
            hoverAnimation: false,
            clockwise: false,
            itemStyle: { color: 'rgba(0,0,0,0)', borderWidth: 0 },
            z: 1,
            data: items.map(() => ({ value: 1, name: '', label: { show: false }, tooltip: { show: false } })),
          },
          // Série principale
          {
            type: 'pie',
            radius: ['28%', '68%'],
            center: ['50%', '46%'],
            startAngle: 225,
            roseType: 'area',
            data: items.map((d, i) => ({
              name: d.name,
              value: d.value,
              itemStyle: {
                color: {
                  type: 'radial',
                  x: 0.5, y: 0.5, r: 0.8,
                  colorStops: [
                    { offset: 0,   color: themeColor(i) },
                    { offset: 1,   color: themeColor(i + 3) },
                  ],
                },
                borderWidth: 2,
                borderColor: '#ffffff',
                shadowBlur: 20,
                shadowColor: themeColor(i) + '66',
              },
              label: {
                show: true,
                color: SUPPORT.textSecondary,
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
              },
              emphasis: {
                scale: true,
                scaleSize: 8,
                itemStyle: { shadowBlur: 30, shadowColor: themeColor(i) + '88' },
              },
            })),
          },
        ],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SCATTER 3D
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'scatter3d') {
      const scatterData = items.map((d, i) => [i, d.value, Math.round(d.value * 0.6)])
      return {
        title: titleObj,
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'item' },
        grid3D: {
          viewControl: { alpha: 15, beta: 40, autoRotate: true, autoRotateSpeed: 5 },
          light: { main: { intensity: 1.2 }, ambient: { intensity: 0.5 } },
          boxWidth: 180, boxDepth: 80, boxHeight: 100,
        },
        xAxis3D: { type: 'value', name: 'Index', nameTextStyle: { color: SUPPORT.textMuted } },
        yAxis3D: { type: 'value', name: 'Valeur', nameTextStyle: { color: SUPPORT.textMuted } },
        zAxis3D: { type: 'value', name: 'Z', nameTextStyle: { color: SUPPORT.textMuted } },
        series: [{
          type: 'scatter3D',
          data: scatterData,
          symbolSize: 14,
          itemStyle: {
            color: (p: any) => ({
              type: 'radial', x: 0.4, y: 0.3, r: 1,
              colorStops: [
                { offset: 0, color: themeColor(p.dataIndex) },
                { offset: 1, color: BRAND.dark },
              ],
            }),
            opacity: 0.9,
          },
          emphasis: { itemStyle: { color: BRAND.light, opacity: 1 } },
        }],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // DONUT 2D
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'donut') {
      return {
        title: titleObj,
        backgroundColor: 'transparent',
        tooltip: {
          ...tooltipStyle,
          trigger: 'item',
          formatter: (p: any) =>
            `<b style="color:${p.color}">${p.name}</b><br/>${p.value.toLocaleString()} <span style="color:${SUPPORT.textMuted}">(${p.percent}%)</span>`,
        },
        legend: {
          orient: 'horizontal',
          bottom: 0,
          textStyle: { color: SUPPORT.textSecondary, fontSize: 11, fontFamily: 'Inter, sans-serif' },
          icon: 'circle', itemWidth: 10, itemHeight: 10,
        },
        series: [{
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside',
            color: SUPPORT.textSecondary,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            formatter: '{b}: {d}%',
          },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
          },
          data: items.map((d, i) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: themeColor(i), shadowBlur: 8, shadowColor: themeColor(i) + '55' },
          })),
        }],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // LINE 2D
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'line') {
      return {
        title: titleObj,
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        grid: { top: title ? 40 : 16, right: 16, bottom: 40, left: 48, containLabel: false },
        xAxis: { ...axisStyle, type: 'category', data: items.map((d) => d.name) },
        yAxis: { ...axisStyle, type: 'value' },
        series: [{
          type: 'line',
          data: items.map((d) => d.value),
          smooth: true,
          lineStyle: { color: BRAND.base, width: 2.5 },
          itemStyle: { color: BRAND.base },
          symbol: 'circle',
          symbolSize: 7,
          activeDotStyle: { stroke: '#fff', strokeWidth: 2 },
          emphasis: { focus: 'series' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0,   color: BRAND.base + '33' },
                { offset: 1,   color: BRAND.base + '00' },
              ],
            },
          },
        }],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AREA 2D
    // ────────────────────────────────────────────────────────────────────────────
    if (type === 'area') {
      return {
        title: titleObj,
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        grid: { top: title ? 40 : 16, right: 16, bottom: 40, left: 48, containLabel: false },
        xAxis: { ...axisStyle, type: 'category', data: items.map((d) => d.name) },
        yAxis: { ...axisStyle, type: 'value' },
        series: [{
          type: 'line',
          data: items.map((d) => d.value),
          smooth: true,
          lineStyle: { color: BRAND.dark, width: 2.5 },
          itemStyle: { color: BRAND.dark },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: { focus: 'series' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0,   color: BRAND.light + 'cc' },
                { offset: 1,   color: BRAND.light + '00' },
              ],
            },
          },
        }],
      }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // BAR 2D (défaut)
    // ────────────────────────────────────────────────────────────────────────────
    return {
      title: titleObj,
      backgroundColor: 'transparent',
      tooltip: { ...tooltipStyle, trigger: 'axis' },
      grid: {
        top: title ? 44 : 20,
        right: 16,
        bottom: items.length > 6 ? 80 : 44,
        left: 48,
        containLabel: false,
      },
      xAxis: {
        ...axisStyle,
        type: 'category',
        data: items.map((d) => d.name),
        axisLabel: {
          color: SUPPORT.textSecondary,
          fontSize: items.length > 8 ? 9 : 11,
          fontFamily: 'Inter, sans-serif',
          rotate: items.length > 6 ? 35 : 0,
          interval: 0,
        },
      },
      yAxis: { ...axisStyle, type: 'value' },
      series: [{
        type: 'bar',
        data: items.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: brandGradient(BRAND.dark, BRAND.light),
            borderRadius: [6, 6, 0, 0],
            shadowBlur: 8,
            shadowColor: BRAND.dark + '33',
          },
          emphasis: {
            itemStyle: { color: themeColor(i), shadowBlur: 16, shadowColor: themeColor(i) + '66' },
          },
        })),
        barMaxWidth: 48,
        showBackground: true,
        backgroundStyle: { color: BRAND.pale, borderRadius: [6, 6, 0, 0] },
      }],
    }
  }, [items, type, title, isDark, axisLabelColor, gridLineColor])

  return (
    <div style={{ width: '100%', height }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
        lazyUpdate={false}
      />
    </div>
  )
}
