'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AddToShelfModal from '@/components/AddToShelfModal'
import type { ProductInput } from '@/lib/types'
import { normalizeProduct, normalizeShopifyProduct, type CredoRawProduct, type CredoProduct } from '@/lib/credo'

// ─── Open Beauty Facts ────────────────────────────────────────────────────────

type OBFResult = {
  code: string
  product_name: string
  brands: string
  image_front_url: string
  ingredients_text: string
  link: string
  categories_tags: string[]
}

function obfToProductInput(r: OBFResult): ProductInput {
  const category = r.categories_tags
    ?.find((t) => t.startsWith('en:'))
    ?.replace('en:', '')
    ?.replace(/-/g, ' ') ?? undefined

  return {
    externalId: r.code,
    name: r.product_name || 'Unknown Product',
    brand: r.brands || undefined,
    category,
    imageUrl: r.image_front_url || undefined,
    ingredients: r.ingredients_text || undefined,
    buyLink: r.link || undefined,
  }
}

async function searchOBF(q: string): Promise<ProductInput[]> {
  const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&action=process&json=1&page_size=24&fields=code,product_name,brands,image_front_url,ingredients_text,link,categories_tags`
  const res = await fetch(url)
  const data = await res.json()
  return (data.products ?? [])
    .filter((p: OBFResult) => p.product_name)
    .map(obfToProductInput)
}

// ─── Credo Beauty ─────────────────────────────────────────────────────────────

function credoToProductInput(p: CredoProduct): ProductInput {
  return {
    externalId: p.externalId,
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    imageUrl: p.imageUrl,
    ingredients: p.ingredients,
    buyLink: p.buyLink,
    variants: p.variants.length > 0 ? p.variants : undefined,
  }
}

async function searchCredo(q: string): Promise<ProductInput[]> {
  // Fetch directly from the browser to avoid server-side Cloudflare blocks.
  // Credo doesn't support text search server-side, so we fetch the first page
  // and filter by query in-memory.
  const ql = q.toLowerCase()
  const pages = await Promise.all(
    [1, 2, 3, 4].map((page) =>
      fetch(
        `https://credobeauty.com/products.json?limit=250&page=${page}`,
        { headers: { Accept: 'application/json' } }
      )
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => (d.products ?? []) as CredoRawProduct[])
        .catch(() => [] as CredoRawProduct[])
    )
  )
  const all = pages.flat().map(normalizeProduct)
  return all
    .filter((p) => {
      const haystack = [p.name, p.brand, ...(p.tags ?? [])].join(' ').toLowerCase()
      return haystack.includes(ql)
    })
    .map(credoToProductInput)
}

// ─── Glossier ─────────────────────────────────────────────────────────────────

async function searchGlossier(q: string): Promise<ProductInput[]> {
  const ql = q.toLowerCase()
  const pages = await Promise.all(
    [1, 2].map((page) =>
      fetch(
        `https://glossier.com/products.json?limit=250&page=${page}`,
        { headers: { Accept: 'application/json' } }
      )
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => (d.products ?? []) as CredoRawProduct[])
        .catch(() => [] as CredoRawProduct[])
    )
  )
  return pages
    .flat()
    .map((raw) => normalizeShopifyProduct(raw, 'https://glossier.com', 'glossier'))
    .filter((p) => {
      const haystack = [p.name, p.brand, ...(p.tags ?? [])].join(' ').toLowerCase()
      return haystack.includes(ql)
    })
    .map(credoToProductInput)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductInput[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductInput | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addedCount, setAddedCount] = useState(0)
  const [showToast, setShowToast] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    setResults([])

    try {
      // Credo → Glossier → Open Beauty Facts
      const credo = await searchCredo(q)
      if (credo.length > 0) { setResults(credo); return }
      const glossier = await searchGlossier(q)
      if (glossier.length > 0) { setResults(glossier); return }
      setResults(await searchOBF(q))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') search(query)
  }

  function handleAdded(id: string) {
    setAddedIds((prev) => new Set([...prev, id]))
    setAddedCount((n) => n + 1)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-0.5">Find products</h1>
          <p className="text-stone-400 text-sm">Search our beauty database</p>
        </div>
        {addedCount > 0 && (
          <Link
            href="/shelf"
            className="text-sm px-4 py-2 border border-stone-200 text-stone-700 hover:border-stone-400 transition-colors"
          >
            View shelf ({addedCount} added)
          </Link>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by product or brand..."
          className="flex-1 px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-300 bg-white"
          autoFocus
        />
        <button
          onClick={() => search(query)}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
          style={{ background: '#F01672' }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Empty state */}
      {!searched && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">Search for cleansers, serums, moisturizers, and more</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-stone-400 text-sm">Searching…</div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-stone-500 mb-4">No products found for &ldquo;{query}&rdquo;</p>
          <Link href="/submit" className="text-sm text-stone-800 font-medium underline underline-offset-2">
            Submit a product
          </Link>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => {
              const id = product.externalId ?? product.name
              const added = addedIds.has(id)

              return (
                <div
                  key={id}
                  className="bg-white border border-stone-100 overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-stone-50 relative">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-3"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-200 text-4xl">
                        ✦
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
                      {product.brand || 'Unknown brand'}
                    </p>
                    <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2 flex-1">
                      {product.name}
                    </p>

                    <button
                      onClick={() => !added && setSelectedProduct(product)}
                      disabled={added}
                      className={`mt-3 w-full py-1.5 text-xs font-medium transition-colors ${
                        added ? 'bg-stone-100 text-stone-400 cursor-default' : 'text-white hover:opacity-90'
                      }`}
                      style={added ? undefined : { background: '#F01672' }}
                    >
                      {added ? '✓ Added' : '+ Add to shelf'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-stone-500">
              Can&apos;t find what you&apos;re looking for?{' '}
              <Link href="/submit" className="text-stone-800 font-medium underline underline-offset-2">
                Submit a product
              </Link>
            </p>
          </div>
        </>
      )}

      {selectedProduct && (
        <AddToShelfModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            handleAdded(selectedProduct.externalId ?? selectedProduct.name)
          }}
        />
      )}

      {/* Toast */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
        style={{ opacity: showToast ? 1 : 0, pointerEvents: showToast ? 'auto' : 'none', transform: `translateX(-50%) translateY(${showToast ? '0' : '12px'})` }}
      >
        <div className="flex items-center gap-4 bg-stone-900 text-white text-sm px-5 py-3 shadow-lg whitespace-nowrap">
          <span>Added to your shelf</span>
          <Link href="/shelf" className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity">
            View shelf →
          </Link>
        </div>
      </div>
    </div>
  )
}
