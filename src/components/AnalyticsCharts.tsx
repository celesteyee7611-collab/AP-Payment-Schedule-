import React from 'react';
import { ExtractedInvoice } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  invoices: ExtractedInvoice[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ invoices }) => {
  // 1. Priority Breakdown Data
  const highCount = invoices.filter((i) => i.priority === 'High').length;
  const medCount = invoices.filter((i) => i.priority === 'Medium').length;
  const lowCount = invoices.filter((i) => i.priority === 'Low').length;

  const priorityPieData = [
    { name: 'High Priority (<7d)', value: highCount, color: '#ef4444' },
    { name: 'Medium Priority (8-30d)', value: medCount, color: '#f59e0b' },
    { name: 'Low Priority (>30d)', value: lowCount, color: '#64748b' },
  ];

  // 2. Weekly Cashflow Forecast Data
  const weeklyMap: Record<string, number> = {
    'Overdue': 0,
    'Week 1 (Aug 1-7)': 0,
    'Week 2 (Aug 8-14)': 0,
    'Week 3 (Aug 15-21)': 0,
    'Week 4 (Aug 22-31)': 0,
    'Sept+ Future': 0,
  };

  invoices.forEach((inv) => {
    const due = new Date(inv.dueDate);
    const ref = new Date('2026-07-30');
    const diffDays = Math.ceil((due.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      weeklyMap['Overdue'] += inv.amount;
    } else if (diffDays <= 7) {
      weeklyMap['Week 1 (Aug 1-7)'] += inv.amount;
    } else if (diffDays <= 14) {
      weeklyMap['Week 2 (Aug 8-14)'] += inv.amount;
    } else if (diffDays <= 21) {
      weeklyMap['Week 3 (Aug 15-21)'] += inv.amount;
    } else if (diffDays <= 31) {
      weeklyMap['Week 4 (Aug 22-31)'] += inv.amount;
    } else {
      weeklyMap['Sept+ Future'] += inv.amount;
    }
  });

  const weeklyChartData = Object.keys(weeklyMap).map((key) => ({
    timeframe: key,
    amount: weeklyMap[key],
  }));

  // 3. Top Supplier Exposure
  const supplierMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    supplierMap[inv.supplierName] = (supplierMap[inv.supplierName] || 0) + inv.amount;
  });

  const topSuppliersData = Object.keys(supplierMap)
    .map((name) => ({ name: name.length > 18 ? name.substring(0, 18) + '...' : name, fullName: name, amount: supplierMap[name] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const formatTooltipCurrency = (val: any) => [`$${Number(val).toLocaleString('en-SG', { minimumFractionDigits: 2 })} SGD`, 'Amount'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Weekly Cash Outflow Bar Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Weekly Supplier Payment Cash Need</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expected total payment amount needed per week based on due dates
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="timeframe" tick={{ fontSize: 10 }} stroke="#64748b" interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} stroke="#64748b" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={formatTooltipCurrency} contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution Pie Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-1">
            <PieChartIcon className="h-4 w-4 text-amber-500" />
            <span>Payment Queue Priority Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Number of invoices in High, Medium, and Low priority queues
          </p>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} Invoices`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
          {priorityPieData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
