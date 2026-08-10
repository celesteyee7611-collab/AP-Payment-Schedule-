import React from 'react';
import { ShieldCheck, HeartHandshake, UserCheck, AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 p-5 rounded-2xl shadow-xs mb-6 transition-colors duration-200 space-y-3">
      
      {/* Primary Mandated Banner Text */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-blue-600 text-white dark:bg-blue-500 shadow-md shadow-blue-500/20 shrink-0">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                Accounts Payable Human Review & AI Recommendation Governance
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Human Control Preserved
              </span>
            </div>
            <p className="mt-1.5 text-xs text-blue-950 dark:text-blue-100 font-bold leading-relaxed bg-white/70 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800">
              "AI provides payment monitoring, priority analysis and recommendations only. Final payment approval remains with authorised Accounts Payable staff."
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Boon Huat AP Governance</span>
        </div>
      </div>

      {/* Strict Limits & Role Clarification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-blue-200/60 dark:border-slate-800">
        <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>The AI must NOT:</strong> Automatically approve payments, automatically transfer money, or replace Madam Lim's professional judgement.
          </p>
        </div>
        <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>AI Purpose:</strong> Assists Madam Lim by reducing repetitive tracking work while allowing her to focus on supplier relationships and resolving disputes.
          </p>
        </div>
      </div>

    </div>
  );
};


