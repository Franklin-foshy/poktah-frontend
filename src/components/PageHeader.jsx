import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function PageHeader({ title, subtitle, action }) {
  const { t }    = useTheme()
  const isMobile = useIsMobile()

  return (
    <div style={{
      padding:         isMobile ? '12px 14px' : '15px 22px',
      background:      t.surface,
      borderBottom:    `1px solid ${t.border}`,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      position:        'sticky',
      top:             0,
      zIndex:          100,
      gap:             10,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{
          fontSize:      isMobile ? 15 : 17,
          fontWeight:    700,
          color:         t.text,
          margin:        0,
          letterSpacing: '-0.2px',
          lineHeight:    1.3,
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize:     isMobile ? 11 : 12,
            color:        t.textMuted,
            margin:       '2px 0 0',
            lineHeight:   1.4,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>{action}</div>
      )}
    </div>
  )
}
