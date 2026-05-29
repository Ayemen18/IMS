interface WordmarkProps {
  variant?: 'default' | 'small' | 'large'
  className?: string
}

export function Wordmark({ variant = 'default', className = '' }: WordmarkProps) {
  const heightClass = variant === 'small' ? 'h-6' : variant === 'large' ? 'h-10' : 'h-7'

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/inspectsphere-logo.png"
        alt="InspectSphere"
        className={`${heightClass} w-auto`}
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement | null
          if (fallback) fallback.style.display = 'inline'
        }}
      />
      <span
        style={{ display: 'none' }}
        className="font-display text-[18px] font-medium text-ink-900 dark:text-ink-50 whitespace-nowrap"
      >
        InspectSphere
      </span>
    </span>
  )
}
