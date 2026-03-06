'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bio, setBio] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setBio(data.bio ?? '')
        setIsPrivate(data.is_private ?? false)
      }
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null, is_private: isPrivate })
      .eq('id', profile.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!profile) {
    return <div className="max-w-lg mx-auto px-4 py-8 text-sm text-stone-400">Loading…</div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Username</label>
          <p className="text-sm text-stone-500 bg-stone-50 border border-stone-200 px-3 py-2">
            @{profile.username}
          </p>
          <p className="text-xs text-stone-400 mt-1">Username cannot be changed</p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-stone-700 mb-1.5">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself..."
            rows={3}
            maxLength={160}
            className="w-full px-3 py-2 border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-300 bg-white resize-none"
          />
          <p className="text-xs text-stone-400 mt-1 text-right">{bio.length}/160</p>
        </div>

        <div className="flex items-start justify-between gap-4 py-3 border-t border-stone-100">
          <div>
            <p className="text-sm font-medium text-stone-700">Private shelf</p>
            <p className="text-xs text-stone-400 mt-0.5">Only your followers can see your shelf</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${isPrivate ? '' : 'bg-stone-200'}`}
            style={isPrivate ? { background: '#F01672' } : undefined}
            aria-checked={isPrivate}
            role="switch"
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ background: '#F01672' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
