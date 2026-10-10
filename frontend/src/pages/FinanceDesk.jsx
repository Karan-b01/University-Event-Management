import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  CreditCard,
  Building2,
  CheckCircle2,
  RefreshCw,
  Download,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { proposalsApi, financeApi } from '../api';

export const FinanceDesk = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [disbursements, setDisbursements] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [paymentInProgress, setPaymentInProgress] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ proposal_id: '', allocated_amount: '' });
  const [expenseForm, setExpenseForm] = useState({
    budget_id: '', vendor_id: '', amount: '', category: '',
  });

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [proposalsData, budgetsData, vendorsData, expensesData] = await Promise.all([
        proposalsApi.list().catch(() => []),
        financeApi.listBudgets().catch(() => []),
        financeApi.listVendors().catch(() => []),
        financeApi.listExpenses().catch(() => []),
      ]);

      setProposals(proposalsData || []);
      setBudgets(budgetsData || []);
      setVendors(vendorsData || []);
      const items = (expensesData || []).map((expense) => {
        const budget = (budgetsData || []).find((candidate) => candidate.id === expense.budget_id);
        const proposal = (proposalsData || []).find((candidate) => candidate.id === budget?.proposal_id);
        const receipt = expense.receipts?.[0];
        const transaction = expense.transactions?.[expense.transactions.length - 1];
        return {
          id: expense.id,
          proposalId: budget?.proposal_id || '',
          eventTitle: proposal?.title || 'Event proposal',
          category: expense.category,
          vendorName: expense.vendor?.name || 'Direct reimbursement',
          vendorId: expense.vendor_id || '—',
          vendorBankDetails: expense.vendor?.bank_details || '',
          invoiceDate: receipt?.date || (expense.created_at ? new Date(expense.created_at).toLocaleDateString() : '—'),
          amount: Number(expense.amount || 0),
          status: expense.status === 'Paid' ? 'Disbursed' : expense.status,
          paymentMethod: transaction?.type || 'Pending',
          receiptName: receipt?.file_path?.split(/[\\/]/).pop() || 'No receipt attached',
          receiptId: receipt?.id || null,
          hasReceipt: Boolean(receipt),
          receiptRequested: expense.status === 'Receipt Requested',
          duplicateFlag: false,
        };
      });
      setDisbursements(items);
    } catch (err) {
      console.warn('[FinanceDesk] Failed to fetch finance records:', err);
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleDisburse = async (item, method) => {
    setPaymentInProgress(item.id);
    setNotification(null);
    try {
      const payment = method === 'UPITransfer'
        ? { payment_type: method, upi_id: item.vendorBankDetails || undefined }
        : { payment_type: method, bank_account: item.vendorBankDetails || undefined };
      const result = await financeApi.payExpense(item.id, payment);
      setNotification(`Payment ${result.transaction_id || ''} recorded by the configured payment gateway.`);
      await fetchFinanceData();
    } catch (err) {
      setNotification(err.response?.data?.detail || 'Payment could not be recorded.');
    } finally {
      setPaymentInProgress(null);
    }
  };

  const handleCreateBudget = async (event) => {
    event.preventDefault();
    try {
      const budgetPayload = { allocated_amount: Number(budgetForm.allocated_amount) };
      const existingBudget = budgets.find((budget) => budget.proposal_id === budgetForm.proposal_id);
      if (existingBudget) {
        await financeApi.updateBudget(budgetForm.proposal_id, budgetPayload);
      } else {
        await financeApi.createBudget({ proposal_id: budgetForm.proposal_id, ...budgetPayload });
      }
      setBudgetForm({ proposal_id: '', allocated_amount: '' });
      setNotification('Requested and disbursed budget amounts synchronized.');
      await fetchFinanceData();
    } catch (err) {
      setNotification(err.response?.data?.detail || 'Budget could not be saved.');
    }
  };

  const handleSubmitExpense = async (event) => {
    event.preventDefault();
    try {
      await financeApi.submitExpense({
        budget_id: Number(expenseForm.budget_id),
        ...(expenseForm.vendor_id ? { vendor_id: Number(expenseForm.vendor_id) } : {}),
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
      });
      setExpenseForm({ budget_id: '', vendor_id: '', amount: '', category: '' });
      setNotification('Expense recorded. Request supporting documentation from the organizer when ready.');
      await fetchFinanceData();
    } catch (err) {
      setNotification(err.response?.data?.detail || 'Expense could not be submitted.');
    }
  };

  const handleRequestReceipt = async (expenseId) => {
    setPaymentInProgress(expenseId);
    setNotification(null);
    try {
      await financeApi.requestExpenseReceipt(expenseId);
      setNotification(`Receipt requested for expense #${expenseId}.`);
      await fetchFinanceData();
    } catch (err) {
      setNotification(err.response?.data?.detail || 'Receipt request could not be sent.');
    } finally {
      setPaymentInProgress(null);
    }
  };

  const handleDownloadReceipt = async (receiptId, fileName) => {
    try {
      const file = await financeApi.downloadReceipt(receiptId);
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setNotification(err.response?.data?.detail || 'Receipt could not be downloaded.');
    }
  };

  const filteredDisbursements = disbursements.filter((d) => {
    if (filterType === 'All') return true;
    if (filterType === 'Pending') return !['Disbursed', 'Paid'].includes(d.status);
    if (filterType === 'Disbursed') return d.status === 'Disbursed';
    if (filterType === 'Flagged') return d.duplicateFlag;
    return true;
  });

  // Calculate dynamic metrics from live data
  const totalBudgetPool = budgets.reduce((acc, budget) => acc + Number(budget.allocated_amount || 0), 0);
  const totalCommittedSpent = budgets.reduce((acc, budget) => acc + Number(budget.current_spent || 0), 0);
  const pendingDisbursementsCount = disbursements.filter((item) => !['Disbursed', 'Paid'].includes(item.status)).length;
  const overrunsCount = budgets.filter((budget) => budget.status === 'Overrun').length;

  const exportFinancialReport = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['Expense ID', 'Event', 'Proposal ID', 'Category', 'Vendor', 'Date', 'Amount', 'Status', 'Receipt'],
      ...disbursements.map((item) => [item.id, item.eventTitle, item.proposalId, item.category, item.vendorName, item.invoiceDate, item.amount, item.status, item.receiptName]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const fileUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'university-event-finance-report.csv';
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
          <Badge variant="warning">Module 03: Finance Management</Badge>
            <span className="text-xs text-zinc-400 dark:text-slate-400 font-sans">
              1-to-1 Budget Tracking &amp; Payment Gateway Integration
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Finance Management
          </h1>
          <p className="text-sm text-zinc-600 dark:text-slate-300 font-sans mt-1">
            Logged in as <strong className="text-zinc-900 dark:text-white">{currentUser?.name || currentUser?.email}</strong> &bull;{' '}
            Role: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentUser?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" icon={Download} onClick={exportFinancialReport} disabled={loading}>
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchFinanceData}
            disabled={loading}
          >
            {loading ? 'Syncing...' : 'Sync Live DB'}
          </Button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-lg bg-zinc-900 text-white dark:bg-emerald-950/40 dark:text-emerald-200 border border-zinc-700 dark:border-emerald-500/40 flex items-center justify-between text-xs font-sans">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="underline font-bold text-emerald-400 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
        <Card title="Allocate an Event Budget" subtitle="Create a budget for a submitted proposal.">
          <form onSubmit={handleCreateBudget} className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Event proposal
              <select
                required
                value={budgetForm.proposal_id}
                onChange={(event) => setBudgetForm((prev) => ({ ...prev, proposal_id: event.target.value }))}
                className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]"
              >
                <option value="">Choose a proposal</option>
                {proposals.map((proposal) => (
                  <option key={proposal.id} value={proposal.id}>{proposal.title} — requested ${Number(proposal.team_data?.requested_budget || 0).toLocaleString()}</option>
                ))}
              </select>
            </label>
            {budgetForm.proposal_id && (() => {
              const proposal = proposals.find((item) => item.id === budgetForm.proposal_id);
              const budget = budgets.find((item) => item.proposal_id === budgetForm.proposal_id);
              return (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-white/10">
                  <p>Requested Budget <strong className="block text-sm">${Number(proposal?.team_data?.requested_budget || 0).toLocaleString()}</strong></p>
                  <p>Current Disbursed <strong className="block text-sm">${Number(budget?.allocated_amount || 0).toLocaleString()}</strong></p>
                </div>
              );
            })()}
            <label className="block text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Disbursed Budget
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={budgetForm.allocated_amount}
                onChange={(event) => setBudgetForm((prev) => ({ ...prev, allocated_amount: event.target.value }))}
                className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]"
                placeholder="0.00"
              />
            </label>
            <Button type="submit" variant="primary" disabled={!budgetForm.proposal_id}>Save Disbursed Budget</Button>
          </form>
        </Card>

        <Card title="Record an Expense" subtitle="Record the expense first, then request a receipt from the student organizer.">
          <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Budget
              <select required value={expenseForm.budget_id} onChange={(event) => setExpenseForm((prev) => ({ ...prev, budget_id: event.target.value }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]">
                <option value="">Choose a budget</option>
                {budgets.map((budget) => <option key={budget.id} value={budget.id}>{proposals.find((proposal) => proposal.id === budget.proposal_id)?.title || budget.proposal_id}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Vendor
              <select value={expenseForm.vendor_id} onChange={(event) => setExpenseForm((prev) => ({ ...prev, vendor_id: event.target.value }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]">
                <option value="">Direct reimbursement</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Expense amount
              <input type="number" min="0.01" step="0.01" required value={expenseForm.amount} onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]" />
            </label>
            <label className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              Category
              <input required value={expenseForm.category} onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))} className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-[#090D10]" placeholder="Catering, Logistics…" />
            </label>
            <div className="sm:col-span-2"><Button type="submit" variant="primary" disabled={!budgets.length}>Record Expense</Button></div>
          </form>
        </Card>
      </div>

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
              ${totalBudgetPool.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              Active Budgets
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Live sanctioned allocations
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
              ${totalCommittedSpent.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              {totalBudgetPool > 0
                ? Math.round((totalCommittedSpent / totalBudgetPool) * 100)
                : 0}
              %
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            {overrunsCount} budget overrun{overrunsCount === 1 ? '' : 's'} flagged
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
              {pendingDisbursementsCount}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 font-sans">
              Queued
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Awaiting financial sign-off
          </p>
        </Card>

        <Card className="hover:border-zinc-400 dark:hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 font-sans">
              Registered Vendors
            </span>
            <div className="p-2 rounded bg-zinc-100 dark:bg-emerald-500/10 text-black dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              {vendors.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              Registered
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400 font-sans">
            Master university vendor catalog
          </p>
        </Card>
      </div>

      {/* DISBURSEMENTS TABLE */}
      <Card
        title="Pending &amp; Authorized Vendor Disbursements"
        subtitle="Expenses, submitted receipts, and payment records loaded from the finance service."
        headerAction={
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-white/10 p-0.5 rounded text-xs">
            {['All', 'Pending', 'Disbursed'].map((type) => (
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
                <th className="py-3 px-5">Expense Ref</th>
                <th className="py-3 px-5">Associated Event &amp; Category</th>
                <th className="py-3 px-5">Vendor &amp; ID</th>
                <th className="py-3 px-5">Invoice Date</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Receipt</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Disbursement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-medium">Fetching finance records from FastAPI...</p>
                  </td>
                </tr>
              ) : filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-slate-500 opacity-60" />
                    <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                      No records found
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-slate-500 mt-0.5">
                      No vendor disbursements matching the selected filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((item) => (
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
                        {item.proposalId.length > 8
                          ? `${item.proposalId.slice(0, 8)}...`
                          : item.proposalId}{' '}
                        &bull; {item.category}
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
                      {item.receiptId ? (
                        <button className="underline" onClick={() => handleDownloadReceipt(item.receiptId, item.receiptName)}>{item.receiptName}</button>
                      ) : item.receiptName}
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={item.status === 'Disbursed' ? 'approved' : 'pending'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {item.status === 'Disbursed' ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid ({item.paymentMethod})
                        </span>
                      ) : !item.hasReceipt ? (
                        item.receiptRequested ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Waiting for organizer receipt</span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRequestReceipt(item.id)}
                            disabled={paymentInProgress === item.id}
                            className="text-[11px]"
                          >
                            Request Receipt
                          </Button>
                        )
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDisburse(item, 'BankTransfer')}
                            disabled={paymentInProgress === item.id}
                            className="text-[11px]"
                          >
                            Disburse Wire
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDisburse(item, 'UPITransfer')}
                            disabled={paymentInProgress === item.id}
                            className="text-[11px]"
                          >
                            UPI
                          </Button>
                        </div>
                      )}
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

export default FinanceDesk;
