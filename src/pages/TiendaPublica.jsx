import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function useScreenWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

const Ico = ({ d, size = 20, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  cart:    'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  plus:    'M12 4.5v15m7.5-7.5h-15',
  minus:   'M19.5 12h-15',
  x:       'M6 18L18 6M6 6l12 12',
  search:  'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z',
  img:     'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  wa:      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z',
  filter:  'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25',
  tag:     'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z',
}

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return '34,197,94'
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

function buildMsg(negocio, carrito) {
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const items = carrito.map(item => {
    const attrs = item.variante
      ? [item.variante.valor1, item.variante.valor2].filter(Boolean).join(' / ')
      : null
    const sub   = attrs ? ` (${attrs})` : ''
    const monto = (item.precio * item.cantidad).toFixed(2)
    return `• ${item.cantidad}x *${item.nombre}*${sub} - Q${monto}`
  }).join('\n')

  return (
    `Hola! Quiero hacer un pedido en *${negocio}* 🛒\n\n` +
    `*Detalle:*\n${items}\n\n` +
    `*Total estimado: Q${total.toFixed(2)}*\n\n` +
    `Por favor confirmarme disponibilidad y forma de pago 😊`
  )
}

function buildWaUrl(whatsapp, negocio, carrito) {
  const num = (whatsapp || '').replace(/\D/g, '')
  if (!num) return null
  const numCompleto = num.length === 8 ? `502${num}` : num
  const msg = buildMsg(negocio, carrito)
  // api.whatsapp.com/send funciona en móvil, desktop browser y WhatsApp Web
  return `https://api.whatsapp.com/send/?phone=${numCompleto}&text=${encodeURIComponent(msg)}`
}

function ImgProducto({ src, alt }) {
  const [err, setErr] = useState(false)
  if (!src || err) return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#F3F4F6' }}>
      <Ico d={ICONS.img} size={36} color="#D1D5DB" />
    </div>
  )
  return <img src={src} alt={alt} onError={() => setErr(true)} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.35s ease' }} />
}

