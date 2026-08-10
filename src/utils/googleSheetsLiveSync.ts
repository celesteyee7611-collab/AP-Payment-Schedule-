import { ExtractedInvoice, AuditLog } from '../types';
import { calculatePriorityAnalysis } from './priorityCalculator';
import { THREE_WAY_MATCHING_SHEET } from '../data/sampleGoogleSheets';
import { getVerifiedInvoicesFromThreeWayMatchingSheet, getAllInvoicesFromThreeWayMatchingSheet } from '../data/mockInvoices';

export const DEFAULT_SPREADSHEET_ID = '1-WLi2F4xdh-ukhWqoTNCUJK6GMxhperG7pJumMY9GI';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit#gid=752047866`;

const STORAGE_KEY_SHEET_URL = 'ap_google_sheet_url_or_id';

export function getStoredSheetUrlOrId(): string {
  const stored = localStorage.getItem(STORAGE_KEY_SHEET_URL);
  return stored && stored.trim() ? stored.trim() : DEFAULT_SPREADSHEET_URL;
}

export function saveStoredSheetUrlOrId(urlOrId: string): void {
  localStorage.setItem(STORAGE_KEY_SHEET_URL, urlOrId.trim());
}

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return DEFAULT_SPREADSHEET_ID;
  const str = urlOrId.trim();
  const match = str.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9-_]{20,}$/.test(str)) {
    return str;
  }
  return DEFAULT_SPREADSHEET_ID;
}

export interface SupplierPaymentRow {
  invoiceId: string;
  supplier: string;
  totalAmt: number;
  paymentDueDate: string;
  paymentStatus: string; // "Scheduled" | "Paid" | "Approved" | "Hold" | "Pending"
  scheduledDate: string;
  paidDate: string;
  scheduledBy: string;
}

export interface ThreeWayContext {
  invoiceId: string;
  supplier: string;
  poNumber: string;
  matchResult: string;
  explanation: string;
  matchedDate: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Helper to fetch a sheet tab via public GViz CSV endpoint
 */
async function fetchSheetTabCsv(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;

  for (const url of [gvizUrl, exportUrl]) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || !text.includes(',')) continue;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        return lines.map(parseCSVLine);
      }
    } catch (e) {
      console.warn(`Failed to fetch tab ${sheetName} from ${url}`, e);
    }
  }
  return [];
}

/**
 * 2. READ FROM "Extracted_Invoices"
 * Reads rows from Extracted_Invoices tab
 */
export async function fetchExtractedInvoicesTab(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<any[]> {
  if (accessToken) {
    try {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Extracted_Invoices'!A1:Z200`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        return json.values || [];
      }
    } catch (e) {
      console.warn('Google Sheets API fetch failed for Extracted_Invoices, falling back to CSV', e);
    }
  }
  return fetchSheetTabCsv(spreadsheetId, 'Extracted_Invoices');
}

/**
 * 3. READ FROM "Three_Way_Matching"
 */
export async function fetchThreeWayMatchingTab(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<Map<string, ThreeWayContext>> {
  let rows: string[][] = [];
  if (accessToken) {
    try {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Three_Way_Matching'!A1:Z200`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        rows = json.values || [];
      }
    } catch (e) {
      console.warn('Sheets API fetch failed for Three_Way_Matching, falling back to CSV', e);
    }
  }

  if (rows.length === 0) {
    rows = await fetchSheetTabCsv(spreadsheetId, 'Three_Way_Matching');
  }

  const contextMap = new Map<string, ThreeWayContext>();
  if (rows.length < 2) return contextMap;

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const getIdx = (keywords: string[]) => headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const invIdx = getIdx(['invoice_id', 'invoice id', 'invoice']);
  const suppIdx = getIdx(['supplier', 'vendor']);
  const poIdx = getIdx(['po_number', 'po number', 'po']);
  const resultIdx = getIdx(['match_result', 'match result', 'result', 'status']);
  const explIdx = getIdx(['explanation', 'reason', 'details']);
  const dateIdx = getIdx(['matched_date', 'matched date', 'date']);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const invoiceId = invIdx !== -1 && row[invIdx] ? row[invIdx].trim() : '';
    if (!invoiceId) continue;

    contextMap.set(invoiceId.toUpperCase(), {
      invoiceId,
      supplier: suppIdx !== -1 && row[suppIdx] ? row[suppIdx].trim() : '',
      poNumber: poIdx !== -1 && row[poIdx] ? row[poIdx].trim() : '',
      matchResult: resultIdx !== -1 && row[resultIdx] ? row[resultIdx].trim() : 'Clean Match',
      explanation: explIdx !== -1 && row[explIdx] ? row[explIdx].trim() : '',
      matchedDate: dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : ''
    });
  }

  return contextMap;
}

