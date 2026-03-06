'use client'

import { useState } from 'react'
import AddToShelfModal from '@/components/AddToShelfModal'
import type { ProductInput } from '@/lib/types'

export default function AddFromShelf({
  product,
  savedFromUserId,
}: {
  product: ProductInput
  savedFromUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={added}
        className={`mt-3 w-full py-1.5 text-xs font-medium rounded-lg transition-colors ${
          added ? 'bg-stone-100 text-stone-400 cursor-default' : 'text-white hover:opacity-90'
        }`}
        style={added ? undefined : { background: '#F01672' }}
      >
        {added ? 'Added' : '+ Add to my shelf'}
      </button>

      {open && (
        <AddToShelfModal
          product={product}
          savedFromUserId={savedFromUserId}
          onClose={() => setOpen(false)}
          onSuccess={() => setAdded(true)}
        />
      )}
    </>
  )
}
