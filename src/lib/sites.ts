import { useCallback, useEffect, useState } from 'react'
import type { Site, Department } from '../types/site'
import { formatRelativeTime, formatDate } from './users' // Import from existing helpers

const SITES_STORAGE_KEY = 'ims-sites-v1'
const DEPTS_STORAGE_KEY = 'ims-departments-v1'

/* ============================================================
 * Seed data — matching names found in inspection data
 * ============================================================ */

const NOW = Date.now()
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString()
const months = (n: number) => new Date(NOW - n * 30 * 86_400_000).toISOString()

const SEED_SITES: Site[] = [
  {
    id: 'site_pune',
    name: 'Pune Plant',
    code: 'PUNE-01',
    city: 'Pune',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'active',
    certifications: ['HACCP', 'GMP', 'ISO 22000'],
    primaryDomain: 'quality',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    commissionedAt: days(1200),
    archivedAt: null,
    createdAt: days(1200),
    updatedAt: days(2)
  },
  {
    id: 'site_mumbai',
    name: 'Mumbai HQ',
    code: 'MUM-01',
    city: 'Mumbai',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'active',
    certifications: ['HACCP', 'GMP'],
    primaryDomain: 'quality',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    commissionedAt: days(1500),
    archivedAt: null,
    createdAt: days(1500),
    updatedAt: days(1)
  },
  {
    id: 'site_sterilab',
    name: 'Sterilab India',
    code: 'STR-01',
    city: 'Ahmedabad',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'active',
    certifications: ['GMP', 'ISO 13485'],
    primaryDomain: 'quality',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    commissionedAt: days(400),
    archivedAt: null,
    createdAt: days(400),
    updatedAt: days(5)
  },
  {
    id: 'site_blr',
    name: 'Bengaluru R&D',
    code: 'BLR-01',
    city: 'Bengaluru',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'commissioning',
    certifications: [],
    primaryDomain: 'both',
    managerId: null,
    managerName: null,
    commissionedAt: days(10),
    archivedAt: null,
    createdAt: days(10),
    updatedAt: days(1)
  },
  {
    id: 'site_hyd',
    name: 'Hyderabad Plant',
    code: 'HYD-01',
    city: 'Hyderabad',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'active',
    certifications: ['ISO 45001'],
    primaryDomain: 'safety',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    commissionedAt: days(800),
    archivedAt: null,
    createdAt: days(800),
    updatedAt: days(15)
  },
  {
    id: 'site_chennai',
    name: 'Chennai Warehouse',
    code: 'MAA-01',
    city: 'Chennai',
    country: 'India',
    timezone: 'Asia/Kolkata',
    status: 'archived',
    certifications: ['GMP'],
    primaryDomain: 'quality',
    managerId: null,
    managerName: null,
    commissionedAt: days(2000),
    archivedAt: months(2),
    createdAt: days(2000),
    updatedAt: months(2)
  }
]

const SEED_DEPTS: Department[] = [
  // Pune Plant departments
  {
    id: 'dept_pune_l3',
    siteId: 'site_pune',
    name: 'Line 3',
    code: 'L3',
    kind: 'production',
    areas: ['Filler', 'Capper', 'Labeller', 'Packaging'],
    headId: 'usr_priya_shah',
    headName: 'Priya Shah',
    active: true,
    createdAt: days(1000),
    updatedAt: days(10)
  },
  {
    id: 'dept_pune_ql',
    siteId: 'site_pune',
    name: 'Quality Lab',
    code: 'QL-01',
    kind: 'quality_lab',
    areas: ['Micro Lab', 'Chem Lab', 'Instrument Lab'],
    headId: 'usr_lakshmi_iyer',
    headName: 'Lakshmi Iyer',
    active: true,
    createdAt: days(1000),
    updatedAt: days(20)
  },
  {
    id: 'dept_pune_wh',
    siteId: 'site_pune',
    name: 'Warehouse',
    code: 'WH-01',
    kind: 'warehouse',
    areas: ['Receiving', 'Storage', 'Dispatch'],
    headId: null,
    headName: null,
    active: true,
    createdAt: days(1000),
    updatedAt: days(5)
  },
  {
    id: 'dept_pune_ut',
    siteId: 'site_pune',
    name: 'Utilities',
    code: 'UT-01',
    kind: 'utility',
    areas: ['Water Treatment', 'HVAC', 'Compressed Air'],
    headId: null,
    headName: null,
    active: true,
    createdAt: days(1000),
    updatedAt: days(30)
  },
  
  // Mumbai HQ departments
  {
    id: 'dept_mum_l2',
    siteId: 'site_mumbai',
    name: 'Line 2',
    code: 'L2',
    kind: 'production',
    areas: ['Processing hall', 'Mixing area'],
    headId: null,
    headName: null,
    active: true,
    createdAt: days(1200),
    updatedAt: days(5)
  },
  {
    id: 'dept_mum_cb',
    siteId: 'site_mumbai',
    name: 'Cleanroom B',
    code: 'CB-01',
    kind: 'quality_lab',
    areas: ['Cleanroom B', 'Gowning'],
    headId: 'usr_rahul_iyer',
    headName: 'Rahul Iyer',
    active: true,
    createdAt: days(1200),
    updatedAt: days(2)
  },
  {
    id: 'dept_mum_pkg',
    siteId: 'site_mumbai',
    name: 'Packaging Line 1',
    code: 'PKG-1',
    kind: 'packaging',
    areas: ['Packaging Line 1'],
    headId: null,
    headName: null,
    active: true,
    createdAt: days(1200),
    updatedAt: days(1)
  },

  // Sterilab India departments
  {
    id: 'dept_str_fac',
    siteId: 'site_sterilab',
    name: 'Facility Operations',
    code: 'FAC',
    kind: 'production',
    areas: ['Entire facility'],
    headId: 'usr_rahul_iyer',
    headName: 'Rahul Iyer',
    active: true,
    createdAt: days(300),
    updatedAt: days(1)
  }
]