function ProductoCard({ producto, onAgregar, onVerDetalle, accent, isDesktop }) {
  const [varSel, setVarSel] = useState(
    producto.variantes?.find(v => v.is_default) || producto.variantes?.[0] || null
  )
  const [imgIdx, setImgIdx] = useState(0)
  const [flash,  setFlash]  = useState(false)
  const [hover,  setHover]  = useState(false)

  const precio   = varSel ? varSel.precio : producto.precio
  const stock    = varSel ? varSel.stock  : producto.stock
  const imgs     = producto.imagenes?.filter(Boolean).length ? producto.imagenes.filter(Boolean) : [producto.imagen].filter(Boolean)
  const sinStock = stock !== null && stock !== undefined && stock <= 0

  const vals1 = [...new Set(producto.variantes?.map(v => v.valor1).filter(Boolean))]
  const vals2 = [...new Set(producto.variantes?.map(v => v.valor2).filter(Boolean))]

  const agregar = () => {
    if (sinStock) return
    onAgregar({ id: producto.id, nombre: producto.nombre, precio, variante: varSel, imagen: imgs[0] || null })
    setFlash(true)
    setTimeout(() => setFlash(false), 1200)
  }

  const btnBg    = flash ? '#15803D' : sinStock ? '#E5E7EB' : accent
  const btnColor = sinStock ? '#9CA3AF' : '#fff'
  const imgHeight = isDesktop ? '65%' : '80%'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:'#fff',
        borderRadius:16,
        border:`1px solid ${hover ? `rgba(${hexToRgb(accent)},0.25)` : '#F0F0F0'}`,
        overflow:'hidden',
        display:'flex',
        flexDirection:'column',
        boxShadow: hover ? `0 12px 36px rgba(${hexToRgb(accent)},0.15)` : '0 2px 8px rgba(0,0,0,0.05)',
        transition:'box-shadow 0.2s,transform 0.2s,border-color 0.2s',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        cursor:'default',
      }}
    >
      {/* Imagen */}
      <div
        style={{ position:'relative', paddingTop: imgHeight, overflow:'hidden', cursor:'pointer', background:'#F9FAFB' }}
        onClick={() => onVerDetalle ? onVerDetalle(producto) : (imgs.length > 1 && setImgIdx(i => (i+1) % imgs.length))}
      >
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <div style={{ width:'100%', height:'100%', transform: hover ? 'scale(1.05)' : 'scale(1)', transition:'transform 0.35s ease' }}>
            <ImgProducto src={imgs[imgIdx]} alt={producto.nombre} />
          </div>
        </div>
        {sinStock && (
          <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20, letterSpacing:'0.05em' }}>
            AGOTADO
          </div>
        )}
        {imgs.length > 1 && (
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
            {imgs.map((_,i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                style={{ width:6, height:6, borderRadius:'50%', background: i===imgIdx ? '#fff' : 'rgba(255,255,255,0.55)', cursor:'pointer', transition:'background 0.2s' }} />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: isDesktop ? '16px 16px 18px' : '12px 12px 14px', flex:1, display:'flex', flexDirection:'column', gap: isDesktop ? 10 : 8 }}>
        <div style={{ fontSize: isDesktop ? 15 : 13, fontWeight:700, color:'#111827', lineHeight:1.35, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {producto.nombre}
        </div>
        {isDesktop && producto.descripcion && (
          <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.55, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {producto.descripcion}
          </div>
        )}

        {/* Variantes label1 */}
        {vals1.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
              {producto.variante_label1 || 'Opción'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {vals1.map(v => {
                const sel = varSel?.valor1 === v
                return (
                  <button key={v}
                    onClick={() => { const m = producto.variantes.find(vr => vr.valor1===v && (!varSel?.valor2 || vr.valor2===varSel.valor2)); setVarSel(m || producto.variantes.find(vr => vr.valor1===v)) }}
                    style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, border:`1.5px solid ${sel ? accent : '#E5E7EB'}`, background: sel ? `rgba(${hexToRgb(accent)},0.08)` : '#fff', color: sel ? accent : '#4B5563', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                    {v}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {/* Variantes label2 */}
        {vals2.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
              {producto.variante_label2 || 'Color'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {vals2.map(v => {
                const sel = varSel?.valor2 === v
                return (
                  <button key={v}
                    onClick={() => { const m = producto.variantes.find(vr => vr.valor2===v && (!varSel?.valor1 || vr.valor1===varSel.valor1)); setVarSel(m || producto.variantes.find(vr => vr.valor2===v)) }}
                    style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, border:`1.5px solid ${sel ? accent : '#E5E7EB'}`, background: sel ? `rgba(${hexToRgb(accent)},0.08)` : '#fff', color: sel ? accent : '#4B5563', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                    {v}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Precio + Botón */}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, paddingTop:8, borderTop:'1px solid #F9FAFB' }}>
          <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>
            Q{precio?.toFixed(2)}
          </div>
          <button onClick={agregar} disabled={sinStock}
            style={{ display:'flex', alignItems:'center', gap:5, padding: isDesktop ? '10px 18px' : '8px 14px', borderRadius:10, border:'none', background:btnBg, color:btnColor, fontSize: isDesktop ? 13 : 12, fontWeight:700, cursor:sinStock?'not-allowed':'pointer', transition:'background 0.2s,transform 0.1s', fontFamily:'inherit', transform: flash ? 'scale(0.97)' : 'scale(1)' }}>
            {flash ? '✓ Agregado' : sinStock ? 'Agotado' : <><Ico d={ICONS.plus} size={13} color="#fff" /> Agregar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCarrito({ carrito, negocio, whatsapp, accent, onCerrar, onCambiar, onEliminar }) {
  const total = carrito.reduce((s,i) => s + i.precio * i.cantidad, 0)
  const waUrl = buildWaUrl(whatsapp, negocio, carrito)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={onCerrar} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)' }} />
      <div style={{ position:'relative', background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 -16px 60px rgba(0,0,0,0.20)' }}>

        <div style={{ width:40, height:4, borderRadius:2, background:'#E5E7EB', margin:'14px auto 0' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 22px 12px', borderBottom:'1px solid #F3F4F6' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'#111827' }}>Tu pedido</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:1 }}>{carrito.reduce((s,i)=>s+i.cantidad,0)} productos seleccionados</div>
          </div>
          <button onClick={onCerrar} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Ico d={ICONS.x} size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'4px 22px' }}>
          {carrito.map((item, idx) => {
            const varStr = item.variante ? [item.variante.valor1, item.variante.valor2].filter(Boolean).join(' / ') : null
            return (
              <div key={idx} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom:'1px solid #F9FAFB', alignItems:'center' }}>
                <div style={{ width:62, height:62, borderRadius:12, overflow:'hidden', flexShrink:0, background:'#F3F4F6' }}>
                  {item.imagen
                    ? <img src={item.imagen} alt={item.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Ico d={ICONS.img} size={24} color="#D1D5DB" /></div>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.nombre}</div>
                  {varStr && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{varStr}</div>}
                  <div style={{ fontSize:15, fontWeight:800, color: accent, marginTop:4 }}>Q{(item.precio * item.cantidad).toFixed(2)}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#F9FAFB', borderRadius:10, padding:'5px 10px', border:'1px solid #E5E7EB' }}>
                    <button onClick={() => onCambiar(idx, item.cantidad-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:0, display:'flex' }}>
                      <Ico d={ICONS.minus} size={14} />
                    </button>
                    <span style={{ fontSize:14, fontWeight:700, color:'#111827', minWidth:18, textAlign:'center' }}>{item.cantidad}</span>
                    <button onClick={() => onCambiar(idx, item.cantidad+1)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:0, display:'flex' }}>
                      <Ico d={ICONS.plus} size={14} />
                    </button>
                  </div>
                  <button onClick={() => onEliminar(idx)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', fontSize:10, fontWeight:600, color:'#EF4444' }}>
                    Quitar
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding:'16px 22px 28px', borderTop:'1px solid #F3F4F6' }}>
          <div style={{ background:'#F9FAFB', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
            {carrito.map((item,idx) => (
              <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6B7280', marginBottom: idx < carrito.length-1 ? 6 : 0 }}>
                <span>{item.cantidad}x {item.nombre}{item.variante ? ` (${[item.variante.valor1,item.variante.valor2].filter(Boolean).join('/')})` : ''}</span>
                <span style={{ fontWeight:600, color:'#374151' }}>Q{(item.precio*item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ height:1, background:'#E5E7EB', margin:'10px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Total estimado</span>
              <span style={{ fontSize:22, fontWeight:900, color:'#111827' }}>Q{total.toFixed(2)}</span>
            </div>
          </div>
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              style={{ width:'100%', background:'#25D366', color:'#fff', textDecoration:'none', padding:'16px 20px', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'inherit', boxShadow:'0 4px 20px rgba(37,211,102,0.42)', letterSpacing:'-0.2px', boxSizing:'border-box' }}>
              <Ico d={ICONS.wa} size={22} color="#fff" fill="#fff" />
              Confirmar pedido por WhatsApp
            </a>
          ) : (
            <button disabled
              style={{ width:'100%', background:'#D1D5DB', color:'#9CA3AF', border:'none', padding:'16px 20px', borderRadius:14, fontSize:16, fontWeight:700, cursor:'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'inherit' }}>
              WhatsApp no configurado
            </button>
          )}
          <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
            Se abrirá WhatsApp con tu pedido listo. El agente confirma y coordina el pago.
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalProducto({ producto, accent, onCerrar, onAgregar }) {
  const [varSel, setVarSel] = useState(
    producto.variantes?.find(v => v.is_default) || producto.variantes?.[0] || null
  )
  const [imgIdx, setImgIdx] = useState(0)
  const [flash, setFlash]   = useState(false)

  const precio  = varSel ? varSel.precio : producto.precio
  const stock   = varSel ? varSel.stock  : producto.stock
  const imgs    = producto.imagenes?.filter(Boolean).length ? producto.imagenes.filter(Boolean) : [producto.imagen].filter(Boolean)
  const sinStock = stock !== null && stock !== undefined && stock <= 0
  const vals1   = [...new Set(producto.variantes?.map(v => v.valor1).filter(Boolean))]
  const vals2   = [...new Set(producto.variantes?.map(v => v.valor2).filter(Boolean))]
  const btnBg   = flash ? '#15803D' : sinStock ? '#E5E7EB' : accent
  const btnColor = sinStock ? '#9CA3AF' : '#fff'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleAgregar = () => {
    if (sinStock) return
    onAgregar({ id: producto.id, nombre: producto.nombre, precio, variante: varSel, imagen: imgs[0] || null })
    setFlash(true)
    setTimeout(() => { setFlash(false); onCerrar() }, 900)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1001, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={onCerrar} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
      <div style={{
        position:'relative', background:'#fff', borderRadius:'24px 24px 0 0',
        width:'100%', maxWidth:560, maxHeight:'92vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 -20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:2, background:'#E5E7EB', margin:'12px auto 0', flexShrink:0 }} />
        {/* Close */}
        <button onClick={onCerrar} style={{
          position:'absolute', top:14, right:16,
          background:'rgba(0,0,0,0.07)', border:'none', borderRadius:50,
          width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <Ico d={ICONS.x} size={16} color="#374151" />
        </button>

        {/* Imagen */}
        <div style={{ position:'relative', width:'100%', overflow:'hidden', flexShrink:0, background:'#F3F4F6',
          borderRadius:'20px 20px 0 0', cursor: imgs.length > 1 ? 'pointer' : 'default' }}
          onClick={() => imgs.length > 1 && setImgIdx(i => (i + 1) % imgs.length)}
        >
          <div style={{ paddingTop:'65%', position:'relative' }}>
            <div style={{ position:'absolute', inset:0 }}>
              <ImgProducto src={imgs[imgIdx]} alt={producto.nombre} />
            </div>
          </div>
          {sinStock && (
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.68)', color:'#fff', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20 }}>
              AGOTADO
            </div>
          )}
          {imgs.length > 1 && (
            <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
              {imgs.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                  style={{ width:8, height:8, borderRadius:'50%', background: i === imgIdx ? accent : 'rgba(0,0,0,0.22)', cursor:'pointer', transition:'background 0.2s' }} />
              ))}
            </div>
          )}
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px 4px' }}>
          <div style={{ fontSize:21, fontWeight:800, color:'#111827', letterSpacing:'-0.5px', lineHeight:1.25, marginBottom: producto.descripcion ? 8 : 4 }}>
            {producto.nombre}
          </div>
          {producto.descripcion && (
            <div style={{ fontSize:14, color:'#6B7280', lineHeight:1.65, marginBottom:16 }}>
              {producto.descripcion}
            </div>
          )}

          {/* Variantes */}
          {vals1.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>
                {producto.variante_label1 || 'Opción'}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {vals1.map(v => {
                  const sel = varSel?.valor1 === v
                  return (
                    <button key={v}
                      onClick={() => { const m = producto.variantes.find(vr => vr.valor1===v && (!varSel?.valor2 || vr.valor2===varSel.valor2)); setVarSel(m || producto.variantes.find(vr => vr.valor1===v)) }}
                      style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, border:`1.5px solid ${sel ? accent : '#E5E7EB'}`, background: sel ? `rgba(${hexToRgb(accent)},0.09)` : '#fff', color: sel ? accent : '#4B5563', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {vals2.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>
                {producto.variante_label2 || 'Color'}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {vals2.map(v => {
                  const sel = varSel?.valor2 === v
                  return (
                    <button key={v}
                      onClick={() => { const m = producto.variantes.find(vr => vr.valor2===v && (!varSel?.valor1 || vr.valor1===varSel.valor1)); setVarSel(m || producto.variantes.find(vr => vr.valor2===v)) }}
                      style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, border:`1.5px solid ${sel ? accent : '#E5E7EB'}`, background: sel ? `rgba(${hexToRgb(accent)},0.09)` : '#fff', color: sel ? accent : '#4B5563', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pie fijo — precio + botón */}
        <div style={{ padding:'14px 20px 30px', borderTop:'1px solid #F3F4F6', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:30, fontWeight:900, color:'#111827', letterSpacing:'-1px', lineHeight:1 }}>
              Q{precio?.toFixed(2)}
            </div>
            {stock !== null && stock !== undefined && stock > 0 && (
              <div style={{ fontSize:12, color:'#9CA3AF', fontWeight:500 }}>{stock} disponibles</div>
            )}
          </div>
          <button onClick={handleAgregar} disabled={sinStock}
            style={{ width:'100%', padding:'16px 20px', borderRadius:14, border:'none', background:btnBg, color:btnColor, fontSize:16, fontWeight:700, cursor:sinStock?'not-allowed':'pointer', transition:'all 0.2s', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transform: flash ? 'scale(0.97)' : 'scale(1)', boxShadow: sinStock ? 'none' : `0 4px 18px rgba(${hexToRgb(accent)},0.35)` }}>
            {flash ? '✓ Agregado al pedido' : sinStock ? 'Agotado' : <><Ico d={ICONS.plus} size={18} color="#fff" /> Agregar al pedido</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TiendaPublica() {
  const { slug }                     = useParams()
  const [tienda,    setTienda]       = useState(null)
  const [cargando,  setCargando]     = useState(true)
  const [error404,  setError404]     = useState(false)
  const [carrito,   setCarrito]      = useState([])
  const [verCarrito,setVerCarrito]   = useState(false)
  const [modalProducto,setModalProducto] = useState(null)
  const [busqueda,  setBusqueda]     = useState('')
  const [tipoFiltro,setTipoFiltro]  = useState('todos')

  useEffect(() => {
    axios.get(`${API}/public/tienda/${slug}`)
      .then(r => setTienda(r.data))
      .catch(e => { if (e.response?.status === 404) setError404(true) })
      .finally(() => setCargando(false))
  }, [slug])

  const agregar = (item) => {
    setCarrito(prev => {
      const idx = prev.findIndex(i => i.id === item.id && i.variante?.id === item.variante?.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], cantidad: n[idx].cantidad+1 }; return n }
      return [...prev, { ...item, cantidad:1 }]
    })
  }

  const cambiar = (idx, cant) => {
    if (cant <= 0) setCarrito(prev => prev.filter((_,i) => i !== idx))
    else setCarrito(prev => prev.map((item,i) => i===idx ? {...item, cantidad:cant} : item))
  }

  const totalItems = carrito.reduce((s,i) => s+i.cantidad, 0)
  const accent     = tienda?.color || '#22C55E'
  const sw         = useScreenWidth()
  const isMobile   = sw < 640
  const isTablet   = sw >= 640 && sw < 1024
  const isDesktop  = sw >= 1024
  const gridCols   = isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'

  // Tipos únicos para filtros
  const tipos = tienda ? ['todos', ...new Set((tienda.productos || []).map(p => p.tipo).filter(Boolean))] : ['todos']
  const TIPO_LABELS = { 'todos': 'Todos', 'producto': 'Productos', 'servicio': 'Servicios', 'digital': 'Digital', 'combo': 'Combos' }
  const tipoLabel = (t) => TIPO_LABELS[t] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

  const filtrados = (tienda?.productos || []).filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'todos' || p.tipo === tipoFiltro
    return matchBusqueda && matchTipo
  })

  if (cargando) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🛍️</div>
        <div style={{ fontSize:14, color:'#9CA3AF' }}>Cargando tienda...</div>
      </div>
    </div>
  )

  if (error404) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#111827', marginBottom:8 }}>Tienda no encontrada</div>
        <div style={{ fontSize:14, color:'#9CA3AF' }}>El enlace puede estar incorrecto o la tienda no está disponible.</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FA', fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>

      {/* ── HEADER sticky ─────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #EBEBEB', position:'sticky', top:0, zIndex:200, boxShadow:'0 1px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:66 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {tienda?.logo ? (
              <img src={tienda.logo} alt="logo" style={{ width:40, height:40, borderRadius:10, objectFit:'cover', border:'2px solid #F0F0F0' }} onError={e => e.target.style.display='none'} />
            ) : (
              <div style={{ width:40, height:40, borderRadius:10, background:`rgba(${hexToRgb(accent)},0.12)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏪</div>
            )}
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>{tienda?.nombre}</div>
              {!isMobile && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>Tienda en línea · Pedidos por WhatsApp</div>}
            </div>
          </div>

          {/* Search inline on desktop */}
          {isDesktop && (
            <div style={{ position:'relative', width:320 }}>
              <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
                <Ico d={ICONS.search} size={15} color="#9CA3AF" />
              </div>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar productos..."
                style={{ width:'100%', padding:'9px 14px 9px 38px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'#F9FAFB', fontSize:13, color:'#111827', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          )}

          <button onClick={() => totalItems > 0 && setVerCarrito(true)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:12, border:`2px solid ${totalItems > 0 ? accent : '#E5E7EB'}`, background: totalItems > 0 ? `rgba(${hexToRgb(accent)},0.08)` : '#fff', cursor: totalItems > 0 ? 'pointer':'default', fontFamily:'inherit', transition:'all 0.15s' }}>
            <div style={{ position:'relative' }}>
              <Ico d={ICONS.cart} size={18} color={totalItems > 0 ? accent : '#9CA3AF'} />
              {totalItems > 0 && (
                <div style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff' }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </div>
              )}
            </div>
            <span style={{ fontSize:13, fontWeight:700, color: totalItems > 0 ? accent : '#9CA3AF' }}>
              {totalItems > 0 ? `Q${carrito.reduce((s,i)=>s+i.precio*i.cantidad,0).toFixed(2)}` : 'Mi pedido'}
            </span>
          </button>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, rgba(${hexToRgb(accent)},0.10) 0%, rgba(${hexToRgb(accent)},0.04) 60%, #F8F9FA 100%)`,
        borderBottom:'1px solid #EBEBEB',
        padding: isDesktop ? '52px 24px 44px' : isMobile ? '24px 16px 20px' : '32px 20px 28px',
      }}>
        <div style={{ maxWidth:1240, margin:'0 auto' }}>
          {isDesktop ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:48 }}>
              {/* Left: info */}
              <div style={{ flex:1 }}>
                {tienda?.logo && (
                  <img src={tienda.logo} alt="logo"
                    style={{ width:72, height:72, borderRadius:18, objectFit:'cover', border:'3px solid #fff', boxShadow:'0 4px 18px rgba(0,0,0,0.12)', marginBottom:20, display:'block' }}
                    onError={e => e.target.style.display='none'} />
                )}
                <h1 style={{ fontSize:40, fontWeight:900, color:'#111827', letterSpacing:'-1px', margin:'0 0 10px', lineHeight:1.15 }}>
                  {tienda?.nombre}
                </h1>
                <p style={{ fontSize:16, color:'#6B7280', margin:'0 0 0', lineHeight:1.6 }}>
                  Seleccioná tus productos y pedí directo por WhatsApp — confirmación al instante 🛒
                </p>
              </div>
              {/* Right: stats */}
              <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                {[
                  { icon:'📦', label:'Productos', value: tienda?.productos?.length || 0 },
                  { icon:'⚡', label:'Respuesta', value: 'Inmediata' },
                  { icon:'💳', label:'Pago', value: 'Flexible' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', background:'#fff', borderRadius:18, padding:'20px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', border:'1px solid #F0F0F0', minWidth:110 }}>
                    <div style={{ fontSize:26, marginBottom:6 }}>{s.icon}</div>
                    <div style={{ fontSize:22, fontWeight:900, color: accent, letterSpacing:'-0.5px', lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Mobile/tablet hero */
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              {tienda?.logo && (
                <img src={tienda.logo} alt="logo"
                  style={{ width:56, height:56, borderRadius:14, objectFit:'cover', border:'2px solid #fff', boxShadow:'0 3px 12px rgba(0,0,0,0.10)', marginBottom:12, display: isMobile ? 'inline-block' : 'block' }}
                  onError={e => e.target.style.display='none'} />
              )}
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight:900, color:'#111827', letterSpacing:'-0.5px', margin:'0 0 6px', lineHeight:1.2 }}>
                {tienda?.nombre}
              </h1>
              <p style={{ fontSize: isMobile ? 13 : 14, color:'#6B7280', margin:'0 0 16px', lineHeight:1.5 }}>
                Pedí directo por WhatsApp 🛒
              </p>
              {/* Search mobile */}
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)' }}>
                  <Ico d={ICONS.search} size={15} color="#9CA3AF" />
                </div>
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar productos..."
                  style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:14, color:'#111827', outline:'none', boxSizing:'border-box', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTROS POR TIPO ──────────────────────────────────────────────── */}
      {tipos.length > 2 && (
        <div style={{ background:'#fff', borderBottom:'1px solid #EBEBEB', overflowX:'auto' }}>
          <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 20px', display:'flex', gap:4, alignItems:'center', height:52 }}>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              {tipos.map(t => {
                const sel = tipoFiltro === t
                return (
                  <button key={t} onClick={() => setTipoFiltro(t)}
                    style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${sel ? accent : '#E5E7EB'}`, background: sel ? accent : '#fff', color: sel ? '#fff' : '#6B7280', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', fontFamily:'inherit' }}>
                    {tipoLabel(t)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── GRID PRODUCTOS ────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1240, margin:'0 auto', padding: isDesktop ? '32px 24px 140px' : '16px 12px 110px' }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:16, color:'#9CA3AF' }}>
              {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay productos disponibles aún'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: isDesktop ? 20 : 12 }}>
              <div style={{ fontSize:13, color:'#9CA3AF', fontWeight:600 }}>
                {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}{busqueda ? ` para "${busqueda}"` : ''}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: gridCols, gap: isDesktop ? 22 : 10 }}>
              {filtrados.map(p => (
                <ProductoCard key={p.id} producto={p} onAgregar={agregar} onVerDetalle={setModalProducto} accent={accent} isDesktop={isDesktop} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── FAB WhatsApp ──────────────────────────────────────────────────── */}
      {tienda?.whatsapp && (() => {
        const n = tienda.whatsapp.replace(/\D/g,'')
        const fab = n.length === 8 ? `502${n}` : n
        return (
        <a href={`https://wa.me/${fab}`} target="_blank" rel="noopener noreferrer"
          style={{ position:'fixed', bottom:totalItems>0?92:24, right:22, zIndex:100, width:54, height:54, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 22px rgba(37,211,102,0.55)', textDecoration:'none', transition:'bottom 0.25s' }}
          title="Hablar con el agente">
          <Ico d={ICONS.wa} size={28} color="#fff" fill="#fff" />
        </a>
        )
      })()}

      {/* ── BARRA INFERIOR ────────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:150, padding:'10px 16px 16px', background:'#fff', borderTop:'1px solid #EBEBEB', boxShadow:'0 -4px 24px rgba(0,0,0,0.09)' }}>
          <div style={{ maxWidth:520, margin:'0 auto' }}>
            <button onClick={() => setVerCarrito(true)}
              style={{ width:'100%', background:accent, color:'#fff', border:'none', padding:'14px 20px', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'inherit', boxShadow:`0 4px 18px rgba(${hexToRgb(accent)},0.38)` }}>
              <span style={{ background:'rgba(255,255,255,0.22)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>
                {totalItems} {totalItems===1?'producto':'productos'}
              </span>
              <span>Ver mi pedido →</span>
              <span style={{ fontWeight:800, fontSize:16 }}>Q{carrito.reduce((s,i)=>s+i.precio*i.cantidad,0).toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PRODUCTO ────────────────────────────────────────────────── */}
      {modalProducto && (
        <ModalProducto
          producto={modalProducto}
          accent={accent}
          onCerrar={() => setModalProducto(null)}
          onAgregar={(item) => { agregar(item); setModalProducto(null) }}
        />
      )}

      {/* ── MODAL CARRITO ─────────────────────────────────────────────────── */}
      {verCarrito && (
        <ModalCarrito
          carrito={carrito}
          negocio={tienda?.nombre}
          whatsapp={tienda?.whatsapp}
          accent={accent}
          onCerrar={() => setVerCarrito(false)}
          onCambiar={cambiar}
          onEliminar={idx => setCarrito(prev => prev.filter((_,i) => i!==idx))}
        />
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderTop:'1px solid #EBEBEB', padding:'18px 16px' }}>
        <div style={{ maxWidth:1240, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>
            Tienda impulsada por <span style={{ fontWeight:700, color:accent }}>Poktah</span> · Agente de ventas IA 24/7
          </div>
        </div>
      </div>
    </div>
  )
}
