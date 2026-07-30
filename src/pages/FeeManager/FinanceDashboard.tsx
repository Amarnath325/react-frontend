import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DashboardSummary {
  expected_revenue: number;
  realized_collection: number;
  realized_percentage: number;
  today_collection: number;
  total_expenses: number;
  vendor_outstanding: number;
  net_surplus: number;
  cash_in_hand: number;
  bank_balance: number;
  pending_due_fees: number;
  due_students_count: number;
}

interface RecentActivity {
  id: number;
  type: 'Receipt' | 'Expense' | 'Cash Book' | 'Bank Deposit' | 'Vendor Payment';
  title: string;
  reference_no: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Verified';
}

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<string>('2025-2026');
  const [summary, setSummary] = useState<DashboardSummary>({
    expected_revenue: 12500000.00,
    realized_collection: 9312500.00,
    realized_percentage: 74.50,
    today_collection: 145000.00,
    total_expenses: 1730000.00,
    vendor_outstanding: 125000.00,
    net_surplus: 7582500.00,
    cash_in_hand: 145000.00,
    bank_balance: 2905000.00,
    pending_due_fees: 3187500.00,
    due_students_count: 142
  });

  const [recentActivities] = useState<RecentActivity[]>([
    { id: 1, type: 'Receipt', title: 'Student Fee Counter Collection (Rahul Sharma - Class 10)', reference_no: 'RCP-2026-8891', amount: 12500.00, date: 'Today, 02:45 PM', status: 'Completed' },
    { id: 2, type: 'Expense', title: 'Teacher & Staff Monthly Payroll Disbursement', reference_no: 'EXP-2026-041', amount: 250000.00, date: 'Today, 11:30 AM', status: 'Verified' },
    { id: 3, type: 'Cash Book', title: 'Petty Cash Refreshment & Postage Expense', reference_no: 'CSH-VOU-109', amount: 1250.00, date: 'Yesterday, 04:15 PM', status: 'Completed' },
    { id: 4, type: 'Bank Deposit', title: 'Cheque Clearance Deposited into HDFC Bank', reference_no: 'BNK-DEP-402', amount: 85000.00, date: '20-07-2026', status: 'Verified' },
    { id: 5, type: 'Vendor Payment', title: 'Metro Book Depot - Library Books Supply Bill', reference_no: 'VND-PAY-092', amount: 45000.00, date: '19-07-2026', status: 'Completed' }
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSession]);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/school/finance-reports/summary');
      if (res.data.success) {
        const d = res.data.data;
        setSummary(prev => ({
          ...prev,
          realized_collection: d.income?.fee_collections || prev.realized_collection,
          total_expenses: d.expenses?.gross_expenses || prev.total_expenses,
          net_surplus: d.net_surplus || prev.net_surplus,
          cash_in_hand: d.liquidity?.cash_in_hand || prev.cash_in_hand,
          bank_balance: d.liquidity?.bank_book_balance || prev.bank_balance
        }));
      }
    } catch (error) {
      console.warn('Dashboard summary using fallback data:', error);
    }
  };

  return (
    <div className="p-3.5 space-y-3.5 text-xs bg-slate-50/50 min-h-full">
      {/* ─── HEADER BAR ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-700 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Finance & Fee Control Dashboard</h1>
            <p className="text-[10px] text-gray-500">Executive financial analytics, real-time fee realization, liquidity monitoring & quick operational controls.</p>
          </div>
        </div>

        {/* Academic Session Selector & Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-xl font-semibold text-gray-800 focus:outline-none bg-white shadow-2xs text-xs"
          >
            <option value="2025-2026">Session 2025-2026 (Active)</option>
            <option value="2026-2027">Session 2026-2027</option>
          </select>

          <button
            onClick={() => navigate('/fees/collect')}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-xs transition text-[10.5px] cursor-pointer flex items-center gap-1"
          >
            <span>+ Collect Fee</span>
          </button>

          <button
            onClick={() => navigate('/fees/reports')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold shadow-2xs text-[10.5px] cursor-pointer"
          >
            Ledger & Reports
          </button>
        </div>
      </div>

      {/* ─── QUICK NAVIGATION HUB CARDS ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
        {[
          { label: 'Collect Fee', path: '/fees/collect', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
          { label: 'Due Fees', path: '/fees/due-fees', color: 'bg-rose-50 border-rose-200 text-rose-900' },
          { label: 'Cash Book', path: '/fees/cash-book', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
          { label: 'Bank Accounts', path: '/fees/bank', color: 'bg-blue-50 border-blue-200 text-blue-900' },
          { label: 'Expense Tracker', path: '/fees/expenses', color: 'bg-amber-50 border-amber-200 text-amber-900' },
          { label: 'Vendor Payments', path: '/fees/vendor-payments', color: 'bg-purple-50 border-purple-200 text-purple-900' },
          { label: 'Budget Manager', path: '/fees/budget', color: 'bg-teal-50 border-teal-200 text-teal-900' },
          { label: 'Reports', path: '/fees/reports', color: 'bg-slate-100 border-slate-300 text-slate-900' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className={`p-2 rounded-xl border text-center font-bold text-[10.5px] transition hover:shadow-sm hover:scale-[1.02] cursor-pointer ${item.color}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ─── STAT CARDS (4 Executive KPIs) ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Revenue Realization */}
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Revenue Realization</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-black text-[9.5px]">
              {summary.realized_percentage}% Realized
            </span>
          </div>
          <h3 className="text-xl font-black text-emerald-800">
            ₹{summary.realized_collection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${summary.realized_percentage}%` }}></div>
          </div>
          <div className="text-[9px] text-gray-400 font-semibold flex justify-between">
            <span>Target: ₹{summary.expected_revenue.toLocaleString('en-IN')}</span>
            <span>Due: ₹{summary.pending_due_fees.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2: Today's Cash Flow */}
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Today's Counter Realization</span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-black text-[9.5px]">Live Feed</span>
          </div>
          <h3 className="text-xl font-black text-indigo-900">
            ₹{summary.today_collection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <div className="text-[9.5px] text-gray-500 font-medium">Verified by Cashier Ramesh Kumar</div>
          <div className="text-[9px] text-indigo-700 font-bold pt-1 border-t border-gray-100 flex items-center justify-between">
            <span>Cash in Hand: ₹{summary.cash_in_hand.toLocaleString('en-IN')}</span>
            <button onClick={() => navigate('/fees/cash-book')} className="underline cursor-pointer">Cash Book →</button>
          </div>
        </div>

        {/* Card 3: Expenses & Outflows */}
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Total Operating Outflows</span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-black text-[9.5px]">Expenses</span>
          </div>
          <h3 className="text-xl font-black text-rose-800">
            ₹{summary.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <div className="text-[9.5px] text-gray-500 font-medium">Vendor Pending: ₹{summary.vendor_outstanding.toLocaleString('en-IN')}</div>
          <div className="text-[9px] text-rose-700 font-bold pt-1 border-t border-gray-100 flex items-center justify-between">
            <span>Direct: ₹12.80L | Vendors: ₹4.50L</span>
            <button onClick={() => navigate('/fees/expenses')} className="underline cursor-pointer">Expenses →</button>
          </div>
        </div>

        {/* Card 4: Net Surplus & Liquidity */}
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">Net Operating Surplus</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-black text-[9.5px]">Profit & Cash</span>
          </div>
          <h3 className="text-xl font-black text-blue-900">
            ₹{summary.net_surplus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <div className="text-[9.5px] text-gray-500 font-medium">Bank Operating Balance: ₹{summary.bank_balance.toLocaleString('en-IN')}</div>
          <div className="text-[9px] text-blue-700 font-bold pt-1 border-t border-gray-100 flex items-center justify-between">
            <span>Liquidity: Healthy</span>
            <button onClick={() => navigate('/fees/reports')} className="underline cursor-pointer">Statements →</button>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE ANALYTICS GRID (2 Columns) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left 2 Cols: Collection vs Expense Breakdowns & Department Budgets */}
        <div className="md:col-span-2 space-y-3">
          {/* Fee Collection Head Distribution Panel */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-extrabold text-gray-900 text-xs">Fee Collection Stream Distribution</h3>
                <p className="text-[9.5px] text-gray-400">Head-wise realization for Academic Session 2025-2026.</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">₹93.12 Lakhs Collected</span>
            </div>

            <div className="space-y-2.5">
              {[
                { head: 'Tuition Fee Collection', amount: 6850000, percentage: 73.5, color: 'bg-emerald-600' },
                { head: 'Admission & Registration Fee', amount: 1250000, percentage: 13.4, color: 'bg-indigo-600' },
                { head: 'Transport & Bus Fee', amount: 720000, percentage: 7.7, color: 'bg-blue-600' },
                { head: 'Hostel & Mess Fee', amount: 325000, percentage: 3.5, color: 'bg-purple-600' },
                { head: 'Other Income & Sales', amount: 167500, percentage: 1.9, color: 'bg-amber-600' }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between font-semibold text-[11px] text-gray-700">
                    <span>{item.head}</span>
                    <span className="font-mono font-bold text-gray-900">₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Departmental Budget Utilization Progress Bars */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-extrabold text-gray-900 text-xs">Department Budget Utilization Gauges</h3>
                <p className="text-[9.5px] text-gray-400">Allocated budget vs expense spent monitoring.</p>
              </div>
              <button onClick={() => navigate('/fees/budget')} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">
                Manage Budgets →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { dept: 'Academic Dept', allocated: 500000, utilized: 285000, pct: 57.0, status: 'Within Budget', color: 'bg-emerald-600' },
                { dept: 'Administration', allocated: 350000, utilized: 310000, pct: 88.5, status: 'Near Threshold', color: 'bg-amber-500' },
                { dept: 'Transport Dept', allocated: 150000, utilized: 110000, pct: 73.3, status: 'Within Budget', color: 'bg-emerald-600' },
                { dept: 'Sports & Activities', allocated: 100000, utilized: 105000, pct: 105.0, status: 'Over Budget', color: 'bg-rose-600' },
              ].map((b, idx) => (
                <div key={idx} className="p-2.5 border border-gray-200 rounded-lg bg-slate-50/50 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-900">{b.dept}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      b.pct > 100 ? 'bg-rose-100 text-rose-800' : b.pct > 85 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>{b.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className={`${b.color} h-1.5 rounded-full`} style={{ width: `${Math.min(b.pct, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[9.5px] text-gray-500 font-semibold">
                    <span>Spent: ₹{b.utilized.toLocaleString('en-IN')}</span>
                    <span>Budget: ₹{b.allocated.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Outstanding Defaulters & Quick Actions */}
        <div className="space-y-3">
          {/* Outstanding Due Fees Defaulter Card */}
          <div className="bg-white border border-rose-200 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-rose-100">
              <div>
                <h3 className="font-black text-rose-900 text-xs">Fee Defaulters & Overdue Alert</h3>
                <p className="text-[9.5px] text-gray-500">{summary.due_students_count} Students with pending dues</p>
              </div>
              <button onClick={() => navigate('/fees/due-fees')} className="text-[10px] font-bold text-rose-700 underline cursor-pointer">
                View Dues →
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-rose-900 block text-[11px]">Total Pending Dues</span>
                  <span className="text-base font-black text-rose-900">₹{summary.pending_due_fees.toLocaleString('en-IN')}</span>
                </div>
                <button onClick={() => navigate('/fees/due-fees')} className="px-2.5 py-1 bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer">
                  Send SMS Alerts
                </button>
              </div>

              {/* Class Dues Summary list */}
              <div className="space-y-1 text-xs">
                {[
                  { cls: 'Class 10', count: 34, amount: 845000 },
                  { cls: 'Class 9', count: 28, amount: 620000 },
                  { cls: 'Class 12 (Sci)', count: 22, amount: 580000 },
                  { cls: 'Class 8', count: 19, amount: 410000 }
                ].map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-1.5 hover:bg-slate-50 rounded text-[11px]">
                    <span className="font-bold text-gray-800">{d.cls} ({d.count} Std)</span>
                    <span className="font-mono font-bold text-rose-700">₹{d.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts Panel */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-2.5">
            <h3 className="font-extrabold text-gray-900 text-xs border-b pb-1.5">Quick Finance Operations</h3>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
              <button onClick={() => navigate('/fees/collect')} className="p-2 text-left bg-indigo-50 text-indigo-900 hover:bg-indigo-100 rounded-lg transition flex justify-between items-center cursor-pointer">
                <span>1. Collect Student Fee</span>
                <span>→</span>
              </button>
              <button onClick={() => navigate('/fees/cash-book')} className="p-2 text-left bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-lg transition flex justify-between items-center cursor-pointer">
                <span>2. Record Cash Book Entry</span>
                <span>→</span>
              </button>
              <button onClick={() => navigate('/fees/expenses')} className="p-2 text-left bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg transition flex justify-between items-center cursor-pointer">
                <span>3. Add Expense Outflow</span>
                <span>→</span>
              </button>
              <button onClick={() => navigate('/fees/bank')} className="p-2 text-left bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-lg transition flex justify-between items-center cursor-pointer">
                <span>4. Bank Reconciliation</span>
                <span>→</span>
              </button>
              <button onClick={() => navigate('/fees/reports')} className="p-2 text-left bg-purple-50 text-purple-900 hover:bg-purple-100 rounded-lg transition flex justify-between items-center cursor-pointer">
                <span>5. General Ledger Statements</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RECENT FINANCIAL ACTIVITY STREAM TABLE ──────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs space-y-0">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900 text-xs">Real-Time Financial Activity Stream</h3>
          <span className="text-[10px] text-gray-500 font-semibold">Latest 5 Transactions</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-gray-700 uppercase text-[10px]">
              <th className="py-2.5 px-3">REF NO</th>
              <th className="py-2.5 px-3">TYPE</th>
              <th className="py-2.5 px-3">TRANSACTION PARTICULARS</th>
              <th className="py-2.5 px-3">DATE & TIME</th>
              <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
              <th className="py-2.5 px-3 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentActivities.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">{item.reference_no}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase ${
                    item.type === 'Receipt' ? 'bg-emerald-50 text-emerald-700' :
                    item.type === 'Expense' ? 'bg-rose-50 text-rose-700' :
                    item.type === 'Cash Book' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-gray-900">{item.title}</td>
                <td className="py-2.5 px-3 text-gray-500 font-medium">{item.date}</td>
                <td className={`py-2.5 px-3 text-right font-mono font-black ${
                  item.type === 'Expense' || item.type === 'Vendor Payment' ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {item.type === 'Expense' || item.type === 'Vendor Payment' ? `- ₹${item.amount.toLocaleString('en-IN')}` : `+ ₹${item.amount.toLocaleString('en-IN')}`}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[9px]">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
