import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Send,
  CreditCard,
  Building2,
  FileCheck,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MOCK_DISBURSEMENTS, MOCK_STATS } from '../data/mockData';

export const FinanceDesk = ({ onNavigate }) => {
  const [disbursements, setDisbursements] = useState(MOCK_DISBURSEMENTS);
  const [filterType, setFilterType] = useState('All');
  const [notification, setNotification] = useState(null);

  const handleDisburse = (id, method) => {
    setDisbursements((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'Disbursed', paymentMethod: method } : d
      )
    );
    setNotification(`Disbursement ${id} finalized via ${method}. Transaction recorded.`);
  };

  const handleSimulateDuplicateAttempt = () => {
    setNotification(
      'Duplicate Detection Triggered: Vendor VND-3011 invoice for $4,500 on 2026-10-06 is already committed! Rejected with HTTP 400 Bad Request.'
    );
  };

  const filteredDisbursements = disbursements.filter((d) => {
    if (filterType === 'All') return true;
    if (filterType === 'Pending') return d.status.includes('Pending');
    if (filterType === 'Disbursed') return d.status === 'Disbursed';
    if (filterType === 'Flagged') return d.duplicateFlag;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning">Module 03: Finance Desk</Badge>
            <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
              1-to-1 Budget Tracking &amp; Payment Gateway Simulation
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Institutional Finance &amp; Disbursements
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Enforcing cumulative overrun prevention, duplicate receipt detection, and
            polymorphic disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Copy}
            onClick={handleSimulateDuplicateAttempt}
          >
            Test Duplicate Detection
          </Button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-lg bg-zinc-900 text-white dark:bg-emerald-950/40 dark:text-emerald-200 border border-zinc-700 dark:border-emerald-500/40 flex items-center justify-between text-xs font-sans">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="underline font-bold text-emerald-400 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Total Fiscal Pool
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {MOCK_STATS.finance.totalBudget}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              FY 2026
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Institutional student activities fund
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Committed Spent
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {MOCK_STATS.finance.totalCommitted}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              57.1%
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Zero budget overruns across active proposals
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Pending Disbursements
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-amber-600 dark:text-amber-400">
              {MOCK_STATS.finance.pendingDisbursements}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              Queued
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Awaiting Bursar sign-off and transfer
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Duplicate Receipts Blocked
            </span>
            <div className="p-2 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-rose-600 dark:text-rose-400">
              {MOCK_STATS.finance.duplicateReceiptsBlocked}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-sans">
              Prevented
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Triples (vendor_id, amount, date) verified
          </p>
        </Card>
      </div>

      {/* DISBURSEMENTS TABLE */}
      <Card
        title="Pending &amp; Authorized Vendor Disbursements"
        subtitle="Itemized invoice verifications with cryptographic receipt hashes"
        headerAction={
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-white/10 p-0.5 rounded text-xs">
            {['All', 'Pending', 'Disbursed', 'Flagged'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                  filterType === type
                    ? 'bg-black text-white dark:bg-emerald-500 dark:text-black font-bold'
                    : 'text-zinc-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
                <th className="py-3 px-5">Disbursement Ref</th>
                <th className="py-3 px-5">Associated Event &amp; Category</th>
                <th className="py-3 px-5">Vendor &amp; ID</th>
                <th className="py-3 px-5">Invoice Date</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Receipt Digest</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Disbursement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 font-sans text-xs">
              {filteredDisbursements.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors ${
                    item.duplicateFlag ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-4 px-5 font-mono font-bold text-zinc-900 dark:text-white">
                    {item.id}
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-serif font-bold text-zinc-950 dark:text-white">
                      {item.eventTitle}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-0.5">
                      {item.proposalId} &bull; {item.category}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-semibold text-zinc-800 dark:text-slate-200 block">
                      {item.vendorName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-slate-500">
                      {item.vendorId}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-600 dark:text-slate-300">
                    {item.invoiceDate}
                  </td>
                  <td className="py-4 px-5 font-bold text-zinc-950 dark:text-white">
                    ${item.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 font-mono text-[11px] text-zinc-500 dark:text-slate-400">
                    {item.receiptHash}
                  </td>
                  <td className="py-4 px-5">
                    {item.duplicateFlag ? (
                      <Badge variant="rejected">Duplicate Blocked</Badge>
                    ) : (
                      <Badge variant={item.status === 'Disbursed' ? 'approved' : 'pending'}>
                        {item.status}
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    {item.status === 'Disbursed' ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Disbursed ({item.paymentMethod})
                      </span>
                    ) : item.duplicateFlag ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Rejected (HTTP 400)
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDisburse(item.id, 'BankTransfer')}
                          className="text-[11px]"
                        >
                          Disburse Wire
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDisburse(item.id, 'UPITransfer')}
                          className="text-[11px]"
                        >
                          UPI
                        </Button>
                      </div>
                    )}
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

export default FinanceDesk;
