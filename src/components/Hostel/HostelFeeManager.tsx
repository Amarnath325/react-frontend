import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, Plus, Search, Download, RefreshCw, Filter,
  Receipt, DollarSign, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Clock, XCircle, Eye, Printer, Send, Edit2,
  Trash2, BarChart2, PieChart, Calendar, User, Building,
  FileText, ChevronDown, ChevronUp, ArrowUpRight, Wallet,
  BadgePercent, Bell, RotateCcw, Upload, X, Check
} from 'lucide-react';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

interface HostelFeeStructure {
  id: number;
  name: string;
  room_type: string;
  fee_components: FeeComponent[];
  academic_year: string;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'One-Time';
  total_amount: number;
  security_deposit: number;
  mess_charges: number;
  late_fee_per_day: number;
  grace_days: number;
  is_active: boolean;
}

interface FeeComponent {
  name: string;
  amount: number;
  is_optional: boolean;
}

interface HostelBill {
  id: number;
  bill_no: string;
  student_name: string;
  admission_no: string;
  room_no: string;
  block: string;
  bill_month: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  late_fee: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Waived';
  created_at: string;
  components: { name: string; amount: number }[];
}

interface PaymentRecord {
  id: number;
  receipt_no: string;
  bill_no: string;
  student_name: string;
  admission_no: string;
  amount_paid: number;
  payment_mode: 'Cash' | 'Online' | 'Cheque' | 'Bank Transfer' | 'UPI';
  transaction_id: string | null;
  payment_date: string;
  received_by: string;
  remarks: string | null;
  bill_month: string;
}

interface DueAlert {
  student_name: string;
  admission_no: string;
  room_no: string;
  due_amount: number;
  due_since: string;
  months_pending: number;
  contact: string;
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_FEE_STRUCTURES: HostelFeeStructure[] = [
  {
    id: 1,
    name: 'Standard 2-Seater AC',
    room_type: '2-Seater AC',
    academic_year: '2025-26',
    frequency: 'Monthly',
    total_amount: 8500,
    security_deposit: 10000,
    mess_charges: 3500,
    late_fee_per_day: 50,
    grace_days: 5,
    is_active: true,
    fee_components: [
      { name: 'Room Rent', amount: 3500, is_optional: false },
      { name: 'Electricity Charges', amount: 500, is_optional: false },
      { name: 'Mess Charges', amount: 3500, is_optional: false },
      { name: 'Laundry', amount: 300, is_optional: true },
      { name: 'Water Charges', amount: 200, is_optional: false },
      { name: 'Internet / WiFi', amount: 500, is_optional: true },
    ]
  },
  {
    id: 2,
    name: 'Standard 4-Seater Non-AC',
    room_type: '4-Seater Non-AC',
    academic_year: '2025-26',
    frequency: 'Monthly',
    total_amount: 5500,
    security_deposit: 7000,
    mess_charges: 3000,
    late_fee_per_day: 30,
    grace_days: 7,
    is_active: true,
    fee_components: [
      { name: 'Room Rent', amount: 1800, is_optional: false },
      { name: 'Electricity Charges', amount: 300, is_optional: false },
      { name: 'Mess Charges', amount: 3000, is_optional: false },
      { name: 'Water Charges', amount: 200, is_optional: false },
      { name: 'Internet / WiFi', amount: 200, is_optional: true },
    ]
  },
  {
    id: 3,
    name: 'Premium Single Room AC',
    room_type: 'Single AC',
    academic_year: '2025-26',
    frequency: 'Monthly',
    total_amount: 14000,
    security_deposit: 20000,
    mess_charges: 4000,
    late_fee_per_day: 100,
    grace_days: 3,
    is_active: true,
    fee_components: [
      { name: 'Room Rent', amount: 7500, is_optional: false },
      { name: 'Electricity Charges', amount: 800, is_optional: false },
      { name: 'Mess Charges', amount: 4000, is_optional: false },
      { name: 'Laundry', amount: 500, is_optional: true },
      { name: 'Water Charges', amount: 200, is_optional: false },
      { name: 'Internet / WiFi', amount: 500, is_optional: true },
      { name: 'House Keeping', amount: 500, is_optional: false },
    ]
  },
];

const MOCK_BILLS: HostelBill[] = [
  {
    id: 1, bill_no: 'HB-2026-0601', student_name: 'Amit Kumar', admission_no: 'ADM-2026-0042',
    room_no: '101-A', block: 'Block A (Boys)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 8500, paid_amount: 8500, balance_amount: 0, late_fee: 0,
    status: 'Paid', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 3500 }, { name: 'Mess Charges', amount: 3500 }, { name: 'Electricity', amount: 500 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 300 }]
  },
  {
    id: 2, bill_no: 'HB-2026-0602', student_name: 'Rohan Sharma', admission_no: 'ADM-2026-0058',
    room_no: '102-A', block: 'Block A (Boys)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 8500, paid_amount: 5000, balance_amount: 3500, late_fee: 0,
    status: 'Partial', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 3500 }, { name: 'Mess Charges', amount: 3500 }, { name: 'Electricity', amount: 500 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 300 }]
  },
  {
    id: 3, bill_no: 'HB-2026-0603', student_name: 'Rahul Singh', admission_no: 'ADM-2026-0071',
    room_no: '102-B', block: 'Block A (Boys)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 8500, paid_amount: 0, balance_amount: 8500, late_fee: 650,
    status: 'Overdue', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 3500 }, { name: 'Mess Charges', amount: 3500 }, { name: 'Electricity', amount: 500 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 300 }]
  },
  {
    id: 4, bill_no: 'HB-2026-0604', student_name: 'Vikram Patel', admission_no: 'ADM-2026-0033',
    room_no: '103-A', block: 'Block A (Boys)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 14000, paid_amount: 0, balance_amount: 14000, late_fee: 0,
    status: 'Pending', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 7500 }, { name: 'Mess Charges', amount: 4000 }, { name: 'Electricity', amount: 800 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 500 }, { name: 'House Keeping', amount: 500 }, { name: 'Laundry', amount: 500 }]
  },
  {
    id: 5, bill_no: 'HB-2026-0605', student_name: 'Priya Gupta', admission_no: 'ADM-2026-0021',
    room_no: '201-A', block: 'Block B (Girls)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 5500, paid_amount: 5500, balance_amount: 0, late_fee: 0,
    status: 'Paid', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 1800 }, { name: 'Mess Charges', amount: 3000 }, { name: 'Electricity', amount: 300 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 200 }]
  },
  {
    id: 6, bill_no: 'HB-2026-0606', student_name: 'Anjali Sharma', admission_no: 'ADM-2026-0084',
    room_no: '202-A', block: 'Block B (Girls)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 8500, paid_amount: 8500, balance_amount: 0, late_fee: 0,
    status: 'Paid', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 3500 }, { name: 'Mess Charges', amount: 3500 }, { name: 'Electricity', amount: 500 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 300 }]
  },
  {
    id: 7, bill_no: 'HB-2026-0607', student_name: 'Siddharth Roy', admission_no: 'ADM-2026-0095',
    room_no: '104-B', block: 'Block A (Boys)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 5500, paid_amount: 0, balance_amount: 5500, late_fee: 330,
    status: 'Overdue', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 1800 }, { name: 'Mess Charges', amount: 3000 }, { name: 'Electricity', amount: 300 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 200 }]
  },
  {
    id: 8, bill_no: 'HB-2026-0608', student_name: 'Neha Verma', admission_no: 'ADM-2026-0018',
    room_no: '203-A', block: 'Block B (Girls)', bill_month: 'June 2026', due_date: '2026-06-10',
    total_amount: 8500, paid_amount: 8500, balance_amount: 0, late_fee: 0,
    status: 'Paid', created_at: '2026-06-01',
    components: [{ name: 'Room Rent', amount: 3500 }, { name: 'Mess Charges', amount: 3500 }, { name: 'Electricity', amount: 500 }, { name: 'Water', amount: 200 }, { name: 'Internet', amount: 300 }]
  },
];

