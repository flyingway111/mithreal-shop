'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Heart, Search, X, Plus, Minus, SlidersHorizontal, Trash2, ArrowUpDown, Package, Truck, Mail, MapPin } from 'lucide-react'
import { CATEGORIES, DEMO_PRODUCTS, type Product } from './data/products'
import { supabase } from './lib/supabase'

const S = {
  bg:     '#060606',
  card:   '#0F0F0F',
  card2:  '#161616',
  border: '#1E1E1E',
  white:  '#FFFFFF',
  gold:   '#C9A96E',
  grey:   '#888888',
  dgrey:  '#3A3A3A',
  red:    '#FF3B30',
  green:  '#32D74B',
}

type CartItem = { id: number; size: string; qty: number }
type SortKey = 'default' | 'new' | 'price_asc' | 'price_desc'
type Tab = 'catalog' | 'wishlist' | 'cart'

const getCart = (): CartItem[] => JSON.parse(localStorage.getItem('mithreal-cart') || '[]')
const getWishlist = (): number[] => JSON.parse(localStorage.getItem('mithreal-wishlist') || '[]')
const saveCart = (c: CartItem[]) => { localStorage.setItem('mithreal-cart', JSON.stringify(c)); window.dispatchEvent(new Event('cart-updated')) }
const saveWishlist = (w: number[]) => { localStorage.setItem('mithreal-wishlist', JSON.stringify(w)); window.dispatchEvent(new Event('wishlist-updated')) }

const CAT_LABEL: Record<string, string> = { tshirts: 'Футболка', kofty: 'Кофта', sneakers: 'Кроссовки' }
const CAT_ICON: Record<string, string>  = { tshirts: '👕', kofty: '🧥', sneakers: '👟' }
const CLOTHING_SIZES = ['XS','S','M','L','XL','XXL']
const SHOE_SIZES = ['38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45']

const TICKER = 'NEW ITEMS  ·  FAST DELIVERY  ·  ORIGINAL BRANDS  ·  BEST PRICE  ·  SHOP  ·  '

