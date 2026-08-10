import React, { useState, useEffect } from 'react';
import { ExtractedInvoice, AuditLog } from '../types';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
} from '../utils/firebaseAuth';
import {
  createApPaymentScheduleGoogleSheet,
  createFullApAuditGoogleSheet,
  ExportReportResult
} from '../utils/googleSheetsExport';
import {
  downloadApPaymentScheduleWorkbook,
  downloadFullAPAuditWorkbook
} from '../utils/workbookExporter';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  Download,
  Table,
  FileCheck2,
  Layers
} from 'lucide-react';
import { User } from 'firebase/auth';

interface ExportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: ExtractedInvoice[];
  onAddAuditLog: (log: AuditLog) => void;
  currentUserRole: string;
  initialExportMode?: 'schedule' | 'full';
  sheetUrlOrId?: string;
}

export const ExportSheetsModal: React.FC<ExportSheetsModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onAddAuditLog,
  currentUserRole,
  initialExportMode = 'schedule',
  sheetUrlOrId,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'schedule' | 'full'>(initialExportMode);
  const [exportResult, setExportResult] = useState<ExportReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExportMode(initialExportMode);
    }
  }, [isOpen, initialExportMode]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadDirectXlsx = () => {
    if (exportMode === 'schedule') {
      downloadApPaymentScheduleWorkbook(invoices);
      onAddAuditLog({
        id: `log-export-xlsx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUserRole,
        role: currentUserRole as any,
        action: 'Downloaded AP Payment Schedule Workbook',
        details: `Downloaded single-tab AP_PAYMENT_SCHEDULE workbook containing verified payment schedule records.`,
        type: 'export'
      });
    } else {
      downloadFullAPAuditWorkbook(invoices);
      onAddAuditLog({
        id: `log-export-xlsx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUserRole,
        role: currentUserRole as any,
        action: 'Downloaded Full AP Audit Trail Workbook',
        details: `Downloaded 3-Tab Full AP Audit Trail Workbook containing Invoice_Extraction, Three_Way_Matching, and AP_PAYMENT_SCHEDULE sheets.`,
        type: 'export'
      });
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExportGoogleApi = async () => {
    setErrorMessage(null);
    setIsExporting(true);
    setExportResult(null);

    let activeToken = token;

    if (!activeToken) {
      setIsLoggingIn(true);
      try {
        const authRes = await googleSignIn();
        if (authRes?.accessToken) {
          activeToken = authRes.accessToken;
          setUser(authRes.user);
          setToken(authRes.accessToken);
          setNeedsAuth(false);
        } else {
          setIsExporting(false);
          setIsLoggingIn(false);
          setErrorMessage('Google Account connection required to grant Google Sheets permission.');
          return;
        }
      } catch (authErr: any) {
        setIsExporting(false);
        setIsLoggingIn(false);
        setErrorMessage(`Google Account Error: ${authErr.message || 'Failed to authenticate.'}`);
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    const spreadsheetId = sheetUrlOrId ? (sheetUrlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || sheetUrlOrId) : '1-WLi2F4xdh-ukhWqoTNCUJK6GMxhperG7pJumMY9GI';

    try {
      const result = await createApPaymentScheduleGoogleSheet(activeToken, invoices, sheetUrlOrId);
      setExportResult(result);

      onAddAuditLog({
        id: `log-export-gsheets-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUserRole,
        role: currentUserRole as any,
        action: 'AP_PAYMENT_SCHEDULE Worksheet Synchronized',
        details: `Connected to workbook (${spreadsheetId}). Updated tab "AP_PAYMENT_SCHEDULE" with ${result.exportedCount} approved records via Google Sheets API.`,
        type: 'export'
      });
    } catch (err: any) {
      console.error('Failed to sync to Google Sheets:', err);
      setErrorMessage(err.message || 'Failed to update Google Sheet worksheet.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white">
              <Table className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sync to Central Google Sheet Database</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                ERP Database Workflow — Writes to existing workbook tab <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono font-bold">AP_PAYMENT_SCHEDULE</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-sm">
          
          {/* Google Account Connection Status Card */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                  <span>Google Sheets API Authorization</span>
                  {token ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold flex items-center space-x-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Connected ({user?.email || 'Authorized'})</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold">
                      Login Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {token ? 'Read/write permissions granted for Google Sheets & Drive' : 'Connect Google account to grant Google Sheets read/write permission'}
                </p>
              </div>
            </div>

            {!token && (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect Google Account</span>
                )}
              </button>
            )}
          </div>

          {/* ERP Central Database Integration Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold text-sm">
              <span className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Central Real-Time ERP Google Sheet Database</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-600 text-white font-mono uppercase font-black">
                Connected
              </span>
            </div>
            
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              This application functions as an integrated ERP system. Clicking <strong>Sync to Google Sheets</strong> connects directly to the existing central Google Sheet workbook and writes/updates the worksheet tab named exactly <strong className="font-mono">AP_PAYMENT_SCHEDULE</strong> without creating a new workbook or requiring manual file exports.
            </p>

            {/* Audit Trail Workflow Diagram */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block mb-2">
                3-Stage Accounts Payable Audit Trail Pipeline:
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
                <div className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-center w-full">
                  1. Invoice_Extraction
                </div>
                <span className="text-emerald-600 font-bold shrink-0">↓</span>
                <div className="px-2.5 py-1.5 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-center w-full font-bold">
                  2. Three_Way_Matching
                </div>
                <span className="text-emerald-600 font-bold shrink-0">↓</span>
                <div className="px-2.5 py-1.5 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-center w-full font-extrabold">
                  3. AP_PAYMENT_SCHEDULE
                </div>
              </div>
            </div>

            {/* Target Worksheet Columns */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block">
                Worksheet Tab Schema (<code className="font-mono">AP_PAYMENT_SCHEDULE</code>):
              </span>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">• Invoice_ID (Primary Key)</div>
                <div>• Supplier Name</div>
                <div>• PO Number</div>
                <div>• Invoice Amount</div>
                <div>• Payment Due Date</div>
                <div>• Payment Terms</div>
                <div>• Three_Way_Matching_Status</div>
                <div>• Priority Level</div>
                <div>• AI Recommendation</div>
                <div>• Human Approval Status</div>
                <div>• Approved By</div>
                <div>• Approval Date</div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sync Result Box */}
          {exportResult && (
            <div className="p-4 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-700 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Central ERP Google Sheet Synchronized Successfully!</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Connected to existing linked workbook (<strong className="font-mono">{exportResult.spreadsheetId}</strong>) and updated worksheet tab <strong className="font-mono text-emerald-950 dark:text-emerald-100 font-black">AP_PAYMENT_SCHEDULE</strong> with {exportResult.exportedCount} approved payment records derived from <strong className="font-mono">Three_Way_Matching</strong>.
              </p>
              <div>
                <a
                  href={exportResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition-all"
                >
                  <span>Open Central Google Sheet ERP Database</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Reads strictly from Three_Way_Matching tab using Invoice_ID.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadDirectXlsx}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 cursor-pointer"
              title="Download a standalone copy/export of the AP Payment Schedule for user reference without altering the central ERP Google Sheet"
            >
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Download AP Payment Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleExportGoogleApi}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50 ring-2 ring-emerald-400/30 active:scale-95 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing to Existing Workbook...</span>
                </>
              ) : (
                <>
                  <Table className="h-4 w-4" />
                  <span>Sync to Google Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

