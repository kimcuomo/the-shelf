'use client'

import { useState } from 'react'

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
    const method = following ? 'DELETE' : 'POST'
    await fetch('/api/follows', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id: profileId }),
    })
    setFollowing(!following)
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
