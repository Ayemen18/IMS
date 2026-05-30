import { useCallback, useEffect, useState } from 'react'
import type {
  Template,
  TemplateStatus,
  InspectionTypeKey,
  TemplateVersionChange,
} from '../types/template'
import { getItemCount } from '../types/template'

const STORAGE_KEY = 'ims-templates-v2'  // bumped key — schema changed
const LEGACY_KEY = 'ims-templates-v1'

/* ============================================================
 * Inspection type metadata
 * ============================================================ */

export const INSPECTION_TYPES: Record<
  InspectionTypeKey,
  { key: InspectionTypeKey; label: string; shortLabel: string; accent: string }
> = {
  gmp:         { key: 'gmp',         label: 'GMP',                shortLabel: 'GMP',        accent: 'bg-primary' },
  haccp:       { key: 'haccp',       label: 'HACCP',              shortLabel: 'HACCP',      accent: 'bg-warning' },
  safety_walk: { key: 'safety_walk', label: 'Safety walkthrough', shortLabel: 'Safety',     accent: 'bg-status-fail' },
  sanitation:  { key: 'sanitation',  label: 'Sanitation',         shortLabel: 'Sanitation', accent: 'bg-status-pass' },
  allergen:    { key: 'allergen',    label: 'Allergen control',   shortLabel: 'Allergen',   accent: 'bg-primary' },
  custom:      { key: 'custom',      label: 'Custom',             shortLabel: 'Custom',     accent: 'bg-accent-light ' },
}

/* ============================================================
 * Seed templates
 * Note: each seed template has baseTemplateId === id (no version lineage yet)
 * and a single 'created' changelog entry.
 * ============================================================ */

const NOW = Date.now()
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

function makeSeedChangelog(byName: string, byId: string, at: string): TemplateVersionChange[] {
  return [{
    id: `chg_${at.replace(/[^0-9]/g, '').slice(0, 14)}`,
    at,
    byId,
    byName,
    action: 'created',
    note: 'Initial version',
  }]
}

