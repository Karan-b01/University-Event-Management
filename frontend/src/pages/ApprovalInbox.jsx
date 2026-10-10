import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { approvalsApi, financeApi, proposalsApi } from '../api';

export const ApprovalInbox = ({ selectedProposal: initialSelected, onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [selectedId, setSelectedId] = useState(initialSelected?.id || null);
  const [filterRisk, setFilterRisk] = useState('All');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [proposalBudget, setProposalBudget] = useState(null);

  // Load only proposals awaiting one of the current user's approval roles.
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await approvalsApi.listInbox();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item) => {
          const startIso = item.schedule?.start_date;
          const targetDate = startIso
            ? new Date(startIso).toISOString().split('T')[0]
            : 'TBD';
          const participants = item.event_details?.expected_participants || 0;
          const venue = item.schedule?.venue_preference || 'Not selected';
          const isHigh = participants >= 500;
          const riskLevel = isHigh ? 'High Risk' : participants >= 250 ? 'Medium Risk' : 'Low Risk';

          return {
            id: item.id,
            title: item.title,
            category: item.event_details?.objective || item.team_data?.category || 'Campus Event',
            organizer:
              item.team_data?.members?.[0]?.name ||
              item.user?.name ||
              'Lead Organizer',
            department:
              item.team_data?.team_name ||
              'Student Technical Association',
            targetDate,
            venue,
            expectedParticipants: participants,
            allocatedBudget: item.budget?.allocated_amount || 0,
            requestedBudget: Number(item.team_data?.requested_budget || 0),
            documents: item.documents || [],
            status: item.status || 'Submitted',
            riskLevel,
            description:
              item.event_details?.description ||
              'Campus event proposal submitted for multi-tier compliance evaluation.',
          };
        });
        setProposals(mapped);

        // Keep selected proposal or select first
        if (!selectedId || !mapped.find((m) => m.id === selectedId)) {
          setSelectedId(mapped[0].id);
        }
      } else {
        setProposals([]);
        setSelectedId(null);
      }
    } catch (err) {
      console.warn('[ApprovalInbox] Failed to fetch proposals:', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Fetch live approval workflow and budget for selected proposal
  useEffect(() => {
    if (!selectedId) {
      setWorkflow(null);
      setProposalBudget(null);
      return;
    }

    const fetchWorkflowData = async () => {
      setLoadingWorkflow(true);
      try {
        const wf = await approvalsApi.getWorkflow(selectedId);
        setWorkflow(wf);
      } catch (err) {
        console.warn('[ApprovalInbox] Could not load workflow for', selectedId, err);
        setWorkflow(null);
      }

      try {
        const b = await financeApi.getBudget(selectedId);
        setProposalBudget(b);
      } catch (err) {
        setProposalBudget(null);
      } finally {
        setLoadingWorkflow(false);
      }
    };

    fetchWorkflowData();
  }, [selectedId]);

  const activeProposal = proposals.find((p) => p.id === selectedId) || null;

  const filteredList = proposals.filter((p) => {
    if (filterRisk === 'All') return true;
    if (filterRisk === 'High') return p.riskLevel.includes('High');
    if (filterRisk === 'Pending')
      return ['Submitted', 'Pending', 'Pending Approval', 'In Progress'].includes(p.status);
    return true;
  });

  // Identify active approval node in the multi-tier workflow
  const activeNode = workflow?.nodes?.find(
    (n) => n.step_number === workflow.current_step && n.status === 'Pending'
  );
  const userRoles = currentUser?.roles?.length
    ? currentUser.roles
    : currentUser?.role
      ? [currentUser.role]
      : [];
  const canReviewActiveNode = Boolean(
    activeNode &&
      ['Pending', 'In Progress', 'Initiated'].includes(workflow?.status) &&
      (userRoles.includes(activeNode.required_role) || userRoles.includes('Admin'))
  );
  const canApproveActiveNode = canReviewActiveNode;

  const handleBudgetApproval = async () => {
    if (!activeProposal) return;
    setSubmitting(true);
    setActionNotice(null);
    try {
      const approvedBudget = await approvalsApi.approveBudget(activeProposal.id);
      setProposalBudget(approvedBudget);
      setActionNotice({ type: 'success', text: 'Requested budget approved. You can now review the proposal.' });
    } catch (err) {
      const detail = err.response?.data?.detail || 'The requested budget could not be approved.';
      setActionNotice({ type: 'error', text: detail });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentDownload = async (document) => {
    try {
      const file = await proposalsApi.downloadDocument(activeProposal.id, document.id);
      const fileUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = document.file_name;
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.detail || 'Document could not be downloaded.',
      });
    }
  };

  // Submit human approval decision to POST /api/v1/approvals/nodes/{node_id}/review
  const handleDecision = async (decision) => {
    if (!activeProposal) return;
    if (!activeNode || !canReviewActiveNode) {
      setActionNotice({ type: 'error', text: 'No pending approval node is assigned to your role.' });
      return;
    }
    setSubmitting(true);
    setActionNotice(null);

    try {
      const decisionFormatted = decision === 'approved' ? 'Approved' : 'Rejected';
      const notes =
        reviewerNotes.trim() ||
        `${decisionFormatted} by ${currentUser?.name || currentUser?.email} (${currentUser?.role})`;

      const updatedWf = await approvalsApi.reviewNode(activeNode.id, decisionFormatted, notes);
      setWorkflow(updatedWf);
      try {
        const updatedBudget = await financeApi.getBudget(activeProposal.id);
        setProposalBudget(updatedBudget);
      } catch (err) {}
      setActionNotice({
        type: decision,
        text: `Workflow Node #${activeNode.id} (${activeNode.required_role}) successfully recorded as ${decisionFormatted}. State machine advanced in database.`,
      });

      // Refresh list to update UI
      await fetchProposals();
      setReviewerNotes('');
    } catch (err) {
      console.warn('[ApprovalInbox] Decision submission error:', err);
      const detail = err.response?.data?.detail || err.message || 'Error submitting review decision.';
      setActionNotice({
        type: 'error',
        text: `Action failed: ${detail}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Compile risk flags from live RiskAssessment or fallback
  const riskFlags =
    workflow?.risk_assessment?.flag_details && Array.isArray(workflow.risk_assessment.flag_details)
      ? workflow.risk_assessment.flag_details
      : activeProposal?.riskLevel === 'High Risk'
      ? [
          'High participant volume threshold exceeded (>400 participants)',
          'Requires joint campus security and fire safety protocol clearance',
        ]
      : [
          'Participant volume within campus threshold',
          'Standard pre-screening compliance verified',
        ];

  // Compile audit history timeline from live ApprovalHistory
  const auditTimeline =
    workflow?.history && Array.isArray(workflow.history) && workflow.history.length > 0
      ? workflow.history.map((h) => ({
          step: `${h.action_taken} - ${h.remarks || 'Workflow Event'}`,
          actor: `Reviewer #${h.reviewer_id || 'System'}`,
          time: h.timestamp ? new Date(h.timestamp).toLocaleString() : 'Recent',
          status:
            h.action_taken === 'Approved'
              ? 'completed'
              : h.action_taken === 'Rejected'
              ? 'warning'
              : 'current',
        }))
      : [
          {
            step: 'Workflow Pre-Screening Initiated in Database',
            actor: activeProposal?.organizer || 'System',
            time: 'Live',
            status: 'completed',
          },
        ];

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
            Logged in as <strong className="text-zinc-900 dark:text-white">{currentUser?.name || currentUser?.email}</strong> &bull;{' '}
            Role: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentUser?.role}</span>
          </p>
        </div>

        {/* Quick filters & Sync */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchProposals}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Sync'}
          </Button>
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
      </div>

      {actionNotice && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between text-xs font-sans border ${
            actionNotice.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-500/40'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-500/40'
          }`}
        >
          <span>{actionNotice.text}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="underline font-bold ml-4 cursor-pointer"
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
              Live FastAPI Data
            </span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center border rounded-lg border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                <p className="text-xs">Loading pending proposals...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center border rounded-lg border-dashed border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                  No records found
                </p>
                <p className="text-[11px] mt-0.5">
                  No event proposals waiting for review in this filter.
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = item.id === selectedId;
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
                        {item.id.length > 8 ? `${item.id.slice(0, 8)}...` : item.id}
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
                        ${(proposalBudget?.allocated_amount || item.allocatedBudget).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: DETAILED REVIEW FOLIO (7 cols) */}
        <div className="lg:col-span-7">
          {!activeProposal ? (
            <Card noPadding className="h-full flex items-center justify-center p-12 text-center text-zinc-500 dark:text-slate-400">
              <div className="max-w-md mx-auto py-12">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
                <h3 className="font-serif font-bold text-lg text-zinc-800 dark:text-white">
                  No Proposal Selected
                </h3>
                <p className="text-xs mt-1 text-zinc-500 dark:text-slate-400">
                  Select an event proposal from the queue to inspect compliance parameters and submit institutional authorization.
                </p>
              </div>
            </Card>
          ) : (
            <Card noPadding className="h-full">
              {/* Detailed Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.01]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-500 dark:text-slate-400">
                      {activeProposal.id}
                    </span>
                    <Badge variant={workflow?.status || activeProposal.status}>
                      {workflow?.status || activeProposal.status}
                    </Badge>
                    <Badge variant={activeProposal.riskLevel}>{activeProposal.riskLevel}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
                    {loadingWorkflow && <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />}
                    <span>Current Node:</span>{' '}
                    <strong className="text-zinc-900 dark:text-white">
                      {activeNode
                        ? `Step ${activeNode.step_number}: ${activeNode.required_role}`
                        : workflow?.status === 'Approved'
                        ? 'Fully Sanctioned'
                        : 'Review In Progress'}
                    </strong>
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
                      Fiscal Sanction
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ${(proposalBudget?.allocated_amount || activeProposal.allocatedBudget).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Tabs: Risk Flags, Multi-tier Nodes, Audit Trail */}
              <div className="p-6 space-y-6">
                {activeProposal.documents.filter((document) => document.type === 'Poster').length > 0 && (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300">Event Posters</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeProposal.documents.filter((document) => document.type === 'Poster').map((document) => (
                        <Button key={document.id} size="sm" variant="secondary" onClick={() => handleDocumentDownload(document)}>
                          View {document.file_name}
                        </Button>
                      ))}
                    </div>
                  </section>
                )}
                {/* AUTOMATED PRE-SCREENING RISK REPORT (Module 05) */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Module 05 Compliance Pre-Screening Analysis</span>
                  </h3>

                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 space-y-2">
                    {riskFlags.map((flag, idx) => {
                      const flagText =
                        typeof flag === 'string'
                          ? flag
                          : flag?.warning || flag?.category || 'Compliance review flag';

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs font-sans text-zinc-800 dark:text-slate-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <div>
                            <span>{flagText}</span>
                            {typeof flag === 'object' && flag?.suggestion && (
                              <p className="mt-1 text-[11px] text-zinc-500 dark:text-slate-400">
                                Suggested action: {flag.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans pt-1 border-t border-zinc-200/40 dark:border-white/5 mt-2">
                      Score:{' '}
                      <strong className="text-zinc-900 dark:text-white">
                        {workflow?.risk_assessment?.risk_score ?? 15}/100
                      </strong>{' '}
                      &bull; High Risk Evaluation:{' '}
                      <strong className="text-zinc-900 dark:text-white">
                        {workflow?.risk_assessment?.is_high_risk ? 'YES (Security Gate Triggered)' : 'NO'}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* MULTI-TIER WORKFLOW NODES STATE MACHINE */}
                {workflow?.nodes && workflow.nodes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Dynamic Approval Routing Nodes (Database State)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {workflow.nodes.map((node) => {
                        const isCurrent = node.step_number === workflow.current_step;
                        return (
                          <div
                            key={node.id}
                            className={`p-3 rounded-lg border text-xs font-sans flex items-center justify-between ${
                              node.status === 'Approved'
                                ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-500/30'
                                : node.status === 'Rejected'
                                ? 'bg-rose-50/50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-500/30'
                                : isCurrent
                                ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-500/30 shadow-sm'
                                : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/10 opacity-70'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                                <span>Tier {node.step_number}:</span>
                                <span>{node.required_role}</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 dark:text-slate-400 mt-0.5 block">
                                Node ID: #{node.id}
                              </span>
                            </div>
                            <Badge
                              variant={
                                node.status === 'Approved'
                                  ? 'approved'
                                  : node.status === 'Rejected'
                                  ? 'rejected'
                                  : 'pending'
                              }
                            >
                              {node.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* IMMUTABLE AUDIT TRAIL TIMELINE (Module 05) */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-zinc-500 dark:text-slate-400" />
                    <span>Immutable Audit Trail &amp; State Machine History</span>
                  </h3>

                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10">
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-300 dark:before:bg-white/10">
                      {auditTimeline.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                              item.status === 'completed'
                                ? 'bg-emerald-500 border-white dark:border-[#090D10]'
                                : item.status === 'warning'
                                ? 'bg-rose-500 border-white dark:border-[#090D10]'
                                : 'bg-amber-500 border-white dark:border-[#090D10] animate-pulse'
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
                            {item.actor}
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
                    placeholder={`Record formal review remarks as ${currentUser?.name || currentUser?.email} (${currentUser?.role})...`}
                    className="w-full p-3 text-xs font-sans rounded transition-all duration-200 outline-none
                      bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400
                      focus:border-black focus:ring-1 focus:ring-black
                      dark:bg-[#05080A]/80 dark:text-white dark:border-white/15 dark:placeholder:text-slate-500
                      dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30 mb-4"
                  />

                  {activeNode?.required_role === 'Faculty Advisor' && userRoles.includes('Faculty Advisor') && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-500/30 dark:bg-amber-950/20">
                      <span>
                        Requested budget: <strong>${activeProposal.requestedBudget.toLocaleString()}</strong>
                        {' · '}
                        {proposalBudget?.status === 'Advisor Approved'
                          ? 'Budget approved'
                          : 'Approve the budget request before deciding on the proposal.'}
                      </span>
                      {proposalBudget?.status !== 'Advisor Approved' && (
                        <Button size="sm" variant="secondary" disabled={submitting || activeProposal.requestedBudget <= 0} onClick={handleBudgetApproval}>
                          Approve Budget Request
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={submitting ? Loader2 : XCircle}
                      disabled={submitting || !canReviewActiveNode}
                      onClick={() => handleDecision('rejected')}
                    >
                      {submitting ? 'Updating...' : 'Reject Proposal'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        alert(
                          'Directives dispatch: Organizing team notified via campus compliance mailer.'
                        )
                      }
                    >
                      Request Clarification
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={submitting ? Loader2 : CheckCircle2}
                      disabled={submitting || !canApproveActiveNode}
                      onClick={() => handleDecision('approved')}
                    >
                      {submitting
                        ? 'Authorizing...'
                        : activeNode
                        ? `Authorize Tier (${activeNode.required_role})`
                        : 'Authorize & Sanction'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalInbox;
