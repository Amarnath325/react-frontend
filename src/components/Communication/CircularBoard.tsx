import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, ChevronDown, ChevronUp, Eye, Trash2, Download, CheckSquare,
  Calendar, Flag, MessageSquare, Globe, Zap, BarChart2,
  Smartphone, BellOff, BellRing, ToggleLeft, ToggleRight,
  RotateCcw, Save, AlertTriangle, BookOpen, Users, User,
  GraduationCap, Tag, Edit3, CheckCircle, XCircle, Layers,
  Info, Clock, Star, Archive, Paperclip, Hash, Award,
  PieChart, Activity, Filter, Printer, Share2, Copy,
  ClipboardList, Lock, Unlock, MoreVertical, ChevronRight,
  Stamp, Pen, Building, ScrollText, ShieldCheck, TrendingUp
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'board' | 'compose' | 'approvals' | 'archive' | 'analytics';
type CircularCategory = 'academic' | 'administrative' | 'exam' | 'fee' | 'event' | 'holiday' | 'sports' | 'discipline' | 'health' | 'transport';
type CircularStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived' | 'rejected';
type Priority = 'normal' | 'important' | 'urgent';
type Audience = 'all' | 'students' | 'parents' | 'teachers' | 'staff' | 'class_specific';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface Circular {
  id: number;
  circularNo: string;
  title: string;
  body: string;
  category: CircularCategory;
  status: CircularStatus;
  priority: Priority;
  audience: Audience;
  targetClasses?: string[];
  issuedBy: string;
  issuedByDesignation: string;
  createdAt: string;
  publishedAt?: string;
  expiresAt?: string;
  approvedBy?: string;
  attachments: string[];
  isPinned: boolean;
  views: number;
  acknowledged: number;
  totalRecipients: number;
  alertsSent: number;
  tags: string[];
  requiresAck: boolean;
  signature?: string;
  seal: boolean;
}

