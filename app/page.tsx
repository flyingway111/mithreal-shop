'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Heart, Search, X, Plus, Minus, SlidersHorizontal, Trash2, ArrowUpDown, Package, Truck, Mail, MapPin } from 'lucide-react'
import { CATEGORIES, type Product } from './data/products'
import { supabase } from './lib/supabase'

const S = {
  bg: '#0A0A0A', card: '#131313', card2: '#1C1C1C',
  border: '#252525', white: '#FFFFFF', grey: '#666',
  red: '#E53935', amber: '#F59E0B', green: '#22C55E',
}

type CartItem = { id: number; size: string; qty: number }
type SortKey = 'default' | 'new' | 'price_asc' | 'price_desc'
type Tab = 'catalog' | 'wishlist' | 'cart'

const getCart = (): CartItem[] => JSON.parse(localStorage.getItem('mithreal-cart') || '[]')
const getWishlist = (): number[] => JSON.parse(localStorage.getItem('mithreal-wishlist') || '[]')
const saveCart = (c: CartItem[]) => { localStorage.setItem('mithreal-cart', JSON.stringify(c)); window.dispatchEvent(new Event('cart-updated')) }
const saveWishlist = (w: number[]) => { localStorage.setItem('mithreal-wishlist', JSON.stringify(w)); window.dispatchEvent(new Event('wishlist-updated')) }

const CAT_LABEL: Record<string, string> = { tshirts: 'Футболка', kofty: 'Кофта', sneakers: 'Кроссовки' }
const CAT_ICON: Record<string, string> = { tshirts: '👕', kofty: '🧥', sneakers: '👟' }
const CLOTHING_SIZES = ['XS','S','M','L','XL','XXL']
const SHOE_SIZES = ['38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45']

