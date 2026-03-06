'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import { createClient } from '@/lib/supabase/client'
import type { ShelfItem } from '@/lib/types'

const ITEMS_PER_SHELF = 3

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

const CHROME_FRAME: React.CSSProperties = {
  background: 'linear-gradient(145deg, #f0f0f0 0%, #d5d5d5 20%, #b5b5b5 38%, #c5c5c5 50%, #dcdcdc 68%, #f4f4f4 88%, #cecece 100%)',
  padding: '10px',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 28px 65px rgba(0,0,0,0.2), 0 8px 18px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
}

const GLASS_SHELF: React.CSSProperties = {
  height: '18px',
  background: 'linear-gradient(to bottom, rgba(235,248,245,0.55) 0%, rgba(195,232,225,0.65) 55%, rgba(110,185,172,0.9) 85%, rgba(80,165,150,1) 100%)',
  borderTop: '1px solid rgba(255,255,255,0.95)',
  boxShadow: '0 8px 22px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
}

function ProductBottle({ item, onClick }: { item: ShelfItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center focus:outline-none"
      aria-label={item.product?.name}
    >
      <div className="relative w-12 h-[88px] flex items-end justify-center">
        {item.product?.image_url ? (
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            fill
            className="object-contain group-hover:scale-[1.07] transition-transform duration-200 origin-bottom"
            style={{
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
            unoptimized
          />
        ) : (
          <div
            className="w-9 h-[68px] group-hover:scale-[1.07] transition-transform duration-200 origin-bottom"
            style={{
              background: 'linear-gradient(to bottom, #e8e4de, #d4d0ca)',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
        <div className="bg-stone-900/90 text-white text-[10px] px-2 py-1 rounded max-w-[140px]">
          <p className="truncate">{item.product?.name}</p>
          {item.variant_titles?.length > 0 && (
            <p className="truncate opacity-70">{item.variant_titles.join(', ')}</p>
          )}
        </div>
        <div className="w-2 h-2 bg-stone-900/90 rotate-45 mx-auto -mt-1" />
      </div>
    </button>
  )
}

function ShelfCabinet({
  items,
  onProductClick,
  variant = 'shelf',
}: {
  items: ShelfItem[]
  onProductClick: (item: ShelfItem) => void
  variant?: 'shelf' | 'wishlist'
}) {
  const shelves = chunk(items, ITEMS_PER_SHELF)
  while (shelves.length < 4) shelves.push([])

  const groutColor = variant === 'wishlist' ? '%23b0abb8' : '%23b0aaa4'
  const tileColor = variant === 'wishlist' ? '%23f0eef5' : '%23f5f2ef'
  const highlightColor = 'rgba(255%2C255%2C255%2C0.55)'
  const svgTile = `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52'><rect width='52' height='52' fill='${groutColor}'/><rect x='2' y='2' width='48' height='48' fill='${tileColor}'/><rect x='2' y='2' width='48' height='12' fill='${highlightColor}'/></svg>`
  const interiorStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,${svgTile}")`,
    backgroundSize: '52px 52px',
  }

  return (
    <div style={CHROME_FRAME}>
      <div style={interiorStyle}>
        {shelves.map((shelfItems, i) => (
          <div key={i}>
            <div className="flex items-end gap-4 px-5 pt-7 min-h-[116px]">
              {shelfItems.map((item) => (
                <ProductBottle key={item.id} item={item} onClick={() => onProductClick(item)} />
              ))}
              {shelfItems.length === 0 && i === 0 && items.length === 0 && (
                <div className="flex items-end pb-3 w-full">
                  <p className="text-xs text-stone-400/60 tracking-wide italic">
                    {variant === 'wishlist' ? 'Nothing on your wishlist yet' : 'Your shelf is empty'}
                  </p>
                </div>
              )}
            </div>
            <div style={GLASS_SHELF} />
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  )
}

function ProductDetailModal({
  item,
  onClose,
  onSave,
  onRemove,
}: {
  item: ShelfItem
  onClose: () => void
  onSave: (data: { status: 'using' | 'wishlist'; rating: number | null; notes: string | null }) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [status, setStatus] = useState<'using' | 'wishlist'>(item.status)
  const [rating, setRating] = useState<number | null>(item.rating)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ status, rating, notes: notes.trim() || null })
    setSaving(false)
    onClose()
  }

  async function handleRemove() {
    setRemoving(true)
    await onRemove()
    setRemoving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-2xl z-10 overflow-hidden">
        {/* Top chrome strip */}
        <div style={{ height: '6px', background: 'linear-gradient(to right, #d0d0d0, #f0f0f0, #e8e8e8, #f0f0f0, #d0d0d0)' }} />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-300 hover:text-stone-500 text-2xl leading-none transition-colors"
          >
            ×
          </button>

          {/* Product header */}
          <div className="flex gap-5 mb-5">
            <div
              className="w-28 h-36 flex-shrink-0 flex items-center justify-center relative"
              style={{ background: 'linear-gradient(160deg, #f4f2ef, #ebe7e1)' }}
            >
              {item.product?.image_url && (
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-contain p-3"
                  unoptimized
                />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {item.product?.brand && (
                <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-1">
                  {item.product.brand}
                </p>
              )}
              <h2 className="font-semibold text-stone-900 leading-snug text-sm mb-2 pr-6">
                {item.product?.name}
              </h2>

              {item.variant_titles?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.variant_titles.map((shade) => (
                    <span key={shade} className="text-[10px] px-2 py-0.5 border border-stone-200 text-stone-500">
                      {shade}
                    </span>
                  ))}
                </div>
              )}

              <StarRating value={rating} onChange={setRating} />

              {item.saved_from_user && (
                <p className="mt-2 text-xs text-stone-400">
                  Saved from{' '}
                  <Link href={`/u/${item.saved_from_user.username}`} className="text-pink hover:underline">
                    @{item.saved_from_user.username}
                  </Link>
                </p>
              )}

              {item.product?.buy_link && (
                <a
                  href={item.product.buy_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-pink hover:underline"
                >
                  Buy →
                </a>
              )}
            </div>
          </div>

          {/* Move to */}
          <div className="mb-4">
            <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">Move to</p>
            <div className="flex gap-2">
              {(['using', 'wishlist'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="flex-1 py-1.5 text-xs border transition-colors"
                  style={
                    status === s
                      ? { borderColor: '#F01672', background: '#F01672', color: 'white' }
                      : { borderColor: '#e7e5e4', color: '#78716c' }
                  }
                >
                  {s === 'using' ? 'My Shelf' : 'Wishlist'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What do you think of it?"
              className="w-full px-3 py-2 border border-stone-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-pink"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 text-white text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: '#F01672' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="px-4 py-2.5 border border-stone-200 text-stone-400 text-sm hover:border-red-200 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {removing ? '...' : 'Remove'}
            </button>
          </div>
        </div>

        {/* Bottom chrome strip */}
        <div style={{ height: '6px', background: 'linear-gradient(to right, #d0d0d0, #f0f0f0, #e8e8e8, #f0f0f0, #d0d0d0)' }} />
      </div>
    </div>
  )
}

export default function ShelfPage() {
  const [items, setItems] = useState<ShelfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ShelfItem | null>(null)
  const [activeTab, setActiveTab] = useState<'shelf' | 'wishlist'>('shelf')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('shelf_items')
      .select(`
        *,
        product:products(*),
        saved_from_user:profiles!shelf_items_saved_from_user_id_fkey(id, username)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    setItems((data as ShelfItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function handleSave(data: { status: 'using' | 'wishlist'; rating: number | null; notes: string | null }) {
    if (!selected) return
    await fetch('/api/shelf', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...data, variant_titles: selected.variant_titles }),
    })
    fetchItems()
  }

  async function handleRemove() {
    if (!selected) return
    await fetch('/api/shelf', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id }),
    })
    setItems((prev) => prev.filter((i) => i.id !== selected.id))
  }

  const shelfItems = items.filter((i) => i.status === 'using')
  const wishlistItems = items.filter((i) => i.status === 'wishlist')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">My Shelf</h1>
        <Link
          href="/search"
          className="text-sm text-white px-4 py-2 transition-colors hover:opacity-90"
          style={{ background: '#F01672' }}
        >
          + Add products
        </Link>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-0 mb-8 border border-stone-200 w-fit">
        <button
          onClick={() => setActiveTab('shelf')}
          className="px-6 py-2 text-xs uppercase tracking-widest transition-colors"
          style={
            activeTab === 'shelf'
              ? { background: '#F01672', color: 'white' }
              : { background: 'white', color: '#78716c' }
          }
        >
          My Shelf · {shelfItems.length}
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className="px-6 py-2 text-xs uppercase tracking-widest transition-colors border-l border-stone-200"
          style={
            activeTab === 'wishlist'
              ? { background: '#F01672', color: 'white' }
              : { background: 'white', color: '#78716c' }
          }
        >
          Wishlist · {wishlistItems.length}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400 text-sm">Loading...</div>
      ) : (
        <div className="flex justify-center">
          <div style={{ width: '280px' }}>
            {activeTab === 'shelf' ? (
              <ShelfCabinet items={shelfItems} onProductClick={setSelected} variant="shelf" />
            ) : (
              <ShelfCabinet items={wishlistItems} onProductClick={setSelected} variant="wishlist" />
            )}
          </div>
        </div>
      )}

      {selected && (
        <ProductDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      )}
    </div>
  )
}
