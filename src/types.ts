export type PriorityLevel = 'High' | 'Medium' | 'Low';

export type PaymentStatus = 'Pending' | 'Scheduled' | 'Approved' | 'Hold' | 'Paid';

export type UserRole = 'AP Staff (Madam Lim)' | 'Owner / Admin (Mr Boon)' | 'AP Supervisor' | 'Finance Manager';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  status: 'Active' | 'Suspended';
  lastActive: string;
  permissions: {
    canReviewInvoices: boolean;
    canApproveReject: boolean;
    canEditBankDetails: boolean;
    canDeleteRecords: boolean;
    canAccessUserManagement: boolean;
    canAccessAuditLogs: boolean;
  };
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface AiExplanationSimple {
  whyPrioritised: string;
  riskIfDelayed: string;
  recommendedActionForUser: string;
}

export interface ExtractedInvoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  paymentTerms: string; // e.g. "Net 30", "Net 14", "COD", "2% 10 Net 30"
  paymentStatus: PaymentStatus;
  
  // AI calculated fields
  priority: PriorityLevel;
  priorityReason: string;
  recommendedAction: string;
  aiExplanation?: string;
  aiRecommendation?: string;
  aiConfidence: number; // Percentage e.g. 96
  daysUntilDue?: number;
  aiExplanationSimple?: AiExplanationSimple;
  
  // Additional details
  poNumber?: string;
  bankDetails?: string;
  category?: string; // e.g., "Steel & Raw Metals", "Tools & Equipment", "Fasteners", "Safety Gear"
  lineItems?: InvoiceLineItem[];
  notes?: string;
  
  // Metadata & Verification Info (Stage 1 & 2 Pipeline Data)
  hasMajorDiscrepancy?: boolean;
  discrepancyDetails?: string;
  verificationStatus?: string; // e.g. "Approved for Payment Scheduling"
  poMatchResult?: string; // e.g. "Matched (PO-BH-2026-0412)"
  grnMatchResult?: string; // e.g. "Matched (GRN-BH-2026-0811)"
  duplicateCheckResult?: string; // e.g. "Passed (No Duplicate Record Found)"
  extractedInformation?: string; // e.g. "Extracted PO-0412, GST Reg #, Line Items, Net 30 Terms"
  extractionStatus?: string; // e.g. "100% Extracted & Verified"
  uploadedAt: string;
  uploadedBy?: string;
  fileName?: string;
  fileType?: string;
  fileDataUrl?: string; // Preview image or PDF base64 string
  
  // Human Review Audit
  humanReview?: {
    reviewedBy: string;
    reviewedAt: string;
    role: UserRole;
    decision: 'Approved for Payment' | 'Placed on Hold' | 'Due Date Adjusted' | 'Marked as Paid' | 'Rejected Suggestion' | 'Confirm Payment';
    notes?: string;
  };
}

export interface Tab1ExtractionRecord {
  invoiceNumber: string;
  supplierName: string;
  invoiceAmount: number;
  invoiceDate: string;
  extractedInformation: string;
  extractionStatus: string;
}

export interface Tab2ThreeWayMatchRecord {
  invoiceNumber: string;
  poMatchResult: string;
  grnMatchResult: string;
  duplicateCheckResult: string;
  verificationStatus: string;
}

export interface Tab3PaymentScheduleRecord {
  invoiceNumber: string;
  supplierName: string;
  invoiceAmount: number;
  paymentDueDate: string;
  paymentTerms: string;
  priorityLevel: PriorityLevel;
  aiExplanation: string;
  aiRecommendation: string;
  humanApprovalStatus: string;
  approvedBy: string;
  approvalDateAndTime: string;
  reviewComments?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  invoiceId?: string;
  supplierName?: string;
  approvalStatus?: string;
  ipAddress?: string;
  sessionId?: string;
  type: 'upload' | 'ai_extract' | 'human_review' | 'status_change' | 'export' | 'security' | 'bank_update';
}

export interface SampleInvoicePreset {
  title: string;
  subtitle: string;
  fileName: string;
  fileType: string;
  dataUrl?: string;
  rawText: string;
}
