'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminActions({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    const supabase = createClient()
    await supabase
      .from('products')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', productId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => handle('approve')}
        disabled={!!loading}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={!!loading}
        className="px-3 py-1 text-xs border border-stone-200 text-stone-500 rounded-lg hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {loading === 'reject' ? '...' : 'Reject'}
      </button>
    </div>
  )
}