// ── Size Filter ───────────────────────────────────────────────────────────────
function SizeFilterModal({ selected, category, onApply, onClose, products }: {
  selected: string[]; category: string; onApply: (s: string[]) => void; onClose: () => void; products: Product[]
}) {
  const [picked, setPicked] = useState<string[]>(selected)
  const isShoes = category === 'sneakers'
  const isClothing = ['tshirts','kofty'].includes(category)
  const pool = isShoes ? SHOE_SIZES : isClothing ? CLOTHING_SIZES : [...new Set(products.flatMap(p => p.sizes))]
  const sizes = pool.filter(s => products.some(p => (category === 'all' || p.category === category) && p.sizes.includes(s)))
  const toggle = (s: string) => setPicked(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:150, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ background:S.card, borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'75vh', overflowY:'auto', border:'0.5px solid rgba(255,255,255,0.08)', borderBottom:'none' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:3, borderRadius:2, background:S.dgrey }}/>
        </div>
        <div style={{ padding:'16px 18px 44px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.01em' }}>Размер</div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:S.card2, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={15} color='rgba(255,255,255,0.5)' strokeWidth={1.5}/>
            </button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 }}>
            {sizes.map(s => {
              const active = picked.includes(s)
              return (
                <button key={s} onClick={() => toggle(s)} style={{
                  padding:'9px 18px', borderRadius:100, fontSize:13, fontWeight:500, cursor:'pointer',
                  border:`0.5px solid ${active ? 'rgba(201,169,110,0.65)' : 'rgba(255,255,255,0.1)'}`,
                  background: active ? 'rgba(201,169,110,0.1)' : 'transparent',
                  color: active ? S.gold : 'rgba(255,255,255,0.55)',
                  transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)',
                }}>{s}</button>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setPicked([]); onApply([]) }} style={{ flex:1, padding:'14px 0', borderRadius:100, border:'0.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.45)', fontSize:14, fontWeight:600, cursor:'pointer' }}>Сбросить</button>
            <button onClick={() => { onApply(picked); onClose() }} style={{ flex:2, padding:'14px 0', borderRadius:100, border:'none', background:S.white, color:S.bg, fontSize:14, fontWeight:700, cursor:'pointer' }}>Применить</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cart Tab ──────────────────────────────────────────────────────────────────
function CartTab({ onOrder, products }: { onOrder: () => void; products: Product[] }) {
  const [items, setItems] = useState<CartItem[]>([])
  useEffect(() => {
    const upd = () => setItems(getCart())
    upd(); window.addEventListener('cart-updated', upd)
    return () => window.removeEventListener('cart-updated', upd)
  }, [])

  const rows = items.map(i => ({ ...i, product: products.find(p => p.id === i.id)! })).filter(r => r.product)
  const total = rows.reduce((s, r) => s + r.product.price * r.qty, 0)

  const update = (id: number, size: string, qty: number) => {
    const next = qty <= 0 ? items.filter(i => !(i.id===id && i.size===size)) : items.map(i => i.id===id && i.size===size ? {...i,qty} : i)
    setItems(next); saveCart(next)
  }

  if (rows.length === 0) return (
    <div style={{ padding:'20px 18px' }}>
      <div style={{ fontSize:17, fontWeight:700, marginBottom:28, letterSpacing:'-0.01em' }}>Корзина</div>
      <div style={{ textAlign:'center', padding:'72px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:S.card2, border:'0.5px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <ShoppingBag size={26} color={S.dgrey} strokeWidth={1.5}/>
        </div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>Корзина пуста</div>
        <div style={{ fontSize:12, color:S.grey }}>Добавляй товары из каталога</div>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'20px 18px' }}>
      <div style={{ fontSize:17, fontWeight:700, marginBottom:24, letterSpacing:'-0.01em' }}>Корзина</div>
      <div style={{ marginBottom:24 }}>
        {rows.map((r, idx) => (
          <div key={`${r.id}-${r.size}`} style={{ display:'flex', gap:14, padding:'16px 0', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width:72, height:88, borderRadius:12, overflow:'hidden', flexShrink:0, background:S.card2, border:'0.5px solid rgba(255,255,255,0.05)' }}>
              {r.product.images[0]
                ? <img src={r.product.images[0]} alt={r.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{CAT_ICON[r.product.category]}</div>
              }
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:3, lineHeight:1.35 }}>{r.product.name}</div>
                <div style={{ fontSize:11, color:S.grey }}>Размер: {r.size}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:15, fontWeight:700 }}>{(r.product.price*r.qty).toLocaleString('ru-RU')} ₽</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={() => update(r.id,r.size,r.qty-1)} style={{ width:28, height:28, borderRadius:8, background:S.card2, border:'0.5px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Minus size={11} color='rgba(255,255,255,0.65)' strokeWidth={1.5}/>
                  </button>
                  <span style={{ fontSize:14, fontWeight:600, minWidth:14, textAlign:'center' }}>{r.qty}</span>
                  <button onClick={() => update(r.id,r.size,r.qty+1)} style={{ width:28, height:28, borderRadius:8, background:S.card2, border:'0.5px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Plus size={11} color='rgba(255,255,255,0.65)' strokeWidth={1.5}/>
                  </button>
                  <button onClick={() => update(r.id,r.size,0)} style={{ background:'none', border:'none', cursor:'pointer', padding:'0 4px' }}>
                    <Trash2 size={14} color={S.dgrey} strokeWidth={1.5}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}/>
      </div>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:13, color:S.grey }}>Товаров</span>
          <span style={{ fontSize:13, color:S.grey }}>{rows.reduce((s,r)=>s+r.qty,0)} шт.</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:15, color:'rgba(255,255,255,0.6)' }}>Итого</span>
          <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em' }}>{total.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>
      <button onClick={onOrder} style={{ width:'100%', padding:'16px 0', borderRadius:100, border:'none', background:S.white, color:S.bg, fontSize:15, fontWeight:700, cursor:'pointer', letterSpacing:'0.02em' }}>
        Оформить заказ
      </button>
    </div>
  )
}

