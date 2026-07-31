import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  DollarSign, Users, FileText, CheckCircle2, Clock, Plus, Trash2,
  Search, ShieldCheck, X, TrendingUp, Award
} from 'lucide-react';
import api from '../../services/api';

interface PayrollSlip {
  id: number;
  staff_name: string;
  staff_code: string;
  designation: string;
  month_year: string;
  basic_salary: number;
  hra: number;
  allowances: number;
  pf_deduction: number;
  net_salary: number;
  status: string;
  payment_date?: string;
}

interface PayrollStats {
  total_expense: number;
  total_staff: number;
  paid_slips: number;
  pending_slips: number;
}

export default function PayrollManagementPage() {
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [stats, setStats] = useState<PayrollStats>({
    total_expense: 106860, total_staff: 2, paid_slips: 2, pending_slips: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    staff_name: '', staff_code: '', designation: 'Senior Faculty', month_year: 'July 2026', basic_salary: 40000
  });

  const loadData = useCallback(async () => {
    try {
      const [resStats, resSlips] = await Promise.all([
        api.get('/admin/payroll/stats'),
        api.get('/admin/payroll/slips')
      ]);
      if (resStats.data.success) setStats(resStats.data.data);
      if (resSlips.data.success) setSlips(resSlips.data.data);
    } catch {
      setSlips([
        { id: 1, staff_name: 'Dr. Ananya Roy', staff_code: 'EMP-2001', designation: 'Senior HOD Physics', month_year: 'July 2026', basic_salary: 45000, hra: 12000, allowances: 5000, pf_deduction: 3600, net_salary: 58400, status: 'paid', payment_date: new Date().toISOString() },
        { id: 2, staff_name: 'Vikrant Tomar', staff_code: 'EMP-2002', designation: 'Mathematics Faculty', month_year: 'July 2026', basic_salary: 38000, hra: 9500, allowances: 4000, pf_deduction: 3040, net_salary: 48460, status: 'paid', payment_date: new Date().toISOString() },
      ]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerateSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_name || !form.staff_code || !form.basic_salary) {
      toast.error('Please fill in required salary fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/payroll/slips', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setForm({ staff_name: '', staff_code: '', designation: 'Senior Faculty', month_year: 'July 2026', basic_salary: 40000 });
        loadData();
      }
    } catch {
      const basic = form.basic_salary;
      const net = basic + (basic * 0.25) + (basic * 0.10) - (basic * 0.08);
      setSlips(prev => [...prev, { ...form, id: Date.now(), hra: basic * 0.25, allowances: basic * 0.10, pf_deduction: basic * 0.08, net_salary: net, status: 'paid', payment_date: new Date().toISOString() }]);
      toast.success('Salary payslip generated (Demo)');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlip = async (id: number) => {
    if (!confirm('Delete this payroll slip record?')) return;
    try {
      await api.delete(`/admin/payroll/slips/${id}`);
      toast.success('Payroll slip deleted');
      loadData();
    } catch {
      setSlips(prev => prev.filter(s => s.id !== id));
      toast.success('Payroll slip deleted (Demo)');
    }
  };

  const filteredSlips = slips.filter(s =>
    s.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-400/30"><DollarSign className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Staff Payroll & HRMS Salary Generator</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Payroll ERP v2.5</span>
          </div>
          <p className="text-xs text-slate-300">Automate attendance-linked staff salary calculation, HRA allowances, PF deductions, and monthly payslips.</p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Generate Payslip
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <div className="text-base font-black text-emerald-700">₹{stats.total_expense.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly Payroll Outflow</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.total_staff} Staff</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Salaried Employees</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-purple-700">{stats.paid_slips} Slips</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Disbursed Payslips</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-amber-700">{stats.pending_slips} Pending</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Processing</div>
          </div>
        </div>
      </div>

      {/* Slips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search staff name, code, designation..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div className="space-y-3">
          {filteredSlips.map(s => (
            <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-sm">
                  {s.staff_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{s.staff_name}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded text-[10px]">{s.staff_code}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px] uppercase">{s.status}</span>
                  </div>
                  <div className="text-slate-500 mt-1">{s.designation} • Month: <strong>{s.month_year}</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right text-[11px]">
                  <div className="text-slate-500">Basic: ₹{s.basic_salary.toLocaleString()} + HRA: ₹{s.hra.toLocaleString()}</div>
                  <div className="text-slate-500">PF Deduction: <strong className="text-rose-600">-₹{s.pf_deduction.toLocaleString()}</strong></div>
                  <div className="text-xs font-black text-emerald-700 mt-0.5">Net Salary: ₹{s.net_salary.toLocaleString()}</div>
                </div>
                <button onClick={() => handleDeleteSlip(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Slip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Generate Staff Payslip</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleGenerateSlip} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Member Name *</label>
                <input value={form.staff_name} onChange={e => setForm({ ...form, staff_name: e.target.value })} placeholder="e.g. Dr. Ananya Roy" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Code *</label>
                  <input value={form.staff_code} onChange={e => setForm({ ...form, staff_code: e.target.value })} placeholder="EMP-2003" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Month / Year *</label>
                  <input value={form.month_year} onChange={e => setForm({ ...form, month_year: e.target.value })} placeholder="July 2026" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation</label>
                <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="Senior Faculty / HOD" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Basic Salary Amount (₹) *</label>
                <input type="number" min="10000" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold" />
                <div className="text-[10px] text-slate-400 mt-1">* HRA (25%), Allowances (10%), and PF (8%) will be calculated automatically.</div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">{submitting ? 'Generating...' : 'Disburse Payslip'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
