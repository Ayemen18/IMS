import { Icon } from '../components/primitives/Icon'
import { StatusPill } from '../components/primitives/StatusPill'
import { Wordmark } from '../components/primitives/Wordmark'
import { useNav } from '../lib/router'
import { useReveal } from '../lib/useReveal'
import { ROLES } from '../lib/roles'

export function Landing() {
  const nav = useNav()
  const addReveal = useReveal()

  return (
    <div className="relative">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        {/* Atmospheric brand gradients */}
        <div 
          className="absolute top-0 right-0 w-[60%] h-[80%] pointer-events-none hidden dark:block"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(40, 81, 184, 0.18), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div 
          className="absolute top-0 right-0 w-[60%] h-[80%] pointer-events-none block dark:hidden"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(40, 81, 184, 0.08), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div 
          className="absolute bottom-0 left-0 w-[40%] h-[40%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at bottom left, rgba(245, 184, 0, 0.04), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="max-w-[1400px] mx-auto px-6 pt-20 pb-24 relative">
          <div className="grid grid-cols-12 gap-8 items-end">
            {/* Headline column */}
            <div className="col-span-12 lg:col-span-8 stagger">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-500/10 border border-accent-100 dark:border-accent-500/20 text-[12px] font-medium text-accent-700 dark:text-accent-300">
                <Icon name="sparkle" className="w-3 h-3 text-accent-500" />
                Built for GMP and HACCP-regulated environments
              </div>

              <h1 className="mt-6 font-display text-[64px] sm:text-[88px] lg:text-[108px] leading-[0.92] tracking-[-0.02em] text-ink-900 dark:text-ink-50 text-balance">
                Inspections that
                <br />
                <span className="relative inline-block">
                  <span className="italic text-accent-500 dark:text-accent-400">hold up</span>
                  <span 
                    className="absolute -bottom-1 left-0 h-1 bg-brand-yellow-500 origin-left"
                    style={{
                      width: '100%',
                      animation: 'drawIn 800ms cubic-bezier(0.16, 1, 0.3, 1) 600ms both',
                      transform: 'scaleX(0)',
                    }}
                    aria-hidden="true"
                  />
                </span> under audit.
              </h1>

              <p className="mt-7 max-w-[560px] text-[17px] leading-[1.55] text-ink-600 dark:text-ink-300 text-pretty">
                InspectSphere is the inspection management system for pharma and food manufacturers who
                can't afford ambiguity. Schedule, execute, review, and close out — with a trail
                that survives the auditor's first question.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => nav.push('/login')}
                  className="btn-primary relative overflow-hidden inline-flex items-center gap-2 px-5 py-3 rounded-md bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore the demo
                    <Icon name="arrow_right" className="w-4 h-4" />
                  </span>
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-brand-yellow-500" aria-hidden="true" />
                </button>
                <button
                  onClick={() => nav.push('/login')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md border hairline bg-white/60 dark:bg-ink-800/60 backdrop-blur-sm text-ink-900 dark:text-ink-50 text-[14px] font-medium hover:bg-white dark:hover:bg-ink-800 transition-colors"
                >
                  Sign in
                </button>
                <span className="text-[12px] text-ink-500 dark:text-ink-400 ml-2">
                  No credit card · 14-day trial
                </span>
              </div>
            </div>

            {/* Mock inspection card */}
            <div 
              className="col-span-12 lg:col-span-4 hidden lg:block"
              style={{
                animation: 'fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both',
                opacity: 0,
              }}
            >
              <HeroMockCard />
            </div>
          </div>

          {/* Logo marquee */}
          <LogoMarquee />
        </div>
      </section>

      {/* ================= PRINCIPLES ================= */}
      <section className="border-t hairline">
        <div className="max-w-[1400px] mx-auto px-6 py-24">
          <div ref={addReveal} className="reveal max-w-[760px]">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
              Why teams switch
            </div>
            <h2 className="mt-3 font-display text-[44px] sm:text-[56px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              The inspection record is a legal artifact.
              <br />
              <span className="italic text-ink-500 dark:text-ink-400">We treat it like one.</span>
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
            {PRINCIPLES.map((card, i) => (
              <div
                key={i}
                ref={addReveal}
                className="reveal bg-white dark:bg-ink-900 p-8 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[11px] text-ink-400 dark:text-ink-500">{card.k}</div>
                  <Icon name={card.icon} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
                </div>
                <h3 className="mt-12 text-[19px] font-medium text-ink-900 dark:text-ink-50 tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-600 dark:text-ink-300">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MODULES / ROLES ================= */}
      <section className="border-t hairline bg-ink-50 dark:bg-ink-950">
        <div className="max-w-[1400px] mx-auto px-6 py-24">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4">
              <div ref={addReveal} className="reveal sticky top-24">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
                  Inside the platform
                </div>
                <h2 className="mt-3 font-display text-[44px] sm:text-[52px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
                  Seven roles.
                  <br />
                  One source of truth.
                </h2>
                <p className="mt-5 text-[15px] leading-relaxed text-ink-600 dark:text-ink-300 max-w-[420px]">
                  Each role sees only what they need. The system underneath is one continuous
                  record — from the moment an inspection is scheduled to the moment its findings
                  are closed out.
                </p>
                <button
                  onClick={() => nav.push('/login')}
                  className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-ink-900 dark:text-ink-50 hover:gap-3 transition-all"
                >
                  Tour each role
                  <Icon name="arrow_right" className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div ref={addReveal} className="reveal grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map((r, i) => (
                  <div
                    key={r.key}
                    onClick={() => nav.push('/login')}
                    className="group rounded-lg border hairline bg-white dark:bg-ink-900 p-5 hover:border-ink-300 dark:hover:border-ink-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-9 h-9 rounded-md ${r.accent} flex items-center justify-center text-white dark:text-ink-900`}
                      >
                        <Icon name={r.glyph} className="w-4 h-4" />
                      </div>
                      <div className="font-mono text-[10px] text-ink-400 dark:text-ink-500">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <h3 className="mt-5 text-[15px] font-medium text-ink-900 dark:text-ink-50">
                      {r.label}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600 dark:text-ink-300 line-clamp-2">
                      {r.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= METRICS ================= */}
      <section className="border-t hairline">
        <div className="max-w-[1400px] mx-auto px-6 py-24">
          <div
            ref={addReveal}
            className="reveal grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden"
          >
            {METRICS.map((s, i) => (
              <div key={i} className="bg-white dark:bg-ink-900 p-8">
                <div className="font-display text-[56px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
                  {s.v}
                </div>
                <div className="mt-3 text-[13px] text-ink-600 dark:text-ink-300">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA + FOOTER ================= */}
      <section className="border-t hairline bg-ink-900 dark:bg-ink-50 text-ink-50 dark:text-ink-900 relative overflow-hidden noise">
        <div className="max-w-[1400px] mx-auto px-6 py-24 relative">
          <div ref={addReveal} className="reveal grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[52px] sm:text-[72px] leading-[1] tracking-tight text-balance">
                Stop preparing for audits.
                <br />
                <span className="italic opacity-60">Just be ready.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
              <button
                onClick={() => nav.push('/login')}
                className="inline-flex items-center justify-between px-5 py-4 rounded-md bg-ink-50 dark:bg-ink-900 text-ink-900 dark:text-ink-50 text-[14px] font-medium hover:bg-white dark:hover:bg-ink-800 transition-colors"
              >
                Explore the demo
                <Icon name="arrow_right" className="w-4 h-4" />
              </button>
              <button
                onClick={() => nav.push('/login')}
                className="inline-flex items-center justify-between px-5 py-4 rounded-md border border-ink-700 dark:border-ink-300 text-ink-50 dark:text-ink-900 text-[14px] font-medium hover:bg-ink-800 dark:hover:bg-ink-100 transition-colors"
              >
                Sign in to your workspace
                <Icon name="arrow_up_right" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-24 pt-8 border-t border-ink-700 dark:border-ink-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Wordmark />
              <span className="text-[11px] font-mono opacity-60">est. 2026</span>
            </div>
            <div className="flex items-center gap-6 text-[12px] opacity-70">
              <a className="hover:opacity-100 cursor-pointer">Product</a>
              <a className="hover:opacity-100 cursor-pointer">Compliance</a>
              <a className="hover:opacity-100 cursor-pointer">Customers</a>
              <a className="hover:opacity-100 cursor-pointer">Docs</a>
              <a className="hover:opacity-100 cursor-pointer">Contact</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================
 * Helper components — kept in the same file because they're
 * only used by Landing. Move out later if reused.
 * ============================================================ */

function HeroMockCard() {
  const checklistRows = [
    { k: 'Pre-op sanitation',     v: 'pass' },
    { k: 'Allergen changeover',   v: 'pass' },
    { k: 'CCP-2 temperature',     v: 'fail' },
    { k: 'CCP-3 metal detector',  v: 'pass' },
    { k: 'GMP — handwashing log', v: 'fail' },
  ]
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-accent-500/10 to-transparent rounded-2xl blur-2xl" />
      <div className="relative rounded-xl border hairline bg-white dark:bg-ink-800 shadow-[0_20px_60px_-20px_rgba(40,81,184,0.15)] dark:shadow-[0_20px_60px_-20px_rgba(40,81,184,0.4)] overflow-hidden">
        <div className="px-4 py-3 border-b hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal-green" />
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
              INS-2026-04829
            </span>
          </div>
          <StatusPill tone="amber">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-pulse-dot" />
              <span>Under review</span>
            </span>
          </StatusPill>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Inspection
            </div>
            <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">
              Daily CCP verification · Line 3
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-md bg-ink-50 dark:bg-ink-900 px-2 py-2">
              <div className="text-ink-500 dark:text-ink-400">Items</div>
              <div className="font-mono text-ink-900 dark:text-ink-50 mt-0.5">24 / 24</div>
            </div>
            <div className="rounded-md bg-ink-50 dark:bg-ink-900 px-2 py-2">
              <div className="text-ink-500 dark:text-ink-400">Fails</div>
              <div className="font-mono text-signal-red mt-0.5">2</div>
            </div>
            <div className="rounded-md bg-ink-50 dark:bg-ink-900 px-2 py-2">
              <div className="text-ink-500 dark:text-ink-400">Evidence</div>
              <div className="font-mono text-ink-900 dark:text-ink-50 mt-0.5">11</div>
            </div>
          </div>
          <div className="pt-2 border-t hairline space-y-1.5">
            {checklistRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-ink-700 dark:text-ink-200 truncate">{row.k}</span>
                <span
                  className={`font-mono uppercase text-[10px] ${
                    row.v === 'pass' ? 'text-signal-green' : 'text-signal-red'
                  }`}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-3 rounded-md border border-accent-500/20 dark:border-accent-500/30 bg-white dark:bg-ink-800 px-3 py-2 shadow-sm text-[11px]">
        <div className="text-ink-500 dark:text-ink-400">Auditor view</div>
        <div className="font-medium text-ink-900 dark:text-ink-50">Ready in 3 clicks</div>
      </div>
    </div>
  )
}

function LogoMarquee() {
  const addReveal = useReveal()
  const names = [
    'Helix Pharma',
    'Auralis Foods',
    'Northvale Bio',
    'Mendel & Co.',
    'Sterilab',
    'Vereo Nutrition',
    'Quattro Bakeries',
    'Calix Therapeutics',
  ]
  return (
    <div ref={addReveal} className="reveal mt-24 relative">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400 text-center mb-6">
        Trusted by quality teams at
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="marquee-track flex gap-12 whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-12 items-center">
              {names.map((n, i) => (
                <div key={i} className="font-display text-[22px] italic text-ink-300 dark:text-ink-600">
                  {n}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Content data — kept inline; move to a CMS later
 * ============================================================ */

const PRINCIPLES = [
  {
    k: '01',
    title: 'Designed around the lifecycle',
    body: 'Schedule, execute, review, correct, verify, publish. Every state is explicit and every transition is logged.',
    icon: 'layers' as const,
  },
  {
    k: '02',
    title: 'Built for the floor, not the office',
    body: 'Inspectors capture observations, photos, and evidence in the moment. No re-keying from paper.',
    icon: 'check' as const,
  },
  {
    k: '03',
    title: 'Audit-ready by default',
    body: 'Reports render the way regulators expect. Trail is complete, not curated.',
    icon: 'eye' as const,
  },
]

const METRICS = [
  { v: '47%',   l: 'Faster inspection closeout' },
  { v: '99.2%', l: 'Audit-trail completeness' },
  { v: '0',     l: 'Critical Form 483 findings (2025)' },
  { v: '6×',    l: 'Reduction in repeat NCs' },
]
