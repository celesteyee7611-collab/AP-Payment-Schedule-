import React, { useState } from 'react';
import { ExtractedInvoice, UserRole } from '../types';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  Calendar, 
  Building2, 
  FileText, 
  CreditCard,
  Lock,
  UserCheck,
  Send,
  Sparkles,
  FileCheck
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: ExtractedInvoice | null;
  onClose: () => void;
  onUpdateInvoiceStatus: (
    id: string,
    decision: 'Approved for Payment' | 'Placed on Hold' | 'Due Date Adjusted' | 'Marked as Paid' | 'Rejected Suggestion' | 'Confirm Payment',
    notes: string,
    adjustedDate?: string
  ) => void;
  onUpdateBankDetails?: (id: string, newBankDetails: string) => void;
  onDeleteInvoice?: (id: string) => void;
  currentRole: UserRole;
  onAccessDenied?: (action: string, requiredRole?: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onUpdateInvoiceStatus,
  onUpdateBankDetails,
  onDeleteInvoice,
  currentRole,
  onAccessDenied,
}) => {
  if (!invoice) return null;

  const [notes, setNotes] = useState('');
  const [adjustedDate, setAdjustedDate] = useState(invoice.dueDate);
  const [showAdjustDate, setShowAdjustDate] = useState(false);

  // Bank detail editing state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankInput, setBankInput] = useState(invoice.bankDetails || 'DBS Bank Ltd • Account: 003-901-8812');

  const isOwnerAdmin = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';
  const isFinanceManager = currentRole.includes('Finance') || currentRole === 'Finance Manager';
  const isFinanceOrOwner = isOwnerAdmin || isFinanceManager;
  const isApStaff = currentRole.includes('Madam Lim') || currentRole === 'AP Staff (Madam Lim)';

  const handleAction = (decision: 'Approved for Payment' | 'Placed on Hold' | 'Due Date Adjusted' | 'Marked as Paid' | 'Rejected Suggestion' | 'Confirm Payment') => {
    onUpdateInvoiceStatus(invoice.id, decision, notes, showAdjustDate ? adjustedDate : undefined);
    onClose();
  };

  const handleSaveBankDetails = () => {
    if (!isOwnerAdmin) {
      if (onAccessDenied) {
        onAccessDenied('Modify Supplier Banking Details', 'Owner / Admin (Mr Boon)');
      }
      return;
    }
    if (onUpdateBankDetails && bankInput.trim()) {
      onUpdateBankDetails(invoice.id, bankInput.trim());
      setIsEditingBank(false);
    }
  };

  const handleDelete = () => {
    if (!isOwnerAdmin) {
      if (onAccessDenied) {
        onAccessDenied('Delete Financial Records', 'Owner / Admin (Mr Boon)');
      }
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete invoice #${invoice.invoiceNumber} for ${invoice.supplierName}? This security action will be recorded in the Audit Trail.`)) {
      if (onDeleteInvoice) {
        onDeleteInvoice(invoice.id);
        onClose();
      }
    }
  };

  const handleAttemptAutomatedBankTransfer = () => {
    if (onAccessDenied) {
      onAccessDenied(
        'Execute Automated Direct Bank Transfer',
        'Human AP Authorization & Bank Gateway (AI is prohibited from executing transfers)'
      );
    }
  };

  const formatSGD = (val: number, currency: string = 'SGD') =>
    `${currency} $${val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Payment Review: {invoice.supplierName}</span>
                <span className="text-xs text-slate-500 font-normal">#{invoice.invoiceNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uploaded by {invoice.uploadedBy || 'AP Clerk'} • {new Date(invoice.uploadedAt).toLocaleDateString()} • PO: {invoice.poNumber || 'PO-BH-2026'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Human Control Oversight Disclaimer */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-200 block text-xs">
                HUMAN OVERSIGHT REQUIRED BEFORE CONFIRMING PAYMENT
              </span>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mt-0.5">
                AI provides recommendations and explanations only. Madam Lim must review the payment details, AI explanation, and three-way matching results before confirming supplier payments. AI cannot automatically approve or execute payments.
              </p>
            </div>
          </div>

          {/* 1. Supplier Details, Invoice Amount, Invoice Issue Date, Payment Due Date, Payment Terms */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] block">Supplier Details</span>
              <span className="font-bold text-xs text-slate-900 dark:text-white block mt-0.5 truncate" title={invoice.supplierName}>
                {invoice.supplierName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">#{invoice.invoiceNumber}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] block">Invoice Amount</span>
              <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400 block mt-0.5">
                {formatSGD(invoice.amount, invoice.currency)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] block">Invoice Issue Date</span>
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                {invoice.invoiceDate || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] block">Payment Due Date</span>
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                {invoice.dueDate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] block">Payment Terms</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                {invoice.paymentTerms}
              </span>
            </div>
          </div>

          {/* 2. Three-Way Matching Result & Priority Level */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Three-Way Matching & Verification Result</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                invoice.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300' :
                invoice.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
              }`}>
                Priority Level: {invoice.priority} Priority
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Matching Result</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs block mt-0.5">
                  {invoice.verificationStatus || 'Clean Match (Passed)'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">PO Verification</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                  {invoice.poMatchResult || `Matched (${invoice.poNumber || 'PO-BH-2026'})`}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Goods Received & Duplicate Check</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                  {invoice.grnMatchResult || 'Matched'} • {invoice.duplicateCheckResult || 'Passed'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. AI Explanation & Prioritisation Analysis for Madam Lim */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800/60">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                  AI Recommendation & Explanation for Madam Lim
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                AI Recommend Only • Human Decision
              </span>
            </div>

            {/* AI Recommendation */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-blue-950 dark:text-blue-200 block mb-1 text-xs">
                AI Recommendation:
              </span>
              <p className="text-slate-900 dark:text-white font-extrabold text-xs">
                {invoice.aiRecommendation || invoice.recommendedAction || invoice.aiExplanationSimple?.recommendedActionForUser}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Reason why prioritised */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-200 block mb-1 text-xs">
                  Reason Why Prioritised:
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {invoice.aiExplanationSimple?.whyPrioritised || invoice.priorityReason || invoice.aiExplanation}
                </p>
              </div>

              {/* Potential payment risks */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1 text-xs">
                  Potential Payment Risks:
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {invoice.aiExplanationSimple?.riskIfDelayed || "Delaying past due date risks supplier credit holds or late payment penalties on urgent hardware deliveries."}
                </p>
              </div>

              {/* Recommended next action */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1 text-xs">
                  Recommended Next Action:
                </span>
                <p className="text-slate-900 dark:text-white font-semibold text-xs leading-relaxed">
                  {invoice.aiExplanationSimple?.recommendedActionForUser || invoice.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Banking Account Details & RBAC Security Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-xs">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Supplier Banking Account Details</span>
              </span>

              {isOwnerAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsEditingBank(!isEditingBank)}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-300 dark:border-blue-800 hover:bg-blue-200 cursor-pointer"
                >
                  {isEditingBank ? 'Cancel Edit' : 'Edit Bank Details'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onAccessDenied) {
                      onAccessDenied('Modify Supplier Banking Details', 'Owner / Admin (Mr Boon)');
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer"
                >
                  <Lock className="h-3 w-3" />
                  <span>Edit Bank (Restricted to Mr Boon)</span>
                </button>
              )}
            </div>

            {isEditingBank ? (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleSaveBankDetails}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                >
                  Save Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {invoice.bankDetails || 'DBS Bank Ltd • Account: 003-901-8812 • PayNow UEN: 200812938K'}
                </span>
                {!isOwnerAdmin && (
                  <span className="text-[10px] text-slate-500 italic">
                    (Restricted: Only Mr Boon can modify)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Itemized Invoice Line Details
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {invoice.lineItems && invoice.lineItems.length > 0 ? (
                    invoice.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-center">{item.qty}</td>
                        <td className="p-2.5 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold">${item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-400">
                        General Hardware Supplies Lump Sum
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Existing Human Audit Record if available */}
          {invoice.humanReview && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Reviewed by {invoice.humanReview.reviewedBy} ({invoice.humanReview.role})</span>
              </div>
              <p className="text-xs">
                Decision: <strong>{invoice.humanReview.decision}</strong> on {new Date(invoice.humanReview.reviewedAt).toLocaleString()}
              </p>
              {invoice.humanReview.notes && (
                <p className="text-xs italic mt-1">"{invoice.humanReview.notes}"</p>
              )}
            </div>
          )}

          {/* Human Review Decision Notes */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Madam Lim / AP Review Notes ({currentRole})</span>
              </label>

              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded">
                Active Governance: {currentRole}
              </span>
            </div>

            <div>
              <textarea
                placeholder="Enter review notes e.g., 'Reviewed AI explanation and three-way match on PO-BH-2026. Confirmed payment.'"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {showAdjustDate && (
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-xs">Adjust Target Due Date:</span>
                <input
                  type="date"
                  value={adjustedDate}
                  onChange={(e) => setAdjustedDate(e.target.value)}
                  className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Decision Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAdjustDate(!showAdjustDate)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {showAdjustDate ? 'Cancel Date Adjust' : 'Adjust Due Date'}
            </button>

            {/* Direct Automated Bank Transfer Prohibited Action Button */}
            <button
              type="button"
              onClick={handleAttemptAutomatedBankTransfer}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Test Bank Direct Transfer Execution Control"
            >
              <Send className="h-3.5 w-3.5 text-slate-400" />
              <span>Direct Bank Transfer</span>
              <Lock className="h-3 w-3 text-amber-500 ml-0.5" />
            </button>

            {/* Delete Record Security Action */}
            {isOwnerAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-800 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Permanently delete record (Admin Action - Logged in Audit Trail)"
              >
                <span>Delete Record</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center space-x-1 hover:bg-slate-200"
                title="Restricted: AP Staff (Madam Lim) cannot delete financial records."
              >
                <Lock className="h-3 w-3 text-amber-500" />
                <span>Delete (Restricted)</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            
            <button
              type="button"
              onClick={() => handleAction('Rejected Suggestion')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Reject AI payment recommendation"
            >
              <PauseCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>Reject Suggestion</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('Placed on Hold')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Place invoice on payment hold"
            >
              <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Place on Hold</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('Confirm Payment')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer ring-2 ring-blue-400/30"
              title="Confirm payment after reviewing AI explanation and details (Syncs status to AP_PAYMENT_SCHEDULE Google Sheet)"
            >
              <CheckCircle2 className="h-4 w-4 text-blue-200" />
              <span>Confirm Payment</span>
            </button>

            {isFinanceOrOwner ? (
              <button
                type="button"
                onClick={() => handleAction('Marked as Paid')}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                title="Mark invoice as paid in Supplier_payments tab (Finance Manager / Owner Action)"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as Paid</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onAccessDenied) {
                    onAccessDenied('Mark Invoices as Paid / Release Payment Execution', 'Finance Manager / Owner (Mr Boon)');
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Restricted: Madam Lim (AP Staff) cannot Mark as Paid or Release Payments. Only Finance Manager / Owner permitted."
              >
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>Mark as Paid (Restricted)</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

