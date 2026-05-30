import { useState, useMemo } from 'react'
import { Modal } from '../primitives/Modal'
import { Icon } from '../primitives/Icon'
import { useParameters, PARAMETER_CATEGORIES } from '../../lib/parameters'
import type { Parameter } from '../../types/parameter'

export function ParameterPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (p: Parameter) => void
}) {
  const { parameters } = useParameters()
  const [query, setQuery] = useState('')
  const [categoryTab, setCategoryTab] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: parameters.length }
    PARAMETER_CATEGORIES.forEach((c) => {
      map[c.key] = parameters.filter((p) => p.category === c.key).length
    })
    return map
  }, [parameters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (p: Parameter) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q)
      
    const matchesCategory = (p: Parameter) => categoryTab === 'all' || p.category === categoryTab
    return parameters.filter((p) => matchesQuery(p) && matchesCategory(p))
  }, [parameters, query, categoryTab])

  const selectedParam = parameters.find((p) => p.id === selectedId)

  // Reset selection if it gets filtered out
  useMemo(() => {
    if (selectedId && !filtered.find((p) => p.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick from parameter library"
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border hairline bg-white text-[13px] font-medium text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedParam && onSelect(selectedParam)}
            disabled={!selectedParam}
            className="px-4 py-2 rounded-md bg-accent-light text-text-secondary text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use this parameter
          </button>
        </>
      }
    >
      <div className="-mx-6 -mt-2">
        {/* Search */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border hairline bg-white focus-within:border-primary transition-colors">
            <Icon name="search" className="w-4 h-4 text-text-secondary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, or prompt…"
              className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-secondary outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-text-secondary hover:text-text-primary transition-colors">
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 pb-2 flex items-center gap-1 overflow-x-auto hide-scrollbar border-b hairline">
          <button
            onClick={() => setCategoryTab('all')}
            className={`px-3 py-2 border-b-2 transition-colors text-[13px] font-medium whitespace-nowrap ${ categoryTab === 'all' ? 'border-text-secondary/15 text-text-primary ' : 'border-transparent text-text-secondary hover:text-text-primary ' }`}
          >
            All <span className="ml-1.5 text-[10px] font-mono opacity-60">{counts.all}</span>
          </button>
          {PARAMETER_CATEGORIES.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryTab(tab.key)}
              className={`px-3 py-2 border-b-2 transition-colors text-[13px] font-medium whitespace-nowrap flex items-center gap-2 ${ categoryTab === tab.key ? 'border-text-secondary/15 text-text-primary ' : 'border-transparent text-text-secondary hover:text-text-primary ' }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.accent}`} />
              {tab.label} <span className="text-[10px] font-mono opacity-60">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="h-[360px] overflow-y-auto bg-accent-light/30">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-secondary">
              No parameters found matching your criteria.
            </div>
          ) : (
            <ul className="divide-y hairline">
              {filtered.map((p) => (
                <ParameterRow
                  key={p.id}
                  parameter={p}
                  selected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                  onDoubleClick={() => onSelect(p)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ParameterRow({
  parameter,
  selected,
  onSelect,
  onDoubleClick,
}: {
  parameter: Parameter
  selected: boolean
  onSelect: () => void
  onDoubleClick: () => void
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        className={`w-full px-6 py-3 flex items-start gap-4 text-left transition-colors ${ selected ? 'bg-accent-50 ' : 'hover:bg-accent-light ' }`}
      >
        <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border hairline flex items-center justify-center ${ selected ? 'bg-primary border-primary' : 'bg-white ' }`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-[14px] font-medium truncate ${selected ? 'text-primary ' : 'text-text-primary '}`}>
              {parameter.name}
            </span>
            <span className="text-[10px] font-mono text-text-secondary">{parameter.code}</span>
          </div>
          <div className="mt-0.5 text-[12px] text-text-secondary line-clamp-1">
            {parameter.prompt}
          </div>
        </div>

        <div className="shrink-0 text-right space-y-1">
          <div>
            <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-white border hairline">
              {parameter.type === 'pass_fail_na' ? 'P/F/NA' : parameter.type === 'numeric' ? 'NUM' : parameter.type === 'single_select' ? 'SEL' : 'TXT'}
            </span>
          </div>
        </div>
      </button>
    </li>
  )
}
