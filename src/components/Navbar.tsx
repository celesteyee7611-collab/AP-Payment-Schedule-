import React from 'react';
import { UserRole } from '../types';
import { Building2, ShieldCheck, Sun, Moon, History, Sparkles, Users, Lock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  isMfaVerified: boolean;
  onTriggerReMfa: () => void;
  onOpenUserManagement: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuditLogs: () => void;
  onOpenAiChat: () => void;
  onLogout?: () => void;
  totalInvoices: number;
  pendingReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  isMfaVerified,
  onTriggerReMfa,
  onOpenUserManagement,
  darkMode,
  onToggleDarkMode,
  onOpenAuditLogs,
  onOpenAiChat,
  onLogout,
  totalInvoices,
  pendingReviewCount,
}) => {
  const isOwner = currentRole.includes('Owner') || currentRole === 'Owner / Admin (Mr Boon)';

  const getUserBadgeDetails = () => {
    switch (currentRole) {
      case 'AP Staff (Madam Lim)':
        return {
          name: 'Madam Lim',
          roleTitle: 'Accounts Payable Staff',
          badgeText: 'AP Review Access',
          badgeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        };
      case 'Owner / Admin (Mr Boon)':
        return {
          name: 'Mr Boon',
          roleTitle: 'Owner / Admin',
          badgeText: 'Owner/Admin',
          badgeBg: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800'
        };
      case 'AP Supervisor':
        return {
          name: 'Sarah Tan',
          roleTitle: 'AP Supervisor',
          badgeText: 'AP Supervisor',
          badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        };
      case 'Finance Manager':
        return {
          name: 'David Chen',
          roleTitle: 'Finance Manager',
          badgeText: 'Finance Manager',
          badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        };
      default:
        return {
          name: 'Madam Lim',
          roleTitle: 'Accounts Payable Staff',
          badgeText: 'AP Staff',
          badgeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        };
    }
  };

  const userBadge = getUserBadgeDetails();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  Boon Huat Hardware
                </span>
                <span className="hidden lg:inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  AP Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Accounts Payable Schedule & Financial Access Control System
              </p>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* MFA Security Status Badge */}
            <button
              onClick={onTriggerReMfa}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                isMfaVerified
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-200 animate-pulse'
              }`}
              title="Click to check 2FA Multi-Factor Security status"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {isMfaVerified ? '2FA Verified' : 'Verify 2FA'}
              </span>
            </button>

            {/* User Management Button (Interactive for Owner/Admin, Restricted notice for others) */}
            <button
              onClick={onOpenUserManagement}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isOwner
                  ? 'bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isOwner ? "Manage User Accounts & Access Permissions" : "User Management (Restricted to Owner/Admin)"}
            >
              <Users className={`h-4 w-4 ${isOwner ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Users & Access</span>
              {!isOwner && <Lock className="h-3 w-3 ml-0.5 text-slate-400" />}
            </button>

            {/* AI Assistant Chat Button */}
            <button
              onClick={onOpenAiChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all transform active:scale-95"
              title="Open AP AI Assistant"
            >
              <Sparkles className="h-4 w-4 text-blue-200" />
              <span className="hidden md:inline">Ask AP AI</span>
            </button>

            {/* Audit Logs Trigger */}
            <button
              onClick={onOpenAuditLogs}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="View Security & Governance Audit Logs"
            >
              <History className="h-5 w-5" />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {pendingReviewCount}
                </span>
              )}
            </button>

            {/* Authenticated User Identity Role Switcher */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-extrabold ${userBadge.badgeBg}`}>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {onSwitchRole ? (
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-bold opacity-80 leading-none">Active Role (RBAC):</span>
                  <select
                    value={currentRole}
                    onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                    className="bg-transparent font-black text-xs cursor-pointer focus:outline-none p-0 border-0"
                    title="Switch active user role for RBAC testing"
                  >
                    <option value="AP Staff (Madam Lim)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Madam Lim (AP Staff)</option>
                    <option value="Finance Manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">David Chen (Finance Manager)</option>
                    <option value="Owner / Admin (Mr Boon)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mr Boon (Owner / Admin)</option>
                    <option value="AP Supervisor" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sarah Tan (AP Supervisor)</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col text-left">
                  <span className="leading-tight font-black">{userBadge.name}</span>
                  <span className="text-[9px] font-bold opacity-80 leading-none">{userBadge.badgeText}</span>
                </div>
              )}
            </div>

            {/* Dark/Light Theme Switcher Sign */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Light/Dark Theme"
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="hidden xl:inline text-amber-400 font-extrabold text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="hidden xl:inline font-extrabold text-xs text-slate-700 dark:text-slate-200">Dark</span>
                </>
              )}
            </button>

            {/* Sign Out / Lock Session Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors border border-red-200 dark:border-red-900/50 flex items-center space-x-1 cursor-pointer"
                title="Lock Session & Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-bold hidden xl:inline">Sign Out</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
