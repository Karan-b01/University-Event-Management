import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Calendar,
  DollarSign,
  ShieldCheck,
  Building,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Inbox,
  Filter,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { proposalsApi, financeApi } from '../api';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export const StudentDashboard = ({ onNavigate, onSelectProposal }) => {
  const { user: currentUser } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [receiptRequests, setReceiptRequests] = useState([]);
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [receiptUploads, setReceiptUploads] = useState({});

  // Dynamic role title and subtitle
  const roleName = currentUser?.role || 'Student Organizer';
  const dashboardTitle =
    roleName === 'Student Organizer'
      ? 'Student Organizer Operations'
      : `${roleName} Operations`;

  const fetchLiveProposals = async () => {
    setLoading(true);
    try {
      const data = await proposalsApi.list();
      if (Array.isArray(data)) {
        const [expenses, budgets] = await Promise.all([
          financeApi.listExpenses().catch(() => []),
          financeApi.listBudgets().catch(() => []),
        ]);
        const ownProposalIds = new Set(data.map((proposal) => proposal.id));
        const budgetById = new Map((budgets || []).map((budget) => [budget.id, budget]));
        setReceiptRequests((expenses || []).filter((expense) => {
          const budget = budgetById.get(expense.budget_id);
          return expense.status === 'Receipt Requested' && ownProposalIds.has(budget?.proposal_id);
        }));
        setStudentReceipts((expenses || []).flatMap((expense) => {
          const budget = budgetById.get(expense.budget_id);
          if (!ownProposalIds.has(budget?.proposal_id)) return [];
          return (expense.receipts || []).map((receipt) => ({
            ...receipt,
            expenseId: expense.id,
            category: expense.category,
          }));
        }));
        const mapped = data.map((item) => {
          const startIso = item.schedule?.start_date;
          const targetDate = startIso
            ? new Date(startIso).toISOString().split('T')[0]
            : 'TBD';
          const time = startIso
            ? new Date(startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '09:00 AM - 05:00 PM';
          const participants = item.event_details?.expected_participants || 100;
          const venue = item.schedule?.venue_preference || 'Not selected';
          const venueCap = venue.toLowerCase().includes('auditorium')
            ? 1800
            : venue.toLowerCase().includes('stadium')
            ? 2000
            : 800;
          const isHigh = participants >= 500;
          const riskLevel = isHigh ? 'High Risk' : participants >= 250 ? 'Medium Risk' : 'Low Risk';

          return {
            id: item.id,
            title: item.title,
            category: item.event_details?.objective || item.team_data?.category || 'Campus Event',
            organizer:
              item.team_data?.members?.[0]?.name ||
              currentUser?.name ||
              currentUser?.email ||
              'Lead Organizer',
            department:
              item.team_data?.team_name ||
              currentUser?.department ||
              'Student Technical Association',
            targetDate,
            time,
            venue,
            expectedParticipants: participants,
            venueCapacity: venueCap,
            allocatedBudget: item.budget?.allocated_amount || 0,
            currentSpent: item.budget?.current_spent || 0,
            status: item.status || 'Draft',
            riskLevel,
            riskFlags: isHigh
              ? ['Large participant volume threshold exceeded', 'Security & Medical clearances required']
              : ['Standard campus risk parameters verified', 'Capacity within venue threshold'],
            currentNode:
              item.status === 'Approved'
                ? 'Final Sanctioned'
                : item.status === 'Submitted'
                ? 'Faculty Advisor Review'
                : item.status === 'Pending' || item.status === 'Pending Approval'
                ? 'Multi-Tier Review'
                : 'Draft In Progress',
            submittedAt: item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : 'Recent',
            description: item.event_details?.description || 'No description provided.',
            auditTimeline: [
              {
                step: 'Proposal Draft Created in Database',
                actor: currentUser?.name || currentUser?.email || 'Organizer',
                time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
                status: 'completed',
              },
            ],
            expenses: [],
          };
        });

        // Filter for role:
        // If Student Organizer: show their proposals
        // If Faculty Advisor: show proposals waiting for review or all
        if (roleName === 'Faculty Advisor') {
          // Both submitted proposals waiting for review and all
          setProposals(mapped);
        } else {
          setProposals(mapped);
        }
        setIsLiveConnected(true);
      } else {
        setProposals([]);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('[StudentDashboard] GET /proposals/ API error:', err);
      setProposals([]);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async (expenseId) => {
    const receipt = receiptUploads[expenseId] || {};
    if (!receipt.file || !receipt.amount || !receipt.date) {
      setActionMessage('Enter the receipt amount and date, then select the receipt file.');
      return;
    }
    setActionInProgress(`receipt-${expenseId}`);
    setActionMessage(null);
    try {
      await financeApi.uploadRequestedReceipt(expenseId, receipt);
      setActionMessage(`Receipt uploaded for expense #${expenseId}.`);
      setReceiptUploads((current) => ({ ...current, [expenseId]: {} }));
      await fetchLiveProposals();
    } catch (err) {
      setActionMessage(err.response?.data?.detail || 'Receipt could not be uploaded.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDownloadStudentReceipt = async (receipt) => {
    try {
      const file = await financeApi.downloadReceipt(receipt.id);
      const fileUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = receipt.file_path.split(/[\\/]/).pop() || `receipt-${receipt.id}`;
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setActionMessage(err.response?.data?.detail || 'Receipt could not be downloaded.');
    }
  };

  const handleCloneProposal = async (proposalId) => {
    setActionInProgress(proposalId);
    setActionMessage(null);
    try {
      const clone = await proposalsApi.clone(proposalId);
      setActionMessage(`Created draft copy ${clone.id}.`);
      await fetchLiveProposals();
    } catch (err) {
      setActionMessage(err.response?.data?.detail || 'Could not clone this proposal.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleWithdrawProposal = async (proposalId) => {
    if (!window.confirm('Withdraw this proposal? It will be marked as Withdrawn.')) return;
    setActionInProgress(proposalId);
    setActionMessage(null);
    try {
      await proposalsApi.withdraw(proposalId);
      setActionMessage('Proposal withdrawn.');
      await fetchLiveProposals();
    } catch (err) {
      setActionMessage(err.response?.data?.detail || 'Could not withdraw this proposal.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExportProposal = async (proposalId) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setActionMessage('Allow pop-ups to export this proposal as PDF.');
      return;
    }
    setActionInProgress(proposalId);
    setActionMessage(null);
    try {
      const data = await proposalsApi.export(proposalId);
      const details = data.details || {};
      const schedule = data.schedule || {};
      const members = data.organizing_team?.members || [];
      const documents = data.attached_documents || [];
      printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(data.title)}</title><style>body{font:14px Arial,sans-serif;max-width:800px;margin:40px auto;color:#18202a;line-height:1.5}h1{border-bottom:2px solid #0f766e;padding-bottom:12px}h2{margin-top:28px;color:#0f766e}li{margin:4px 0}.meta{color:#52606d}</style></head><body><h1>${escapeHtml(data.title)}</h1><p class="meta">Status: ${escapeHtml(data.status)} · Proposal ID: ${escapeHtml(data.proposal_id)}</p><h2>Event details</h2><p>${escapeHtml(details.description || 'No description')}</p><p><b>Objective:</b> ${escapeHtml(details.objective || '—')}<br><b>Expected participants:</b> ${escapeHtml(details.expected_participants ?? '—')}</p><h2>Schedule</h2><p><b>Venue:</b> ${escapeHtml(schedule.venue_preference || '—')}<br><b>Start:</b> ${escapeHtml(schedule.start_date || '—')}<br><b>End:</b> ${escapeHtml(schedule.end_date || '—')}</p><h2>Organizing team</h2><ul>${members.map((member) => '<li>' + escapeHtml(member.name) + ' — ' + escapeHtml(member.role) + '</li>').join('') || '<li>No team members recorded</li>'}</ul><h2>Attached documents</h2><ul>${documents.map((document) => '<li>' + escapeHtml(document.file_name) + ' (' + escapeHtml(document.type) + ')</li>').join('') || '<li>No documents attached</li>'}</ul><p class="meta">Exported ${escapeHtml(data.exported_at || new Date().toLocaleString())}</p><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
      printWindow.document.close();
    } catch (err) {
      printWindow.close();
      setActionMessage(err.response?.data?.detail || 'Could not export this proposal.');
    } finally {
      setActionInProgress(null);
    }
  };

  useEffect(() => {
    fetchLiveProposals();
  }, [currentUser]);

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending Review'
        ? ['Submitted', 'Pending', 'Pending Approval', 'In Progress'].includes(p.status)
        : p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Calculate dynamic metrics
  const activeProposalsCount = proposals.length;
  const inReviewCount = proposals.filter((p) =>
    ['Pending', 'Submitted', 'Pending Approval', 'In Progress'].includes(p.status)
  ).length;
  const totalAllocatedBudget = proposals.reduce(
    (acc, p) => acc + (p.allocatedBudget || 0),
    0
  );
  const reservedVenuesCount = new Set(
    proposals.map((p) => p.venue).filter(Boolean)
  ).size;
  const complianceRate =
    proposals.length > 0
      ? Math.round(
          (proposals.filter((p) => p.riskLevel !== 'High Risk').length /
            proposals.length) *
            100
        ) + '%'
      : '100%';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal">Module 01 &amp; 02 Suite</Badge>
            <div className="flex items-center gap-1.5 text-xs font-sans">
              {isLiveConnected ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>FastAPI Connected (GET /api/v1/proposals/)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Backend Synchronizing</span>
                </span>
              )}
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {dashboardTitle}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Welcome back,{' '}
            <span className="font-semibold text-zinc-900 dark:text-white">
              {currentUser?.name || currentUser?.email || 'User'}
            </span>{' '}
            &bull; {currentUser?.email} (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {currentUser?.role || 'Student Organizer'}
            </span>
            )
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchLiveProposals}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Sync Backend'}
          </Button>
          {(roleName === 'Faculty Advisor' || roleName === 'Admin') && (
            <Button
              variant="secondary"
              size="md"
              icon={Inbox}
              onClick={() => onNavigate('approvals')}
            >
              Approval Inbox
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            icon={Calendar}
            onClick={() => onNavigate('calendar')}
          >
            Venue Availability
          </Button>
          {(roleName === 'Student Organizer' || roleName === 'Admin') && (
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={() => onNavigate('wizard')}
            >
              New Proposal
            </Button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div role="status" className="mb-5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200">
          {actionMessage}
        </div>
      )}

      {roleName === 'Student Organizer' && receiptRequests.length > 0 && (
        <Card title="Receipt Requests" subtitle="Finance has requested supporting receipts for these expenses.">
          <div className="space-y-4">
            {receiptRequests.map((expense) => {
              const upload = receiptUploads[expense.id] || {};
              return (
                <div key={expense.id} className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-white/10 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                  <div className="text-sm">
                    <p className="font-semibold">{expense.category} · Expense #{expense.id}</p>
                    <p className="text-xs text-zinc-500 dark:text-slate-400">Expected amount: ${Number(expense.amount).toLocaleString()}</p>
                  </div>
                  <label className="text-xs font-semibold">Receipt amount
                    <input type="number" min="0.01" step="0.01" value={upload.amount || ''} onChange={(event) => setReceiptUploads((current) => ({ ...current, [expense.id]: { ...current[expense.id], amount: event.target.value } }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 dark:border-white/15 dark:bg-[#090D10]" />
                  </label>
                  <label className="text-xs font-semibold">Receipt date
                    <input type="date" value={upload.date || ''} onChange={(event) => setReceiptUploads((current) => ({ ...current, [expense.id]: { ...current[expense.id], date: event.target.value } }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 dark:border-white/15 dark:bg-[#090D10]" />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setReceiptUploads((current) => ({ ...current, [expense.id]: { ...current[expense.id], file: event.target.files?.[0] || null } }))} className="max-w-48 text-xs" />
                    <Button size="sm" variant="primary" disabled={actionInProgress === `receipt-${expense.id}`} onClick={() => handleUploadReceipt(expense.id)}>Upload Receipt</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {roleName === 'Student Organizer' && studentReceipts.length > 0 && (
        <Card title="Uploaded Receipts" subtitle="Receipts attached to expenses from your proposals.">
          <ul className="space-y-2">
            {studentReceipts.map((receipt) => (
              <li key={receipt.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{receipt.category} · Expense #{receipt.expenseId}</span>
                <button className="text-emerald-700 underline dark:text-emerald-400" onClick={() => handleDownloadStudentReceipt(receipt)}>View receipt</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

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
              {activeProposalsCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
              {inReviewCount} in review
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Live database records
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
              ${totalAllocatedBudget.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              total
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Committed institutional sanction
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
              {reservedVenuesCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              Scheduled
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Campus halls &amp; auditoriums
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Compliance Rate
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {complianceRate}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              Passing
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Pre-screening validation rate
          </p>
        </Card>
      </div>

      {/* PROPOSALS TABLE SECTION */}
      <Card
        title="Event Proposals &amp; Status Matrix"
        subtitle="Live synchronization with FastAPI backend (GET /api/v1/proposals/)"
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
              {['All', 'Pending Review', 'Approved', 'Draft', 'Withdrawn'].map((status) => (
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-medium">Fetching proposals from FastAPI...</p>
                  </td>
                </tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-slate-500 opacity-60" />
                    <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                      No records found
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5">
                      No event proposals matching your current role view or search filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-zinc-900 dark:text-white">
                      {proposal.id.length > 8 ? `${proposal.id.slice(0, 8)}...` : proposal.id}
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
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionInProgress === proposal.id}
                          onClick={() => handleExportProposal(proposal.id)}
                          className="text-[11px]"
                        >
                          Export PDF
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionInProgress === proposal.id}
                          onClick={() => handleCloneProposal(proposal.id)}
                          className="text-[11px]"
                        >
                          Clone
                        </Button>
                        {['Draft', 'Submitted'].includes(proposal.status) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionInProgress === proposal.id}
                            onClick={() => handleWithdrawProposal(proposal.id)}
                            className="text-[11px]"
                          >
                            Withdraw
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (onSelectProposal) onSelectProposal(proposal);
                            onNavigate('approvals');
                          }}
                          className="text-[11px]"
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;
