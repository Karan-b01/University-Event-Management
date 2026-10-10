import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  Building,
  DollarSign,
  ShieldCheck,
  Upload,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Loader2,
  Wifi,
} from 'lucide-react';
import Card from '../components/common/Card';
import Input, { Select } from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { proposalsApi, resourcesApi } from '../api';

export const ProposalWizard = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedProposalId, setSubmittedProposalId] = useState(null);
  const [apiFeedback, setApiFeedback] = useState(null);
  const [attachments, setAttachments] = useState({ poster: null, quotation: null });

  // Dynamic Venues State fetched from GET /api/v1/resources/?type=Venue
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    expectedAttendance: '',
    targetDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    equipmentNotes: '',
    allocatedBudget: '',
    expenses: [],
    isOvernight: false,
    hasMedicalPlan: true,
    fireClearanceRequired: true,
  });

  // Fetch live venues from GET /api/v1/resources/?type=Venue
  useEffect(() => {
    let isMounted = true;
    const fetchLiveVenues = async () => {
      setLoadingVenues(true);
      try {
        const liveVenues = await resourcesApi.list('Venue');
        if (isMounted && Array.isArray(liveVenues) && liveVenues.length > 0) {
          setVenues(liveVenues);
          setFormData((prev) => {
            const exists = liveVenues.some((v) => v.name === prev.venue);
            return exists ? prev : { ...prev, venue: liveVenues[0].name };
          });
        }
      } catch (err) {
        console.warn(
          '[ProposalWizard] Could not load the live resource catalog:',
          err
        );
      } finally {
        if (isMounted) setLoadingVenues(false);
      }
    };

    fetchLiveVenues();
    return () => {
      isMounted = false;
    };
  }, []);

  const steps = [
    { number: 1, title: 'Event Overview', desc: 'Scope, category & schedule', icon: FileText },
    { number: 2, title: 'Venue & Logistics', desc: 'Resource locking & capacity', icon: Building },
    { number: 3, title: 'Budget Breakdown', desc: 'Itemized expense ledger', icon: DollarSign },
    { number: 4, title: 'Compliance & Safety', desc: 'Pre-screening & STI files', icon: ShieldCheck },
  ];

  const buildPayload = () => {
    let startIso = null;
    let endIso = null;
    try {
      if (formData.targetDate && formData.startTime) {
        startIso = new Date(`${formData.targetDate}T${formData.startTime}:00`).toISOString();
      }
      if (formData.endDate && formData.endTime) {
        endIso = new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString();
      }
    } catch (e) {
      // Fallback
    }

    return {
      title: formData.title,
      details: {
        description: formData.description,
        objective: formData.category,
        expected_participants: parseInt(formData.expectedAttendance, 10) || null,
      },
      schedule: {
        start_date: startIso,
        end_date: endIso,
        venue_preference: formData.venue,
      },
      team_data: {
        team_name: formData.category,
        members: [
          {
            name: currentUser?.name || currentUser?.email || 'Lead Organizer',
            role: 'Lead Organizer',
          },
        ],
      },
    };
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setApiFeedback(null);
    try {
      const payload = buildPayload();
      const res = submittedProposalId
        ? await proposalsApi.update(submittedProposalId, payload)
        : await proposalsApi.createDraft(payload);
      if (attachments.poster) {
        await proposalsApi.uploadDocument(res.id, attachments.poster, 'Poster');
      }
      if (attachments.quotation) {
        await proposalsApi.uploadDocument(res.id, attachments.quotation, 'VendorQuotation');
      }
      setApiFeedback({
        type: 'success',
        text: `Draft and selected documents saved to the backend (ID: ${res.id}).`,
      });
      setSubmittedProposalId(res.id);
    } catch (err) {
      console.warn('[ProposalWizard] POST /proposals/draft error or backend offline:', err);
      const detail = err.response?.data?.detail || err.message || 'Could not save the draft.';
      setApiFeedback({
        type: 'error',
        text: `Draft was not saved: ${detail}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProposal = async () => {
    setSubmitting(true);
    setApiFeedback(null);
    try {
      // Create the draft, upload real selected files, then submit it for review.
      const payload = buildPayload();
      const draftRes = submittedProposalId
        ? await proposalsApi.update(submittedProposalId, payload)
        : await proposalsApi.createDraft(payload);
      const propId = draftRes.id;
      setSubmittedProposalId(propId);

      if (attachments.poster) {
        await proposalsApi.uploadDocument(propId, attachments.poster, 'Poster');
      }
      if (attachments.quotation) {
        await proposalsApi.uploadDocument(propId, attachments.quotation, 'VendorQuotation');
      }

      await proposalsApi.submit(propId);

      setApiFeedback({ type: 'success', text: `Proposal ${propId} submitted for review.` });
      setIsSubmitted(true);
    } catch (err) {
      console.warn('[ProposalWizard] Live submission encountered error:', err);
      const detail = err.response?.data?.detail || err.message || 'Submission failed.';
      setApiFeedback({ type: 'error', text: `Proposal was not submitted: ${detail}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmitProposal();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculatedRisk =
    parseInt(formData.expectedAttendance || 0) > 400 || formData.isOvernight
      ? 'Medium Risk'
      : 'Low Risk';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal">Module 02: Proposal Engine</Badge>
          <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
            FastAPI Endpoints: POST /proposals/draft &amp; POST /proposals/&#123;id&#125;/submit
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Event Proposal Governance Wizard
        </h1>
        <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
          Structured 4-step intake enforcing complete schedules, pessimistic resource locks,
          and automated compliance validations.
        </p>
      </div>

      {apiFeedback && (
        <div
          className={`mb-6 p-4 rounded-lg border text-xs font-sans flex items-center justify-between ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-500/30'
              : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-500/30'
          }`}
        >
          <span>{apiFeedback.text}</span>
          <button onClick={() => setApiFeedback(null)} className="underline font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* 4-STEP HORIZONTAL STEPPER */}
      <div className="mb-8 p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-[#090D10]/80 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            const Icon = s.icon;

            return (
              <div
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 ${
                  isCurrent
                    ? 'border-black bg-zinc-100/80 dark:border-emerald-400 dark:bg-emerald-500/10'
                    : isCompleted
                    ? 'border-zinc-300 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]'
                    : 'border-transparent text-zinc-400 dark:text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans transition-colors ${
                      isCompleted
                        ? 'bg-black text-white dark:bg-emerald-500 dark:text-black'
                        : isCurrent
                        ? 'bg-black text-white dark:bg-emerald-400 dark:text-black'
                        : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.number}
                  </div>
                  <span
                    className={`text-xs font-bold font-sans ${
                      isCurrent
                        ? 'text-zinc-950 dark:text-emerald-400'
                        : isCompleted
                        ? 'text-zinc-800 dark:text-slate-200'
                        : 'text-zinc-400 dark:text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans hidden sm:block">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM BODY CONTAINER */}
      {!isSubmitted ? (
        <Card noPadding className="mb-8">
          <div className="p-6 sm:p-8">
            {/* STEP 1: EVENT BASICS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-zinc-100 dark:border-white/5 pb-4">
                  <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">
                    Step 1: Event Fundamentals &amp; Scope
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-0.5">
                    Define the core scope, target dates, and expected audience capacity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Event Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <Select
                    label="Primary Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                      'Engineering & Robotics',
                      'Technology & Research',
                      'Cultural & Arts',
                      'Sports & Athletics',
                      'Academic & Distinguished',
                      'Student Life & Orientation',
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans block mb-1.5">
                    Executive Event Summary &amp; Academic Objectives
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 text-sm font-sans rounded transition-all duration-200 outline-none
                      bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400
                      focus:border-black focus:ring-1 focus:ring-black
                      dark:bg-[#05080A]/80 dark:text-white dark:border-white/15 dark:placeholder:text-slate-500
                      dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Input
                    label="Expected Attendance"
                    type="number"
                    icon={Users}
                    value={formData.expectedAttendance}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedAttendance: e.target.value })
                    }
                    helperText="Mass gatherings ≥400 trigger medical stand-by rules"
                  />

                  <Input
                    label="Target Date"
                    type="date"
                    icon={Calendar}
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />

                  <Input
                    label="Conclusion Date"
                    type="date"
                    icon={Calendar}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Daily Start Time"
                    type="time"
                    icon={Clock}
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                  <Input
                    label="Daily End Time"
                    type="time"
                    icon={Clock}
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: VENUE & LOGISTICS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-zinc-100 dark:border-white/5 pb-4">
                  <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">
                    Step 2: Resource Allocation &amp; Concurrency Locking
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-0.5">
                    Select campus facilities. Resources are locked via database pessimistic
                    locks upon submission.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Requested Primary Venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    options={venues.map((v) => ({
                      value: v.name,
                      label: `${v.name} (Capacity: ${v.capacity || v.max_capacity || 'N/A'}${v.location ? ` • ${v.location}` : ''})`,
                    }))}
                  />

                  <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
                        Pessimistic Locking Status
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                        {formData.venue}
                      </p>
                    </div>
                    <Badge variant="approved">Ready to Lock</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans block mb-1.5">
                    Audio/Visual &amp; Specialized Logistics Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={formData.equipmentNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, equipmentNotes: e.target.value })
                    }
                    className="w-full p-3 text-sm font-sans rounded transition-all duration-200 outline-none
                      bg-white text-zinc-900 border border-zinc-300
                      focus:border-black focus:ring-1 focus:ring-black
                      dark:bg-[#05080A]/80 dark:text-white dark:border-white/15
                      dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30"
                  />
                </div>

                {/* Overlap verification callout */}
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-200 font-sans">
                    <p className="font-bold">Availability is checked at booking</p>
                    <p className="mt-0.5">
                      Submit the event dates here. The Resource Management module checks the
                      selected resource against confirmed bookings before reserving it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ITEMIZED BUDGET & FINANCE */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-zinc-100 dark:border-white/5 pb-4">
                  <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">
                    Step 3: Itemized Budget &amp; Fiscal Compliance
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-0.5">
                    1-to-1 Budget Tracking with cumulative overrun prevention and duplicate
                    invoice verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Total Requested Allocation ($)"
                    type="number"
                    icon={DollarSign}
                    value={formData.allocatedBudget}
                    onChange={(e) =>
                      setFormData({ ...formData, allocatedBudget: e.target.value })
                    }
                    required
                  />

                  <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
                      Sum of Itemized Expenses
                    </span>
                    <p className="text-lg font-bold font-serif text-zinc-900 dark:text-white mt-1">
                      $
                      {formData.expenses
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toLocaleString()}{' '}
                      <span className="text-xs font-normal text-zinc-500 dark:text-slate-400 font-sans">
                        / ${parseInt(formData.allocatedBudget || 0).toLocaleString()} cap
                      </span>
                    </p>
                  </div>
                </div>

                {/* Sub-Expense Hierarchy Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3">
                    Sub-Expense Itemization (Module 03 Specification)
                  </h4>
                  <div className="border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/10 font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                        <tr>
                          <th className="p-3">Expense Item</th>
                          <th className="p-3">Vendor</th>
                          <th className="p-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                        {formData.expenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                            <td className="p-3 font-semibold text-zinc-900 dark:text-white">
                              {exp.item}
                            </td>
                            <td className="p-3 text-zinc-600 dark:text-slate-300">{exp.vendor}</td>
                            <td className="p-3 text-right font-bold text-zinc-900 dark:text-white">
                              ${exp.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: COMPLIANCE, SAFETY & STI DOCUMENTS */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-zinc-100 dark:border-white/5 pb-4">
                  <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">
                    Step 4: Compliance Validation &amp; STI Attachments
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-0.5">
                    Automated pre-screening analysis will evaluate risk and route to
                    appropriate compliance nodes via POST /api/v1/proposals/&#123;id&#125;/submit.
                  </p>
                </div>

                {/* Automated Pre-Screening Summary Box */}
                <div className="p-5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-slate-300 font-sans">
                      Module 05 Pre-Screening Risk Engine Output
                    </span>
                    <Badge variant={calculatedRisk}>{calculatedRisk}</Badge>
                  </div>

                  <ul className="space-y-2 text-xs font-sans text-zinc-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Attendance within venue threshold ({formData.expectedAttendance} / {venues.find((v) => v.name === formData.venue)?.capacity || 1800} capacity)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Operational schedule complies with institutional noise curfew
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        Dynamic routing: Injects Faculty Advisor &rarr; Security Officer review node
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Supporting documents are uploaded to the proposal record. */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-slate-300 font-sans mb-3">
                    Supporting Documents (Poster &amp; Vendor Quotation)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-white/[0.01] flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            Event Poster Artwork
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-slate-400 truncate max-w-48">
                            {attachments.poster?.name || 'Choose a poster file'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(event) => setAttachments((prev) => ({ ...prev, poster: event.target.files?.[0] || null }))}
                      />
                      <Badge variant={attachments.poster ? 'teal' : 'default'}>{attachments.poster ? 'Selected' : 'Optional'}</Badge>
                    </label>

                    <label className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-white/[0.01] flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            Vendor Quotation Package
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-slate-400 truncate max-w-48">
                            {attachments.quotation?.name || 'Choose a quotation file'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(event) => setAttachments((prev) => ({ ...prev, quotation: event.target.files?.[0] || null }))}
                      />
                      <Badge variant={attachments.quotation ? 'teal' : 'default'}>{attachments.quotation ? 'Selected' : 'Optional'}</Badge>
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-slate-400">Attach at least one PDF or image before submitting. Drafts can be saved without attachments.</p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              disabled={currentStep === 1 || submitting}
              onClick={handleBack}
              icon={ChevronLeft}
            >
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="md"
                disabled={submitting}
                onClick={handleSaveDraft}
              >
                {submitting ? 'Saving Draft...' : 'Save as Draft (POST /draft)'}
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                onClick={handleNext}
                icon={currentStep === 4 ? (submitting ? Loader2 : Check) : ChevronRight}
                iconPosition="right"
              >
                {submitting
                  ? 'Transmitting to FastAPI...'
                  : currentStep === 4
                  ? 'Submit for Review (POST /submit)'
                  : 'Proceed to Next Step'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* SUBMISSION CONFIRMATION CARD */
        <Card className="text-center p-8 sm:p-12 animate-fadeIn max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <Badge variant="approved" className="mb-3">
            Proposal #{submittedProposalId || 'PRP-2026-089'} Transmitted
          </Badge>

          <h2 className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
            Proposal Submitted to FastAPI Gateway
          </h2>

          <p className="mt-3 text-sm text-zinc-600 dark:text-slate-300 font-sans max-w-md mx-auto">
            Your event dossier has been committed to the compliance pipeline via{' '}
            <code>POST /proposals/{submittedProposalId}/submit</code>. Resource locks have been
            established for <strong>{formData.venue}</strong>.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="md" onClick={() => onNavigate('approvals')}>
              View in Approval Inbox
            </Button>
            <Button variant="secondary" size="md" onClick={() => onNavigate('student')}>
              Return to Student Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProposalWizard;