const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 1, receipt_no: 'HR-2026-0201', bill_no: 'HB-2026-0601', student_name: 'Amit Kumar', admission_no: 'ADM-2026-0042', amount_paid: 8500, payment_mode: 'Online', transaction_id: 'TXN8273912', payment_date: '2026-06-07', received_by: 'System', remarks: 'Full payment received', bill_month: 'June 2026' },
  { id: 2, receipt_no: 'HR-2026-0202', bill_no: 'HB-2026-0602', student_name: 'Rohan Sharma', admission_no: 'ADM-2026-0058', amount_paid: 5000, payment_mode: 'Cash', transaction_id: null, payment_date: '2026-06-08', received_by: 'Mr. Satish', remarks: 'Partial payment', bill_month: 'June 2026' },
  { id: 3, receipt_no: 'HR-2026-0203', bill_no: 'HB-2026-0605', student_name: 'Priya Gupta', admission_no: 'ADM-2026-0021', amount_paid: 5500, payment_mode: 'UPI', transaction_id: 'UPI9238471', payment_date: '2026-06-06', received_by: 'System', remarks: null, bill_month: 'June 2026' },
  { id: 4, receipt_no: 'HR-2026-0204', bill_no: 'HB-2026-0606', student_name: 'Anjali Sharma', admission_no: 'ADM-2026-0084', amount_paid: 8500, payment_mode: 'Bank Transfer', transaction_id: 'NEFT928374', payment_date: '2026-06-05', received_by: 'System', remarks: 'Full payment', bill_month: 'June 2026' },
  { id: 5, receipt_no: 'HR-2026-0205', bill_no: 'HB-2026-0608', student_name: 'Neha Verma', admission_no: 'ADM-2026-0018', amount_paid: 8500, payment_mode: 'Cheque', transaction_id: 'CHQ00182', payment_date: '2026-06-09', received_by: 'Mrs. Shobha', remarks: 'Cheque cleared', bill_month: 'June 2026' },
];

const MOCK_DUE_ALERTS: DueAlert[] = [
  { student_name: 'Rahul Singh', admission_no: 'ADM-2026-0071', room_no: '102-B', due_amount: 9150, due_since: '2026-06-10', months_pending: 1, contact: '9876501234' },
  { student_name: 'Siddharth Roy', admission_no: 'ADM-2026-0095', room_no: '104-B', due_amount: 5830, due_since: '2026-06-10', months_pending: 1, contact: '9123456780' },
  { student_name: 'Vikram Patel', admission_no: 'ADM-2026-0033', room_no: '103-A', due_amount: 14000, due_since: '2026-06-10', months_pending: 1, contact: '9988776655' },
];

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN')}`;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Partial: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-blue-50 text-blue-700 border-blue-200',
    Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    Waived: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'Paid': return <CheckCircle className="w-3 h-3" />;
    case 'Partial': return <Clock className="w-3 h-3" />;
    case 'Overdue': return <AlertCircle className="w-3 h-3" />;
    case 'Pending': return <Clock className="w-3 h-3" />;
    default: return <XCircle className="w-3 h-3" />;
  }
};

