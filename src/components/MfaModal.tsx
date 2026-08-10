import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, Lock, Smartphone, KeyRound, CheckCircle2, AlertCircle, Sparkles, UserCheck, ShieldAlert, FileText, BarChart3, Users, History, Info, X } from 'lucide-react';

interface MfaModalProps {
  isOpen: boolean;
  userRole: UserRole;
  onVerifySuccess: (role: UserRole) => void;
  onClose?: () => void;
}

export const MfaModal: React.FC<MfaModalProps> = ({
  isOpen,
  userRole,
  onVerifySuccess,
  onClose
}) => {
  if (!isOpen) return null;

  // Default to Madam Lim (AP Staff / AP Reviewer) as the primary user
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || 'AP Staff (Madam Lim)');
  const [otpCode, setOtpCode] = useState('');
  const [method, setMethod] = useState<'sms' | 'totp'>('sms');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (userRole) {
      setSelectedRole(userRole);
    }
  }, [userRole]);

  const isMadamLim = selectedRole.includes('Madam Lim') || selectedRole === 'AP Staff (Madam Lim)' || selectedRole === 'AP Supervisor';
  const userName = isMadamLim ? 'Madam Lim' : 'Mr Boon';
  const userTitle = isMadamLim ? 'Accounts Payable Officer' : 'Owner & Managing Director';
  const roleBadgeText = isMadamLim ? 'AP Reviewer' : 'Owner/Admin';
  const phoneHint = isMadamLim ? '+65 9182 ****' : '+65 9810 ****';

  const handleSendOtp = () => {
    setIsSendingOtp(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsSendingOtp(false);
    }, 600);
  };

  const handleVerify = (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length < 6) {
      setErrorMsg('Please enter a valid 6-digit security code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess(selectedRole);
    }, 650);
  };

  const handleQuickDemoVerify = () => {
    setOtpCode('882041');
    handleVerify('882041');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white text-center relative shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              title="Close and return to main dashboard"
              aria-label="Close modal and return to dashboard"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center mb-2 shadow-lg">
            <Lock className="h-6 w-6 text-blue-400" />
          </div>
          <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-300 mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>2FA Financial Identity Verification</span>
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">Identity Verification Required</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Boon Huat Accounts Payable Financial Access Control
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Active User Card & Title */}
          <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                {isMadamLim ? 'ML' : 'MB'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {userName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                    {roleBadgeText}
                  </span>
                </div>
                <span className="text-xs text-blue-900 dark:text-blue-200 font-bold block mt-0.5">
                  Role: {userTitle}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 shrink-0">
              MFA Enforced
            </span>
          </div>

          {/* Optional Role Selector */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Select Authorised User Role</span>
              <span className="text-[10px] text-slate-400 font-normal">Switch user profile</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Madam Lim - AP Reviewer */}
              <button
                type="button"
                onClick={() => setSelectedRole('AP Staff (Madam Lim)')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isMadamLim
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                    1. Madam Lim
                  </span>
                  {isMadamLim && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                </div>
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  AP Reviewer
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                  <p>• Review verified invoices</p>
                  <p>• View AI recommendations</p>
                  <p>• Approve or reject suggestions</p>
                </div>
              </button>

              {/* Option 2: Mr Boon - Owner/Admin */}
              <button
                type="button"
                onClick={() => setSelectedRole('Owner / Admin (Mr Boon)')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  !isMadamLim
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                    2. Mr Boon
                  </span>
                  {!isMadamLim && <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />}
                </div>
                <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                  Owner/Admin
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                  <p>• View financial reports</p>
                  <p>• Review audit logs</p>
                  <p>• Manage user permissions</p>
                </div>
              </button>
            </div>
          </div>

          {/* Security Features Highlight Panel */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center space-x-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Mandatory Security Controls</span>
            </h4>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 font-medium pl-1">
              <li className="flex items-start space-x-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span><strong>Multi-Factor Authentication Required</strong> before accessing supplier payment information</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span><strong>Protect Confidential Records:</strong> Encrypts supplier banking and invoice schedules</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span><strong>Authorised Employee Control:</strong> Ensures only verified staff execute AP decisions</span>
              </li>
            </ul>
          </div>

          {/* Human Control Principle (Responsible AI Note) */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug font-medium">
              <strong>Human Control Principle:</strong> AI assists Madam Lim with prioritisation and tracking but does not replace her judgement or approval responsibility.
            </div>
          </div>

          {/* Verification Method Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMethod('sms')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                method === 'sms'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>SMS OTP</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('totp')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                method === 'totp'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Authenticator App</span>
            </button>
          </div>

          {/* Verification Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                {method === 'sms' ? `Enter 6-Digit SMS Code sent to ${phoneHint}` : `Enter 6-Digit Code from Authenticator App`}
              </label>
              {method === 'sms' && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isSendingOtp ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 882041"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-1.5 text-red-600 dark:text-red-400 text-[11px] font-bold mt-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Demo Assist */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Demo Security Code: <strong className="text-slate-900 dark:text-white font-mono">882041</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoVerify}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-all transform active:scale-95"
            >
              1-Click Verify
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              disabled={isVerifying}
              onClick={() => handleVerify()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify Identity as {userName} ({roleBadgeText})</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <X className="h-4 w-4 text-slate-500" />
                <span>Return to Main Dashboard</span>
              </button>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            256-Bit Financial Encryption • Boon Huat Accounts Payable Governance
          </div>

        </div>

      </div>
    </div>
  );
};
