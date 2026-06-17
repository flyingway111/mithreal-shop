'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Edit3, X, Check, Package, LogOut } from 'lucide-react'

const S = {
  bg: '#0A0A0A', card: '#131313', card2: '#1C1C1C',
  border: '#252525', white: '#FFFFFF', grey: '#666',
  red: '#E53935', green: '#22C55E', blue: '#3B82F6',
}

const ADMIN_PASSWORD = 'mithreal2024'

type Product = {
  id?: number
  name: string
  price: number
  category: string
  sizes: string[]
  images: string[]
  is_new: boolean
  stock: number
  description: string
}

const EMPTY: Product = {
  name: '', price: undefined as unknown as number, category: 'tshirts',
  sizes: [], images: [], is_new: false, stock: undefined as unknown as number, description: ''
}

const CATEGORIES = [
  { id: 'tshirts', name: 'Футболки' },
  { id: 'kofty', name: 'Кофты' },
  { id: 'sneakers', name: 'Кроссовки' },
]

const CLOTHING_SIZES = ['XS','S','M','L','XL','XXL']
const SHOE_SIZES = ['36','37','38','39','40','41','42','43','44','45','46','47','48']

function Input({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: S.grey, letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <input type={type === 'number' ? 'text' : type} inputMode={type === 'number' ? 'numeric' : undefined}
        value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${S.border}`, background: S.card2, color: S.white, fontSize: 14, outline: 'none' }}/>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Product>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [imgInput, setImgInput] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) load() }, [authed])

  const openAdd = () => { setForm(EMPTY); setEditing(null); setImgInput(''); setShowForm(true) }
  const openEdit = (p: Product) => { setForm(p); setEditing(p); setImgInput(p.images.join('\n')); setShowForm(true) }

  const save = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const images = imgInput.split('\n').map(s => s.trim()).filter(Boolean)
    const data = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      sizes: form.sizes,
      images,
      is_new: form.is_new,
      stock: Number(form.stock) || 1,
      description: form.description,
    }

    if (editing?.id) {
      await supabase.from('products').update(data).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(data)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Удалить товар?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('products').getPublicUrl(path)
      setImgInput(prev => prev ? prev + '\n' + data.publicUrl : data.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  const toggleSize = (s: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s]
    }))
  }

  const availableSizes = form.category === 'sneakers' ? SHOE_SIZES : CLOTHING_SIZES

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: S.card, borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 360, border: `1px solid ${S.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.12em' }}>MITHREAL</div>
          <div style={{ fontSize: 10, color: S.grey, letterSpacing: '0.3em', marginTop: 2 }}>ADMIN</div>
        </div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pass === ADMIN_PASSWORD && setAuthed(true)}
          placeholder="Пароль" style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1px solid ${S.border}`, background: S.card2, color: S.white, fontSize: 15, outline: 'none', marginBottom: 12 }}/>
        <button onClick={() => pass === ADMIN_PASSWORD ? setAuthed(true) : alert('Неверный пароль')}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: S.white, color: S.bg, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Войти
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: S.bg, color: S.white }}>

      {/* Header */}
      <div style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.1em' }}>MITHREAL ADMIN</div>
          <div style={{ fontSize: 11, color: S.grey, marginTop: 1 }}>{products.length} товаров в магазине</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: S.white, color: S.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16}/> Добавить
          </button>
          <button onClick={() => setAuthed(false)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${S.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={16} color={S.grey}/>
          </button>
        </div>
      </div>

      {/* Products list */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.grey }}>Загрузка...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: S.grey }}>
            <Package size={48} color={S.border} style={{ margin: '0 auto 16px', display: 'block' }}/>
            <div style={{ fontSize: 15 }}>Товаров пока нет</div>
            <div style={{ fontSize: 12, marginTop: 6, color: '#444' }}>Нажми «Добавить» чтобы создать первый</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: S.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${S.border}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                {/* Preview */}
                <div style={{ width: 56, height: 68, borderRadius: 10, background: '#0f0f0f', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {p.category === 'sneakers' ? '👟' : p.category === 'kofty' ? '🧥' : '👕'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{p.price.toLocaleString('ru-RU')}₽</span>
                    <span style={{ fontSize: 11, color: S.grey }}>·</span>
                    <span style={{ fontSize: 11, color: S.grey }}>{CATEGORIES.find(c => c.id === p.category)?.name}</span>
                    <span style={{ fontSize: 11, color: S.grey }}>·</span>
                    <span style={{ fontSize: 11, color: p.stock <= 1 ? '#F59E0B' : S.grey }}>{p.stock} шт.</span>
                    {p.is_new && <span style={{ fontSize: 10, fontWeight: 700, background: S.white, color: S.bg, padding: '1px 6px', borderRadius: 4 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{p.sizes.join(', ')}</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${S.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit3 size={15} color={S.white}/>
                  </button>
                  <button onClick={() => del(p.id!)} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${S.red}33`, background: `${S.red}11`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={15} color={S.red}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowForm(false)}>
          <div style={{ background: S.card, borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 18px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{editing ? 'Редактировать' : 'Новый товар'}</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color={S.white}/></button>
              </div>

              <Input label="НАЗВАНИЕ" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} placeholder="C.E Cavempt Graphic Tee"/>
              <Input label="ЦЕНА (₽)" value={form.price} onChange={v => setForm(f => ({...f, price: Number(v)}))} type="number" placeholder="4500"/>
              <Input label="ОСТАТОК (шт.)" value={form.stock} onChange={v => setForm(f => ({...f, stock: Number(v)}))} type="number"/>

              {/* Category */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: S.grey, letterSpacing: '0.1em', marginBottom: 8 }}>КАТЕГОРИЯ</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setForm(f => ({...f, category: c.id, sizes: []}))} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      border: `1px solid ${form.category === c.id ? S.white : S.border}`,
                      background: form.category === c.id ? S.white : 'transparent',
                      color: form.category === c.id ? S.bg : S.white,
                    }}>{c.name}</button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: S.grey, letterSpacing: '0.1em', marginBottom: 8 }}>РАЗМЕРЫ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {availableSizes.map(s => (
                    <button key={s} onClick={() => toggleSize(s)} style={{
                      padding: '8px 14px', borderRadius: 9, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${form.sizes.includes(s) ? S.white : S.border}`,
                      background: form.sizes.includes(s) ? S.white : 'transparent',
                      color: form.sizes.includes(s) ? S.bg : S.white,
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: S.grey, letterSpacing: '0.1em', marginBottom: 8 }}>ФОТО</div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 10, border: `1px dashed ${S.border}`, background: S.card2, color: uploading ? S.grey : S.white, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}>
                  {uploading ? 'Загружаем...' : '+ Выбрать фото из галереи'}
                  <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} multiple/>
                </label>
                {imgInput && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {imgInput.split('\n').filter(Boolean).map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}/>
                        <button onClick={() => setImgInput(imgInput.split('\n').filter((_, j) => j !== i).join('\n'))}
                          style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: S.red, border: 'none', color: S.white, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea value={imgInput} onChange={e => setImgInput(e.target.value)} placeholder="Или вставь ссылку на фото..." rows={2}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${S.border}`, background: S.card2, color: S.white, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 }}/>
              </div>

              <Input label="ОПИСАНИЕ" value={form.description || ''} onChange={v => setForm(f => ({...f, description: v}))} placeholder="Краткое описание товара..."/>

              {/* New toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '14px 16px', background: S.card2, borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Пометить как NEW</div>
                  <div style={{ fontSize: 11, color: S.grey, marginTop: 2 }}>Показывает бейдж на карточке</div>
                </div>
                <button onClick={() => setForm(f => ({...f, is_new: !f.is_new}))} style={{
                  width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: form.is_new ? S.white : S.border, position: 'relative', transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: form.is_new ? S.bg : S.grey,
                    position: 'absolute', top: 4, left: form.is_new ? 24 : 4, transition: 'all 0.2s',
                  }}/>
                </button>
              </div>

              <button onClick={save} disabled={saving || !form.name || !form.price} style={{
                width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
                background: form.name && form.price ? S.white : S.border,
                color: form.name && form.price ? S.bg : S.grey,
                fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving ? 'Сохраняем...' : <><Check size={17}/>{editing ? 'Сохранить' : 'Добавить товар'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