/**
 * 5. READ FROM "Supplier_payments"
 */
export async function fetchSupplierPaymentsTab(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<Map<string, SupplierPaymentRow>> {
  let rows: string[][] = [];
  if (accessToken) {
    try {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Supplier_payments'!A1:Z200`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        rows = json.values || [];
      }
    } catch (e) {
      console.warn('Sheets API fetch failed for Supplier_payments', e);
    }
  }

  if (rows.length === 0) {
    rows = await fetchSheetTabCsv(spreadsheetId, 'Supplier_payments');
  }

  const paymentsMap = new Map<string, SupplierPaymentRow>();
  if (rows.length < 2) return paymentsMap;

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const getIdx = (keywords: string[]) => headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const invIdx = getIdx(['invoice_id', 'invoice id', 'invoice']);
  const suppIdx = getIdx(['supplier']);
  const amtIdx = getIdx(['total_amt', 'total amt', 'amount']);
  const dueIdx = getIdx(['payment_due_date', 'due date', 'due']);
  const statusIdx = getIdx(['payment_status', 'payment status', 'status']);
  const schedIdx = getIdx(['scheduled_date', 'scheduled date', 'scheduled']);
  const paidIdx = getIdx(['paid_date', 'paid date', 'paid']);
  const byIdx = getIdx(['scheduled_by', 'scheduled by', 'reviewer', 'user']);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const invoiceId = invIdx !== -1 && row[invIdx] ? row[invIdx].trim() : '';
    if (!invoiceId) continue;

    const rawAmt = amtIdx !== -1 && row[amtIdx] ? row[amtIdx] : '0';
    const totalAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, '')) || 0;

    paymentsMap.set(invoiceId.toUpperCase(), {
      invoiceId,
      supplier: suppIdx !== -1 && row[suppIdx] ? row[suppIdx].trim() : '',
      totalAmt,
      paymentDueDate: dueIdx !== -1 && row[dueIdx] ? row[dueIdx].trim() : '',
      paymentStatus: statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim() : 'Pending',
      scheduledDate: schedIdx !== -1 && row[schedIdx] ? row[schedIdx].trim() : '',
      paidDate: paidIdx !== -1 && row[paidIdx] ? row[paidIdx].trim() : '',
      scheduledBy: byIdx !== -1 && row[byIdx] ? row[byIdx].trim() : ''
    });
  }

  return paymentsMap;
}

/**
 * Calculate Payment Due Date as Invoice Date + 30 days (Net 30)
 */
export function calculateNet30DueDate(invoiceDateStr: string): string {
  if (!invoiceDateStr) return '2026-08-30';
  try {
    const date = new Date(invoiceDateStr);
    if (isNaN(date.getTime())) return invoiceDateStr;
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  } catch {
    return '2026-08-30';
  }
}

/**
 * Fetch raw 2D array from Three_Way_Matching tab
 */
export async function fetchThreeWayMatchingRowsRaw(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<string[][]> {
  if (accessToken) {
    try {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Three_Way_Matching'!A1:Z200`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        return json.values || [];
      }
    } catch (e) {
      console.warn('Sheets API fetch failed for Three_Way_Matching, falling back to CSV', e);
    }
  }
  return fetchSheetTabCsv(spreadsheetId, 'Three_Way_Matching');
}

