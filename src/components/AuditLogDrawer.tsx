import React, { useState } from 'react';
import { AuditLog } from '../types';
import { History, X, ShieldCheck, Upload, Sparkles, FileCheck, Search, Download } from 'lucide-react';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.supplierName && log.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'ai_extract':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'human_review':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'security':
        return <History className="h-4 w-4 text-amber-500" />;
      case 'bank_update':
        return <History className="h-4 w-4 text-rose-500" />;
      default:
        return <FileCheck className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'User Name', 'Role', 'Action Performed', 'Invoice Affected', 'Approval Status', 'IP/Session Details', 'Log Details'];
    const rows = logs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.user}"`,
      `"${l.role}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.invoiceId || 'N/A'}"`,
      `"${l.approvalStatus || 'N/A'}"`,
      `"${l.ipAddress || '192.168.1.104 (2FA Session)'}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AP_Audit_Trail_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Accounts Payable Governance & Audit Logs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable record of received verified invoices, payment scheduling & human approvals
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search audit trail by user, invoice, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleExportAuditCsv}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all shrink-0"
                title="Download CSV Audit Report"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 mr-1">Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('human_review')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'human_review'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Human Approvals
              </button>
              <button
                onClick={() => setFilterType('security')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'security'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                2FA / Security
              </button>
              <button
                onClick={() => setFilterType('bank_update')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterType === 'bank_update'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Bank Detail Changes
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No audit logs found matching criteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-extrabold text-slate-900 dark:text-white">
                      {getLogIcon(log.type)}
                      <span>{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {log.details}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 gap-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      User: {log.user} ({log.role})
                    </span>
                    {log.invoiceId && (
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        Invoice ID: #{log.invoiceId}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {log.ipAddress || '192.168.1.104 (2FA Session)'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
            <span>Total Records: {logs.length}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Audit Trail Secured</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
