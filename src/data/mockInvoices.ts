import { ExtractedInvoice, AuditLog } from '../types';
import { THREE_WAY_MATCHING_SHEET } from './sampleGoogleSheets';
import { calculatePriorityAnalysis } from '../utils/priorityCalculator';
import { extractAmountFromExplanation } from '../utils/googleSheetsLiveSync';

// Convert rows from Three_Way_Matching sheet to ExtractedInvoice
export const convertSheetRowToInvoice = (row: typeof THREE_WAY_MATCHING_SHEET.rows[0]): ExtractedInvoice => {
  const matchVal = (row.threeWayMatchingStatus || '').toLowerCase();
  const verifVal = (row.verificationStatus || '').toLowerCase();
  const dupVal = (row.duplicateCheckStatus || '').toLowerCase();

  const dupPassed = dupVal.includes('pass');
  const matchPassed = matchVal.includes('pass') || matchVal.includes('clean') || matchVal === 'matched';
  const verifApproved = verifVal.includes('approve');
  const isVerifiedClean = dupPassed && matchPassed && verifApproved;

  const extractedAmount = row.explanation ? extractAmountFromExplanation(row.explanation) : 0;
  const amountNum = extractedAmount > 0 ? extractedAmount : row.amountNum;

  const priorityInfo = calculatePriorityAnalysis({
    supplierName: row.supplierName,
    poNumber: row.poNumber || 'PO-BH-2026-0900',
    invoiceNumber: row.invoiceNumber,
    amount: amountNum,
    currency: 'SGD',
    dueDateStr: row.paymentDueDate,
    paymentTerms: row.paymentTerms,
    duplicateCheckResult: row.duplicateCheckStatus || 'Passed',
    threeWayMatchingResult: row.threeWayMatchingStatus || 'Passed'
  });

  return {
    id: `inv-${row.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    supplierName: row.supplierName,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: '2026-07-28',
    dueDate: row.paymentDueDate,
    amount: amountNum,
    currency: 'SGD',
    paymentTerms: row.paymentTerms,
    paymentStatus: isVerifiedClean ? 'Pending' : 'Hold',
    poNumber: row.poNumber || 'PO-BH-2026-0900',
    category: row.category || 'Verified Materials',
    poMatchResult: matchPassed ? `Matched (${row.poNumber || 'PO-BH-2026'})` : 'Mismatch (PO vs Invoice Qty Differs)',
    grnMatchResult: matchPassed ? 'Matched (GRN Received & Verified)' : 'Flagged (GRN Physical Count Discrepancy: 20 vs 50)',
    duplicateCheckResult: dupPassed ? 'Passed (No Duplicate Found)' : 'Flagged Duplicate',
    verificationStatus: row.verificationStatus || (isVerifiedClean ? 'Approved for Payment Scheduling' : 'On Hold - Discrepancy Flagged'),
    extractedInformation: 'PO, GST Reg, Line Items & Terms Verified',
    extractionStatus: '100% Extracted & Formatted',
    aiConfidence: isVerifiedClean ? 99 : 58,
    bankDetails: 'DBS Bank Ltd | A/C: 003-902188-1',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Synced from Three_Way_Matching Sheet',
    hasMajorDiscrepancy: !isVerifiedClean,
    discrepancyDetails: !isVerifiedClean
      ? 'Stage 2 Three-Way Matching Flagged: Quantity Mismatch between GRN-BH-2026-004 (20 units received) and Supplier Invoice LHSS-2026-203 (50 units billed).'
      : undefined,
    lineItems: [
      {
        description: `Stage 2 Three-Way Matched Goods - ${row.supplierName}`,
        qty: 1,
        unitPrice: row.amountNum,
        total: row.amountNum
      }
    ],
    ...priorityInfo
  };
};

// Function to retrieve ALL 3 central sheet invoices for Tab 1 & Tab 2 display
export const getAllInvoicesFromThreeWayMatchingSheet = (
  rows: typeof THREE_WAY_MATCHING_SHEET.rows = THREE_WAY_MATCHING_SHEET.rows
): ExtractedInvoice[] => {
  return rows.map(convertSheetRowToInvoice);
};

// Function to retrieve ONLY verified invoices (no major discrepancies) for Tab 3 / Stage 3 Payment Scheduling
export const getVerifiedInvoicesFromThreeWayMatchingSheet = (
  rows: typeof THREE_WAY_MATCHING_SHEET.rows = THREE_WAY_MATCHING_SHEET.rows
): ExtractedInvoice[] => {
  return rows
    .map(convertSheetRowToInvoice)
    .filter((inv) => !inv.hasMajorDiscrepancy);
};

// Initial verified invoices array starts dynamically from Three_Way_Matching sheet
export const INITIAL_INVOICES: ExtractedInvoice[] = getVerifiedInvoicesFromThreeWayMatchingSheet(THREE_WAY_MATCHING_SHEET.rows);
export const SAMPLE_VERIFIED_INVOICES: ExtractedInvoice[] = INITIAL_INVOICES;

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-09T08:30:00Z',
    user: 'Madam Lim',
    role: 'AP Staff (Madam Lim)',
    action: 'Sync Three-Way Matching Records Executed',
    details: 'Retrieved verified invoice records directly from Three_Way_Matching sheet (Duplicate Check = Passed, Three_Way_Matching_Status = Passed, Verification Status = Approved).',
    type: 'upload'
  },
  {
    id: 'log-2',
    timestamp: '2026-08-09T08:31:00Z',
    user: 'AP Priority AI Engine',
    role: 'AP Staff (Madam Lim)',
    action: 'Priority Level Classification Completed',
    details: 'Generated payment schedule priorities & plain-language AI recommendations for verified Three_Way_Matching invoices.',
    type: 'ai_extract'
  }
];
