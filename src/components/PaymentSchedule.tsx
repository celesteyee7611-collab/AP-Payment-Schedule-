import React, { useState } from 'react';
import { ExtractedInvoice, PriorityLevel, UserRole } from '../types';
import { downloadApPaymentScheduleWorkbook, downloadFullAPAuditWorkbook, downloadApPaymentReport } from '../utils/workbookExporter';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  FileCheck, 
  Eye, 
  HelpCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  PauseCircle,
  Sparkles,
  FileSpreadsheet,
  Lock
} from 'lucide-react';

interface PaymentScheduleProps {
  invoices: ExtractedInvoice[];
  onSelectInvoiceForReview: (invoice: ExtractedInvoice) => void;
  selectedPriorityFilter: string | null;
  onSetPriorityFilter: (priority: string | null) => void;
  currentRole: UserRole;
  onBatchApprove?: (ids: string[]) => void;
  onOpenExportSheets: () => void;
  onSchedulePayment?: (invoice: ExtractedInvoice) => void;
  onMarkAsPaid?: (invoice: ExtractedInvoice) => void;
  googleAccessToken?: string;
  googleUserEmail?: string;
  onConnectGoogleAccount?: () => void;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  invoices,
  onSelectInvoiceForReview,
  selectedPriorityFilter,
  onSetPriorityFilter,
  currentRole,
  onBatchApprove,
  onOpenExportSheets,
  onSchedulePayment,
  onMarkAsPaid,
  googleAccessToken,
  googleUserEmail,
  onConnectGoogleAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const isOwnerAdmin = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';
  const isFinanceManager = currentRole.includes('Finance') || currentRole === 'Finance Manager';
  const isFinanceOrOwner = isOwnerAdmin || isFinanceManager;
  const isApAssistant = currentRole.includes('Madam Lim') || currentRole.includes('AP Staff') || currentRole === 'AP Staff (Madam Lim)';

