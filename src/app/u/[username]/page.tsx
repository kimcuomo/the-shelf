import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FollowButton from './FollowButton'
import ProfileCabinet from './ProfileCabinet'

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

  const isOwnProfile = viewer?.id === profile.id

  // Respect is_private: non-followers can't see shelf
  let canViewShelf = true
  if (profile.is_private && !isOwnProfile) {
    if (!viewer) {
      canViewShelf = false
    } else {
      const { data: followRecord } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', viewer.id)
        .eq('following_id', profile.id)
        .maybeSingle()
      canViewShelf = !!followRecord
    }
  }

  const [
    { data: shelfItems },
    { data: wishlistItems },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    canViewShelf
      ? supabase
          .from('shelf_items')
          .select(`*, product:products(*)`)
          .eq('user_id', profile.id)
          .eq('status', 'using')
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    canViewShelf && (isOwnProfile || !profile.wishlist_private)
      ? supabase
          .from('shelf_items')
          .select(`*, product:products(*)`)
          .eq('user_id', profile.id)
          .eq('status', 'wishlist')
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
  ])

  let isFollowing = false
  if (viewer && !isOwnProfile) {
    const { data: followRecord } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', viewer.id)
      .eq('following_id', profile.id)
      .maybeSingle()
    isFollowing = !!followRecord
  }

  const showWishlist = isOwnProfile || !profile.wishlist_private

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
              <FollowButton profileId={profile.id} isFollowing={isFollowing} />
            )}
            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full hover:bg-stone-200 transition-colors"
              >
                Edit profile
              </Link>
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

      {!canViewShelf ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-sm">This shelf is private</p>
          {viewer && (
            <p className="text-xs mt-1">Follow @{profile.username} to see their shelf</p>
          )}
        </div>
      ) : (
        <ProfileCabinet
          shelfItems={(shelfItems ?? []) as any}
          wishlistItems={(wishlistItems ?? []) as any}
          isOwnProfile={isOwnProfile}
          profileId={profile.id}
          showWishlist={showWishlist}
        />
      )}

      {!viewer && (
        <div className="mt-8 p-4 bg-stone-50 text-center">
          <p className="text-sm text-stone-500">
            <Link href="/auth/signup" className="text-stone-800 font-medium hover:underline">Create an account</Link>{' '}
            to add products to your own shelf
          </p>
        </div>
      )}
    </div>
  )
}
