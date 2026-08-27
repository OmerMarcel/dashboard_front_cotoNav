/**
 * chartTheme.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Palette et thème ECharts dérivés des couleurs du projet (brand-dark / brand-light / primary).
 * Source : globals.css + tailwind.config.js
 */

// ── Couleurs de marque ────────────────────────────────────────────────────────
export const BRAND = {
  dark:    '#004B70', // brand-dark  – bleu marine principal
  mid:     '#005f8e', // intermédiaire
  base:    '#0284c7', // primary-600
  light:   '#96D0EE', // brand-light – bleu ciel
  lighter: '#bae6fd', // primary-200
  pale:    '#e0f2fe', // primary-100
  white:   '#f0f9ff', // primary-50
}

// ── Palette multi-séries alignée sur le thème bleu ───────────────────────────
export const THEME_PALETTE = [
  '#004B70', // brand-dark
  '#0369a1', // primary-700
  '#0ea5e9', // primary-500
  '#96D0EE', // brand-light
  '#38bdf8', // primary-400
  '#0284c7', // primary-600
  '#7dd3fc', // primary-300
  '#14b8a6', // teal accent
  '#075985', // primary-800
  '#bae6fd', // primary-200
]

// ── Couleurs de support ────────────────────────────────────────────────────────
export const SUPPORT = {
  textPrimary:   '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',
  grid:          'rgba(0,75,112,0.10)',
  background:    '#f8fafc',
  tooltip: {
    bg:     'rgba(0, 30, 50, 0.92)',
    border: 'rgba(150, 208, 238, 0.30)',
  },
}

// ── Thème ECharts complet ─────────────────────────────────────────────────────
export const ECHARTS_THEME = {
  color: [...THEME_PALETTE],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, sans-serif',
    color: SUPPORT.textSecondary,
  },
  title: {
    textStyle: {
      color: BRAND.dark,
      fontWeight: '700',
      fontFamily: 'Inter, sans-serif',
    },
    subtextStyle: { color: SUPPORT.textMuted },
  },
  legend: {
    textStyle: {
      color: SUPPORT.textSecondary,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
    },
    pageIconColor: BRAND.base,
    pageIconInactiveColor: SUPPORT.textMuted,
  },
  tooltip: {
    backgroundColor: SUPPORT.tooltip.bg,
    borderColor: SUPPORT.tooltip.border,
    borderWidth: 1,
    textStyle: {
      color: '#f1f5f9',
      fontFamily: 'Inter, sans-serif',
      fontSize: 13,
    },
    extraCssText:
      'border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.28);backdrop-filter:blur(8px);',
  },
  axisPointer: {
    lineStyle: { color: BRAND.light, width: 1.5, type: 'dashed' },
    crossStyle: { color: BRAND.light },
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Couleur d index i dans la palette (cyclique) */
export const themeColor = (i: number): string =>
  THEME_PALETTE[i % THEME_PALETTE.length]

/** Gradient linéaire vertical ECharts */
export const brandGradient = (
  from: string = BRAND.dark,
  to: string   = BRAND.light,
) => ({
  type: 'linear' as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: from },
    { offset: 1, color: to   },
  ],
})

/** Gradient radial ECharts */
export const brandRadialGradient = (baseColor: string) => ({
  type: 'radial' as const,
  x: 0.5, y: 0.5, r: 0.5,
  colorStops: [
    { offset: 0, color: baseColor + 'ff' },
    { offset: 1, color: baseColor + 'bb' },
  ],
})