/* ============================================================
 * Storage
 * ============================================================ */

function loadSites(): Site[] {
  if (typeof window === 'undefined') return SEED_SITES
  try {
    const raw = window.localStorage.getItem(SITES_STORAGE_KEY)
    if (!raw) return SEED_SITES
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_SITES
    return parsed
  } catch {
    return SEED_SITES
  }
}

function saveSites(sites: Site[]) {
  try {
    window.localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites))
  } catch {
    // ignore
  }
}

function loadDepartments(): Department[] {
  if (typeof window === 'undefined') return SEED_DEPTS
  try {
    const raw = window.localStorage.getItem(DEPTS_STORAGE_KEY)
    if (!raw) return SEED_DEPTS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_DEPTS
    return parsed
  } catch {
    return SEED_DEPTS
  }
}

function saveDepartments(depts: Department[]) {
  try {
    window.localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(depts))
  } catch {
    // ignore
  }
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseSitesApi {
  sites: Site[]
  departments: Department[]
  getSiteById: (id: string) => Site | undefined
  getDepartmentById: (id: string) => Department | undefined
  getDepartmentsForSite: (siteId: string) => Department[]
  createSite: (input: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => Site
  updateSite: (id: string, patch: Partial<Site>) => void
  archiveSite: (id: string) => void
  createDepartment: (input: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => Department
  updateDepartment: (id: string, patch: Partial<Department>) => void
  archiveDepartment: (id: string) => void
}

export function useSites(): UseSitesApi {
  const [sites, setSites] = useState<Site[]>(loadSites)
  const [departments, setDepartments] = useState<Department[]>(loadDepartments)

  useEffect(() => {
    saveSites(sites)
  }, [sites])

  useEffect(() => {
    saveDepartments(departments)
  }, [departments])

  const getSiteById = useCallback((id: string) => sites.find((s) => s.id === id), [sites])
  const getDepartmentById = useCallback((id: string) => departments.find((d) => d.id === id), [departments])
  const getDepartmentsForSite = useCallback((siteId: string) => departments.filter((d) => d.siteId === siteId && d.active), [departments])

  const createSite = useCallback((input: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSite: Site = {
      ...input,
      id: `site_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSites((prev) => [newSite, ...prev])
    return newSite
  }, [])

  const updateSite = useCallback((id: string, patch: Partial<Site>) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)))
  }, [])

  const archiveSite = useCallback((id: string) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'archived', archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : s)))
  }, [])

  const createDepartment = useCallback((input: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDept: Department = {
      ...input,
      id: `dept_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDepartments((prev) => [newDept, ...prev])
    return newDept
  }, [])

  const updateDepartment = useCallback((id: string, patch: Partial<Department>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)))
  }, [])

  const archiveDepartment = useCallback((id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, active: false, updatedAt: new Date().toISOString() } : d)))
  }, [])

  return {
    sites,
    departments,
    getSiteById,
    getDepartmentById,
    getDepartmentsForSite,
    createSite,
    updateSite,
    archiveSite,
    createDepartment,
    updateDepartment,
    archiveDepartment,
  }
}

export { formatRelativeTime, formatDate }
