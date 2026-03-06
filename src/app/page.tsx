import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/shelf')
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="min-h-[85vh] flex flex-col items-center justify-center text-center py-16">

        {/* Mirror — horizontal rectangle */}
        <div
          className="relative mb-10 w-full max-w-xl"
          style={{
            padding: '10px',
            background: 'linear-gradient(145deg, #f2f2f2 0%, #d8d8d8 20%, #b8b8b8 38%, #c8c8c8 50%, #dedede 68%, #f5f5f5 88%, #d2d2d2 100%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 30px 70px rgba(0,0,0,0.22), 0 10px 25px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Mirror interior */}
          <div
            className="flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #e8edf3 0%, #d8e2ec 18%, #cdd8e5 35%, #c8d4e2 50%, #d2dce8 65%, #dde5ee 82%, #e6ecf3 100%)',
              padding: '48px 40px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Reflection shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 45%, rgba(255,255,255,0.06) 65%, transparent 100%)',
              }}
            />
            {/* Lipstick text */}
            <span
              className="relative select-none"
              style={{
                fontFamily: 'var(--font-dancing)',
                fontSize: 'clamp(52px, 10vw, 80px)',
                color: '#F01672',
                textShadow: '0 0 28px rgba(240,22,114,0.28), 0 2px 8px rgba(240,22,114,0.2)',
                lineHeight: 1.1,
              }}
            >
              the shelf
            </span>
            <p
              className="relative mt-3 text-[10px] uppercase tracking-[0.28em]"
              style={{ color: 'rgba(100,120,140,0.65)' }}
            >
              your beauty routine, curated
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap items-center justify-center mb-16">
          <Link
            href="/auth/signup"
            className="px-6 py-2.5 text-white text-sm font-medium hover:opacity-90 transition-colors"
            style={{ background: '#F01672' }}
          >
            Get started
          </Link>
          <Link
            href="/search"
            className="px-6 py-2.5 border border-stone-200 text-stone-700 text-sm font-medium hover:border-stone-400 transition-colors"
          >
            Browse products
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl text-left">
          {[
            {
              icon: '✦',
              title: 'Build your shelf',
              desc: 'Track everything you use and love, with ratings and notes.',
            },
            {
              icon: '◎',
              title: 'Follow friends',
              desc: "See what's on their shelves and save products you want to try.",
            },
            {
              icon: '→',
              title: 'Shop with confidence',
              desc: 'Tap any product to buy it directly from the brand or retailer.',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white border border-stone-100 p-5">
              <p className="text-xl mb-3 text-pink">{feature.icon}</p>
              <p className="font-medium text-stone-900 mb-1 text-sm">{feature.title}</p>
              <p className="text-xs text-stone-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
