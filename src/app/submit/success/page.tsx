import Link from 'next/link'

export default function SubmitSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">✦</p>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">Product submitted!</h1>
        <p className="text-sm text-stone-500 mb-6">
          Thanks for contributing. We&apos;ll review it and add it to the catalog soon.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/search"
            className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ background: '#F01672' }}
          >
            Back to search
          </Link>
          <Link
            href="/shelf"
            className="px-4 py-2 text-sm border border-stone-200 text-stone-700 rounded-lg hover:border-stone-400 transition-colors"
          >
            My shelf
          </Link>
        </div>
      </div>
    </div>
  )
}
