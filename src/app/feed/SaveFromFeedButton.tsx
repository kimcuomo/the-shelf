'use client'

import { useState } from 'react'
import type { ProductInput } from '@/lib/types'

export default function SaveFromFeedButton({
  product,
  savedFromUserId,
  currentUserId,
}: {
  product: ProductInput & { id: string }
  savedFromUserId: string
  currentUserId: string
}) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  if (savedFromUserId === currentUserId) return null

  async function save(status: 'using' | 'wishlist') {
    setLoading(true)
    await fetch('/api/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product,
        status,
        rating: null,
        notes: null,
        variantTitles: [],
        savedFromUserId,
      }),
    })
    setSaved(true)
    setLoading(false)
  }

  if (saved) {
    return <span className="text-xs text-stone-400">✓ Saved</span>
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => save('using')}
        disabled={loading}
        className="text-xs text-white px-2.5 py-1 disabled:opacity-50 hover:opacity-90"
        style={{ background: '#F01672' }}
      >
        + Save
      </button>
      <button
        onClick={() => save('wishlist')}
        disabled={loading}
        className="text-xs text-stone-600 px-2.5 py-1 border border-stone-200 hover:border-stone-400 disabled:opacity-50"
      >
        + Wishlist
      </button>
    </div>
  )
}
