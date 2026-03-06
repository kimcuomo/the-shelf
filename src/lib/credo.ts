/**
 * Credo Beauty product data via their public Shopify JSON endpoint.
 * No auth required. Max 250 products per page.
 */

const BASE_URL = 'https://credobeauty.com'
const PAGE_LIMIT = 250
const RATE_LIMIT_MS = 400 // delay between paginated requests

// ─── Raw Shopify types ────────────────────────────────────────────────────────

type CredoImage = { src: string }

type CredoVariant = {
  id: number
  title: string
  price: string
  sku: string
}

export type CredoRawProduct = {
  id: number
  title: string
  handle: string
  vendor: string
  product_type: string
  tags: string[] | string
  body_html: string
  images: CredoImage[]
  variants: CredoVariant[]
}

type CredoResponse = { products: CredoRawProduct[] }

// ─── Normalized product ───────────────────────────────────────────────────────

export type CredoProduct = {
  externalId: string       // "credo:{handle}"
  name: string
  brand: string
  category: string | undefined
  description: string | undefined
  imageUrl: string | undefined
  ingredients: string | undefined
  buyLink: string
  price: string | undefined
  tags: string[]
  variants: Array<{ id: number; title: string; price?: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractIngredients(bodyHtml: string): string | undefined {
  if (!bodyHtml) return undefined
  const text = stripHtml(bodyHtml)
  // Look for "Ingredients:" section, stop at next known section heading
  const match = text.match(/ingredients[:\s]+([^]+?)(?:how to use|directions|size|$)/i)
  return match?.[1]?.trim() || undefined
}

export function normalizeShopifyProduct(raw: CredoRawProduct, baseUrl: string, sourcePrefix: string): CredoProduct {
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : raw.tags?.split(',').map((t) => t.trim()) ?? []

  return {
    externalId: `${sourcePrefix}:${raw.handle}`,
    name: raw.title,
    brand: raw.vendor,
    category: raw.product_type || undefined,
    description: raw.body_html ? stripHtml(raw.body_html).slice(0, 500) || undefined : undefined,
    imageUrl: raw.images?.[0]?.src || undefined,
    ingredients: extractIngredients(raw.body_html),
    buyLink: `${baseUrl}/products/${raw.handle}`,
    price: raw.variants?.[0]?.price || undefined,
    tags,
    variants: (raw.variants ?? [])
      .filter((v) => v.title && v.title !== 'Default Title')
      .map((v) => ({ id: v.id, title: v.title, price: v.price || undefined })),
  }
}

export function normalizeProduct(raw: CredoRawProduct): CredoProduct {
  return normalizeShopifyProduct(raw, BASE_URL, 'credo')
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetch a single page of products with optional server-side filters.
 * Shopify supports ?product_type= and ?vendor= but not full-text search.
 */
async function fetchPage(
  page: number,
  params: Record<string, string> = {}
): Promise<CredoRawProduct[]> {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_LIMIT),
    ...params,
  })

  const res = await fetch(`${BASE_URL}/products.json?${qs}`, {
    next: { revalidate: 3600 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://credobeauty.com/',
    },
  })

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await sleep(2000)
    return fetchPage(page, params)
  }

  if (!res.ok) {
    throw new Error(`Credo API error: ${res.status} ${res.statusText}`)
  }

  const data: CredoResponse = await res.json()
  return data.products ?? []
}

/**
 * Fetch ALL products matching optional filters, handling pagination automatically.
 * Adds a short delay between pages to be a polite API consumer.
 */
export async function fetchAllCredoProducts(
  params: Record<string, string> = {}
): Promise<CredoProduct[]> {
  const results: CredoProduct[] = []
  let page = 1

  while (true) {
    const raw = await fetchPage(page, params)
    results.push(...raw.map(normalizeProduct))

    if (raw.length < PAGE_LIMIT) break // last page

    page++
    await sleep(RATE_LIMIT_MS)
  }

  return results
}

/**
 * Fetch a single product by its Shopify handle.
 */
export async function fetchCredoProduct(handle: string): Promise<CredoProduct | null> {
  const res = await fetch(`${BASE_URL}/products/${handle}.json`, {
    next: { revalidate: 3600 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://credobeauty.com/',
    },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Credo API error: ${res.status}`)

  const data = await res.json()
  return data.product ? normalizeProduct(data.product) : null
}

// ─── Filter utilities ─────────────────────────────────────────────────────────

export type CredoFilterOptions = {
  brand?: string       // exact match on vendor (case-insensitive)
  category?: string    // exact match on product_type (case-insensitive)
  query?: string       // substring match on name, brand, tags
}

export function filterCredoProducts(
  products: CredoProduct[],
  { brand, category, query }: CredoFilterOptions
): CredoProduct[] {
  return products.filter((p) => {
    if (brand && p.brand.toLowerCase() !== brand.toLowerCase()) return false
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false
    if (query) {
      const q = query.toLowerCase()
      const searchable = [p.name, p.brand, ...(p.tags ?? [])].join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })
}

/**
 * Convenience: fetch products filtered by type directly via the API
 * (more efficient than fetching all and filtering client-side).
 */
export function fetchByCategory(category: string): Promise<CredoProduct[]> {
  return fetchAllCredoProducts({ product_type: category })
}

export function fetchByBrand(brand: string): Promise<CredoProduct[]> {
  return fetchAllCredoProducts({ vendor: brand })
}
