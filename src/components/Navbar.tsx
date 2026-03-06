'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function Navbar({ profile, unreadCount = 0 }: { profile: Profile | null; unreadCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleSignout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        pathname.startsWith(href)
          ? 'font-medium'
          : 'text-stone-500 hover:text-stone-800'
      }`}
      style={pathname.startsWith(href) ? { color: '#F01672' } : undefined}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-40 bg-[#faf9f7]/90 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl"
          style={{ fontFamily: 'var(--font-dancing)', color: '#F01672', letterSpacing: '-0.3px' }}
        >
          the shelf
        </Link>

        <div className="flex items-center gap-6">
          {navLink('/search', 'Search')}

          {profile ? (
            <>
              {navLink('/feed', 'Feed')}
              {navLink('/shelf', 'My Shelf')}
              {navLink('/people', 'People')}
              <Link
                href="/notifications"
                className={`relative text-sm transition-colors ${
                  pathname.startsWith('/notifications') ? 'font-medium' : 'text-stone-500 hover:text-stone-800'
                }`}
                style={pathname.startsWith('/notifications') ? { color: '#F01672' } : undefined}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-medium" style={{ background: '#F01672' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ background: '#F01672' }}>
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-40">
                      <Link
                        href={`/u/${profile.username}`}
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        @{profile.username}
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      {profile.is_admin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <div className="border-t border-stone-100 my-1" />
                      <button
                        onClick={handleSignout}
                        className="w-full text-left px-4 py-2 text-sm text-stone-500 hover:bg-stone-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm text-white px-4 py-1.5 transition-colors hover:opacity-90"
                style={{ background: '#F01672' }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
