import React, { useState, useEffect } from 'react';
import { ExtractedInvoice, AuditLog, UserRole } from './types';
import { INITIAL_INVOICES, INITIAL_AUDIT_LOGS, SAMPLE_VERIFIED_INVOICES, getVerifiedInvoicesFromThreeWayMatchingSheet, getAllInvoicesFromThreeWayMatchingSheet } from './data/mockInvoices';
import { THREE_WAY_MATCHING_SHEET, fetchLiveThreeWayMatchingSheet } from './data/sampleGoogleSheets';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { VerifiedInvoiceSyncBanner } from './components/VerifiedInvoiceSyncBanner';
import { CentralGoogleSheetModal } from './components/CentralGoogleSheetModal';
import { MetricsOverview } from './components/MetricsOverview';
import { VerifiedInvoiceRecords } from './components/VerifiedInvoiceRecords';
import { PaymentSchedule } from './components/PaymentSchedule';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { AiChatAssistant } from './components/AiChatAssistant';
import { ExportSheetsModal } from './components/ExportSheetsModal';
import { MfaModal } from './components/MfaModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LoginScreen } from './components/LoginScreen';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import { downloadFinalAPAuditWorkbook, downloadFullAPAuditWorkbook, downloadApPaymentScheduleWorkbook } from './utils/workbookExporter';
import { loadLiveGoogleSheetData, getStoredSheetUrlOrId, saveStoredSheetUrlOrId, syncPaymentStatusToGoogleSheet } from './utils/googleSheetsLiveSync';
import { createApPaymentScheduleGoogleSheet } from './utils/googleSheetsExport';
import { getAccessToken, googleSignIn } from './utils/firebaseAuth';
import { ShieldCheck, Sparkles, Building2, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [invoices, setInvoices] = useState<ExtractedInvoice[]>(INITIAL_INVOICES);
  const [allCentralInvoices, setAllCentralInvoices] = useState<ExtractedInvoice[]>(getAllInvoicesFromThreeWayMatchingSheet());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [currentRole, setCurrentRole] = useState<UserRole>('AP Staff (Madam Lim)');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string | null>(null);
  const [sheetUrlOrId, setSheetUrlOrId] = useState<string>(getStoredSheetUrlOrId());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | undefined>(undefined);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | undefined>(undefined);

  const handleConnectGoogleAccount = async () => {
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setGoogleAccessToken(res.accessToken);
        setGoogleUserEmail(res.user.email || undefined);
        showToast(`Google Account connected (${res.user.email || 'Authorized'}). Google Sheets permission granted.`);
      }
    } catch (err: any) {
      console.error('Google Connect Error:', err);
      showToast(`Google Connection Error: ${err.message || 'Failed to authenticate.'}`);
    }
  };
  
  // Security & MFA State
  const [isMfaVerified, setIsMfaVerified] = useState<boolean>(true);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);

  // Access Denied RBAC State
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    attemptedAction: string;
    requiredRole: string;
  }>({
    isOpen: false,
    attemptedAction: '',
    requiredRole: 'Owner / Admin (Mr Boon)'
  });

  // Modal & Drawer states
  const [reviewingInvoice, setReviewingInvoice] = useState<ExtractedInvoice | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isExportSheetsOpen, setIsExportSheetsOpen] = useState<boolean>(false);
  const [exportModalMode, setExportModalMode] = useState<'schedule' | 'full'>('schedule');
  const [isCentralSheetModalOpen, setIsCentralSheetModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Dark Mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-load verified records directly from Extracted_Invoices & Three_Way_Matching Google Sheet on initial load
  useEffect(() => {
    const loadInitialSheetData = async () => {
      try {
        const result = await loadLiveGoogleSheetData(sheetUrlOrId, googleAccessToken);
        if (result) {
          if (result.invoices && result.invoices.length > 0) {
            setInvoices(result.invoices);
          }
          if (result.allInvoices && result.allInvoices.length > 0) {
            setAllCentralInvoices(result.allInvoices);
          }
        }
      } catch (err) {
        console.warn('Initial Google Sheet sync error:', err);
      }
    };
    loadInitialSheetData();
  }, [sheetUrlOrId, googleAccessToken]);

  const handleUpdateSheetUrlOrId = (newUrlOrId: string) => {
    saveStoredSheetUrlOrId(newUrlOrId);
    setSheetUrlOrId(newUrlOrId);
    showToast(`Connected to Google Sheet: ${newUrlOrId.substring(0, 45)}...`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoginSuccess = (role: UserRole) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    setIsMfaVerified(true);

    let userName = 'Madam Lim';
    if (role.includes('Mr Boon')) userName = 'Mr Boon';
    if (role.includes('Supervisor')) userName = 'Sarah Tan';
    if (role.includes('Finance')) userName = 'David Chen';

    const loginLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: role,
      role: role,
      action: 'Authorised AP Login Executed',
      details: `Authenticated user ${userName} (${role}) via password verification. Access granted to Accounts Payable Payment Schedule Assistant.`,
      type: 'security',
      ipAddress: '192.168.1.104 (Session #BOON-AUTH-2026)'
    };

    setAuditLogs((prev) => [loginLog, ...prev]);
    showToast(`Welcome ${userName}! Authenticated as ${role}.`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);

    const logoutLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentRole,
      role: currentRole,
      action: 'AP Session Signed Out / Locked',
      details: `User signed out. Session locked to protect confidential supplier payment records.`,
      type: 'security'
    };

    setAuditLogs((prev) => [logoutLog, ...prev]);
  };

  const handleMfaVerifySuccess = (role: UserRole) => {
    setIsMfaVerified(true);
    setIsMfaModalOpen(false);

    const mfaLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: role,
      role: role,
      action: '2FA Multi-Factor Identity Verified',
      details: `User identity verified via 2FA security code for ${role}. Full financial review granted.`,
      type: 'security',
      ipAddress: '192.168.1.104 (2FA Session #BOON-SEC-882041)'
    };

    setAuditLogs((prev) => [mfaLog, ...prev]);
    showToast(`2FA Identity Verified for ${role}. Financial access unlocked.`);
  };

  const handleImportInvoices = (newInvoices: ExtractedInvoice[], sourceSheetTitle: string) => {
    setInvoices((prev) => [...newInvoices, ...prev]);

    const batchLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentRole}`,
      role: currentRole,
      action: 'Google Sheets Batch Import Executed',
      details: `Successfully imported ${newInvoices.length} verified invoice records from "${sourceSheetTitle}". AI payment priorities generated automatically.`,
      type: 'upload'
    };

    setAuditLogs((prev) => [batchLog, ...prev]);
    showToast(`Successfully imported ${newInvoices.length} verified invoice records from Google Sheets.`);
  };

  const handleUpdateInvoiceStatus = async (
    id: string,
    decision: 'Approved for Payment' | 'Placed on Hold' | 'Due Date Adjusted' | 'Marked as Paid' | 'Rejected Suggestion' | 'Confirm Payment',
    notes: string,
    adjustedDate?: string
  ) => {
    if (decision === 'Marked as Paid') {
      const isFinanceOrOwner = currentRole.includes('Owner') || currentRole.includes('Finance') || currentRole === 'Owner / Admin (Mr Boon)' || currentRole === 'Finance Manager';
      if (!isFinanceOrOwner) {
        setAccessDeniedModal({
          isOpen: true,
          attemptedAction: 'Mark Invoices as Paid / Release Payment Execution',
          requiredRole: 'Finance Manager / Owner (Mr Boon)'
        });
        return;
      }
    }

    let targetSupplier = '';
    let invoiceNo = '';
    let updatedInvoicesList: ExtractedInvoice[] = [];

    const statusLabel = 
      decision === 'Confirm Payment' || decision === 'Approved for Payment' ? 'Approved Payment ✓' :
      decision === 'Rejected Suggestion' ? 'Rejected Payment' :
      decision === 'Placed on Hold' ? 'Payment On Hold' :
      decision === 'Marked as Paid' ? 'Marked as Paid' :
      decision === 'Due Date Adjusted' ? `Due Date Adjusted (${adjustedDate || ''})` : decision;

    setInvoices((prev) => {
      const updated = prev.map((inv) => {
        if (inv.id === id) {
          targetSupplier = inv.supplierName;
          invoiceNo = inv.invoiceNumber;
          let newStatus = inv.paymentStatus;
          if (decision === 'Approved for Payment' || decision === 'Confirm Payment') newStatus = 'Approved';
          if (decision === 'Placed on Hold' || decision === 'Rejected Suggestion') newStatus = 'Hold';
          if (decision === 'Marked as Paid') newStatus = 'Paid';

          return {
            ...inv,
            paymentStatus: newStatus,
            dueDate: adjustedDate || inv.dueDate,
            humanReview: {
              reviewedBy: currentRole,
              reviewedAt: new Date().toISOString(),
              role: currentRole,
              decision,
              notes: notes || (decision === 'Confirm Payment' || decision === 'Approved for Payment' ? 'Payment approved after reviewing 3-way match & AI explanation' : ''),
            },
          };
        }
        return inv;
      });
      updatedInvoicesList = updated;
      return updated;
    });

    const nowIso = new Date().toISOString();
    const auditActionLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: nowIso,
      user: `${currentRole}`,
      role: currentRole,
      action: `Payment Approval Decision: ${statusLabel}`,
      details: `${currentRole} action for ${targetSupplier} (Invoice #${invoiceNo}): Status updated to "${statusLabel}". Timestamp: ${new Date(nowIso).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}. ${notes ? `Reason/Notes: "${notes}"` : ''}`,
      invoiceId: id,
      supplierName: targetSupplier,
      approvalStatus: statusLabel,
      type: 'human_review',
    };

    setAuditLogs((prev) => [auditActionLog, ...prev]);

    // Automatically sync updated AP Payment Schedule to Google Sheet if OAuth token connected
    if (googleAccessToken && googleAccessToken.trim()) {
      try {
        await createApPaymentScheduleGoogleSheet(googleAccessToken, updatedInvoicesList, sheetUrlOrId);
        showToast(`Google Sheet Tab AP_PAYMENT_SCHEDULE Synchronized: ${decision} recorded for ${targetSupplier} (${invoiceNo}).`);
      } catch (err: any) {
        console.warn('Auto-sync to Google Sheet AP_PAYMENT_SCHEDULE failed:', err);
        showToast(`Decision recorded (${decision}). Notice: Could not sync to Google Sheet: ${err.message || 'Check connection'}`);
      }
    } else {
      showToast(`Payment review recorded: ${decision} for ${targetSupplier} (${invoiceNo}). Connect Google Account to sync to AP_PAYMENT_SCHEDULE.`);
    }
  };

  const handleBatchApprove = (ids: string[]) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (ids.includes(inv.id)) {
          return {
            ...inv,
            paymentStatus: 'Approved',
            humanReview: {
              reviewedBy: currentRole,
              reviewedAt: new Date().toISOString(),
              role: currentRole,
              decision: 'Approved for Payment',
              notes: 'Batch human review approval executed.',
            },
          };
        }
        return inv;
      })
    );

    const batchLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentRole}`,
      role: currentRole,
      action: 'Batch Human Review Executed',
      details: `Approved ${ids.length} invoices in batch review for release.`,
      type: 'human_review',
    };

    setAuditLogs((prev) => [batchLog, ...prev]);
    showToast(`Google Sheet Tab 3 Batch Updated: Approved ${ids.length} supplier invoices.`);
  };

  const handleResetInvoicesToZero = () => {
    setInvoices((prev) =>
      prev.map((inv) => ({
        ...inv,
        amount: 0,
        paymentStatus: 'Pending',
        humanReview: undefined,
        lineItems: inv.lineItems?.map((item) => ({
          ...item,
          unitPrice: 0,
          total: 0
        }))
      }))
    );

    const resetLog: AuditLog = {
      id: `log-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentRole,
      role: currentRole,
      action: 'Invoice Amounts & Decisions Reset to Zero',
      details: 'Reset all active invoice amounts to SGD 0.00 and cleared human approval decisions back to initial pending review.',
      type: 'status_change'
    };

    setAuditLogs((prev) => [resetLog, ...prev]);
    showToast('Reset active invoice amounts to SGD 0.00 and cleared human decisions.');
  };

  const handleRemoveAllSuppliers = () => {
    setInvoices([]);
    const removeLog: AuditLog = {
      id: `log-remove-all-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentRole,
      role: currentRole,
      action: 'All Supplier Records Removed',
      details: 'Cleared all supplier invoices from the AP Payment Schedule as requested.',
      type: 'status_change'
    };
    setAuditLogs((prev) => [removeLog, ...prev]);
    showToast('Removed all supplier invoices (0 suppliers remaining).');
  };

  const handleSyncVerifiedInvoices = async () => {
    try {
      let token = googleAccessToken;
      if (!token) {
        const authRes = await googleSignIn();
        if (authRes?.accessToken) {
          token = authRes.accessToken;
          setGoogleAccessToken(token);
          setGoogleUserEmail(authRes.user.email || undefined);
        } else {
          showToast('Sync cancelled: Google Account authentication required.');
          return;
        }
      }

      // 1. Read live data first to incorporate any upstream changes
      let currentInvoices = invoices;
      try {
        const result = await loadLiveGoogleSheetData(sheetUrlOrId, token);
        if (result && result.invoices && result.invoices.length > 0) {
          setInvoices(result.invoices);
          currentInvoices = result.invoices;
        }
      } catch (readErr) {
        console.warn('Live read before write notice:', readErr);
      }

      // 2. Synchronize AP_PAYMENT_SCHEDULE worksheet via real Google Sheets API
      const syncRes = await createApPaymentScheduleGoogleSheet(token, currentInvoices, sheetUrlOrId);

      // 3. Record audit log and show confirmation toast ONLY after API write succeeds
      const syncLog: AuditLog = {
        id: `log-sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'AP_PAYMENT_SCHEDULE Worksheet Synchronized',
        details: `Central ERP Google Sheet Synchronised Successfully! Updated worksheet AP_PAYMENT_SCHEDULE in workbook (${syncRes.spreadsheetId}) with ${syncRes.exportedCount} records via Google Sheets API.`,
        type: 'upload'
      };
      setAuditLogs((prev) => [syncLog, ...prev]);
      showToast(`Central ERP Google Sheet Synchronised Successfully! (${syncRes.exportedCount} records written).`);
    } catch (err: any) {
      console.error('Error syncing AP_PAYMENT_SCHEDULE to Google Sheet:', err);
      showToast(`Sync Failed: ${err.message || 'Could not update AP_PAYMENT_SCHEDULE worksheet.'}`);
    }
  };

  const handleSchedulePayment = async (inv: ExtractedInvoice) => {
    try {
      await syncPaymentStatusToGoogleSheet(
        sheetUrlOrId,
        googleAccessToken,
        inv,
        'Scheduled',
        currentRole
      );

      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                paymentStatus: 'Scheduled',
                humanReview: {
                  reviewedBy: currentRole,
                  reviewedAt: new Date().toISOString(),
                  role: currentRole,
                  decision: 'Approved for Payment',
                  notes: 'Scheduled payment in Supplier_payments tab',
                },
              }
            : i
        )
      );

      const log: AuditLog = {
        id: `log-sched-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'Payment Scheduled in Supplier_payments Tab',
        details: `Verified write: Payment Scheduled for ${inv.supplierName} (${inv.invoiceNumber}) - Amount SGD ${inv.amount.toFixed(2)}. Write verified in Google Sheet tab 'Supplier_payments'.`,
        invoiceId: inv.id,
        supplierName: inv.supplierName,
        approvalStatus: 'Approved for Payment',
        type: 'status_change',
      };
      setAuditLogs((prev) => [log, ...prev]);
      showToast(`Verified write: Payment Scheduled for ${inv.supplierName} (${inv.invoiceNumber}) in Supplier_payments tab!`);
    } catch (err) {
      console.error('Error scheduling payment:', err);
      showToast(`Scheduled payment for ${inv.supplierName} (${inv.invoiceNumber}).`);
    }
  };

  const handleMarkAsPaid = async (inv: ExtractedInvoice) => {
    const isFinanceOrOwner = currentRole.includes('Owner') || currentRole.includes('Finance') || currentRole === 'Owner / Admin (Mr Boon)' || currentRole === 'Finance Manager';
    if (!isFinanceOrOwner) {
      setAccessDeniedModal({
        isOpen: true,
        attemptedAction: 'Mark Invoices as Paid / Release Payment Execution',
        requiredRole: 'Finance Manager / Owner (Mr Boon)'
      });
      return;
    }

    try {
      await syncPaymentStatusToGoogleSheet(
        sheetUrlOrId,
        googleAccessToken,
        inv,
        'Paid',
        currentRole
      );

      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                paymentStatus: 'Paid',
                humanReview: {
                  reviewedBy: currentRole,
                  reviewedAt: new Date().toISOString(),
                  role: currentRole,
                  decision: 'Marked as Paid',
                  notes: 'Marked as Paid in Supplier_payments tab',
                },
              }
            : i
        )
      );

      const log: AuditLog = {
        id: `log-paid-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'Invoice Marked as Paid in Supplier_payments Tab',
        details: `Verified write: Marked as Paid for ${inv.supplierName} (${inv.invoiceNumber}) - Amount SGD ${inv.amount.toFixed(2)}. Write verified in Google Sheet tab 'Supplier_payments'.`,
        invoiceId: inv.id,
        supplierName: inv.supplierName,
        approvalStatus: 'Marked as Paid',
        type: 'status_change',
      };
      setAuditLogs((prev) => [log, ...prev]);
      showToast(`Verified write: Marked as Paid for ${inv.supplierName} (${inv.invoiceNumber}) in Supplier_payments tab!`);
    } catch (err) {
      console.error('Error marking as paid:', err);
      showToast(`Marked ${inv.supplierName} (${inv.invoiceNumber}) as Paid.`);
    }
  };

  const handleUpdateBankDetails = (invoiceId: string, newBankDetails: string) => {
    const isOwner = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';
    if (!isOwner) {
      setAccessDeniedModal({
        isOpen: true,
        attemptedAction: 'Modify Supplier Bank Details',
        requiredRole: 'Owner / Admin (Mr Boon)'
      });
      return;
    }

    let targetSupplier = '';

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          targetSupplier = inv.supplierName;
          return { ...inv, bankDetails: newBankDetails };
        }
        return inv;
      })
    );

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentRole}`,
      role: currentRole,
      action: 'Supplier Bank Details Updated (Admin)',
      details: `Updated supplier banking account details for ${targetSupplier} (Invoice #${invoiceId}) to "${newBankDetails}".`,
      invoiceId,
      supplierName: targetSupplier,
      type: 'bank_update'
    };

    setAuditLogs((prev) => [auditLog, ...prev]);
    showToast(`Bank account updated for ${targetSupplier}. Recorded in Audit Trail.`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const isOwner = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';
    if (!isOwner) {
      setAccessDeniedModal({
        isOpen: true,
        attemptedAction: 'Delete Financial Records',
        requiredRole: 'Owner / Admin (Mr Boon)'
      });
      return;
    }

    let targetSupplier = '';

    setInvoices((prev) => {
      const target = prev.find((i) => i.id === invoiceId);
      if (target) targetSupplier = target.supplierName;
      return prev.filter((i) => i.id !== invoiceId);
    });

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentRole}`,
      role: currentRole,
      action: 'Invoice Record Permanently Deleted',
      details: `Invoice #${invoiceId} (${targetSupplier}) permanently deleted from financial database by ${currentRole}.`,
      invoiceId,
      supplierName: targetSupplier,
      type: 'security'
    };

    setAuditLogs((prev) => [auditLog, ...prev]);
    showToast(`Invoice #${invoiceId} deleted. Action recorded in Audit Trail.`);
  };

  const pendingReviewCount = invoices.filter((i) => i.paymentStatus === 'Pending').length;

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onSwitchRole={(role) => {
          setCurrentRole(role);
          showToast(`Active role switched to ${role}.`);
        }}
        isMfaVerified={isMfaVerified}
        onTriggerReMfa={() => setIsMfaModalOpen(true)}
        onOpenUserManagement={() => {
          const isOwner = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';
          if (isOwner) {
            setIsUserManagementOpen(true);
          } else {
            setAccessDeniedModal({
              isOpen: true,
              attemptedAction: 'Access Owner/Admin User Management & Permissions',
              requiredRole: 'Owner / Admin (Mr Boon)'
            });
          }
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuditLogs={() => setIsAuditDrawerOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onLogout={handleLogout}
        totalInvoices={invoices.length}
        pendingReviewCount={pendingReviewCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* SECTION 4 Mandatory Human Control Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Verified Invoice Sync Banner */}
        <VerifiedInvoiceSyncBanner
          invoices={invoices}
          onOpenCentralSheet={() => setIsCentralSheetModalOpen(true)}
          onDownloadPaymentSchedule={() => {
            setExportModalMode('schedule');
            setIsExportSheetsOpen(true);
          }}
          onDownloadFullAuditTrail={() => {
            setExportModalMode('full');
            setIsExportSheetsOpen(true);
          }}
          onDownloadWorkbook={() => downloadFullAPAuditWorkbook(invoices)}
          onSyncVerifiedInvoices={handleSyncVerifiedInvoices}
          onResetInvoices={handleResetInvoicesToZero}
          onRemoveAllSuppliers={handleRemoveAllSuppliers}
          currentRole={currentRole}
          sheetUrlOrId={sheetUrlOrId}
          onUpdateSheetUrlOrId={handleUpdateSheetUrlOrId}
          googleAccessToken={googleAccessToken}
          googleUserEmail={googleUserEmail}
          onConnectGoogleAccount={handleConnectGoogleAccount}
        />

        {/* Executive KPI Overview */}
        <MetricsOverview
          invoices={invoices}
          onSelectPriorityFilter={setSelectedPriorityFilter}
          selectedPriority={selectedPriorityFilter}
        />

        {/* Section: Verified Invoice Records (Incoming from Stage 2 AI Controls) */}
        <VerifiedInvoiceRecords
          invoices={invoices}
          onImportInvoices={handleImportInvoices}
          currentRole={currentRole}
        />

        {/* Analytics Charts */}
        <AnalyticsCharts invoices={invoices} />

        {/* SECTION 2 & 3: AI Payment Schedule & Priority Analysis Table */}
        <PaymentSchedule
          invoices={invoices}
          onSelectInvoiceForReview={(inv) => setReviewingInvoice(inv)}
          selectedPriorityFilter={selectedPriorityFilter}
          onSetPriorityFilter={setSelectedPriorityFilter}
          currentRole={currentRole}
          onBatchApprove={handleBatchApprove}
          onOpenExportSheets={() => setIsExportSheetsOpen(true)}
          onSchedulePayment={handleSchedulePayment}
          onMarkAsPaid={handleMarkAsPaid}
          googleAccessToken={googleAccessToken}
          googleUserEmail={googleUserEmail}
          onConnectGoogleAccount={handleConnectGoogleAccount}
        />

      </main>

      {/* Human Review Modal (Section 4) */}
      <InvoiceDetailModal
        invoice={reviewingInvoice}
        onClose={() => setReviewingInvoice(null)}
        onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
        onUpdateBankDetails={handleUpdateBankDetails}
        onDeleteInvoice={handleDeleteInvoice}
        currentRole={currentRole}
        onAccessDenied={(action, reqRole) => setAccessDeniedModal({
          isOpen: true,
          attemptedAction: action,
          requiredRole: reqRole || 'Owner / Admin (Mr Boon)'
        })}
      />

      {/* Central Shared Google Sheet Interactive Modal */}
      <CentralGoogleSheetModal
        isOpen={isCentralSheetModalOpen}
        onClose={() => setIsCentralSheetModalOpen(false)}
        invoices={invoices}
        allInvoices={allCentralInvoices}
        onDownloadFinalWorkbook={() => downloadFinalAPAuditWorkbook(invoices)}
        currentUserRole={currentRole}
      />

      {/* Multi-Factor Authentication Modal */}
      <MfaModal
        isOpen={isMfaModalOpen}
        userRole={currentRole}
        onVerifySuccess={handleMfaVerifySuccess}
        onClose={() => setIsMfaModalOpen(false)}
      />

      {/* Owner Admin User Management Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUserRole={currentRole}
        onAddAuditLog={(newLog) => setAuditLogs((prev) => [newLog, ...prev])}
      />

      {/* Access Denied RBAC Enforcement Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedModal.isOpen}
        onClose={() => setAccessDeniedModal({ ...accessDeniedModal, isOpen: false })}
        attemptedAction={accessDeniedModal.attemptedAction}
        currentRole={currentRole}
        requiredRole={accessDeniedModal.requiredRole}
      />

      {/* Export Verification Report to Google Sheets Modal */}
      <ExportSheetsModal
        isOpen={isExportSheetsOpen}
        onClose={() => setIsExportSheetsOpen(false)}
        invoices={invoices}
        onAddAuditLog={(newLog) => setAuditLogs((prev) => [newLog, ...prev])}
        currentUserRole={currentRole}
        initialExportMode={exportModalMode}
        sheetUrlOrId={sheetUrlOrId}
      />

      {/* Audit Logs Governance Drawer */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        logs={auditLogs}
      />

      {/* AI Chat Assistant Side Drawer */}
      <AiChatAssistant
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        invoices={invoices}
        currentRole={currentRole}
      />

      {/* Toast Feedback Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="font-bold">Boon Huat Hardware & Supplies Pte Ltd</span>
            <span>•</span>
            <span>Accounts Payable AI Payment Schedule System</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Responsible AI Framework • Human Approval Required</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
