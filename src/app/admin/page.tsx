import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import AdminActions from './AdminActions'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: pending } = await supabase
    .from('products')
    .select(`*, submitter:profiles!products_submitted_by_fkey(username)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900 mb-1">Product approvals</h1>
      <p className="text-sm text-stone-500 mb-8">
        {pending?.length ?? 0} product{pending?.length !== 1 ? 's' : ''} pending review
      </p>

      {!pending?.length ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">All caught up</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-stone-50 flex-shrink-0 relative overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-200 text-2xl">✦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">{product.name}</p>
                    {product.brand && <p className="text-sm text-stone-500">{product.brand}</p>}
                  </div>
                  <AdminActions productId={product.id} />
                </div>

                {product.description && (
                  <p className="mt-1 text-xs text-stone-500 line-clamp-2">{product.description}</p>
                )}

                {product.ingredients && (
                  <p className="mt-1 text-xs text-stone-400 line-clamp-1">
                    <span className="font-medium">Ingredients:</span> {product.ingredients}
                  </p>
                )}

                {product.buy_link && (
                  <a
                    href={product.buy_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
                  >
                    {product.buy_link}
                  </a>
                )}

                <p className="mt-2 text-xs text-stone-400">
                  Submitted by @{(product as { submitter?: { username: string } }).submitter?.username ?? 'unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
