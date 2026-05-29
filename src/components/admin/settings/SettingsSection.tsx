import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../../primitives/Icon'

export function SettingsSection({
  id,
  title,
  description,
  isDirty,
  onSave,
  onDiscard,
  children,
}: {
  id: string
  title: ReactNode
  description: string
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
  children: ReactNode
}) {
  const [showSaved, setShowSaved] = useState(false)

  const handleSave = () => {
    onSave()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-6">
        <h2 className="font-display text-[26px] tracking-tight text-ink-900 dark:text-ink-50">
          {title}
        </h2>
        <p className="mt-2 text-[14px] text-ink-500 dark:text-ink-400 max-w-[560px]">
          {description}
        </p>
      </div>

      <div className="space-y-8">
        {children}
      </div>

      <div className="mt-8 flex items-center gap-3 pt-6 border-t border-ink-100 dark:border-ink-800">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="btn-primary px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
        >
          Save changes
        </button>
        {isDirty && (
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            Discard changes
          </button>
        )}
        {showSaved && !isDirty && (
          <div className="flex items-center gap-1.5 text-signal-green text-[13px] font-medium animate-fade-in ml-2">
            <Icon name="check" className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>
    </section>
  )
}

export function SettingsField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr] gap-4 sm:gap-8 items-start">
      <div>
        <label className="block text-[13px] font-medium text-ink-900 dark:text-ink-50">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-[12px] text-ink-500 dark:text-ink-400">
            {description}
          </p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
