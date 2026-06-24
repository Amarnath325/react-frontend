import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, ChevronDown, ChevronUp, Eye, Trash2, FileText,
  Flag, MessageSquare, Globe, Zap, BarChart2, Smartphone,
  BellOff, BellRing, ToggleLeft, ToggleRight, RotateCcw, Save,
  Users, User, GraduationCap, Info, Tag, Edit3, CheckCircle,
  XCircle, AlertCircle, MoreVertical, Layers, ChevronRight,
  Clock, MapPin, Share2, Sparkles, PieChart, DollarSign, Download, FileSpreadsheet
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'defaulters' | 'automated' | 'templates' | 'payments' | 'analytics';
type FeeCategory = 'tuition' | 'transport' | 'hostel' | 'exam' | 'other';
type RemindStatus = 'reminded' | 'overdue' | 'not_reminded';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface DefaulterItem {
  id: number;
  studentName: string;
  admissionNo: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  pendingAmount: number;
  dueDate: string;
  lastRemindedDate?: string;
  remindCount: number;
  status: RemindStatus;
  category: FeeCategory;
}

interface PaymentConfirmation {
  id: number;
  studentName: string;
  className: string;
  amountPaid: number;
  receiptNo: string;
  paidAt: string;
  channel: NotifChannel;
  status: 'sent' | 'failed';
}

interface ReminderSchedule {
  id: number;
  name: string;
  triggerDays: string; // e.g., "7 days before due", "1 day before due", "Daily if overdue"
  channel: NotifChannel;
  isEnabled: boolean;
  templateId: number;
}

