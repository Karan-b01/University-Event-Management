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
  Sparkles,
  ChevronDown,
  Clock,
  Play,
  Users,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const LandingPage = ({ onNavigate, onOpenAuth }) => {
  const modules = [
    {
      id: 'student',
      number: 'Module 01',
      title: 'Student Organizer Workspace',
      subtitle: 'Proposal Drafting & Team Coordination',
      desc: 'Easily draft event plans, organize committee rosters, and keep all your schedules and event details organized in one collaborative space.',
      badge: 'Student Clubs',
      badgeVariant: 'default',
      icon: FileText,
      target: 'student',
      features: [
        'Save progress anytime with draft autosave',
        'Organize committee rosters and responsibilities',
        'Export complete event briefs and summaries in one click',
      ],
    },
    {
      id: 'wizard',
      number: 'Module 02',
      title: 'Guided Proposal Wizard',
      subtitle: 'Step-by-Step Event Submission',
      desc: 'A friendly 4-step walkthrough that helps you choose dates, match venue capacity, estimate expenses, and attach event flyers and vendor quotes.',
      badge: 'Easy Intake',
      badgeVariant: 'teal',
      icon: Layers,
      target: 'wizard',
      features: [
        'Instant attendee capacity and venue recommendations',
        'Audio/visual and equipment setup checklists',
        'Automated safety pre-checks before final submission',
      ],
    },
    {
      id: 'approvals',
      number: 'Module 05',
      title: 'Fast-Track Approvals & Safety Review',
      subtitle: 'Streamlined Multi-Tier Clearances',
      desc: 'Eliminate chasing paper forms across campus. Faculty advisors, campus security, and dean offices review, leave notes, and sign off digitally.',
      badge: 'Faculty & Deans',
      badgeVariant: 'security flag',
      icon: ShieldCheck,
      target: 'approvals',
      features: [
        'Automated crowd size and late-night safety reviews',
        'Step-by-step role approvals: Advisor, Security, and Dean',
        'Real-time activity logs and transparent status updates',
      ],
    },
    {
      id: 'finance',
      number: 'Module 03',
      title: 'Club Budgets & Expense Desk',
      subtitle: 'Transparent Fiscal Management',
      desc: 'Monitor approved allocations, manage vendor invoices, and prevent duplicate bills with real-time disbursement tracking.',
      badge: 'Finance & Bursar',
      badgeVariant: 'warning',
      icon: DollarSign,
      target: 'finance',
      features: [
        'Automated check to prevent duplicate invoice submissions',
        'Live balance tracking against approved club budgets',
        'Payment tracking for bank wires, UPI, and cheques',
      ],
    },
    {
      id: 'calendar',
      number: 'Module 04',
      title: 'Instant Venue & Resource Booking',
      subtitle: 'Conflict-Free Campus Space Reservations',
      desc: 'Browse auditoriums, lecture halls, and outdoor grounds with live weekly schedules. Reserve spaces with guaranteed zero double-bookings.',
      badge: 'Campus Venues',
      badgeVariant: 'approved',
      icon: Calendar,
      target: 'calendar',
      features: [
        'Interactive weekly availability calendar for campus spaces',
        'Guaranteed conflict-free reservations in real time',
        'One-click booking for halls, stages, and equipment',
      ],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* FULL-VIEWPORT HERO SECTION (Centered Vertically and Horizontally) */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center overflow-hidden border-b border-zinc-200 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-12">
        {/* HTML5 Live Video Background */}
        <video
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-20"
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Translucent Overlay */}
        <div className="absolute inset-0 bg-black/60 -z-10" />

        {/* Vertically and Horizontally Centered Content */}
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center justify-center">
          {/* Platform Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-md mb-6 sm:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-emerald-300">
              University Event &amp; Safety Platform
            </span>
            <span className="text-white/40">|</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-200">
              <Play className="w-3 h-3 fill-current text-emerald-400" />
              <span>Veritas Portal</span>
            </div>
          </div>

          {/* Centered Hero Headline (Noto Serif Display) */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white max-w-4xl mx-auto leading-[1.15] drop-shadow-md">
            University Event Planning &amp;{' '}
            <span className="italic font-normal underline decoration-1 underline-offset-8 decoration-emerald-400/70 text-emerald-300">
              Automated Approvals
            </span>
          </h1>

          {/* Product-Centric Subtitle */}
          <p className="mt-5 sm:mt-6 font-sans text-base sm:text-lg lg:text-xl text-zinc-100 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-sm">
            The modern digital hub for student clubs, faculty advisors, and campus
            administrators. Reserve campus venues, submit event proposals, manage budgets,
            and secure safety clearances in days—not weeks.
          </p>

          {/* Action Call-to-Actions */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('wizard')}
              icon={ArrowRight}
              iconPosition="right"
              className="text-sm font-bold tracking-wide"
            >
              Create Event Proposal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('approvals')}
              icon={ShieldCheck}
              className="text-sm font-medium bg-black/40 border-white/30 text-white hover:bg-black/60 hover:text-emerald-300"
            >
              Review Approvals
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onOpenAuth}
              icon={Users}
              className="text-sm text-zinc-200 hover:text-white hover:bg-white/10"
            >
              Sign In to Portal
            </Button>
          </div>

          {/* Product-Focused Reliability Metrics Bar */}
          <div className="mt-12 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-xl border border-white/20 bg-black/60 backdrop-blur-md w-full max-w-3xl shadow-xl">
            <div className="p-2 sm:p-3 text-center border-r border-white/10 last:border-r-0">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
                100%
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-300 mt-1">
                Paperless Forms
              </p>
            </div>
            <div className="p-2 sm:p-3 text-center border-r border-white/10 last:border-r-0">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-400">
                0 Collisions
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-300 mt-1">
                Guaranteed Venues
              </p>
            </div>
            <div className="p-2 sm:p-3 text-center border-r border-white/10 last:border-r-0">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
                24–48h
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-300 mt-1">
                Average Review
              </p>
            </div>
            <div className="p-2 sm:p-3 text-center">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Real-Time
              </p>
              <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-300 mt-1">
                Budget Tracking
              </p>
            </div>
          </div>

          {/* Smooth Scroll Down Indicator */}
          <button
            onClick={() => {
              const el = document.getElementById('modules-grid');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 sm:mt-10 inline-flex flex-col items-center text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="mb-1 tracking-wider uppercase">Explore Features</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
          </button>
        </div>
      </section>

      {/* MODULE GRID SECTION (PRODUCT-CENTRIC VALUE PROPOSITIONS) */}
      <section id="modules-grid" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="teal" className="mb-3">
            Campus Operations Platform
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Everything You Need to Run Campus Events
          </h2>
          <p className="mt-3 font-sans text-sm sm:text-base text-zinc-600 dark:text-slate-400">
            Tailored tools designed for student organizers, faculty advisors, finance officers,
            and campus security teams.
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
                  <span>Open Workspace</span>
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
                Experience all 7 core operational interfaces with live FastAPI integration,
                instant role switching, and dual-theme display.
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
                  <span>Finance &amp; Disbursements</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('calendar')}
                  className="w-full justify-between"
                >
                  <span>Resource Booking Grid</span>
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
            <span>FastAPI Gateway</span>
            <span>Role-Based Permissions</span>
            <span>Dual Theme Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
