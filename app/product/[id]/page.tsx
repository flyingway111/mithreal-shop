'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { type Product } from '../../data/products'
import { supabase } from '../../lib/supabase'

const S = {
  bg: '#0A0A0A', card: '#141414', card2: '#1C1C1C',
  border: '#2A2A2A', white: '#FFFFFF', grey: '#8A8A8A', red: '#E53935',
}

export default function ProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [wished, setWished] = useState(false)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', Number(id)).single().then(({ data }) => {
      if (data) {
        const p = { ...data, isNew: data.is_new }
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

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.grey }}>
      Загрузка...
    </div>
  )

  if (!product) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.grey }}>
      Товар не найден
    </div>
  )

  const handleAdd = () => {
    if (!size) return
    const cart = JSON.parse(localStorage.getItem('mithreal-cart') || '[]')
    const existing = cart.find((i: { id: number; size: string }) => i.id === product.id && i.size === size)
    if (existing) existing.qty += 1
    else cart.push({ id: product.id, size, qty: 1 })
    localStorage.setItem('mithreal-cart', JSON.stringify(cart))
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleWish = () => {
    const wl: number[] = JSON.parse(localStorage.getItem('mithreal-wishlist') || '[]')
    const next = wished ? wl.filter(i => i !== product.id) : [...wl, product.id]
    localStorage.setItem('mithreal-wishlist', JSON.stringify(next))
    setWished(!wished)
    window.dispatchEvent(new Event('wishlist-updated'))
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', color: S.white, paddingBottom: 100 }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/5', maxHeight: '60vh' }}>
        {product.images[imgIdx] ? (
          <img src={product.images[imgIdx]} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: '#111' }}>
            {product.category === 'sneakers' ? '👟' : product.category === 'kofty' ? '🧥' : '👕'}
          </div>
        )}

        {/* Back */}
        <button onClick={() => router.back()} style={{
          position: 'absolute', top: 14, left: 14, width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ArrowLeft size={18} color={S.white} /></button>

        {/* Wishlist */}
        <button onClick={handleWish} style={{
          position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Heart size={18} fill={wished ? S.red : 'none'} color={wished ? S.red : S.white} /></button>

        {/* NEW badge */}
        {product.isNew && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: S.white, color: S.bg, fontSize: 11, fontWeight: 800,
            padding: '3px 10px', borderRadius: 4, letterSpacing: '0.08em',
          }}>NEW</div>
        )}

        {/* Image nav */}
        {product.images.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><ChevronLeft size={18} color={S.white} /></button>
            <button onClick={() => setImgIdx(i => Math.min(product.images.length - 1, i + 1))} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><ChevronRight size={18} color={S.white} /></button>
            <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 5 }}>
              {product.images.map((_, i) => (
                <div key={i} onClick={() => setImgIdx(i)} style={{
                  width: 6, height: 6, borderRadius: '50%', cursor: 'pointer',
                  background: i === imgIdx ? S.white : 'rgba(255,255,255,0.4)',
                }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '20px 18px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{product.name}</div>

        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          {product.price.toLocaleString('ru-RU')}₽
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Package size={13} color={product.stock === 1 ? '#F59E0B' : S.grey} />
          <span style={{ fontSize: 12, color: product.stock === 1 ? '#F59E0B' : S.grey, fontWeight: product.stock === 1 ? 600 : 400 }}>
            {product.stock === 1 ? 'Последний!' : `В наличии: ${product.stock} шт.`}
          </span>
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ background: S.card, borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: S.grey, marginBottom: 6, letterSpacing: '0.05em' }}>О ТОВАРЕ</div>
            <div style={{ fontSize: 14, color: '#C8C8C8', lineHeight: 1.6 }}>{product.description}</div>
          </div>
        )}

        {/* Sizes */}
        <div style={{ fontSize: 13, color: S.grey, marginBottom: 10, letterSpacing: '0.05em' }}>РАЗМЕР</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {product.sizes.map(s => (
            <button key={s} onClick={() => setSize(s)} style={{
              padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              border: `1px solid ${size === s ? S.white : S.border}`,
              background: size === s ? S.white : 'transparent',
              color: size === s ? S.bg : S.white, cursor: 'pointer', transition: 'all 0.15s',
            }}>{s}</button>
          ))}
        </div>

        {/* Похожие */}
        {similar.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: S.grey, marginBottom: 12, letterSpacing: '0.05em' }}>ПОХОЖИЕ ТОВАРЫ</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {similar.map(p => (
                <div key={p.id} onClick={() => router.push(`/product/${p.id}`)} style={{ flexShrink: 0, width: 120, cursor: 'pointer' }}>
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: 120, height: 150, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                  ) : (
                    <div style={{ width: 120, height: 150, borderRadius: 10, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                      {p.category === 'sneakers' ? '👟' : p.category === 'kofty' ? '🧥' : '👕'}
                    </div>
                  )}
                  <div style={{ fontSize: 11, marginTop: 6, color: '#C8C8C8', lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{p.price.toLocaleString('ru-RU')}₽</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px 28px', background: S.bg,
        borderTop: `1px solid ${S.border}`,
        display: 'flex', gap: 10,
      }}>
        <button onClick={handleWish} style={{
          width: 50, height: 50, borderRadius: 12, border: `1px solid ${S.border}`,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><Heart size={20} fill={wished ? S.red : 'none'} color={wished ? S.red : S.white} /></button>

        <button onClick={handleAdd} style={{
          flex: 1, height: 50, borderRadius: 12, border: 'none',
          background: added ? '#22C55E' : size ? S.white : S.border,
          color: added ? S.white : size ? S.bg : S.grey,
          fontSize: 15, fontWeight: 700, cursor: size ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
        }}>
          {added ? '✓ Добавлено' : <><ShoppingCart size={18} />{size ? 'В корзину' : 'Выберите размер'}</>}
        </button>
      </div>
    </div>
  )
}
