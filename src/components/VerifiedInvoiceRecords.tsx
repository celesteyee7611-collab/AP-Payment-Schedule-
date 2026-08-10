import React, { useState } from 'react';
import { ExtractedInvoice, UserRole } from '../types';
import { ImportGoogleSheetModal } from './ImportGoogleSheetModal';
import {
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Info,
  Calendar,
  DollarSign,
  Search,
  Building2,
  RefreshCw
} from 'lucide-react';

interface VerifiedInvoiceRecordsProps {
  invoices: ExtractedInvoice[];
  onImportInvoices: (importedInvoices: ExtractedInvoice[], sourceSheetTitle: string) => void;
  currentRole: UserRole;
}

export const VerifiedInvoiceRecords: React.FC<VerifiedInvoiceRecordsProps> = ({
  invoices,
  onImportInvoices,
  currentRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVerifiedAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs mb-8 transition-colors">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Three-Way Matching Invoice Records
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Stage 3: AP Payment Schedule
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            This application retrieves invoice records strictly from the <strong>Three_Way_Matching</strong> sheet. Only invoices meeting all three criteria (Duplicate Check = Passed, Three_Way_Matching_Status = Passed, Verification Status = Approved) appear here. Manual invoice creation and batch selection are disabled.
          </p>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all transform active:scale-95 shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sync Three-Way Matching Records</span>
        </button>
      </div>

      {/* Upstream Workflow Validation Pills */}
      <div className="mb-5 p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Upstream Audit Requirements (Three_Way_Matching Sheet):</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Connected to Stage 1 (Extraction) & Stage 2 (Matching)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>✓ Invoice Extraction Completed</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>✓ Duplicate Check = Passed</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>✓ Three_Way_Matching_Status = Passed</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-800 dark:text-blue-300 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span>✓ Verification Status = Approved</span>
          </div>
        </div>
      </div>

      {/* Fairness Control Banner */}
      <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
        <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
            Fairness Control
          </span>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Payment priorities are determined based on objective factors such as due date, payment terms and overdue status. Supplier size, supplier history or company relationship will not affect priority ranking.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Verified Records Active
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {invoices.length} Invoices
            </span>
          </div>
          <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Verified Payable
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              SGD ${totalVerifiedAmount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Audit Source
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mt-0.5">
              Three_Way_Matching Sheet
            </span>
          </div>
          <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search verified supplier, invoice #, PO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
          Showing {filteredInvoices.length} of {invoices.length} verified records
        </span>
      </div>

      {/* Verified Invoice Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">Supplier Name</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4 text-right">Invoice Amount</th>
              <th className="py-3 px-4">Payment Due Date</th>
              <th className="py-3 px-4">Payment Terms</th>
              <th className="py-3 px-4">Verification Status</th>
              <th className="py-3 px-4">Priority Ranking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <ShieldCheck className="h-8 w-8 text-slate-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      No verified invoices available for payment scheduling.
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sync from the Three_Way_Matching sheet to load verified invoice records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{inv.supplierName}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    SGD ${inv.amount.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{inv.dueDate}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    {inv.paymentTerms}
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Verified & Passed</span>
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        inv.priority === 'High'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : inv.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {inv.priority} Priority
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Import / Sync Modal */}
      <ImportGoogleSheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportInvoices={onImportInvoices}
        currentUserRole={currentRole}
      />

    </div>
  );
};
