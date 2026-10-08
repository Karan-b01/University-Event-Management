import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  Calendar,
  DollarSign,
  ShieldCheck,
  Building,
  TrendingUp,
  Clock,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MOCK_PROPOSALS, MOCK_STATS, MOCK_USER } from '../data/mockData';

export const StudentDashboard = ({ onNavigate, onSelectProposal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredProposals = MOCK_PROPOSALS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true : p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal">Module 01 &amp; 02 Suite</Badge>
            <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
              Organizing Committee Workspace
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Student Organizer Operations
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Welcome back, <span className="font-semibold">{MOCK_USER.name}</span> &bull;{' '}
            {MOCK_USER.department}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Calendar}
            onClick={() => onNavigate('calendar')}
          >
            Check Venue Availability
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => onNavigate('wizard')}
          >
            New Proposal
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Active Proposals
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {MOCK_STATS.student.activeProposals}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
              2 in review
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            1 Draft, 2 In Review, 1 Approved
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Budget Allocated
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {MOCK_STATS.student.allocatedBudget}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              total
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Committed spent: {MOCK_STATS.student.committedSpent} (43%)
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Reserved Venues
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {MOCK_STATS.student.reservedVenues}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              Pessimistic locked
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Grand Innovation Hall + Quadrangle
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Compliance Score
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {MOCK_STATS.student.complianceScore}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              Passing
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Module 5 pre-screen validation rate
          </p>
        </Card>
      </div>

      {/* PROPOSALS TABLE SECTION */}
      <Card
        title="Event Proposals & Status Matrix"
        subtitle="Tracking multi-tier institutional approvals and document verifications"
        headerAction={
          <div className="flex items-center gap-2">
            <div className="relative w-56 hidden sm:block">
              <Input
                icon={Search}
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 border border-zinc-200 dark:border-white/10 p-0.5 rounded text-xs">
              {['All', 'Pending', 'Approved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    statusFilter === status
                      ? 'bg-black text-white dark:bg-emerald-500 dark:text-black font-bold'
                      : 'text-zinc-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
                <th className="py-3 px-5">Proposal ID</th>
                <th className="py-3 px-5">Event Title &amp; Category</th>
                <th className="py-3 px-5">Target Date</th>
                <th className="py-3 px-5">Capacity / Attendance</th>
                <th className="py-3 px-5">Budget</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Compliance Risk</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 font-sans text-xs">
              {filteredProposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="py-4 px-5 font-mono font-bold text-zinc-900 dark:text-white">
                    {proposal.id}
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-serif font-bold text-sm text-zinc-950 dark:text-white group-hover:text-black dark:group-hover:text-emerald-300 transition-colors">
                      {proposal.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-0.5">
                      {proposal.category} &bull; {proposal.venue}
                    </p>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-500" />
                      <span>{proposal.targetDate}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-slate-400 block mt-0.5">
                      {proposal.time}
                    </span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-zinc-800 dark:text-slate-200 font-semibold">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{proposal.expectedParticipants}</span>
                      <span className="text-zinc-400 font-normal">/ {proposal.venueCapacity}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap font-semibold text-zinc-900 dark:text-white">
                    ${proposal.allocatedBudget.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <Badge variant={proposal.status} dot>
                      {proposal.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <Badge variant={proposal.riskLevel}>
                      {proposal.riskLevel}
                    </Badge>
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (onSelectProposal) onSelectProposal(proposal);
                        onNavigate('approvals');
                      }}
                      className="text-[11px]"
                    >
                      Review Folio
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;
