import React from 'react';
import { ShieldAlert, X, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptedAction?: string;
  currentRole: UserRole;
  requiredRole?: string;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  attemptedAction = 'perform this administrative action',
  currentRole,
  requiredRole = 'Owner / Admin (Mr Boon)'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 text-white text-center relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-3 shadow-lg">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>

          <h3 className="text-xl font-black tracking-tight">Access Denied</h3>
          <p className="text-xs text-red-100 font-medium mt-1">
            Role-Based Access Control Violation (RBAC)
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-800 dark:text-slate-200 text-xs">
          
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 space-y-2">
            <p className="text-sm font-extrabold text-red-900 dark:text-red-200 leading-snug">
              Access Denied.
            </p>
            <p className="text-xs text-red-800 dark:text-red-300 font-semibold leading-relaxed">
              Your current <span className="underline decoration-red-400 font-black">{currentRole}</span> role does not have permission to access this function (<span className="italic">{attemptedAction}</span>).
            </p>
            <p className="text-xs text-red-900 dark:text-red-200 font-bold mt-2">
              Please contact the Owner/Admin ({requiredRole}) for access changes.
            </p>
          </div>

          {/* Role Access Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Security Hierarchy Policy</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium pl-1">
              <li>• <strong>Madam Lim (AP Staff):</strong> AP Review, invoice status updates within limits, Google Sheets exports.</li>
              <li>• <strong>Mr Boon (Owner/Admin):</strong> User management, audit logs, bank updates, record deletions, security rules.</li>
              <li>• <strong>AP Supervisor:</strong> Escalated invoice review & additional approvals.</li>
              <li>• <strong>Finance Manager:</strong> Financial batch approvals & report reviews.</li>
            </ul>
          </div>

          {/* Action Close Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Acknowledge & Return to Dashboard</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
