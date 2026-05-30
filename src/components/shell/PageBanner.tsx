import type { ReactNode } from 'react'

interface PageBannerProps {
  title: string
  subline?: string
  actions?: ReactNode   // Optional right-side actions (buttons, status)
  variant?: 'default' | 'compact'
}

export function PageBanner({ title, subline, actions, variant = 'default' }: PageBannerProps) {
  const padding = variant === 'compact' ? 'py-5' : 'py-7'
  
  return (
    <div className={`relative bg-primary text-white px-8 ${padding} rounded-2xl overflow-hidden shadow-soft`}>
      {/* Yellow left accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" aria-hidden="true" />
      
      <div className="flex items-start justify-between gap-6 pl-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] font-bold tracking-tight leading-tight">
            {title}
          </h1>
          {subline && (
            <p className="mt-1.5 text-[14px] text-white/85 leading-relaxed">
              {subline}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