// ── Size Filter ───────────────────────────────────────────────────────────────
function SizeFilterModal({ selected, category, onApply, onClose, products }: {
  selected: string[]; category: string; onApply: (s: string[]) => void; onClose: () => void; products: Product[]
}) {
  const [picked, setPicked] = useState<string[]>(selected)
  const isShoes = category === 'sneakers'
  const isClothing = ['tshirts','kofty'].includes(category)
  const pool = isShoes ? SHOE_SIZES : isClothing ? CLOTHING_SIZES
    : [...new Set(products.flatMap(p => p.sizes))]
  const sizes = pool.filter(s => products.some(p =>
    (category === 'all' || p.category === category) && p.sizes.includes(s)
  ))
  const toggle = (s: string) => setPicked(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:150, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ background:S.card, borderRadius:'20px 20px 0 0', width:'100%', maxHeight:'70vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 18px 36px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:700 }}>Размер</div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} color={S.white}/></button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
            {sizes.map(s => (
              <button key={s} onClick={() => toggle(s)} style={{
                padding:'10px 16px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer',
                border:`1px solid ${picked.includes(s) ? S.white : S.border}`,
                background: picked.includes(s) ? S.white : 'transparent',
                color: picked.includes(s) ? S.bg : S.white,
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setPicked([]); onApply([]) }} style={{ flex:1, padding:'13px 0', borderRadius:12, border:`1px solid ${S.border}`, background:'transparent', color:S.white, fontSize:14, fontWeight:600, cursor:'pointer' }}>Сбросить</button>
            <button onClick={() => { onApply(picked); onClose() }} style={{ flex:2, padding:'13px 0', borderRadius:12, border:'none', background:S.white, color:S.bg, fontSize:14, fontWeight:700, cursor:'pointer' }}>Применить</button>
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
    const next = qty <= 0 ? items.filter(i => !(i.id===id && i.size===size))
      : items.map(i => i.id===id && i.size===size ? {...i,qty} : i)
    setItems(next); saveCart(next)
  }

  return (
    <div style={{ padding:'20px 16px 20px' }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Корзина</div>
      {rows.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:S.grey }}>
          <ShoppingBag size={48} color={S.border} style={{ margin:'0 auto 16px', display:'block' }}/>
          <div style={{ fontSize:15 }}>Корзина пуста</div>
          <div style={{ fontSize:12, marginTop:6, color:'#444' }}>Добавляй товары из каталога</div>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
            {rows.map(r => (
              <div key={`${r.id}-${r.size}`} style={{ display:'flex', gap:12, background:S.card2, borderRadius:14, padding:12 }}>
                <div style={{ width:72, height:88, borderRadius:10, background:'#111', overflow:'hidden', flexShrink:0, position:'relative' }}>
                  <img src={r.product.images[0]} alt={r.product.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.4)' }}/>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{CAT_ICON[r.product.category]}</div>
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:2, lineHeight:1.3 }}>{r.product.name}</div>
                    <div style={{ fontSize:11, color:S.grey }}>Размер: {r.size}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>{(r.product.price*r.qty).toLocaleString('ru-RU')}₽</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={() => update(r.id,r.size,r.qty-1)} style={{ width:28, height:28, borderRadius:8, background:S.border, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={12} color={S.white}/></button>
                      <span style={{ fontSize:14, fontWeight:600, minWidth:14, textAlign:'center' }}>{r.qty}</span>
                      <button onClick={() => update(r.id,r.size,r.qty+1)} style={{ width:28, height:28, borderRadius:8, background:S.border, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={12} color={S.white}/></button>
                      <button onClick={() => update(r.id,r.size,0)} style={{ background:'none', border:'none', cursor:'pointer', padding:'0 2px' }}><Trash2 size={14} color={S.red}/></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:S.card2, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:S.grey, marginBottom:8 }}>
              <span>Товаров</span><span>{rows.reduce((s,r)=>s+r.qty,0)} шт.</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:17, fontWeight:700 }}>
              <span>Итого</span><span>{total.toLocaleString('ru-RU')}₽</span>
            </div>
          </div>

          <button onClick={onOrder} style={{ width:'100%', padding:'16px 0', borderRadius:14, border:'none', background:S.white, color:S.bg, fontSize:15, fontWeight:700, cursor:'pointer', letterSpacing:'0.02em' }}>
            Оформить заказ
          </button>
        </>
      )}
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
    { id: 'СДЭК',              label: 'СДЭК',          sub: 'До двери или ПВЗ',   Icon: Package },
    { id: 'Яндекс Доставка',   label: 'Яндекс',        sub: 'Курьер до двери',    Icon: Truck   },
    { id: 'Почта России',      label: 'Почта России',  sub: 'Доставка почтой',    Icon: Mail    },
    { id: 'Самовывоз (Москва)',label: 'Самовывоз',     sub: 'Москва, адрес в чате', Icon: MapPin },
  ]

  const send = () => {
    if (!name || !phone) return
    const list = items.map(i => `• ${i.product.name} (${i.size}) x${i.qty} — ${(i.product.price*i.qty).toLocaleString('ru-RU')}₽`).join('\n')
    const msg = `🛍 Новый заказ SHOP\n\n👤 ${name}\n📞 ${phone}\n📦 ${delivery}${address?'\n📍 '+address:''}\n\n${list}\n\n💰 Итого: ${total.toLocaleString('ru-RU')}₽`
    window.open(`https://t.me/xapsu?text=${encodeURIComponent(msg)}`, '_blank')
    onSuccess()
  }

  const inputSt = (key: string): React.CSSProperties => ({
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1.5px solid ${focused === key ? S.white : S.border}`,
    background: S.bg, color: S.white, fontSize: 15, outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ background:S.card, borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'94vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 2px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:S.border }}/>
        </div>

        <div style={{ padding:'16px 18px 52px' }}>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:'0.01em' }}>Оформление</div>
              <div style={{ fontSize:12, color:S.grey, marginTop:3 }}>
                {items.reduce((s,i)=>s+i.qty,0)} {items.reduce((s,i)=>s+i.qty,0) === 1 ? 'товар' : 'товара'} · {total.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:S.card2, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <X size={16} color={S.white}/>
            </button>
          </div>

          {/* CONTACTS */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, color:S.grey, letterSpacing:'0.15em', marginBottom:12 }}>ПОЛУЧАТЕЛЬ</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Имя"
                onFocus={()=>setFocused('name')} onBlur={()=>setFocused(null)} style={inputSt('name')}/>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" type="tel"
                onFocus={()=>setFocused('phone')} onBlur={()=>setFocused(null)} style={inputSt('phone')}/>
            </div>
          </div>

          {/* DELIVERY */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, color:S.grey, letterSpacing:'0.15em', marginBottom:12 }}>ДОСТАВКА</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {DELIVERIES.map(({ id, label, sub, Icon }) => {
                const active = delivery === id
                return (
                  <button key={id} onClick={() => setDelivery(id)} style={{
                    display:'flex', alignItems:'center', gap:14, padding:'13px 14px', borderRadius:14, cursor:'pointer', textAlign:'left',
                    border: `1.5px solid ${active ? S.white : S.border}`,
                    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                    transition:'all 0.15s',
                  }}>
                    <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                      background: active ? 'rgba(255,255,255,0.12)' : S.card2 }}>
                      <Icon size={18} color={active ? S.white : S.grey}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color: active ? S.white : '#bbb', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:11, color:S.grey }}>{sub}</div>
                    </div>
                    <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, border:`2px solid ${active ? S.white : S.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {active && <div style={{ width:8, height:8, borderRadius:'50%', background:S.white }}/>}
                    </div>
                  </button>
                )
              })}
            </div>
            {delivery !== 'Самовывоз (Москва)' && (
              <div style={{ marginTop:10 }}>
                <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Адрес доставки"
                  onFocus={()=>setFocused('address')} onBlur={()=>setFocused(null)} style={inputSt('address')}/>
              </div>
            )}
          </div>

          {/* ORDER ITEMS */}
          <div style={{ background:S.card2, borderRadius:16, overflow:'hidden', marginBottom:22 }}>
            <div style={{ padding:'14px 16px 10px', fontSize:11, color:S.grey, letterSpacing:'0.15em' }}>ВАШ ЗАКАЗ</div>
            {items.map((i, idx) => (
              <div key={`${i.id}-${i.size}`} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
                borderTop: idx > 0 ? `1px solid rgba(255,255,255,0.05)` : 'none',
              }}>
                <div style={{ width:44, height:54, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#111' }}>
                  {i.product.images?.[0]
                    ? <img src={i.product.images[0]} alt={i.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{CAT_ICON[i.product.category]}</div>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.product.name}</div>
                  <div style={{ fontSize:11, color:S.grey, marginTop:2 }}>
                    {i.size}{i.qty > 1 ? ` · ${i.qty} шт.` : ''}
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, flexShrink:0 }}>{(i.product.price*i.qty).toLocaleString('ru-RU')} ₽</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:`1px solid rgba(255,255,255,0.08)` }}>
              <span style={{ fontSize:13, color:S.grey }}>Итого</span>
              <span style={{ fontSize:18, fontWeight:800 }}>{total.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* CTA */}
          <button onClick={send} disabled={!name||!phone} style={{
            width:'100%', padding:'17px 0', borderRadius:14, border:'none',
            background: name&&phone ? S.white : S.border,
            color: name&&phone ? S.bg : S.grey,
            fontSize:15, fontWeight:800, cursor: name&&phone ? 'pointer' : 'default',
            transition:'all 0.2s', letterSpacing:'0.03em',
          }}>
            Отправить заказ
          </button>
        </div>
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

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Избранное</div>
      {products.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:S.grey }}>
          <Heart size={48} color={S.border} style={{ margin:'0 auto 16px', display:'block' }}/>
          <div style={{ fontSize:15 }}>Пусто</div>
          <div style={{ fontSize:12, marginTop:6, color:'#444' }}>Сохраняй понравившиеся вещи</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {products.map(p => (
            <div key={p.id} onClick={() => onOpen(p)} style={{ background:S.card, borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
              <div style={{ position:'relative', aspectRatio:'4/5', background:'#111' }}>
                <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35)' }}/>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <div style={{ fontSize:34 }}>{CAT_ICON[p.category]}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:S.white }}>{CAT_LABEL[p.category]}</div>
                </div>
                {p.isNew && <div style={{ position:'absolute', top:8, left:8, background:S.white, color:S.bg, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>NEW</div>}
              </div>
              <div style={{ padding:'10px 12px 14px' }}>
                <div style={{ fontSize:13, color:S.grey, marginBottom:2 }}>{p.name}</div>
                <div style={{ fontSize:15, fontWeight:700 }}>{p.price.toLocaleString('ru-RU')}₽</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onOpen, wished, onWishlist }: {
  product: Product; onOpen: () => void; wished: boolean; onWishlist: () => void
}) {
  return (
    <div style={{ background:S.card, borderRadius:14, overflow:'hidden', cursor:'pointer', position:'relative' }} onClick={onOpen}>
      <div style={{ position:'relative', aspectRatio:'3/4', background:'#0f0f0f' }}>
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        ) : (
          <>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:44, lineHeight:1 }}>{CAT_ICON[product.category] ?? '🏷️'}</div>
            </div>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:'0.04em' }}>
                {CAT_LABEL[product.category] ?? ''}
              </div>
            </div>
          </>
        )}

        {/* Top row badges */}
        <div style={{ position:'absolute', top:8, left:8, display:'flex', gap:4 }}>
          {product.isNew && <div style={{ background:S.white, color:S.bg, fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4 }}>NEW</div>}
          {product.stock === 1 && <div style={{ background:S.amber, color:'#000', fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4 }}>LAST</div>}
        </div>

        {/* Wishlist */}
        <button onClick={e => { e.stopPropagation(); onWishlist() }} style={{
          position:'absolute', top:8, right:8, width:32, height:32, borderRadius:'50%',
          background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(4px)',
        }}>
          <Heart size={14} fill={wished ? S.red : 'none'} color={wished ? S.red : 'rgba(255,255,255,0.7)'}/>
        </button>
      </div>

      {/* Price bottom */}
      <div style={{ padding:'10px 12px 14px' }}>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{product.name}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>{product.price.toLocaleString('ru-RU')}₽</div>
          <div style={{ fontSize:11, color:S.grey }}>{product.sizes.slice(0,3).join(' · ')}{product.sizes.length > 3 ? '...' : ''}</div>
        </div>
      </div>
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
      if (data && data.length > 0) {
        setDbProducts(data.map(p => ({ ...p, isNew: p.is_new })))
      }
      setLoadingProducts(false)
    })
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

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
    <div style={{ background:S.bg, minHeight:'100vh', color:S.white, paddingBottom:72 }}>

      {/* ── Header ── */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:S.bg, borderBottom:`1px solid ${S.border}` }}>

        {/* Search overlay */}
        {showSearch ? (
          <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Search size={16} color={S.grey}/>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Поиск..." style={{ flex:1, background:'none', border:'none', outline:'none', color:S.white, fontSize:15 }}/>
            <button onClick={() => { setShowSearch(false); setSearch('') }} style={{ background:'none', border:'none', cursor:'pointer', color:S.grey, fontSize:14 }}>Отмена</button>
          </div>
        ) : (
          <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={() => setShowSearch(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
              <Search size={20} color={S.grey}/>
            </button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:17, fontWeight:900, letterSpacing:'0.12em' }}>SHOP</div>
              <div style={{ fontSize:8, color:S.grey, letterSpacing:'0.3em', marginTop:-1 }}>STREETWEAR</div>
            </div>
            {/* placeholder for symmetry */}
            <div style={{ width:28 }}/>
          </div>
        )}

        {/* Categories — only in catalog */}
        {tab === 'catalog' && !showSearch && (
          <div style={{ display:'flex', gap:0, borderTop:`1px solid ${S.border}`, overflowX:'auto' }}>
            {CATEGORIES.map((cat,i) => (
              <button key={cat.id} onClick={() => { setCategory(cat.id); setSizeFilter([]) }} style={{
                flex:1, padding:'11px 8px', border:'none', borderBottom:`2px solid ${category===cat.id ? S.white : 'transparent'}`,
                background:'transparent', color:category===cat.id ? S.white : S.grey,
                fontSize:12, fontWeight:category===cat.id ? 700 : 400, cursor:'pointer',
                whiteSpace:'nowrap', transition:'all 0.15s',
                borderRight: i < CATEGORIES.length-1 ? `1px solid ${S.border}` : 'none',
              }}>{cat.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Catalog ── */}
      {tab === 'catalog' && (
        <>
          {/* Banner */}
          <div style={{ position:'relative', height:140, overflow:'hidden', background:'#0D0D0D', marginBottom:2 }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize:'28px 28px', opacity:0.03 }}/>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:46, fontWeight:900, letterSpacing:'0.14em', color:S.white, lineHeight:1 }}>SHOP</div>
              <div style={{ fontSize:10, letterSpacing:'0.45em', color:S.grey, marginTop:8 }}>STREETWEAR</div>
            </div>
          </div>

          {/* Filter row */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:`1px solid ${S.border}` }}>
            <button onClick={() => setShowSizeFilter(true)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:20,
              border:`1px solid ${sizeFilter.length>0 ? S.white : S.border}`,
              background:sizeFilter.length>0 ? 'rgba(255,255,255,0.08)' : 'transparent',
              color:sizeFilter.length>0 ? S.white : S.grey, fontSize:12, cursor:'pointer', fontWeight:sizeFilter.length>0?600:400,
            }}>
              <SlidersHorizontal size={12}/>
              {sizeFilter.length>0 ? `Размер · ${sizeFilter.length}` : 'Размер'}
            </button>

            <div style={{ position:'relative' }}>
              <button onClick={() => setShowSort(!showSort)} style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:20,
                border:`1px solid ${sort!=='default' ? S.white : S.border}`,
                background:sort!=='default'?'rgba(255,255,255,0.08)':'transparent',
                color:sort!=='default'?S.white:S.grey, fontSize:12, cursor:'pointer', fontWeight:sort!=='default'?600:400,
              }}>
                <ArrowUpDown size={12}/>{SORT_LABELS[sort]}
              </button>
              {showSort && (
                <div style={{ position:'absolute', top:'110%', left:0, background:S.card, border:`1px solid ${S.border}`, borderRadius:14, overflow:'hidden', zIndex:20, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                    <button key={key} onClick={() => { setSort(key); setShowSort(false) }} style={{ display:'block', width:'100%', padding:'13px 16px', textAlign:'left', background:sort===key?S.card2:'transparent', border:'none', color:sort===key?S.white:S.grey, fontSize:13, cursor:'pointer', fontWeight:sort===key?600:400 }}>{SORT_LABELS[key]}</button>
                  ))}
                </div>
              )}
            </div>

            {hasFilters && (
              <button onClick={() => { setSizeFilter([]); setSort('default') }} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:S.grey, fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                <X size={12}/>Сбросить
              </button>
            )}

            <div style={{ marginLeft: hasFilters ? 0 : 'auto', fontSize:11, color:S.grey }}>{filtered.length} шт.</div>
          </div>

          {/* Grid */}
          {loadingProducts ? (
            <div style={{ padding:'80px 0', textAlign:'center', color:S.grey }}>Загружаем товары...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'80px 0', textAlign:'center', color:S.grey }}>
              <Package size={48} color={S.border} style={{ margin:'0 auto 16px', display:'block' }}/>
              <div style={{ fontSize:15 }}>{dbProducts.length === 0 ? 'Товары ещё не добавлены' : 'Ничего не найдено'}</div>
            </div>
          ) : (
            <div style={{ padding:'14px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p}
                  onOpen={() => router.push(`/product/${p.id}`)}
                  wished={wishlist.includes(p.id)}
                  onWishlist={() => toggleWishlist(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'wishlist' && <WishlistTab onOpen={p => router.push(`/product/${p.id}`)} allProducts={dbProducts}/>}
      {tab === 'cart' && <CartTab onOrder={() => setShowOrder(true)} products={dbProducts}/>}

      {/* ── Bottom Nav ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:S.card, borderTop:`1px solid ${S.border}`, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', zIndex:40 }}>
        {([
          { key:'catalog', label:'Каталог', icon: (active: boolean) => <Package size={21} color={active?S.white:S.grey}/> },
          { key:'wishlist', label:'Избранное', icon: (active: boolean) => <Heart size={21} fill={active?S.red:'none'} color={active?S.red:S.grey}/> },
          { key:'cart',    label:'Корзина',   icon: (active: boolean) => (
            <div style={{ position:'relative', display:'inline-block' }}>
              <ShoppingBag size={21} color={active?S.white:S.grey}/>
              {cartCount>0 && <div style={{ position:'absolute', top:-6, right:-7, width:16, height:16, borderRadius:'50%', background:S.red, fontSize:9, fontWeight:700, color:S.white, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</div>}
            </div>
          )},
        ] as { key: string; label: string; icon: (active: boolean) => React.ReactNode }[]).map(item => (
          <button key={item.key} onClick={() => setTab(item.key as Tab)} style={{ padding:'10px 0 14px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            {item.icon(tab===item.key)}
            <span style={{ fontSize:10, color:tab===item.key?S.white:S.grey, fontWeight:tab===item.key?600:400 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', background:S.card2, color:S.white, padding:'10px 20px', borderRadius:24, fontSize:13, fontWeight:500, zIndex:300, whiteSpace:'nowrap', border:`1px solid ${S.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
          {toast}
        </div>
      )}

      {/* ── Modals ── */}
      {showSizeFilter && <SizeFilterModal selected={sizeFilter} category={category} onApply={s=>{setSizeFilter(s);setShowSizeFilter(false)}} onClose={() => setShowSizeFilter(false)} products={dbProducts}/>}
      {showOrder && <OrderModal onClose={() => setShowOrder(false)} onSuccess={() => { setShowOrder(false); saveCart([]); refreshCart(); showToast('✓ Заказ отправлен!') }} products={dbProducts}/>}
    </div>
  )
}
