import React, { useState } from 'react';
import { UserRole, UserAccount, AuditLog } from '../types';
import { Users, ShieldCheck, Lock, CheckCircle2, X, Plus, AlertCircle, Key, Trash2, Edit3, UserPlus, Eye, ShieldAlert } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onAddAuditLog: (log: AuditLog) => void;
}

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-001',
    name: 'Madam Lim',
    email: 'lim.ap@boonhuat.com.sg',
    phone: '+65 9182 4019',
    role: 'AP Staff (Madam Lim)',
    mfaEnabled: true,
    mfaVerified: true,
    status: 'Active',
    lastActive: '2026-08-06 19:30',
    permissions: {
      canReviewInvoices: true,
      canApproveReject: true,
      canEditBankDetails: false, // Restricted per security policy
      canDeleteRecords: false,   // Restricted per security policy
      canAccessUserManagement: false,
      canAccessAuditLogs: true,
    }
  },
  {
    id: 'user-002',
    name: 'Mr Boon',
    email: 'boon.owner@boonhuat.com.sg',
    phone: '+65 9810 2039',
    role: 'Owner / Admin (Mr Boon)',
    mfaEnabled: true,
    mfaVerified: true,
    status: 'Active',
    lastActive: '2026-08-06 19:42',
    permissions: {
      canReviewInvoices: true,
      canApproveReject: true,
      canEditBankDetails: true,
      canDeleteRecords: true,
      canAccessUserManagement: true,
      canAccessAuditLogs: true,
    }
  },
  {
    id: 'user-003',
    name: 'Sarah Tan',
    email: 'sarah.tan@boonhuat.com.sg',
    phone: '+65 9301 8841',
    role: 'AP Staff (Madam Lim)',
    mfaEnabled: true,
    mfaVerified: false,
    status: 'Active',
    lastActive: '2026-08-05 16:15',
    permissions: {
      canReviewInvoices: true,
      canApproveReject: false,
      canEditBankDetails: false,
      canDeleteRecords: false,
      canAccessUserManagement: false,
      canAccessAuditLogs: false,
    }
  }
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onAddAuditLog
}) => {
  if (!isOpen) return null;

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('AP Staff (Madam Lim)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = currentUserRole.includes('Owner') || currentUserRole === 'Owner / Admin (Mr Boon)';

  const showInternalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      phone: '+65 9000 0000',
      role: newUserRole,
      mfaEnabled: true,
      mfaVerified: false,
      status: 'Active',
      lastActive: 'Just now',
      permissions: {
        canReviewInvoices: true,
        canApproveReject: newUserRole.includes('Owner') || newUserRole.includes('Madam Lim'),
        canEditBankDetails: newUserRole.includes('Owner'),
        canDeleteRecords: newUserRole.includes('Owner'),
        canAccessUserManagement: newUserRole.includes('Owner'),
        canAccessAuditLogs: true,
      }
    };

    setUsers((prev) => [...prev, newUser]);
    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');

    onAddAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentUserRole}`,
      role: currentUserRole,
      action: 'User Account Provisioned',
      details: `Created new user account "${newUserName}" (${newUserEmail}) assigned role ${newUserRole}.`,
      type: 'security'
    });

    showInternalToast(`User account created for ${newUserName}. 2FA invitation sent.`);
  };

  const handleResetMfa = (user: UserAccount) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, mfaVerified: false } : u))
    );

    onAddAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: `${currentUserRole}`,
      role: currentUserRole,
      action: '2FA Security Reset Triggered',
      details: `Reset 2FA security state for ${user.name} (${user.email}). User must re-authenticate.`,
      type: 'security'
    });

    showInternalToast(`2FA security state reset for ${user.name}. Re-verification required.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center space-x-2">
                <span>User Management & Role Access Control</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Owner Admin Panel
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Boon Huat Hardware AP System User Directory & Permission Matrix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Permission Overview Banner */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-blue-900 dark:text-blue-200 block text-xs">
                FINANCIAL GOVERNANCE & PRIVILEGE ENFORCEMENT
              </span>
              <p className="text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                <strong>Madam Lim (AP Staff)</strong> has full authority to review supplier invoices, view AI priority recommendations, and approve/reject payment suggestions. Supplier banking account modifications and record deletions are restricted to <strong>Mr Boon (Owner/Admin)</strong>.
              </p>
            </div>
          </div>

          {/* User Directory Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <span>Active Authorized Accounts</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {users.length} Users
                </span>
              </h4>

              {isOwner && (
                <button
                  onClick={() => setIsAddUserOpen(!isAddUserOpen)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all transform active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Provision New User</span>
                </button>
              )}
            </div>

            {/* Add User Form if Open */}
            {isAddUserOpen && (
              <form onSubmit={handleCreateUser} className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
                <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">
                  Provision New Accounts Payable User
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alan Wong"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Email</label>
                    <input
                      type="email"
                      required
                      placeholder="alan@boonhuat.com.sg"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Assignment</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="AP Staff (Madam Lim)">AP Staff (Madam Lim)</option>
                      <option value="Owner / Admin (Mr Boon)">Owner / Admin (Mr Boon)</option>
                      <option value="AP Supervisor">AP Supervisor</option>
                      <option value="Finance Manager">Finance Manager</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs"
                  >
                    Save & Enforce 2FA
                  </button>
                </div>
              </form>
            )}

            {/* Directory Matrix */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  <tr>
                    <th className="p-3">User & Contact</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3 text-center">Approve Payments</th>
                    <th className="p-3 text-center">Bank Details</th>
                    <th className="p-3 text-center">Delete Records</th>
                    <th className="p-3 text-center">2FA Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{usr.name}</span>
                          {usr.name.includes('Madam Lim') && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-extrabold">
                              Key Approver
                            </span>
                          )}
                          {usr.name.includes('Mr Boon') && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-extrabold">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{usr.email} • {usr.phone}</div>
                      </td>

                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {usr.role}
                      </td>

                      <td className="p-3 text-center">
                        {usr.permissions.canApproveReject ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400 font-medium">✕ View Only</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {usr.permissions.canEditBankDetails ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">✓ Full Edit</span>
                        ) : (
                          <span className="text-slate-400 font-semibold flex items-center justify-center space-x-1">
                            <Lock className="h-3 w-3 text-amber-500" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {usr.permissions.canDeleteRecords ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">✓ Allowed</span>
                        ) : (
                          <span className="text-slate-400 font-semibold flex items-center justify-center space-x-1">
                            <Lock className="h-3 w-3 text-amber-500" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {usr.mfaVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            2FA Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pending 2FA
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleResetMfa(usr)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700"
                          title="Trigger 2FA Security Reset"
                        >
                          Reset 2FA
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Lock className="h-4 w-4 text-blue-600" />
            <span>Strict Role Segregation Enforced for Accounts Payable Security</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs"
          >
            Close Access Panel
          </button>
        </div>

      </div>
    </div>
  );
};
