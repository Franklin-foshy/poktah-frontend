import { createContext, useContext, useEffect, useState } from 'react'

// ─── Tokens de color por tema ─────────────────────────────────────────────────

export const THEMES = {
  light: {
    // ── Fondo general
    bg:           '#F4F5F9',
    surface:      '#FFFFFF',
    surfaceHover: '#F7F8FC',
    border:       '#E8ECF2',
    borderLight:  '#F0F3F8',

    // ── Texto
    text:         '#0F1117',
    textSec:      '#4B5563',
    textMuted:    '#9CA3AF',

    // ── Acento principal: verde
    accent:       '#22C55E',
    accentBg:     '#F0FDF4',
    accentText:   '#15803D',
    accentMuted:  '#DCFCE7',

    // ── Semánticos
    green:        '#22C55E',
    greenBg:      '#F0FDF4',
    greenDark:    '#15803D',
    yellow:       '#F59E0B',
    yellowBg:     '#FFFBEB',
    red:          '#EF4444',
    redBg:        '#FEF2F2',
    blue:         '#3B82F6',
    blueBg:       '#EFF6FF',
    orange:       '#F97316',
    orangeBg:     '#FFF7ED',
    purple:       '#8B5CF6',
    purpleBg:     '#F5F3FF',

    // ── Sombras
    shadow:       '0 2px 10px rgba(0,0,0,0.07)',
    shadowMd:     '0 6px 24px rgba(0,0,0,0.09)',
    shadowLg:     '0 18px 48px rgba(0,0,0,0.12)',
    shadowAccent: '0 4px 16px rgba(34,197,94,0.28)',

    // ── Sidebar (claro en modo claro)
    sidebarBg:            '#FFFFFF',
    sidebarBorder:        '#EAECF2',
    sidebarText:          '#0F1117',
    sidebarTextMuted:     '#9CA3AF',
    sidebarNavActive:     '#F0FDF4',
    sidebarNavActiveText: '#15803D',
    sidebarNavText:       '#6B7280',
    sidebarHover:         '#F7F8FC',
    sidebarUserBg:        '#F3F4F8',

    // ── Nav y tabs (mobile/interior)
    navActive:    '#F0FDF4',
    navActiveText:'#15803D',
    navText:      '#6B7280',
    tabBg:        '#FFFFFF',
  },

  dark: {
    // ── Fondo general — azul marino profundo
    bg:           '#070C17',
    surface:      '#0C1220',
    surfaceHover: '#111A2E',
    border:       '#1A2840',
    borderLight:  '#121E33',

    // ── Texto
    text:         '#E2EAF6',
    textSec:      '#7A95BE',
    textMuted:    '#364F6E',

    // ── Acento principal: verde (contrasta bien con el azul marino)
    accent:       '#34D399',
    accentBg:     '#071E2A',
    accentText:   '#6EE7B7',
    accentMuted:  '#04121A',

    // ── Semánticos
    green:        '#34D399',
    greenBg:      '#071E2A',
    greenDark:    '#6EE7B7',
    yellow:       '#FCD34D',
    yellowBg:     '#1C1600',
    red:          '#F87171',
    redBg:        '#260B0B',
    blue:         '#60A5FA',
    blueBg:       '#08152B',
    orange:       '#FB923C',
    orangeBg:     '#1E0E00',
    purple:       '#A78BFA',
    purpleBg:     '#110D22',

    // ── Sombras
    shadow:       '0 2px 10px rgba(0,0,0,0.50)',
    shadowMd:     '0 6px 24px rgba(0,0,0,0.65)',
    shadowLg:     '0 18px 48px rgba(0,0,0,0.75)',
    shadowAccent: '0 4px 16px rgba(52,211,153,0.22)',

    // ── Sidebar — azul marino más oscuro
    sidebarBg:            '#050B16',
    sidebarBorder:        '#0F1928',
    sidebarText:          '#7A95BE',
    sidebarTextMuted:     '#243448',
    sidebarNavActive:     'rgba(52,211,153,0.12)',
    sidebarNavActiveText: '#6EE7B7',
    sidebarNavText:       '#2E4A68',
    sidebarHover:         'rgba(255,255,255,0.03)',
    sidebarUserBg:        'rgba(255,255,255,0.04)',

    navActive:    '#071E2A',
    navActiveText:'#34D399',
    navText:      '#364F6E',
    tabBg:        '#0C1220',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('poktah_theme') || 'light')

  const toggle = () => setMode(m => {
    const next = m === 'light' ? 'dark' : 'light'
    localStorage.setItem('poktah_theme', next)
    return next
  })

  const t = THEMES[mode]

  useEffect(() => {
    document.body.style.background = t.bg
    document.body.style.color      = t.text
    document.body.style.margin     = '0'
  }, [mode, t.bg, t.text])

  return (
    <ThemeContext.Provider value={{ mode, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