// ── Order Modal ───────────────────────────────────────────────────────────────
function OrderModal({ onClose, onSuccess, products }: { onClose: () => void; onSuccess: () => void; products: Product[] }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [delivery, setDelivery] = useState('СДЭК')
  const [address, setAddress] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const items = getCart().map(i => ({ ...i, product: products.find(p => p.id===i.id)! })).filter(i=>i.product)
  const total = items.reduce((s,i) => s + i.product.price*i.qty, 0)

  const DELIVERIES = [
    { id: 'СДЭК', label: 'СДЭК', sub: 'До двери или ПВЗ', Icon: Package },
    { id: 'Яндекс Доставка', label: 'Яндекс', sub: 'Курьер до двери', Icon: Truck },
    { id: 'Почта России', label: 'Почта России', sub: 'Доставка почтой', Icon: Mail },
    { id: 'Самовывоз (Москва)', label: 'Самовывоз', sub: 'Москва, адрес в чате', Icon: MapPin },
  ]

  const send = () => {
    if (!name || !phone) return
    const list = items.map(i => `• ${i.product.name} (${i.size}) x${i.qty} — ${(i.product.price*i.qty).toLocaleString('ru-RU')}₽`).join('\n')
    const msg = `🛍 Новый заказ MITHREAL\n\n👤 ${name}\n📞 ${phone}\n📦 ${delivery}${address?'\n📍 '+address:''}\n\n${list}\n\n💰 Итого: ${total.toLocaleString('ru-RU')}₽`
    window.open(`https://t.me/xapsu?text=${encodeURIComponent(msg)}`, '_blank')
    onSuccess()
  }

  const inputSt = (key: string): React.CSSProperties => ({
    width:'100%', padding:'14px 16px', borderRadius:14,
    border:`0.5px solid ${focused===key ? 'rgba(201,169,110,0.55)' : 'rgba(255,255,255,0.09)'}`,
    background: focused===key ? 'rgba(201,169,110,0.04)' : S.card2,
    color:S.white, fontSize:15, outline:'none',
    transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)', boxSizing:'border-box',
  })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ background:S.card, borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'96vh', overflowY:'auto', border:'0.5px solid rgba(255,255,255,0.08)', borderBottom:'none' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 2px' }}>
          <div style={{ width:36, height:3, borderRadius:2, background:S.dgrey }}/>
        </div>
        <div style={{ padding:'16px 18px 52px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>Оформление</div>
              <div style={{ fontSize:12, color:S.grey }}>{items.reduce((s,i)=>s+i.qty,0)} шт. · {total.toLocaleString('ru-RU')} ₽</div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:S.card2, border:'0.5px solid rgba(255,255,255,0.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <X size={15} color='rgba(255,255,255,0.55)' strokeWidth={1.5}/>
            </button>
          </div>

          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', marginBottom:12 }}>ПОЛУЧАТЕЛЬ</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Имя" onFocus={()=>setFocused('name')} onBlur={()=>setFocused(null)} style={inputSt('name')}/>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" type="tel" onFocus={()=>setFocused('phone')} onBlur={()=>setFocused(null)} style={inputSt('phone')}/>
            </div>
          </div>

          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, color:S.grey, letterSpacing:'0.2em', marginBottom:12 }}>ДОСТАВКА</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {DELIVERIES.map(({ id, label, sub, Icon }) => {
                const active = delivery === id
                return (
                  <button key={id} onClick={() => setDelivery(id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 14px', borderRadius:14, cursor:'pointer', textAlign:'left', border:`0.5px solid ${active ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.07)'}`, background: active ? 'rgba(201,169,110,0.06)' : 'transparent', transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)' }}>
                    <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: active ? 'rgba(201,169,110,0.1)' : S.card2, border:`0.5px solid ${active ? 'rgba(201,169,110,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                      <Icon size={17} color={active ? S.gold : S.grey} strokeWidth={1.5}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color: active ? S.white : 'rgba(255,255,255,0.5)', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:11, color:S.grey }}>{sub}</div>
                    </div>
                    <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, border:`1.5px solid ${active ? S.gold : 'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {active && <div style={{ width:8, height:8, borderRadius:'50%', background:S.gold }}/>}
                    </div>
                  </button>
                )
              })}
            </div>
            {delivery !== 'Самовывоз (Москва)' && (
              <div style={{ marginTop:10 }}>
                <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Адрес доставки" onFocus={()=>setFocused('address')} onBlur={()=>setFocused(null)} style={inputSt('address')}/>
              </div>
            )}
          </div>

          <div style={{ background:S.card2, borderRadius:16, overflow:'hidden', marginBottom:24, border:'0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding:'14px 16px 10px', fontSize:10, color:S.grey, letterSpacing:'0.2em' }}>ВАШ ЗАКАЗ</div>
            {items.map((i, idx) => (
              <div key={`${i.id}-${i.size}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderTop: idx > 0 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width:44, height:54, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#111' }}>
                  {i.product.images?.[0] ? <img src={i.product.images[0]} alt={i.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{CAT_ICON[i.product.category]}</div>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.product.name}</div>
                  <div style={{ fontSize:11, color:S.grey, marginTop:2 }}>{i.size}{i.qty > 1 ? ` · ${i.qty} шт.` : ''}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, flexShrink:0 }}>{(i.product.price*i.qty).toLocaleString('ru-RU')} ₽</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:'0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:13, color:S.grey }}>Итого</span>
              <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.01em' }}>{total.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <button onClick={send} disabled={!name||!phone} style={{ width:'100%', padding:'17px 0', borderRadius:100, border:'none', background: name&&phone ? S.white : S.card2, color: name&&phone ? S.bg : S.grey, fontSize:15, fontWeight:800, cursor: name&&phone ? 'pointer' : 'default', transition:'all 0.25s cubic-bezier(0.32,0.72,0,1)', letterSpacing:'0.02em' }}>
            Отправить заказ
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onOpen, wished, onWishlist }: { product: Product; onOpen: () => void; wished: boolean; onWishlist: () => void }) {
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{ cursor:'pointer' }} onClick={onOpen}>
      <div style={{ position:'relative', aspectRatio:'3/4', background:S.card2, borderRadius:16, overflow:'hidden', marginBottom:11, transform: pressed ? 'scale(0.97)' : 'scale(1)', transition:'transform 0.18s cubic-bezier(0.32,0.72,0,1)', border:'0.5px solid rgba(255,255,255,0.05)' }}
        onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}>
        {product.images[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>{CAT_ICON[product.category] ?? '🏷️'}</div>
        }
        <div aria-hidden style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.3) 100%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:5 }}>
          {product.isNew && <span style={{ background:'rgba(6,6,6,0.7)', backdropFilter:'blur(8px)', border:'0.5px solid rgba(255,255,255,0.18)', color:S.white, fontSize:8, fontWeight:800, padding:'3px 8px', borderRadius:4, letterSpacing:'0.12em' }}>NEW</span>}
          {product.stock === 1 && <span style={{ background:'rgba(201,169,110,0.14)', backdropFilter:'blur(8px)', border:'0.5px solid rgba(201,169,110,0.4)', color:S.gold, fontSize:8, fontWeight:800, padding:'3px 8px', borderRadius:4, letterSpacing:'0.12em' }}>LAST</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); onWishlist() }} style={{ position:'absolute', top:10, right:10, width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(12px)', border:'0.5px solid rgba(255,255,255,0.12)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Heart size={13} fill={wished ? S.red : 'none'} color={wished ? S.red : 'rgba(255,255,255,0.75)'} strokeWidth={1.5}/>
        </button>
      </div>
      <div>
        <div style={{ fontSize:9, color:S.grey, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:5 }}>{CAT_LABEL[product.category]}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:1.4, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>{product.name}</div>
        <div style={{ fontSize:15, fontWeight:700, color:S.white, letterSpacing:'-0.01em' }}>{product.price.toLocaleString('ru-RU')} ₽</div>
      </div>
    </div>
  )
}

