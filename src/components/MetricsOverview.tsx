import React from 'react';
import { ExtractedInvoice } from '../types';
import { AlertCircle, Clock, Percent, DollarSign, FileCheck } from 'lucide-react';

interface MetricsOverviewProps {
  invoices: ExtractedInvoice[];
  onSelectPriorityFilter: (priority: string | null) => void;
  selectedPriority: string | null;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  invoices,
  onSelectPriorityFilter,
  selectedPriority,
}) => {
  const formatSGD = (val: number) =>
    `SGD $${val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const systemToday = new Date('2026-08-09');

  // 1. Total AP Outstanding = sum of all verified invoice amounts
  const totalApOutstanding = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  // 2. High Priority Amount = sum of invoices classified as High Priority
  const highPriorityInvoices = invoices.filter((inv) => inv.priority === 'High');
  const highPriorityAmount = highPriorityInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // 3. Overdue Invoice Count = count invoices where due date is before today
  const overdueInvoices = invoices.filter((inv) => {
    if (inv.daysUntilDue !== undefined) return inv.daysUntilDue < 0;
    const due = new Date(inv.dueDate);
    return due < systemToday;
  });
  const overdueInvoiceCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // 4. Early Discount Savings = calculate only if payment terms contain discount conditions
  const discountInvoices = invoices.filter((inv) => {
    const terms = (inv.paymentTerms || '').toLowerCase();
    return terms.includes('2%') || terms.includes('discount') || terms.includes('early');
  });
  const earlyDiscountSavings = discountInvoices.reduce((sum, inv) => sum + inv.amount * 0.02, 0);

  // 5. Invoice Count = count verified invoices received from Three_Way_Matching
  const invoiceCount = invoices.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      
      {/* 1. Total AP Outstanding */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total AP Outstanding
          </span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatSGD(totalApOutstanding)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Sum of all verified invoice amounts
          </p>
        </div>
      </div>

      {/* 2. High Priority Amount */}
      <div 
        onClick={() => onSelectPriorityFilter(selectedPriority === 'High' ? null : 'High')}
        className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
          selectedPriority === 'High' 
            ? 'border-red-500 ring-2 ring-red-500/20' 
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            High Priority Amount
          </span>
          <div className="p-2 rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-red-700 dark:text-red-400">
            {formatSGD(highPriorityAmount)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {highPriorityInvoices.length} High Priority classified invoices
          </p>
        </div>
      </div>

      {/* 3. Overdue Invoice Count */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Overdue Invoice Count
          </span>
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-amber-700 dark:text-amber-400">
            {overdueInvoiceCount} {overdueInvoiceCount === 1 ? 'Invoice' : 'Invoices'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Due date before today ({formatSGD(overdueAmount)})
          </p>
        </div>
      </div>

      {/* 4. Early Discount Savings */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Early Discount Savings
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {formatSGD(earlyDiscountSavings)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {discountInvoices.length} {discountInvoices.length === 1 ? 'invoice' : 'invoices'} with discount terms
          </p>
        </div>
      </div>

      {/* 5. Invoice Count */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Invoice Count
          </span>
          <div className="p-2 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <FileCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">
            {invoiceCount} Verified Records
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            From Three_Way_Matching sheet
          </p>
        </div>
      </div>

    </div>
  );
};

