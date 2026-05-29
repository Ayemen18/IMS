import { useCallback, useEffect, useState } from 'react'
import type { User, UserStatus } from '../types/user'

const STORAGE_KEY = 'ims-users-v1'

/* ============================================================
 * Seed data — realistic enough to look like a working system
 * ============================================================ */

const NOW = Date.now()
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString()
const hours = (n: number) => new Date(NOW - n * 3_600_000).toISOString()
const minutes = (n: number) => new Date(NOW - n * 60_000).toISOString()

const SEED: User[] = [
  {
    id: 'usr_maya_chen',
    name: 'Maya Chen',
    email: 'admin@qmics.io',
    role: 'admin',
    status: 'active',
    title: 'Head of Quality Systems',
    phone: '+91 98200 11234',
    sites: [
      { id: 'site_mumbai', name: 'Mumbai HQ' },
      { id: 'site_pune', name: 'Pune Plant' },
      { id: 'site_hyderabad', name: 'Hyderabad Packing' },
    ],
    lastActiveAt: minutes(8),
    joinedAt: days(412),
    activity: [
      { id: 'a1', at: minutes(12), verb: 'updated', target: 'Template/HACCP-CCP-002', context: 'Added 3 parameters' },
      { id: 'a2', at: hours(2),    verb: 'archived', target: 'Template/GMP-2019-old', context: 'Superseded by GMP-2024' },
      { id: 'a3', at: hours(8),    verb: 'invited', target: 'priya.shah@helix.io',  context: 'Quality Inspector · Pune' },
      { id: 'a4', at: days(1),     verb: 'created', target: 'Site/Hyderabad-Packing' },
      { id: 'a5', at: days(3),     verb: 'configured', target: 'Notification rule · NC overdue' },
    ],
  },
  {
    id: 'usr_rahul_iyer',
    name: 'Rahul Iyer',
    email: 'quality.manager@qmics.io',
    role: 'quality_manager',
    status: 'active',
    title: 'Quality Manager — Mumbai',
    phone: '+91 98200 22345',
    sites: [{ id: 'site_mumbai', name: 'Mumbai HQ' }],
    lastActiveAt: minutes(34),
    joinedAt: days(298),
    activity: [
      { id: 'a1', at: minutes(34), verb: 'approved', target: 'INS-04822', context: 'Daily CCP verification' },
      { id: 'a2', at: hours(3),    verb: 'reviewed', target: 'INS-04819' },
      { id: 'a3', at: hours(6),    verb: 'scheduled', target: 'Pre-op sanitation · Line 3' },
    ],
  },
  {
    id: 'usr_anika_sharma',
    name: 'Anika Sharma',
    email: 'safety.manager@qmics.io',
    role: 'safety_manager',
    status: 'active',
    title: 'Safety Manager — Pune',
    sites: [{ id: 'site_pune', name: 'Pune Plant' }],
    lastActiveAt: hours(1),
    joinedAt: days(245),
    activity: [
      { id: 'a1', at: hours(1), verb: 'verified', target: 'NC-1180', context: 'Closed' },
      { id: 'a2', at: hours(4), verb: 'reopened', target: 'NC-1182', context: 'Fix inadequate' },
    ],
  },
  {
    id: 'usr_priya_shah',
    name: 'Priya Shah',
    email: 'quality.inspector@qmics.io',
    role: 'quality_inspector',
    status: 'active',
    title: 'Quality Inspector',
    sites: [{ id: 'site_pune', name: 'Pune Plant' }],
    lastActiveAt: minutes(4),
    joinedAt: days(187),
    activity: [
      { id: 'a1', at: minutes(4),  verb: 'submitted', target: 'INS-04829' },
      { id: 'a2', at: hours(2),    verb: 'started',   target: 'INS-04830' },
    ],
  },
  {
    id: 'usr_kabir_menon',
    name: 'Kabir Menon',
    email: 'safety.inspector@qmics.io',
    role: 'safety_inspector',
    status: 'active',
    title: 'Safety Inspector',
    sites: [{ id: 'site_mumbai', name: 'Mumbai HQ' }],
    lastActiveAt: hours(5),
    joinedAt: days(164),
    activity: [],
  },
  {
    id: 'usr_diya_patel',
    name: 'Diya Patel',
    email: 'employee@qmics.io',
    role: 'employee',
    status: 'active',
    title: 'Line Supervisor — Bottling',
    sites: [{ id: 'site_pune', name: 'Pune Plant' }],
    lastActiveAt: hours(12),
    joinedAt: days(98),
    activity: [],
  },
  {
    id: 'usr_vikram_bose',
    name: 'Vikram Bose',
    email: 'leadership@qmics.io',
    role: 'top_management',
    status: 'active',
    title: 'VP Operations',
    sites: [
      { id: 'site_mumbai', name: 'Mumbai HQ' },
      { id: 'site_pune', name: 'Pune Plant' },
      { id: 'site_hyderabad', name: 'Hyderabad Packing' },
    ],
    lastActiveAt: days(1),
    joinedAt: days(520),
    activity: [],
  },
  {
    id: 'usr_lakshmi_iyer',
    name: 'Lakshmi Iyer',
    email: 'l.iyer@qmics.io',
    role: 'quality_inspector',
    status: 'active',
    title: 'Quality Inspector — Cleanroom B',
    sites: [{ id: 'site_mumbai', name: 'Mumbai HQ' }],
    lastActiveAt: minutes(45),
    joinedAt: days(89),
    activity: [],
  },
  {
    id: 'usr_arjun_sharma',
    name: 'Arjun Sharma',
    email: 'a.sharma@qmics.io',
    role: 'quality_manager',
    status: 'active',
    title: 'Quality Manager — Hyderabad',
    sites: [{ id: 'site_hyderabad', name: 'Hyderabad Packing' }],
    lastActiveAt: hours(2),
    joinedAt: days(156),
    activity: [],
  },
  {
    id: 'usr_sneha_banerjee',
    name: 'Sneha Banerjee',
    email: 's.banerjee@qmics.io',
    role: 'safety_inspector',
    status: 'active',
    title: 'Safety Inspector',
    sites: [{ id: 'site_hyderabad', name: 'Hyderabad Packing' }],
    lastActiveAt: hours(6),
    joinedAt: days(76),
    activity: [],
  },
  {
    id: 'usr_kavya_r',
    name: 'Kavya R.',
    email: 'kavya.r@northvale.io',
    role: 'employee',
    status: 'disabled',
    title: 'Maintenance Tech',
    sites: [{ id: 'site_mumbai', name: 'Mumbai HQ' }],
    lastActiveAt: days(94),
    joinedAt: days(312),
    activity: [
      { id: 'a1', at: hours(3), verb: 'disabled', context: 'Inactive 90 days · auto-policy' },
    ],
  },
  {
    id: 'usr_pending_1',
    name: 'Aanya Krishnan',
    email: 'a.krishnan@qmics.io',
    role: 'quality_inspector',
    status: 'invited',
    title: 'Quality Inspector',
    sites: [{ id: 'site_pune', name: 'Pune Plant' }],
    lastActiveAt: null,
    joinedAt: hours(8),
    activity: [
      { id: 'a1', at: hours(8), verb: 'invited', context: 'Pending acceptance' },
    ],
  },
  {
    id: 'usr_pending_2',
    name: 'Rohit Desai',
    email: 'r.desai@qmics.io',
    role: 'safety_inspector',
    status: 'invited',
    title: 'Safety Inspector',
    sites: [{ id: 'site_mumbai', name: 'Mumbai HQ' }],
    lastActiveAt: null,
    joinedAt: days(2),
    activity: [],
  },
  {
    id: 'usr_pending_3',
    name: 'Meera Joshi',
    email: 'm.joshi@qmics.io',
    role: 'employee',
    status: 'invited',
    title: 'Production Supervisor',
    sites: [{ id: 'site_pune', name: 'Pune Plant' }],
    lastActiveAt: null,
    joinedAt: days(4),
    activity: [],
  },
  {
    id: 'usr_pending_4',
    name: 'Ishaan Verma',
    email: 'i.verma@qmics.io',
    role: 'quality_inspector',
    status: 'invited',
    title: 'Quality Inspector',
    sites: [{ id: 'site_hyderabad', name: 'Hyderabad Packing' }],
    lastActiveAt: null,
    joinedAt: days(6),
    activity: [],
  },
]

/* ============================================================
 * Storage
 * ============================================================ */

function loadFromStorage(): User[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw) as User[]
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED
    return parsed
  } catch {
    return SEED
  }
}

function saveToStorage(users: User[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseUsersApi {
  users: User[]
  getById: (id: string) => User | undefined
  update: (id: string, patch: Partial<User>) => void
  setStatus: (id: string, status: UserStatus) => void
  add: (user: User) => void
  remove: (id: string) => void
  /** Reset to seed data — handy for dev */
  reset: () => void
}

export function useUsers(): UseUsersApi {
  const [users, setUsers] = useState<User[]>(loadFromStorage)

  useEffect(() => {
    saveToStorage(users)
  }, [users])

  const getById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  )

  const update = useCallback((id: string, patch: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const setStatus = useCallback((id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }, [])

  const add = useCallback((user: User) => {
    setUsers((prev) => [user, ...prev])
  }, [])

  const remove = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const reset = useCallback(() => {
    setUsers(SEED)
  }, [])

  return { users, getById, update, setStatus, add, remove, reset }
}

/* ============================================================
 * Pure formatting helpers — used by both list and detail
 * ============================================================ */

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
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
  const yearsAgo = Math.floor(monthsAgo / 12)
  return `${yearsAgo}y ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
