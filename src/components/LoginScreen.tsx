import React, { useState } from 'react';
import { UserRole } from '../types';
import { Building2, ShieldCheck, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, KeyRound, Sun, Moon, Lock, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  darkMode,
  onToggleDarkMode
}) => {
  // Default selected user: Madam Lim (AP Staff)
  const [selectedRole, setSelectedRole] = useState<UserRole>('AP Staff (Madam Lim)');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (password.trim() === '1234') {
        onLoginSuccess(selectedRole);
      } else {
        setErrorMessage('Invalid password. Please try again.');
      }
    }, 400);
  };

  const handleQuickDemoFill = () => {
    setPassword('1234');
    setErrorMessage(null);
  };

  const getRoleDetails = (role: UserRole) => {
    switch (role) {
      case 'AP Staff (Madam Lim)':
        return {
          name: 'Madam Lim',
          title: 'Accounts Payable Staff',
          accessBadge: 'AP Review Access',
          avatarBg: 'bg-blue-600',
          allowed: [
            'View verified invoices from previous AI validation stages',
            'View payment schedules & High/Medium/Low priorities',
            'View AI recommendation explanations in plain language',
            'Review invoice payment decisions & approve/reject within authorised limit',
            'Export payment approval records to Google Sheets'
          ],
          restricted: [
            'Accessing owner/admin settings & user permissions',
            'Changing system configurations or editing AI rules',
            'Executing direct automated bank transfers'
          ]
        };
      case 'Owner / Admin (Mr Boon)':
        return {
          name: 'Mr Boon',
          title: 'Owner / Admin',
          accessBadge: 'Full Executive Admin Access',
          avatarBg: 'bg-purple-600',
          allowed: [
            'View complete AP dashboard & all payment activities',
            'Manage user access permissions & security settings',
            'View security audit logs & governance records',
            'Review financial reports & approve exceptional payment cases'
          ],
          restricted: []
        };
      case 'AP Supervisor':
        return {
          name: 'Sarah Tan',
          title: 'AP Supervisor',
          accessBadge: 'Supervisor Governance',
          avatarBg: 'bg-emerald-600',
          allowed: [
            'Review escalated invoices & high-risk flag cases',
            'Perform additional approval checks & priority adjustments',
            'Audit AP team activities & verification reports'
          ],
          restricted: [
            'Changing owner security permissions',
            'Modifying core system configurations'
          ]
        };
      case 'Finance Manager':
        return {
          name: 'David Chen',
          title: 'Finance Manager',
          accessBadge: 'Financial Management Access',
          avatarBg: 'bg-amber-600',
          allowed: [
            'Review overall financial reports & cashflow projections',
            'Review payment batches & approve high-value transactions',
            'Export financial verification reports to Google Sheets'
          ],
          restricted: [
            'Modifying system access control rules',
            'Executing unverified manual overrides'
          ]
        };
    }
  };

  const activeDetails = getRoleDetails(selectedRole);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Main Container */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col transition-colors my-6">
        
        {/* Header Branding Banner */}
        <div className="bg-gradient-to-b from-blue-50 via-slate-50 to-white dark:from-blue-950/80 dark:to-slate-900 p-6 text-center border-b border-slate-200 dark:border-slate-800/80 relative transition-colors">
          
          {/* Light/Dark Mode Switcher */}
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="absolute top-4 right-4 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-amber-400 font-extrabold text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200 font-extrabold text-[11px]">Dark</span>
                </>
              )}
            </button>
          )}

          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30">
            <Building2 className="h-8 w-8" />
          </div>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-400/20 text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Role-Based Financial Access Control (RBAC)</span>
          </div>

          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Boon Huat Hardware
          </h1>
          <h2 className="text-sm font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
            Accounts Payable Payment Schedule Assistant
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supplier Financial Records & Priority Queue Access Portal
          </p>
        </div>

        {/* Login Body */}
        <div className="p-6 space-y-5 bg-white dark:bg-transparent">
          
          {/* Role Hierarchy Selection Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Select Authorised Employee Login Profile
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold">
                Default: Madam Lim (AP Staff)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Option 1: Madam Lim (AP Staff) - DEFAULT */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('AP Staff (Madam Lim)');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedRole === 'AP Staff (Madam Lim)'
                    ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Madam Lim
                  </span>
                  {selectedRole === 'AP Staff (Madam Lim)' && (
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
                <div className="mt-1 text-[11px] font-extrabold text-blue-700 dark:text-blue-300">
                  Accounts Payable Staff
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  Default Operational User
                </div>
              </button>

              {/* Option 2: Mr Boon (Owner/Admin) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Owner / Admin (Mr Boon)');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedRole === 'Owner / Admin (Mr Boon)'
                    ? 'bg-purple-50/90 dark:bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Mr Boon
                  </span>
                  {selectedRole === 'Owner / Admin (Mr Boon)' && (
                    <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  )}
                </div>
                <div className="mt-1 text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
                  Owner / Admin
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  Full Administrative Access
                </div>
              </button>

              {/* Option 3: AP Supervisor */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('AP Supervisor');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedRole === 'AP Supervisor'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Sarah Tan
                  </span>
                  {selectedRole === 'AP Supervisor' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="mt-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  AP Supervisor
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  Escalated Checks & Audits
                </div>
              </button>

              {/* Option 4: Finance Manager */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Finance Manager');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedRole === 'Finance Manager'
                    ? 'bg-amber-50/90 dark:bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    David Chen
                  </span>
                  {selectedRole === 'Finance Manager' && (
                    <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="mt-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                  Finance Manager
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  Batch & High-Value Approvals
                </div>
              </button>

            </div>
          </div>

          {/* Active Selected Role Permission Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
              <div className="flex items-center space-x-2.5">
                <div className={`h-8 w-8 rounded-xl ${activeDetails.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                  {activeDetails.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {activeDetails.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    {activeDetails.title}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-black border border-blue-200 dark:border-blue-800">
                {activeDetails.accessBadge}
              </span>
            </div>

            {/* Allowed Capabilities */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                <UserCheck className="h-3 w-3" />
                <span>Authorised Dashboard Capabilities:</span>
              </div>
              <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 font-medium pl-1">
                {activeDetails.allowed.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted Capabilities if any */}
            {activeDetails.restricted.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <div className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1">
                  <Lock className="h-3 w-3" />
                  <span>Role Restrictions (Enforced by RBAC):</span>
                </div>
                <ul className="text-[10.5px] text-slate-500 dark:text-slate-400 space-y-0.5 font-medium pl-1">
                  {activeDetails.restricted.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Password Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Demo Password</span>
                </label>
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  title="Auto-fill demo password"
                >
                  Demo Password: 1234
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter password (1234)"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Role Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {activeDetails.name} ({activeDetails.title})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Purpose Statement Box */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
            <div className="flex items-center space-x-1.5 font-bold text-blue-600 dark:text-blue-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Internal Control & Segregation of Duties</span>
            </div>
            <p className="leading-snug text-slate-600 dark:text-slate-400 font-medium">
              Users cannot freely switch roles after logging in. Your authenticated user identity defines your functional scope, protecting financial records and maintaining strict audit trails.
            </p>
          </div>

          {/* Human Governance Statement */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center space-x-1.5 font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Responsible AI Governance Principle</span>
            </div>
            <ul className="space-y-0.5 text-[10.5px] font-medium text-amber-800 dark:text-amber-300/90 pl-1">
              <li>• AI assists Madam Lim with payment prioritisation & tracking</li>
              <li>• AI explains recommendations in plain language</li>
              <li>• Madam Lim remains responsible for human review & approval decisions</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 py-3 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          Boon Huat Accounts Payable System v2.5 • Demo Password: 1234
        </div>

      </div>
    </div>
  );
};
