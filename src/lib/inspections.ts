import { useCallback, useEffect, useState } from 'react'
import type {
  Inspection,
  InspectionStatus,
  InspectionTimelineEvent,
  InspectionIssue,
  InspectionItemResponse,
} from '../types/inspection'

const STORAGE_KEY = 'ims-inspections-v2'

/* ============================================================
 * Seed data — realistic enough to drive a Manager dashboard
 * ============================================================ */

const NOW = Date.now()
const days    = (n: number) => new Date(NOW - n * 86_400_000).toISOString()
const hours   = (n: number) => new Date(NOW - n * 3_600_000).toISOString()
const minutes = (n: number) => new Date(NOW - n * 60_000).toISOString()
const future_h = (n: number) => new Date(NOW + n * 3_600_000).toISOString()

let counter = 4800

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function makeEvent(
  action: InspectionTimelineEvent['action'],
  byId: string,
  byName: string,
  at: string,
  note?: string,
  target?: string,
): InspectionTimelineEvent {
  return { id: genId('evt'), at, byId, byName, action, note, target }
}

/* Build a small handful of inspections covering every status. */
const SEED_INSPECTIONS: Inspection[] = (() => {
  const all: Inspection[] = []

  // 1) Under review — submitted 12m ago, sitting in Rahul's queue
  const ins1: Inspection = {
    id: 'INS-04829',
    number: 'INS-04829',
    domain: 'quality',
    templateId: 'tpl_haccp_ccp_daily',
    templateBaseId: 'tpl_haccp_ccp_daily',
    templateName: 'Daily CCP verification — Line 3',
    templateVersion: '4.2',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Line 3 bottling',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'under_review',
    scheduledFor: hours(6),
    startedAt: hours(5),
    submittedAt: minutes(12),
    reviewedAt: null,
    publishedAt: null,
    responses: [
      { itemId: 'itm_1', answer: 'pass', attachments: ['photo_allergen.jpg'] },
      { itemId: 'itm_2', answer: 'pass', reading: 18, attachments: [] },
      { itemId: 'itm_3', answer: 'pass', attachments: ['photo_belt.jpg'] },
      { itemId: 'itm_4', answer: 'pass', reading: 74.2, attachments: [] },
      { itemId: 'itm_5', answer: 'fail', reading: 71.4, observation: 'Reading dipped below 72°C lower bound at T+00:30. Operator adjusted setpoint.', attachments: ['photo_temp.jpg'] },
      { itemId: 'itm_6', answer: 'pass', reading: 73.8, attachments: [] },
      { itemId: 'itm_7', answer: 'pass', attachments: ['photo_fe.jpg'] },
      { itemId: 'itm_8', answer: 'pass', attachments: ['photo_nfe.jpg'] },
      { itemId: 'itm_9', answer: 'pass', attachments: ['photo_sus.jpg'] },
      { itemId: 'itm_10', answer: 'pass', attachments: [] },
      { itemId: 'itm_11', answer: 'fail', observation: 'CCP-2 had one out-of-range reading; flagged for review.', attachments: [] },
      { itemId: 'itm_12', answer: null, textAnswer: 'Shift was uneventful otherwise. Setpoint stabilized after operator intervention.', attachments: [] },
    ],
    issues: [
      {
        id: 'ISS-05101',
        itemPrompt: 'Verify machine guarding is in place',
        state: 'open',
        itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-28T09:00:00Z',
        updatedAt: '2026-05-28T09:00:00Z',
        },
      {
        id: 'iss_1',
        itemId: 'itm_5',
        itemPrompt: 'Reading 2 (T+00:30) — CCP-2 Filling temperature',
        assigneeId: null,
        assigneeName: null,
        fixSubmittedAt: null,
        verifiedAt: null,
        state: 'open',
        createdAt: minutes(15),
        updatedAt: minutes(15),
      },
    ],
    timeline: [
      makeEvent('scheduled',  'usr_rahul_iyer', 'Rahul Iyer',  hours(8)),
      makeEvent('started',    'usr_priya_shah', 'Priya Shah',  hours(5)),
      makeEvent('issue_created','usr_priya_shah','Priya Shah', minutes(40), 'CCP-2 reading 2 below lower bound', 'iss_1'),
      makeEvent('submitted',  'usr_priya_shah', 'Priya Shah',  minutes(12)),
    ],
    createdAt: hours(8),
    updatedAt: minutes(12),
  }
  all.push(ins1)

  // 2) In progress — happening right now
  const ins2: Inspection = {
    id: 'INS-04830',
    number: 'INS-04830',
    domain: 'quality',
    templateId: 'tpl_pre_op_sanitation',
    templateBaseId: 'tpl_pre_op_sanitation',
    templateName: 'Pre-operational sanitation — Bottling',
    templateVersion: '3.1',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Bottling Line A',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'in_progress',
    scheduledFor: hours(2),
    startedAt: hours(2),
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    responses: [
      { itemId: 's1i1', answer: 'pass', attachments: [] },
      { itemId: 's1i2', answer: 'pass', attachments: ['cip_curve.jpg'] },
      { itemId: 's1i3', answer: 'pass', attachments: [] },
      { itemId: 's2i1', answer: 'pass', attachments: ['filler.jpg'] },
      { itemId: 's2i2', answer: 'pass', attachments: ['belt.jpg'] },
      { itemId: 's3i1', answer: 'pass', reading: 14, attachments: [] },
      { itemId: 's3i2', answer: 'pass', reading: 11, attachments: [] },
      { itemId: 's3i3', answer: null, attachments: [] },  // not yet answered
    ],
    issues: [
      {
        id: 'ISS-05102',
        itemPrompt: 'Check calibration tags',
        state: 'in_progress',
        itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-27T10:00:00Z',
        updatedAt: '2026-05-28T14:00:00Z',
        },],
    timeline: [
      makeEvent('scheduled', 'usr_rahul_iyer', 'Rahul Iyer', hours(8)),
      makeEvent('started',   'usr_priya_shah', 'Priya Shah', hours(2)),
    ],
    createdAt: hours(8),
    updatedAt: minutes(8),
  }
  all.push(ins2)

  // 3) Scheduled for later today
  const ins3: Inspection = {
    id: 'INS-04831',
    number: 'INS-04831',
    domain: 'quality',
    templateId: 'tpl_gmp_gowning',
    templateBaseId: 'tpl_gmp_gowning',
    templateName: 'GMP — Gowning audit, Cleanroom B',
    templateVersion: '2.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Cleanroom B',
    inspectorId: 'usr_lakshmi_iyer',
    inspectorName: 'Lakshmi Iyer',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'scheduled',
    scheduledFor: future_h(3),
    startedAt: null,
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    responses: [],
    issues: [
      {
        id: 'ISS-05103',
        itemPrompt: 'Ensure emergency exits are clear',
        state: 'awaiting_verification',
        itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-26T08:00:00Z',
        updatedAt: '2026-05-29T08:00:00Z',
        },],
    timeline: [
      makeEvent('scheduled', 'usr_rahul_iyer', 'Rahul Iyer', days(1)),
    ],
    createdAt: days(1),
    updatedAt: days(1),
  }
  all.push(ins3)

  // 4) Approved with issues open — corrective actions assigned to Diya
  const ins4: Inspection = {
    id: 'INS-04827',
    number: 'INS-04827',
    domain: 'quality',
    templateId: 'tpl_allergen_changeover',
    templateBaseId: 'tpl_allergen_changeover',
    templateName: 'Allergen changeover verification',
    templateVersion: '0.3',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Mix tank 2',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'issues_open',
    scheduledFor: days(1),
    startedAt: days(1),
    submittedAt: hours(20),
    reviewedAt: hours(18),
    publishedAt: null,
    responses: [
      { itemId: 'a1i1', answer: null, textAnswer: 'Previous allergen: Soy', attachments: [] },
      { itemId: 'a1i2', answer: 'pass', attachments: ['record.jpg'] },
      { itemId: 'a2i1', answer: 'fail', reading: 38, observation: 'ATP reading above 30 RLU threshold.', attachments: [] },
      { itemId: 'a2i2', answer: 'pass', textAnswer: 'Negative', attachments: ['lfd.jpg'] },
    ],
    issues: [
      {
        id: 'ISS-05104',
        itemPrompt: 'Spill kits fully stocked',
        state: 'closed',
        itemId: 'item_mock', fixSubmittedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-15T08:00:00Z',
        updatedAt: '2026-05-20T08:00:00Z',
        verifiedAt: '2026-05-21T08:00:00Z',
        },
      {
        id: 'iss_2',
        itemId: 'a2i1',
        itemPrompt: 'ATP swab — Mix tank',
        assigneeId: 'usr_diya_patel',
        assigneeName: 'Diya Patel',
        fixSubmittedAt: null,
        verifiedAt: null,
        fixNotes: undefined,
        state: 'in_progress',
        createdAt: hours(18),
        updatedAt: hours(18),
      },
    ],
    timeline: [
      makeEvent('scheduled',  'usr_rahul_iyer', 'Rahul Iyer',  days(2)),
      makeEvent('started',    'usr_priya_shah', 'Priya Shah',  days(1)),
      makeEvent('submitted',  'usr_priya_shah', 'Priya Shah',  hours(20)),
      makeEvent('approved',   'usr_rahul_iyer', 'Rahul Iyer',  hours(18)),
      makeEvent('issue_created', 'usr_rahul_iyer', 'Rahul Iyer', hours(18), 'ATP exceedance — assigned to Diya', 'iss_2'),
    ],
    createdAt: days(2),
    updatedAt: hours(18),
  }
  all.push(ins4)

  // 5) Awaiting verification — Diya submitted fix, Rahul needs to verify
  const ins5: Inspection = {
    id: 'INS-04825',
    number: 'INS-04825',
    domain: 'quality',
    templateId: 'tpl_haccp_ccp_daily',
    templateBaseId: 'tpl_haccp_ccp_daily',
    templateName: 'Daily CCP verification — Line 3',
    templateVersion: '4.2',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Line 3 bottling',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'issues_open',
    scheduledFor: days(2),
    startedAt: days(2),
    submittedAt: days(2),
    reviewedAt: days(1),
    publishedAt: null,
    responses: [],
    issues: [
      {
        id: 'ISS-05105',
        itemPrompt: 'PPE compliance',
        state: 'open',
        itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-29T10:00:00Z',
        updatedAt: '2026-05-29T10:00:00Z',
        },
      {
        id: 'iss_3',
        itemId: 'itm_2',
        itemPrompt: 'Sanitation verification ATP swab — Filler head',
        assigneeId: 'usr_diya_patel',
        assigneeName: 'Diya Patel',
        fixSubmittedAt: hours(2),
        verifiedAt: null,
        fixNotes: 'Re-cleaned filler head, re-swabbed at 8 RLU. Photo attached.',
        fixAttachments: ['photo_reswab.jpg'],
        state: 'awaiting_verification',
        createdAt: days(1),
        updatedAt: hours(2),
      },
    ],
    timeline: [
      makeEvent('approved', 'usr_rahul_iyer', 'Rahul Iyer', days(1)),
      makeEvent('issue_fix_submitted', 'usr_diya_patel', 'Diya Patel', hours(2), 'Re-swab 8 RLU', 'iss_3'),
    ],
    createdAt: days(2),
    updatedAt: hours(2),
  }
  all.push(ins5)

  // 6) Published yesterday
  const ins6: Inspection = {
    id: 'INS-04820',
    number: 'INS-04820',
    domain: 'quality',
    templateId: 'tpl_haccp_ccp_daily',
    templateBaseId: 'tpl_haccp_ccp_daily',
    templateName: 'Daily CCP verification — Line 3',
    templateVersion: '4.2',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Line 3 bottling',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'published',
    scheduledFor: days(2),
    startedAt: days(2),
    submittedAt: days(2),
    reviewedAt: days(2),
    publishedAt: days(1),
    responses: [],
    issues: [],
    timeline: [
      makeEvent('published', 'usr_rahul_iyer', 'Rahul Iyer', days(1)),
    ],
    createdAt: days(3),
    updatedAt: days(1),
  }
  all.push(ins6)

  // 7) Rejected — sent back to Priya for rework
  const ins7: Inspection = {
    id: 'INS-04832',
    number: 'INS-04832',
    domain: 'quality',
    templateId: 'tpl_pre_op_sanitation',
    templateBaseId: 'tpl_pre_op_sanitation',
    templateName: 'Pre-operational sanitation — Bottling',
    templateVersion: '3.1',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Bottling Line A',
    inspectorId: 'usr_priya_shah',
    inspectorName: 'Priya Shah',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'rejected',
    scheduledFor: hours(8),
    startedAt: hours(7),
    submittedAt: hours(4),
    reviewedAt: hours(3),
    publishedAt: null,
    responses: [],
    issues: [],
    timeline: [
      makeEvent('submitted', 'usr_priya_shah', 'Priya Shah', hours(4)),
      makeEvent('rejected',  'usr_rahul_iyer', 'Rahul Iyer', hours(3), 'CIP curve photo missing — please re-attach.'),
    ],
    createdAt: hours(8),
    updatedAt: hours(3),
  }
  all.push(ins7)

  // 8) On hold
  const ins8: Inspection = {
    id: 'INS-04828',
    number: 'INS-04828',
    domain: 'quality',
    templateId: 'tpl_gmp_gowning',
    templateBaseId: 'tpl_gmp_gowning',
    templateName: 'GMP — Gowning audit, Cleanroom B',
    templateVersion: '2.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Cleanroom B',
    inspectorId: 'usr_lakshmi_iyer',
    inspectorName: 'Lakshmi Iyer',
    managerId: 'usr_rahul_iyer',
    managerName: 'Rahul Iyer',
    status: 'on_hold',
    scheduledFor: hours(6),
    startedAt: hours(5),
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    responses: [],
    issues: [],
    holdReason: 'Cleanroom B environmental excursion — paused pending environmental clearance.',
    timeline: [
      makeEvent('on_hold', 'usr_lakshmi_iyer', 'Lakshmi Iyer', hours(4), 'Env. excursion'),
    ],
    createdAt: days(1),
    updatedAt: hours(4),
  }
  all.push(ins8)

  // Add 6 more scheduled inspections across the next few days to make schedule feel full
  const upcomingTemplates = [
    { tid: 'tpl_haccp_ccp_daily', name: 'Daily CCP verification — Line 3', ver: '4.2', site: 'site_mumbai', siteName: 'Mumbai HQ', area: 'Line 3 bottling' },
    { tid: 'tpl_pre_op_sanitation', name: 'Pre-operational sanitation — Bottling', ver: '3.1', site: 'site_pune', siteName: 'Pune Plant', area: 'Bottling Line A' },
    { tid: 'tpl_gmp_gowning', name: 'GMP — Gowning audit, Cleanroom B', ver: '2.0', site: 'site_mumbai', siteName: 'Mumbai HQ', area: 'Cleanroom B' },
    { tid: 'tpl_allergen_changeover', name: 'Allergen changeover verification', ver: '0.3', site: 'site_pune', siteName: 'Pune Plant', area: 'Mix tank 2' },
    { tid: 'tpl_haccp_ccp_daily', name: 'Daily CCP verification — Line 3', ver: '4.2', site: 'site_mumbai', siteName: 'Mumbai HQ', area: 'Line 3 bottling' },
    { tid: 'tpl_pre_op_sanitation', name: 'Pre-operational sanitation — Bottling', ver: '3.1', site: 'site_pune', siteName: 'Pune Plant', area: 'Bottling Line A' },
  ]
  const inspectors = [
    { id: 'usr_priya_shah', name: 'Priya Shah' },
    { id: 'usr_lakshmi_iyer', name: 'Lakshmi Iyer' },
  ]
  for (let i = 0; i < 6; i++) {
    const t = upcomingTemplates[i]
    const insp = inspectors[i % 2]
    counter += 1
    all.push({
      id: `INS-${String(counter).padStart(5,'0')}`,
      number: `INS-${String(counter).padStart(5,'0')}`,
      domain: 'quality',
      templateId: t.tid,
      templateBaseId: t.tid,
      templateName: t.name,
      templateVersion: t.ver,
      siteId: t.site,
      siteName: t.siteName,
      area: t.area,
      inspectorId: insp.id,
      inspectorName: insp.name,
      managerId: 'usr_rahul_iyer',
      managerName: 'Rahul Iyer',
      status: 'scheduled',
      scheduledFor: future_h(8 + i * 18),
      startedAt: null,
      submittedAt: null,
      reviewedAt: null,
      publishedAt: null,
      responses: [],
      issues: [],
      timeline: [makeEvent('scheduled', 'usr_rahul_iyer', 'Rahul Iyer', days(1))],
      createdAt: days(1),
      updatedAt: days(1),
    })
  }

  // --- Safety Domain Inspections ---

  // Safety 1: In progress
  all.push({
    id: 'INS-04901',
    number: 'INS-04901',
    domain: 'safety',
    templateId: 'tpl_safety_walk',
    templateBaseId: 'tpl_safety_walk',
    templateName: 'Safety walkthrough — Production floor',
    templateVersion: '1.4',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Packaging Line 1',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'in_progress',
    scheduledFor: hours(1),
    startedAt: hours(1),
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    responses: [
      { itemId: 'sw1i1', answer: 'pass', attachments: [] },
      { itemId: 'sw1i2', answer: 'pass', attachments: [] }
    ],
    issues: [],
    timeline: [
      makeEvent('scheduled', 'usr_anika_sharma', 'Anika Sharma', days(1)),
      makeEvent('started', 'usr_kabir_menon', 'Kabir Menon', hours(1)),
    ],
    createdAt: days(1),
    updatedAt: hours(1),
  })

  // Safety 2: Under review
  all.push({
    id: 'INS-04902',
    number: 'INS-04902',
    domain: 'safety',
    templateId: 'tpl_safety_ppe',
    templateBaseId: 'tpl_safety_ppe',
    templateName: 'PPE compliance audit',
    templateVersion: '1.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Mixing area',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'under_review',
    scheduledFor: hours(4),
    startedAt: hours(3),
    submittedAt: minutes(30),
    reviewedAt: null,
    publishedAt: null,
    responses: [
      { itemId: 'ppe1i1', answer: 'pass', attachments: [] },
      { itemId: 'ppe1i2', answer: 'pass', attachments: [] },
      { itemId: 'ppe2i1', answer: 'pass', attachments: [] },
      { itemId: 'ppe2i2', answer: 'pass', attachments: [] },
    ],
    issues: [],
    timeline: [
      makeEvent('scheduled', 'usr_anika_sharma', 'Anika Sharma', days(1)),
      makeEvent('started', 'usr_kabir_menon', 'Kabir Menon', hours(3)),
      makeEvent('submitted', 'usr_kabir_menon', 'Kabir Menon', minutes(30)),
    ],
    createdAt: days(1),
    updatedAt: minutes(30),
  })

  // Safety 3: Scheduled
  all.push({
    id: 'INS-04903',
    number: 'INS-04903',
    domain: 'safety',
    templateId: 'tpl_safety_emergency',
    templateBaseId: 'tpl_safety_emergency',
    templateName: 'Emergency equipment monthly check',
    templateVersion: '2.1',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Entire facility',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'scheduled',
    scheduledFor: future_h(2),
    startedAt: null,
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    responses: [],
    issues: [],
    timeline: [
      makeEvent('scheduled', 'usr_anika_sharma', 'Anika Sharma', days(3)),
    ],
    createdAt: days(3),
    updatedAt: days(3),
  })

  // Safety 4: Published
  all.push({
    id: 'INS-04904',
    number: 'INS-04904',
    domain: 'safety',
    templateId: 'tpl_safety_walk',
    templateBaseId: 'tpl_safety_walk',
    templateName: 'Safety walkthrough — Production floor',
    templateVersion: '1.4',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Line 2',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'published',
    scheduledFor: days(4),
    startedAt: days(4),
    submittedAt: days(4),
    reviewedAt: days(3),
    publishedAt: days(3),
    responses: [
      { itemId: 'sw1i1', answer: 'pass', attachments: [] },
      { itemId: 'sw1i2', answer: 'pass', attachments: [] },
      { itemId: 'sw2i1', answer: 'pass', attachments: [] },
      { itemId: 'sw2i2', answer: 'pass', attachments: [] },
      { itemId: 'sw3i1', answer: 'pass', attachments: [] },
      { itemId: 'sw3i2', answer: 'pass', attachments: [] },
      { itemId: 'sw3i3', answer: 'pass', attachments: [] },
    ],
    issues: [],
    timeline: [
      makeEvent('scheduled', 'usr_anika_sharma', 'Anika Sharma', days(5)),
      makeEvent('started', 'usr_kabir_menon', 'Kabir Menon', days(4)),
      makeEvent('submitted', 'usr_kabir_menon', 'Kabir Menon', days(4)),
      makeEvent('approved', 'usr_anika_sharma', 'Anika Sharma', days(3)),
      makeEvent('published', 'usr_anika_sharma', 'Anika Sharma', days(3)),
    ],
    createdAt: days(5),
    updatedAt: days(3),
  })

  // Safety 5: Issues open
  all.push({
    id: 'INS-04905',
    number: 'INS-04905',
    domain: 'safety',
    templateId: 'tpl_safety_ppe',
    templateBaseId: 'tpl_safety_ppe',
    templateName: 'PPE compliance audit',
    templateVersion: '1.0',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Processing hall',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'issues_open',
    scheduledFor: days(2),
    startedAt: days(2),
    submittedAt: days(1),
    reviewedAt: days(1),
    publishedAt: null,
    responses: [
      { itemId: 'ppe1i1', answer: 'fail', observation: 'Operator on line 2 not wearing safety glasses.', attachments: [] },
      { itemId: 'ppe1i2', answer: 'pass', attachments: [] },
      { itemId: 'ppe2i1', answer: 'pass', attachments: [] },
      { itemId: 'ppe2i2', answer: 'pass', attachments: [] },
    ],
    issues: [
      {
        id: 'iss_safe_1',
        itemId: 'ppe1i1',
        itemPrompt: 'Safety glasses worn properly by all staff',
        assigneeId: null,
        assigneeName: null,
        fixSubmittedAt: null,
        verifiedAt: null,
        state: 'open',
        createdAt: days(1),
        updatedAt: days(1),
      }
    ],
    timeline: [
      makeEvent('scheduled', 'usr_anika_sharma', 'Anika Sharma', days(3)),
      makeEvent('started', 'usr_kabir_menon', 'Kabir Menon', days(2)),
      makeEvent('issue_created', 'usr_kabir_menon', 'Kabir Menon', days(1), 'Operator without glasses', 'iss_safe_1'),
      makeEvent('submitted', 'usr_kabir_menon', 'Kabir Menon', days(1)),
      makeEvent('approved', 'usr_anika_sharma', 'Anika Sharma', days(1)),
    ],
    createdAt: days(3),
    updatedAt: days(1),
  })

  // Safety 6: Rejected
  all.push({
    id: 'INS-04906',
    number: 'INS-04906',
    domain: 'safety',
    templateId: 'tpl_safety_near_miss',
    templateBaseId: 'tpl_safety_near_miss',
    templateName: 'Near-miss reporting form',
    templateVersion: '1.2',
    siteId: 'site_mumbai',
    siteName: 'Mumbai HQ',
    area: 'Warehouse',
    inspectorId: 'usr_kabir_menon',
    inspectorName: 'Kabir Menon',
    managerId: 'usr_anika_sharma',
    managerName: 'Anika Sharma',
    status: 'rejected',
    scheduledFor: hours(10),
    startedAt: hours(9),
    submittedAt: hours(8),
    reviewedAt: hours(6),
    publishedAt: null,
    responses: [
      { itemId: 'nm1i1', answer: null, textAnswer: 'Forklift almost hit rack', attachments: [] },
      { itemId: 'nm1i2', answer: null, textAnswer: 'High', attachments: [] },
    ],
    issues: [],
    timeline: [
      makeEvent('started', 'usr_kabir_menon', 'Kabir Menon', hours(9)),
      makeEvent('submitted', 'usr_kabir_menon', 'Kabir Menon', hours(8)),
      makeEvent('rejected', 'usr_anika_sharma', 'Anika Sharma', hours(6), 'Please attach a photo of the corner where this happened.'),
    ],
    createdAt: hours(10),
    updatedAt: hours(6),
  })

  
  all.push({
    id: 'INS-04910',
    number: 'INS-04910',
    domain: 'safety',
    templateId: 'tpl_safety_walk',
    templateBaseId: 'tpl_safety_walk',
    templateName: 'Safety walkthrough — Production floor',
    templateVersion: '1.4',
    siteId: 'site_pune',
    siteName: 'Pune Plant',
    area: 'Line 2',
    status: 'under_review',
    inspectorId: 'safety.inspector@qmics.io',
    inspectorName: 'Kabir Menon',
    scheduledFor: '2026-05-28T09:00:00Z',
    startedAt: '2026-05-28T09:15:00Z',
    submittedAt: '2026-05-28T11:00:00Z',
    issues: [],
    managerId: 'usr_admin', managerName: 'Admin', reviewedAt: null, publishedAt: null, responses: [], createdAt: '2026-05-28T09:00:00Z', updatedAt: '2026-05-28T09:00:00Z', timeline: []
});

  all.push({
    id: 'INS-04911',
    number: 'INS-04911',
    domain: 'safety',
    templateId: 'tpl_safety_ppe',
    templateBaseId: 'tpl_safety_ppe',
    templateName: 'PPE compliance audit',
    templateVersion: '1.0',
    siteId: 'site_mumbai',
    siteName: 'Mumbai Line 3',
    area: 'Packaging',
    status: 'scheduled',
    inspectorId: 'safety.inspector@qmics.io',
    inspectorName: 'Kabir Menon',
    scheduledFor: '2026-05-29T14:00:00Z',
    startedAt: '2026-05-29T14:05:00Z',
    submittedAt: null,
    issues: [
      {
        id: 'ISS-05201',
        itemPrompt: 'Hard hats worn correctly',
        state: 'open',
        itemId: 'item_mock', fixSubmittedAt: null, verifiedAt: null, assigneeId: 'employee@qmics.io',
        assigneeName: 'Diya Patel',
        createdAt: '2026-05-29T14:15:00Z',
        updatedAt: '2026-05-29T14:15:00Z',
        }
    ],
    managerId: 'usr_admin', managerName: 'Admin', reviewedAt: null, publishedAt: null, responses: [], createdAt: '2026-05-28T09:00:00Z', updatedAt: '2026-05-28T09:00:00Z', timeline: []
});

  return all
})()

