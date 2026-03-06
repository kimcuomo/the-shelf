'use client'

export default function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number | null
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${sizeClass} transition-transform ${onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span className={value !== null && star <= value ? 'text-amber-400' : 'text-stone-200'}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}
