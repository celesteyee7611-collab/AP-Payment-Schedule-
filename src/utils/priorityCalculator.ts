import { PriorityLevel, AiExplanationSimple } from '../types';

export interface PriorityAnalysis {
  priority: PriorityLevel;
  daysUntilDue: number;
  priorityReason: string;
  recommendedAction: string;
  aiExplanation: string;
  aiRecommendation: string;
  aiExplanationSimple: AiExplanationSimple;
}

export interface PriorityInput {
  supplierName: string;
  poNumber?: string;
  invoiceNumber?: string;
  amount: number;
  currency?: string;
  dueDateStr: string;
  paymentTerms?: string;
  duplicateCheckResult?: string;
  threeWayMatchingResult?: string;
}

/**
 * Calculates payment priority level based on strict Accounts Payable rules for Boon Huat Hardware:
 * Uses fields: Supplier Name, PO Number, Invoice Number, Invoice Amount, Payment Due Date, Payment Terms, Duplicate Check Result, Three Way Matching Result
 * 
 * 1. Priority Level
 * - High Priority: Invoice overdue, due within 7 days, supplier credit terms at risk, early payment discount opportunity
 * - Medium Priority: Due within 8-30 days
 * - Low Priority: Due after 30 days
 * 
 * 2. AI Explanation: Plain-language explanation for Mr Boon
 * 3. Recommended Action: Action for Madam Lim (AI only recommends, final approval remains with Madam Lim)
 */