const paymentModeBadge = (mode: string) => {
  const map: Record<string, string> = {
    Cash: 'bg-amber-50 text-amber-700',
    Online: 'bg-blue-50 text-blue-700',
    Cheque: 'bg-purple-50 text-purple-700',
    'Bank Transfer': 'bg-indigo-50 text-indigo-700',
    UPI: 'bg-teal-50 text-teal-700',
  };
  return map[mode] || 'bg-slate-100 text-slate-700';
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

// Metric card
const MetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
}> = ({ label, value, sub, color = 'text-slate-800', icon, trend }) => (
  <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        {trend && (
          <div className={`flex items-center gap-0.5 mt-1.5 text-[9px] font-bold ${trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value} vs last month
          </div>
        )}
      </div>
      <div className="p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
    </div>
  </div>
);

// ─── MODALS ───────────────────────────────────────────────────────────────────

// Payment Collection Modal
const PaymentModal: React.FC<{
  bill: HostelBill;
  onClose: () => void;
  onSuccess: (billId: number, amount: number, mode: string, txnId: string, remarks: string) => void;
}> = ({ bill, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(bill.balance_amount + bill.late_fee);
  const [mode, setMode] = useState<string>('Cash');
  const [txnId, setTxnId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { toast.error('Enter valid payment amount'); return; }
    if (amount > bill.balance_amount + bill.late_fee) { toast.error('Amount exceeds balance due'); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSuccess(bill.id, amount, mode, txnId, remarks);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Collect Payment</div>
              <div className="font-bold text-slate-900">{bill.bill_no}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Student info */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-slate-400 font-semibold">Student: </span><span className="font-bold text-slate-800">{bill.student_name}</span></div>
              <div><span className="text-slate-400 font-semibold">Adm No: </span><span className="font-mono text-slate-700">{bill.admission_no}</span></div>
              <div><span className="text-slate-400 font-semibold">Room: </span><span className="font-mono text-slate-700">{bill.room_no}</span></div>
              <div><span className="text-slate-400 font-semibold">Month: </span><span className="text-slate-700">{bill.bill_month}</span></div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Total Bill</div>
                <div className="font-bold text-slate-800">{formatCurrency(bill.total_amount)}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Paid</div>
                <div className="font-bold text-emerald-600">{formatCurrency(bill.paid_amount)}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase">Balance Due</div>
                <div className="font-bold text-rose-600">{formatCurrency(bill.balance_amount + bill.late_fee)}</div>
              </div>
            </div>
            {bill.late_fee > 0 && (
              <div className="mt-2 text-[9px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Late fee included: {formatCurrency(bill.late_fee)}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-4 py-2 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              {[bill.balance_amount + bill.late_fee].map(amt => (
                <button key={amt} type="button" onClick={() => setAmount(amt)}
                  className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold hover:bg-emerald-100 transition cursor-pointer">
                  Full: {formatCurrency(amt)}
                </button>
              ))}
              <button type="button" onClick={() => setAmount(Math.round((bill.balance_amount + bill.late_fee) / 2))}
                className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded font-bold hover:bg-slate-100 transition cursor-pointer">
                Half
              </button>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Payment Mode *</label>
            <div className="grid grid-cols-5 gap-1.5">
              {['Cash', 'Online', 'UPI', 'Cheque', 'Bank Transfer'].map(m => (
                <button key={m} type="button"
                  onClick={() => setMode(m)}
                  className={`py-1.5 px-2 text-[9px] font-bold rounded-lg border transition cursor-pointer ${mode === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID (for non-cash) */}
          {mode !== 'Cash' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Transaction / Reference ID</label>
              <input
                type="text"
                value={txnId}
                onChange={e => setTxnId(e.target.value)}
                className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="e.g. TXN123456 / UPI9876543 / CHQ00122"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</> : <><Check className="w-3.5 h-3.5" /> Collect {formatCurrency(amount)}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bill Detail / Receipt Modal
const BillDetailModal: React.FC<{
  bill: HostelBill;
  onClose: () => void;
  onPay: (bill: HostelBill) => void;
}> = ({ bill, onClose, onPay }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Receipt className="w-4 h-4" /></div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Bill</div>
            <div className="font-bold text-slate-900">{bill.bill_no}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
      </div>

      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Student Details */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm">
              {bill.student_name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-[13px]">{bill.student_name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{bill.admission_no}</div>
            </div>
            <div className="ml-auto">
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-bold ${statusBadge(bill.status)}`}>
                {statusIcon(bill.status)} {bill.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div><span className="text-slate-400">Room: </span><span className="font-bold text-slate-700 font-mono">{bill.room_no}</span></div>
            <div><span className="text-slate-400">Block: </span><span className="font-bold text-slate-700">{bill.block.split(' ')[0]} {bill.block.split(' ')[1]}</span></div>
            <div><span className="text-slate-400">Month: </span><span className="font-bold text-slate-700">{bill.bill_month}</span></div>
            <div><span className="text-slate-400">Bill Date: </span><span className="font-bold text-slate-700">{bill.created_at}</span></div>
            <div><span className="text-slate-400">Due Date: </span><span className="font-bold text-slate-700">{bill.due_date}</span></div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fee Breakdown</div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50">
                <tr className="text-slate-400 text-[9px] uppercase">
                  <th className="text-left px-3 py-2 font-bold">Component</th>
                  <th className="text-right px-3 py-2 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.components.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-700">{c.name}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
                {bill.late_fee > 0 && (
                  <tr className="bg-rose-50/50">
                    <td className="px-3 py-2 text-rose-600 font-semibold">Late Fee</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">{formatCurrency(bill.late_fee)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-800 text-white">
                <tr>
                  <td className="px-3 py-2.5 font-bold">Total Payable</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold">{formatCurrency(bill.total_amount + bill.late_fee)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Bill', val: formatCurrency(bill.total_amount + bill.late_fee), color: 'text-slate-800' },
            { label: 'Amount Paid', val: formatCurrency(bill.paid_amount), color: 'text-emerald-600' },
            { label: 'Balance Due', val: formatCurrency(bill.balance_amount + bill.late_fee), color: 'text-rose-600' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <div className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</div>
              <div className={`font-bold text-sm mt-0.5 ${item.color}`}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => toast.success(`Receipt ${bill.bill_no} sent to student's registered email`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 font-bold text-[11px] rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Send Receipt
          </button>
          <button
            onClick={() => toast.success('Print job queued – receipt opened in print preview')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 font-bold text-[11px] rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          {bill.balance_amount > 0 && (
            <button
              onClick={() => { onClose(); onPay(bill); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> Collect
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Fee Structure Modal
const FeeStructureModal: React.FC<{
  structure?: HostelFeeStructure | null;
  onClose: () => void;
  onSave: (data: Partial<HostelFeeStructure>) => void;
}> = ({ structure, onClose, onSave }) => {
  const [name, setName] = useState(structure?.name || '');
  const [roomType, setRoomType] = useState(structure?.room_type || '2-Seater AC');
  const [academicYear, setAcademicYear] = useState(structure?.academic_year || '2025-26');
  const [frequency, setFrequency] = useState<string>(structure?.frequency || 'Monthly');
  const [secDeposit, setSecDeposit] = useState(structure?.security_deposit || 10000);
  const [lateFeePerDay, setLateFeePerDay] = useState(structure?.late_fee_per_day || 50);
  const [graceDays, setGraceDays] = useState(structure?.grace_days || 5);
  const [components, setComponents] = useState<FeeComponent[]>(
    structure?.fee_components || [
      { name: 'Room Rent', amount: 0, is_optional: false },
      { name: 'Mess Charges', amount: 0, is_optional: false },
    ]
  );

  const addComponent = () => setComponents([...components, { name: '', amount: 0, is_optional: false }]);
  const removeComponent = (i: number) => setComponents(components.filter((_, idx) => idx !== i));
  const updateComponent = (i: number, field: keyof FeeComponent, value: any) => {
    const updated = [...components];
    (updated[i] as any)[field] = value;
    setComponents(updated);
  };

  const totalAmount = components.filter(c => !c.is_optional).reduce((s, c) => s + c.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter a fee structure name'); return; }
    if (components.some(c => !c.name.trim())) { toast.error('All fee components need a name'); return; }
    onSave({ name, room_type: roomType, academic_year: academicYear, frequency: frequency as any, security_deposit: secDeposit, late_fee_per_day: lateFeePerDay, grace_days: graceDays, fee_components: components, total_amount: totalAmount });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Wallet className="w-4 h-4" /></div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Fee Structure</div>
              <div className="font-bold text-slate-900">{structure ? 'Edit Structure' : 'Create New Structure'}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Structure Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Standard AC 2-Seater – 2025-26" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Room Type</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                {['Single AC', '2-Seater AC', '4-Seater AC', '2-Seater Non-AC', '4-Seater Non-AC', 'Dormitory'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Academic Year</label>
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                {['2024-25', '2025-26', '2026-27'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Billing Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                {['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Security Deposit (₹)</label>
              <input type="number" value={secDeposit} onChange={e => setSecDeposit(+e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Late Fee / Day (₹)</label>
              <input type="number" value={lateFeePerDay} onChange={e => setLateFeePerDay(+e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Grace Period (Days)</label>
              <input type="number" value={graceDays} onChange={e => setGraceDays(+e.target.value)} className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          {/* Fee Components */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-slate-700">Fee Components</div>
              <button type="button" onClick={addComponent} className="flex items-center gap-1 text-[9px] font-bold text-purple-700 hover:text-purple-800 cursor-pointer">
                <Plus className="w-3 h-3" /> Add Component
              </button>
            </div>
            <div className="space-y-2">
              {components.map((comp, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={e => updateComponent(i, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Component name"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                    <input
                      type="number"
                      value={comp.amount}
                      onChange={e => updateComponent(i, 'amount', +e.target.value)}
                      className="w-24 pl-5 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer select-none whitespace-nowrap">
                    <input type="checkbox" checked={comp.is_optional} onChange={e => updateComponent(i, 'is_optional', e.target.checked)} className="w-3 h-3 rounded" />
                    Optional
                  </label>
                  <button type="button" onClick={() => removeComponent(i)} className="p-1 text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 bg-slate-800 text-white rounded-lg px-3 py-2 flex justify-between text-[11px]">
              <span className="font-bold">Monthly Total (Mandatory Only)</span>
              <span className="font-mono font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1 sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer">
              {structure ? 'Update Structure' : 'Create Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type ActiveTab = 'dashboard' | 'bills' | 'payments' | 'structure' | 'dues' | 'generate';

const HostelFeeManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [bills, setBills] = useState<HostelBill[]>(MOCK_BILLS);
  const [payments, setPayments] = useState<PaymentRecord[]>(MOCK_PAYMENTS);
  const [feeStructures, setFeeStructures] = useState<HostelFeeStructure[]>(MOCK_FEE_STRUCTURES);
  const [dueAlerts] = useState<DueAlert[]>(MOCK_DUE_ALERTS);

  // Modals
  const [paymentBill, setPaymentBill] = useState<HostelBill | null>(null);
  const [viewBill, setViewBill] = useState<HostelBill | null>(null);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<HostelFeeStructure | null>(null);

  // Filters
  const [billSearch, setBillSearch] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('');
  const [billMonthFilter, setBillMonthFilter] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');

  // Generate Bills State
  const [generateMonth, setGenerateMonth] = useState('June 2026');
  const [generateBlock, setGenerateBlock] = useState('All');
  const [generating, setGenerating] = useState(false);

  // Computed Stats
  const totalBilled = bills.reduce((s, b) => s + b.total_amount, 0);
  const totalCollected = bills.reduce((s, b) => s + b.paid_amount, 0);
  const totalDue = bills.reduce((s, b) => s + b.balance_amount, 0);
  const totalLateFees = bills.reduce((s, b) => s + b.late_fee, 0);
  const overdueCount = bills.filter(b => b.status === 'Overdue').length;
  const paidCount = bills.filter(b => b.status === 'Paid').length;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Filtered bills
  const filteredBills = bills.filter(b => {
    const searchMatch = !billSearch || b.student_name.toLowerCase().includes(billSearch.toLowerCase()) || b.bill_no.toLowerCase().includes(billSearch.toLowerCase()) || b.admission_no.toLowerCase().includes(billSearch.toLowerCase()) || b.room_no.toLowerCase().includes(billSearch.toLowerCase());
    const statusMatch = !billStatusFilter || b.status === billStatusFilter;
    const monthMatch = !billMonthFilter || b.bill_month === billMonthFilter;
    return searchMatch && statusMatch && monthMatch;
  });

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const searchMatch = !paymentSearch || p.student_name.toLowerCase().includes(paymentSearch.toLowerCase()) || p.receipt_no.toLowerCase().includes(paymentSearch.toLowerCase()) || p.admission_no.toLowerCase().includes(paymentSearch.toLowerCase());
    const modeMatch = !paymentModeFilter || p.payment_mode === paymentModeFilter;
    return searchMatch && modeMatch;
  });

  // Payment handler
  const handlePaymentSuccess = (billId: number, amount: number, mode: string, txnId: string, remarks: string) => {
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      const newPaid = b.paid_amount + amount;
      const newBalance = Math.max(0, (b.total_amount + b.late_fee) - newPaid);
      const newStatus: HostelBill['status'] = newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : b.status;
      return { ...b, paid_amount: newPaid, balance_amount: newBalance, status: newStatus };
    }));

    const bill = bills.find(b => b.id === billId)!;
    const newPayment: PaymentRecord = {
      id: payments.length + 1,
      receipt_no: `HR-2026-0${(payments.length + 206).toString().padStart(3, '0')}`,
      bill_no: bill.bill_no,
      student_name: bill.student_name,
      admission_no: bill.admission_no,
      amount_paid: amount,
      payment_mode: mode as any,
      transaction_id: txnId || null,
      payment_date: new Date().toISOString().split('T')[0],
      received_by: 'Admin',
      remarks: remarks || null,
      bill_month: bill.bill_month,
    };
    setPayments(prev => [newPayment, ...prev]);
    setPaymentBill(null);
    toast.success(`✓ Payment of ${formatCurrency(amount)} collected! Receipt: ${newPayment.receipt_no}`);
  };

  // Generate bills handler
  const handleGenerateBills = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(`Successfully generated bills for ${generateMonth} – ${generateBlock === 'All' ? 'All Blocks' : generateBlock}. 54 bills created.`);
    }, 1800);
  };

  // Tabs
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'bills', label: 'Bills', icon: <FileText className="w-3.5 h-3.5" />, badge: overdueCount },
    { id: 'payments', label: 'Payments', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'structure', label: 'Fee Structure', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'dues', label: 'Due Alerts', icon: <Bell className="w-3.5 h-3.5" />, badge: dueAlerts.length },
    { id: 'generate', label: 'Generate Bills', icon: <Plus className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Management System</div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5">Fee & Billing Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Exporting billing report to Excel...')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold shadow-xs transition text-[10px] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button
            onClick={() => toast.success('Sending bulk payment reminders via SMS/WhatsApp...')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition text-[10px] cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Send Reminders
          </button>
          <button
            onClick={() => { setEditingStructure(null); setShowFeeStructureModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition text-[10px] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Structure
          </button>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] transition cursor-pointer relative ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {tab.icon} {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${activeTab === tab.id ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DASHBOARD                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <MetricCard label="Total Billed (June)" value={formatCurrency(totalBilled)} sub={`${bills.length} invoices generated`} color="text-slate-800" icon={<FileText className="w-4 h-4 text-slate-500" />} trend={{ value: '+12%', up: true }} />
            <MetricCard label="Amount Collected" value={formatCurrency(totalCollected)} sub={`${collectionRate}% collection rate`} color="text-emerald-600" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} trend={{ value: '+8%', up: true }} />
            <MetricCard label="Outstanding Dues" value={formatCurrency(totalDue)} sub={`${overdueCount} overdue accounts`} color="text-rose-600" icon={<AlertCircle className="w-4 h-4 text-rose-500" />} trend={{ value: '-5%', up: false }} />
            <MetricCard label="Late Fee Revenue" value={formatCurrency(totalLateFees)} sub="Auto-calculated per policy" color="text-amber-600" icon={<BadgePercent className="w-4 h-4 text-amber-500" />} />
          </div>

          {/* Collection Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-900">Collection Progress – June 2026</div>
                <span className="text-[10px] font-bold text-emerald-600">{collectionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${collectionRate}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Fully Paid', count: paidCount, color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
                  { label: 'Partial Payment', count: bills.filter(b => b.status === 'Partial').length, color: 'text-amber-600', dotColor: 'bg-amber-500' },
                  { label: 'Pending', count: bills.filter(b => b.status === 'Pending').length, color: 'text-blue-600', dotColor: 'bg-blue-500' },
                  { label: 'Overdue', count: overdueCount, color: 'text-rose-600', dotColor: 'bg-rose-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dotColor}`} />
                    <div>
                      <div className="text-[9px] text-slate-400 font-semibold">{item.label}</div>
                      <div className={`font-bold text-sm ${item.color}`}>{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Mode Breakdown */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="font-bold text-slate-900 mb-3">Payment Mode Breakdown</div>
              <div className="space-y-2.5">
                {[
                  { mode: 'Online / UPI', amount: 14000, pct: 38, color: 'bg-blue-500' },
                  { mode: 'Cash', amount: 5000, pct: 14, color: 'bg-amber-500' },
                  { mode: 'Bank Transfer', amount: 8500, pct: 23, color: 'bg-indigo-500' },
                  { mode: 'Cheque', amount: 8500, pct: 23, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.mode} className="flex items-center gap-2">
                    <div className="text-[10px] text-slate-500 w-24 flex-shrink-0">{item.mode}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 w-16 text-right font-mono">{formatCurrency(item.amount)}</div>
                    <div className="text-[9px] text-slate-400 w-8 text-right">{item.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-slate-900">Recent Transactions</div>
              <button onClick={() => setActiveTab('payments')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">View All →</button>
            </div>
            <div className="space-y-2">
              {payments.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">{p.student_name}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{p.receipt_no} · {p.bill_month}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-emerald-600">{formatCurrency(p.amount_paid)}</div>
                    <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${paymentModeBadge(p.payment_mode)}`}>{p.payment_mode}</div>
                  </div>
                  <div className="text-[9px] text-slate-400 w-20 text-right">{p.payment_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: BILLS                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bills' && (
        <div className="space-y-3">
          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, bill number, room, admission no..."
                value={billSearch}
                onChange={e => setBillSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={billStatusFilter} onChange={e => setBillStatusFilter(e.target.value)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium outline-none">
                <option value="">All Status</option>
                {['Paid', 'Partial', 'Pending', 'Overdue', 'Waived'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={billMonthFilter} onChange={e => setBillMonthFilter(e.target.value)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium outline-none">
                <option value="">All Months</option>
                {['June 2026', 'May 2026', 'April 2026'].map(m => <option key={m}>{m}</option>)}
              </select>
              <button onClick={() => { setBillSearch(''); setBillStatusFilter(''); setBillMonthFilter(''); }} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-lg transition cursor-pointer" title="Clear Filters">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: 'All', count: bills.length, color: 'text-slate-700', bg: 'bg-slate-100', key: '' },
              { label: 'Paid', count: bills.filter(b => b.status === 'Paid').length, color: 'text-emerald-700', bg: 'bg-emerald-50', key: 'Paid' },
              { label: 'Partial', count: bills.filter(b => b.status === 'Partial').length, color: 'text-amber-700', bg: 'bg-amber-50', key: 'Partial' },
              { label: 'Pending', count: bills.filter(b => b.status === 'Pending').length, color: 'text-blue-700', bg: 'bg-blue-50', key: 'Pending' },
              { label: 'Overdue', count: bills.filter(b => b.status === 'Overdue').length, color: 'text-rose-700', bg: 'bg-rose-50', key: 'Overdue' },
            ].map(item => (
              <button key={item.label} onClick={() => setBillStatusFilter(item.key)}
                className={`${item.bg} rounded-xl p-2.5 border transition cursor-pointer text-left ${billStatusFilter === item.key ? 'ring-2 ring-offset-1 ring-emerald-400 border-emerald-200' : 'border-transparent hover:ring-1 hover:ring-slate-200'}`}>
                <div className={`text-[9px] font-bold uppercase tracking-wide ${item.color}`}>{item.label}</div>
                <div className={`text-lg font-bold mt-0.5 ${item.color}`}>{item.count}</div>
              </button>
            ))}
          </div>

          {/* Bills Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 text-[9px] uppercase">
                    <th className="text-left px-4 py-2.5 font-bold">Bill No</th>
                    <th className="text-left px-4 py-2.5 font-bold">Student</th>
                    <th className="text-left px-4 py-2.5 font-bold">Room</th>
                    <th className="text-left px-4 py-2.5 font-bold">Month</th>
                    <th className="text-right px-4 py-2.5 font-bold">Bill Amt</th>
                    <th className="text-right px-4 py-2.5 font-bold">Paid</th>
                    <th className="text-right px-4 py-2.5 font-bold">Balance</th>
                    <th className="text-center px-4 py-2.5 font-bold">Status</th>
                    <th className="text-center px-4 py-2.5 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-10 text-slate-400"><Search className="w-6 h-6 mx-auto mb-2 opacity-30" /><div>No bills found matching your filters</div></td></tr>
                  ) : filteredBills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{bill.bill_no}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{bill.student_name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{bill.admission_no}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-700">{bill.room_no}</div>
                        <div className="text-[9px] text-slate-400">{bill.block.split(' ')[0]} {bill.block.split(' ')[1]}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{bill.bill_month}</div>
                        <div className="text-[9px] text-slate-400">Due: {bill.due_date}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(bill.total_amount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(bill.paid_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-mono font-bold ${bill.balance_amount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{formatCurrency(bill.balance_amount)}</div>
                        {bill.late_fee > 0 && <div className="text-[9px] text-rose-500">+{formatCurrency(bill.late_fee)} late</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusBadge(bill.status)}`}>
                          {statusIcon(bill.status)} {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setViewBill(bill)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer" title="View Bill"><Eye className="w-3.5 h-3.5" /></button>
                          {bill.balance_amount > 0 && (
                            <button onClick={() => setPaymentBill(bill)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Collect Payment">
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => toast.success(`Receipt sent to ${bill.student_name}`)} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition cursor-pointer" title="Send Receipt"><Send className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toast.success('Bill downloaded as PDF')} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition cursor-pointer" title="Print"><Printer className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: PAYMENTS                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search by student name, receipt no, admission no..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium outline-none">
                <option value="">All Modes</option>
                {['Cash', 'Online', 'UPI', 'Cheque', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
              </select>
              <button onClick={() => toast.success('Exporting payment ledger to Excel...')} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[10px] transition cursor-pointer">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>

          {/* Payment Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Receipts', val: payments.length, suffix: '', color: 'text-slate-800' },
              { label: 'Cash Collected', val: formatCurrency(payments.filter(p => p.payment_mode === 'Cash').reduce((s, p) => s + p.amount_paid, 0)), suffix: '', color: 'text-amber-700' },
              { label: 'Online / UPI', val: formatCurrency(payments.filter(p => ['Online', 'UPI'].includes(p.payment_mode)).reduce((s, p) => s + p.amount_paid, 0)), suffix: '', color: 'text-blue-700' },
              { label: 'Total Revenue', val: formatCurrency(payments.reduce((s, p) => s + p.amount_paid, 0)), suffix: '', color: 'text-emerald-700' },
            ].map(item => (
              <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</div>
                <div className={`text-lg font-bold mt-1 ${item.color}`}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Payments Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 text-[9px] uppercase">
                    <th className="text-left px-4 py-2.5 font-bold">Receipt No</th>
                    <th className="text-left px-4 py-2.5 font-bold">Student</th>
                    <th className="text-left px-4 py-2.5 font-bold">Bill No</th>
                    <th className="text-left px-4 py-2.5 font-bold">Month</th>
                    <th className="text-right px-4 py-2.5 font-bold">Amount</th>
                    <th className="text-center px-4 py-2.5 font-bold">Mode</th>
                    <th className="text-left px-4 py-2.5 font-bold">Txn ID</th>
                    <th className="text-center px-4 py-2.5 font-bold">Date</th>
                    <th className="text-center px-4 py-2.5 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-10 text-slate-400">No payments found</td></tr>
                  ) : filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.receipt_no}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.student_name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{p.admission_no}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{p.bill_no}</td>
                      <td className="px-4 py-3 text-slate-600">{p.bill_month}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(p.amount_paid)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${paymentModeBadge(p.payment_mode)}`}>{p.payment_mode}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{p.transaction_id || '—'}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{p.payment_date}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toast.success(`Receipt ${p.receipt_no} opened for print`)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer" title="Print Receipt"><Printer className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toast.success(`Receipt sent to ${p.student_name}`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition cursor-pointer" title="Email Receipt"><Send className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: FEE STRUCTURE                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'structure' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-500">{feeStructures.length} fee structures configured</div>
            <button onClick={() => { setEditingStructure(null); setShowFeeStructureModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {feeStructures.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900 text-[13px]">{s.name}</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5 flex items-center gap-2">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">{s.room_type}</span>
                      <span>{s.frequency}</span>
                      <span>{s.academic_year}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Components */}
                <div className="space-y-1.5 mb-3">
                  {s.fee_components.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 flex items-center gap-1">
                        {comp.is_optional && <span className="text-[8px] text-slate-400 bg-slate-100 px-1 rounded">opt</span>}
                        {comp.name}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{formatCurrency(comp.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Mandatory Total</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(s.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Security Deposit</span>
                    <span className="font-mono text-slate-600">{formatCurrency(s.security_deposit)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Late Fee / Day</span>
                    <span className="font-mono text-rose-600">{formatCurrency(s.late_fee_per_day)} (after {s.grace_days}d)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => { setEditingStructure(s); setShowFeeStructureModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => {
                    setFeeStructures(prev => prev.map(fs => fs.id === s.id ? { ...fs, is_active: !fs.is_active } : fs));
                    toast.success(`Structure ${s.is_active ? 'deactivated' : 'activated'}`);
                  }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 border font-bold text-[10px] rounded-lg transition cursor-pointer ${s.is_active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                    {s.is_active ? <><XCircle className="w-3 h-3" /> Deactivate</> : <><CheckCircle className="w-3 h-3" /> Activate</>}
                  </button>
                  <button onClick={() => toast.success(`Structure assigned to all ${s.room_type} rooms`)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">
                    <ArrowUpRight className="w-3 h-3" /> Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DUE ALERTS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dues' && (
        <div className="space-y-3">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-800">{dueAlerts.length} Students with Outstanding Dues</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Total outstanding: {formatCurrency(dueAlerts.reduce((s, a) => s + a.due_amount, 0))} — Automatic reminders can be sent below.</div>
            </div>
            <button onClick={() => toast.success(`SMS/WhatsApp reminders sent to ${dueAlerts.length} defaulters`)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition flex-shrink-0 cursor-pointer">
              <Send className="w-3.5 h-3.5" /> Send All Reminders
            </button>
          </div>

          <div className="space-y-2">
            {dueAlerts.map((alert, i) => (
              <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {alert.student_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold text-slate-900">{alert.student_name}</div>
                      <span className="text-[9px] font-mono text-slate-400">{alert.admission_no}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-mono">{alert.room_no}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Due since {alert.due_since} · {alert.months_pending} month{alert.months_pending > 1 ? 's' : ''} pending · Contact: {alert.contact}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-rose-600">{formatCurrency(alert.due_amount)}</div>
                    <div className="text-[9px] text-rose-500">Outstanding</div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => toast.success(`Payment reminder sent to ${alert.student_name} (${alert.contact})`)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[9px] rounded-lg transition cursor-pointer">
                      <Bell className="w-3 h-3" /> Remind
                    </button>
                    <button onClick={() => {
                      const bill = bills.find(b => b.admission_no === alert.admission_no && b.balance_amount > 0);
                      if (bill) setPaymentBill(bill);
                      else toast.success('Opening payment for ' + alert.student_name);
                    }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg transition cursor-pointer">
                      <CreditCard className="w-3 h-3" /> Pay Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Waiver / Write-off Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-3 flex items-center gap-2"><BadgePercent className="w-4 h-4 text-purple-500" /> Fee Waiver / Concession Panel</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Student Admission No</label>
                <input type="text" className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="ADM-2026-0071" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Waiver Amount (₹)</label>
                <input type="number" className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Reason</label>
                <input type="text" className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Merit / Financial Hardship / etc." />
              </div>
            </div>
            <button onClick={() => toast.success('Fee waiver applied and approval request sent to Principal')}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Apply Waiver (Requires Approval)
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: GENERATE BILLS                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Calendar className="w-4 h-4" /></div>
              <div>
                <div className="font-bold text-slate-900">Generate Monthly Bills</div>
                <div className="text-[10px] text-slate-500">Auto-calculate and create hostel fee invoices for all active residents</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Billing Month *</label>
                <select value={generateMonth} onChange={e => setGenerateMonth(e.target.value)}
                  className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['June 2026', 'July 2026', 'August 2026', 'September 2026'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Block / Wing</label>
                <select value={generateBlock} onChange={e => setGenerateBlock(e.target.value)}
                  className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['All', 'Block A (Boys)', 'Block B (Girls)'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Due Date</label>
                <input type="date" defaultValue="2026-07-10"
                  className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Include Late Fee?</label>
                <select className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Yes – Auto Calculate</option>
                  <option>No – Skip Late Fee</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Preview</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Active Residents', val: '54', icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
                  { label: 'Block A (Boys)', val: '32', icon: <Building className="w-3.5 h-3.5 text-indigo-500" /> },
                  { label: 'Block B (Girls)', val: '22', icon: <Building className="w-3.5 h-3.5 text-pink-500" /> },
                  { label: 'Estimated Revenue', val: '₹4,24,500', icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-2.5">
                    {item.icon}
                    <div>
                      <div className="text-[9px] text-slate-400 font-semibold">{item.label}</div>
                      <div className="font-bold text-slate-800">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerateBills}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-60"
              >
                {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Bills...</> : <><Plus className="w-4 h-4" /> Generate {generateMonth} Bills</>}
              </button>
              <button
                onClick={() => toast.success('Dry run complete – no bills were saved. All 54 calculations look correct!')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Dry Run (Preview Only)
              </button>
            </div>
          </div>

          {/* Auto-generation settings */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
            <div className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-500" /> Auto-Generation Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Auto-generate bills on 1st of every month', enabled: true },
                { label: 'Auto-apply late fee after grace period', enabled: true },
                { label: 'Auto-send SMS alert on bill generation', enabled: false },
                { label: 'Auto-send WhatsApp notification to parents', enabled: true },
                { label: 'Auto-escalate dues after 30 days', enabled: false },
                { label: 'Auto-waive late fee on 1st default', enabled: false },
              ].map((item, i) => (
                <label key={i} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 cursor-pointer hover:bg-slate-100 transition">
                  <span className="text-[11px] font-medium text-slate-700">{item.label}</span>
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              ))}
            </div>
            <button onClick={() => toast.success('Auto-generation settings saved!')}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {paymentBill && (
        <PaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {viewBill && (
        <BillDetailModal
          bill={viewBill}
          onClose={() => setViewBill(null)}
          onPay={(b) => { setPaymentBill(b); setViewBill(null); }}
        />
      )}

      {showFeeStructureModal && (
        <FeeStructureModal
          structure={editingStructure}
          onClose={() => { setShowFeeStructureModal(false); setEditingStructure(null); }}
          onSave={(data) => {
            if (editingStructure) {
              setFeeStructures(prev => prev.map(s => s.id === editingStructure.id ? { ...s, ...data } as HostelFeeStructure : s));
              toast.success('Fee structure updated successfully!');
            } else {
              const newStructure: HostelFeeStructure = { ...data, id: feeStructures.length + 1, is_active: true } as HostelFeeStructure;
              setFeeStructures(prev => [...prev, newStructure]);
              toast.success('New fee structure created!');
            }
            setShowFeeStructureModal(false);
            setEditingStructure(null);
          }}
        />
      )}
    </div>
  );
};

export default HostelFeeManager;
