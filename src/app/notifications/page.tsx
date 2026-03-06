'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Notification } from '@/lib/types'

function notificationText(n: Notification): string {
  switch (n.type) {
    case 'follow': return 'followed you'
    case 'save': return `saved ${n.shelf_item?.product?.name ?? 'a product'} from your shelf`
    case 'comment': return `commented on ${n.shelf_item?.product?.name ?? 'your product'}`
    case 'reply': return `replied to your comment on ${n.shelf_item?.product?.name ?? 'a product'}`
    default: return ''
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setLoading(false)
      // Mark all read
      fetch('/api/notifications', { method: 'PATCH' })
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Notifications</h1>

      {loading && (
        <div className="text-center py-16 text-stone-400 text-sm">Loading…</div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">Nothing here yet</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 border-b border-stone-100 ${!n.read_at ? 'bg-white' : ''}`}
          >
            <Link href={`/u/${n.actor?.username}`} className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">
                {n.actor?.username?.charAt(0).toUpperCase()}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-700">
                <Link href={`/u/${n.actor?.username}`} className="font-medium text-stone-900 hover:underline">
                  @{n.actor?.username}
                </Link>
                {' '}{notificationText(n)}
              </p>
              <time className="text-xs text-stone-400">
                {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </time>
            </div>

            {!n.read_at && (
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#F01672' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
