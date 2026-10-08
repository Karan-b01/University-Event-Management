import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Lock,
  Layers,
  FileText,
  DollarSign,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  Clock,
  Play,
  Users,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

export const LandingPage = ({ onNavigate, onOpenAuth }) => {
  const modules = [
    {
      id: 'student',
      number: 'Module 01 & 02',
      title: 'Student Proposal & Document Engine',
      subtitle: 'Progressive Drafts & Polymorphic STI Documents',
      desc: 'Enables organizing committees to draft complex event dossiers with flexible JSON rosters, schedule milestones, and verified disk storage.',
      badge: 'Student Suite',
      badgeVariant: 'default',
      icon: FileText,
      target: 'student',
      features: [
        'Progressive Draft persistence with partial validation',
        'Single Table Inheritance (Poster & Vendor Quotations)',
        'Full JSON UML export simulation archive',
      ],
    },
    {
      id: 'wizard',
      number: 'Module 02',
      title: 'Multi-Stage Proposal Wizard',
      subtitle: '4-Step Guided Governance Submission',
      desc: 'Step-by-step gatekeeper enforcing complete rosters, mathematical dates, itemized finances, and automated compliance clearances.',
      badge: 'Interactive Stepper',
      badgeVariant: 'teal',
      icon: Layers,
      target: 'wizard',
      features: [
        'Automated pre-screening validation check',
        'Capacity vs attendance ratio calculations',
        'Emergency Action Plan requirement injection',
      ],
    },
    {
      id: 'approvals',
      number: 'Module 05',
      title: 'Approval Inbox & Compliance Engine',
      subtitle: 'Dynamic State-Machine Multi-Tier Routing',
      desc: 'Automated pre-screening inspects mass attendance (>400), overnight schedules, and high-velocity risks, dynamically routing through security and faculty gates.',
      badge: 'Compliance & Audit',
      badgeVariant: 'security flag',
      icon: ShieldCheck,
      target: 'approvals',
      features: [
        'Automated risk flags with prescriptive mitigations',
        'Step-locked role-gated node progression',
        'Immutable chronological audit history trail',
      ],
    },
    {
      id: 'finance',
      number: 'Module 03',
      title: 'Fiscal Desk & Duplicate Invoice Guard',
      subtitle: '1-to-1 Budget Tracking & Cumulative Overrun Lock',
      desc: 'Monitors allocations vs real-time commitments. Automated detection flags identical vendor invoice triples, preventing duplicate disbursements.',
      badge: 'Fiscal Integrity',
      badgeVariant: 'warning',
      icon: DollarSign,
      target: 'finance',
      features: [
        'Automated (vendor, amount, date) duplicate receipt rejection',
        'Cumulative commitments overrun prevention',
        'Polymorphic payment logging (Bank, UPI, Cheque)',
      ],
    },
    {
      id: 'calendar',
      number: 'Module 04',
      title: 'Resource Matrix & Concurrency Locking',
      subtitle: 'Pessimistic Row-Level Locking & Overlap Detection',
      desc: 'Campus asset booking powered by database row-level locking (.with_for_update()) preventing double-bookings with interval intersection rules.',
      badge: 'Concurrency Engine',
      badgeVariant: 'approved',
      icon: Calendar,
      target: 'calendar',
      features: [
        'Pessimistic locking eliminates race conditions',
        'Mathematical interval overlap detection (Conflict 409)',
        'Single Table catalog: Venues, Equipment, Transports',
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO SECTION WITH VIDEO BACKGROUND PLACEHOLDER */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-zinc-200 dark:border-white/10">
        {/* Ambient Video Background Simulation */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Video Placeholder Surface with deep lighting */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-100/80 via-white to-zinc-50 dark:from-[#05080A] dark:via-[#090D10]/95 dark:to-[#05080A]" />

          {/* Glowing emerald aura for dark mode */}
          <div className="hidden dark:block absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="hidden dark:block absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Video / Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-emerald-500/30 bg-zinc-100/90 dark:bg-[#090D10]/80 backdrop-blur-md mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-zinc-800 dark:text-emerald-400">
              Institutional Event & Compliance Infrastructure
            </span>
            <span className="text-zinc-400 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-slate-400">
              <Play className="w-3 h-3 fill-current text-zinc-400 dark:text-emerald-400" />
              <span>Veritas Live</span>
            </div>
          </div>

          {/* Centered Hero Text (Noto Serif Display) */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-zinc-950 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Academic Event Operations &amp;{' '}
            <span className="italic font-normal underline decoration-1 underline-offset-8 decoration-zinc-300 dark:decoration-emerald-500/50">
              Automated Compliance
            </span>
          </h1>

          <p className="mt-6 font-sans text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Eliminating fragmented paper trails with mathematical resource concurrency,
            automated safety risk pre-screening, and duplicate-proof fiscal controls.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('wizard')}
              icon={ArrowRight}
              iconPosition="right"
              className="text-sm font-bold tracking-wide"
            >
              Draft Event Proposal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('approvals')}
              icon={ShieldCheck}
              className="text-sm font-medium"
            >
              Approval Inbox
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onOpenAuth}
              icon={Users}
              className="text-sm"
            >
              Sign In to Portal
            </Button>
          </div>

          {/* Institutional Integrity Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-[#090D10]/60 backdrop-blur-md max-w-4xl mx-auto shadow-sm">
            <div className="p-3 text-center border-r border-zinc-100 dark:border-white/5 last:border-r-0">
              <p className="font-serif text-2xl lg:text-3xl font-bold text-zinc-950 dark:text-white">
                99.98%
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mt-1">
                Lock Concurrency
              </p>
            </div>
            <div className="p-3 text-center border-r border-zinc-100 dark:border-white/5 last:border-r-0">
              <p className="font-serif text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                0 Blocked
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mt-1">
                Budget Overruns
              </p>
            </div>
            <div className="p-3 text-center border-r border-zinc-100 dark:border-white/5 last:border-r-0">
              <p className="font-serif text-2xl lg:text-3xl font-bold text-zinc-950 dark:text-white">
                5-Tier
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mt-1">
                Dynamic Routing
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="font-serif text-2xl lg:text-3xl font-bold text-zinc-950 dark:text-white">
                100%
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mt-1">
                Immutable Audit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MODULE GRID (5 OOAD ARCHITECTURAL DOMAINS) */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="teal" className="mb-3">
            OOAD Domain Architecture
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Five Integrated Operational Modules
          </h2>
          <p className="mt-3 font-sans text-sm sm:text-base text-zinc-600 dark:text-slate-400">
            Each subsystem is modeled with clean boundaries, transactional integrity, and
            strict academic compliance standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.target)}
                className="group cursor-pointer rounded-xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between
                  bg-white border border-zinc-200 hover:border-black hover:shadow-lg
                  dark:bg-[#090D10]/80 dark:border-white/10 dark:hover:border-emerald-500/50 dark:hover:shadow-[0_10px_30px_-5px_rgba(16,185,129,0.15)]"
              >
                {/* Subtle top edge lighting */}
                <div className="absolute top-0 inset-x-0 h-px bg-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-emerald-400/30 dark:to-transparent" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-400">
                      {mod.number}
                    </span>
                    <Badge variant={mod.badgeVariant}>{mod.badge}</Badge>
                  </div>

                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors
                    bg-zinc-100 text-black group-hover:bg-black group-hover:text-white
                    dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30 dark:group-hover:bg-emerald-500/20">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-xl font-bold tracking-tight text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-emerald-300 transition-colors">
                    {mod.title}
                  </h3>

                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-teal-400/90 font-sans mt-1">
                    {mod.subtitle}
                  </p>

                  <p className="mt-3 text-sm text-zinc-600 dark:text-slate-300 font-sans leading-relaxed">
                    {mod.desc}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-zinc-100 dark:border-white/5 pt-4">
                    {mod.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-zinc-500 dark:text-slate-400 flex items-start gap-2 font-sans"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-emerald-400 font-sans group-hover:translate-x-1 transition-transform">
                  <span>Open Interface</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}

          {/* Quick Demo Walkthrough Card */}
          <div className="rounded-xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between
            bg-zinc-50 border border-dashed border-zinc-300
            dark:bg-[#05080A] dark:border-emerald-500/30">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-400">
                  Interactive Exploration
                </span>
                <Badge variant="purple">Full Prototype</Badge>
              </div>

              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-zinc-200 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="font-serif text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Live Prototype Navigation
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-slate-300 font-sans">
                Explore all 7 core operational interfaces with complete mock JSON dataset,
                dark/light mode toggles, and zero backend friction.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('student')}
                  className="w-full justify-between"
                >
                  <span>Student Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('finance')}
                  className="w-full justify-between"
                >
                  <span>Finance & Disbursements</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('calendar')}
                  className="w-full justify-between"
                >
                  <span>Resource Concurrency Grid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-white/10 py-10 bg-white dark:bg-[#05080A] text-zinc-500 dark:text-slate-400 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-zinc-900 dark:text-white text-sm">
              UniEvent Veritas
            </span>
            <span>&copy; {new Date().getFullYear()} University Governance Office</span>
          </div>
          <div className="flex items-center gap-6">
            <span>FastAPI Backend Gateway</span>
            <span>Pessimistic Concurrency</span>
            <span>Dual Theme Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
