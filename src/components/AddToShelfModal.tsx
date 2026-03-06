'use client'

import { useState } from 'react'
import Image from 'next/image'
import StarRating from './StarRating'
import type { ProductInput } from '@/lib/types'

type Props = {
  product: ProductInput
  savedFromUserId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddToShelfModal({ product, savedFromUserId, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState<'using' | 'wishlist'>('using')
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [selectedShades, setSelectedShades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasVariants = (product.variants?.length ?? 0) > 0

  function toggleShade(title: string) {
    setSelectedShades((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          status,
          rating,
          notes: notes.trim() || null,
          variantTitles: selectedShades,
          savedFromUserId: savedFromUserId ?? null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 text-xl leading-none"
        >
          ×
        </button>

        <div className="flex gap-4 mb-5">
          {product.imageUrl ? (
            <div className="w-16 h-16 overflow-hidden flex-shrink-0 bg-stone-100">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-stone-100 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-medium text-stone-900 leading-tight">{product.name}</h3>
            {product.brand && <p className="text-sm text-stone-500 mt-0.5">{product.brand}</p>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Shade picker — multi-select */}
          {hasVariants && (
            <div>
              <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">
                Shades {selectedShades.length > 0 && `· ${selectedShades.length} selected`}
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {product.variants!.map((v) => {
                  const selected = selectedShades.includes(v.title)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleShade(v.title)}
                      className="px-2.5 py-1 text-xs border transition-colors"
                      style={
                        selected
                          ? { borderColor: '#F01672', background: '#F01672', color: 'white' }
                          : { borderColor: '#e7e5e4', color: '#78716c' }
                      }
                    >
                      {v.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add to */}
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">Add to</p>
            <div className="flex gap-2">
              {(['using', 'wishlist'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex-1 py-2 text-xs border transition-colors"
                  style={status === s ? { borderColor: '#F01672', background: '#F01672', color: 'white' } : { borderColor: '#e7e5e4', color: '#78716c' }}
                >
                  {s === 'using' ? 'My Shelf' : 'Wishlist'}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">Rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What do you think of it?"
              className="w-full px-3 py-2 border border-stone-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-pink"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            style={{ background: '#F01672' }}
          >
            {loading ? 'Saving...' : 'Add to shelf'}
          </button>
        </div>
      </div>
    </div>
  )
}