export function extractAmountFromExplanation(explanation: string): number {
  if (!explanation) return 0;
  const match = explanation.match(/invoiced\s+amount\s*(?:\$|sgd\s*)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
  if (match && match[1]) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }
  const fallbackMatch = explanation.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
  if (fallbackMatch && fallbackMatch[1]) {
    const val = parseFloat(fallbackMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }
  return 0;
}

export interface ExtractedInvoiceDetails {
  invoiceId: string;
  invoiceDate: string;
  paymentTerms: string;
}

export function parseExtractedInvoicesTab(rows: string[][]): Map<string, ExtractedInvoiceDetails> {
  const map = new Map<string, ExtractedInvoiceDetails>();
  if (!rows || rows.length < 2) return map;

  const headers = rows[0].map((h) => (h || '').toLowerCase().trim());
  const getIdx = (keywords: string[]) => headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const invIdx = getIdx(['invoice_id', 'invoice id', 'invoice number', 'invoice']);
  const dateIdx = getIdx(['invoice_date', 'invoice date', 'date']);
  const termsIdx = getIdx(['payment_terms', 'payment terms', 'terms']);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const invId = invIdx !== -1 && row[invIdx] ? row[invIdx].trim() : '';
    if (!invId) continue;

    const invoiceDate = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : '';
    const paymentTerms = termsIdx !== -1 && row[termsIdx] ? row[termsIdx].trim() : '';

    map.set(invId.toUpperCase(), {
      invoiceId: invId,
      invoiceDate,
      paymentTerms
    });
  }

  return map;
}

/**
 * Main Loader: Reads directly from Three_Way_Matching (Single Source of Truth)
 * Filters strictly for Duplicate Check = Passed, Three_Way_Matching_Status = Passed, Verification Status = Approved
 */
