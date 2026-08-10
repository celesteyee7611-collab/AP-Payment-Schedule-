import React, { useState } from 'react';
import { ExtractedInvoice, UserRole } from '../types';
import { GOOGLE_SHEET_URL } from '../data/sampleGoogleSheets';
import {
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  Table,
  Link2,
  Lock,
  RefreshCw,
  Download,
  CheckCircle2,
  RotateCcw,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface VerifiedInvoiceSyncBannerProps {
  invoices: ExtractedInvoice[];
  onOpenCentralSheet: () => void;
  onDownloadPaymentSchedule: () => void;
  onDownloadFullAuditTrail: () => void;
  onDownloadWorkbook?: () => void;
  onSyncVerifiedInvoices?: () => void;
  onResetInvoices?: () => void;
  onRemoveAllSuppliers?: () => void;
  currentRole: UserRole;
  sheetUrlOrId?: string;
  onUpdateSheetUrlOrId?: (urlOrId: string) => void;
  googleAccessToken?: string;
  googleUserEmail?: string;
  onConnectGoogleAccount?: () => void;
}

export const VerifiedInvoiceSyncBanner: React.FC<VerifiedInvoiceSyncBannerProps> = ({
  invoices,
  onOpenCentralSheet,
  onDownloadPaymentSchedule,
  onDownloadFullAuditTrail,
  onDownloadWorkbook,
  onSyncVerifiedInvoices,
  onResetInvoices,
  onRemoveAllSuppliers,
  sheetUrlOrId = 'https://docs.google.com/spreadsheets/d/1-WLi2F4xdh-ukhWqoTNCUJK6GMxhperG7pJumMY9GI/edit?gid=752047866#gid=752047866',
  onUpdateSheetUrlOrId,
  googleAccessToken,
  googleUserEmail,
  onConnectGoogleAccount,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Live Connected');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(sheetUrlOrId);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      if (onSyncVerifiedInvoices) {
        await onSyncVerifiedInvoices();
      }
      const timeStr = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(`Synced at ${timeStr}`);
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSheetUrlOrId && urlInput.trim()) {
      onUpdateSheetUrlOrId(urlInput.trim());
      setIsEditingUrl(false);
      if (onSyncVerifiedInvoices) onSyncVerifiedInvoices();
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-6 shadow-xl mb-8 border border-slate-700/80 transition-all">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-700/80">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Three-Way Matching Verified Invoices
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{lastSyncedTime}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 border border-emerald-400/50 flex items-center space-x-1 transition-all cursor-pointer"
              title="Click to change or verify connected Google Sheet URL"
            >
              <Link2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Configure Sheet URL</span>
            </button>

            <a
              href={sheetUrlOrId.startsWith('http') ? sheetUrlOrId : `https://docs.google.com/spreadsheets/d/${sheetUrlOrId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 flex items-center space-x-1 transition-all"
              title="Open connected Google Sheet in new tab"
            >
              <span>Connected Spreadsheet</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Connected to central AP Google Sheet. Reads approved invoices from <strong>Extracted_Invoices</strong> and context from <strong>Three_Way_Matching</strong>, and updates <strong>Supplier_payments</strong> & <strong>Audit_Log</strong> tabs upon scheduling.
          </p>

          {/* Inline Sheet URL Connection Setup Form */}
          {isEditingUrl && (
            <form onSubmit={handleConnectSubmit} className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-emerald-500/40 flex flex-col sm:flex-row items-center gap-2">
              <label htmlFor="sheet-url-input" className="text-xs font-bold text-emerald-300 shrink-0 flex items-center space-x-1">
                <Link2 className="h-4 w-4" />
                <span>Google Sheet URL/ID:</span>
              </label>
              <input
                id="sheet-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1-WLi2F4xdh-ukhWqoTNCUJK6GMxhperG7pJumMY9GI/edit..."
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
              />
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Connect & Sync
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Central ERP Google Sheets Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {onConnectGoogleAccount && (
            googleAccessToken ? (
              <button
                type="button"
                onClick={onConnectGoogleAccount}
                className="px-3 py-2 rounded-xl bg-slate-800 text-emerald-300 border border-emerald-700/80 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title={`Google Account connected (${googleUserEmail || 'Authorized'}). Click to re-connect.`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Google Connected</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectGoogleAccount}
                className="px-3 py-2 rounded-xl bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Connect your Google Account to grant Google Sheets read/write permissions"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Connect Google Account</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-75 ring-2 ring-emerald-400/30"
            title="Connect to existing linked Google Sheet workbook and update AP_PAYMENT_SCHEDULE tab"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing to Google Sheets...' : 'Sync to Google Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPaymentSchedule}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download a standalone copy/export of the AP Payment Schedule for user reference without altering the central ERP Google Sheet"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>Download AP Payment Report</span>
          </button>

          <button
            type="button"
            onClick={onOpenCentralSheet}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="View the central real-time ERP Google Sheet database"
          >
            <Table className="h-4 w-4 text-emerald-400" />
            <span>View Central ERP Sheet</span>
          </button>

          {/* REMOVE ALL SUPPLIERS BUTTON */}
          {onRemoveAllSuppliers && (
            <button
              type="button"
              onClick={onRemoveAllSuppliers}
              title="Remove all suppliers from the AP payment schedule (0 suppliers)"
              className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-md"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Remove All Suppliers ({invoices.length})</span>
            </button>
          )}

          {/* RESET INVOICES BUTTON */}
          {onResetInvoices && invoices.length > 0 && (
            <button
              type="button"
              onClick={onResetInvoices}
              title="Reset invoice amounts to $0.00 and human approvals cleared to pending"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <span>Reset Amounts ($0)</span>
            </button>
          )}
        </div>
      </div>

      {/* Workflow Progression Diagram */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 mb-5">
        <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Link2 className="h-4 w-4 text-blue-400" />
            <span>Sequential Accounts Payable AI Pipeline Workflow:</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            Audit Trail Source: Three_Way_Matching Sheet
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          
          {/* Stage 1 */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Stage 1
            </span>
            <span className="text-xs font-extrabold text-white block mt-0.5">
              Invoice Extraction
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Tab 1: Invoice Extraction Records
            </span>
          </div>

          <div className="hidden md:flex justify-center text-emerald-400">
            <ArrowRight className="h-5 w-5 animate-pulse" />
          </div>

          {/* Stage 2 Output / Three_Way_Matching Sheet */}
          <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-500/40 text-center relative">
            <div className="absolute -top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded shadow">
              AUDIT SOURCE
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
              Stage 2 Output
            </span>
            <span className="text-xs font-extrabold text-white block mt-0.5">
              Three_Way_Matching
            </span>
            <span className="text-[10px] text-emerald-200 block mt-0.5">
              Tab 2: Three-Way Matching Records
            </span>
          </div>

          <div className="hidden md:flex justify-center text-emerald-400">
            <ArrowRight className="h-5 w-5 animate-pulse" />
          </div>

          {/* Stage 3 App */}
          <div className="bg-blue-950/80 p-3 rounded-xl border border-blue-400/50 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 block">
              Stage 3 App (This App)
            </span>
            <span className="text-xs font-extrabold text-white block mt-0.5">
              AP Payment Schedule
            </span>
            <span className="text-[10px] text-blue-200 block mt-0.5">
              Tab 3: AP Payment Schedule
            </span>
          </div>

        </div>
      </div>

      {/* Upstream Verification Requirements Badges */}
      <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1 text-xs">
          <span className="font-bold text-slate-300 flex items-center space-x-1.5">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Strict Verification Requirements Met ({invoices.length} Verified Records Active):</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-1.5 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Duplicate Check = Passed</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Three_Way_Matching_Status = Passed</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verification Status = Approved</span>
          </span>
        </div>
      </div>

    </div>
  );
};
