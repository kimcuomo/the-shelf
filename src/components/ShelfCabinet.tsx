'use client'

import Image from 'next/image'
import type { ShelfItem } from '@/lib/types'

export const ITEMS_PER_SHELF = 3

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export const CHROME_FRAME: React.CSSProperties = {
  background: 'linear-gradient(145deg, #f0f0f0 0%, #d5d5d5 20%, #b5b5b5 38%, #c5c5c5 50%, #dcdcdc 68%, #f4f4f4 88%, #cecece 100%)',
  padding: '10px',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 28px 65px rgba(0,0,0,0.2), 0 8px 18px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
}

export const GLASS_SHELF: React.CSSProperties = {
  height: '18px',
  background: 'linear-gradient(to bottom, rgba(235,248,245,0.55) 0%, rgba(195,232,225,0.65) 55%, rgba(110,185,172,0.9) 85%, rgba(80,165,150,1) 100%)',
  borderTop: '1px solid rgba(255,255,255,0.95)',
  boxShadow: '0 8px 22px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
}

export function ProductBottle({ item, onClick }: {
  item: ShelfItem
  onClick: () => void
}) {
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
        </div>
        <div className="w-2 h-2 bg-stone-900/90 rotate-45 mx-auto -mt-1" />
      </div>
    </button>
  )
}

export default function ShelfCabinet({
  items,
  onProductClick,
  variant = 'shelf',
  emptyMessage,
}: {
  items: ShelfItem[]
  onProductClick: (item: ShelfItem) => void
  variant?: 'shelf' | 'wishlist'
  emptyMessage?: string
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
                    {emptyMessage ?? (variant === 'wishlist' ? 'Nothing on the wishlist yet' : 'Nothing on the shelf yet')}
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