/* ============================================================
 * Storage
 * ============================================================ */

function loadFromStorage(): Inspection[] {
  if (typeof window === 'undefined') return SEED_INSPECTIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_INSPECTIONS
    const parsed = JSON.parse(raw) as Inspection[]
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_INSPECTIONS
    return parsed
  } catch {
    return SEED_INSPECTIONS
  }
}

function saveToStorage(inspections: Inspection[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections))
  } catch { /* ignore */ }
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseInspectionsApi {
  inspections: Inspection[]
  getById: (id: string) => Inspection | undefined
  update: (id: string, patch: Partial<Inspection>) => void
  setStatus: (id: string, status: InspectionStatus) => void
  add: (inspection: Inspection) => void
  remove: (id: string) => void
  reset: () => void
  start: (id: string, byId: string, byName: string) => void
  saveResponses: (id: string, responses: InspectionItemResponse[]) => void
  submit: (id: string, byId: string, byName: string) => void
  resumeRejected: (id: string, byId: string, byName: string) => void
  /* Workflow transitions — each appends to the timeline */
  approve: (id: string, byId: string, byName: string, note?: string) => void
  reject:  (id: string, byId: string, byName: string, note: string) => void
  verifyIssue: (inspectionId: string, issueId: string, byId: string, byName: string, note?: string) => void
  reopenIssue: (inspectionId: string, issueId: string, byId: string, byName: string, note: string) => void
  reassignIssue: (inspectionId: string, issueId: string, newAssigneeId: string, newAssigneeName: string, byId: string, byName: string, note: string) => void
  submitIssueFix: (inspectionId: string, issueId: string, byId: string, byName: string, notes: string, attachments: string[]) => void
}

