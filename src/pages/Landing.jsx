import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ─── Datos ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { ico:'🤖', title:'Agente con IA',     desc:'Atiende clientes 24/7 sin errores ni descansos' },
  { ico:'🔒', title:'100% seguro',        desc:'Tus datos y los de tus clientes protegidos'     },
  { ico:'📦', title:'Gestión de pedidos', desc:'Confirmá con un clic desde tu panel'            },
  { ico:'📄', title:'PDF automático',     desc:'Recibos profesionales para tus clientes'        },
]

const PLAN_FEATURES = {
  basico:     ['Agente activo 24/7', '500 mensajes/mes', 'Hasta 20 productos', 'Dashboard básico', 'Soporte WhatsApp'],
  pro:        ['Todo lo del básico', '3,000 mensajes/mes', 'Hasta 100 productos', 'Personalización del agente', 'Seguimiento post-venta'],
  enterprise: ['Todo lo del Pro', 'Mensajes ilimitados', 'Productos ilimitados', 'Soporte prioritario', 'Onboarding dedicado'],
}

const LOGOS = [
  { icon:'👟', name:'Calzado Maya'  },
  { icon:'👗', name:'Moda Guate'    },
  { icon:'🔧', name:'Ferretería GT' },
  { icon:'🛒', name:'MiniSuper 502' },
  { icon:'🍕', name:'FoodExpress'   },
]

const SIM_SEQ = [
  { bot:true,  text:'¡Hola! 👋 Soy el asistente de *Calzado Maya*. ¿En qué te puedo ayudar?', step:0, pause:650 },
  { bot:false, text:'Tienen tenis Nike talla 42?',                                               step:0, pause:850 },
  { bot:true,  text:'¡Sí! 👟 Nike Air Max 270\n📦 Talla 42 · Q895 · En stock\n\n¿Te los aparto?', step:1, pause:800 },
  { bot:false, text:'Sí, los quiero 🙌',                                                          step:1, pause:700 },
  { bot:true,  text:'Perfecto! Para tu pedido necesito:\n📋 Nombre completo\n📍 Dirección de entrega', step:2, pause:900 },
  { bot:false, text:'Carlos Mendez, Zona 10 Guatemala',                                           step:2, pause:700 },
  { bot:true,  text:'✅ *Pedido #PED-4821 creado!*\nNike Air Max 270 T42 · Q895\n\n¿Pagás por transferencia o contra entrega?', step:3, pause:900 },
  { bot:false, text:'Transferencia',                                                               step:3, pause:600 },
  { bot:true,  text:'💳 Banco Industrial\nCuenta: 042-0001234-5\nA nombre: Calzado Maya\n\nMandame el comprobante 📸', step:3, pause:2600 },
]

const SIM_STEPS = [
  { n:'01', title:'Cliente pregunta'            },
  { n:'02', title:'Agente responde al instante' },
  { n:'03', title:'Captura datos'               },
  { n:'04', title:'Pedido + pago coordinado'    },
]

// ─── Hook: chat animado ───────────────────────────────────────────────────────

function useChatSim() {
  const [msgs, setMsgs]     = useState([])
  const [typing, setTyping] = useState(false)
  const [step, setStep]     = useState(0)

  useEffect(() => {
    let idx = 0
    const T = []
    function tick() {
      if (idx >= SIM_SEQ.length) {
        T.push(setTimeout(() => { setMsgs([]); setTyping(false); setStep(0); idx = 0; T.push(setTimeout(tick, 900)) }, 2400))
        return
      }
      const m = SIM_SEQ[idx]
      setStep(m.step)
      if (m.bot) {
        setTyping(true)
        T.push(setTimeout(() => {
          setTyping(false)
          setMsgs(p => [...p, { ...m, uid: Math.random() }])
          idx++
          T.push(setTimeout(tick, m.pause))
        }, 1100))
      } else {
        T.push(setTimeout(() => {
          setMsgs(p => [...p, { ...m, uid: Math.random() }])
          idx++
          T.push(setTimeout(tick, m.pause))
        }, 380))
      }
    }
    T.push(setTimeout(tick, 900))
    return () => T.forEach(clearTimeout)
  }, [])

  return { msgs, typing, step }
}

