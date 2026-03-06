'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SubmitProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login?redirect=/submit')
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)

    const { error: insertError } = await supabase.from('products').insert({
      name: data.get('name') as string,
      brand: (data.get('brand') as string) || null,
      category: (data.get('category') as string) || null,
      description: (data.get('description') as string) || null,
      image_url: (data.get('image_url') as string) || null,
      ingredients: (data.get('ingredients') as string) || null,
      buy_link: (data.get('buy_link') as string) || null,
      source: 'user_submitted',
      status: 'pending',
      submitted_by: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/submit/success')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/search" className="text-sm text-stone-500 hover:text-stone-700">
          ← Back to search
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-stone-900 mb-1">Submit a product</h1>
      <p className="text-sm text-stone-500 mb-8">
        Can&apos;t find a product? Submit it for review and we&apos;ll add it to the catalog.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Product name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="e.g. Hydrating Facial Cleanser"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
          <input
            name="brand"
            type="text"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="e.g. CeraVe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
          <select
            name="category"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
          >
            <option value="">Select a category</option>
            <option>Cleanser</option>
            <option>Moisturizer</option>
            <option>Serum</option>
            <option>Sunscreen</option>
            <option>Toner</option>
            <option>Eye cream</option>
            <option>Mask</option>
            <option>Exfoliant</option>
            <option>Oil</option>
            <option>Makeup</option>
            <option>Hair care</option>
            <option>Body care</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="Brief description of the product"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Product image URL
          </label>
          <input
            name="image_url"
            type="url"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Ingredients</label>
          <textarea
            name="ingredients"
            rows={4}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="Water, Glycerin, Niacinamide..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Link to buy</label>
          <input
            name="buy_link"
            type="url"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            placeholder="https://..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          style={{ background: '#F01672' }}
        >
          {loading ? 'Submitting...' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}
