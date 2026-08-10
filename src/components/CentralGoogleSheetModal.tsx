import React, { useState } from 'react';
import { ExtractedInvoice, UserRole } from '../types';
import { GOOGLE_SHEET_URL } from '../data/sampleGoogleSheets';
import { getAllInvoicesFromThreeWayMatchingSheet } from '../data/mockInvoices';
import {
  X,
  FileSpreadsheet,
  Table,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Link2,
  ExternalLink,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface CentralGoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: ExtractedInvoice[];
  allInvoices?: ExtractedInvoice[];
  onDownloadFinalWorkbook: () => void;
  currentUserRole: UserRole;
}

export const CentralGoogleSheetModal: React.FC<CentralGoogleSheetModalProps> = ({
  isOpen,
  onClose,
  invoices,
  allInvoices,
  onDownloadFinalWorkbook,
  currentUserRole,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2' | 'tab3'>('tab3');

  // Retrieve all 3 central sheet invoices for Tab 1 & Tab 2 display
  const displayAllInvoices = (allInvoices && allInvoices.length > 0)
    ? allInvoices
    : getAllInvoicesFromThreeWayMatchingSheet();

  // Tab 3 strictly includes only invoices with NO major 3-way matching discrepancies
  const tab3Invoices = displayAllInvoices.filter((inv) => !inv.hasMajorDiscrepancy);
  const blockedInvoices = displayAllInvoices.filter((inv) => inv.hasMajorDiscrepancy);

  const getApprovalStatus = (inv: ExtractedInvoice) => {
    if (inv.humanReview) {
      if (inv.humanReview.decision === 'Approved for Payment') return 'Approved';
      if (inv.humanReview.decision === 'Rejected Suggestion') return 'Rejected';
      return inv.humanReview.decision;
    }
    return inv.paymentStatus === 'Approved' ? 'Approved' : 'Pending Review';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2 flex-wrap gap-1">
                <span>Central Shared Database: Google Sheet Workbook</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {displayAllInvoices.length} Total Invoices ({tab3Invoices.length} Eligible for Payment)
                </span>
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600/30 hover:bg-blue-600/60 text-blue-200 border border-blue-400/40 flex items-center space-x-1 transition-all ml-2"
                  title="Open live Google Sheet in new tab"
                >
                  <span>Open Three_Way_Matching Sheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Centralized multi-tab workbook shared across Stage 1 (Extraction) → Stage 2 (Three-Way Matching) → Stage 3 (Payment Schedule & Madam Lim Approval).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Data Key Pipeline Legend */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2 font-medium text-slate-700 dark:text-slate-300">
            <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Unique Key Linking:</span>
            <span className="font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
              Invoice_ID
            </span>
            <span className="text-slate-500 hidden sm:inline">
              (Links extraction, 3-way matching and payment decisions seamlessly)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Rule Enforced: Stage 2 Discrepancies Blocked from Stage 3 Payment</span>
            </span>
          </div>
        </div>

        {/* Google Sheet Tabs Selector */}
        <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => setActiveTab('tab1')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition-all border-t border-x cursor-pointer ${
              activeTab === 'tab1'
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600'
                : 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>TAB 1: Invoice_Extraction ({displayAllInvoices.length})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Stage 1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tab2')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition-all border-t border-x cursor-pointer ${
              activeTab === 'tab2'
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 border-b-2 border-b-amber-600'
                : 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>TAB 2: Three_Way_Matching ({displayAllInvoices.length})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
              Stage 2 ({blockedInvoices.length} Flagged)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tab3')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition-all border-t border-x cursor-pointer ${
              activeTab === 'tab3'
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600'
                : 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>TAB 3: AP_Payment_Schedule ({tab3Invoices.length})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              THIS APP (Stage 3)
            </span>
          </button>

        </div>

        {/* Sheet Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Invoice Extraction Records */}
          {activeTab === 'tab1' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 text-xs">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-blue-900 dark:text-blue-200">
                    Tab 1 Data Source: Stage 1 AI Invoice Extraction Application
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                  {displayAllInvoices.length} All Extracted Invoices Displayed
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Invoice Number</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Supplier Name</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Invoice Amount</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Invoice Date</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Extracted Information</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Extraction Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {displayAllInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                        <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{inv.supplierName}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-sans">
                          ${inv.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans">{inv.invoiceDate}</td>
                        <td className="p-3 font-sans text-slate-600 dark:text-slate-300">
                          {inv.extractedInformation || `Extracted ${inv.poNumber}, GST Reg #, Line Items & ${inv.paymentTerms}`}
                        </td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                            {inv.extractionStatus || '100% Extracted & Formatted'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Three-Way Matching Records */}
          {activeTab === 'tab2' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-2 text-xs">
                  <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Tab 2 Data Source: Stage 2 Three-Way Matching & Duplicate Detection Application
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                  {displayAllInvoices.length} Total Invoices Audited
                </span>
              </div>

              {blockedInvoices.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">
                      ⚠️ Stage 2 Major Discrepancy Flagged ({blockedInvoices.map(i => i.invoiceNumber).join(', ')})
                    </span>
                    <p className="text-rose-800 dark:text-rose-300">
                      Discrepancies identified in Stage 2 three-way matching (e.g. GRN quantity physical count mismatch). Invoices with major discrepancies are marked <strong>On Hold</strong> and are <strong>strictly blocked from Tab 3 (AP Payment Schedule)</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Invoice Number</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Supplier Name</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Purchase Order Match</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Goods Received Note Match</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Duplicate Check</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Stage 2 Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {displayAllInvoices.map((inv) => {
                      const isFlagged = inv.hasMajorDiscrepancy;
                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isFlagged ? 'bg-rose-50/80 dark:bg-rose-950/30 border-l-4 border-l-rose-500' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                          <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{inv.supplierName}</td>
                          <td className={`p-3 font-sans font-medium ${isFlagged ? 'text-slate-700 dark:text-slate-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                            {inv.poMatchResult || `Matched (${inv.poNumber})`}
                          </td>
                          <td className={`p-3 font-sans font-medium ${isFlagged ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-emerald-700 dark:text-emerald-300'}`}>
                            {inv.grnMatchResult || 'Matched (GRN Received & Verified)'}
                          </td>
                          <td className="p-3 font-sans font-medium text-emerald-700 dark:text-emerald-300">
                            {inv.duplicateCheckResult || 'Passed (No Duplicate Found)'}
                          </td>
                          <td className="p-3 font-sans">
                            {isFlagged ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-extrabold text-[11px] border border-rose-300 dark:border-rose-800 flex items-center space-x-1 w-max">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>On Hold - Discrepancy Flagged</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-300">
                                {inv.verificationStatus || 'Approved for Payment Scheduling'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AP Payment Schedule and Approval */}
          {activeTab === 'tab3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center space-x-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Tab 3 Data Source: Stage 3 AP Payment Schedule & Human Approval Assistant (THIS APP)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                  Synchronizes Madam Lim's Approval Decisions
                </span>
              </div>

              {/* Strict Rule Enforcement Banner */}
              {blockedInvoices.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1.5 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-100 text-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{blockedInvoices.length} Invoice Blocked from Tab 3 Payment Part (Stage 2 Discrepancy Enforced)</span>
                  </div>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                    The central shared database contains <strong>{displayAllInvoices.length} invoices</strong> in total across Stage 1 & Stage 2. However, <strong>{blockedInvoices.map(i => `${i.invoiceNumber} (${i.supplierName})`).join(', ')}</strong> has a <strong>major 3-Way Matching discrepancy</strong> (Quantity Mismatch: GRN 20 units vs Invoice 50 units) and is <strong>strictly prohibited from being taken into Tab 3 (AP Payment Schedule)</strong> until resolved.
                  </p>
                </div>
              )}

              {/* Clean Eligible Invoices Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Eligible Invoices Ready for Payment Scheduling ({tab3Invoices.length})</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold">
                      <tr>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Invoice_ID</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Supplier</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">PO_Number</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Invoice Amount</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Payment Due Date</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Payment Terms</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Three_Way_Matching Status</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Priority Level</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Approval Status</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Approved By</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Approval Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {tab3Invoices.map((inv) => {
                        const approvalText = getApprovalStatus(inv);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.supplierName}</td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{inv.poNumber || 'PO-BH-2026'}</td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                              ${inv.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-semibold">{inv.dueDate}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{inv.paymentTerms}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[11px]">
                                Passed (Clean Match)
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                inv.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                                inv.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {inv.priority}
                              </span>
                            </td>
                            <td className="p-3 font-bold">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                                approvalText === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                                approvalText === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                              }`}>
                                {approvalText}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {inv.humanReview ? inv.humanReview.reviewedBy : '-'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {inv.humanReview ? new Date(inv.humanReview.reviewedAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Blocked Discrepancy Invoices Section */}
              {blockedInvoices.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
                    <Lock className="h-4 w-4 text-rose-600" />
                    <span>Invoices Blocked from Payment Schedule ({blockedInvoices.length} Discrepancy Record)</span>
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-rose-100/60 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 uppercase font-bold">
                        <tr>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">Invoice_ID</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">Supplier</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">PO_Number</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800 text-right">Invoice Amount</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">Stage 2 Matching Status</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">Block Reason / Discrepancy Detail</th>
                          <th className="p-3 border-b border-rose-200 dark:border-rose-800">Tab 3 Payment Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
                        {blockedInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-rose-100/40 dark:hover:bg-rose-900/20">
                            <td className="p-3 font-mono font-bold text-rose-700 dark:text-rose-300">{inv.invoiceNumber}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.supplierName}</td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{inv.poNumber}</td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                              ${inv.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200 font-bold text-[11px]">
                                {inv.verificationStatus || 'On Hold - Discrepancy Flagged'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 max-w-sm">
                              {inv.discrepancyDetails || 'Quantity Discrepancy between Goods Received Note and Supplier Invoice'}
                            </td>
                            <td className="p-3 font-bold">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-800 text-white dark:bg-rose-900 border border-rose-900 flex items-center space-x-1 w-max">
                                <Lock className="h-3 w-3 shrink-0" />
                                <span>Prohibited from Tab 3 Payment</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Complete audit trail maintained across all 3 AI stages. Tab 3 Payment Schedule strictly enforced.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Close Window
            </button>

            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-emerald-200" />
              <span>Open Central ERP Google Sheet Database</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
