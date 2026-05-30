import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** Max width: 'sm' (380px), 'md' (480px), 'lg' (640px). Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg'
  /** Footer is right-aligned by default. */
  footer?: ReactNode
  /** If true (default), clicking the backdrop closes. Set false for forms with unsaved data. */
  dismissOnBackdrop?: boolean
  children: ReactNode
}

const SIZE_MAP = {
  sm: 'max-w-[380px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  dismissOnBackdrop = true,
  children,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Escape to close + body scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  // Focus the card when opening so keyboard users land inside
  useEffect(() => {
    if (open && cardRef.current) {
      // Defer to ensure DOM has the element
      requestAnimationFrame(() => cardRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        onClick={() => dismissOnBackdrop && onClose()}
        className="absolute inset-0 bg-accent-light/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className={`relative w-full ${SIZE_MAP[size]} bg-white border border-text-secondary/15 rounded-2xl shadow-2xl overflow-hidden focus:outline-none animate-fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-text-secondary/15 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="font-sans text-[22px] font-bold leading-tight tracking-tight text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-[13px] leading-relaxed text-text-secondary"
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-md border border-text-secondary/15 flex items-center justify-center text-text-secondary hover:bg-accent-light hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-text-secondary/15 bg-accent-light/50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