export function useInspections(): UseInspectionsApi {
  const [inspections, setInspections] = useState<Inspection[]>(loadFromStorage)

  useEffect(() => { saveToStorage(inspections) }, [inspections])

  const getById = useCallback((id: string) => inspections.find((i) => i.id === id), [inspections])

  const update = useCallback((id: string, patch: Partial<Inspection>) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i))
    )
  }, [])

  const setStatus = useCallback((id: string, status: InspectionStatus) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i))
    )
  }, [])

  const add = useCallback((inspection: Inspection) => {
    setInspections((prev) => [inspection, ...prev])
  }, [])

  const remove = useCallback((id: string) => {
    setInspections((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const reset = useCallback(() => setInspections(SEED_INSPECTIONS), [])

  const start = useCallback((id: string, byId: string, byName: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        if (i.status !== 'scheduled') return i
        const now = new Date().toISOString()
        const event: InspectionTimelineEvent = {
          id: genId('evt'),
          at: now,
          byId,
          byName,
          action: 'started',
        }
        return {
          ...i,
          status: 'in_progress',
          startedAt: now,
          updatedAt: now,
          timeline: [event, ...i.timeline],
        }
      })
    )
  }, [])

  const saveResponses = useCallback((id: string, responses: InspectionItemResponse[]) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        return {
          ...i,
          responses,
          updatedAt: new Date().toISOString()
        }
      })
    )
  }, [])

  const submit = useCallback((id: string, byId: string, byName: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        if (i.status !== 'in_progress') return i
        const now = new Date().toISOString()
        
        let templatesRaw: string | null = null
        if (typeof window !== 'undefined') {
          templatesRaw = window.localStorage.getItem('ims-templates-v2')
        }
        let tpl: any = null
        try {
          if (templatesRaw) {
            const templates = JSON.parse(templatesRaw)
            tpl = templates.find((t: any) => t.id === i.templateId)
          }
        } catch {}

        const newIssues: InspectionIssue[] = []
        for (const resp of i.responses) {
          if (resp.answer === 'fail') {
            const exists = i.issues.some(iss => iss.itemId === resp.itemId)
            if (!exists) {
              let prompt = `(item ${resp.itemId})`
              if (tpl && tpl.sections) {
                for (const sec of tpl.sections) {
                  const itm = sec.items.find((x: any) => x.id === resp.itemId)
                  if (itm) {
                    prompt = itm.prompt
                    break
                  }
                }
              }
              newIssues.push({
                id: genId('iss'),
                itemId: resp.itemId,
                itemPrompt: prompt,
                assigneeId: null,
                assigneeName: null,
                fixSubmittedAt: null,
                verifiedAt: null,
                state: 'open',
                createdAt: now,
                updatedAt: now,
              })
            }
          }
        }

        const event: InspectionTimelineEvent = {
          id: genId('evt'),
          at: now,
          byId,
          byName,
          action: 'submitted',
        }

        return {
          ...i,
          status: 'submitted',
          submittedAt: now,
          updatedAt: now,
          issues: [...i.issues, ...newIssues],
          timeline: [event, ...i.timeline],
        }
      })
    )
  }, [])

  const resumeRejected = useCallback((id: string, byId: string, byName: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        if (i.status !== 'rejected') return i
        const now = new Date().toISOString()
        const event: InspectionTimelineEvent = {
          id: genId('evt'),
          at: now,
          byId,
          byName,
          action: 'started',
          note: 'Resumed after rejection',
        }
        return {
          ...i,
          status: 'in_progress',
          updatedAt: now,
          timeline: [event, ...i.timeline],
        }
      })
    )
  }, [])

  const approve = useCallback((id: string, byId: string, byName: string, note?: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const now = new Date().toISOString()
        const hasOpenIssues = i.issues.some((iss) => iss.state !== 'closed')
        // Approved with open issues → issues_open. Otherwise → approved.
        const nextStatus: InspectionStatus = hasOpenIssues ? 'issues_open' : 'approved'
        const event: InspectionTimelineEvent = {
          id: genId('evt'),
          at: now,
          byId,
          byName,
          action: 'approved',
          note,
        }
        return {
          ...i,
          status: nextStatus,
          reviewedAt: now,
          updatedAt: now,
          timeline: [event, ...i.timeline],
        }
      })
    )
  }, [])

  const reject = useCallback((id: string, byId: string, byName: string, note: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const now = new Date().toISOString()
        const event: InspectionTimelineEvent = {
          id: genId('evt'),
          at: now,
          byId,
          byName,
          action: 'rejected',
          note,
        }
        return {
          ...i,
          status: 'rejected',
          reviewedAt: now,
          updatedAt: now,
          timeline: [event, ...i.timeline],
        }
      })
    )
  }, [])

  const verifyIssue = useCallback(
    (inspectionId: string, issueId: string, byId: string, byName: string, note?: string) => {
      setInspections((prev) =>
        prev.map((i) => {
          if (i.id !== inspectionId) return i
          const now = new Date().toISOString()
          const updatedIssues = i.issues.map((iss) =>
            iss.id === issueId
              ? { ...iss, state: 'closed' as const, verifiedAt: now, reviewNotes: note, updatedAt: now }
              : iss
          )
          const allClosed = updatedIssues.every((iss) => iss.state === 'closed')
          const event: InspectionTimelineEvent = {
            id: genId('evt'),
            at: now,
            byId,
            byName,
            action: 'issue_verified',
            note,
            target: issueId,
          }
          return {
            ...i,
            issues: updatedIssues,
            status: allClosed && i.status === 'issues_open' ? 'issues_closed' : i.status,
            updatedAt: now,
            timeline: [event, ...i.timeline],
          }
        })
      )
    },
    []
  )

  const reopenIssue = useCallback(
    (inspectionId: string, issueId: string, byId: string, byName: string, note: string) => {
      setInspections((prev) =>
        prev.map((i) => {
          if (i.id !== inspectionId) return i
          const now = new Date().toISOString()
          const updatedIssues = i.issues.map((iss) =>
            iss.id === issueId
              ? { ...iss, state: 'in_progress' as const, fixSubmittedAt: null, verifiedAt: null, reviewNotes: note, updatedAt: now }
              : iss
          )
          const event: InspectionTimelineEvent = {
            id: genId('evt'),
            at: now,
            byId,
            byName,
            action: 'issue_reopened',
            note,
            target: issueId,
          }
          return {
            ...i,
            issues: updatedIssues,
            status: i.status === 'issues_closed' ? 'issues_open' : i.status,
            updatedAt: now,
            timeline: [event, ...i.timeline],
          }
        })
      )
    },
    []
  )

  const reassignIssue = useCallback(
    (inspectionId: string, issueId: string, newAssigneeId: string, newAssigneeName: string, byId: string, byName: string, note: string) => {
      setInspections((prev) =>
        prev.map((i) => {
          if (i.id !== inspectionId) return i
          const now = new Date().toISOString()
          const updatedIssues = i.issues.map((iss) =>
            iss.id === issueId
              ? {
                  ...iss,
                  assigneeId: newAssigneeId,
                  assigneeName: newAssigneeName,
                  state: iss.state === 'open' ? 'in_progress' : iss.state,
                  updatedAt: now
                }
              : iss
          )
          const event: InspectionTimelineEvent = {
            id: genId('evt'),
            at: now,
            byId,
            byName,
            action: 'issue_reassigned',
            note,
            target: issueId,
          }
          return {
            ...i,
            issues: updatedIssues,
            updatedAt: now,
            timeline: [event, ...i.timeline],
          }
        })
      )
    },
    []
  )

  const submitIssueFix = useCallback(
    (inspectionId: string, issueId: string, byId: string, byName: string, notes: string, attachments: string[]) => {
      setInspections((prev) =>
        prev.map((i) => {
          if (i.id !== inspectionId) return i
          const now = new Date().toISOString()
          const updatedIssues = i.issues.map((iss) =>
            iss.id === issueId
              ? {
                  ...iss,
                  state: 'awaiting_verification' as const,
                  fixSubmittedAt: now,
                  fixNotes: notes,
                  fixAttachments: attachments,
                  updatedAt: now,
                }
              : iss
          )
          const event: InspectionTimelineEvent = {
            id: genId('evt'),
            at: now,
            byId,
            byName,
            action: 'issue_fix_submitted',
            note: notes,
            target: issueId,
          }
          return {
            ...i,
            issues: updatedIssues,
            updatedAt: now,
            timeline: [event, ...i.timeline],
          }
        })
      )
    },
    []
  )

  return {
    inspections,
    getById,
    update,
    setStatus,
    add,
    remove,
    reset,
    start,
    saveResponses,
    submit,
    resumeRejected,
    approve,
    reject,
    verifyIssue,
    reopenIssue,
    reassignIssue,
    submitIssueFix,
  }
}

