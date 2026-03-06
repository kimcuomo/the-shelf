import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import AddFromShelf from './AddFromShelf'
import FollowButton from './FollowButton'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user: viewer } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!profile) notFound()

  const { data: shelfItems } = await supabase
    .from('shelf_items')
    .select(`
      *,
      product:products(*),
      saved_from_user:profiles!shelf_items_saved_from_user_id_fkey(id, username)
    `)
    .eq('user_id', profile.id)
    .eq('status', 'using')
    .order('created_at', { ascending: false })

  const { data: wishlistItems } = await supabase
    .from('shelf_items')
    .select(`*, product:products(*)`)
    .eq('user_id', profile.id)
    .eq('status', 'wishlist')
    .order('created_at', { ascending: false })

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  let isFollowing = false
  if (viewer && viewer.id !== profile.id) {
    const { data: followRecord } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', viewer.id)
      .eq('following_id', profile.id)
      .maybeSingle()
    isFollowing = !!followRecord
  }

  const isOwnProfile = viewer?.id === profile.id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-2xl font-medium text-stone-600 flex-shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            profile.username.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-stone-900">@{profile.username}</h1>
            {!isOwnProfile && viewer && (
              <FollowButton
                profileId={profile.id}
                isFollowing={isFollowing}
              />
            )}
            {isOwnProfile && (
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-1 text-sm text-stone-600">{profile.bio}</p>
          )}

          <div className="flex gap-4 mt-2 text-sm text-stone-500">
            <span><strong className="text-stone-800">{followerCount ?? 0}</strong> followers</span>
            <span><strong className="text-stone-800">{followingCount ?? 0}</strong> following</span>
          </div>
        </div>
      </div>

      {/* Shelf */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">
          On the shelf
          <span className="ml-2 text-sm font-normal text-stone-400">{shelfItems?.length ?? 0}</span>
        </h2>

        {!shelfItems?.length ? (
          <p className="text-sm text-stone-400">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shelfItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col">
                <div className="aspect-square bg-stone-50 relative">
                  {item.product?.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200 text-4xl">✦</div>
                  )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
                    {item.product?.brand || 'Unknown brand'}
                  </p>
                  <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2 flex-1">
                    {item.product?.name}
                  </p>

                  {item.rating && (
                    <div className="mt-1.5">
                      <StarRating value={item.rating} size="sm" />
                    </div>
                  )}

                  {item.notes && (
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2">{item.notes}</p>
                  )}

                  {item.product?.buy_link && (
                    <a
                      href={item.product.buy_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
                    >
                      Buy →
                    </a>
                  )}

                  {!isOwnProfile && viewer && item.product && (
                    <AddFromShelf
                      product={{
                        id: item.product.id,
                        name: item.product.name,
                        brand: item.product.brand ?? undefined,
                        imageUrl: item.product.image_url ?? undefined,
                        ingredients: item.product.ingredients ?? undefined,
                        buyLink: item.product.buy_link ?? undefined,
                      }}
                      savedFromUserId={profile.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wishlist */}
      {(wishlistItems?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">
            Wishlist
            <span className="ml-2 text-sm font-normal text-stone-400">{wishlistItems?.length ?? 0}</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistItems?.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col">
                <div className="aspect-square bg-stone-50 relative">
                  {item.product?.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200 text-4xl">✦</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
                    {item.product?.brand || 'Unknown brand'}
                  </p>
                  <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2">
                    {item.product?.name}
                  </p>

                  {!isOwnProfile && viewer && item.product && (
                    <AddFromShelf
                      product={{
                        id: item.product.id,
                        name: item.product.name,
                        brand: item.product.brand ?? undefined,
                        imageUrl: item.product.image_url ?? undefined,
                        ingredients: item.product.ingredients ?? undefined,
                        buyLink: item.product.buy_link ?? undefined,
                      }}
                      savedFromUserId={profile.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!viewer && (
        <div className="mt-8 p-4 bg-stone-50 rounded-xl text-center">
          <p className="text-sm text-stone-500 mb-3">
            <Link href="/auth/signup" className="text-stone-800 font-medium hover:underline">Create an account</Link>{' '}
            to add products to your own shelf
          </p>
        </div>
      )}
    </div>
  )
}
