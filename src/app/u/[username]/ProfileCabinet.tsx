'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ShelfCabinet from '@/components/ShelfCabinet'
import StarRating from '@/components/StarRating'
import AddToShelfModal from '@/components/AddToShelfModal'
import type { ShelfItem } from '@/lib/types'

function ProductViewModal({
  item,
  isOwnProfile,
  savedFromUserId,
  onClose,
}: {
  item: ShelfItem
  isOwnProfile: boolean
  savedFromUserId: string
  onClose: () => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [added, setAdded] = useState(false)

  const product = item.product
  if (!product) return null

  return (
    <>
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
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-3"
                    unoptimized
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                {product.brand && (
                  <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                )}
                <h2 className="font-semibold text-stone-900 leading-snug text-sm mb-2 pr-6">
                  {product.name}
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

                {item.rating && <StarRating value={item.rating} size="md" />}

                {product.buy_link && (
                  <a
                    href={product.buy_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs hover:underline"
                    style={{ color: '#F01672' }}
                  >
                    Buy →
                  </a>
                )}
              </div>
            </div>

            {item.notes && (
              <div className="mb-5 p-3 bg-stone-50 border border-stone-100">
                <p className="text-[11px] text-stone-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm text-stone-600">{item.notes}</p>
              </div>
            )}

            {!isOwnProfile && (
              added ? (
                <p className="text-center text-sm text-stone-400 py-2">✓ Added to your shelf</p>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-2.5 text-white text-sm font-medium hover:opacity-90"
                  style={{ background: '#F01672' }}
                >
                  + Add to my shelf
                </button>
              )
            )}

            {isOwnProfile && (
              <Link
                href="/shelf"
                className="block w-full py-2.5 text-center text-sm text-stone-600 border border-stone-200 hover:border-stone-400 transition-colors"
                onClick={onClose}
              >
                Edit on My Shelf →
              </Link>
            )}
          </div>

          {/* Bottom chrome strip */}
          <div style={{ height: '6px', background: 'linear-gradient(to right, #d0d0d0, #f0f0f0, #e8e8e8, #f0f0f0, #d0d0d0)' }} />
        </div>
      </div>

      {showAddModal && (
        <AddToShelfModal
          product={{
            id: product.id,
            name: product.name,
            brand: product.brand ?? undefined,
            imageUrl: product.image_url ?? undefined,
            ingredients: product.ingredients ?? undefined,
            buyLink: product.buy_link ?? undefined,
          }}
          savedFromUserId={savedFromUserId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setAdded(true); setShowAddModal(false) }}
        />
      )}
    </>
  )
}

export default function ProfileCabinet({
  shelfItems,
  wishlistItems,
  isOwnProfile,
  profileId,
  showWishlist,
}: {
  shelfItems: ShelfItem[]
  wishlistItems: ShelfItem[]
  isOwnProfile: boolean
  profileId: string
  showWishlist: boolean
}) {
  const [selected, setSelected] = useState<ShelfItem | null>(null)
  const [activeTab, setActiveTab] = useState<'shelf' | 'wishlist'>('shelf')

  return (
    <>
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
          Shelf · {shelfItems.length}
        </button>
        {showWishlist && (
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
        )}
      </div>

      <div className="flex justify-center">
        <div style={{ width: '280px' }}>
          {activeTab === 'shelf' ? (
            <ShelfCabinet items={shelfItems} onProductClick={setSelected} variant="shelf" />
          ) : (
            <ShelfCabinet items={wishlistItems} onProductClick={setSelected} variant="wishlist" />
          )}
        </div>
      </div>

      {selected && (
        <ProductViewModal
          item={selected}
          isOwnProfile={isOwnProfile}
          savedFromUserId={profileId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
