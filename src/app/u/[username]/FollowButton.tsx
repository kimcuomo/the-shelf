'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FollowButton({
  profileId,
  isFollowing: initialFollowing,
}: {
  profileId: string
  isFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
      setFollowing(false)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId })
      setFollowing(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
        following
          ? 'border-stone-200 text-stone-600 hover:border-red-200 hover:text-red-500'
          : 'text-white hover:opacity-90'
      }`}
      style={following ? undefined : { borderColor: '#F01672', background: '#F01672' }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
