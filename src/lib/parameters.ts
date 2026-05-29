import { useCallback, useEffect, useState } from 'react'
import type { Parameter } from '../types/parameter'

const STORAGE_KEY = 'ims-parameters-v1'

/* ============================================================
 * Category metadata
 * ============================================================ */

export const PARAMETER_CATEGORIES = [
  { key: 'Temperature', label: 'Temperature', accent: 'bg-signal-red' },
  { key: 'Sanitation',  label: 'Sanitation',  accent: 'bg-signal-green' },
  { key: 'Allergen',    label: 'Allergen',    accent: 'bg-signal-amber' },
  { key: 'Mechanical',  label: 'Mechanical',  accent: 'bg-accent-700' },
  { key: 'GMP',         label: 'GMP',         accent: 'bg-accent-500' },
  { key: 'Other',       label: 'Other',       accent: 'bg-ink-700 dark:bg-ink-200' },
] as const

/* ============================================================
 * Seed parameters
 * ============================================================ */

const NOW = Date.now()
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

const SEED_PARAMETERS: Parameter[] = [
  // Temperature
  {
    id: 'param_fill_temp',
    name: 'CCP-2 Filling temperature',
    code: 'FILL-TEMP',
    prompt: 'Filling temperature reading',
    type: 'numeric',
    category: 'Temperature',
    numericMin: 72,
    numericMax: 76,
    numericUnit: '°C',
    observationRequiredOnFail: true,
    photoRequired: false,
    description: 'Hot-fill critical limit temperature check for bottling operations.',
    tags: ['ccp', 'hot-fill', 'critical'],
    ownerId: 'usr_rahul_iyer',
    ownerName: 'Rahul Iyer',
    createdAt: days(400),
    updatedAt: days(400),
  },
  {
    id: 'param_pasteurizer_temp',
    name: 'Pasteurizer holding tube temperature',
    code: 'PAST-TEMP',
    prompt: 'Pasteurizer holding tube temperature',
    type: 'numeric',
    category: 'Temperature',
    numericMin: 80,
    numericMax: 85,
    numericUnit: '°C',
    observationRequiredOnFail: true,
    photoRequired: false,
    description: 'High-temperature short-time (HTST) pasteurization reading.',
    tags: ['ccp', 'pasteurization'],
    ownerId: 'usr_rahul_iyer',
    ownerName: 'Rahul Iyer',
    createdAt: days(380),
    updatedAt: days(380),
  },
  {
    id: 'param_cold_store_temp',
    name: 'Cold storage ambient temperature',
    code: 'COLD-AMB',
    prompt: 'Cold storage ambient temperature',
    type: 'numeric',
    category: 'Temperature',
    numericMin: 2,
    numericMax: 5,
    numericUnit: '°C',
    observationRequiredOnFail: true,
    photoRequired: true,
    description: 'Ambient temperature check for raw material cold storage.',
    tags: ['storage', 'prp'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(365),
    updatedAt: days(365),
  },

  // Sanitation
  {
    id: 'param_atp_filler',
    name: 'Sanitation ATP swab — Filler head',
    code: 'ATP-FILL',
    prompt: 'Sanitation verification ATP swab — Filler head',
    type: 'numeric',
    category: 'Sanitation',
    numericMin: 0,
    numericMax: 30,
    numericUnit: 'RLU',
    observationRequiredOnFail: true,
    photoRequired: false,
    reference: 'HACCP plan § 5.1',
    description: 'ATP verification swab for filler head surfaces after CIP.',
    tags: ['atp', 'sanitation', 'pre-op'],
    ownerId: 'usr_arjun_sharma',
    ownerName: 'Arjun Sharma',
    createdAt: days(200),
    updatedAt: days(200),
  },
  {
    id: 'param_atp_mix_tank',
    name: 'Sanitation ATP swab — Mix tank',
    code: 'ATP-TANK',
    prompt: 'Sanitation verification ATP swab — Mix tank',
    type: 'numeric',
    category: 'Sanitation',
    numericMin: 0,
    numericMax: 30,
    numericUnit: 'RLU',
    observationRequiredOnFail: true,
    photoRequired: false,
    description: 'ATP verification swab for interior mix tank walls.',
    tags: ['atp', 'sanitation', 'tank'],
    ownerId: 'usr_arjun_sharma',
    ownerName: 'Arjun Sharma',
    createdAt: days(195),
    updatedAt: days(195),
  },
  {
    id: 'param_cip_concentration',
    name: 'CIP caustic concentration',
    code: 'CIP-CAUS',
    prompt: 'Caustic concentration within specification (1.5-2.5%)',
    type: 'pass_fail_na',
    category: 'Sanitation',
    observationRequiredOnFail: true,
    photoRequired: false,
    description: 'Verification that CIP caustic dosing is within the validated range.',
    tags: ['cip', 'chemical'],
    ownerId: 'usr_arjun_sharma',
    ownerName: 'Arjun Sharma',
    createdAt: days(190),
    updatedAt: days(190),
  },

  // Allergen
  {
    id: 'param_lfd_allergen',
    name: 'Allergen rapid test (LFD)',
    code: 'LFD-TEST',
    prompt: 'Allergen-specific rapid test (LFD) result',
    type: 'single_select',
    category: 'Allergen',
    options: ['Negative', 'Positive', 'Invalid'],
    observationRequiredOnFail: true,
    photoRequired: true,
    description: 'Lateral flow device qualitative result for allergen residue.',
    tags: ['allergen', 'rapid-test', 'changeover'],
    ownerId: 'usr_rahul_iyer',
    ownerName: 'Rahul Iyer',
    createdAt: days(100),
    updatedAt: days(100),
  },
  {
    id: 'param_allergen_label',
    name: 'Allergen label control check',
    code: 'ALG-LBL',
    prompt: 'Applied labels match the current product allergen profile',
    type: 'pass_fail_na',
    category: 'Allergen',
    observationRequiredOnFail: true,
    photoRequired: true,
    description: 'Verification that the correct allergen declarations are on the packaging line.',
    tags: ['allergen', 'packaging', 'label'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(95),
    updatedAt: days(95),
  },

  // Mechanical
  {
    id: 'param_metal_detector_fe',
    name: 'Metal detector check (Fe 1.5mm)',
    code: 'MD-FE-1.5',
    prompt: 'Fe test piece (1.5mm) detected and rejected',
    type: 'pass_fail_na',
    category: 'Mechanical',
    observationRequiredOnFail: true,
    photoRequired: true,
    reference: 'SOP-PROD-009',
    description: 'Verification of metal detector rejection using a 1.5mm Ferrous test piece.',
    tags: ['ccp', 'metal-detector', 'mechanical'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(80),
    updatedAt: days(80),
  },
  {
    id: 'param_metal_detector_nonfe',
    name: 'Metal detector check (Non-Fe 2.0mm)',
    code: 'MD-NF-2.0',
    prompt: 'Non-Fe test piece (2.0mm) detected and rejected',
    type: 'pass_fail_na',
    category: 'Mechanical',
    observationRequiredOnFail: true,
    photoRequired: true,
    description: 'Verification of metal detector rejection using a 2.0mm Non-Ferrous test piece.',
    tags: ['ccp', 'metal-detector', 'mechanical'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(80),
    updatedAt: days(80),
  },

  // GMP
  {
    id: 'param_gmp_hair_net',
    name: 'GMP Hair net compliance',
    code: 'GMP-HAIR',
    prompt: 'Hair cover applied, covering all hair including ears',
    type: 'pass_fail_na',
    category: 'GMP',
    observationRequiredOnFail: true,
    photoRequired: true,
    description: 'Basic GMP check for proper donning of hair nets.',
    tags: ['gmp', 'ppe', 'gowning'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(300),
    updatedAt: days(300),
  },
  {
    id: 'param_gmp_hand_wash',
    name: 'GMP Hand wash compliance',
    code: 'GMP-WASH',
    prompt: 'Hand wash and sanitization complete before entering production',
    type: 'pass_fail_na',
    category: 'GMP',
    observationRequiredOnFail: true,
    photoRequired: false,
    reference: 'SOP-QA-001',
    description: 'Basic GMP check for entry hand washing protocol.',
    tags: ['gmp', 'hygiene'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(295),
    updatedAt: days(295),
  }
]

/* ============================================================
 * Storage with light migration
 * ============================================================ */

function loadFromStorage(): Parameter[] {
  if (typeof window === 'undefined') return SEED_PARAMETERS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Parameter[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    return SEED_PARAMETERS
  } catch {
    return SEED_PARAMETERS
  }
}

function saveToStorage(parameters: Parameter[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parameters))
  } catch { /* ignore */ }
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseParametersApi {
  parameters: Parameter[]
  getById: (id: string) => Parameter | undefined
  getByCategory: () => Record<string, Parameter[]>
  add: (parameter: Parameter) => void
  update: (id: string, patch: Partial<Parameter>) => void
  remove: (id: string) => void
  duplicate: (id: string, byId: string, byName: string) => Parameter | null
  reset: () => void
}

export function useParameters(): UseParametersApi {
  const [parameters, setParameters] = useState<Parameter[]>(loadFromStorage)

  useEffect(() => { saveToStorage(parameters) }, [parameters])

  const getById = useCallback(
    (id: string) => parameters.find((p) => p.id === id),
    [parameters]
  )

  const getByCategory = useCallback(() => {
    const grouped: Record<string, Parameter[]> = {}
    // Initialize groups for known categories to ensure order
    PARAMETER_CATEGORIES.forEach(c => grouped[c.key] = [])
    parameters.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = []
      grouped[p.category].push(p)
    })
    return grouped
  }, [parameters])

  const add = useCallback((parameter: Parameter) => {
    setParameters((prev) => [parameter, ...prev])
  }, [])

  const update = useCallback((id: string, patch: Partial<Parameter>) => {
    setParameters((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return { ...p, ...patch, updatedAt: new Date().toISOString() }
      })
    )
  }, [])

  const remove = useCallback((id: string) => {
    setParameters((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const duplicate = useCallback((id: string, byId: string, byName: string): Parameter | null => {
    const original = parameters.find((p) => p.id === id)
    if (!original) return null
    const newId = genId('param')
    const now = new Date().toISOString()
    const copy: Parameter = {
      ...original,
      id: newId,
      name: `${original.name} (copy)`,
      code: `${original.code}-COPY`,
      createdAt: now,
      updatedAt: now,
      ownerId: byId,
      ownerName: byName,
    }
    setParameters((prev) => [copy, ...prev])
    return copy
  }, [parameters])

  const reset = useCallback(() => setParameters(SEED_PARAMETERS), [])

  return {
    parameters,
    getById,
    getByCategory,
    add,
    update,
    remove,
    duplicate,
    reset,
  }
}
