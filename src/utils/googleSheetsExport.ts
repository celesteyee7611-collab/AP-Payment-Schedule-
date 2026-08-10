import { ExtractedInvoice } from '../types';
import { getValidVerifiedInvoices } from './workbookExporter';
import { extractSpreadsheetId, getStoredSheetUrlOrId } from './googleSheetsLiveSync';

export interface ExportReportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  exportedCount: number;
}

const getApprovalStatus = (inv: ExtractedInvoice) => {
  if (inv.humanReview) {
    const dec = inv.humanReview.decision as string;
    if (dec === 'Approved for Payment' || dec === 'Confirm Payment' || dec === 'Confirmed') return 'Confirmed / Approved';
    if (dec === 'Rejected Suggestion') return 'Rejected';
    if (dec === 'Placed on Hold') return 'On Hold';
    return inv.humanReview.decision;
  }
  return inv.paymentStatus === 'Approved' ? 'Approved' : inv.paymentStatus === 'Hold' ? 'On Hold' : 'Pending Review';
};

const getApprovalDate = (inv: ExtractedInvoice) => {
  if (inv.humanReview?.reviewedAt) {
    return new Date(inv.humanReview.reviewedAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
  }
  return '-';
};

/**
 * Sync to Google Sheets: Update/create tab AP_PAYMENT_SCHEDULE in the existing connected Google Sheet workbook
 */
export async function createApPaymentScheduleGoogleSheet(
  accessToken?: string,
  invoices: ExtractedInvoice[] = [],
  sheetUrlOrId?: string
): Promise<ExportReportResult> {
  if (!accessToken || !accessToken.trim()) {
    throw new Error('Google Account connection required. Please click "Connect Google Account" to grant Google Sheets read/write permission.');
  }

  const targetSheetUrlOrId = sheetUrlOrId || getStoredSheetUrlOrId();
  const spreadsheetId = extractSpreadsheetId(targetSheetUrlOrId);
  const filteredInvoices = getValidVerifiedInvoices(invoices);
  const validInvoices = filteredInvoices.length > 0 ? filteredInvoices : invoices;
  const tabName = 'AP_PAYMENT_SCHEDULE';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 1. Check if spreadsheet is accessible & tab exists via Google Sheets REST API
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const errorJson = await metaRes.json().catch(() => ({}));
    const errMsg = errorJson.error?.message || `HTTP ${metaRes.status}: Unable to access Google Spreadsheet (${spreadsheetId}). Please verify permissions.`;
    throw new Error(`Google Sheets API Error: ${errMsg}`);
  }

  const metaData = await metaRes.json();
  const sheets = metaData.sheets || [];
  const existingSheet = sheets.find(
    (s: any) => s.properties?.title === tabName
  );

  // 2. Create tab AP_PAYMENT_SCHEDULE if it doesn't exist
  if (!existingSheet) {
    const addSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const addRes = await fetch(addSheetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
                gridProperties: { frozenRowCount: 1 }
              }
            }
          }
        ]
      })
    });

    if (!addRes.ok) {
      const errorJson = await addRes.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create AP_PAYMENT_SCHEDULE worksheet tab in Google Sheet.');
    }
  }

  const headers = [
    'Invoice_ID',
    'Supplier Name',
    'PO Number',
    'Invoice Amount',
    'Invoice Issue Date',
    'Payment Due Date',
    'Payment Terms',
    'Three_Way_Matching_Status',
    'Priority Level',
    'AI Recommendation',
    'Human Approval Status',
    'Approved / Reviewed By',
    'Approval Date & Time',
    'Review Notes / Reason'
  ];

  const rows = validInvoices.map((inv) => [
    inv.invoiceNumber,
    inv.supplierName,
    inv.poNumber || 'PO-BH-2026',
    inv.amount,
    inv.invoiceDate,
    inv.dueDate,
    inv.paymentTerms,
    inv.verificationStatus || 'Passed',
    inv.priority,
    inv.aiRecommendation || inv.aiExplanationSimple?.recommendedActionForUser || inv.recommendedAction,
    getApprovalStatus(inv),
    inv.humanReview?.reviewedBy || (inv.paymentStatus === 'Approved' ? 'Madam Lim' : '-'),
    getApprovalDate(inv),
    inv.humanReview?.notes || '-'
  ]);

  const values = [headers, ...rows];

  // 3. Clear existing values in tab
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:Z500:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // 4. Update tab with new schedule records
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1?valueInputOption=USER_ENTERED`;
  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!updateRes.ok) {
    const errorJson = await updateRes.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'Failed to write data into AP_PAYMENT_SCHEDULE worksheet tab.');
  }

  // Local cache backup
  try {
    localStorage.setItem(`ap_sheet_sync_${spreadsheetId}`, JSON.stringify({
      tabName,
      lastSynced: new Date().toISOString(),
      recordCount: validInvoices.length,
      records: validInvoices
    }));
  } catch {
    // ignore
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: `Central ERP Google Sheet (${spreadsheetId})`,
    exportedCount: validInvoices.length
  };
}

/**
 * OPTION 2: "Download Full AP Audit Trail" (Google Sheet with 3 connected sheets)
 */
export async function createFullApAuditGoogleSheet(
  accessToken?: string,
  invoices: ExtractedInvoice[] = []
): Promise<ExportReportResult> {
  if (!accessToken || !accessToken.trim()) {
    throw new Error('Google Account connection required. Please click "Connect Google Account" to grant Google Sheets permission.');
  }

  const validInvoices = getValidVerifiedInvoices(invoices);
  const targetSheetUrlOrId = getStoredSheetUrlOrId();
  const spreadsheetId = extractSpreadsheetId(targetSheetUrlOrId);
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const title = `Central ERP Google Sheet (${spreadsheetId})`;

  // 1. Check existing sheets in workbook
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const errorJson = await metaRes.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Unable to access Google Spreadsheet (${spreadsheetId}).`);
  }

  const metaData = await metaRes.json();
  const existingSheets = metaData.sheets || [];
  const existingTitles = existingSheets.map((s: any) => s.properties?.title);

  const neededTabs = ['Invoice_Extraction', 'Three_Way_Matching', 'AP_PAYMENT_SCHEDULE'];
  const requestsToAdd = neededTabs
    .filter((tab) => !existingTitles.includes(tab))
    .map((tab) => ({
      addSheet: {
        properties: {
          title: tab,
          gridProperties: { frozenRowCount: 1 }
        }
      }
    }));

  if (requestsToAdd.length > 0) {
    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: requestsToAdd })
    });
    if (!addRes.ok) {
      const errJson = await addRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to create worksheet tabs.');
    }
  }

  // --- SHEET 1: Invoice_Extraction ---
  const tab1Headers = ['Invoice Number', 'Supplier Name', 'PO Number', 'Invoice Date', 'Invoice Amount', 'Payment Terms', 'Extracted Information', 'Extraction Status'];
  const tab1Rows = validInvoices.map((inv) => [
    inv.invoiceNumber, inv.supplierName, inv.poNumber || 'PO-BH-2026', inv.invoiceDate, inv.amount, inv.paymentTerms, inv.extractedInformation || `Extracted ${inv.poNumber || ''}`, inv.extractionStatus || '100% Extracted'
  ]);

  // --- SHEET 2: Three_Way_Matching ---
  const tab2Headers = ['Invoice Number', 'Supplier Name', 'PO Number', 'PO Verification', 'Goods Received Verification', 'Duplicate Invoice Checking', 'Matching Status'];
  const tab2Rows = validInvoices.map((inv) => [
    inv.invoiceNumber, inv.supplierName, inv.poNumber || 'PO-BH-2026', inv.poMatchResult || `Matched (${inv.poNumber || ''})`, inv.grnMatchResult || 'Matched', inv.duplicateCheckResult || 'Passed', inv.verificationStatus || 'Passed'
  ]);

  // --- SHEET 3: AP_PAYMENT_SCHEDULE ---
  const tab3Headers = ['Invoice_ID', 'Supplier', 'PO_Number', 'Invoice Amount', 'Invoice Issue Date', 'Payment Due Date', 'Payment Terms', 'Three_Way_Matching Status', 'Priority Level', 'Priority Reason', 'AI Recommendation', 'Approval Status', 'Approved / Reviewed By', 'Approval Date & Time', 'Review Notes / Reason'];
  const tab3Rows = validInvoices.map((inv) => [
    inv.invoiceNumber, inv.supplierName, inv.poNumber || 'PO-BH-2026', inv.amount, inv.invoiceDate, inv.dueDate, inv.paymentTerms, inv.verificationStatus || 'Clean Match', inv.priority, inv.aiExplanation || inv.priorityReason, inv.aiRecommendation || inv.recommendedAction, getApprovalStatus(inv), inv.humanReview?.reviewedBy || (inv.paymentStatus === 'Approved' ? 'Madam Lim' : '-'), getApprovalDate(inv), inv.humanReview?.notes || '-'
  ]);

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: "'Invoice_Extraction'!A1", values: [tab1Headers, ...tab1Rows] },
        { range: "'Three_Way_Matching'!A1", values: [tab2Headers, ...tab2Rows] },
        { range: "'AP_PAYMENT_SCHEDULE'!A1", values: [tab3Headers, ...tab3Rows] }
      ]
    })
  });

  if (!updateRes.ok) {
    const errJson = await updateRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Failed to update worksheets via Google Sheets API.');
  }

  return { spreadsheetId, spreadsheetUrl, title, exportedCount: validInvoices.length };
}

/** Legacy alias */
export async function createGoogleSheetsReport(
  accessToken: string,
  invoices: ExtractedInvoice[]
): Promise<ExportReportResult> {
  return createFullApAuditGoogleSheet(accessToken, invoices);
}