export function calculatePriorityAnalysis(
  dueDateStrOrInput: string | PriorityInput,
  supplierNameParam?: string,
  amountParam?: number,
  currencyParam: string = 'SGD',
  paymentTermsParam: string = 'Net 30 Days',
  poNumberParam?: string,
  invoiceNumberParam?: string,
  duplicateCheckResultParam?: string,
  threeWayMatchingResultParam?: string
): PriorityAnalysis {
  let supplierName: string;
  let poNumber: string;
  let invoiceNumber: string;
  let amount: number;
  let currency: string;
  let dueDateStr: string;
  let paymentTerms: string;
  let duplicateCheckResult: string;
  let threeWayMatchingResult: string;

  if (typeof dueDateStrOrInput === 'object' && dueDateStrOrInput !== null) {
    supplierName = dueDateStrOrInput.supplierName || 'Supplier';
    poNumber = dueDateStrOrInput.poNumber || 'PO-BH-2026';
    invoiceNumber = dueDateStrOrInput.invoiceNumber || 'INV-001';
    amount = dueDateStrOrInput.amount || 0;
    currency = dueDateStrOrInput.currency || 'SGD';
    dueDateStr = dueDateStrOrInput.dueDateStr || '2026-08-25';
    paymentTerms = dueDateStrOrInput.paymentTerms || 'Net 30 Days';
    duplicateCheckResult = dueDateStrOrInput.duplicateCheckResult || 'Passed';
    threeWayMatchingResult = dueDateStrOrInput.threeWayMatchingResult || 'Passed';
  } else {
    dueDateStr = typeof dueDateStrOrInput === 'string' ? dueDateStrOrInput : '2026-08-25';
    supplierName = supplierNameParam || 'Supplier';
    amount = amountParam || 0;
    currency = currencyParam;
    paymentTerms = paymentTermsParam;
    poNumber = poNumberParam || 'PO-BH-2026';
    invoiceNumber = invoiceNumberParam || 'INV-001';
    duplicateCheckResult = duplicateCheckResultParam || 'Passed';
    threeWayMatchingResult = threeWayMatchingResultParam || 'Passed';
  }

  // System reference date for current operations
  const referenceDate = new Date('2026-08-09');
  const due = new Date(dueDateStr);
  
  // Calculate difference in days
  const diffTime = due.getTime() - referenceDate.getTime();
  const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedAmount = `${currency} $${amount.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hasDiscount = paymentTerms.toLowerCase().includes('2%') || paymentTerms.toLowerCase().includes('discount');

  let priority: PriorityLevel;
  let priorityReason = '';
  let recommendedAction = '';
  let aiExplanation = '';
  let aiRecommendation = '';
  let whyPrioritised = '';
  let riskIfDelayed = '';
  let recommendedActionForUser = '';

  // Standard recommendation base requiring Madam Lim's review
  const baseMadamLimAction = "Madam Lim should review and approve payment after confirming available funds.";

  if (daysUntilDue < 0) {
    priority = 'High';
    const overdueDays = Math.abs(daysUntilDue);
    priorityReason = `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''} (Due date: ${dueDateStr}). Supplier credit terms at risk.`;
    
    // Exact requested format for Mr Boon
    aiExplanation = `High Priority because invoice ${invoiceNumber} is overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''} and delaying payment may affect supplier credit terms.`;
    aiRecommendation = baseMadamLimAction;

    whyPrioritised = `High Priority because invoice ${invoiceNumber} from ${supplierName} (${formattedAmount}) is overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''} (due ${dueDateStr}). Verified in PO ${poNumber} (Duplicate Check: ${duplicateCheckResult}, 3-Way Match: ${threeWayMatchingResult}).`;
    riskIfDelayed = `Delaying payment past the overdue date affects credit terms with ${supplierName} and may trigger late charges or order holds.`;
    recommendedActionForUser = baseMadamLimAction;
    recommendedAction = baseMadamLimAction;

  } else if (daysUntilDue <= 7) {
    priority = 'High';
    if (hasDiscount) {
      priorityReason = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} (${dueDateStr}). Early payment discount opportunity available under ${paymentTerms}.`;
      aiExplanation = `High Priority because invoice ${invoiceNumber} offers an early payment discount under ${paymentTerms} terms if paid before ${dueDateStr}.`;
      aiRecommendation = `Madam Lim should review and approve payment early after confirming available funds to capture early payment discount.`;

      whyPrioritised = `High Priority because invoice ${invoiceNumber} from ${supplierName} (${formattedAmount}) offers an early payment discount opportunity under ${paymentTerms} if paid before ${dueDateStr}.`;
      riskIfDelayed = `Delaying past the discount cutoff forfeits cash savings for Boon Huat Hardware.`;
      recommendedActionForUser = `Madam Lim should review and approve payment early after confirming available funds to capture early payment discount.`;
      recommendedAction = `Madam Lim should review and approve payment early after confirming available funds to capture early payment discount.`;
    } else {
      const daysText = daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;
      priorityReason = `Due ${daysText} (${dueDateStr}). Supplier credit terms at risk if delayed.`;
      aiExplanation = `High Priority because invoice ${invoiceNumber} is due ${daysText} on ${dueDateStr} and delaying payment may affect supplier credit terms.`;
      aiRecommendation = baseMadamLimAction;

      whyPrioritised = `High Priority because invoice ${invoiceNumber} from ${supplierName} (${formattedAmount}) is due ${daysText} on ${dueDateStr}. Verified under PO ${poNumber} (3-Way Match: ${threeWayMatchingResult}).`;
      riskIfDelayed = `Delaying payment risks missing the agreed credit window with ${supplierName} and affecting supplier credit terms.`;
      recommendedActionForUser = baseMadamLimAction;
      recommendedAction = baseMadamLimAction;
    }
  } else if (daysUntilDue <= 30) {
    priority = 'Medium';
    priorityReason = `Due in ${daysUntilDue} days (${dueDateStr}). Standard credit terms (${paymentTerms}).`;
    aiExplanation = `Medium Priority because invoice ${invoiceNumber} is due in ${daysUntilDue} days on ${dueDateStr} under standard ${paymentTerms} credit terms.`;
    aiRecommendation = baseMadamLimAction;

    whyPrioritised = `Medium Priority because invoice ${invoiceNumber} from ${supplierName} (${formattedAmount}) is due in ${daysUntilDue} days on ${dueDateStr} under ${paymentTerms} terms.`;
    riskIfDelayed = `No immediate risk today. Ample processing time available before the ${dueDateStr} payment deadline.`;
    recommendedActionForUser = baseMadamLimAction;
    recommendedAction = baseMadamLimAction;
  } else {
    priority = 'Low';
    priorityReason = `Due in ${daysUntilDue} days (${dueDateStr}). Extended credit terms (${paymentTerms}).`;
    aiExplanation = `Low Priority because invoice ${invoiceNumber} is due in ${daysUntilDue} days on ${dueDateStr}. Extended credit terms available.`;
    aiRecommendation = `Madam Lim should review and queue payment after confirming available funds closer to the due date.`;

    whyPrioritised = `Low Priority because invoice ${invoiceNumber} from ${supplierName} (${formattedAmount}) has extended credit terms (${paymentTerms}) and is due in ${daysUntilDue} days (${dueDateStr}).`;
    riskIfDelayed = `No risk at present. Holding payment until closer to the due date preserves working capital.`;
    recommendedActionForUser = `Madam Lim should review and queue payment after confirming available funds closer to the due date.`;
    recommendedAction = `Madam Lim should review and queue payment after confirming available funds closer to the due date.`;
  }

  return {
    priority,
    daysUntilDue,
    priorityReason,
    recommendedAction,
    aiExplanation,
    aiRecommendation,
    aiExplanationSimple: {
      whyPrioritised,
      riskIfDelayed,
      recommendedActionForUser
    }
  };
}