/* ============================================================
 * Formatting helpers
 * ============================================================ */

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const target = new Date(iso).getTime()
  const diff = Date.now() - target
  const absMin = Math.floor(Math.abs(diff) / 60_000)
  if (diff >= 0) {
    if (absMin < 1) return 'just now'
    if (absMin < 60) return `${absMin}m ago`
    const h = Math.floor(absMin / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d ago`
    return `${Math.floor(d / 30)}mo ago`
  } else {
    if (absMin < 60) return `in ${absMin}m`
    const h = Math.floor(absMin / 60)
    if (h < 24) return `in ${h}h`
    const d = Math.floor(h / 24)
    return `in ${d}d`
  }
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const t = new Date()
  return d.toDateString() === t.toDateString()
}

export function isTomorrow(iso: string): boolean {
  const d = new Date(iso)
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return d.toDateString() === t.toDateString()
}

export interface IssueWithContext {
  issue: InspectionIssue
  inspection: Inspection
}

export function flattenIssues(inspections: Inspection[]): IssueWithContext[] {
  return inspections.flatMap((insp) =>
    insp.issues.map((issue) => ({ issue, inspection: insp }))
  )
}

export function filterToInspectorInspections(
  inspections: Inspection[],
  user: { name: string; email: string } | null
): Inspection[] {
  if (!user) return []
  return inspections.filter(
    (i) => i.inspectorName === user.name || i.inspectorId === user.email
  )
}

/* ============================================================
   Top Management Analytics Helpers
   ============================================================ */

/** Get completed items (responses) in the window */
export function getCompletedResponses(inspections: Inspection[], windowDays: number, domain?: 'all' | 'quality' | 'safety') {
  const cutoff = Date.now() - windowDays * 86400000;
  return inspections
    .filter(i => (!domain || domain === 'all' || i.domain === domain) && (i.status === 'published' || i.status === 'issues_open' || i.status === 'issues_closed'))
    .filter(i => i.publishedAt && new Date(i.publishedAt).getTime() >= cutoff) // Only count items from published/completed inspections in window
    .flatMap(i => i.responses);
}

export function computeComplianceRate(inspections: Inspection[], windowDays: number, domain?: 'all' | 'quality' | 'safety'): number {
  const responses = getCompletedResponses(inspections, windowDays, domain);
  const passCount = responses.filter(r => r.answer === 'pass').length;
  const failCount = responses.filter(r => r.answer === 'fail').length;
  const total = passCount + failCount;
  if (total === 0) return 100;
  return Math.round((passCount / total) * 100);
}

export function computeSitesAtRisk(inspections: Inspection[], windowDays: number, domain?: 'all' | 'quality' | 'safety'): string[] {
  // Return siteIds at risk.
  // Criteria: (a) > 3 open issues, OR (b) any issue > 14d, OR (c) compliance rate < 90%
  const sites = new Set(inspections.map(i => i.siteId));
  const atRisk = new Set<string>();

  sites.forEach(siteId => {
    const siteInsps = inspections.filter(i => i.siteId === siteId && (!domain || domain === 'all' || i.domain === domain));
    
    // Check compliance
    const compRate = computeComplianceRate(siteInsps, windowDays);
    if (compRate < 90) {
      atRisk.add(siteId);
      return;
    }

    // Check issues
    let openIssuesCount = 0;
    let hasAgedIssue = false;
    const now = Date.now();

    siteInsps.forEach(insp => {
      insp.issues.forEach(iss => {
        if (['open', 'in_progress', 'reopened'].includes(iss.state)) {
          openIssuesCount++;
          const ageDays = (now - new Date(iss.createdAt).getTime()) / 86400000;
          if (ageDays > 14) hasAgedIssue = true;
        }
      });
    });

    if (openIssuesCount > 3 || hasAgedIssue) {
      atRisk.add(siteId);
    }
  });

  return Array.from(atRisk);
}

export function computeAgingIssues(inspections: Inspection[], minAgeDays: number, domain?: 'all' | 'quality' | 'safety') {
  const now = Date.now();
  let count = 0;
  inspections.forEach(i => {
    if (domain && domain !== 'all' && i.domain !== domain) return;
    i.issues.forEach(iss => {
      if (['open', 'in_progress', 'reopened', 'awaiting_verification'].includes(iss.state)) {
        const ageDays = (now - new Date(iss.createdAt).getTime()) / 86400000;
        if (ageDays > minAgeDays) count++;
      }
    });
  });
  return count;
}

export function computeThroughput(inspections: Inspection[], windowDays: number, domain?: 'all' | 'quality' | 'safety'): { date: string, count: number }[] {
  const counts: Record<string, number> = {};
  const cutoff = Date.now() - windowDays * 86400000;
  
  // Initialize last X days
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    counts[dateStr] = 0;
  }

  inspections.forEach(i => {
    if (domain && domain !== 'all' && i.domain !== domain) return;
    // Count 'submitted' or 'published' events as throughput
    i.timeline.forEach(e => {
      if (e.action === 'submitted' || e.action === 'published') {
        if (new Date(e.at).getTime() >= cutoff) {
          const dateStr = new Date(e.at).toISOString().split('T')[0];
          if (counts[dateStr] !== undefined) {
            counts[dateStr]++;
          }
        }
      }
    });
  });

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function filterInspections(inspections: Inspection[], windowDays: number, domain?: 'all' | 'quality' | 'safety') {
  const cutoff = Date.now() - windowDays * 86400000;
  return inspections.filter(i => {
    if (domain && domain !== 'all' && i.domain !== domain) return false;
    return new Date(i.updatedAt).getTime() >= cutoff || new Date(i.createdAt).getTime() >= cutoff;
  });
}