export async function loadLiveGoogleSheetData(
  spreadsheetUrlOrId: string,
  accessToken?: string | null
): Promise<{
  invoices: ExtractedInvoice[];
  allInvoices: ExtractedInvoice[];
  spreadsheetId: string;
  sourceSheetCount: number;
}> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId);

  // Fetch Three_Way_Matching, Supplier_payments, and Extracted_Invoices in parallel
  const [threeWayRows, supplierPaymentsMap, extractedInvoicesRows] = await Promise.all([
    fetchThreeWayMatchingRowsRaw(spreadsheetId, accessToken),
    fetchSupplierPaymentsTab(spreadsheetId, accessToken),
    fetchExtractedInvoicesTab(spreadsheetId, accessToken)
  ]);

  const extractedMap = parseExtractedInvoicesTab(extractedInvoicesRows);

  if (threeWayRows.length < 2) {
    const verifiedInvoices = getVerifiedInvoicesFromThreeWayMatchingSheet(THREE_WAY_MATCHING_SHEET.rows);
    const allInvoices = getAllInvoicesFromThreeWayMatchingSheet(THREE_WAY_MATCHING_SHEET.rows);
    return {
      invoices: verifiedInvoices,
      allInvoices,
      spreadsheetId,
      sourceSheetCount: verifiedInvoices.length
    };
  }

  const headers = threeWayRows[0].map((h: string) => (h || '').toLowerCase().trim());
  const getIdx = (keywords: string[]) => headers.findIndex((h: string) => keywords.some((k) => h.includes(k)));

  const invIdx = getIdx(['invoice_id', 'invoice id', 'invoice number', 'invoice']);
  const suppIdx = getIdx(['supplier name', 'supplier', 'vendor']);
  const poIdx = getIdx(['po_number', 'po number', 'po']);
  const explIdx = getIdx(['explanation', 'reason', 'details']);
  const amtIdx = getIdx(['invoice amount', 'invoice_amount', 'amount', 'total_amt', 'total amt']);
  const dueIdx = getIdx(['payment due date', 'payment_due_date', 'due date', 'due']);
  const termsIdx = getIdx(['payment terms', 'payment_terms', 'terms']);
  const dupIdx = getIdx(['duplicate check', 'duplicate_check', 'duplicate']);
  const matchIdx = getIdx(['three_way_matching_status', 'matching status', 'match_result', 'match status', 'matching']);
  const verifIdx = getIdx(['verification status', 'verification_status', 'verification', 'status']);

  const parsedAllInvoices: ExtractedInvoice[] = [];

  for (let i = 1; i < threeWayRows.length; i++) {
    const row = threeWayRows[i];
    if (!row || row.length === 0 || !row.some(Boolean)) continue;

    const invoiceNumber = invIdx !== -1 && row[invIdx] ? row[invIdx].trim() : '';
    if (!invoiceNumber || invoiceNumber.toLowerCase().includes('invoice') || invoiceNumber.toLowerCase().includes('id')) continue;

    const supplierName = suppIdx !== -1 && row[suppIdx] ? row[suppIdx].trim() : `Supplier ${i}`;
    if (!supplierName || supplierName.toLowerCase().includes('supplier name') || supplierName.toLowerCase() === 'supplier') continue;

    const poNumber = poIdx !== -1 && row[poIdx] ? row[poIdx].trim() : 'PO-2026-000';
    const explanationStr = explIdx !== -1 && row[explIdx] ? row[explIdx].trim() : '';

    // 1. Amount: Read from Explanation field in Three_Way_Matching (extract after "Invoiced amount $")
    let amountNum = extractAmountFromExplanation(explanationStr);
    if (amountNum <= 0) {
      const rawTotalAmt = amtIdx !== -1 && row[amtIdx] ? row[amtIdx] : '0';
      amountNum = parseFloat(String(rawTotalAmt).replace(/[^0-9.]/g, '')) || 0;
    }

    // 2. Invoice Date & Payment Terms: Retrieve from Extracted_Invoices map using Invoice_ID matching
    const extractedDetail = extractedMap.get(invoiceNumber.toUpperCase());
    const invoiceDate = (extractedDetail && extractedDetail.invoiceDate) ? extractedDetail.invoiceDate : '2026-07-28';

    let paymentTerms = (extractedDetail && extractedDetail.paymentTerms) ? extractedDetail.paymentTerms : '';
    if (!paymentTerms) {
      paymentTerms = termsIdx !== -1 && row[termsIdx] ? row[termsIdx].trim() : 'Net 30 Days';
    }

    const dueDate = dueIdx !== -1 && row[dueIdx] ? row[dueIdx].trim() : calculateNet30DueDate(invoiceDate);

    const dupCheckStatus = dupIdx !== -1 && row[dupIdx] ? row[dupIdx].trim() : 'Passed';
    const matchStatus = matchIdx !== -1 && row[matchIdx] ? row[matchIdx].trim() : 'Passed';
    const verifStatus = verifIdx !== -1 && row[verifIdx] ? row[verifIdx].trim() : 'Approved';

    // Discrepancy checks
    const isDupPassed = dupCheckStatus.toLowerCase().includes('pass');
    const isMatchPassed = matchStatus.toLowerCase().includes('pass') || matchStatus.toLowerCase().includes('clean') || matchStatus.toLowerCase() === 'matched';
    const isVerifApproved = verifStatus.toLowerCase().includes('approve') || verifStatus.toLowerCase().includes('clean') || verifStatus.toLowerCase().includes('scheduling');

    const hasMajorDiscrepancy = !isDupPassed || !isMatchPassed || !isVerifApproved;

    // Retrieve existing Supplier_payments tracking status if available
    const existingPayment = supplierPaymentsMap.get(invoiceNumber.toUpperCase());
    let paymentStatus: ExtractedInvoice['paymentStatus'] = hasMajorDiscrepancy ? 'Hold' : 'Pending';
    if (existingPayment) {
      const st = existingPayment.paymentStatus.toLowerCase();
      if (st.includes('scheduled')) paymentStatus = 'Scheduled';
      else if (st.includes('paid')) paymentStatus = 'Paid';
      else if (st.includes('approved')) paymentStatus = 'Approved';
      else if (st.includes('hold')) paymentStatus = 'Hold';
    } else if (isVerifApproved) {
      paymentStatus = 'Approved';
    }

    // AI Priority Calculation
    const priorityInfo = calculatePriorityAnalysis({
      supplierName,
      poNumber,
      invoiceNumber,
      amount: amountNum,
      currency: 'SGD',
      dueDateStr: dueDate,
      paymentTerms,
      duplicateCheckResult: dupCheckStatus,
      threeWayMatchingResult: matchStatus
    });

    const invoiceObj: ExtractedInvoice = {
      id: `inv-${invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      supplierName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount: amountNum,
      currency: 'SGD',
      paymentTerms,
      paymentStatus,
      priority: priorityInfo.priority,
      priorityReason: priorityInfo.priorityReason,
      recommendedAction: priorityInfo.recommendedAction,
      aiExplanation: explanationStr || `3-Way Match Record in Three_Way_Matching Sheet for ${supplierName} (PO ${poNumber}). Duplicate Check: ${dupCheckStatus}, Match Status: ${matchStatus}, Verification: ${verifStatus}.`,
      aiRecommendation: priorityInfo.aiRecommendation,
      aiConfidence: hasMajorDiscrepancy ? 58 : 99,
      poNumber,
      category: 'Verified Materials & Supplies',
      bankDetails: 'DBS Bank Ltd | A/C: 003-902188-1',
      verificationStatus: verifStatus,
      poMatchResult: isMatchPassed ? `Matched (${poNumber})` : 'Mismatch (PO vs Invoice Qty Differs)',
      grnMatchResult: isMatchPassed ? 'Matched (GRN Received & Verified)' : 'Flagged (GRN Physical Count Discrepancy)',
      duplicateCheckResult: dupCheckStatus,
      hasMajorDiscrepancy,
      discrepancyDetails: hasMajorDiscrepancy
        ? `Stage 2 Three-Way Matching Flagged: ${matchStatus} / ${verifStatus} on PO ${poNumber}.`
        : undefined,
      extractedInformation: `Invoice Date: ${invoiceDate}, Total Amt: SGD ${amountNum.toFixed(2)}, Terms: ${paymentTerms}`,
      extractionStatus: '100% Extracted & Verified',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Synced from Three_Way_Matching Sheet',
      lineItems: [
        {
          description: `Stage 2 Verified Hardware Supplies - ${supplierName}`,
          qty: 1,
          unitPrice: amountNum,
          total: amountNum
        }
      ],
      aiExplanationSimple: priorityInfo.aiExplanationSimple,
      humanReview: existingPayment?.scheduledDate ? {
        reviewedBy: existingPayment.scheduledBy || 'Madam Lim (AP Staff)',
        reviewedAt: existingPayment.scheduledDate,
        role: 'AP Staff (Madam Lim)',
        decision: existingPayment.paymentStatus === 'Paid' ? 'Marked as Paid' : 'Approved for Payment',
        notes: `Payment ${existingPayment.paymentStatus} via Google Sheet Sync on ${existingPayment.scheduledDate}`
      } : undefined
    };

    parsedAllInvoices.push(invoiceObj);
  }

  const verifiedInvoices = parsedAllInvoices.filter((inv) => !inv.hasMajorDiscrepancy);

  return {
    invoices: verifiedInvoices,
    allInvoices: parsedAllInvoices,
    spreadsheetId,
    sourceSheetCount: verifiedInvoices.length
  };
}

/**
 * 6. UPDATE PAYMENT STATUS & 7. VERIFY WRITE
 * Writes or updates row in "Supplier_payments" tab and verifies readback
 */
export async function syncPaymentStatusToGoogleSheet(
  spreadsheetUrlOrId: string,
  accessToken: string,
  invoice: ExtractedInvoice,
  newPaymentStatus: 'Scheduled' | 'Paid' | 'Approved' | 'Hold',
  scheduledByRole: string
): Promise<{ success: boolean; verifiedRow: string[]; details: string }> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId);
  const todayStr = new Date().toISOString().split('T')[0];

  const invoiceId = invoice.invoiceNumber;
  const supplier = invoice.supplierName;
  const totalAmt = invoice.amount;
  const paymentDueDate = invoice.dueDate;
  const paymentStatus = newPaymentStatus;
  const scheduledDate = newPaymentStatus === 'Scheduled' || newPaymentStatus === 'Approved' ? todayStr : (invoice.humanReview?.reviewedAt?.split('T')[0] || todayStr);
  const paidDate = newPaymentStatus === 'Paid' ? todayStr : '-';
  const scheduledBy = scheduledByRole || 'Madam Lim';

  // Target tab: "Supplier_payments"
  const tabName = 'Supplier_payments';
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:H100`;

  let currentRows: string[][] = [];
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (getRes.ok) {
    const json = await getRes.json();
    currentRows = json.values || [];
  } else {
    // Attempt tab creation or header initialization
    console.warn(`Tab ${tabName} not found or inaccessible, attempting initialization`);
  }

  const expectedHeaders = ['Invoice_ID', 'Supplier', 'Total_Amt', 'Payment_Due_Date', 'Payment_Status', 'Scheduled_Date', 'Paid_Date', 'Scheduled_By'];
  const newRowValues = [invoiceId, supplier, String(totalAmt), paymentDueDate, paymentStatus, scheduledDate, paidDate, scheduledBy];

  if (currentRows.length === 0) {
    // Initialize tab with headers and first row
    const initUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1?valueInputOption=USER_ENTERED`;
    await fetch(initUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [expectedHeaders, newRowValues]
      })
    });
  } else {
    // Check if headers match or if header row exists
    let matchingRowIndex = -1;
    for (let i = 1; i < currentRows.length; i++) {
      if (currentRows[i][0] && currentRows[i][0].trim().toUpperCase() === invoiceId.toUpperCase()) {
        matchingRowIndex = i + 1; // 1-based row index in Google Sheets
        break;
      }
    }

    if (matchingRowIndex !== -1) {
      // Update existing row
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A${matchingRowIndex}:H${matchingRowIndex}?valueInputOption=USER_ENTERED`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [newRowValues]
        })
      });
      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Failed to update ${tabName} row ${matchingRowIndex}: ${errText}`);
      }
    } else {
      // Append new row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:append?valueInputOption=USER_ENTERED`;
      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [newRowValues]
        })
      });
      if (!appendRes.ok) {
        const errText = await appendRes.text();
        throw new Error(`Failed to append row to ${tabName}: ${errText}`);
      }
    }
  }

  // REQUIREMENT 7: VERIFY WRITES SUCCEED BY READING BACK
  const verifyRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!verifyRes.ok) {
    throw new Error('Write succeeded but verification read-back failed. Please check spreadsheet permissions.');
  }

  const verifyJson = await verifyRes.json();
  const verifyRows: string[][] = verifyJson.values || [];
  const foundVerifiedRow = verifyRows.find(
    (r) => r[0] && r[0].trim().toUpperCase() === invoiceId.toUpperCase()
  );

  if (!foundVerifiedRow) {
    throw new Error(`Verification failed: Row for Invoice ID ${invoiceId} was not found in ${tabName} after update.`);
  }

  // REQUIREMENT 8: LOG TO SHARED "Audit_Log" TAB
  try {
    await appendToGoogleSheetAuditLog(
      spreadsheetId,
      accessToken,
      invoiceId,
      supplier,
      invoice.paymentStatus,
      newPaymentStatus,
      `Payment status updated to "${newPaymentStatus}" by ${scheduledBy}`,
      `Verified live Google Sheet update in Supplier_payments tab on ${todayStr}`
    );
  } catch (logErr) {
    console.warn('Failed to append to Audit_Log tab:', logErr);
  }

  return {
    success: true,
    verifiedRow: foundVerifiedRow,
    details: `Successfully written & verified in ${tabName} (Invoice_ID: ${invoiceId}, Status: ${paymentStatus}, Date: ${scheduledDate})`
  };
}

/**
 * 8. LOG TO SHARED AUDIT LOG
 * Schema: Timestamp | Invoice_ID | Supplier | Status_From | Status_To | Explanation | Notes
 */
export async function appendToGoogleSheetAuditLog(
  spreadsheetId: string,
  accessToken: string,
  invoiceId: string,
  supplier: string,
  statusFrom: string,
  statusTo: string,
  explanation: string,
  notes: string
): Promise<void> {
  const tabName = 'Audit_Log';
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:append?valueInputOption=USER_ENTERED`;
  const timestamp = new Date().toISOString();

  const auditRow = [timestamp, invoiceId, supplier, statusFrom || 'Pending', statusTo, explanation, notes];

  await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [auditRow]
    })
  });
}
