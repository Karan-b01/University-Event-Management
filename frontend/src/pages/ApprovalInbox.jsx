import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Building,
  DollarSign,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Send,
  MessageSquare,
  Lock,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MOCK_PROPOSALS } from '../data/mockData';

export const ApprovalInbox = ({ selectedProposal: initialSelected, onNavigate }) => {
  const [proposals, setProposals] = useState(MOCK_PROPOSALS);
  const [selectedId, setSelectedId] = useState(
    initialSelected ? initialSelected.id : MOCK_PROPOSALS[0].id
  );
  const [filterRisk, setFilterRisk] = useState('All');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const activeProposal =
    proposals.find((p) => p.id === selectedId) || proposals[0];

  const filteredList = proposals.filter((p) => {
    if (filterRisk === 'All') return true;
    if (filterRisk === 'High') return p.riskLevel.includes('High');
    if (filterRisk === 'Pending') return p.status === 'Pending';
    return true;
  });

  const handleDecision = (decision) => {
    setActionNotice({
      type: decision,
      text: `Proposal ${activeProposal.id} ${
        decision === 'approved' ? 'endorsed and progressed to next node' : 'rejected'
      }. Immutable audit entry logged.`,
    });

    // Update in state
    setProposals((prev) =>
      prev.map((item) =>
        item.id === activeProposal.id
          ? {
              ...item,
              status: decision === 'approved' ? 'Approved' : 'Rejected',
              auditTimeline: [
                ...item.auditTimeline,
                {
                  step: decision === 'approved' ? 'Endorsement Approved' : 'Rejected by Reviewer',
                  actor: 'Active Reviewer',
                  time: 'Just now',
                  status: decision === 'approved' ? 'completed' : 'warning',
                },
              ],
            }
          : item
      )
    );
    setReviewerNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="security flag">Module 05: Compliance Engine</Badge>
            <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
              Dynamic Multi-Tier Governance
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Institutional Approval Inbox
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300 font-sans mt-0.5">
            Role-gated review panel enforcing safety parameters, capacity thresholds, and
            immutable audit entries.
          </p>
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-1.5 border border-zinc-200 dark:border-white/10 p-1 rounded-lg bg-zinc-50 dark:bg-white/[0.02]">
          {['All', 'Pending', 'High'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterRisk(f)}
              className={`px-3 py-1 text-xs font-semibold rounded font-sans transition-colors ${
                filterRisk === f
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black font-bold'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {f === 'High' ? 'High Risk Only' : f}
            </button>
          ))}
        </div>
      </div>

      {actionNotice && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-sans">
          <span>{actionNotice.text}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="underline font-bold text-emerald-700 dark:text-emerald-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: PROPOSAL QUEUE (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Pending Review Queue ({filteredList.length})
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-slate-500 font-sans">
              Sorted by Priority
            </span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredList.map((item) => {
              const isSelected = item.id === activeProposal.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer relative ${
                    isSelected
                      ? 'bg-zinc-100 border-black shadow-sm dark:bg-[#101417] dark:border-emerald-400/80 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-white border-zinc-200 hover:border-zinc-400 dark:bg-[#090D10]/80 dark:border-white/10 dark:hover:border-white/20'
                  }`}
                >
                  {/* Left accent bar on active */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-emerald-400 rounded-l" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                      {item.id}
                    </span>
                    <Badge variant={item.riskLevel}>{item.riskLevel}</Badge>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-zinc-950 dark:text-white leading-snug line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-1">
                    {item.organizer} &bull; {item.department}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-slate-400 font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.targetDate}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-slate-200">
                      ${item.allocatedBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: DETAILED REVIEW FOLIO (7 cols) */}
        <div className="lg:col-span-7">
          <Card noPadding className="h-full">
            {/* Detailed Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.01]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-500 dark:text-slate-400">
                    {activeProposal.id}
                  </span>
                  <Badge variant={activeProposal.status}>{activeProposal.status}</Badge>
                  <Badge variant={activeProposal.riskLevel}>{activeProposal.riskLevel}</Badge>
                </div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
                  Current Node: <strong className="text-zinc-900 dark:text-white">{activeProposal.currentNode}</strong>
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-2">
                {activeProposal.title}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-slate-300 font-sans leading-relaxed">
                {activeProposal.description}
              </p>

              {/* Submitter & Logistics Metadata Chips */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200/60 dark:border-white/5 text-xs font-sans">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-slate-400 block">
                    Lead Organizer
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {activeProposal.organizer}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-slate-400 block">
                    Venue Target
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {activeProposal.venue}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-slate-400 block">
                    Attendance
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {activeProposal.expectedParticipants} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-slate-400 block">
                    Fiscal Cap
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    ${activeProposal.allocatedBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Tabs: Risk Flags, Expenses, Audit Trail */}
            <div className="p-6 space-y-6">
              {/* AUTOMATED PRE-SCREENING RISK REPORT (Module 05) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Module 05 Compliance Pre-Screening Analysis</span>
                </h3>

                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 space-y-2">
                  {activeProposal.riskFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs font-sans text-zinc-800 dark:text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans pt-1 border-t border-zinc-200/40 dark:border-white/5 mt-2">
                    Action required: Reviewer must verify that adequate campus security and
                    medical stand-by units are scheduled.
                  </p>
                </div>
              </div>

              {/* ITEMIZED FISCAL LEDGER (Module 03) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Itemized Fiscal Commitment Ledger</span>
                </h3>

                <div className="border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Expense Item</th>
                        <th className="p-3">Vendor</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                      {activeProposal.expenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                          <td className="p-3 font-semibold text-zinc-900 dark:text-white">
                            {exp.item}
                          </td>
                          <td className="p-3 text-zinc-600 dark:text-slate-300">{exp.vendor}</td>
                          <td className="p-3 text-right font-bold text-zinc-900 dark:text-white">
                            ${exp.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-[11px] font-semibold text-zinc-500 dark:text-slate-400">
                              {exp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMMUTABLE AUDIT TRAIL TIMELINE (Module 05) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-zinc-500 dark:text-slate-400" />
                  <span>Immutable Audit Trail &amp; State Machine History</span>
                </h3>

                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10">
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-300 dark:before:bg-white/10">
                    {activeProposal.auditTimeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                            item.status === 'completed'
                              ? 'bg-emerald-500 border-white dark:border-[#090D10]'
                              : item.status === 'current'
                              ? 'bg-amber-500 border-white dark:border-[#090D10] animate-ping'
                              : 'bg-zinc-300 dark:bg-zinc-700 border-white dark:border-[#090D10]'
                          }`}
                        />
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white font-sans">
                            {item.step}
                          </p>
                          <span className="text-[10px] text-zinc-400 dark:text-slate-500 font-sans whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans">
                          Actor: {item.actor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* REVIEWER DECISION & FEEDBACK ACTION */}
              <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
                <label className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans block mb-2">
                  Reviewer Directives / Audit Note
                </label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Record formal justification or conditional directives for this node..."
                  className="w-full p-3 text-xs font-sans rounded transition-all duration-200 outline-none
                    bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400
                    focus:border-black focus:ring-1 focus:ring-black
                    dark:bg-[#05080A]/80 dark:text-white dark:border-white/15 dark:placeholder:text-slate-500
                    dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30 mb-4"
                />

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleDecision('rejected')}
                  >
                    Reject Proposal
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      alert('Revisions requested. Organizing committee notified via message dispatch.')
                    }
                  >
                    Request Clarification
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleDecision('approved')}
                  >
                    Authorize &amp; Endorse Node
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApprovalInbox;
