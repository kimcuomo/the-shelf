'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function PeoplePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q.trim()}%`)
      .limit(20)

    setResults(data ?? [])
    setLoading(false)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') search(query)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Find people</h1>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by username..."
          className="flex-1 px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-300 bg-white"
          autoFocus
        />
        <button
          onClick={() => search(query)}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          style={{ background: '#F01672' }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {!searched && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">Search for friends by username</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 text-stone-400 text-sm">
          No users found for &ldquo;{query}&rdquo;
        </div>
      )}

      <div className="flex flex-col gap-3">
        {results.map((profile) => (
          <Link
            key={profile.id}
            href={`/u/${profile.username}`}
            className="flex items-center gap-3 bg-white border border-stone-100 p-4 hover:border-stone-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-600 flex-shrink-0">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">@{profile.username}</p>
              {profile.full_name && (
                <p className="text-xs text-stone-400">{profile.full_name}</p>
              )}
              {profile.bio && (
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{profile.bio}</p>
              )}
            </div>
            <span className="ml-auto text-xs text-stone-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