const SEED_TEMPLATES: Template[] = [
  {
    id: 'tpl_haccp_ccp_daily',
    baseTemplateId: 'tpl_haccp_ccp_daily',
    name: 'Daily CCP verification — Line 3',
    summary:
      'End-of-shift verification of critical control points on Line 3 bottling. Captures temperatures, metal detection, and allergen checks as defined in the HACCP plan rev. 4.2.',
    inspectionType: 'haccp',
    status: 'published',
    version: '4.2',
    siteIds: ['site_mumbai', 'site_pune'],
    tags: ['daily', 'shift-end', 'line-3', 'critical'],
    ownerId: 'usr_rahul_iyer',
    ownerName: 'Rahul Iyer',
    createdAt: days(412),
    updatedAt: days(8),
    itemCount: 0,
    changelog: makeSeedChangelog('Rahul Iyer', 'usr_rahul_iyer', days(412)),
    sections: [
      {
        id: 'sec_pre_op',
        title: 'Pre-operational checks',
        description: 'Complete before line start-up. All items must pass.',
        items: [
          { id: 'itm_1', prompt: 'Allergen changeover sign-off present and signed by shift QA', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true, reference: 'SOP-QA-014 § 3.2' },
          { id: 'itm_2', prompt: 'Sanitation verification ATP swab — Filler head', type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 0, numericMax: 30, numericUnit: 'RLU', reference: 'HACCP plan § 5.1' },
          { id: 'itm_3', prompt: 'Conveyor belt visual inspection — debris, residue, condensation', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        ],
      },
      {
        id: 'sec_ccp_2',
        title: 'CCP-2 · Filling temperature',
        description: 'Critical limit: 72°C–76°C. Readings every 30 minutes.',
        items: [
          { id: 'itm_4', prompt: 'Reading 1 (T+00:00)', type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 72, numericMax: 76, numericUnit: '°C', parameterRef: 'param_fill_temp' },
          { id: 'itm_5', prompt: 'Reading 2 (T+00:30)', type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 72, numericMax: 76, numericUnit: '°C', parameterRef: 'param_fill_temp' },
          { id: 'itm_6', prompt: 'Reading 3 (T+01:00)', type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 72, numericMax: 76, numericUnit: '°C', parameterRef: 'param_fill_temp' },
        ],
      },
      {
        id: 'sec_ccp_3',
        title: 'CCP-3 · Metal detector verification',
        description: 'Test pieces (Fe, non-Fe, SUS) at start, mid, and end of shift.',
        items: [
          { id: 'itm_7',  prompt: 'Fe test piece (1.5mm) detected and rejected',       type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true, reference: 'SOP-PROD-009' },
          { id: 'itm_8',  prompt: 'Non-Fe test piece (2.0mm) detected and rejected',   type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
          { id: 'itm_9',  prompt: 'SUS test piece (2.5mm) detected and rejected',      type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
          { id: 'itm_10', prompt: 'Reject mechanism functional test',                  type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        ],
      },
      {
        id: 'sec_signoff',
        title: 'Sign-off',
        items: [
          { id: 'itm_11', prompt: 'Inspector confirms all CCPs within critical limits', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
          { id: 'itm_12', prompt: 'Shift comments and observations',                    type: 'text',         observationRequiredOnFail: false, photoRequired: false, required: false },
        ],
      },
    ],
  },
  {
    id: 'tpl_gmp_gowning',
    baseTemplateId: 'tpl_gmp_gowning',
    name: 'GMP — Gowning audit, Cleanroom B',
    summary: 'Weekly aseptic gowning audit for ISO 8 cleanroom personnel. Verifies gowning sequence, garment integrity, and behavioral compliance per Annex 1.',
    inspectionType: 'gmp',
    status: 'published',
    version: '2.0',
    siteIds: ['site_mumbai'],
    tags: ['weekly', 'cleanroom', 'aseptic'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(287),
    updatedAt: days(34),
    itemCount: 0,
    changelog: makeSeedChangelog('Maya Chen', 'usr_maya_chen', days(287)),
    sections: [
      { id: 'sec_gown_seq', title: 'Gowning sequence', items: [
        { id: 'g1', prompt: 'Hand wash and sanitization complete before gowning', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true, reference: 'Annex 1 § 7.13' },
        { id: 'g2', prompt: 'Hair cover applied first, covers all hair',         type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'g3', prompt: 'Mouth and beard cover applied, no exposed skin',    type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'g4', prompt: 'Sterile suit donned without touching exterior',     type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'g5', prompt: 'Boots / shoe covers donned correctly',              type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'g6', prompt: 'Sterile gloves donned last, cover suit cuffs',      type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
      ]},
      { id: 'sec_integrity', title: 'Garment integrity', items: [
        { id: 'g7', prompt: 'No tears, snags, or contamination visible on suit', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 'g8', prompt: 'Glove integrity check (visual + sterility seal)',   type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
      { id: 'sec_behavior', title: 'Behavior in cleanroom', items: [
        { id: 'g9',  prompt: 'Movements slow and deliberate, no rapid gestures',     type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'g10', prompt: 'No touching of face, hair, or non-sterile surfaces',   type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'g11', prompt: 'Auditor notes',                                        type: 'text',         observationRequiredOnFail: false, photoRequired: false, required: false },
      ]},
    ],
  },
  {
    id: 'tpl_pre_op_sanitation',
    baseTemplateId: 'tpl_pre_op_sanitation',
    name: 'Pre-operational sanitation — Bottling',
    summary: 'Pre-shift sanitation verification covering CIP cycle records, visual inspection, and ATP swab readings for bottling lines.',
    inspectionType: 'sanitation',
    status: 'published',
    version: '3.1',
    siteIds: ['site_pune'],
    tags: ['shift-start', 'bottling', 'cip'],
    ownerId: 'usr_arjun_sharma',
    ownerName: 'Arjun Sharma',
    createdAt: days(198),
    updatedAt: days(12),
    itemCount: 0,
    changelog: makeSeedChangelog('Arjun Sharma', 'usr_arjun_sharma', days(198)),
    sections: [
      { id: 's1', title: 'CIP records review', items: [
        { id: 's1i1', prompt: 'CIP cycle completed within last 12 hours',     type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 's1i2', prompt: 'CIP temperature curve within spec',            type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 's1i3', prompt: 'Caustic and acid concentrations logged',       type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
      { id: 's2', title: 'Visual inspection', items: [
        { id: 's2i1', prompt: 'Filler bowl free of residue and condensation', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 's2i2', prompt: 'Conveyor belt visually clean',                 type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
      ]},
      { id: 's3', title: 'ATP verification', items: [
        { id: 's3i1', prompt: 'Swab 1 — Filler head', type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 0, numericMax: 30, numericUnit: 'RLU' },
        { id: 's3i2', prompt: 'Swab 2 — Capper',      type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 0, numericMax: 30, numericUnit: 'RLU' },
        { id: 's3i3', prompt: 'Swab 3 — Conveyor',    type: 'numeric', observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 0, numericMax: 30, numericUnit: 'RLU' },
      ]},
    ],
  },
  {
    id: 'tpl_allergen_changeover',
    baseTemplateId: 'tpl_allergen_changeover',
    name: 'Allergen changeover verification',
    summary: 'Validation of allergen changeover between production runs. Confirms cleaning records, swab results, and label control.',
    inspectionType: 'allergen',
    status: 'draft',
    version: '0.3',
    siteIds: ['site_pune', 'site_hyderabad'],
    tags: ['changeover', 'allergen'],
    ownerId: 'usr_rahul_iyer',
    ownerName: 'Rahul Iyer',
    createdAt: days(21),
    updatedAt: days(2),
    itemCount: 0,
    changelog: makeSeedChangelog('Rahul Iyer', 'usr_rahul_iyer', days(21)),
    sections: [
      { id: 'a1', title: 'Pre-changeover', items: [
        { id: 'a1i1', prompt: 'Previous allergen identified and documented',  type: 'text',         observationRequiredOnFail: false, photoRequired: false, required: true },
        { id: 'a1i2', prompt: 'Cleaning record signed off by supervisor',     type: 'pass_fail_na', observationRequiredOnFail: true,  photoRequired: true,  required: true },
      ]},
      { id: 'a2', title: 'Verification', items: [
        { id: 'a2i1', prompt: 'ATP swab — Mix tank',                          type: 'numeric',       observationRequiredOnFail: true, photoRequired: false, required: true, numericMin: 0, numericMax: 30, numericUnit: 'RLU' },
        { id: 'a2i2', prompt: 'Allergen-specific rapid test (LFD) result',    type: 'single_select', observationRequiredOnFail: true, photoRequired: true,  required: true, options: ['Negative', 'Positive', 'Invalid'] },
      ]},
    ],
  },
  {
    id: 'tpl_safety_walk',
    baseTemplateId: 'tpl_safety_walk',
    name: 'Safety walkthrough — Production floor',
    summary: 'Weekly safety walk covering PPE, walkways, emergency equipment, and reportable near-misses.',
    inspectionType: 'safety_walk',
    status: 'published',
    version: '1.4',
    siteIds: [],
    tags: ['weekly', 'safety', 'ppe'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(156),
    updatedAt: days(45),
    itemCount: 0,
    changelog: makeSeedChangelog('Anika Sharma', 'usr_anika_sharma', days(156)),
    sections: [
      { id: 'sw1', title: 'Personal protective equipment', items: [
        { id: 'sw1i1', prompt: 'All personnel wearing required PPE for area',    type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'sw1i2', prompt: 'PPE in good condition, no visible damage',       type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
      ]},
      { id: 'sw2', title: 'Walkways and signage', items: [
        { id: 'sw2i1', prompt: 'Walkways clear of obstructions',                 type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'sw2i2', prompt: 'Safety signage visible and legible',             type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
      { id: 'sw3', title: 'Emergency equipment', items: [
        { id: 'sw3i1', prompt: 'Fire extinguishers in place, charged, dated',    type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'sw3i2', prompt: 'Emergency exits unobstructed',                   type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true,  required: true },
        { id: 'sw3i3', prompt: 'Eye wash and shower stations functional',        type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
    ],
  },
  {
    id: 'tpl_safety_ppe',
    baseTemplateId: 'tpl_safety_ppe',
    name: 'PPE compliance audit',
    summary: 'Focused audit on personal protective equipment compliance for high-risk areas.',
    inspectionType: 'safety_walk',
    status: 'published',
    version: '1.0',
    siteIds: ['site_mumbai', 'site_pune'],
    tags: ['safety', 'ppe', 'audit'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(30),
    updatedAt: days(30),
    itemCount: 0,
    changelog: makeSeedChangelog('Anika Sharma', 'usr_anika_sharma', days(30)),
    sections: [
      { id: 'ppe1', title: 'Hearing & Eye Protection', items: [
        { id: 'ppe1i1', prompt: 'Safety glasses worn properly by all staff', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 'ppe1i2', prompt: 'Hearing protection (plugs/muffs) worn in >85dB zones', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
      ]},
      { id: 'ppe2', title: 'Hand & Body Protection', items: [
        { id: 'ppe2i1', prompt: 'Cut-resistant gloves used for handling blades', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 'ppe2i2', prompt: 'High-visibility vests worn in forklift operating areas', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]}
    ],
  },
  {
    id: 'tpl_safety_emergency',
    baseTemplateId: 'tpl_safety_emergency',
    name: 'Emergency equipment monthly check',
    summary: 'Monthly verification of all emergency response equipment including fire extinguishers, spill kits, and AEDs.',
    inspectionType: 'safety_walk',
    status: 'published',
    version: '2.1',
    siteIds: ['site_pune'],
    tags: ['monthly', 'emergency', 'safety'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(120),
    updatedAt: days(15),
    itemCount: 0,
    changelog: makeSeedChangelog('Anika Sharma', 'usr_anika_sharma', days(120)),
    sections: [
      { id: 'emg1', title: 'Fire Safety', items: [
        { id: 'emg1i1', prompt: 'Extinguisher tags current and signed', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 'emg1i2', prompt: 'Fire hose reels unobstructed and accessible', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
      { id: 'emg2', title: 'Medical & Spill', items: [
        { id: 'emg2i1', prompt: 'AED battery status indicator is green', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: true, required: true },
        { id: 'emg2i2', prompt: 'Chemical spill kits fully stocked', type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]}
    ],
  },
  {
    id: 'tpl_safety_near_miss',
    baseTemplateId: 'tpl_safety_near_miss',
    name: 'Near-miss reporting form',
    summary: 'Report form for near-miss incidents, unsafe conditions, and unsafe acts.',
    inspectionType: 'safety_walk',
    status: 'published',
    version: '1.2',
    siteIds: ['site_mumbai', 'site_pune', 'site_hyderabad'],
    tags: ['incident', 'near-miss', 'safety'],
    ownerId: 'usr_anika_sharma',
    ownerName: 'Anika Sharma',
    createdAt: days(200),
    updatedAt: days(60),
    itemCount: 0,
    changelog: makeSeedChangelog('Anika Sharma', 'usr_anika_sharma', days(200)),
    sections: [
      { id: 'nm1', title: 'Incident details', items: [
        { id: 'nm1i1', prompt: 'Describe the near-miss or unsafe condition', type: 'text', observationRequiredOnFail: false, photoRequired: false, required: true },
        { id: 'nm1i2', prompt: 'Severity potential', type: 'single_select', observationRequiredOnFail: false, photoRequired: false, required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
        { id: 'nm1i3', prompt: 'Immediate actions taken to secure area', type: 'text', observationRequiredOnFail: false, photoRequired: false, required: false },
        { id: 'nm1i4', prompt: 'Photos of the condition', type: 'pass_fail_na', observationRequiredOnFail: false, photoRequired: true, required: false },
      ]}
    ],
  },
  {
    id: 'tpl_gmp_old',
    baseTemplateId: 'tpl_gmp_old',
    name: 'GMP — General checklist (legacy)',
    summary: 'Legacy general GMP checklist superseded by site-specific templates in 2024. Retained for audit reference only.',
    inspectionType: 'gmp',
    status: 'archived',
    version: '1.0',
    siteIds: [],
    tags: ['legacy', 'archived'],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: days(720),
    updatedAt: days(180),
    itemCount: 0,
    changelog: makeSeedChangelog('Maya Chen', 'usr_maya_chen', days(720)),
    sections: [
      { id: 'l1', title: 'General GMP', items: [
        { id: 'l1i1', prompt: 'Personnel hygiene compliant with SOP',  type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'l1i2', prompt: 'Facility cleanliness — visual',         type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
        { id: 'l1i3', prompt: 'Equipment status labels current',       type: 'pass_fail_na', observationRequiredOnFail: true, photoRequired: false, required: true },
      ]},
    ],
  },
]

SEED_TEMPLATES.forEach((t) => { t.itemCount = getItemCount(t) })

/* ============================================================
 * Storage with light migration
 * ============================================================ */

function loadFromStorage(): Template[] {
  if (typeof window === 'undefined') return SEED_TEMPLATES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Template[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    // Migrate from v1 if present
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<Template>[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated = parsed.map((t) => migrateFromV1(t as any))
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        window.localStorage.removeItem(LEGACY_KEY)
        return migrated
      }
    }
    return SEED_TEMPLATES
  } catch {
    return SEED_TEMPLATES
  }
}

/** Lift a v1 template (no baseTemplateId / changelog) to the v2 shape. */
function migrateFromV1(t: any): Template {
  return {
    ...t,
    baseTemplateId: t.baseTemplateId ?? t.id,
    changelog:
      t.changelog ??
      [{
        id: `chg_migrated_${t.id}`,
        at: t.createdAt ?? new Date().toISOString(),
        byId: t.ownerId ?? 'usr_unknown',
        byName: t.ownerName ?? 'Unknown',
        action: 'created',
        note: 'Migrated from v1 storage',
      }],
  }
}

function saveToStorage(templates: Template[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch { /* ignore */ }
}

/* ============================================================
 * Version helpers — pure
 * ============================================================ */

/** Parse a version string like "1.4" into [major, minor]. */
function parseVersion(v: string): [number, number] {
  const [maj, min] = v.split('.').map((n) => parseInt(n, 10) || 0)
  return [maj ?? 0, min ?? 0]
}

/** Compute the next version given current version and bump type. */
export function nextVersion(current: string, bump: 'major' | 'minor'): string {
  const [maj, min] = parseVersion(current)
  if (bump === 'major') return `${maj + 1}.0`
  return `${maj}.${min + 1}`
}

/** Compute the version a brand-new draft becomes on first publish (always 1.0). */
function firstPublishVersion(): string {
  return '1.0'
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function makeChangelogEntry(
  action: TemplateVersionChange['action'],
  byId: string,
  byName: string,
  note?: string
): TemplateVersionChange {
  return {
    id: genId('chg'),
    at: new Date().toISOString(),
    byId,
    byName,
    action,
    note,
  }
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface PublishOptions {
  bump: 'major' | 'minor'
  note?: string
  byId: string
  byName: string
}

export interface EditPublishedResult {
  /** The new draft revision created from a published template. */
  draft: Template
}

export interface UseTemplatesApi {
  templates: Template[]
  getById: (id: string) => Template | undefined
  /** Returns all versions in a template's lineage (same baseTemplateId), newest first. */
  getLineage: (baseTemplateId: string) => Template[]
  /** Returns the current published version of a lineage, if any. */
  getCurrentPublished: (baseTemplateId: string) => Template | undefined
  add: (template: Template) => void
  update: (id: string, patch: Partial<Template>) => void
  setStatus: (id: string, status: TemplateStatus) => void
  remove: (id: string) => void
  duplicate: (id: string) => Template | null
  /** Promote a draft to published, supersede any prior published version in the lineage. */
  publish: (id: string, opts: PublishOptions) => Template | null
  /** Create a fresh draft revision from a published template. Doesn't mutate the published one. */
  editPublished: (id: string, byId: string, byName: string) => EditPublishedResult | null
  archive: (id: string, byId: string, byName: string) => void
  restore: (id: string, byId: string, byName: string) => void
  reset: () => void
}

export function useTemplates(): UseTemplatesApi {
  const [templates, setTemplates] = useState<Template[]>(loadFromStorage)

  useEffect(() => { saveToStorage(templates) }, [templates])

  const getById = useCallback(
    (id: string) => templates.find((t) => t.id === id),
    [templates]
  )

  const getLineage = useCallback(
    (baseTemplateId: string) =>
      templates
        .filter((t) => t.baseTemplateId === baseTemplateId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [templates]
  )

  const getCurrentPublished = useCallback(
    (baseTemplateId: string) =>
      templates.find((t) => t.baseTemplateId === baseTemplateId && t.status === 'published'),
    [templates]
  )

  const add = useCallback((template: Template) => {
    setTemplates((prev) => [template, ...prev])
  }, [])

  const update = useCallback((id: string, patch: Partial<Template>) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const merged = { ...t, ...patch, updatedAt: new Date().toISOString() }
        merged.itemCount = getItemCount(merged)
        return merged
      })
    )
  }, [])

  const setStatus = useCallback((id: string, status: TemplateStatus) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    )
  }, [])

  const remove = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const duplicate = useCallback((id: string): Template | null => {
    const original = templates.find((t) => t.id === id)
    if (!original) return null
    const newId = genId('tpl')
    const copy: Template = {
      ...original,
      id: newId,
      baseTemplateId: newId,  // duplicate starts its own lineage
      parentVersionId: undefined,
      supersededBy: undefined,
      name: `${original.name} (copy)`,
      status: 'draft',
      version: '0.1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changelog: [
        makeChangelogEntry('duplicated', original.ownerId, original.ownerName,
          `Duplicated from "${original.name}" v${original.version}`),
      ],
    }
    setTemplates((prev) => [copy, ...prev])
    return copy
  }, [templates])

  const publish = useCallback((id: string, opts: PublishOptions): Template | null => {
    let publishedSnapshot: Template | null = null
    setTemplates((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target) return prev
      if (target.status !== 'draft') return prev

      // First publish? Version goes to 1.0 regardless of draft version. Otherwise bump from the current published version in the lineage.
      const currentPublished = prev.find(
        (t) => t.baseTemplateId === target.baseTemplateId && t.status === 'published'
      )
      const newVersion = currentPublished
        ? nextVersion(currentPublished.version, opts.bump)
        : firstPublishVersion()

      const now = new Date().toISOString()
      const newChangelogEntry = makeChangelogEntry(
        'published',
        opts.byId,
        opts.byName,
        opts.note || `Published as v${newVersion}`
      )

      const published: Template = {
        ...target,
        status: 'published',
        version: newVersion,
        updatedAt: now,
        changelog: [newChangelogEntry, ...target.changelog],
      }
      publishedSnapshot = published

      const next = prev.map((t) => {
        if (t.id === id) return published
        // Supersede the prior published version in the same lineage
        if (t.id === currentPublished?.id) {
          return {
            ...t,
            status: 'superseded' as const,
            supersededBy: published.id,
            updatedAt: now,
            changelog: [
              makeChangelogEntry('superseded', opts.byId, opts.byName, `Superseded by v${newVersion}`),
              ...t.changelog,
            ],
          }
        }
        return t
      })
      return next
    })
    return publishedSnapshot
  }, [])

  const editPublished = useCallback((id: string, byId: string, byName: string): EditPublishedResult | null => {
    const source = templates.find((t) => t.id === id)
    if (!source || source.status !== 'published') return null
    const newId = genId('tpl')
    const now = new Date().toISOString()
    // Draft version: same major, .next minor with a "-draft" suffix? Keep it simple — store as plain next minor and rely on status to disambiguate.
    const draftVersion = nextVersion(source.version, 'minor')
    const draft: Template = {
      ...source,
      id: newId,
      // SAME baseTemplateId — this is a revision in the same lineage
      baseTemplateId: source.baseTemplateId,
      parentVersionId: source.id,
      supersededBy: undefined,
      status: 'draft',
      version: draftVersion,
      createdAt: now,
      updatedAt: now,
      changelog: [
        makeChangelogEntry('edited', byId, byName, `Started draft revision from v${source.version}`),
      ],
      // Sections get fresh ids so editing the draft doesn't accidentally mutate frozen ones
      sections: source.sections.map((s) => ({
        ...s,
        id: genId('sec'),
        items: s.items.map((i) => ({ ...i, id: genId('itm') })),
      })),
    }
    setTemplates((prev) => [draft, ...prev])
    return { draft }
  }, [templates])

  const archive = useCallback((id: string, byId: string, byName: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'archived' as const,
              updatedAt: new Date().toISOString(),
              changelog: [makeChangelogEntry('archived', byId, byName), ...t.changelog],
            }
          : t
      )
    )
  }, [])

  const restore = useCallback((id: string, byId: string, byName: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'draft' as const,
              updatedAt: new Date().toISOString(),
              changelog: [makeChangelogEntry('restored', byId, byName), ...t.changelog],
            }
          : t
      )
    )
  }, [])

  const reset = useCallback(() => setTemplates(SEED_TEMPLATES), [])

  return {
    templates,
    getById,
    getLineage,
    getCurrentPublished,
    add,
    update,
    setStatus,
    remove,
    duplicate,
    publish,
    editPublished,
    archive,
    restore,
    reset,
  }
}

/* ============================================================
 * Formatting helpers
 * ============================================================ */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutesAgo = Math.floor(diff / 60_000)
  if (minutesAgo < 1) return 'just now'
  if (minutesAgo < 60) return `${minutesAgo}m ago`
  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) return `${hoursAgo}h ago`
  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 30) return `${daysAgo}d ago`
  const monthsAgo = Math.floor(daysAgo / 30)
  if (monthsAgo < 12) return `${monthsAgo}mo ago`
  return `${Math.floor(monthsAgo / 12)}y ago`
}

export function statusToneFor(status: TemplateStatus): 'green' | 'amber' | 'neutral' | 'red' {
  switch (status) {
    case 'published':  return 'green'
    case 'draft':      return 'amber'
    case 'superseded': return 'neutral'
    case 'archived':   return 'neutral'
  }
}

export function statusLabelFor(status: TemplateStatus): string {
  switch (status) {
    case 'published':  return 'Published'
    case 'draft':      return 'Draft'
    case 'superseded': return 'Superseded'
    case 'archived':   return 'Archived'
  }
}

/* ============================================================
 * Diff between two template versions
 * Returns a human-readable summary of what changed
 * ============================================================ */

export interface TemplateDiffSummary {
  /** True if metadata fields changed (name, summary, tags, type, sites) */
  metadataChanged: boolean
  /** Number of sections added in `next` that weren't in `prev` */
  sectionsAdded: number
  /** Number of sections in `prev` that aren't in `next` */
  sectionsRemoved: number
  /** Number of items added across all sections */
  itemsAdded: number
  /** Number of items removed across all sections */
  itemsRemoved: number
  /** Number of items where prompt or type changed */
  itemsModified: number
  /** Concise English summary, e.g. "Added 2 items, modified 3 items." */
  summary: string
}

export function diffTemplates(prev: Template, next: Template): TemplateDiffSummary {
  // Metadata changes
  const metadataChanged =
    prev.name !== next.name ||
    prev.summary !== next.summary ||
    prev.inspectionType !== next.inspectionType ||
    JSON.stringify(prev.tags) !== JSON.stringify(next.tags) ||
    JSON.stringify(prev.siteIds) !== JSON.stringify(next.siteIds)

  // Build id maps for fast lookup
  const prevSectionIds = new Set(prev.sections.map((s) => s.id))
  const nextSectionIds = new Set(next.sections.map((s) => s.id))

  // For revision drafts the section ids are regenerated, so id matching won't work.
  // Fall back to title matching when ids don't overlap at all.
  const idsOverlap = [...prevSectionIds].some((id) => nextSectionIds.has(id))

  let sectionsAdded = 0
  let sectionsRemoved = 0
  let itemsAdded = 0
  let itemsRemoved = 0
  let itemsModified = 0

  if (idsOverlap) {
    // Id-based diff
    sectionsAdded = [...nextSectionIds].filter((id) => !prevSectionIds.has(id)).length
    sectionsRemoved = [...prevSectionIds].filter((id) => !nextSectionIds.has(id)).length

    const prevItems = new Map<string, { prompt: string; type: string }>()
    prev.sections.forEach((s) => s.items.forEach((i) => prevItems.set(i.id, { prompt: i.prompt, type: i.type })))
    const nextItems = new Map<string, { prompt: string; type: string }>()
    next.sections.forEach((s) => s.items.forEach((i) => nextItems.set(i.id, { prompt: i.prompt, type: i.type })))

    nextItems.forEach((v, id) => {
      const p = prevItems.get(id)
      if (!p) itemsAdded += 1
      else if (p.prompt !== v.prompt || p.type !== v.type) itemsModified += 1
    })
    prevItems.forEach((_, id) => {
      if (!nextItems.has(id)) itemsRemoved += 1
    })
  } else {
    // Title-based fallback (revision drafts have regenerated ids)
    const prevTitleSet = new Set(prev.sections.map((s) => s.title))
    const nextTitleSet = new Set(next.sections.map((s) => s.title))
    sectionsAdded = [...nextTitleSet].filter((t) => !prevTitleSet.has(t)).length
    sectionsRemoved = [...prevTitleSet].filter((t) => !nextTitleSet.has(t)).length

    const prevTotal = prev.sections.reduce((sum, s) => sum + s.items.length, 0)
    const nextTotal = next.sections.reduce((sum, s) => sum + s.items.length, 0)
    if (nextTotal > prevTotal) itemsAdded = nextTotal - prevTotal
    else if (prevTotal > nextTotal) itemsRemoved = prevTotal - nextTotal
    // We can't reliably detect "modified" without id alignment; leave at 0.
  }

  // Build summary
  const parts: string[] = []
  if (sectionsAdded > 0)   parts.push(`${sectionsAdded} section${sectionsAdded === 1 ? '' : 's'} added`)
  if (sectionsRemoved > 0) parts.push(`${sectionsRemoved} section${sectionsRemoved === 1 ? '' : 's'} removed`)
  if (itemsAdded > 0)      parts.push(`${itemsAdded} item${itemsAdded === 1 ? '' : 's'} added`)
  if (itemsRemoved > 0)    parts.push(`${itemsRemoved} item${itemsRemoved === 1 ? '' : 's'} removed`)
  if (itemsModified > 0)   parts.push(`${itemsModified} item${itemsModified === 1 ? '' : 's'} modified`)
  if (metadataChanged && parts.length === 0) parts.push('Metadata updated')
  if (parts.length === 0) parts.push('No structural changes')

  return {
    metadataChanged,
    sectionsAdded,
    sectionsRemoved,
    itemsAdded,
    itemsRemoved,
    itemsModified,
    summary: parts.join(', ') + '.',
  }
}