interface ApprovalItem {
  id: number;
  circularId: number;
  circularNo: string;
  title: string;
  category: CircularCategory;
  priority: Priority;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ComposeForm {
  title: string;
  body: string;
  category: CircularCategory;
  priority: Priority;
  audience: Audience;
  targetClasses: string;
  expiresAt: string;
  attachments: string;
  tags: string;
  requiresAck: boolean;
  seal: boolean;
  sendAlert: boolean;
  alertChannel: 'push' | 'sms' | 'email' | 'all';
}

interface AnalyticsMonth {
  month: string;
  published: number;
  viewed: number;
  acknowledged: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CIRCULARS: Circular[] = [
  {
    id: 1, circularNo: 'CIR/2026/042', title: 'Mid-Term Examination Schedule 2026',
    body: 'This is to inform all students, parents, and staff that the Mid-Term Examinations for the academic year 2026–27 will be conducted from 1st July to 10th July 2026. All students are required to carry their Hall Tickets compulsorily. The detailed date sheet has been attached herewith for reference.\n\nStudents are advised to prepare thoroughly and maintain regularity in attendance leading up to the examinations. Any student found indulging in unfair means will face strict disciplinary action as per the school examination policy.\n\nParents are requested to ensure that their wards attend school regularly and complete all pending assignments before the commencement of examinations.',
    category: 'exam', status: 'published', priority: 'important',
    audience: 'all', issuedBy: 'Dr. R. Sharma', issuedByDesignation: 'Principal',
    createdAt: '2026-06-20', publishedAt: '2026-06-20', expiresAt: '2026-07-15',
    approvedBy: 'School Management Committee', attachments: ['midterm_datesheet_2026.pdf', 'exam_guidelines.pdf'],
    isPinned: true, views: 1240, acknowledged: 980, totalRecipients: 1350, alertsSent: 1350,
    tags: ['examination', 'midterm', 'schedule'], requiresAck: true, signature: 'Dr. R. Sharma', seal: true,
  },
  {
    id: 2, circularNo: 'CIR/2026/041', title: 'Fee Payment Deadline – Q2 2026',
    body: 'Parents are hereby informed that the deadline for payment of Second Quarter (Q2) fees for the academic year 2026–27 is 30th June 2026. Parents who have not yet cleared the dues are requested to make the payment at the school accounts office or through the online portal at the earliest.\n\nLate fee of ₹50/day will be charged after the due date. Students with outstanding dues for more than 15 days may face restriction from attending examinations.\n\nFor any queries, parents may contact the Accounts Office between 9:00 AM and 2:00 PM on any working day.',
    category: 'fee', status: 'published', priority: 'urgent',
    audience: 'parents', issuedBy: 'Mr. A. Gupta', issuedByDesignation: 'Accounts Manager',
    createdAt: '2026-06-18', publishedAt: '2026-06-18', expiresAt: '2026-06-30',
    approvedBy: 'Principal', attachments: ['fee_structure_Q2.pdf'],
    isPinned: true, views: 890, acknowledged: 650, totalRecipients: 720, alertsSent: 720,
    tags: ['fees', 'payment', 'deadline'], requiresAck: false, signature: 'Mr. A. Gupta', seal: true,
  },
  {
    id: 3, circularNo: 'CIR/2026/040', title: 'Annual Sports Day – Schedule & Instructions',
    body: 'We are pleased to announce that the Annual Sports Day 2026 will be held on Saturday, 12th July 2026 at the School Sports Ground. All students are encouraged to participate in the events.\n\nParents are cordially invited to witness the event. Entry is by invitation card only. Please collect the invitation from the school office.\n\nStudents participating in track and field events are advised to report to their respective coaches by 7:30 AM. The event will commence at 8:30 AM and conclude at 5:00 PM.',
    category: 'sports', status: 'published', priority: 'normal',
    audience: 'all', issuedBy: 'Mr. K. Singh', issuedByDesignation: 'Sports Coordinator',
    createdAt: '2026-06-22', publishedAt: '2026-06-22', expiresAt: '2026-07-13',
    approvedBy: 'Principal', attachments: ['sports_day_schedule.pdf', 'event_list.pdf'],
    isPinned: false, views: 560, acknowledged: 320, totalRecipients: 1350, alertsSent: 1350,
    tags: ['sports', 'annual day', 'events'], requiresAck: false, signature: 'Mr. K. Singh', seal: false,
  },
  {
    id: 4, circularNo: 'CIR/2026/039', title: 'Dress Code & Uniform Policy – Revised 2026',
    body: 'In view of certain observations, the school administration wishes to reiterate the mandatory uniform policy. All students must wear the prescribed school uniform on all working days without exception.\n\nThe revised uniform guidelines effective from 1st July 2026 are:\n• Boys: White shirt, grey trousers, black shoes, school tie on Mondays\n• Girls: White salwar-kameez, grey dupatta, black shoes, ribbon in school colour\n• Summer uniform: As per existing circular (CIR/2026/012)\n\nStudents found violating the dress code will be sent to the Principal\'s office and parents will be notified.',
    category: 'discipline', status: 'published', priority: 'normal',
    audience: 'students', targetClasses: ['All Classes'],
    issuedBy: 'Ms. P. Nair', issuedByDesignation: 'Vice Principal',
    createdAt: '2026-06-21', publishedAt: '2026-06-21',
    approvedBy: 'Principal', attachments: [],
    isPinned: false, views: 780, acknowledged: 620, totalRecipients: 1240, alertsSent: 620,
    tags: ['uniform', 'discipline', 'dress-code'], requiresAck: true, signature: 'Ms. P. Nair', seal: true,
  },
  {
    id: 5, circularNo: 'CIR/2026/038', title: 'Summer Vacation Homework – Classes 6 to 12',
    body: 'Students are hereby informed that Summer Vacation Homework has been assigned for all classes (6 to 12) across all subjects. The homework booklets have been dispatched to class teachers and will be distributed to students.\n\nAll homework must be completed neatly in the prescribed booklet and submitted on the first day of school after vacation.\n\nSubject-wise details are available on the school portal. Parents are requested to monitor their wards\' progress during the vacation period.',
    category: 'academic', status: 'published', priority: 'normal',
    audience: 'students', targetClasses: ['6-A','6-B','7-A','7-B','8-A','8-B','9-A','9-B','10-A','10-B','11-A','11-B','12-A','12-B'],
    issuedBy: 'Mrs. S. Verma', issuedByDesignation: 'Academic Coordinator',
    createdAt: '2026-06-15', publishedAt: '2026-06-15',
    approvedBy: 'Principal', attachments: ['vacation_homework_details.pdf'],
    isPinned: false, views: 1120, acknowledged: 890, totalRecipients: 1240, alertsSent: 1240,
    tags: ['homework', 'vacation', 'academic'], requiresAck: true, signature: 'Mrs. S. Verma', seal: false,
  },
  {
    id: 6, circularNo: 'CIR/2026/037', title: 'Health Advisory – Dengue Prevention Measures',
    body: 'In view of the increasing cases of dengue fever in the region, the school administration wishes to take preventive measures to safeguard the health of all students and staff.\n\nAll students are advised to:\n• Wear full-sleeved clothing\n• Not allow stagnant water to collect in their surroundings\n• Report any symptoms of fever, headache, or joint pain immediately\n\nThe school premises are being fumigated weekly. A medical camp will be organised on 25th June 2026 in collaboration with the District Health Department. Attendance is encouraged.',
    category: 'health', status: 'published', priority: 'important',
    audience: 'all', issuedBy: 'Dr. R. Sharma', issuedByDesignation: 'Principal',
    createdAt: '2026-06-23', publishedAt: '2026-06-23',
    approvedBy: 'School Management', attachments: ['dengue_advisory.pdf'],
    isPinned: false, views: 430, acknowledged: 290, totalRecipients: 1350, alertsSent: 1350,
    tags: ['health', 'dengue', 'advisory'], requiresAck: false, signature: 'Dr. R. Sharma', seal: true,
  },
  {
    id: 7, circularNo: 'CIR/2026/DRAFT-01', title: 'Parent-Teacher Meeting – July 2026',
    body: 'Draft: The school is planning to conduct a Parent-Teacher Meeting for all classes on Saturday, 20th July 2026. Timings and venue to be confirmed. Parents will be informed at least 7 days in advance.',
    category: 'event', status: 'draft', priority: 'normal',
    audience: 'parents', issuedBy: 'Ms. P. Nair', issuedByDesignation: 'Vice Principal',
    createdAt: '2026-06-24', attachments: [],
    isPinned: false, views: 0, acknowledged: 0, totalRecipients: 0, alertsSent: 0,
    tags: ['PTM', 'meeting', 'parents'], requiresAck: false, seal: false,
  },
  {
    id: 8, circularNo: 'CIR/2026/PEND-02', title: 'Holiday Declaration – Eid al-Adha 2026',
    body: 'This is to inform that the school will remain closed on Monday, 7th July 2026 on account of Eid al-Adha (Bakrid). Students and staff are wished on the occasion of the festival. School will resume on Tuesday, 8th July 2026.\n\nNote: Online classes will NOT be conducted on this day.',
    category: 'holiday', status: 'pending_approval', priority: 'important',
    audience: 'all', issuedBy: 'Ms. P. Nair', issuedByDesignation: 'Vice Principal',
    createdAt: '2026-06-24', attachments: [],
    isPinned: false, views: 0, acknowledged: 0, totalRecipients: 0, alertsSent: 0,
    tags: ['holiday', 'eid', 'school-closed'], requiresAck: false, seal: false,
  },
];

const APPROVALS: ApprovalItem[] = [
  { id: 1, circularId: 8, circularNo: 'CIR/2026/PEND-02', title: 'Holiday Declaration – Eid al-Adha 2026', category: 'holiday', priority: 'important', submittedBy: 'Ms. P. Nair', submittedAt: '2026-06-24 04:00 PM', status: 'pending' },
  { id: 2, circularId: 7, circularNo: 'CIR/2026/DRAFT-01', title: 'Parent-Teacher Meeting – July 2026', category: 'event', priority: 'normal', submittedBy: 'Ms. P. Nair', submittedAt: '2026-06-24 02:30 PM', status: 'pending' },
  { id: 3, circularId: 1, circularNo: 'CIR/2026/042', title: 'Mid-Term Examination Schedule 2026', category: 'exam', priority: 'important', submittedBy: 'Dr. R. Sharma', submittedAt: '2026-06-20 09:00 AM', status: 'approved', remarks: 'Approved. Circulate immediately.', reviewedBy: 'Chairman, SMC', reviewedAt: '2026-06-20 09:45 AM' },
  { id: 4, circularId: 4, circularNo: 'CIR/2026/039', title: 'Dress Code & Uniform Policy', category: 'discipline', priority: 'normal', submittedBy: 'Ms. P. Nair', submittedAt: '2026-06-21 10:00 AM', status: 'approved', reviewedBy: 'Principal', reviewedAt: '2026-06-21 11:30 AM' },
  { id: 5, circularId: 99, circularNo: 'CIR/2026/034', title: 'Class 12 Farewell Circular', category: 'event', priority: 'normal', submittedBy: 'Mr. K. Singh', submittedAt: '2026-06-10 11:00 AM', status: 'rejected', remarks: 'Content needs revision. Please rewrite and resubmit.', reviewedBy: 'Vice Principal', reviewedAt: '2026-06-10 04:00 PM' },
];

const ANALYTICS_DATA: AnalyticsMonth[] = [
  { month: 'Jan', published: 8, viewed: 4200, acknowledged: 3100 },
  { month: 'Feb', published: 6, viewed: 3800, acknowledged: 2900 },
  { month: 'Mar', published: 12, viewed: 6500, acknowledged: 4800 },
  { month: 'Apr', published: 9, viewed: 4900, acknowledged: 3600 },
  { month: 'May', published: 7, viewed: 3200, acknowledged: 2200 },
  { month: 'Jun', published: 6, viewed: 5020, acknowledged: 3750 },
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<CircularCategory, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  academic:       { label: 'Academic',       color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-300',    emoji: '📚' },
  administrative: { label: 'Administrative', color: 'text-slate-700',   bg: 'bg-slate-100',   border: 'border-slate-300',   emoji: '🏛️' },
  exam:           { label: 'Examination',    color: 'text-violet-700',  bg: 'bg-violet-100',  border: 'border-violet-300',  emoji: '📝' },
  fee:            { label: 'Fee & Finance',  color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', emoji: '💰' },
  event:          { label: 'Events',         color: 'text-pink-700',    bg: 'bg-pink-100',    border: 'border-pink-300',    emoji: '🎉' },
  holiday:        { label: 'Holiday',        color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300',  emoji: '🏖️' },
  sports:         { label: 'Sports',         color: 'text-teal-700',    bg: 'bg-teal-100',    border: 'border-teal-300',    emoji: '🏆' },
  discipline:     { label: 'Discipline',     color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300',     emoji: '⚖️' },
  health:         { label: 'Health',         color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-300',    emoji: '🏥' },
  transport:      { label: 'Transport',      color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-300',   emoji: '🚌' },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  normal:    { label: 'Normal',    color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  important: { label: 'Important', color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  urgent:    { label: 'Urgent',    color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500 animate-pulse' },
};

const STATUS_CFG: Record<CircularStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:            { label: 'Draft',           color: 'text-slate-600',   bg: 'bg-slate-100',   icon: <Edit3 className="w-3 h-3" /> },
  pending_approval: { label: 'Pending',         color: 'text-amber-700',   bg: 'bg-amber-100',   icon: <Clock className="w-3 h-3" /> },
  approved:         { label: 'Approved',        color: 'text-blue-700',    bg: 'bg-blue-100',    icon: <CheckCircle className="w-3 h-3" /> },
  published:        { label: 'Published',       color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <Globe className="w-3 h-3" /> },
  archived:         { label: 'Archived',        color: 'text-violet-700',  bg: 'bg-violet-100',  icon: <Archive className="w-3 h-3" /> },
  rejected:         { label: 'Rejected',        color: 'text-red-700',     bg: 'bg-red-100',     icon: <XCircle className="w-3 h-3" /> },
};

const AUDIENCE_CFG: Record<Audience, { label: string; icon: React.ReactNode }> = {
  all:            { label: 'All',            icon: <Users className="w-3 h-3" /> },
  students:       { label: 'Students',       icon: <GraduationCap className="w-3 h-3" /> },
  parents:        { label: 'Parents',        icon: <User className="w-3 h-3" /> },
  teachers:       { label: 'Teachers',       icon: <BookOpen className="w-3 h-3" /> },
  staff:          { label: 'Staff',          icon: <Building className="w-3 h-3" /> },
  class_specific: { label: 'Specific Class', icon: <ClipboardList className="w-3 h-3" /> },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const emptyForm = (): ComposeForm => ({
  title: '', body: '', category: 'academic', priority: 'normal',
  audience: 'all', targetClasses: '', expiresAt: '',
  attachments: '', tags: '', requiresAck: false, seal: false,
  sendAlert: true, alertChannel: 'all',
});

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const AnalyticsBar: React.FC<{ data: AnalyticsMonth[]; field: keyof AnalyticsMonth; color: string; maxOverride?: number }> = ({ data, field, color, maxOverride }) => {
  const max = maxOverride ?? Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = Math.max(4, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all`} style={{ height: `${pct}%` }} />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              {typeof val === 'number' ? val.toLocaleString() : val}
            </div>
          </div>
        );
      })}
    </div>
  );
};

let circularCounter = 43;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CircularBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [circulars, setCirculars] = useState<Circular[]>(CIRCULARS);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(APPROVALS);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(CIRCULARS[0]);
  const [form, setForm] = useState<ComposeForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [searchBoard, setSearchBoard] = useState('');
  const [filterCategory, setFilterCategory] = useState<CircularCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CircularStatus | 'all'>('published');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [showRejectBox, setShowRejectBox] = useState<number | null>(null);
  const [expandedApproval, setExpandedApproval] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [globalAlerts, setGlobalAlerts] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ── Derived ──
  const published = circulars.filter(c => c.status === 'published').length;
  const pendingApproval = circulars.filter(c => c.status === 'pending_approval').length;
  const totalViews = circulars.reduce((s, c) => s + c.views, 0);
  const totalAck = circulars.reduce((s, c) => s + c.acknowledged, 0);
  const pinnedCount = circulars.filter(c => c.isPinned).length;

  // Filtered
  const filteredCirculars = circulars.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (searchBoard && !c.title.toLowerCase().includes(searchBoard.toLowerCase()) &&
        !c.circularNo.toLowerCase().includes(searchBoard.toLowerCase()) &&
        !c.issuedBy.toLowerCase().includes(searchBoard.toLowerCase())) return false;
    return true;
  });

  const archivedCirculars = circulars.filter(c => c.status === 'archived');

  // ── Handlers ──
  const handleCompose = async () => {
    if (!form.title.trim()) { toast.error('Circular title is required'); return; }
    if (!form.body.trim()) { toast.error('Circular body is required'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    circularCounter++;
    const nc: Circular = {
      id: Date.now(), circularNo: `CIR/2026/PEND-${String(circularCounter).padStart(2, '0')}`,
      title: form.title, body: form.body, category: form.category,
      status: 'pending_approval', priority: form.priority, audience: form.audience,
      targetClasses: form.targetClasses ? form.targetClasses.split(',').map(s => s.trim()) : undefined,
      issuedBy: 'You', issuedByDesignation: 'Staff',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: form.expiresAt || undefined,
      attachments: form.attachments ? form.attachments.split(',').map(s => s.trim()).filter(Boolean) : [],
      isPinned: false, views: 0, acknowledged: 0, totalRecipients: 0, alertsSent: 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      requiresAck: form.requiresAck, seal: form.seal,
    };
    setCirculars(prev => [nc, ...prev]);
    setApprovals(prev => [{
      id: Date.now(), circularId: nc.id, circularNo: nc.circularNo,
      title: nc.title, category: nc.category, priority: nc.priority,
      submittedBy: 'You', submittedAt: new Date().toLocaleString('en-IN'),
      status: 'pending',
    }, ...prev]);
    toast.success('📋 Circular submitted for approval!');
    setForm(emptyForm());
    setActiveTab('approvals');
  };

  const approveCircular = async (approval: ApprovalItem) => {
    setApprovingId(approval.id);
    await new Promise(r => setTimeout(r, 1500));
    setApprovingId(null);
    setApprovals(prev => prev.map(a => a.id === approval.id
      ? { ...a, status: 'approved', reviewedBy: 'Principal', reviewedAt: new Date().toLocaleString('en-IN') }
      : a));
    setCirculars(prev => prev.map(c => c.id === approval.circularId
      ? { ...c, status: 'published', publishedAt: new Date().toISOString().split('T')[0], approvedBy: 'Principal', alertsSent: 1240, totalRecipients: 1240, views: 0 }
      : c));
    toast.success(`✅ Circular approved & published! Alerts sent to all recipients.`);
  };

  const rejectCircular = async (approval: ApprovalItem) => {
    if (!rejectRemark.trim()) { toast.error('Please enter rejection remarks'); return; }
    setRejectingId(approval.id);
    await new Promise(r => setTimeout(r, 1200));
    setRejectingId(null);
    setApprovals(prev => prev.map(a => a.id === approval.id
      ? { ...a, status: 'rejected', remarks: rejectRemark, reviewedBy: 'Principal', reviewedAt: new Date().toLocaleString('en-IN') }
      : a));
    setCirculars(prev => prev.map(c => c.id === approval.circularId ? { ...c, status: 'rejected' } : c));
    setShowRejectBox(null);
    setRejectRemark('');
    toast.success('Circular rejected with remarks sent to author.');
  };

  const archiveCircular = async (id: number) => {
    setArchivingId(id);
    await new Promise(r => setTimeout(r, 1000));
    setArchivingId(null);
    setCirculars(prev => prev.map(c => c.id === id ? { ...c, status: 'archived', isPinned: false } : c));
    if (selectedCircular?.id === id) setSelectedCircular(null);
    toast.success('Circular archived successfully.');
  };

  const togglePin = (id: number) => {
    setCirculars(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    const circ = circulars.find(c => c.id === id);
    toast.success(`${circ?.isPinned ? 'Unpinned' : 'Pinned'} circular`);
  };

  const sendBroadcast = async (circular: Circular) => {
    await new Promise(r => setTimeout(r, 1200));
    setCirculars(prev => prev.map(c => c.id === circular.id ? { ...c, alertsSent: c.alertsSent + c.totalRecipients } : c));
    toast.success(`📲 Re-broadcast sent to ${circular.totalRecipients} recipients!`);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Official Circular Board</h1>
            <p className="text-[9px] text-slate-400 font-medium">Compose · Approve · Publish · Archive · Broadcast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{published} published</span>
          </div>
          {pendingApproval > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3 text-amber-300" />
              <span className="text-[9px] font-bold text-amber-200">{pendingApproval} pending</span>
            </div>
          )}
          <button
            onClick={() => { setGlobalAlerts(!globalAlerts); toast.success(globalAlerts ? 'Circular alerts paused' : 'Circular alerts active'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalAlerts ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200'}`}>
            {globalAlerts ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
          <button onClick={() => setActiveTab('compose')}
            className="flex items-center gap-1.5 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Circular
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Published', val: published, icon: <Globe className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Pending Approval', val: pendingApproval, icon: <Clock className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Pinned', val: pinnedCount, icon: <Star className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Total Views', val: totalViews.toLocaleString(), icon: <Eye className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Acknowledged', val: totalAck.toLocaleString(), icon: <CheckCircle className="w-3 h-3" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Archived', val: archivedCirculars.length, icon: <Archive className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
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
          { key: 'board',     label: 'Circular Board',   icon: <ScrollText className="w-3.5 h-3.5" />, badge: 0 },
          { key: 'compose',   label: 'Compose',          icon: <Pen className="w-3.5 h-3.5" /> },
          { key: 'approvals', label: 'Approvals',        icon: <Stamp className="w-3.5 h-3.5" />, badge: pendingApproval },
          { key: 'archive',   label: 'Archive',          icon: <Archive className="w-3.5 h-3.5" /> },
          { key: 'analytics', label: 'Analytics',        icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-slate-800 border-b-2 border-slate-800 bg-slate-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-amber-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ CIRCULAR BOARD ═════════ */}
        {activeTab === 'board' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left Panel – List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search circulars…" value={searchBoard}
                      onChange={e => setSearchBoard(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                  <button onClick={() => setActiveTab('compose')} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Status Filter */}
                <div className="flex gap-1 overflow-x-auto">
                  {(['all', 'published', 'draft', 'pending_approval', 'rejected'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                      {s === 'all' ? 'All' : s === 'pending_approval' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Category Filter */}
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as CircularCategory | 'all')}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                  <option value="all">All Categories</option>
                  {(Object.entries(CATEGORY_CFG) as [CircularCategory, typeof CATEGORY_CFG[CircularCategory]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {/* Pinned first */}
                {filteredCirculars.filter(c => c.isPinned).length > 0 && (
                  <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100">
                    <p className="text-[8px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1"><Star className="w-2.5 h-2.5" /> Pinned</p>
                  </div>
                )}
                {[...filteredCirculars.filter(c => c.isPinned), ...filteredCirculars.filter(c => !c.isPinned)].map(circ => {
                  const cat = CATEGORY_CFG[circ.category];
                  const pri = PRIORITY_CFG[circ.priority];
                  const st = STATUS_CFG[circ.status];
                  const isSelected = selectedCircular?.id === circ.id;
                  const ackPct = circ.totalRecipients > 0 ? Math.round((circ.acknowledged / circ.totalRecipients) * 100) : 0;
                  return (
                    <div key={circ.id} onClick={() => setSelectedCircular(circ)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition ${isSelected ? 'bg-slate-50 border-l-2 border-slate-700' : ''} ${circ.isPinned ? 'bg-amber-50/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cat.bg}`}>{cat.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            {circ.isPinned && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            <p className="text-[10px] font-bold text-slate-800 truncate">{circ.title}</p>
                          </div>
                          <p className="text-[8px] text-slate-400 font-mono mb-1">{circ.circularNo}</p>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>
                              <span className={`w-1 h-1 rounded-full ${pri.dot} inline-block`} /> {pri.label}
                            </span>
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                              {st.icon} {st.label}
                            </span>
                          </div>
                          {circ.status === 'published' && (
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-2">
                                <MiniBar value={circ.acknowledged} max={circ.totalRecipients} color="bg-emerald-500" />
                              </div>
                              <span className="text-[8px] font-bold text-emerald-600 whitespace-nowrap">{ackPct}% ack</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] text-slate-400">{circ.issuedBy}</span>
                            <span className="text-[8px] text-slate-400">{circ.publishedAt || circ.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredCirculars.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <ScrollText className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No circulars found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel – Circular Viewer */}
            <div className="flex-1 overflow-y-auto">
              {!selectedCircular ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <ScrollText className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select a circular to read</p>
                </div>
              ) : (() => {
                const c = selectedCircular;
                const cat = CATEGORY_CFG[c.category];
                const pri = PRIORITY_CFG[c.priority];
                const st = STATUS_CFG[c.status];
                const aud = AUDIENCE_CFG[c.audience];
                const ackPct = c.totalRecipients > 0 ? Math.round((c.acknowledged / c.totalRecipients) * 100) : 0;
                return (
                  <div className="p-6 max-w-3xl mx-auto">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <button onClick={() => togglePin(c.id)}
                        className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${c.isPinned ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}>
                        <Star className={`w-3 h-3 ${c.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} /> {c.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      {c.status === 'published' && (
                        <button onClick={() => sendBroadcast(c)}
                          className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
                          <Send className="w-3 h-3" /> Re-broadcast
                        </button>
                      )}
                      <button onClick={() => toast.success('Circular copied to clipboard')}
                        className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition bg-white border-slate-200 text-slate-600 hover:border-slate-400">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button onClick={() => toast.success('Downloading PDF…')}
                        className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition bg-white border-slate-200 text-slate-600 hover:border-slate-400">
                        <Download className="w-3 h-3" /> Download
                      </button>
                      <button onClick={() => toast.success('Sent to printer')}
                        className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition bg-white border-slate-200 text-slate-600 hover:border-slate-400">
                        <Printer className="w-3 h-3" /> Print
                      </button>
                      {c.status === 'published' && (
                        <button onClick={() => archiveCircular(c.id)} disabled={archivingId === c.id}
                          className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 disabled:opacity-60 ml-auto">
                          {archivingId === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />} Archive
                        </button>
                      )}
                    </div>

                    {/* Circular Paper */}
                    <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-lg overflow-hidden">
                      {/* School Header */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-5 text-white text-center">
                        <div className="flex items-center justify-center gap-3 mb-1">
                          <Building className="w-5 h-5 text-slate-300" />
                          <h1 className="text-[13px] font-extrabold tracking-widest uppercase">Delhi Public School</h1>
                          <Building className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">Sector 12, New Delhi – 110001 | Tel: 011-XXXXXXXX | www.dps.edu.in</p>
                        <div className="mt-3 border-t border-slate-600 pt-2">
                          <p className="text-[11px] font-extrabold tracking-wider text-slate-200">OFFICIAL CIRCULAR</p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between px-8 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Circular No.</p>
                            <p className="text-[10px] font-extrabold text-slate-800 font-mono">{c.circularNo}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Date</p>
                            <p className="text-[10px] font-bold text-slate-700">{c.publishedAt || c.createdAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-full ${cat.bg} ${cat.color}`}>{cat.emoji} {cat.label}</span>
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-full ${pri.bg} ${pri.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot} inline-block`} />{pri.label}
                          </span>
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.icon} {st.label}</span>
                        </div>
                      </div>

                      {/* Circular Body */}
                      <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">To:</p>
                            <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1">{aud.icon} {aud.label}{c.targetClasses?.length ? ` (${c.targetClasses.slice(0, 4).join(', ')}${c.targetClasses.length > 4 ? '…' : ''})` : ''}</p>
                          </div>
                          {c.requiresAck && (
                            <span className="flex items-center gap-1 text-[8px] font-bold px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                              <CheckSquare className="w-2.5 h-2.5" /> Acknowledgement Required
                            </span>
                          )}
                        </div>

                        <h2 className="text-[15px] font-extrabold text-slate-900 mb-4 underline underline-offset-4 decoration-2 decoration-slate-300">
                          {c.title}
                        </h2>

                        <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {c.body}
                        </div>

                        {/* Attachments */}
                        {c.attachments.length > 0 && (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachments</p>
                            <div className="flex flex-wrap gap-2">
                              {c.attachments.map((att, i) => (
                                <button key={i} onClick={() => toast.success(`Downloading: ${att}`)}
                                  className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 rounded-lg cursor-pointer transition">
                                  <FileText className="w-3 h-3" /> {att}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {c.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {c.tags.map((tag, i) => (
                              <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">#{tag}</span>
                            ))}
                          </div>
                        )}

                        {/* Signature Block */}
                        <div className="mt-8 flex items-end justify-between">
                          <div />
                          <div className="text-right">
                            {c.seal && (
                              <div className="flex justify-end mb-2">
                                <div className="w-14 h-14 rounded-full border-4 border-slate-700 flex items-center justify-center bg-slate-50 opacity-60">
                                  <Stamp className="w-6 h-6 text-slate-700" />
                                </div>
                              </div>
                            )}
                            {c.signature && (
                              <div className="font-serif italic text-[13px] text-slate-600 border-b border-slate-300 pb-1 mb-1">{c.signature}</div>
                            )}
                            <p className="text-[10px] font-extrabold text-slate-800">{c.issuedBy}</p>
                            <p className="text-[9px] text-slate-500">{c.issuedByDesignation}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">Delhi Public School</p>
                          </div>
                        </div>

                        {c.approvedBy && (
                          <div className="mt-3 flex items-center gap-1.5 text-[8px] text-slate-500 border-t border-slate-100 pt-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Approved by: <strong>{c.approvedBy}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    {c.status === 'published' && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          { label: 'Total Recipients', val: c.totalRecipients, icon: <Users className="w-3.5 h-3.5" />, color: 'text-slate-700' },
                          { label: 'Total Views', val: c.views, icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-700' },
                          { label: `Acknowledged (${ackPct}%)`, val: c.acknowledged, icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-700' },
                        ].map((s, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                            <p className={`text-[18px] font-extrabold ${s.color}`}>{s.val.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-400 font-medium">{s.label}</p>
                          </div>
                        ))}
                        <div className="col-span-3">
                          <MiniBar value={c.acknowledged} max={c.totalRecipients} color="bg-emerald-500" />
                          <p className="text-[8px] text-slate-400 mt-1 text-center">{ackPct}% acknowledged out of {c.totalRecipients} recipients</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ COMPOSE ═════════ */}
        {activeTab === 'compose' && (
          <div className="p-4 max-w-3xl">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3.5 bg-slate-800 text-white">
                <h3 className="text-[11px] font-extrabold flex items-center gap-1.5"><Pen className="w-3.5 h-3.5" /> Compose New Official Circular</h3>
                <button onClick={() => { setForm(emptyForm()); toast.success('Form reset'); }}
                  className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(Object.entries(CATEGORY_CFG) as [CircularCategory, typeof CATEGORY_CFG[CircularCategory]][]).map(([k, v]) => (
                        <button key={k} onClick={() => setForm(p => ({ ...p, category: k }))}
                          className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl border text-[7px] font-bold transition cursor-pointer ${form.category === k ? `${v.bg} ${v.border} ${v.color}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          <span className="text-base">{v.emoji}</span>
                          <span className="text-center leading-tight">{v.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                      <div className="flex gap-2">
                        {(['normal', 'important', 'urgent'] as Priority[]).map(p => {
                          const pr = PRIORITY_CFG[p];
                          return (
                            <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[9px] font-bold transition cursor-pointer ${form.priority === p ? `${pr.bg} ${pr.color} border-current` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                              <span className={`w-2 h-2 rounded-full ${pr.dot}`} /> {pr.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Audience</label>
                      <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value as Audience }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400 bg-white">
                        {(Object.entries(AUDIENCE_CFG) as [Audience, typeof AUDIENCE_CFG[Audience]][]).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {form.audience === 'class_specific' && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Classes (comma-separated)</label>
                    <input type="text" placeholder="e.g. 10-A, 10-B, 11-A" value={form.targetClasses}
                      onChange={e => setForm(p => ({ ...p, targetClasses: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Circular Title <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Mid-Term Examination Schedule 2026" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-slate-400" />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Circular Body <span className="text-red-500">*</span></label>
                  <textarea rows={8} placeholder="Write the official circular content here. Use formal language. Start with the salutation…" value={form.body}
                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400 resize-none leading-relaxed" />
                  <p className="text-[8px] text-slate-400 mt-1">{form.body.length} characters · {form.body.split(' ').filter(Boolean).length} words</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expires On (optional)</label>
                    <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                    <input type="text" placeholder="e.g. exam, schedule, important" value={form.tags}
                      onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attachments (filenames, comma-separated)</label>
                  <input type="text" placeholder="e.g. datesheet.pdf, guidelines.docx" value={form.attachments}
                    onChange={e => setForm(p => ({ ...p, attachments: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-400" />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.requiresAck} onChange={e => setForm(p => ({ ...p, requiresAck: e.target.checked }))} className="rounded" />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-blue-500" /> Requires Acknowledgement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.seal} onChange={e => setForm(p => ({ ...p, seal: e.target.checked }))} className="rounded" />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Stamp className="w-3 h-3 text-slate-600" /> Add Official Seal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.sendAlert} onChange={e => setForm(p => ({ ...p, sendAlert: e.target.checked }))} className="rounded" />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Bell className="w-3 h-3 text-orange-500" /> Send Alert on Publish</span>
                  </label>
                </div>

                {form.sendAlert && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alert Channel</label>
                    <div className="flex gap-2">
                      {(['push', 'sms', 'email', 'all'] as const).map(ch => (
                        <button key={ch} onClick={() => setForm(p => ({ ...p, alertChannel: ch }))}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-[9px] font-bold transition cursor-pointer capitalize ${form.alertChannel === ch ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={handleCompose} disabled={submitting}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60">
                    {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : <><Send className="w-3.5 h-3.5" /> Submit for Approval</>}
                  </button>
                  <button onClick={() => toast.success('Saved as draft')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition">
                    <Save className="w-3.5 h-3.5" /> Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ APPROVALS ═════════ */}
        {activeTab === 'approvals' && (
          <div className="p-4 space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-2"><Stamp className="w-4 h-4 text-amber-600" /> Circular Approval Queue</h2>
              <div className="flex items-center gap-2 text-[9px] font-bold">
                <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> {approvals.filter(a => a.status === 'pending').length} pending</span>
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {approvals.filter(a => a.status === 'approved').length} approved</span>
                <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500" /> {approvals.filter(a => a.status === 'rejected').length} rejected</span>
              </div>
            </div>

            {approvals.map(approval => {
              const cat = CATEGORY_CFG[approval.category];
              const pri = PRIORITY_CFG[approval.priority];
              const statusColor = approval.status === 'pending' ? 'border-amber-300 bg-amber-50' : approval.status === 'approved' ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50';
              const isExpanded = expandedApproval === approval.id;
              return (
                <div key={approval.id} className={`border-2 rounded-xl overflow-hidden ${statusColor}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-[11px] font-extrabold text-slate-800">{approval.title}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                        <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>
                          <span className={`w-1 h-1 rounded-full ${pri.dot} inline-block`} /> {pri.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono">{approval.circularNo} · Submitted by {approval.submittedBy} · {approval.submittedAt}</p>
                      {approval.remarks && (
                        <p className="text-[9px] text-slate-600 mt-0.5 italic">"{approval.remarks}"</p>
                      )}
                      {approval.reviewedBy && (
                        <p className="text-[8px] text-slate-500 mt-0.5">Reviewed by {approval.reviewedBy} at {approval.reviewedAt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {approval.status === 'pending' && (
                        <>
                          <button onClick={() => approveCircular(approval)} disabled={approvingId === approval.id}
                            className="flex items-center gap-1 text-[9px] font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition disabled:opacity-60">
                            {approvingId === approval.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve & Publish
                          </button>
                          <button onClick={() => setShowRejectBox(showRejectBox === approval.id ? null : approval.id)}
                            className="flex items-center gap-1 text-[9px] font-bold px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl cursor-pointer transition">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {approval.status === 'approved' && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {approval.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-3 py-1.5 bg-red-100 text-red-700 rounded-xl">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Reject box */}
                  {showRejectBox === approval.id && approval.status === 'pending' && (
                    <div className="px-4 pb-3 border-t border-red-200 pt-3 bg-red-50">
                      <label className="block text-[9px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Remarks <span className="text-red-500">*</span></label>
                      <textarea rows={2} placeholder="Enter reason for rejection…" value={rejectRemark}
                        onChange={e => setRejectRemark(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => rejectCircular(approval)} disabled={rejectingId === approval.id}
                          className="flex items-center gap-1 text-[9px] font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer transition disabled:opacity-60">
                          {rejectingId === approval.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Confirm Reject
                        </button>
                        <button onClick={() => { setShowRejectBox(null); setRejectRemark(''); }}
                          className="text-[9px] font-bold px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-xl cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {approvals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Stamp className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-[10px]">No approval items</p>
              </div>
            )}
          </div>
        )}

        {/* ═════════ ARCHIVE ═════════ */}
        {activeTab === 'archive' && (
          <div className="p-4 space-y-3 max-w-3xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-2"><Archive className="w-4 h-4 text-violet-600" /> Circular Archive</h2>
              <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full">{archivedCirculars.length} archived</span>
            </div>
            {archivedCirculars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Archive className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-[10px]">No archived circulars yet</p>
              </div>
            ) : archivedCirculars.map(circ => {
              const cat = CATEGORY_CFG[circ.category];
              return (
                <div key={circ.id} className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cat.bg}`}>{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 truncate">{circ.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-mono text-slate-400">{circ.circularNo}</span>
                      <span className="text-[8px] text-slate-400">·</span>
                      <span className="text-[8px] text-slate-400">{circ.publishedAt}</span>
                      <span className="text-[8px] text-slate-400">·</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {circ.views}</span>
                    <button onClick={() => { setSelectedCircular(circ); setActiveTab('board'); }}
                      className="text-[9px] font-bold px-2 py-1 text-violet-700 bg-violet-50 border border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100">
                      View
                    </button>
                    <button onClick={() => toast.success('Downloading PDF…')}
                      className="text-[9px] font-bold px-2 py-1 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* KPI */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Published (6m)', val: ANALYTICS_DATA.reduce((s, d) => s + d.published, 0), sub: 'total circulars', icon: <Globe className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Total Views (6m)', val: ANALYTICS_DATA.reduce((s, d) => s + d.viewed, 0).toLocaleString(), sub: 'cumulative opens', icon: <Eye className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Acknowledged (6m)', val: ANALYTICS_DATA.reduce((s, d) => s + d.acknowledged, 0).toLocaleString(), sub: 'confirmations', icon: <CheckCircle className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
                { label: 'Avg Ack Rate', val: `${Math.round(ANALYTICS_DATA.reduce((s, d) => s + (d.acknowledged / Math.max(d.viewed, 1)) * 100, 0) / ANALYTICS_DATA.length)}%`, sub: 'acknowledgement rate', icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
              ].map((kpi, i) => (
                <div key={i} className={`${kpi.bg} border ${kpi.border} rounded-xl p-4`}>
                  <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                  <p className={`text-[22px] font-extrabold ${kpi.color}`}>{kpi.val}</p>
                  <p className="text-[10px] font-bold text-slate-700">{kpi.label}</p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-slate-600" /> Published / Month</h3>
                <p className="text-[8px] text-slate-400 mb-3">Circulars published each month</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="published" color="bg-slate-600" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.month}</span>)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-blue-600" /> Views / Month</h3>
                <p className="text-[8px] text-slate-400 mb-3">Total circular views per month</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="viewed" color="bg-blue-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.month}</span>)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Acknowledged / Month</h3>
                <p className="text-[8px] text-slate-400 mb-3">Acknowledgement count per month</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="acknowledged" color="bg-emerald-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.month}</span>)}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-slate-600" /> Category Breakdown</h3>
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(CATEGORY_CFG) as CircularCategory[]).map(cat => {
                  const ct = CATEGORY_CFG[cat];
                  const count = circulars.filter(c => c.category === cat).length;
                  const total = circulars.length || 1;
                  return (
                    <div key={cat} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${ct.border} ${ct.bg}`}>
                      <span className="text-2xl">{ct.emoji}</span>
                      <p className={`text-[16px] font-extrabold ${ct.color}`}>{count}</p>
                      <p className={`text-[8px] font-bold ${ct.color} text-center leading-tight`}>{ct.label}</p>
                      <MiniBar value={count} max={total} color={`bg-current`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Circulars Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5 text-slate-600" /> All Circulars — Engagement Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Circular No.', 'Title', 'Category', 'Status', 'Audience', 'Views', 'Ack.', 'Ack %', 'Date'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {circulars.filter(c => c.status !== 'archived').map(circ => {
                      const cat = CATEGORY_CFG[circ.category];
                      const st = STATUS_CFG[circ.status];
                      const aud = AUDIENCE_CFG[circ.audience];
                      const ackPct = circ.totalRecipients > 0 ? Math.round((circ.acknowledged / circ.totalRecipients) * 100) : 0;
                      return (
                        <tr key={circ.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedCircular(circ); setActiveTab('board'); }}>
                          <td className="px-3 py-2 text-[8px] font-mono text-slate-500">{circ.circularNo}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {circ.isPinned && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                              <p className="text-[9px] font-bold text-slate-800 max-w-[140px] truncate">{circ.title}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.emoji} {cat.label}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${st.bg} ${st.color}`}>{st.icon} {st.label}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-1 text-[9px] text-slate-600">{aud.icon} {aud.label}</span>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-blue-700">{circ.views.toLocaleString()}</td>
                          <td className="px-3 py-2 text-[9px] font-bold text-teal-700">{circ.acknowledged.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-10"><MiniBar value={circ.acknowledged} max={circ.totalRecipients} color={ackPct >= 75 ? 'bg-emerald-500' : ackPct >= 50 ? 'bg-amber-500' : 'bg-red-500'} /></div>
                              <span className={`text-[9px] font-bold ${ackPct >= 75 ? 'text-emerald-700' : ackPct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{ackPct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[8px] text-slate-400">{circ.publishedAt || circ.createdAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CircularBoard;