interface ReminderTemplate {
  id: number;
  name: string;
  category: 'before_due' | 'on_due' | 'after_due' | 'receipt';
  channel: NotifChannel;
  body: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_DEFAULTERS: DefaulterItem[] = [
  {
    id: 1, studentName: 'Rohan Sharma', admissionNo: 'DPS/2022/1045', className: '10-A',
    parentName: 'Mr. Ramesh Sharma', parentPhone: '+91 98765 43210', parentEmail: 'ramesh.sharma@gmail.com',
    pendingAmount: 18500, dueDate: '2026-06-30', lastRemindedDate: '2026-06-20', remindCount: 2,
    status: 'reminded', category: 'tuition'
  },
  {
    id: 2, studentName: 'Priyanshu Roy', admissionNo: 'DPS/2021/0987', className: '12-B',
    parentName: 'Mr. Alok Roy', parentPhone: '+91 98123 45678', parentEmail: 'alok.roy@yahoo.com',
    pendingAmount: 24000, dueDate: '2026-06-30', remindCount: 0,
    status: 'not_reminded', category: 'tuition'
  },
  {
    id: 3, studentName: 'Sakshi Deshmukh', admissionNo: 'DPS/2023/1230', className: '9-C',
    parentName: 'Mrs. Anita Deshmukh', parentPhone: '+91 97654 32109', parentEmail: 'anita.desh@gmail.com',
    pendingAmount: 4500, dueDate: '2026-06-15', lastRemindedDate: '2026-06-18', remindCount: 4,
    status: 'overdue', category: 'transport'
  },
  {
    id: 4, studentName: 'Kunal Verma', admissionNo: 'DPS/2024/2045', className: '8-B',
    parentName: 'Mr. Rajesh Verma', parentPhone: '+91 99887 76655', parentEmail: 'rajesh.v@outlook.com',
    pendingAmount: 12000, dueDate: '2026-06-10', lastRemindedDate: '2026-06-15', remindCount: 3,
    status: 'overdue', category: 'hostel'
  },
  {
    id: 5, studentName: 'Aditya Sen', admissionNo: 'DPS/2022/1120', className: '10-B',
    parentName: 'Mrs. Keya Sen', parentPhone: '+91 91234 56789', parentEmail: 'keyasen@gmail.com',
    pendingAmount: 18500, dueDate: '2026-06-30', lastRemindedDate: '2026-06-22', remindCount: 1,
    status: 'reminded', category: 'tuition'
  },
  {
    id: 6, studentName: 'Sneha Gupta', admissionNo: 'DPS/2023/0410', className: '7-A',
    parentName: 'Mr. Sanjay Gupta', parentPhone: '+91 98563 12457', parentEmail: 'sanjay.g@gmail.com',
    pendingAmount: 1500, dueDate: '2026-06-20', lastRemindedDate: '2026-06-21', remindCount: 2,
    status: 'overdue', category: 'exam'
  },
  {
    id: 7, studentName: 'Ridhima Paul', admissionNo: 'DPS/2020/0745', className: '11-A',
    parentName: 'Mr. Sumit Paul', parentPhone: '+91 99334 45566', parentEmail: 'sumit.paul@live.in',
    pendingAmount: 18500, dueDate: '2026-06-30', remindCount: 0,
    status: 'not_reminded', category: 'tuition'
  }
];

const MOCK_CONFIRMATIONS: PaymentConfirmation[] = [
  { id: 1, studentName: 'Rohan Sharma', className: '10-A', amountPaid: 18500, receiptNo: 'REC-2026-9840', paidAt: '2026-06-24 10:30 AM', channel: 'all', status: 'sent' },
  { id: 2, studentName: 'Kunal Verma', className: '8-B', amountPaid: 12000, receiptNo: 'REC-2026-9841', paidAt: '2026-06-24 11:15 AM', channel: 'push', status: 'sent' },
  { id: 3, studentName: 'Tanya Goel', className: '12-A', amountPaid: 18500, receiptNo: 'REC-2026-9839', paidAt: '2026-06-23 03:45 PM', channel: 'sms', status: 'sent' },
  { id: 4, studentName: 'Aarav Mishra', className: '9-A', amountPaid: 4500, receiptNo: 'REC-2026-9838', paidAt: '2026-06-23 01:20 PM', channel: 'email', status: 'sent' }
];

const MOCK_TEMPLATES: ReminderTemplate[] = [
  { id: 1, name: 'Standard Due Advance (7 Days)', category: 'before_due', channel: 'all', body: 'Dear Parent, this is a friendly reminder that the Quarter 2 fee of ₹{amount} for {student} (Class {class}) is due on {date}. Kindly clear the dues before the deadline. Ignore if already paid. - Delhi Public School' },
  { id: 2, name: 'Due Date Reminder (Day-Of)', category: 'on_due', channel: 'all', body: 'CRITICAL ALERT: Dear Parent, today ({date}) is the final day to pay the Q2 fee of ₹{amount} for {student}. Please pay online via the school app to avoid late charges. - DPS Accounts' },
  { id: 3, name: 'Overdue Alert (Post-Due)', category: 'after_due', channel: 'sms', body: 'WARNING: Dear Parent, the Q2 fee of ₹{amount} for {student} is now OVERDUE by {days} days. Late fine of ₹50/day is applicable. Please clear immediately. - Accounts DPS' },
  { id: 4, name: 'Payment Success Slip', category: 'receipt', channel: 'all', body: 'Receipt: Dear Parent, we have received your payment of ₹{amount} for {student} (Class {class}). Receipt No: {receipt}. Thank you for your cooperation! - DPS accounts' }
];

const MOCK_SCHEDULES: ReminderSchedule[] = [
  { id: 1, name: '7-Day Pre-Due Reminder', triggerDays: '7 days before due', channel: 'all', isEnabled: true, templateId: 1 },
  { id: 2, name: '3-Day Pre-Due Reminder', triggerDays: '3 days before due', channel: 'push', isEnabled: true, templateId: 1 },
  { id: 3, name: 'Due Date Notification', triggerDays: 'On due date', channel: 'all', isEnabled: true, templateId: 2 },
  { id: 4, name: 'Overdue Nudge (Daily)', triggerDays: 'Daily if overdue', channel: 'sms', isEnabled: true, templateId: 3 }
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<FeeCategory, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  tuition: { label: 'Tuition Fee', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', emoji: '🏫' },
  transport: { label: 'Transport Fee', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', emoji: '🚌' },
  hostel: { label: 'Hostel Rent', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', emoji: '🏢' },
  exam: { label: 'Exam & Lab Fee', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', emoji: '🔬' },
  other: { label: 'Miscellaneous', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', emoji: '🎟️' }
};

const STATUS_CFG: Record<RemindStatus, { label: string; color: string; bg: string; dot: string }> = {
  reminded: { label: 'Reminded', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  overdue: { label: 'Overdue Alert', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
  not_reminded: { label: 'Unnotified', color: 'text-slate-600', bg: 'bg-slate-50', dot: 'bg-slate-400' }
};

const CHANNEL_CFG: Record<NotifChannel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  push: { label: 'Push Notification', color: 'text-violet-700', bg: 'bg-violet-100', icon: <Smartphone className="w-3 h-3" /> },
  sms: { label: 'SMS Gateway', color: 'text-teal-700', bg: 'bg-teal-100', icon: <MessageSquare className="w-3 h-3" /> },
  email: { label: 'Email Gateway', color: 'text-blue-700', bg: 'bg-blue-100', icon: <FileText className="w-3 h-3" /> },
  all: { label: 'All Channels', color: 'text-slate-700', bg: 'bg-slate-100', icon: <Globe className="w-3 h-3" /> }
};

const CATEGORY_TEMPLATE_CFG = {
  before_due: { label: 'Pre-Due Alert', color: 'text-blue-700', bg: 'bg-blue-50' },
  on_due: { label: 'Due Date Nudge', color: 'text-amber-700', bg: 'bg-amber-50' },
  after_due: { label: 'Overdue Escalation', color: 'text-red-700', bg: 'bg-red-50' },
  receipt: { label: 'Receipt Confirmation', color: 'text-emerald-700', bg: 'bg-emerald-50' }
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const FeeReminderManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('defaulters');
  const [defaulters, setDefaulters] = useState<DefaulterItem[]>(MOCK_DEFAULTERS);
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>(MOCK_CONFIRMATIONS);
  const [templates, setTemplates] = useState<ReminderTemplate[]>(MOCK_TEMPLATES);
  const [schedules, setSchedules] = useState<ReminderSchedule[]>(MOCK_SCHEDULES);
  const [selectedStudent, setSelectedStudent] = useState<DefaulterItem | null>(MOCK_DEFAULTERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<FeeCategory | 'all'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(MOCK_TEMPLATES[0].id);
  const [customText, setCustomText] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [checkedStudents, setCheckedStudents] = useState<number[]>([]);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [editTemplateBody, setEditTemplateBody] = useState('');

  // ── Derived Stats ──
  const totalDues = defaulters.reduce((acc, d) => acc + d.pendingAmount, 0);
  const totalOverdue = defaulters.filter(d => d.status === 'overdue').reduce((acc, d) => acc + d.pendingAmount, 0);
  const totalReminded = defaulters.filter(d => d.remindCount > 0).length;
  const averageOverdueDays = 14; // Mock representation

  // Filtered Defaulters
  const filteredDefaulters = defaulters.filter(d => {
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (filterClass !== 'all' && d.className !== filterClass) return false;
    if (searchQuery && !d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.parentName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Unique class list for filter
  const classList = Array.from(new Set(defaulters.map(d => d.className))).sort();

  // Handlers
  const handleCheckboxChange = (id: number) => {
    setCheckedStudents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (checkedStudents.length === filteredDefaulters.length) {
      setCheckedStudents([]);
    } else {
      setCheckedStudents(filteredDefaulters.map(d => d.id));
    }
  };

  const sendSingleReminder = async (student: DefaulterItem) => {
    setSendingId(student.id);
    await new Promise(r => setTimeout(r, 1200));
    setSendingId(null);

    setDefaulters(prev => prev.map(d => d.id === student.id
      ? {
          ...d,
          remindCount: d.remindCount + 1,
          status: d.status === 'not_reminded' ? 'reminded' : d.status,
          lastRemindedDate: new Date().toISOString().split('T')[0]
        }
      : d));

    if (selectedStudent?.id === student.id) {
      setSelectedStudent(prev => prev ? {
        ...prev,
        remindCount: prev.remindCount + 1,
        status: prev.status === 'not_reminded' ? 'reminded' : prev.status,
        lastRemindedDate: new Date().toISOString().split('T')[0]
      } : null);
    }

    toast.success(`📲 Reminder successfully dispatched to parent of ${student.studentName}!`);
  };

  const sendBulkReminders = async () => {
    if (checkedStudents.length === 0) { toast.error('Please select at least one student'); return; }
    setSendingBulk(true);
    await new Promise(r => setTimeout(r, 2000));
    setSendingBulk(false);

    setDefaulters(prev => prev.map(d => checkedStudents.includes(d.id)
      ? {
          ...d,
          remindCount: d.remindCount + 1,
          status: d.status === 'not_reminded' ? 'reminded' : d.status,
          lastRemindedDate: new Date().toISOString().split('T')[0]
        }
      : d));

    toast.success(`🚀 Bulk reminders dispatched to ${checkedStudents.length} parents!`);
    setCheckedStudents([]);
  };

  const toggleSchedule = (id: number) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
    const sched = schedules.find(s => s.id === id);
    toast.success(`Automated task "${sched?.name}" ${sched?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  const handleSaveTemplate = (id: number) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, body: editTemplateBody } : t));
    setEditTemplateId(null);
    toast.success('Template updated successfully');
  };

  const executeReceiptSend = async (conf: PaymentConfirmation) => {
    toast.loading('Dispatching receipt alert...', { duration: 800 });
    await new Promise(r => setTimeout(r, 800));
    toast.success(`Slip alert for ${conf.receiptNo} sent!`);
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Fee Reminder Manager</h1>
            <p className="text-[9px] text-emerald-100 font-medium">Clear Outstanding Dues · Bulk Alerts · Payment Confirmations · Automated Rules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[9px] font-bold">₹{totalOverdue.toLocaleString()} Overdue</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Bell className="w-3 h-3 text-emerald-200" />
            <span className="text-[9px] font-bold text-emerald-100">{totalReminded} Reminded</span>
          </div>
          {checkedStudents.length > 0 && (
            <button onClick={sendBulkReminders} disabled={sendingBulk}
              className="flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
              {sendingBulk ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Remind Selected ({checkedStudents.length})
            </button>
          )}
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 border-b border-emerald-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Total Pending Dues', val: `₹${totalDues.toLocaleString()}`, icon: <DollarSign className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Critically Overdue', val: `₹${totalOverdue.toLocaleString()}`, icon: <Flag className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Reminders Sent', val: totalReminded, icon: <Bell className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Defaulter Students', val: defaulters.length, icon: <Users className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Automated Rules', val: schedules.filter(s => s.isEnabled).length, icon: <Settings className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' }
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'defaulters', label: 'Defaulter Index',     icon: <Users className="w-3.5 h-3.5" />, badge: defaulters.length },
          { key: 'automated',  label: 'Remind Schedules',    icon: <Clock className="w-3.5 h-3.5" /> },
          { key: 'templates',  label: 'Message Templates',   icon: <FileText className="w-3.5 h-3.5" /> },
          { key: 'payments',   label: 'Payment Slips Log',   icon: <CheckCircle className="w-3.5 h-3.5" />, badge: confirmations.length },
          { key: 'analytics',  label: 'Collection Graphs',   icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-emerald-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ DEFAULTERS INDEX ═════════ */}
        {activeTab === 'defaulters' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Defaulters List */}
            <div className="w-96 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by student, admission, parent…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                  <button onClick={() => toast.success('Exporting list to CSV...')}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer" title="Export Excel">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Classes</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as FeeCategory | 'all')}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Index rows */}
              <div className="flex-1 divide-y divide-slate-150">
                {filteredDefaulters.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CreditCard className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No pending defaulters match filters</p>
                  </div>
                )}

                {/* Table Header Row (Select All) */}
                {filteredDefaulters.length > 0 && (
                  <div className="px-3 py-2 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox"
                        checked={checkedStudents.length === filteredDefaulters.length && filteredDefaulters.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-300" />
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Select All ({filteredDefaulters.length})</span>
                    </label>
                  </div>
                )}

                {filteredDefaulters.map(student => {
                  const cat = CATEGORY_CFG[student.category];
                  const cs = STATUS_CFG[student.status];
                  const isSelected = selectedStudent?.id === student.id;
                  const isChecked = checkedStudents.includes(student.id);

                  return (
                    <div key={student.id}
                      className={`px-3 py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-emerald-50/10 transition ${isSelected ? 'bg-emerald-50/25 border-l-2 border-emerald-500' : ''}`}>

                      <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange(student.id)}
                        className="mt-1 rounded border-slate-300 text-emerald-500 focus:ring-emerald-300 cursor-pointer" />

                      <div className="flex-1 min-w-0" onClick={() => setSelectedStudent(student)}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[10px] font-bold text-slate-800 truncate">{student.studentName}</p>
                          <span className="text-[10px] font-extrabold text-slate-700">₹{student.pendingAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1">
                          <span>Class {student.className} · {student.admissionNo}</span>
                          <span className="font-mono text-red-500 font-bold">Due {student.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${cs.bg} ${cs.color}`}>
                            <span className={`w-1 h-1 rounded-full ${cs.dot}`} /> {cs.label}
                          </span>
                          {student.remindCount > 0 && (
                            <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-violet-50 border border-violet-100 text-violet-600 rounded-full">
                              Reminded {student.remindCount}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Defaulter Detail Card & Composer */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <CreditCard className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select a student to inspect and alert</p>
                </div>
              ) : (() => {
                const s = selectedStudent;
                const cat = CATEGORY_CFG[s.category];
                const cs = STATUS_CFG[s.status];
                return (
                  <div className="space-y-4 max-w-xl">

                    {/* Student Info Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-[7.5px] text-slate-400 uppercase tracking-widest font-mono">Admission No: {s.admissionNo}</p>
                          <h2 className="text-[13px] font-extrabold tracking-tight mt-0.5">{s.studentName}</h2>
                          <p className="text-[9px] text-slate-300 font-medium">Class {s.className} · {cat.emoji} {cat.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7.5px] text-slate-400 uppercase">Outstanding Due</p>
                          <p className="text-[15px] font-extrabold text-emerald-400">₹{s.pendingAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5">
                        {/* Parent contact matrix */}
                        <div>
                          <h4 className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Parent Contact Matrix</h4>
                          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 border border-slate-150 rounded-xl">
                            <div>
                              <p className="text-[7.5px] text-slate-400">Father/Guardian</p>
                              <p className="text-[9px] font-bold text-slate-700 mt-0.5">{s.parentName}</p>
                            </div>
                            <div>
                              <p className="text-[7.5px] text-slate-400">Mobile Phone</p>
                              <p className="text-[9px] font-bold text-slate-700 mt-0.5">{s.parentPhone}</p>
                            </div>
                            <div className="col-span-2 border-t border-slate-200 pt-2">
                              <p className="text-[7.5px] text-slate-400">E-mail Address</p>
                              <p className="text-[9px] font-bold text-slate-700 mt-0.5">{s.parentEmail}</p>
                            </div>
                          </div>
                        </div>

                        {/* Reminder Audit Logs */}
                        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                          <div className="text-center">
                            <p className="text-[7.5px] text-slate-400 font-medium uppercase">Last Reminded</p>
                            <p className="text-[9.5px] font-bold text-slate-700 mt-0.5">{s.lastRemindedDate || 'Never'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[7.5px] text-slate-400 font-medium uppercase">Total Nudges</p>
                            <p className="text-[9.5px] font-bold text-slate-700 mt-0.5">{s.remindCount} dispatches</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[7.5px] text-slate-400 font-medium uppercase">Remind Threshold</p>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${cs.bg} ${cs.color}`}>{cs.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Reminder Alert Composer */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                      <h3 className="text-[11px] font-extrabold text-slate-800">Dispatch Personalized Reminder</h3>

                      <div className="space-y-2">
                        <label className="text-[8.5px] font-bold text-slate-500">Choose Reminder Template</label>
                        <div className="grid grid-cols-2 gap-2">
                          {templates.map(t => (
                            <button key={t.id} type="button" onClick={() => {
                              setSelectedTemplateId(t.id);
                              // Replace variables with actual values
                              let text = t.body
                                .replace('{amount}', s.pendingAmount.toString())
                                .replace('{student}', s.studentName)
                                .replace('{class}', s.className)
                                .replace('{date}', s.dueDate)
                                .replace('{days}', '9');
                              setCustomText(text);
                            }}
                            className={`px-2.5 py-1.5 border rounded-lg text-[9px] font-bold text-left transition ${selectedTemplateId === t.id ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-slate-500">Edit Message Content Preview</label>
                        <textarea rows={3} value={customText || templates[0].body
                          .replace('{amount}', s.pendingAmount.toString())
                          .replace('{student}', s.studentName)
                          .replace('{class}', s.className)
                          .replace('{date}', s.dueDate)}
                          onChange={e => setCustomText(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[9px] font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none" />
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-[8px] text-slate-400">Dispatch is logged in the audit trail.</span>
                        <button onClick={() => sendSingleReminder(s)} disabled={sendingId === s.id}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[9px] font-extrabold px-4 py-2 rounded-lg cursor-pointer shadow-sm disabled:opacity-50">
                          {sendingId === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Dispatch Reminder
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ REMIND SCHEDULES ═════════ */}
        {activeTab === 'automated' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
                <h3 className="text-[12px] font-extrabold">Automated Alert Schedules</h3>
                <p className="text-[9px] text-emerald-100">Configure background tasks that scan database and trigger alerts autonomously</p>
              </div>

              <div className="divide-y divide-slate-150">
                {schedules.map(sch => {
                  const ch = CHANNEL_CFG[sch.channel];
                  const temp = templates.find(t => t.id === sch.templateId);
                  return (
                    <div key={sch.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="space-y-1 pr-6 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-slate-800">{sch.name}</span>
                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full capitalize">{sch.triggerDays}</span>
                        </div>
                        <p className="text-[8.5px] text-slate-500 italic mt-0.5">Template link: "{temp?.name}"</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${ch.bg} ${ch.color}`}>
                            {ch.icon} {ch.label}
                          </span>
                        </div>
                      </div>

                      <button onClick={() => toggleSchedule(sch.id)} className="cursor-pointer">
                        {sch.isEnabled ? (
                          <span className="text-emerald-600"><ToggleRight className="w-8 h-8" /></span>
                        ) : (
                          <span className="text-slate-400"><ToggleLeft className="w-8 h-8" /></span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ MESSAGE TEMPLATES ═════════ */}
        {activeTab === 'templates' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-[12px] font-extrabold">Fee Alert Template Compiler</h3>
                  <p className="text-[9px] text-slate-300">Formulate and standardize templates using variables token mapping</p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {templates.map(t => {
                  const isEditing = editTemplateId === t.id;
                  const typeCfg = CATEGORY_TEMPLATE_CFG[t.category];
                  const ch = CHANNEL_CFG[t.channel];
                  return (
                    <div key={t.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-slate-800">{t.name}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${ch.bg} ${ch.color}`}>{ch.icon} {ch.label}</span>
                        </div>
                        {!isEditing ? (
                          <button onClick={() => { setEditTemplateId(t.id); setEditTemplateBody(t.body); }}
                            className="flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-600 hover:underline cursor-pointer">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveTemplate(t.id)} className="text-[8.5px] font-bold text-emerald-600 hover:underline cursor-pointer">Save</button>
                            <button onClick={() => setEditTemplateId(null)} className="text-[8.5px] font-bold text-red-600 hover:underline cursor-pointer">Cancel</button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <textarea rows={3} value={editTemplateBody} onChange={e => setEditTemplateBody(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-[9px] font-medium bg-slate-50 focus:bg-white outline-none" />
                      ) : (
                        <p className="text-[9px] text-slate-600 font-mono leading-relaxed bg-slate-50 p-2 border border-slate-150 rounded-lg">"{t.body}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ PAYMENT CONFIRMATIONS ═════════ */}
        {activeTab === 'payments' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 text-white">
                <h3 className="text-[12px] font-extrabold">Payment Alerts Dispatch Ledger</h3>
                <p className="text-[9px] text-teal-100 font-medium">Receipt logs dispatched instantly to parents upon payment clearance</p>
              </div>

              <div className="divide-y divide-slate-150">
                {confirmations.map(conf => (
                  <div key={conf.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800">{conf.studentName} (Class {conf.className})</p>
                        <p className="text-[8.5px] text-slate-400 font-medium">Paid <span className="font-extrabold text-slate-600">₹{conf.amountPaid.toLocaleString()}</span> · Receipt: {conf.receiptNo}</p>
                        <p className="text-[7.5px] text-slate-400">Processed at {conf.paidAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        <Send className="w-2.5 h-2.5" /> Confirmed
                      </span>
                      <button onClick={() => executeReceiptSend(conf)}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer" title="Re-send Slip">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ ANALYTICS & COLLECTION ═════════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fee Collection Rate</h4>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">91.4%</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Of Q2 target collected successfully</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Dues</h4>
                <div className="text-2xl font-extrabold text-red-600 mt-1">₹97,000</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Across remaining pending defaulters</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reminder Conversion Rate</h4>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">74.2%</div>
                <p className="text-[8px] text-slate-500 mt-0.5">Cleared dues within 3 days of reminder</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-800">Outstanding Dues by Class</h3>
              <div className="space-y-3">
                {[
                  { name: 'Class 12-B', outstanding: 24000, max: 40000, pct: '60%', color: 'bg-emerald-500' },
                  { name: 'Class 10-A', outstanding: 18500, max: 40000, pct: '46%', color: 'bg-teal-500' },
                  { name: 'Class 8-B', outstanding: 12000, max: 40000, pct: '30%', color: 'bg-blue-500' },
                  { name: 'Class 9-C', outstanding: 4500, max: 40000, pct: '11%', color: 'bg-amber-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-700">
                      <span>{item.name}</span>
                      <span>₹{item.outstanding.toLocaleString()} ({item.pct})</span>
                    </div>
                    <MiniBar value={item.outstanding} max={item.max} color={item.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Smart warning */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-extrabold text-amber-900">Optimization Recommendation</h4>
                <p className="text-[9px] text-amber-700 leading-relaxed mt-0.5">
                  Overdue tuition fee records for Class 12-B have surpassed the 15-day tolerance window. We recommend executing a custom bulk SMS alert using the "Overdue Alert (Post-Due)" template to prevent automatic examination constraints.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default FeeReminderManager;
