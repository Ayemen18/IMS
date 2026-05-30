import { Icon } from '../components/primitives/Icon'
import { Wordmark } from '../components/primitives/Wordmark'
import { useNav } from '../lib/router'
import { useReveal } from '../lib/useReveal'

export function Landing() {
  const nav = useNav()
  const addReveal = useReveal()

  return (
    <div className="relative">
      {/* ================= HERO ================= */}
      <section className="relative px-6 sm:px-10 lg:px-16 pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-white">
        {/* Subtle atmospheric brand glow behind the right card */}
        <div 
          className="absolute top-0 right-0 w-[55%] h-[80%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(40, 81, 184, 0.06), transparent 65%)',
          }}
          aria-hidden="true"
        />
        
        <div className="relative max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
            {/* LEFT COLUMN — content */}
            <div className="stagger">
              {/* Yellow pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 border border-warning/30">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-warning">
                  Inspection Management Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="mt-8 font-sans text-[44px] sm:text-[56px] lg:text-[68px] xl:text-[76px] leading-[1.05] font-bold tracking-tight text-text-primary">
                Where inspections become<br />
                <span className="relative inline-block">
                  audit-ready evidence
                  <span 
                    className="absolute -bottom-1 left-0 h-1.5 bg-warning origin-left rounded-full"
                    style={{
                      width: '100%',
                      animation: 'drawIn 800ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both',
                      transform: 'scaleX(0)',
                    }}
                    aria-hidden="true"
                  />
                </span>
                .
              </h1>

              {/* Subhead */}
              <p className="mt-6 max-w-[560px] text-[16px] sm:text-[17px] leading-[1.6] text-text-secondary">
                Build, track, and certify inspection programs across pharma and food manufacturing — in one place. 
                Schedule, execute, review, and close out, with a trail that survives the auditor's first question.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {/* Primary navy CTA */}
                <button 
                  onClick={() => nav.push('/login')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary text-white text-[15px] font-semibold transition shadow-sm hover:shadow-md"
                >
                  Get Started
                  <Icon name="arrow_right" className="w-4 h-4" />
                </button>
                
                {/* Secondary outlined CTA */}
                <button 
                  onClick={() => nav.push('/login')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-text-secondary/15 bg-white hover:bg-accent-light text-text-primary text-[15px] font-semibold transition"
                >
                  See How It Works
                </button>
                
                {/* Trust signal */}
                <span className="ml-2 text-[13px] text-text-secondary font-mono">
                  No credit card · 14-day trial
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN — demo card */}
            <div 
              className="hidden lg:block"
              style={{
                animation: 'fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both',
                opacity: 0,
              }}
            >
              <HeroMockCard />
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 1 — COMPANY MARQUEE ================= */}
      <LogoMarquee />

      {/* ================= SECTION 2 — PRINCIPLES ================= */}
      <section className="py-24 lg:py-32 px-6 sm:px-10 lg:px-16 bg-white">
        <div className="max-w-[1280px] mx-auto">
          {/* Section header */}
          <div ref={addReveal} className="reveal text-center mb-14">
            {/* Yellow section pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 border border-warning/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-warning">
                Why InspectSphere
              </span>
            </div>
            
            {/* Bold sans headline */}
            <h2 className="font-sans text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] font-bold tracking-tight text-text-primary max-w-[820px] mx-auto">
              Built for the inspections that matter most.
            </h2>
            
            <p className="mt-5 text-[16px] leading-relaxed text-text-secondary max-w-[640px] mx-auto">
              Every feature exists because a quality team asked for it. Every workflow holds up under scrutiny.
            </p>
          </div>
          
          {/* Three principle cards in a row */}
          <div ref={addReveal} className="reveal grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {/* Card 1 — Audit-ready trails */}
            <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-7 lg:p-8 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
              {/* Decorative icon top-right */}
              <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Icon name="layers" className="w-5 h-5 text-primary" />
              </div>
              
              {/* Card label */}
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-3">
                Audit Ready
              </div>
              
              {/* Card title */}
              <h3 className="font-sans text-[22px] lg:text-[24px] font-bold leading-tight tracking-tight text-text-primary mb-3">
                Every action leaves a trail.
              </h3>
              
              {/* Card body */}
              <p className="text-[14px] leading-relaxed text-text-secondary">
                Submissions, approvals, rejections, corrective actions — all timestamped, all attributed, all exportable in a single click when the auditor arrives.
              </p>
            </div>
            
            {/* Card 2 — Role-based workflows */}
            <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-7 lg:p-8 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" aria-hidden="true" />
              <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Icon name="check" className="w-5 h-5 text-warning" />
              </div>
              
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-warning mb-3">
                Role-Based
              </div>
              
              <h3 className="font-sans text-[22px] lg:text-[24px] font-bold leading-tight tracking-tight text-text-primary mb-3">
                Seven roles, one source of truth.
              </h3>
              
              <p className="text-[14px] leading-relaxed text-text-secondary">
                Managers schedule. Inspectors execute. Employees fix. Top management sees the operation. Each role gets exactly the surface they need — no more, no less.
              </p>
            </div>
            
            {/* Card 3 — Compliance-first */}
            <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-7 lg:p-8 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-status-pass" aria-hidden="true" />
              <div className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Icon name="alert" className="w-5 h-5 text-status-pass" />
              </div>
              
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-status-pass mb-3">
                Compliance First
              </div>
              
              <h3 className="font-sans text-[22px] lg:text-[24px] font-bold leading-tight tracking-tight text-text-primary mb-3">
                Made for GMP, HACCP, ISO 22000.
              </h3>
              
              <p className="text-[14px] leading-relaxed text-text-secondary">
                Templates ship with the controls regulators expect. Versioning, electronic signatures, deviation tracking — all built in, all defensible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 3 — METRICS ================= */}
      <section className="py-24 lg:py-32 px-6 sm:px-10 lg:px-16 bg-primary text-white">
        <div className="max-w-[1280px] mx-auto">
          {/* Section header */}
          <div ref={addReveal} className="reveal text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/20 border border-warning/40 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-warning">
                By the numbers
              </span>
            </div>
            
            <h2 className="font-sans text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] font-bold tracking-tight text-white max-w-[820px] mx-auto">
              Inspections that scale with your operation.
            </h2>
          </div>
          
          {/* Stat grid */}
          <div ref={addReveal} className="reveal grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div className="text-center">
              <div className="font-mono text-[48px] lg:text-[64px] font-bold text-warning leading-none">
                250K+
              </div>
              <div className="mt-3 text-[13px] uppercase tracking-wide text-white/60 font-semibold">
                Inspections completed
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-mono text-[48px] lg:text-[64px] font-bold text-white leading-none">
                99.4%
              </div>
              <div className="mt-3 text-[13px] uppercase tracking-wide text-white/60 font-semibold">
                Audit pass rate
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-mono text-[48px] lg:text-[64px] font-bold text-warning leading-none">
                7
              </div>
              <div className="mt-3 text-[13px] uppercase tracking-wide text-white/60 font-semibold">
                Roles, one platform
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-mono text-[48px] lg:text-[64px] font-bold text-white leading-none">
                12min
              </div>
              <div className="mt-3 text-[13px] uppercase tracking-wide text-white/60 font-semibold">
                Avg inspection time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4 — FOOTER CTA ================= */}
      <section className="py-24 lg:py-32 px-6 sm:px-10 lg:px-16 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div ref={addReveal} className="reveal max-w-[900px] mx-auto text-center mb-24">
            {/* Yellow pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 border border-warning/30 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-warning">
                Get Started Today
              </span>
            </div>
            
            {/* Big closing headline */}
            <h2 className="font-sans text-[40px] sm:text-[52px] lg:text-[64px] leading-[1.05] font-bold tracking-tight text-text-primary mb-6">
              Ready for inspections that<br />
              <span className="relative inline-block">
                hold up under audit
                <span 
                  className="absolute -bottom-1 left-0 h-1.5 bg-warning origin-left rounded-full"
                  style={{ width: '100%' }}
                  aria-hidden="true"
                />
              </span>
              ?
            </h2>
            
            {/* Subhead */}
            <p className="text-[17px] leading-relaxed text-text-secondary max-w-[560px] mx-auto mb-10">
              Start your free trial in under 60 seconds. No credit card. No sales call. Just the product.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => nav.push('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary text-white text-[15px] font-semibold transition shadow-sm hover:shadow-md"
              >
                Start Free Trial
                <Icon name="arrow_right" className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => nav.push('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-text-secondary/15 bg-white hover:bg-accent-light text-text-primary text-[15px] font-semibold transition"
              >
                Book a Demo
              </button>
            </div>
            
            {/* Trust signal */}
            <p className="mt-8 text-[13px] text-text-secondary font-mono">
              No credit card · 14-day trial · Cancel anytime
            </p>
          </div>

          {/* Footer links */}
          <div className="pt-8 border-t border-text-secondary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Wordmark />
              <span className="text-[11px] font-mono text-text-secondary">est. 2026</span>
            </div>
            <div className="flex items-center gap-6 text-[12px] text-text-secondary font-semibold font-sans">
              <a className="hover:text-text-primary cursor-pointer transition">Product</a>
              <a className="hover:text-text-primary cursor-pointer transition">Compliance</a>
              <a className="hover:text-text-primary cursor-pointer transition">Customers</a>
              <a className="hover:text-text-primary cursor-pointer transition">Docs</a>
              <a className="hover:text-text-primary cursor-pointer transition">Contact</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroMockCard() {
  return (
    <div className="relative">
      {/* Decorative yellow square behind the card */}
      <div 
        className="absolute -top-4 -right-4 w-24 h-24 bg-warning/20 rounded-2xl rotate-6" 
        aria-hidden="true"
      />
      
      {/* Main card */}
      <div className="relative rounded-2xl bg-white shadow-lift border border-text-secondary/15 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-pass" aria-hidden="true" />
            <span className="font-mono text-[12px] text-text-primary">INS-2026-04829</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-semibold uppercase tracking-wide ring-1 ring-warning/20">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            Under review
          </span>
        </div>
        
        {/* Title */}
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-secondary font-semibold">Inspection</div>
          <div className="mt-1 text-[18px] font-bold text-text-primary">Daily CCP verification · Line 3</div>
        </div>
        
        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-accent-light p-3 border border-text-secondary/5">
            <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide">Items</div>
            <div className="mt-1 font-mono text-[18px] font-bold text-text-primary">24 / 24</div>
          </div>
          <div className="rounded-xl bg-status-fail/10 p-3 border border-status-fail/20">
            <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide">Fails</div>
            <div className="mt-1 font-mono text-[18px] font-bold text-status-fail">2</div>
          </div>
          <div className="rounded-xl bg-warning/15 p-3 border border-warning/30">
            <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide">Evidence</div>
            <div className="mt-1 font-mono text-[18px] font-bold text-text-primary">11</div>
          </div>
        </div>
        
        {/* Pass/fail rows */}
        <div className="space-y-2.5">
          {[
            { name: 'Pre-op sanitation', status: 'pass' },
            { name: 'Allergen changeover', status: 'pass' },
            { name: 'CCP-2 temperature', status: 'fail' },
            { name: 'CCP-3 metal detector', status: 'pass' },
            { name: 'GMP — handwashing log', status: 'pass' },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">{item.name}</span>
              <span className={`font-mono text-[11px] font-bold uppercase ${ item.status === 'pass' ? 'text-status-pass' : 'text-status-fail' }`}>
                {item.status === 'pass' ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
        
        {/* Footer hint */}
        <div className="mt-6 pt-5 border-t border-text-secondary/15">
          <div className="text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Auditor view</div>
          <div className="mt-1 text-[13px] font-semibold text-text-primary">Ready in 3 clicks</div>
        </div>
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
    <section className="py-16 px-6 sm:px-10 lg:px-16 border-y border-text-secondary/15 bg-accent-light">
      <div ref={addReveal} className="reveal max-w-[1280px] mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Trusted by quality teams at
          </span>
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="marquee-track flex gap-12 whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex gap-12 items-center">
                {names.map((n, i) => (
                  <div key={i} className="font-sans text-[22px] font-bold tracking-tight text-text-secondary/40">
                    {n}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