// ── Wishlist Tab ──────────────────────────────────────────────────────────────
function WishlistTab({ onOpen, allProducts }: { onOpen: (p: Product) => void; allProducts: Product[] }) {
  const [ids, setIds] = useState<number[]>([])
  useEffect(() => {
    const upd = () => setIds(getWishlist())
    upd(); window.addEventListener('wishlist-updated', upd)
    return () => window.removeEventListener('wishlist-updated', upd)
  }, [])
  const products = allProducts.filter(p => ids.includes(p.id))
  const [localWl, setLocalWl] = useState<number[]>([])
  useEffect(() => { setLocalWl(getWishlist()) }, [ids])
  const toggle = (id: number) => { const wl = getWishlist(); const next = wl.includes(id) ? wl.filter(i=>i!==id) : [...wl, id]; saveWishlist(next) }

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontSize:17, fontWeight:700, marginBottom:24, letterSpacing:'-0.01em' }}>Избранное</div>
      {products.length === 0 ? (
        <div style={{ textAlign:'center', padding:'72px 0' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:S.card2, border:'0.5px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Heart size={26} color={S.dgrey} strokeWidth={1.5}/>
          </div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>Пусто</div>
          <div style={{ fontSize:12, color:S.grey }}>Сохраняй понравившиеся вещи</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {products.map(p => <ProductCard key={p.id} product={p} onOpen={() => onOpen(p)} wished={localWl.includes(p.id)} onWishlist={() => toggle(p.id)}/>)}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('catalog')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [sizeFilter, setSizeFilter] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [showOrder, setShowOrder] = useState(false)
  const [showSizeFilter, setShowSizeFilter] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [toast, setToast] = useState('')
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const refreshCart = useCallback(() => setCartCount(getCart().reduce((s,i) => s+i.qty, 0)), [])
  const refreshWishlist = useCallback(() => setWishlist(getWishlist()), [])

  useEffect(() => {
    refreshCart(); refreshWishlist()
    window.addEventListener('cart-updated', refreshCart)
    window.addEventListener('wishlist-updated', refreshWishlist)
    return () => { window.removeEventListener('cart-updated', refreshCart); window.removeEventListener('wishlist-updated', refreshWishlist) }
  }, [refreshCart, refreshWishlist])

  useEffect(() => {
    supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      const supabaseItems: Product[] = (data || []).map(p => ({ ...p, isNew: p.is_new }))
      const supabaseIds = new Set(supabaseItems.map(p => p.id))
      const merged = [...supabaseItems, ...DEMO_PRODUCTS.filter(p => !supabaseIds.has(p.id))]
      setDbProducts(merged)
      setLoadingProducts(false)
    })
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const toggleWishlist = (id: number) => {
    const wl = getWishlist()
    const next = wl.includes(id) ? wl.filter(i=>i!==id) : [...wl, id]
    saveWishlist(next); setWishlist(next)
    showToast(wl.includes(id) ? 'Удалено из избранного' : '❤️ В избранном')
  }

  const filtered = useMemo(() => {
    let res = dbProducts.filter(p => {
      const matchCat = category === 'all' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchSize = sizeFilter.length === 0 || p.sizes.some(s => sizeFilter.includes(s))
      return matchCat && matchSearch && matchSize
    })
    if (sort === 'new') res = [...res].sort((a,b) => (b.isNew?1:0)-(a.isNew?1:0))
    else if (sort === 'price_asc') res = [...res].sort((a,b) => a.price-b.price)
    else if (sort === 'price_desc') res = [...res].sort((a,b) => b.price-a.price)
    return res
  }, [dbProducts, category, search, sizeFilter, sort])

  const SORT_LABELS: Record<SortKey,string> = { default:'По умолчанию', new:'Новинки', price_asc:'Дешевле', price_desc:'Дороже' }
  const hasFilters = sizeFilter.length > 0 || sort !== 'default'

  return (
    <div style={{ background:S.bg, minHeight:'100vh', color:S.white, paddingBottom:88 }}>

      {/* ── Header ── */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,6,6,0.9)', backdropFilter:'blur(20px)', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
        {showSearch ? (
          <div style={{ padding:'12px 18px', display:'flex', alignItems:'center', gap:12 }}>
            <Search size={15} color={S.grey} strokeWidth={1.5}/>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." style={{ flex:1, background:'none', border:'none', outline:'none', color:S.white, fontSize:15 }}/>
            <button onClick={() => { setShowSearch(false); setSearch('') }} style={{ background:'none', border:'none', cursor:'pointer', color:S.grey, fontSize:13, padding:'4px 8px' }}>Отмена</button>
          </div>
        ) : (
          <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={() => setShowSearch(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
              <Search size={18} color='rgba(255,255,255,0.4)' strokeWidth={1.5}/>
            </button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, letterSpacing:'0.22em', lineHeight:1 }}>SHOP</div>
              <div style={{ fontSize:7, letterSpacing:'0.4em', color:S.gold, marginTop:3, fontWeight:500 }}>МИНИ-ШОП</div>
            </div>
            <div style={{ width:26 }}/>
          </div>
        )}

        {/* Category pills */}
        {tab === 'catalog' && !showSearch && (
          <div style={{ display:'flex', gap:8, padding:'0 16px 14px', overflowX:'auto' }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.id
              return (
                <button key={cat.id} onClick={() => { setCategory(cat.id); setSizeFilter([]) }} style={{ flexShrink:0, padding:'7px 16px', borderRadius:100, border:`0.5px solid ${active ? 'rgba(201,169,110,0.55)' : 'rgba(255,255,255,0.09)'}`, background: active ? 'rgba(201,169,110,0.1)' : 'transparent', color: active ? S.gold : S.grey, fontSize:12, fontWeight: active ? 600 : 400, cursor:'pointer', letterSpacing:'0.02em', transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)' }}>
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Catalog ── */}
      {tab === 'catalog' && (
        <>
          {/* Marquee ticker */}
          <div style={{ overflow:'hidden', padding:'9px 0', borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display:'flex', whiteSpace:'nowrap', animation:'marquee-shop 20s linear infinite' }}>
              {[TICKER, TICKER].map((t, i) => (
                <span key={i} style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color: i === 0 ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.2)', flexShrink:0 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Filter row */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', overflowX:'auto' }}>
            <button onClick={() => setShowSizeFilter(true)} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:100, border:`0.5px solid ${sizeFilter.length > 0 ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.09)'}`, background: sizeFilter.length > 0 ? 'rgba(201,169,110,0.08)' : 'transparent', color: sizeFilter.length > 0 ? S.gold : S.grey, fontSize:12, fontWeight:500, cursor:'pointer' }}>
              <SlidersHorizontal size={11} strokeWidth={1.5}/>
              {sizeFilter.length > 0 ? `Размер · ${sizeFilter.length}` : 'Размер'}
            </button>

            <div style={{ position:'relative', flexShrink:0 }}>
              <button onClick={() => setShowSort(!showSort)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:100, border:`0.5px solid ${sort !== 'default' ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.09)'}`, background: sort !== 'default' ? 'rgba(201,169,110,0.08)' : 'transparent', color: sort !== 'default' ? S.gold : S.grey, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                <ArrowUpDown size={11} strokeWidth={1.5}/>{SORT_LABELS[sort]}
              </button>
              {showSort && (
                <div style={{ position:'absolute', top:'110%', left:0, background:S.card2, border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden', zIndex:20, minWidth:165, boxShadow:'0 16px 48px rgba(0,0,0,0.9)' }}>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                    <button key={key} onClick={() => { setSort(key); setShowSort(false) }} style={{ display:'block', width:'100%', padding:'13px 16px', textAlign:'left', background: sort===key ? 'rgba(201,169,110,0.08)' : 'transparent', border:'none', borderBottom:'0.5px solid rgba(255,255,255,0.04)', color: sort===key ? S.gold : 'rgba(255,255,255,0.45)', fontSize:13, cursor:'pointer', fontWeight: sort===key ? 600 : 400 }}>{SORT_LABELS[key]}</button>
                  ))}
                </div>
              )}
            </div>

            {hasFilters && (
              <button onClick={() => { setSizeFilter([]); setSort('default') }} style={{ background:'none', border:'none', cursor:'pointer', color:S.dgrey, fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                <X size={11} strokeWidth={1.5}/>Сбросить
              </button>
            )}
            <div style={{ marginLeft:'auto', flexShrink:0, fontSize:11, color:S.dgrey }}>{filtered.length} шт.</div>
          </div>

          {/* Grid */}
          {loadingProducts ? (
            <div style={{ padding:'80px 0', textAlign:'center', color:S.grey, fontSize:13 }}>Загружаем товары...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'80px 16px', textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:S.card2, border:'0.5px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                <Package size={26} color={S.dgrey} strokeWidth={1.5}/>
              </div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.4)' }}>
                {dbProducts.length === 0 ? 'Товары ещё не добавлены' : 'Ничего не найдено'}
              </div>
            </div>
          ) : (
            <div style={{ padding:'18px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onOpen={() => router.push(`/product/${p.id}`)} wished={wishlist.includes(p.id)} onWishlist={() => toggleWishlist(p.id)}/>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'wishlist' && <WishlistTab onOpen={p => router.push(`/product/${p.id}`)} allProducts={dbProducts}/>}
      {tab === 'cart' && <CartTab onOrder={() => setShowOrder(true)} products={dbProducts}/>}

      {/* ── Floating Bottom Nav ── */}
      <div style={{ position:'fixed', bottom:14, left:14, right:14, background:'rgba(10,10,10,0.95)', backdropFilter:'blur(24px)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:100, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', zIndex:40, boxShadow:'0 8px 40px rgba(0,0,0,0.8)' }}>
        {([
          { key:'catalog', label:'Каталог', icon: (active: boolean) => <Package size={18} color={active ? S.gold : 'rgba(255,255,255,0.3)'} strokeWidth={1.5}/> },
          { key:'wishlist', label:'Избранное', icon: (active: boolean) => <Heart size={18} fill={active ? S.red : 'none'} color={active ? S.red : 'rgba(255,255,255,0.3)'} strokeWidth={1.5}/> },
          { key:'cart', label:'Корзина', icon: (active: boolean) => (
            <div style={{ position:'relative', display:'inline-flex' }}>
              <ShoppingBag size={18} color={active ? S.gold : 'rgba(255,255,255,0.3)'} strokeWidth={1.5}/>
              {cartCount > 0 && <div style={{ position:'absolute', top:-6, right:-7, width:15, height:15, borderRadius:'50%', background:S.red, fontSize:8, fontWeight:800, color:S.white, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</div>}
            </div>
          )},
        ] as { key: string; label: string; icon: (a: boolean) => React.ReactNode }[]).map(item => (
          <button key={item.key} onClick={() => setTab(item.key as Tab)} style={{ padding:'11px 0 9px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            {item.icon(tab === item.key)}
            <span style={{ fontSize:9, letterSpacing:'0.04em', color: tab===item.key ? S.gold : 'rgba(255,255,255,0.28)', fontWeight: tab===item.key ? 600 : 400 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:86, left:'50%', transform:'translateX(-50%)', background:S.card2, color:S.white, padding:'10px 22px', borderRadius:100, fontSize:13, fontWeight:500, zIndex:300, whiteSpace:'nowrap', border:'0.5px solid rgba(255,255,255,0.1)', boxShadow:'0 8px 32px rgba(0,0,0,0.8)', animation:'toast-in 0.25s cubic-bezier(0.32,0.72,0,1)' }}>
          {toast}
        </div>
      )}

      {/* ── Modals ── */}
      {showSizeFilter && <SizeFilterModal selected={sizeFilter} category={category} onApply={s=>{setSizeFilter(s);setShowSizeFilter(false)}} onClose={()=>setShowSizeFilter(false)} products={dbProducts}/>}
      {showOrder && <OrderModal onClose={()=>setShowOrder(false)} onSuccess={()=>{setShowOrder(false);saveCart([]);refreshCart();showToast('✓ Заказ отправлен!')}} products={dbProducts}/>}
    </div>
  )
}