// ─── Landing ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const [form, setForm]         = useState({ nombre_negocio:'', giro:'Zapatería / Calzado', whatsapp:'', email:'', ciudad:'', pedidos_mes:'', descripcion:'' })
  const [loading, setLoad]      = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error,   setError]     = useState('')
  const [planes,  setPlanes]    = useState([])
  const [periodoAnual, setAnual] = useState(false)
  const { msgs, typing, step }  = useChatSim()
  const chatBoxRef = useRef(null)

  const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

  useEffect(() => {
    axios.get(`${API}/public/planes`).then(r => setPlanes(r.data)).catch(() => {})
  }, [])

  // Scroll solo dentro del chat, nunca toca el scroll de la página
  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
  }, [msgs, typing])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })

  const handleSubmit = async () => {
    if (!form.nombre_negocio || !form.whatsapp) { setError('Nombre del negocio y WhatsApp son requeridos'); return }
    setLoad(true); setError('')
    try   { await axios.post(`${API}/leads`, form); setSuccess(true) }
    catch { setError('Hubo un error. Intentá de nuevo.') }
    finally { setLoad(false) }
  }

  return (
    <div className="w-full min-h-screen bg-white font-sans overflow-x-hidden relative">

      {/* ── Gradient blobs ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none -z-0"
        style={{ background:'radial-gradient(circle at 20% 20%, rgba(134,239,172,0.3) 0%, transparent 65%)' }}/>
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none -z-0"
        style={{ background:'radial-gradient(circle at 80% 20%, rgba(147,197,253,0.22) 0%, transparent 65%)' }}/>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav className="relative z-20 flex items-center justify-between px-5 md:px-10 py-4 border-b border-gray-100 bg-white/80 sticky top-0"
        style={{ backdropFilter:'blur(12px)' }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background:'linear-gradient(135deg, #22C55E, #16A34A)' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/>
              <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold text-ink tracking-tight">
            Pok<span style={{ color:'#16A34A' }}>tah</span>
          </span>
        </div>

        {/* Links — ocultos en mobile */}
        <div className="hidden md:flex items-center gap-1">
          {[['Características','features'],['Precios','precios'],['Contacto','contacto']].map(([l,id]) => (
            <span key={id} onClick={() => scrollTo(id)}
              className="text-[13px] font-medium text-slate cursor-pointer px-3.5 py-1.5 rounded-lg transition-all hover:bg-gray-100 hover:text-ink">
              {l}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')}
            className="text-[13px] font-medium text-slate cursor-pointer hover:text-ink transition-colors bg-transparent border-none px-3 py-2">
            Ingresar
          </button>
          <button onClick={() => scrollTo('contacto')}
            className="flex items-center gap-1.5 text-white text-[13px] font-semibold px-4 py-2.5 rounded-full cursor-pointer border-none"
            style={{ background:'#0D1117', boxShadow:'0 2px 12px rgba(0,0,0,0.18)' }}>
            Empezar
            <span className="hidden sm:flex w-5 h-5 rounded-full bg-white/20 items-center justify-center text-[10px]">↗</span>
          </button>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1080px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-0">

        {/* ── Texto centrado arriba ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-md"
              style={{ background:'#0D1117' }}>Nuevo</span>
            <span className="text-[13px] text-slate font-medium">Tu Agente de Ventas para WhatsApp</span>
          </div>

          <h1 className="font-black text-ink leading-[1.08] tracking-[-2px] mb-5"
            style={{ fontSize:'clamp(36px, 5vw, 58px)' }}>
            Vendé más por WhatsApp<br/>
            <span>sin esfuerzo</span>
          </h1>

          <p className="text-[15px] md:text-[16px] text-slate leading-relaxed mb-8 mx-auto font-normal"
            style={{ maxWidth:500 }}>
            Un agente inteligente que atiende clientes, cierra ventas y gestiona pedidos automáticamente — 24/7.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => scrollTo('contacto')}
              className="flex items-center gap-2 text-white text-[14px] font-semibold px-6 py-3.5 rounded-full cursor-pointer border-none"
              style={{ background:'#0D1117', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
              Quiero una demo
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">↗</span>
            </button>
            <button onClick={() => scrollTo('features')}
              className="text-ink text-[14px] font-semibold px-6 py-3.5 rounded-full cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
              Ver características
            </button>
          </div>
        </div>

        {/* ── Cards + Teléfono centrado ── */}
        <div className="flex items-center justify-center gap-4 md:gap-8">

          {/* Card izquierda — solo desktop */}
          <div className="hidden md:flex flex-col justify-center bg-white rounded-2xl p-4 w-[180px] shrink-0"
            style={{ boxShadow:'0 8px 32px rgba(0,0,0,0.09)', border:'1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-[13px] font-bold text-ink mb-1.5 leading-tight">Ventas<br/>automatizadas 🤖</p>
            <p className="text-[11px] text-slate leading-relaxed mb-3">
              Tu agente cierra ventas mientras dormís.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {['#22C55E','#3B82F6','#F59E0B'].map((c,i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background:c, marginLeft: i===0?0:-6, zIndex:3-i }}>
                    {['C','A','L'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[13px] font-bold text-ink leading-none">500+</div>
                <div className="text-[10px] text-fog">Negocios activos</div>
              </div>
            </div>
          </div>

          {/* Teléfono centrado */}
          <div className="relative z-20 flex-shrink-0 anim-float" style={{ width:260 }}>
            <div className="rounded-[44px] p-3 relative"
              style={{ background:'#1a1a1a', boxShadow:'0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.07)' }}>
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-black rounded-[13px] z-30"/>
              <div className="rounded-[36px] overflow-hidden" style={{ background:'#ECE5DD' }}>
                {/* Header WA */}
                <div className="px-4 pt-12 pb-3 flex items-center gap-3"
                  style={{ background:'linear-gradient(180deg, #128C7E 0%, #075E54 100%)' }}>
                  <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-sm shrink-0">CM</div>
                  <div>
                    <div className="text-white text-[13px] font-bold leading-tight">Calzado Maya</div>
                    <div className="flex items-center gap-1 text-green-200 text-[9.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block"/>en línea
                    </div>
                  </div>
                </div>

                {/* Chat area */}
                <div ref={chatBoxRef}
                  className="px-2.5 py-2.5 flex flex-col gap-1.5"
                  style={{ background:'#ECE5DD', minHeight:320, maxHeight:320, overflowY:'auto' }}>
                  {msgs.map((m) => (
                    <div key={m.uid} className={`flex ${m.bot ? 'justify-start' : 'justify-end'}`}
                      style={{ animation:'fadeUp 0.28s ease both' }}>
                      <div className="text-[10px] leading-[1.55] px-2.5 py-1.5 shadow-sm whitespace-pre-line"
                        style={{
                          background: m.bot ? '#FFF' : '#DCF8C6',
                          color:'#111',
                          borderRadius: m.bot ? '10px 10px 10px 3px' : '10px 10px 3px 10px',
                          maxWidth:'84%',
                        }}>
                        {m.text}
                        {!m.bot && <span className="text-[7px] text-blue-400 ml-1">✓✓</span>}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start" style={{ animation:'fadeUp 0.25s ease both' }}>
                      <div className="bg-white px-3 py-2 rounded-[10px] rounded-bl-[3px] flex gap-1 items-center shadow-sm">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"
                            style={{ animation:'pulse 0.9s ease-in-out infinite', animationDelay:`${i*0.2}s` }}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div className="px-3 py-2 flex items-center gap-2 bg-white border-t border-gray-100">
                  <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-[10px] text-gray-400">
                    Escribí un mensaje...
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                    style={{ background:'#22C55E' }}>➤</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card derecha — solo desktop */}
          <div className="hidden md:flex flex-col justify-center bg-white rounded-2xl p-4 w-[180px] shrink-0"
            style={{ boxShadow:'0 8px 32px rgba(0,0,0,0.09)', border:'1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 16 16" fill="#F59E0B">
                  <path d="M8 1L9.8 6H15L10.5 9.3L12.3 14.3L8 11L3.7 14.3L5.5 9.3L1 6H6.2L8 1Z"/>
                </svg>
              ))}
            </div>
            <p className="text-[13px] font-bold text-ink mb-1.5 leading-tight">Lo mejor<br/>del mercado</p>
            <p className="text-[11px] text-slate leading-relaxed mb-2">
              Mis ventas subieron 40% el primer mes.
            </p>
            <p className="text-[11px] font-semibold text-ink">María García</p>
          </div>

        </div>

        {/* ── Steps centrados abajo ── */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-8 pb-2">
          {SIM_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 transition-all duration-300">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all duration-300"
                style={{ background: i === step ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.04)', color: i === step ? '#16A34A' : '#9CA3AF' }}>
                {s.n}
              </div>
              <span className="text-[12px] font-semibold transition-colors duration-300"
                style={{ color: i === step ? '#0D1117' : '#9CA3AF' }}>
                {s.title}
              </span>
              {i === step && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block anim-pulse-dot"/>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* ══ TRUSTED BY ════════════════════════════════════════════════════════ */}
      <div className="px-5 md:px-10 pt-10 pb-8 text-center border-t border-gray-100 mt-10">
        <p className="text-[12px] text-fog mb-5 font-medium">
          Confiado por los mejores negocios de Guatemala
        </p>
        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
          {LOGOS.map(l => (
            <div key={l.name} className="flex items-center gap-1.5 text-ink font-semibold text-[13px] opacity-50 hover:opacity-80 transition-opacity cursor-default">
              <span className="text-[16px]">{l.icon}</span>{l.name}
            </div>
          ))}
        </div>
      </div>

      {/* ══ VIDEO DEMO ════════════════════════════════════════════════════════ */}
      <VideoDemo />

      {/* ══ CONTACTO ══════════════════════════════════════════════════════════ */}
      <div id="contacto" className="px-5 md:px-10 py-14 border-t border-gray-100">
        <div className="max-w-[540px] mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-bold text-white px-3 py-1 rounded-md mb-4"
              style={{ background:'#16A34A' }}>Empezá hoy</span>
            <h2 className="font-black text-ink tracking-tight mb-3" style={{ fontSize:'clamp(26px,4vw,34px)' }}>
              ¿Listo para empezar?
            </h2>
            <p className="text-[14px] text-slate">
              Te contactamos en menos de 24 horas para configurar tu agente.
            </p>
          </div>

          {success ? (
            <div className="text-center py-14 border border-gray-100 rounded-2xl">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-extrabold text-ink mb-2">¡Recibimos tu solicitud!</h3>
              <p className="text-[14px] text-slate mb-6">Te contactaremos por WhatsApp en menos de 24 horas.</p>
              <button onClick={() => setSuccess(false)} className="text-[13px] font-semibold text-green-600 bg-transparent border-none cursor-pointer">
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre del negocio *" placeholder="Mi Tienda GT"      value={form.nombre_negocio} onChange={v => setForm({...form, nombre_negocio:v})} />
                <div>
                  <label className={lbl}>Giro del negocio</label>
                  <select className={inp} value={form.giro} onChange={e => setForm({...form, giro:e.target.value})}>
                    {['Zapatería / Calzado','Ropa y accesorios','Electrónica','Alimentos','Ferretería','Autopartes','Otro'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="WhatsApp *"         placeholder="+502 XXXX XXXX"     type="tel"   value={form.whatsapp} onChange={v => setForm({...form, whatsapp:v})} />
                <Field label="Correo electrónico" placeholder="correo@negocio.com" type="email" value={form.email}    onChange={v => setForm({...form, email:v})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ciudad" placeholder="Guatemala..." value={form.ciudad} onChange={v => setForm({...form, ciudad:v})} />
                <div>
                  <label className={lbl}>Pedidos al mes</label>
                  <select className={inp} value={form.pedidos_mes} onChange={e => setForm({...form, pedidos_mes:e.target.value})}>
                    <option value="">Seleccioná</option>
                    {['Menos de 20','20 - 50','50 - 100','Más de 100'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Contanos sobre tu negocio</label>
                <textarea className={`${inp} resize-none`} rows={3}
                  placeholder="¿Qué vendés? ¿Cuál es tu reto con ventas por WhatsApp?"
                  value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})}/>
              </div>
              {error && (
                <div className="text-[13px] rounded-xl px-4 py-3 bg-red-50 text-red-600 border border-red-100">{error}</div>
              )}
              <button onClick={handleSubmit} disabled={loading}
                className={`w-full border-none py-4 rounded-full text-[14px] font-bold cursor-pointer text-white transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                style={{ background:'#0D1117', boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
                {loading ? 'Enviando...' : 'Quiero que me contacten →'}
              </button>
              <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
                {['🔒 Datos privados','✓ Sin spam','📱 Por WhatsApp'].map(t => (
                  <span key={t} className="text-[11px] text-fog">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <div id="features" className="px-5 md:px-10 py-14 border-t border-gray-100" style={{ background:'#FAFAFA' }}>
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-black text-ink tracking-tight mb-3" style={{ fontSize:'clamp(24px,4vw,34px)' }}>
              Todo lo que necesitás para vender
            </h2>
            <p className="text-[14px] text-slate">Sin conocimientos técnicos. Sin complicaciones.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="text-center p-5 md:p-6 rounded-2xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-default"
                style={{ boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                <div className="text-[26px] md:text-[30px] mb-3">{f.ico}</div>
                <div className="text-[13px] md:text-[14px] font-bold text-ink mb-1.5">{f.title}</div>
                <div className="text-[11px] md:text-[12px] text-slate leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PRECIOS ═══════════════════════════════════════════════════════════ */}
      <div id="precios" className="px-5 md:px-10 py-14 border-t border-gray-100">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-black text-ink tracking-tight mb-3" style={{ fontSize:'clamp(24px,4vw,34px)' }}>
              Planes simples y transparentes
            </h2>
            <p className="text-[14px] text-slate mb-6">Sin sorpresas. Sin contratos. Cancelá cuando quieras.</p>
            <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
              <button onClick={() => setAnual(false)}
                className={`px-5 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all ${!periodoAnual ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-fog'}`}>
                Mensual
              </button>
              <button onClick={() => setAnual(true)}
                className={`px-5 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all ${periodoAnual ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-fog'}`}>
                Anual <span className="text-green-600 font-bold ml-1">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(planes.length > 0 ? planes : [
              { key:'basico',     nombre:'Básico',     mensual:299,  anual:2990  },
              { key:'pro',        nombre:'Pro',        mensual:599,  anual:5990  },
              { key:'enterprise', nombre:'Enterprise', mensual:1299, anual:12990 },
            ]).map(p => {
              const popular  = p.key === 'pro'
              const features = PLAN_FEATURES[p.key] || []
              const precio   = periodoAnual ? Math.round(p.anual / 12) : p.mensual
              const sufijo   = periodoAnual ? '/mes · facturado anual' : '/mes'
              return (
                <div key={p.key}
                  className={`relative rounded-2xl p-6 md:p-7 flex flex-col transition-all ${popular ? '' : 'border border-gray-100 hover:shadow-md'}`}
                  style={popular ? { background:'#0D1117', boxShadow:'0 20px 60px rgba(13,17,23,0.22)' }
                                 : { background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white px-4 py-1 rounded-full whitespace-nowrap"
                      style={{ background:'#22C55E' }}>
                      ✦ Más popular
                    </div>
                  )}
                  <div className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${popular ? 'text-gray-500' : 'text-fog'}`}>
                    {p.nombre}
                  </div>
                  <div className={`font-black tracking-tight mb-1 ${popular ? 'text-white' : 'text-ink'}`} style={{ fontSize:42 }}>
                    Q{precio}
                  </div>
                  <div className={`text-[12px] mb-6 ${popular ? 'text-gray-500' : 'text-fog'}`}>{sufijo}</div>
                  <ul className="list-none p-0 m-0 flex flex-col gap-2.5 mb-8 flex-1">
                    {features.map(f => (
                      <li key={f} className={`flex gap-2 items-center text-[13px] ${popular ? 'text-gray-300' : 'text-slate'}`}>
                        <span className={`font-bold ${popular ? 'text-green-400' : 'text-green-500'}`}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => scrollTo('contacto')}
                    className={`w-full py-3.5 rounded-full text-[13px] font-bold cursor-pointer border-none transition-all ${popular ? 'bg-white text-ink hover:bg-gray-100' : 'text-white hover:opacity-90'}`}
                    style={!popular ? { background:'#0D1117' } : {}}>
                    Quiero este plan →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <div className="px-5 md:px-10 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3"
        style={{ background:'#FAFAFA' }}>
        <span className="text-[15px] font-bold text-ink">
          Pok<span style={{ color:'#16A34A' }}>tah</span>
          <span className="text-[12px] text-fog font-normal ml-2">· Hecho en Guatemala 🇬🇹</span>
        </span>
        <div className="flex gap-6">
          {['Términos','Privacidad','Soporte'].map(l => (
            <span key={l} className="text-[12px] text-fog cursor-pointer hover:text-slate transition-colors">{l}</span>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Auxiliares ───────────────────────────────────────────────────────────────

function Field({ label, placeholder, type='text', value, onChange }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input className={inp} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}/>
    </div>
  )
}

const lbl = 'text-[11px] font-semibold text-slate block mb-1.5'
const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-ink bg-gray-50 outline-none focus:border-green-300 focus:bg-white transition-colors placeholder:text-fog'

// ─── Video Demo ───────────────────────────────────────────────────────────────

const DEMO_ORDERS_BASE = [
  { id:'PED-4820', c:'Ana R.',   p:'Adidas Ultraboost', m:'Q1,100', e:'En camino', t:'hace 15 min' },
  { id:'PED-4819', c:'Luis P.',  p:'Vans Old Skool',    m:'Q620',   e:'Pagado',    t:'hace 32 min' },
  { id:'PED-4818', c:'María G.', p:'Nike Air Max 270',  m:'Q895',   e:'Pagado',    t:'hace 1 hr'   },
  { id:'PED-4817', c:'Jorge V.', p:'Puma RS-X',         m:'Q840',   e:'Pendiente', t:'hace 2 hr'   },
]
const DEMO_NEW_ORDER = { id:'PED-4821', c:'Carlos M.', p:'Nike Air Max 270', m:'Q895', e:'Pagado', t:'ahora' }

const DEMO_PRODS = [
  { n:'Nike Air Max 270', p:'Q895',   s:14, img:'👟', tag:'Popular',    tc:'#16A34A' },
  { n:'Adidas Ultraboost',p:'Q1,100', s:7,  img:'🏃', tag:'Running',    tc:'#3B82F6' },
  { n:'Vans Old Skool',   p:'Q620',   s:22, img:'👟', tag:'Nuevo',      tc:'#8B5CF6' },
  { n:'Puma RS-X',        p:'Q840',   s:3,  img:'👟', tag:'Bajo stock', tc:'#D97706' },
  { n:'Converse Chuck',   p:'Q450',   s:18, img:'👟', tag:null,         tc:null      },
  { n:'Jordan 1 Retro',   p:'Q2,200', s:5,  img:'🏀', tag:'Popular',    tc:'#16A34A' },
]

const NAV_ITEMS = [
  { ico:'📊', label:'Resumen',      key:'resumen'     },
  { ico:'📦', label:'Pedidos',      key:'pedidos'     },
  { ico:'🛍️', label:'Productos',    key:'productos'   },
  { ico:'👥', label:'Clientes',     key:'clientes'    },
  { ico:'💬', label:'Seguimientos', key:'seguimientos'},
  { ico:'⚙️', label:'Configuración',key:'config'      },
]

function VideoDemo() {
  const [view,    setView]    = useState('pedidos')
  const [toast,   setToast]   = useState(false)
  const [hasNew,  setHasNew]  = useState(false)
  const [counts,  setCounts]  = useState({ ventas:0, pedidos:0, msg:0 })

  useEffect(() => {
    const T = []
    let raf = null

    function countUp(targets, dur) {
      const start = Date.now()
      function tick() {
        const prog = Math.min((Date.now() - start) / dur, 1)
        const ease = 1 - Math.pow(1 - prog, 3)
        setCounts({
          ventas:  Math.round(targets.ventas  * ease),
          pedidos: Math.round(targets.pedidos * ease),
          msg:     Math.round(targets.msg     * ease),
        })
        if (prog < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    function cycle() {
      // reset
      setView('pedidos')
      setToast(false)
      setHasNew(false)
      setCounts({ ventas:0, pedidos:0, msg:0 })

      // nums sube
      countUp({ ventas:4205, pedidos:23, msg:98 }, 1600)

      // 3.2s → notificación WA
      T.push(setTimeout(() => setToast(true), 3200))
      // 5.2s → ocultar toast + nuevo pedido en lista
      T.push(setTimeout(() => { setToast(false); setHasNew(true) }, 5200))
      // 7.5s → cambiar a Productos
      T.push(setTimeout(() => setView('productos'), 7500))
      // 12.5s → volver a Pedidos y reiniciar
      T.push(setTimeout(cycle, 12500))
    }

    T.push(setTimeout(cycle, 500))
    return () => { T.forEach(clearTimeout); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const orders   = hasNew ? [DEMO_NEW_ORDER, ...DEMO_ORDERS_BASE] : DEMO_ORDERS_BASE
  const activeNav = view === 'productos' ? 'productos' : 'pedidos'

  return (
    <div className="px-5 md:px-10 py-16 border-t border-gray-100" style={{ background:'#F8FAFB' }}>
      <div className="max-w-[920px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-bold text-white px-3 py-1 rounded-md mb-4"
            style={{ background:'#16A34A' }}>Demo en vivo</span>
          <h2 className="font-black text-ink tracking-tight mb-3" style={{ fontSize:'clamp(24px,4vw,36px)' }}>
            Mirá cómo crece tu negocio
          </h2>
          <p className="text-[14px] text-slate mx-auto" style={{ maxWidth:480 }}>
            Cada venta que tu agente cierra aparece al instante en tu panel — pedidos, pagos y productos en un solo lugar.
          </p>
        </div>

        {/* Browser window */}
        <div className="rounded-2xl overflow-hidden"
          style={{ boxShadow:'0 24px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)' }}>

          {/* macOS chrome */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background:'#EBEBEB', borderBottom:'1px solid #D1D1D1' }}>
            <div className="flex gap-1.5 shrink-0">
              {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                <div key={c} className="w-3 h-3 rounded-full" style={{ background:c }}/>
              ))}
            </div>
            {/* Tab bar */}
            <div className="flex gap-1 overflow-hidden">
              <div className="flex items-center gap-1.5 bg-white rounded-t-lg px-3 py-1 text-[11px] font-medium text-gray-700 shrink-0"
                style={{ boxShadow:'0 -1px 0 rgba(0,0,0,0.06) inset' }}>
                <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background:'linear-gradient(135deg,#22C55E,#16A34A)' }}>
                  <svg width="8" height="8" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/>
                    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/>
                  </svg>
                </div>
                Poktah — Dashboard
              </div>
            </div>
            {/* URL bar */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 flex items-center gap-1.5 mx-auto max-w-[300px]">
                <span className="text-green-600 text-[10px]">🔒</span>
                <span className="truncate">app.poktah.com/dashboard/{view}</span>
              </div>
            </div>
          </div>

          {/* App shell */}
          <div className="flex" style={{ minHeight:430, background:'#F9FAFB' }}>

            {/* Sidebar */}
            <div className="hidden sm:flex flex-col shrink-0"
              style={{ width:196, background:'#0D1117', borderRight:'1px solid rgba(255,255,255,0.05)' }}>
              {/* Logo */}
              <div className="flex items-center gap-2.5 px-4 py-4 border-b mb-2"
                style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background:'linear-gradient(135deg,#22C55E,#16A34A)' }}>
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/>
                    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white leading-none">
                    Pok<span style={{ color:'#22C55E' }}>tah</span>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Calzado Maya</div>
                </div>
              </div>

              {/* Nav */}
              {NAV_ITEMS.map(n => (
                <div key={n.key}
                  className="mx-2 mb-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 cursor-default"
                  style={{
                    background: n.key === activeNav ? 'rgba(34,197,94,0.12)' : 'transparent',
                    color:      n.key === activeNav ? '#22C55E' : 'rgba(255,255,255,0.38)',
                    borderLeft: n.key === activeNav ? '2px solid #22C55E' : '2px solid transparent',
                  }}>
                  <span className="text-[13px]">{n.ico}</span>
                  {n.label}
                  {n.key === 'pedidos' && hasNew && (
                    <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background:'#22C55E', color:'white' }}>1</span>
                  )}
                </div>
              ))}

              {/* Plan badge */}
              <div className="mt-auto mx-3 mb-3 rounded-xl p-3"
                style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)' }}>
                <div className="text-[10px] font-bold text-green-400 mb-0.5">Plan Pro · Activo</div>
                <div className="text-[9px] text-gray-500">3,000 msgs/mes · 2,847 restantes</div>
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 overflow-hidden relative">

              {/* Toast WA */}
              {toast && (
                <div className="absolute top-3 right-3 z-30 flex items-start gap-3 rounded-2xl p-3"
                  style={{
                    background:'white',
                    border:'1px solid rgba(34,197,94,0.2)',
                    width:240,
                    animation:'slideToast 0.38s cubic-bezier(.22,1,.36,1) both',
                    boxShadow:'0 12px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(34,197,94,0.12)',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:'linear-gradient(135deg,#25D366,#128C7E)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Agente Poktah</div>
                    <div className="text-[11px] font-bold text-ink leading-tight">¡Nuevo pedido cerrado!</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">Carlos M. — Nike Air Max 270</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-black text-ink">Q895</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background:'rgba(34,197,94,0.12)', color:'#16A34A' }}>Pago confirmado ✓</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Vista Pedidos ── */}
              {view === 'pedidos' && (
                <div key="pedidos" className="p-4 md:p-5 flex flex-col gap-4"
                  style={{ animation:'fadeUp 0.3s ease both' }}>

                  {/* Page title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[16px] font-black text-ink">Pedidos</div>
                      <div className="text-[11px] text-gray-400">Hoy · {new Date().toLocaleDateString('es-GT',{weekday:'long',day:'numeric',month:'long'})}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ background:'rgba(34,197,94,0.1)', color:'#16A34A' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block anim-pulse-dot"/>
                        Agente activo
                      </div>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l:'Ventas hoy',     v:`Q${counts.ventas.toLocaleString()}`, ico:'💰', sub:'+12% vs ayer' },
                      { l:'Pedidos nuevos', v:String(counts.pedidos),               ico:'📦', sub:'por el agente' },
                      { l:'Tasa respuesta', v:`${counts.msg}%`,                     ico:'💬', sub:'24/7 sin parar'},
                    ].map(s => (
                      <div key={s.l} className="rounded-xl p-3 bg-white"
                        style={{ boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
                        <div className="text-[18px] mb-1">{s.ico}</div>
                        <div className="text-[20px] md:text-[24px] font-black text-ink leading-none tabular-nums">{s.v}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{s.l}</div>
                        <div className="text-[9px] font-semibold mt-1" style={{ color:'#16A34A' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Orders table */}
                  <div className="rounded-xl overflow-hidden bg-white"
                    style={{ boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                      <span className="text-[12px] font-bold text-ink">Pedidos recientes</span>
                      <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(34,197,94,0.08)', color:'#16A34A' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block anim-pulse-dot"/>
                        En vivo
                      </span>
                    </div>
                    {orders.map((o, i) => (
                      <div key={o.id + i}
                        className="flex items-center gap-2 md:gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 text-[11px]"
                        style={{
                          background: i === 0 && hasNew ? 'rgba(34,197,94,0.04)' : 'white',
                          animation:  i === 0 && hasNew ? 'fadeUp 0.4s ease both' : undefined,
                          transition: 'background 0.5s ease',
                        }}>
                        {i === 0 && hasNew && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 anim-pulse-dot"/>
                        )}
                        <span className="font-mono text-gray-400 hidden sm:block w-[68px] shrink-0">{o.id}</span>
                        <span className="text-ink font-semibold w-[64px] md:w-[76px] shrink-0 truncate">{o.c}</span>
                        <span className="text-gray-400 flex-1 truncate hidden md:block">{o.p}</span>
                        <span className="text-ink font-bold w-[52px] shrink-0 text-right tabular-nums">{o.m}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 whitespace-nowrap"
                          style={{
                            background: o.e==='Pagado'?'rgba(34,197,94,0.1)':o.e==='En camino'?'rgba(59,130,246,0.1)':'rgba(245,158,11,0.1)',
                            color:      o.e==='Pagado'?'#16A34A'            :o.e==='En camino'?'#3B82F6'            :'#D97706',
                          }}>
                          {o.e}
                        </span>
                        <span className="text-gray-300 text-[9px] hidden md:block w-[58px] shrink-0 text-right">{o.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Vista Productos ── */}
              {view === 'productos' && (
                <div key="productos" className="p-4 md:p-5"
                  style={{ animation:'fadeUp 0.3s ease both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[16px] font-black text-ink">Productos</div>
                      <div className="text-[11px] text-gray-400">6 activos · sincronizados con el agente</div>
                    </div>
                    <div className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white cursor-default select-none"
                      style={{ background:'#16A34A', boxShadow:'0 2px 8px rgba(22,163,74,0.3)' }}>
                      + Agregar producto
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DEMO_PRODS.map((p, i) => (
                      <div key={p.n} className="bg-white rounded-xl overflow-hidden cursor-default"
                        style={{
                          boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
                          border:'1px solid rgba(0,0,0,0.05)',
                          animation:`fadeUp 0.35s ease ${i * 0.07}s both`,
                        }}>
                        <div className="flex items-center justify-center text-[34px] relative"
                          style={{ height:76, background:'linear-gradient(135deg,#F3F4F6,#E5E7EB)' }}>
                          {p.img}
                          {p.tag && (
                            <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: p.tc === '#D97706' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: p.tc }}>
                              {p.tag}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <div className="text-[11px] font-bold text-ink truncate leading-tight mb-1">{p.n}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black text-ink">{p.p}</span>
                            <span className="text-[9px] font-semibold"
                              style={{ color: p.s <= 5 ? '#D97706' : '#16A34A' }}>
                              {p.s} en stock
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { ico:'📊', title:'Panel en tiempo real',  desc:'Cada pedido del agente aparece al instante sin hacer nada.' },
            { ico:'🛍️', title:'Gestión de productos',  desc:'Editá precios, stock y fotos — el agente se actualiza solo.' },
            { ico:'📱', title:'Desde cualquier lugar', desc:'Accedé al dashboard desde tu celular, tablet o computadora.' },
          ].map(h => (
            <div key={h.title} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100"
              style={{ boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
              <span className="text-[22px] shrink-0">{h.ico}</span>
              <div>
                <div className="text-[13px] font-bold text-ink mb-0.5">{h.title}</div>
                <div className="text-[11px] text-slate leading-relaxed">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
