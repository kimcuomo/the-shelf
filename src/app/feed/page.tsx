import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import SaveFromFeedButton from './SaveFromFeedButton'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = (follows ?? []).map((f) => f.following_id)

  const feedItems = followingIds.length > 0
    ? (await supabase
        .from('shelf_items')
        .select(`
          *,
          product:products(id, name, brand, image_url, buy_link),
          user:profiles!shelf_items_user_id_fkey(id, username, avatar_url)
        `)
        .in('user_id', followingIds)
        .eq('status', 'using')
        .order('created_at', { ascending: false })
        .limit(50)
      ).data ?? []
    : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Feed</h1>

      {followingIds.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm mb-4">Follow people to see their shelves here</p>
          <Link href="/people" className="text-sm text-stone-800 font-medium underline underline-offset-2">
            Find people to follow
          </Link>
        </div>
      )}

      {followingIds.length > 0 && feedItems.length === 0 && (
        <div className="text-center py-16 text-stone-400 text-sm">
          No products yet — check back soon.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {feedItems.map((item) => (
          <div key={item.id} className="bg-white border border-stone-100 p-4 flex gap-4">
            {/* Product image */}
            <div className="w-20 h-20 bg-stone-50 relative flex-shrink-0">
              {item.product?.image_url ? (
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-200 text-2xl">✦</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/u/${item.user?.username}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-800 hover:text-stone-600"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0">
                    {item.user?.username?.charAt(0).toUpperCase()}
                  </span>
                  @{item.user?.username}
                </Link>
                <span className="text-stone-300">·</span>
                <time className="text-xs text-stone-400">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </time>
              </div>

              <p className="text-xs text-stone-400 uppercase tracking-wide">{item.product?.brand}</p>
              <p className="text-sm font-medium text-stone-800 leading-snug">{item.product?.name}</p>

              {item.rating && (
                <div className="mt-1">
                  <StarRating value={item.rating} size="sm" />
                </div>
              )}

              {item.notes && (
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">{item.notes}</p>
              )}

              {item.product && (
                <div className="mt-2 flex items-center gap-3">
                  <SaveFromFeedButton
                    product={{
                      id: item.product.id,
                      name: item.product.name,
                      brand: item.product.brand ?? undefined,
                      imageUrl: item.product.image_url ?? undefined,
                      buyLink: item.product.buy_link ?? undefined,
                    }}
                    savedFromUserId={item.user_id}
                    currentUserId={user.id}
                  />
                  <Link
                    href={`/u/${item.user?.username}`}
                    className="text-xs text-stone-400 hover:text-stone-600"
                  >
                    View shelf →
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
