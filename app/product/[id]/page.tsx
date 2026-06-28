'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, ArrowLeft } from 'lucide-react'
import { type Product } from '../../data/products'
import { supabase } from '../../lib/supabase'

const S = {
  bg:    '#060606',
  card:  '#0F0F0F',
  card2: '#161616',
  white: '#FFFFFF',
  gold:  '#C9A96E',
  grey:  '#888888',
  dgrey: '#3A3A3A',
  red:   '#FF3B30',
  green: '#32D74B',
}

const CAT_LABEL: Record<string,string> = { tshirts:'Футболки', kofty:'Кофты', sneakers:'Кроссовки' }
const CAT_ICON:  Record<string,string>  = { tshirts:'👕', kofty:'🧥', sneakers:'👟' }

export default function ProductPage() {
  const { id } = useParams()
  const router  = useRouter()

  const [product, setProduct]   = useState<Product | null>(null)
  const [similar, setSimilar]   = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [imgIdx,  setImgIdx]    = useState(0)
  const [size,    setSize]      = useState<string | null>(null)
  const [added,   setAdded]     = useState(false)
  const [wished,  setWished]    = useState(false)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', Number(id)).single().then(({ data }) => {
      if (data) {
        const p = { ...data, isNew: data.is_new } as Product
        setProduct(p)
        supabase.from('products').select('*').eq('category', data.category).neq('id', Number(id)).limit(4).then(({ data: sim }) => {
          setSimilar((sim || []).map(s => ({ ...s, isNew: s.is_new })))
        })
      }
      setLoading(false)
    })
    const wl: number[] = JSON.parse(localStorage.getItem('mithreal-wishlist') || '[]')
    setWished(wl.includes(Number(id)))
  }, [id])

  const handleAdd = () => {
    if (!size || !product) return
    const cart = JSON.parse(localStorage.getItem('mithreal-cart') || '[]')
    const existing = cart.find((i: { id: number; size: string }) => i.id === product.id && i.size === size)
    if (existing) existing.qty += 1
    else cart.push({ id: product.id, size, qty: 1 })
    localStorage.setItem('mithreal-cart', JSON.stringify(cart))
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleWish = () => {
    if (!product) return
    const wl: number[] = JSON.parse(localStorage.getItem('mithreal-wishlist') || '[]')
    const next = wished ? wl.filter(i => i !== product.id) : [...wl, product.id]
    localStorage.setItem('mithreal-wishlist', JSON.stringify(next))
    setWished(!wished)
    window.dispatchEvent(new Event('wishlist-updated'))
  }

  if (loading) return (
    <div style={{ background:S.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:S.grey, fontSize:13 }}>
      Загрузка...
    </div>
  )

  if (!product) return (
    <div style={{ background:S.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:S.grey, fontSize:13 }}>
      Товар не найден
    </div>
  )

  return (
    <div style={{ background:S.bg, minHeight:'100vh', color:S.white, paddingBottom:100 }}>

      {/* ── Image ── */}
      <div style={{ position:'relative', height:'58vh', minHeight:340, overflow:'hidden', background:S.card2 }}>
        {product.images[imgIdx] ? (
          <img src={product.images[imgIdx]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>
            {CAT_ICON[product.category] || '🏷️'}
          </div>
        )}

        {/* Gradient overlay */}
        <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(to top, rgba(6,6,6,0.65) 0%, transparent 100%)', pointerEvents:'none' }}/>

        {/* Back */}
        <button onClick={() => router.back()} style={{ position:'absolute', top:14, left:14, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(12px)', border:'0.5px solid rgba(255,255,255,0.14)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowLeft size={17} color={S.white} strokeWidth={1.5}/>
        </button>

        {/* Wishlist */}
        <button onClick={handleWish} style={{ position:'absolute', top:14, right:14, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(12px)', border:'0.5px solid rgba(255,255,255,0.14)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Heart size={17} fill={wished ? S.red : 'none'} color={wished ? S.red : S.white} strokeWidth={1.5}/>
        </button>

        {/* NEW badge */}
        {product.isNew && (
          <div style={{ position:'absolute', bottom:16, left:16, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', border:'0.5px solid rgba(255,255,255,0.2)', color:S.white, fontSize:9, fontWeight:800, padding:'4px 10px', borderRadius:4, letterSpacing:'0.12em' }}>NEW</div>
        )}

        {/* Image carousel controls */}
        {product.images.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => Math.max(0, i-1))} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronLeft size={18} color={S.white} strokeWidth={1.5}/>
            </button>
            <button onClick={() => setImgIdx(i => Math.min(product.images.length-1, i+1))} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronRight size={18} color={S.white} strokeWidth={1.5}/>
            </button>
            <div style={{ position:'absolute', bottom:16, right:16, display:'flex', gap:5 }}>
              {product.images.map((_, i) => (
                <div key={i} onClick={() => setImgIdx(i)} style={{ width:6, height:6, borderRadius:'50%', cursor:'pointer', background: i === imgIdx ? S.white : 'rgba(255,255,255,0.3)', transition:'all 0.2s' }}/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Info ── */}
      <div style={{ padding:'22px 18px' }}>

        {/* Category + Name */}
        <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>
          {CAT_LABEL[product.category]}
        </div>
        <div style={{ fontSize:21, fontWeight:700, lineHeight:1.25, marginBottom:14, letterSpacing:'-0.01em' }}>
          {product.name}
        </div>

        {/* Price + Stock */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em' }}>
            {product.price.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background: product.stock === 1 ? S.gold : S.green }}/>
            <span style={{ fontSize:12, color: product.stock === 1 ? S.gold : S.grey, fontWeight: product.stock === 1 ? 600 : 400 }}>
              {product.stock === 1 ? 'Последний!' : `В наличии: ${product.stock} шт.`}
            </span>
          </div>
        </div>

        <div style={{ height:'0.5px', background:'rgba(255,255,255,0.06)', marginBottom:24 }}/>

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10 }}>О товаре</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.75 }}>{product.description}</div>
          </div>
        )}

        {/* Sizes */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', textTransform:'uppercase' }}>Размер</div>
            {!size && <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>Выберите</div>}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {product.sizes.map(s => {
              const active = size === s
              return (
                <button key={s} onClick={() => setSize(s)} style={{ padding:'10px 20px', borderRadius:100, fontSize:13, fontWeight:500, border:`0.5px solid ${active ? 'rgba(201,169,110,0.7)' : 'rgba(255,255,255,0.09)'}`, background: active ? 'rgba(201,169,110,0.1)' : 'transparent', color: active ? S.gold : 'rgba(255,255,255,0.6)', cursor:'pointer', transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)' }}>{s}</button>
              )
            })}
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <>
            <div style={{ height:'0.5px', background:'rgba(255,255,255,0.06)', marginBottom:24 }}/>
            <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Похожие товары</div>
            <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
              {similar.map(p => (
                <div key={p.id} onClick={() => router.push(`/product/${p.id}`)} style={{ flexShrink:0, width:110, cursor:'pointer' }}>
                  <div style={{ width:110, height:138, borderRadius:12, overflow:'hidden', background:S.card2, marginBottom:8, border:'0.5px solid rgba(255,255,255,0.05)' }}>
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34 }}>{CAT_ICON[p.category] || '🏷️'}</div>
                    }
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.35, marginBottom:3 }}>{p.name}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.price.toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 16px 28px', background:'rgba(6,6,6,0.96)', backdropFilter:'blur(20px)', borderTop:'0.5px solid rgba(255,255,255,0.08)', display:'flex', gap:10 }}>
        <button onClick={handleWish} style={{ width:50, height:50, borderRadius:14, flexShrink:0, border:`0.5px solid ${wished ? 'rgba(255,59,48,0.35)' : 'rgba(255,255,255,0.09)'}`, background: wished ? 'rgba(255,59,48,0.08)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)' }}>
          <Heart size={20} fill={wished ? S.red : 'none'} color={wished ? S.red : 'rgba(255,255,255,0.55)'} strokeWidth={1.5}/>
        </button>

        <button onClick={handleAdd} style={{ flex:1, height:50, borderRadius:100, border:'none', background: added ? S.green : size ? S.white : S.card2, color: added ? S.white : size ? S.bg : S.grey, fontSize:15, fontWeight:700, cursor: size ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.25s cubic-bezier(0.32,0.72,0,1)', letterSpacing:'0.01em' }}>
          {added
            ? '✓ Добавлено'
            : size
              ? <><ShoppingCart size={17} strokeWidth={1.5}/>В корзину</>
              : 'Выберите размер'
          }
        </button>
      </div>
    </div>
  )
}
