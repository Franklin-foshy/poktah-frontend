import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { requestOTP, verifyOTP } from '../api/client'

export default function Login() {
  const [tel,           setTel]  = useState('')
  const [codigo,        setCod]  = useState(['','','','','',''])
  const [step,          setStep] = useState(1)
  const [load,          setLoad] = useState(false)
  const [error,         setErr]  = useState('')
  const [codigoVisible, setCodVisible] = useState(null)
  const firstInputRef = useRef(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    if (step === 2) firstInputRef.current?.focus()
  }, [step])

  const handleDigit = (val, idx) => {
    const next = [...codigo]; next[idx] = val; setCod(next)
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus()
  }
  const handleBack = (e, idx) => {
    if (e.key === 'Backspace' && !codigo[idx] && idx > 0)
      document.getElementById(`otp-${idx-1}`)?.focus()
  }
  const sendOTP = async () => {
    const local  = tel.replace(/\D/g, '')
    if (!local || local.length < 7) { setErr('Ingresá tu número completo'); return }
    const numero = '502' + local
    setLoad(true); setErr(''); setCodVisible(null)
    try {
      const { data } = await requestOTP(numero)
      if (data.fallback_codigo) {
        setCodVisible(data.fallback_codigo)
      }
      setStep(2)
    } catch(e) {
      const detail = e.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : 'No se pudo enviar el código'
      setErr(msg)
    } finally {
      setLoad(false)
    }
  }
  const verify = async () => {
    const numero = '502' + tel.replace(/\D/g, '')
    const code   = codigo.join('')
    if (code.length < 6) { setErr('Ingresá el código completo'); return }
    setLoad(true); setErr('')
    try {
      const { data } = await verifyOTP(numero, code)
      login(data); navigate('/dashboard')
    } catch(e) {
      setErr(e.response?.data?.detail || 'Código incorrecto')
      setCod(['','','','','',''])
      document.getElementById('otp-0')?.focus()
    } finally { setLoad(false) }
  }

  return (
    <div className="min-h-screen font-sans relative overflow-hidden" style={{ background:'#EEF0F4' }}>

      {/* Gradient blobs — igual que landing */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background:'radial-gradient(circle at 20% 20%, rgba(134,239,172,0.3) 0%, transparent 65%)' }}/>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background:'radial-gradient(circle at 80% 20%, rgba(147,197,253,0.25) 0%, transparent 65%)' }}/>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-5 relative z-10">
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

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate">soporte@poktah.gt</span>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full cursor-pointer border-none"
            style={{ background:'#0D1117', boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
            Solicitar demo
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">↗</span>
          </button>
        </div>
      </nav>

      {/* ── CARD CENTRADA ── */}
      <div className="flex items-center justify-center px-4 relative z-10"
        style={{ minHeight:'calc(100vh - 76px)' }}>
        <div className="w-full max-w-[420px]">

          <div className="bg-white rounded-[24px] p-10"
            style={{ boxShadow:'0 8px 48px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8)' }}>

            {step === 1 ? (
              <>
                {/* Ícono */}
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background:'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow:'0 4px 16px rgba(34,197,94,0.35)' }}>
                    <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/>
                      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
                      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/>
                    </svg>
                  </div>
                </div>

                <h1 className="text-[26px] font-black text-ink text-center mb-2 tracking-tight">
                  Ingresar al panel
                </h1>
                <p className="text-[13px] text-slate text-center mb-8 leading-relaxed">
                  Ingresá tu número de WhatsApp registrado<br/>para recibir tu código de acceso
                </p>

                <label className="text-[11px] font-semibold text-slate block mb-1.5">
                  Número de WhatsApp
                </label>
                <div style={{ display:'flex', marginBottom:16, border:'1.5px solid #E5E7EB', borderRadius:12, overflow:'hidden', background:'#F9FAFB' }}>
                  <div style={{ padding:'0 12px', display:'flex', alignItems:'center', borderRight:'1.5px solid #E5E7EB', background:'#F3F4F6', fontSize:13, color:'#6B7280', whiteSpace:'nowrap', gap:6 }}>
                    🇬🇹 +502
                  </div>
                  <input
                    type="tel"
                    value={tel}
                    onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && sendOTP()}
                    placeholder="5386 1234"
                    maxLength={12}
                    style={{ flex:1, padding:'12px 14px', border:'none', outline:'none', fontSize:14, color:'#0D1117', background:'transparent', fontFamily:'inherit' }}
                  />
                </div>

                {error && <ErrBox msg={error} />}

                <button onClick={sendOTP} disabled={load}
                  className={`w-full border-none py-3.5 rounded-full text-[14px] font-bold cursor-pointer text-white transition-all ${load ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ background: load ? '#9CA3AF' : '#0D1117', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
                  {load ? 'Enviando...' : 'Enviar código →'}
                </button>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-100"/>
                  <span className="text-[11px] text-fog">acceso seguro</span>
                  <div className="flex-1 h-px bg-gray-100"/>
                </div>

                <div className="flex justify-center gap-5">
                  {['🔒 Datos privados','📱 Solo tu WA','⏱ 10 min'].map(t => (
                    <span key={t} className="text-[10px] text-fog">{t}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Ícono paso 2 */}
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background:'#F0FDF4', border:'1.5px solid #BBF7D0' }}>
                    📱
                  </div>
                </div>

                <h1 className="text-[26px] font-black text-ink text-center mb-2 tracking-tight">
                  Código de acceso
                </h1>

                {codigoVisible ? (
                  <div className="rounded-xl px-4 py-3 mb-4 text-center"
                    style={{ background:'#FFF7ED', border:'1.5px solid #FED7AA' }}>
                    <p className="text-[12px] text-orange-600 mb-1">
                      WhatsApp no disponible — usá este código:
                    </p>
                    <span className="text-[28px] font-black tracking-[0.25em] text-orange-700">
                      {codigoVisible}
                    </span>
                  </div>
                ) : (
                  <p className="text-[13px] text-slate text-center mb-2 leading-relaxed">
                    Enviamos un código de 6 dígitos a<br/>
                    <span className="font-semibold text-ink">+502 {tel}</span>
                  </p>
                )}
                <div className="text-center mb-8">
                  <span onClick={() => { setStep(1); setCod(['','','','','','']); setErr(''); setCodVisible(null) }}
                    className="text-[12px] cursor-pointer font-semibold transition-colors"
                    style={{ color:'#16A34A' }}>
                    ← Cambiar número
                  </span>
                </div>

                <label className="text-[11px] font-semibold text-slate block mb-3">
                  Ingresá los 6 dígitos
                </label>
                <div className="flex gap-2 mb-6 justify-center">
                  {codigo.map((d,i) => (
                    <input key={i} id={`otp-${i}`}
                      className="h-14 text-center text-[22px] font-bold text-ink outline-none rounded-xl shrink-0 transition-all"
                      style={{
                        width:48,
                        background: d ? '#F0FDF4' : '#F9FAFB',
                        border: d ? '1.5px solid #22C55E' : '1.5px solid #E5E7EB',
                        caretColor:'#22C55E',
                      }}
                      ref={i === 0 ? firstInputRef : null}
                      maxLength={1} value={d}
                      onChange={e => handleDigit(e.target.value, i)}
                      onKeyDown={e => handleBack(e, i)}
                    />
                  ))}
                </div>

                {error && <ErrBox msg={error} />}

                <button onClick={verify} disabled={load}
                  className={`w-full border-none py-3.5 rounded-full text-[14px] font-bold cursor-pointer text-white transition-all ${load ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ background: load ? '#9CA3AF' : '#0D1117', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
                  {load ? 'Verificando...' : 'Ingresar al dashboard →'}
                </button>

                <p className="text-center text-[12px] text-fog mt-5">
                  ¿No llegó el código?{' '}
                  <span onClick={sendOTP} className="font-semibold cursor-pointer transition-colors" style={{ color:'#16A34A' }}>
                    Reenviar
                  </span>
                </p>
              </>
            )}
          </div>

          <p className="text-center text-[11px] text-fog mt-5">
            Copyright @Poktah 2026 &nbsp;·&nbsp;
            <span className="cursor-pointer hover:text-slate transition-colors">Privacidad</span>
          </p>
        </div>
      </div>

    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div className="text-[13px] rounded-xl px-4 py-3 mb-4 bg-red-50 text-red-600 border border-red-100">
      {msg}
    </div>
  )
}