  // Filter & Search Logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesPriority = selectedPriorityFilter ? inv.priority === selectedPriorityFilter : true;
    const matchesSearch =
      inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  // Sort: Group by AI Priority Ranking (HIGH -> MEDIUM -> LOW)
  // Within each priority group, sort by:
  // 1. Earliest payment due date first
  // 2. Highest payment risk (lowest daysUntilDue / overdue first)
  // 3. Invoice amount (highest amount first)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const priorityWeight: Record<PriorityLevel, number> = { High: 3, Medium: 2, Low: 1 };
    if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }

    // 1. Earliest payment due date first
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // 2. Highest payment risk (lower daysUntilDue = overdue or closer to due date)
    const daysA = a.daysUntilDue ?? Math.floor((dateA - Date.now()) / (1000 * 60 * 60 * 24));
    const daysB = b.daysUntilDue ?? Math.floor((dateB - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysA !== daysB) {
      return daysA - daysB;
    }

    // 3. Invoice amount (highest amount first)
    return b.amount - a.amount;
  });

  // Calculate total amount for currently filtered/sorted selection
  const totalFilteredAmount = sortedInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedInvoices.map((inv) => inv.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Priority', 'Supplier Name', 'Invoice Number', 'Due Date', 'Amount', 'Payment Terms', 'Status', 'Priority Reason', 'Recommended Action'];
    const rows = sortedInvoices.map((inv) => [
      inv.priority,
      `"${inv.supplierName}"`,
      inv.invoiceNumber,
      inv.dueDate,
      inv.amount,
      `"${inv.paymentTerms}"`,
      inv.paymentStatus,
      `"${inv.priorityReason.replace(/"/g, '""')}"`,
      `"${inv.recommendedAction.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BoonHuat_AP_Payment_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSGD = (val: number, currency: string = 'SGD') =>
    `${currency} $${val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string, humanReview?: any) => {
    if (humanReview && (humanReview.decision === 'Approved for Payment' || humanReview.decision === 'Confirm Payment' || humanReview.decision === 'Confirmed')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
          <ShieldCheck className="h-3 w-3 mr-1" /> Approved Payment ✓
        </span>
      );
    }
    if (humanReview && humanReview.decision === 'Rejected Suggestion') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
          <PauseCircle className="h-3 w-3 mr-1" /> Rejected Payment
        </span>
      );
    }
    if (humanReview && humanReview.decision === 'Placed on Hold') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
          <PauseCircle className="h-3 w-3 mr-1" /> Payment On Hold
        </span>
      );
    }
    if (humanReview && humanReview.decision === 'Marked as Paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Marked as Paid
        </span>
      );
    }
    if (status === 'Approved' || status === 'Scheduled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
          <ShieldCheck className="h-3 w-3 mr-1" /> Approved Payment ✓
        </span>
      );
    }
    if (status === 'Hold') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
          <PauseCircle className="h-3 w-3 mr-1" /> Payment On Hold
        </span>
      );
    }
    if (status === 'Paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Marked as Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
        <Clock className="h-3 w-3 mr-1" /> Pending Review
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 transition-colors">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Verified Invoices Payment Schedule & Priority Queue</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organized by payment due date & risk. Recommendations are explained clearly to support Madam Lim's review.
          </p>
        </div>

        {/* ERP Sync Control & Reference Report Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google OAuth Connection Button */}
          {googleAccessToken ? (
            <button
              onClick={onConnectGoogleAccount}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700/80 transition-all shadow-2xs cursor-pointer"
              title={`Google Account connected (${googleUserEmail || 'Authorized'}). Click to re-authenticate or switch account.`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Google Account Connected</span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogleAccount}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-2xs cursor-pointer ring-2 ring-blue-500/20"
              title="Connect your Google Account to request Google Sheets read/write permissions"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connect Google Account</span>
            </button>
          )}

          {/* Primary ERP Action: Sync to Google Sheets */}
          <button
            onClick={onOpenExportSheets}
            disabled={!googleAccessToken}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md transform active:scale-95 ring-2 ${
              googleAccessToken
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white ring-emerald-400/30 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60 ring-transparent shadow-none'
            }`}
            title={
              googleAccessToken
                ? 'Sync AP Payment Schedule directly into the existing connected Google Sheet workbook (AP_PAYMENT_SCHEDULE tab)'
                : 'Connect Google Account first to enable Sync to Google Sheets'
            }
          >
            <Sparkles className={`h-4 w-4 ${googleAccessToken ? 'text-emerald-200 animate-pulse' : 'text-slate-400'}`} />
            <span>Sync to Google Sheets</span>
          </button>

          {/* Standalone Reference Copy: Download AP Payment Report */}
          <button
            onClick={() => downloadApPaymentReport(sortedInvoices)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Download a standalone copy/export of the AP Payment Schedule (XLSX) for user reference without altering the central ERP Google Sheet"
          >
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Download AP Payment Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Payment Priority Filter Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="priority-filter-select" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 whitespace-nowrap">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Payment Priority Filter:</span>
            </label>
            <select
              id="priority-filter-select"
              value={selectedPriorityFilter || 'All Invoices'}
              onChange={(e) => {
                const val = e.target.value;
                onSetPriorityFilter(val === 'All Invoices' ? null : val);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-2xs"
            >
              <option value="All Invoices">1. All Invoices ({invoices.length})</option>
              <option value="High">2. High Priority ({invoices.filter((i) => i.priority === 'High').length})</option>
              <option value="Medium">3. Medium Priority ({invoices.filter((i) => i.priority === 'Medium').length})</option>
              <option value="Low">4. Low Priority ({invoices.filter((i) => i.priority === 'Low').length})</option>
            </select>
          </div>

          {/* Quick Filter Pill Shortcuts */}
          <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-300/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => onSetPriorityFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedPriorityFilter === null
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onSetPriorityFilter('High')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedPriorityFilter === 'High'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-red-700 dark:text-red-400 hover:text-red-800'
              }`}
            >
              High
            </button>
            <button
              onClick={() => onSetPriorityFilter('Medium')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedPriorityFilter === 'Medium'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => onSetPriorityFilter('Low')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedPriorityFilter === 'Low'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
              }`}
            >
              Low
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier, invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Summary Stats */}
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
          <div>
            Showing <span className="text-blue-600 dark:text-blue-400">{sortedInvoices.length}</span> of {invoices.length} invoices
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div>
            Total Payable: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatSGD(totalFilteredAmount)}</span>
          </div>
        </div>

      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
              <th className="p-3.5 pl-5 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === sortedInvoices.length && sortedInvoices.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3.5">Supplier Name</th>
              <th className="p-3.5">Invoice Number</th>
              <th className="p-3.5 text-right">Invoice Amount</th>
              <th className="p-3.5">Invoice Issue Date</th>
              <th className="p-3.5">Payment Due Date</th>
              <th className="p-3.5">Payment Terms</th>
              <th className="p-3.5">AI Recommendation</th>
              <th className="p-3.5 text-center">Human Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileCheck className="h-10 w-10 text-slate-400" />
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                      No verified invoices available for payment scheduling.
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                      Invoices must pass Stage 1 Invoice Extraction and Stage 2 Three-Way Matching (Three_Way_Matching Google Sheet) with Clean Match, Duplicate Check = Passed, and Verification Status = Approved before appearing here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedInvoices.map((inv, idx) => {
                const isSelected = selectedIds.includes(inv.id);
                const isExpanded = expandedReasonId === inv.id;

                // Determine if this row is the start of a priority group when showing All or multiple groups
                const isFirstInGroup = idx === 0 || sortedInvoices[idx - 1].priority !== inv.priority;

                return (
                  <React.Fragment key={inv.id}>
                    
                    {/* Priority Group Section Banner */}
                    {isFirstInGroup && (
                      <tr className={`border-y text-xs font-bold ${
                        inv.priority === 'High'
                          ? 'bg-red-100/90 dark:bg-red-950/80 border-red-200 dark:border-red-900 text-red-950 dark:text-red-200'
                          : inv.priority === 'Medium'
                          ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                          : 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200'
                      }`}>
                        <td colSpan={9} className="py-2.5 px-5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              {inv.priority === 'High' && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                              {inv.priority === 'Medium' && <Clock className="h-4 w-4 text-amber-600 shrink-0" />}
                              {inv.priority === 'Low' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                              <span className="font-extrabold uppercase tracking-wide">
                                {inv.priority === 'High' && '1. HIGH PRIORITY PAYMENTS QUEUE'}
                                {inv.priority === 'Medium' && '2. MEDIUM PRIORITY PAYMENTS QUEUE'}
                                {inv.priority === 'Low' && '3. LOW PRIORITY PAYMENTS QUEUE'}
                              </span>
                              <span className="hidden md:inline font-semibold text-[11px] opacity-90">
                                {inv.priority === 'High' && '— Overdue or Due within 7 Days • Highest Risk • Immediate Human Review'}
                                {inv.priority === 'Medium' && '— Due within 8 to 30 Days • Scheduled Review'}
                                {inv.priority === 'Low' && '— Due after 30 Days • Extended Credit Terms'}
                              </span>
                            </span>
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 shadow-2xs">
                              {sortedInvoices.filter((i) => i.priority === inv.priority).length} Invoices
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr
                      className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                        inv.priority === 'High' ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(inv.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Supplier Name */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer" onClick={() => onSelectInvoiceForReview(inv)}>
                          {inv.supplierName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                            {inv.category || 'General Hardware'}
                          </span>
                        </div>
                      </td>

                      {/* Invoice Number */}
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        #{inv.invoiceNumber}
                      </td>

                      {/* Invoice Amount */}
                      <td className="p-3.5 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatSGD(inv.amount, inv.currency)}
                      </td>

                      {/* Invoice Issue Date */}
                      <td className="p-3.5 font-medium whitespace-nowrap text-slate-800 dark:text-slate-200">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{inv.invoiceDate || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Payment Due Date */}
                      <td className="p-3.5 font-medium whitespace-nowrap">
                        {(() => {
                          const todayMs = new Date('2026-08-09').getTime();
                          const dueMs = new Date(inv.dueDate).getTime();
                          const daysDiff = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));
                          const isOverdue = daysDiff < 0;
                          const isDueSoon = daysDiff >= 0 && daysDiff <= 7;

                          return (
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span className={isOverdue ? 'font-extrabold text-red-600 dark:text-red-400' : isDueSoon ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}>
                                  {inv.dueDate}
                                </span>
                              </div>
                              {isOverdue && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 w-fit">
                                  OVERDUE ({Math.abs(daysDiff)}d)
                                </span>
                              )}
                              {isDueSoon && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 w-fit">
                                  DUE IN {daysDiff} DAY{daysDiff === 1 ? '' : 'S'}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Payment Terms */}
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {inv.paymentTerms}
                      </td>

                      {/* AI Recommendation */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-start justify-between space-x-1">
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
                            {inv.recommendedAction}
                          </p>
                          <button
                            onClick={() => setExpandedReasonId(isExpanded ? null : inv.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 transition-colors cursor-pointer"
                            title="View AI Priority Reasoning Details"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Human Review & Payment Scheduling Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-1.5">
                          {getStatusBadge(inv.paymentStatus, inv.humanReview)}
                          
                          <div className="flex items-center space-x-1.5">
                            {inv.humanReview?.decision === 'Approved for Payment' || inv.humanReview?.decision === 'Confirm Payment' || inv.humanReview?.decision === 'Confirmed' || inv.paymentStatus === 'Approved' || inv.paymentStatus === 'Scheduled' ? (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 opacity-90 cursor-not-allowed flex items-center space-x-1"
                                title={`Approved on ${inv.humanReview?.reviewedAt ? new Date(inv.humanReview.reviewedAt).toLocaleDateString() : 'recently'} by ${inv.humanReview?.reviewedBy || currentRole}`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Payment Approved ✓</span>
                              </button>
                            ) : inv.humanReview?.decision === 'Rejected Suggestion' ? (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 opacity-90 cursor-not-allowed flex items-center space-x-1"
                                title={`Rejected on ${inv.humanReview?.reviewedAt ? new Date(inv.humanReview.reviewedAt).toLocaleDateString() : 'recently'} by ${inv.humanReview?.reviewedBy || currentRole}${inv.humanReview?.notes ? `. Reason: ${inv.humanReview.notes}` : ''}`}
                              >
                                <PauseCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Payment Rejected</span>
                              </button>
                            ) : inv.humanReview?.decision === 'Placed on Hold' || inv.paymentStatus === 'Hold' ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 opacity-90 cursor-not-allowed flex items-center space-x-1"
                                  title={`Placed on hold on ${inv.humanReview?.reviewedAt ? new Date(inv.humanReview.reviewedAt).toLocaleDateString() : 'recently'} by ${inv.humanReview?.reviewedBy || currentRole}${inv.humanReview?.notes ? `. Reason: ${inv.humanReview.notes}` : ''}`}
                                >
                                  <PauseCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Payment On Hold</span>
                                </button>
                                <button
                                  onClick={() => onSelectInvoiceForReview(inv)}
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                                  title="Re-review payment details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onSelectInvoiceForReview(inv)}
                                className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 shadow-xs cursor-pointer transition-all flex items-center space-x-1"
                                title="Review payment details, three-way matching results, and AI explanation before making payment decision"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Review Payment</span>
                              </button>
                            )}

                            {inv.paymentStatus === 'Scheduled' && onMarkAsPaid && (
                              isFinanceOrOwner ? (
                                <button
                                  onClick={() => onMarkAsPaid(inv)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-all"
                                  title="Mark as Paid (Finance Manager / Owner Action)"
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <span
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1 cursor-not-allowed"
                                  title="Restricted: Madam Lim (AP Staff) cannot Mark as Paid. Only Finance Manager / Owner permitted."
                                >
                                  <Lock className="h-2.5 w-2.5 text-amber-500" />
                                  <span>Paid (Restricted)</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Plain Language AI Explanation Box for Mr Boon & Madam Lim */}
                    {(isExpanded || inv.priority === 'High') && (
                      <tr className="bg-blue-50/40 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <td colSpan={9} className="p-3.5 sm:p-4">
                          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center space-x-2">
                                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  AI Priority Recommendation & Explanation ({inv.priority} Priority)
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500">
                                AI Recommends Only • Final Approval Remains with Madam Lim
                              </span>
                            </div>

                            {/* Direct Plain-Language Summary Box for Mr Boon */}
                            {inv.aiExplanation && (
                              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                                <span className="font-bold text-blue-950 dark:text-blue-200 block text-xs mb-1">
                                  AI Explanation (for Mr Boon):
                                </span>
                                <p className="text-slate-800 dark:text-slate-200 font-medium text-xs leading-relaxed">
                                  "{inv.aiExplanation}"
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* 1. Why prioritised */}
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-slate-900 dark:text-slate-200 block mb-1">
                                  Priority Assessment
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                  {inv.aiExplanationSimple?.whyPrioritised || inv.priorityReason}
                                </p>
                              </div>

                              {/* 2. Risk if delayed */}
                              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50">
                                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                                  Risk if Delayed
                                </span>
                                <p className="text-amber-950 dark:text-amber-200 text-xs leading-relaxed">
                                  {inv.aiExplanationSimple?.riskIfDelayed || "Delaying past the due date risks supplier late charges or credit holds."}
                                </p>
                              </div>

                              {/* 3. Recommended Action */}
                              <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50">
                                <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                                  Recommended Action
                                </span>
                                <p className="text-emerald-950 dark:text-emerald-200 text-xs font-semibold leading-relaxed">
                                  {inv.aiRecommendation || inv.aiExplanationSimple?.recommendedActionForUser || inv.recommendedAction}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
        <div>
          Selected: <strong className="text-slate-900 dark:text-white">{selectedIds.length}</strong> invoices
        </div>
        <div className="flex items-center space-x-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                if (onBatchApprove) onBatchApprove(selectedIds);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors text-xs flex items-center space-x-1 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {isApAssistant
                  ? `Submit Batch Payment Requests (${selectedIds.length})`
                  : `Batch Final Review & Approval (${selectedIds.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
