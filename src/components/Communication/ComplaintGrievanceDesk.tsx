import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle, MessageSquare, Send, Plus, Search, Settings, RefreshCw,
  Check, X, ChevronDown, ChevronUp, Eye, Trash2, Flag, Users, User,
  Clock, Calendar, CheckCircle, XCircle, BarChart2, Globe, Zap,
  Edit3, Archive, MoreVertical, ChevronRight, Filter, Download,
  FileText, Bell, BellOff, Shield, TrendingUp, AlertTriangle,
  ToggleLeft, ToggleRight, Star, Paperclip, Hash, PieChart, Inbox,
  ClipboardList, ThumbsUp, ThumbsDown, RotateCcw, Tag, Lock, Unlock,
  Activity, Layers, Info, GraduationCap, Building, UserCheck, LifeBuoy,
  Megaphone, HelpCircle, BookOpen, Scale
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'board' | 'submit' | 'rules' | 'analytics';
type TicketCategory = 'academic' | 'transport' | 'hostel' | 'fee' | 'teacher' | 'facility' | 'staff_behavior' | 'bullying' | 'exam' | 'other';
type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed' | 'rejected';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type RaisedBy = 'student' | 'parent' | 'teacher' | 'staff';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface Ticket {
  id: number;
  ticketNo: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: Priority;
  raisedBy: RaisedBy;
  raisedByName: string;
  raisedByClass?: string;
  assignedTo?: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  expectedResolution: string;
  attachments: string[];
  tags: string[];
  isAnonymous: boolean;
  satisfaction?: 'satisfied' | 'neutral' | 'unsatisfied';
  escalationLevel: number; // 0 = not escalated, 1 = HOD, 2 = Principal, 3 = Management
  responses: TicketResponse[];
  views: number;
}

interface TicketResponse {
  id: number;
  author: string;
  authorRole: string;
  message: string;
  timestamp: string;
  isInternal: boolean; // Internal note not visible to complainant
}

interface EscalationRule {
  id: number;
  name: string;
  category: TicketCategory | 'all';
  triggerAfterHours: number;
  escalateTo: string;
  channel: 'push' | 'sms' | 'email' | 'all';
  isEnabled: boolean;
  description: string;
}

interface SubmitForm {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: Priority;
  raisedBy: RaisedBy;
  raisedByName: string;
  raisedByClass: string;
  department: string;
  isAnonymous: boolean;
  attachments: string;
  tags: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1, ticketNo: 'GRV-2026-0042', subject: 'Bus Route 7 Consistently Late by 30+ Minutes',
    description: 'The school bus on Route 7 (Sector 18 stop) has been arriving 30-45 minutes late every day for the past 2 weeks. My son misses the first period regularly. This is causing academic disturbance and stress. Despite multiple verbal complaints to the bus driver, no improvement has been seen.',
    category: 'transport', status: 'in_progress', priority: 'high', raisedBy: 'parent',
    raisedByName: 'Mr. Ramesh Sharma', raisedByClass: '10-A (Parent)', department: 'Transport',
    assignedTo: 'Mr. V. Singh (Transport Head)', createdAt: '2026-06-22 09:15 AM', updatedAt: '2026-06-23 11:30 AM',
    expectedResolution: '2026-06-27', attachments: ['route7_delay_photo.jpg'],
    tags: ['bus', 'transport', 'punctuality'], isAnonymous: false, escalationLevel: 1,
    views: 12,
    responses: [
      { id: 1, author: 'Mr. V. Singh', authorRole: 'Transport Head', message: 'We have received your complaint and have asked the driver supervisor to investigate the route delay. A new schedule will be implemented from Monday. We sincerely apologize for the inconvenience.', timestamp: '2026-06-23 11:30 AM', isInternal: false },
      { id: 2, author: 'Mr. K. Iyer', authorRole: 'Admin (Internal)', message: 'Driver was reported sick on June 20-21. A replacement was arranged but unfamiliar with route stops. Issue being permanently addressed by assigning a designated backup driver.', timestamp: '2026-06-23 10:15 AM', isInternal: true }
    ]
  },
  {
    id: 2, ticketNo: 'GRV-2026-0041', subject: 'Chemistry Teacher Using Harsh Language in Class',
    description: 'The Chemistry teacher (Class 11-A) regularly uses sarcastic and demeaning language with students who score poorly in tests. Last week, a classmate was publicly humiliated in front of 40 students. Several students are afraid to ask questions. This is creating a toxic classroom environment.',
    category: 'teacher', status: 'escalated', priority: 'critical', raisedBy: 'student',
    raisedByName: 'Anonymous Student', raisedByClass: '11-A', department: 'Academic',
    assignedTo: 'Vice Principal', createdAt: '2026-06-21 06:40 PM', updatedAt: '2026-06-24 09:00 AM',
    expectedResolution: '2026-06-28', attachments: [],
    tags: ['teacher-behavior', 'mental-health', 'chemistry'], isAnonymous: true, escalationLevel: 2,
    views: 8,
    responses: [
      { id: 1, author: 'Ms. P. Nair', authorRole: 'Vice Principal', message: 'This matter is being taken very seriously. An inquiry has been initiated. The concerned teacher has been counselled and issued a verbal warning. Classroom observations will be conducted for the next 2 weeks.', timestamp: '2026-06-24 09:00 AM', isInternal: false },
      { id: 2, author: 'Principal Office', authorRole: 'Admin (Internal)', message: 'Case escalated to discipline committee. Teacher placed under observation. HR notified. Parents to be informed through class teacher.', timestamp: '2026-06-23 04:30 PM', isInternal: true }
    ]
  },
  {
    id: 3, ticketNo: 'GRV-2026-0040', subject: 'Science Lab Safety Equipment Not Available',
    description: 'The science lab does not have functional safety goggles for Class 9 and 10. Students are being made to conduct practical experiments without protective eyewear. This is a serious safety hazard and should be addressed immediately.',
    category: 'facility', status: 'open', priority: 'high', raisedBy: 'teacher',
    raisedByName: 'Mrs. Sunita Gupta', raisedByClass: '', department: 'Facilities',
    assignedTo: undefined, createdAt: '2026-06-24 08:30 AM', updatedAt: '2026-06-24 08:30 AM',
    expectedResolution: '2026-06-26', attachments: ['lab_equipment.jpg', 'safety_concern.pdf'],
    tags: ['safety', 'lab', 'equipment'], isAnonymous: false, escalationLevel: 0,
    views: 3,
    responses: []
  },
  {
    id: 4, ticketNo: 'GRV-2026-0039', subject: 'Q1 Fee Receipt Not Generated After Online Payment',
    description: 'I completed my ward\'s Q1 2026 fee payment of ₹18,500 on June 15 via the school portal (Transaction ID: HDFC202606154). Despite 9 days, no receipt has been issued. The accounts office has not responded to 3 follow-up emails. My ward is being denied exam hall ticket due to the pending receipt.',
    category: 'fee', status: 'resolved', priority: 'critical', raisedBy: 'parent',
    raisedByName: 'Mrs. Anita Deshmukh', raisedByClass: '9-C (Parent)', department: 'Accounts',
    assignedTo: 'Mr. A. Gupta (Accounts)', createdAt: '2026-06-18 04:00 PM', updatedAt: '2026-06-22 10:00 AM',
    resolvedAt: '2026-06-22', expectedResolution: '2026-06-20', attachments: ['payment_screenshot.jpg'],
    tags: ['fee', 'receipt', 'online-payment'], isAnonymous: false, escalationLevel: 1,
    satisfaction: 'satisfied', views: 22,
    responses: [
      { id: 1, author: 'Mr. A. Gupta', authorRole: 'Accounts Manager', message: 'We sincerely apologize for the delay. Your transaction was received but had a portal sync issue. The receipt (No: REC-2026-9720) has been generated and emailed to you. Hall ticket has been authorized for your ward.', timestamp: '2026-06-22 10:00 AM', isInternal: false }
    ]
  },
  {
    id: 5, ticketNo: 'GRV-2026-0038', subject: 'Hostel Room Water Heater Not Working Since 2 Weeks',
    description: 'The water heater in Room 204 (Block B, Boys Hostel) has been non-functional for the past 14 days. Multiple requests to the hostel warden have been ignored. Students are forced to bathe in cold water at 5:30 AM. This is a basic amenity issue.',
    category: 'hostel', status: 'in_progress', priority: 'medium', raisedBy: 'student',
    raisedByName: 'Aarav Mishra', raisedByClass: 'Class 11-B', department: 'Hostel',
    assignedTo: 'Mr. S. Menon (Warden)', createdAt: '2026-06-20 08:00 PM', updatedAt: '2026-06-24 07:00 AM',
    expectedResolution: '2026-06-25', attachments: [],
    tags: ['hostel', 'maintenance', 'amenities'], isAnonymous: false, escalationLevel: 0,
    views: 9,
    responses: [
      { id: 1, author: 'Mr. S. Menon', authorRole: 'Hostel Warden', message: 'The electrician has been called and will inspect Room 204 tomorrow morning. We will install a replacement heater by 25th June. Sorry for the delay.', timestamp: '2026-06-24 07:00 AM', isInternal: false }
    ]
  },
  {
    id: 6, ticketNo: 'GRV-2026-0037', subject: 'Incorrect Marks Recorded in Mid-Term Result',
    description: 'My ward\'s Mathematics marks in the mid-term result (Class 10-A, Roll No: 18) shows 42/80 but the answer sheet clearly shows 58/80 after rechecking with the student. The class teacher confirmed the discrepancy but said the portal marks cannot be changed without formal complaint.',
    category: 'exam', status: 'resolved', priority: 'high', raisedBy: 'parent',
    raisedByName: 'Mr. Suresh Kumar', raisedByClass: '10-A (Parent)', department: 'Academic',
    assignedTo: 'HOD Mathematics', createdAt: '2026-06-15 12:00 PM', updatedAt: '2026-06-19 03:00 PM',
    resolvedAt: '2026-06-19', expectedResolution: '2026-06-18', attachments: ['answersheet_photo.jpg'],
    tags: ['marks', 'exam', 'result-correction'], isAnonymous: false, escalationLevel: 0,
    satisfaction: 'satisfied', views: 18,
    responses: [
      { id: 1, author: 'Mrs. S. Verma', authorRole: 'HOD Mathematics', message: 'After reviewing the answer sheet, we confirm the marks were incorrectly entered. The corrected score (58/80) has been updated in the system. Apologies for the error. Updated report card will be issued.', timestamp: '2026-06-19 03:00 PM', isInternal: false }
    ]
  },
  {
    id: 7, ticketNo: 'GRV-2026-0036', subject: 'Playground Equipment Damaged and Poses Injury Risk',
    description: 'The slide in the primary wing playground has a broken step and a sharp exposed metal edge. Two students have already suffered minor cuts. The incident was reported to the class teacher on June 12 but nothing has been done. Request immediate repair.',
    category: 'facility', status: 'closed', priority: 'critical', raisedBy: 'teacher',
    raisedByName: 'Ms. Meena Joshi', raisedByClass: '', department: 'Facilities',
    assignedTo: 'Facility Manager', createdAt: '2026-06-14 02:00 PM', updatedAt: '2026-06-17 05:00 PM',
    resolvedAt: '2026-06-17', expectedResolution: '2026-06-15', attachments: ['playground_damage.jpg'],
    tags: ['safety', 'playground', 'injury-risk'], isAnonymous: false, escalationLevel: 0,
    satisfaction: 'satisfied', views: 31,
    responses: [
      { id: 1, author: 'Mr. R. Tiwari', authorRole: 'Facility Manager', message: 'Playground equipment has been repaired and the sharp edges have been sanded and covered. Slide has been temporarily cordoned off until final safety check on June 18.', timestamp: '2026-06-17 05:00 PM', isInternal: false }
    ]
  }
];

const MOCK_RULES: EscalationRule[] = [
  { id: 1, name: 'Critical Priority Auto-Escalation', category: 'all', triggerAfterHours: 4, escalateTo: 'Vice Principal', channel: 'all', isEnabled: true, description: 'Any critical priority ticket unattended for 4 hours auto-escalates to Vice Principal.' },
  { id: 2, name: 'Teacher Behavior to Principal', category: 'teacher', triggerAfterHours: 12, escalateTo: 'Principal', channel: 'push', isEnabled: true, description: 'Teacher behavior complaints escalate to Principal if unresolved within 12 hours.' },
  { id: 3, name: 'Fee Dispute to Accounts HOD', category: 'fee', triggerAfterHours: 24, escalateTo: 'Accounts Manager', channel: 'email', isEnabled: true, description: 'Fee related complaints escalate to Accounts Manager after 24 hours without resolution.' },
  { id: 4, name: 'High Priority General Auto-Escalation', category: 'all', triggerAfterHours: 48, escalateTo: 'HOD / Department Head', channel: 'sms', isEnabled: false, description: 'High priority tickets auto-escalate to HOD if open for more than 48 hours.' },
  { id: 5, name: 'Bullying & Safety Alert', category: 'bullying', triggerAfterHours: 2, escalateTo: 'Principal + School Counsellor', channel: 'all', isEnabled: true, description: 'Any bullying report is immediately flagged and escalated within 2 hours.' }
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<TicketCategory, { label: string; color: string; bg: string; border: string; emoji: string; dept: string }> = {
  academic:       { label: 'Academic',          color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   emoji: '📚', dept: 'Academic' },
  transport:      { label: 'Transport',          color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  emoji: '🚌', dept: 'Transport' },
  hostel:         { label: 'Hostel',             color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', emoji: '🏢', dept: 'Hostel' },
  fee:            { label: 'Fee & Accounts',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',emoji: '💰', dept: 'Accounts' },
  teacher:        { label: 'Teacher Behavior',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    emoji: '👨‍🏫', dept: 'Academic' },
  facility:       { label: 'Facility & Campus',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',   emoji: '🏗️', dept: 'Facilities' },
  staff_behavior: { label: 'Staff Behavior',     color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', emoji: '👥', dept: 'HR' },
  bullying:       { label: 'Bullying & Safety',  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   emoji: '🛡️', dept: 'Student Welfare' },
  exam:           { label: 'Exam & Results',     color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200', emoji: '📝', dept: 'Examinations' },
  other:          { label: 'Other / General',    color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200',  emoji: '🗂️', dept: 'Admin' }
};

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; dot: string }> = {
  open:        { label: 'Open',        color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: <Inbox className="w-3 h-3" />,       dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  icon: <RefreshCw className="w-3 h-3" />,    dot: 'bg-amber-500 animate-pulse' },
  escalated:   { label: 'Escalated',   color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   icon: <AlertTriangle className="w-3 h-3" />,dot: 'bg-rose-500 animate-pulse' },
  resolved:    { label: 'Resolved',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',icon: <CheckCircle className="w-3 h-3" />,  dot: 'bg-emerald-500' },
  closed:      { label: 'Closed',      color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',  icon: <Archive className="w-3 h-3" />,      dot: 'bg-slate-400' },
  rejected:    { label: 'Rejected',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    icon: <XCircle className="w-3 h-3" />,      dot: 'bg-red-500' }
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  low:      { label: 'Low',      color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  medium:   { label: 'Medium',   color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500' },
  high:     { label: 'High',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500' },
  critical: { label: 'Critical', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500 animate-pulse' }
};

const RAISED_BY_CFG: Record<RaisedBy, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  student: { label: 'Student',  color: 'text-violet-700',  bg: 'bg-violet-50',  icon: <GraduationCap className="w-3 h-3" /> },
  parent:  { label: 'Parent',   color: 'text-blue-700',    bg: 'bg-blue-50',    icon: <User className="w-3 h-3" /> },
  teacher: { label: 'Teacher',  color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <BookOpen className="w-3 h-3" /> },
  staff:   { label: 'Staff',    color: 'text-amber-700',   bg: 'bg-amber-50',   icon: <Building className="w-3 h-3" /> }
};

const ESC_LEVEL_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: 'Not Escalated', color: 'text-slate-500' },
  1: { label: 'Level 1 – HOD', color: 'text-amber-600' },
  2: { label: 'Level 2 – Principal', color: 'text-orange-600' },
  3: { label: 'Level 3 – Management', color: 'text-red-700' }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

let ticketCounter = 43;

const emptyForm = (): SubmitForm => ({
  subject: '', description: '', category: 'academic', priority: 'medium',
  raisedBy: 'parent', raisedByName: '', raisedByClass: '', department: '',
  isAnonymous: false, attachments: '', tags: ''
});

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-700`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const ComplaintGrievanceDesk: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [rules, setRules] = useState<EscalationRule[]>(MOCK_RULES);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(MOCK_TICKETS[0]);
  const [form, setForm] = useState<SubmitForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<TicketCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>('in_progress');
  const [assignText, setAssignText] = useState('');
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState<'satisfied' | 'neutral' | 'unsatisfied' | null>(null);

  // ── Derived Stats ──
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const escalatedCount = tickets.filter(t => t.status === 'escalated').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;
  const satisfiedCount = tickets.filter(t => t.satisfaction === 'satisfied').length;
  const ratedTickets = tickets.filter(t => t.satisfaction !== undefined).length;
  const satisfactionRate = ratedTickets > 0 ? Math.round((satisfiedCount / ratedTickets) * 100) : 0;

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery &&
      !t.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.raisedByName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sorted: critical + open first, then in_progress, then resolved/closed
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const order = { open: 0, escalated: 1, in_progress: 2, resolved: 3, closed: 4, rejected: 5 };
    const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return prioOrder[a.priority] - prioOrder[b.priority];
  });

  // ── Handlers ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) { toast.error('Subject is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (!form.isAnonymous && !form.raisedByName.trim()) { toast.error('Name is required'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    ticketCounter++;
    const cat = CATEGORY_CFG[form.category];
    const newTicket: Ticket = {
      id: Date.now(), ticketNo: `GRV-2026-${String(ticketCounter).padStart(4, '0')}`,
      subject: form.subject, description: form.description, category: form.category,
      status: 'open', priority: form.priority, raisedBy: form.raisedBy,
      raisedByName: form.isAnonymous ? 'Anonymous' : form.raisedByName,
      raisedByClass: form.raisedByClass, department: form.department || cat.dept,
      assignedTo: undefined, createdAt: new Date().toLocaleString('en-IN'),
      updatedAt: new Date().toLocaleString('en-IN'), expectedResolution: '',
      attachments: form.attachments ? form.attachments.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      isAnonymous: form.isAnonymous, escalationLevel: 0, views: 0, responses: []
    };
    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    toast.success(`✅ Grievance registered as ${newTicket.ticketNo}! You will be notified of updates.`);
    setForm(emptyForm());
    setActiveTab('board');
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) { toast.error('Reply cannot be empty'); return; }
    setSendingReply(true);
    await new Promise(r => setTimeout(r, 1200));
    setSendingReply(false);
    const newReply: TicketResponse = {
      id: Date.now(), author: 'Admin / HOD', authorRole: 'School Administration',
      message: replyText, timestamp: new Date().toLocaleString('en-IN'), isInternal: isInternalNote
    };
    const updated = { ...selectedTicket, responses: [...selectedTicket.responses, newReply], updatedAt: new Date().toLocaleString('en-IN') };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setReplyText('');
    toast.success(isInternalNote ? '🔒 Internal note saved.' : '📤 Reply sent to complainant!');
  };

  const updateStatus = async (ticketId: number, status: TicketStatus) => {
    setUpdatingStatus(true);
    await new Promise(r => setTimeout(r, 1000));
    setUpdatingStatus(false);
    const updatedTicket = tickets.find(t => t.id === ticketId);
    const updated = { ...updatedTicket!, status, updatedAt: new Date().toLocaleString('en-IN'), ...(status === 'resolved' ? { resolvedAt: new Date().toISOString().split('T')[0] } : {}) };
    setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
    setSelectedTicket(updated);
    toast.success(`Ticket status updated to "${STATUS_CFG[status].label}"`);
  };

  const assignTicket = () => {
    if (!assignText.trim() || !selectedTicket) { toast.error('Enter assignee name'); return; }
    const updated = { ...selectedTicket, assignedTo: assignText, status: 'in_progress' as TicketStatus, updatedAt: new Date().toLocaleString('en-IN') };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setAssignText('');
    toast.success(`✅ Ticket assigned to "${assignText}" and set to In Progress.`);
  };

  const escalateTicket = () => {
    if (!selectedTicket) return;
    const newLevel = Math.min(3, selectedTicket.escalationLevel + 1);
    const updated = { ...selectedTicket, escalationLevel: newLevel, status: 'escalated' as TicketStatus, updatedAt: new Date().toLocaleString('en-IN') };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setShowEscalateDialog(false);
    toast.success(`⚠️ Ticket escalated to ${ESC_LEVEL_LABEL[newLevel].label}! Alert sent.`);
  };

  const submitSatisfaction = (rating: 'satisfied' | 'neutral' | 'unsatisfied') => {
    if (!selectedTicket) return;
    setSatisfactionRating(rating);
    const updated = { ...selectedTicket, satisfaction: rating };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    const msgs = { satisfied: '😊 Thank you for your positive feedback!', neutral: '🤝 Feedback noted. We aim to do better.', unsatisfied: '😔 We apologize. Your feedback has been escalated to management.' };
    toast.success(msgs[rating]);
  };

  const toggleRule = (id: number) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-700 to-rose-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Complaint & Grievance Desk</h1>
            <p className="text-[9px] text-red-100 font-medium">Submit · Track · Respond · Escalate · Resolve</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 bg-red-500/30 border border-red-400/50 px-2.5 py-1 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-200" />
              <span className="text-[9px] font-extrabold text-red-100">{criticalCount} Critical</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-bold">{openCount + inProgressCount} Active</span>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3 text-emerald-300" />
            <span className="text-[9px] font-bold text-emerald-200">{satisfactionRate}% Satisfied</span>
          </div>
          <button onClick={() => { setForm(emptyForm()); setActiveTab('submit'); }}
            className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Raise Grievance
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50/40 border-b border-red-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Open', val: openCount,       icon: <Inbox className="w-3 h-3" />,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    onClick: () => setFilterStatus('open') },
          { label: 'In Progress', val: inProgressCount, icon: <RefreshCw className="w-3 h-3" />, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',  onClick: () => setFilterStatus('in_progress') },
          { label: 'Escalated', val: escalatedCount, icon: <AlertTriangle className="w-3 h-3" />, color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',   onClick: () => setFilterStatus('escalated') },
          { label: 'Resolved', val: resolvedCount,  icon: <CheckCircle className="w-3 h-3" />,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',onClick: () => setFilterStatus('resolved') },
          { label: 'Total Tickets', val: tickets.length, icon: <ClipboardList className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', onClick: () => setFilterStatus('all') },
        ].map((s, i) => (
          <button key={i} onClick={s.onClick}
            className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer hover:opacity-80 transition`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'board',     label: 'Grievance Board',      icon: <ClipboardList className="w-3.5 h-3.5" />, badge: openCount + escalatedCount },
          { key: 'submit',    label: 'Raise New Grievance',  icon: <Plus className="w-3.5 h-3.5" /> },
          { key: 'rules',     label: 'Escalation Rules',     icon: <Zap className="w-3.5 h-3.5" />, badge: rules.filter(r => r.isEnabled).length },
          { key: 'analytics', label: 'Resolution Analytics', icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-red-700 border-b-2 border-red-600 bg-red-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className={`text-white text-[7px] font-bold px-1 py-0.5 rounded-full ${t.key === 'board' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}>{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ GRIEVANCE BOARD ═════════ */}
        {activeTab === 'board' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Ticket List */}
            <div className="w-96 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search ticket, subject, name…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300" />
                  </div>
                  <button onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); setSearchQuery(''); }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer" title="Reset Filters">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status filter pills */}
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {(['all', 'open', 'in_progress', 'escalated', 'resolved', 'closed'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-red-700 text-white border-red-700' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'}`}>
                      {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : STATUS_CFG[s as TicketStatus]?.label}
                    </button>
                  ))}
                </div>

                {/* Category & Priority filters */}
                <div className="flex gap-1.5">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as TicketCategory | 'all')}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Priorities</option>
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>
              </div>

              {/* Ticket rows */}
              <div className="flex-1 divide-y divide-slate-100">
                {sortedTickets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <LifeBuoy className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No tickets match filters</p>
                  </div>
                )}
                {sortedTickets.map(ticket => {
                  const cat = CATEGORY_CFG[ticket.category];
                  const st = STATUS_CFG[ticket.status];
                  const pri = PRIORITY_CFG[ticket.priority];
                  const rb = RAISED_BY_CFG[ticket.raisedBy];
                  const isSelected = selectedTicket?.id === ticket.id;
                  return (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-red-50/20 transition ${isSelected ? 'bg-red-50/40 border-l-2 border-red-600' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cat.bg}`}>
                          {cat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 gap-1">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{ticket.subject}</p>
                            {ticket.priority === 'critical' && <Flag className="w-2.5 h-2.5 text-red-500 fill-red-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[7.5px] text-slate-400 font-mono mb-1">{ticket.ticketNo} · {ticket.department}</p>
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            <span className={`flex items-center gap-0.5 text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                              <span className={`w-1 h-1 rounded-full ${st.dot} inline-block`} /> {st.label}
                            </span>
                            <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>{pri.label}</span>
                            <span className={`flex items-center gap-0.5 text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${rb.bg} ${rb.color}`}>
                              {rb.icon} {ticket.isAnonymous ? 'Anonymous' : ticket.raisedByName.split(' ').slice(0, 2).join(' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[7.5px] text-slate-400">
                            <span className="flex items-center gap-0.5"><Clock className="w-2 h-2" /> {ticket.createdAt}</span>
                            {ticket.responses.length > 0 && (
                              <span className="flex items-center gap-0.5 text-blue-500 font-bold"><MessageSquare className="w-2 h-2" /> {ticket.responses.filter(r => !r.isInternal).length} replies</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Ticket Detail Panel */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              {!selectedTicket ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Scale className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select a ticket to view details & respond</p>
                </div>
              ) : (() => {
                const t = selectedTicket;
                const cat = CATEGORY_CFG[t.category];
                const st = STATUS_CFG[t.status];
                const pri = PRIORITY_CFG[t.priority];
                const rb = RAISED_BY_CFG[t.raisedBy];
                const escInfo = ESC_LEVEL_LABEL[t.escalationLevel];

                return (
                  <div className="flex flex-col h-full">
                    {/* Ticket Header */}
                    <div className={`px-5 py-3.5 border-b border-slate-200 bg-white`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[7.5px] font-mono text-slate-400">{t.ticketNo}</span>
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color} ${st.border} border`}>
                              {st.icon} {st.label}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${pri.bg} ${pri.color} ${pri.border}`}>{pri.label}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.emoji} {cat.label}</span>
                            {t.isAnonymous && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Anonymous
                              </span>
                            )}
                          </div>
                          <h2 className="text-[13px] font-extrabold text-slate-900 leading-tight">{t.subject}</h2>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'rejected' && (
                            <button onClick={() => setShowEscalateDialog(true)}
                              className="flex items-center gap-1 text-[8.5px] font-bold px-2 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition">
                              <AlertTriangle className="w-3 h-3" /> Escalate
                            </button>
                          )}
                          {t.status === 'resolved' && !t.satisfaction && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] text-slate-500">Rate resolution:</span>
                              <button onClick={() => submitSatisfaction('satisfied')} className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-100 cursor-pointer"><ThumbsUp className="w-3 h-3" /></button>
                              <button onClick={() => submitSatisfaction('neutral')} className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 cursor-pointer"><HelpCircle className="w-3 h-3" /></button>
                              <button onClick={() => submitSatisfaction('unsatisfied')} className="p-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"><ThumbsDown className="w-3 h-3" /></button>
                            </div>
                          )}
                          {t.satisfaction && (
                            <span className={`text-[8px] font-bold px-2 py-1 rounded-full border ${t.satisfaction === 'satisfied' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : t.satisfaction === 'neutral' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              {t.satisfaction === 'satisfied' ? '😊 Satisfied' : t.satisfaction === 'neutral' ? '😐 Neutral' : '😔 Unsatisfied'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Meta Bar */}
                      <div className="flex items-center gap-3 flex-wrap text-[8px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          {rb.icon} <span className={rb.color}>{rb.label}</span>: <strong className="text-slate-700">{t.isAnonymous ? 'Anonymous' : t.raisedByName}</strong>
                          {t.raisedByClass && <span> ({t.raisedByClass})</span>}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Building className="w-2.5 h-2.5" /> Dept: <strong className="text-slate-700">{t.department}</strong></span>
                        {t.assignedTo && <><span>·</span><span className="flex items-center gap-1"><UserCheck className="w-2.5 h-2.5 text-emerald-500" /> Assigned: <strong className="text-slate-700">{t.assignedTo}</strong></span></>}
                        <span>·</span>
                        <span className={`font-bold ${escInfo.color}`}>{escInfo.label}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {t.createdAt}</span>
                      </div>
                    </div>

                    {/* Escalation Dialog Overlay */}
                    {showEscalateDialog && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-80 border border-rose-200">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="text-[12px] font-extrabold text-slate-800">Escalate Ticket</h3>
                          </div>
                          <p className="text-[9px] text-slate-600 mb-4">This will escalate ticket <strong>{t.ticketNo}</strong> to the next level ({ESC_LEVEL_LABEL[Math.min(3, t.escalationLevel + 1)].label}). Notification will be sent immediately.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setShowEscalateDialog(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 text-[9px] font-bold rounded-lg cursor-pointer hover:bg-slate-50">Cancel</button>
                            <button onClick={escalateTicket} className="flex-1 py-2 bg-rose-600 text-white text-[9px] font-extrabold rounded-lg cursor-pointer hover:bg-rose-700">Confirm Escalate</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">

                      {/* Description + Admin Actions Row */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Description */}
                        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                          <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Complaint Description</h4>
                          <p className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line">{t.description}</p>

                          {t.attachments.length > 0 && (
                            <div className="border-t border-slate-100 pt-3">
                              <h5 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Attachments</h5>
                              <div className="flex flex-wrap gap-2">
                                {t.attachments.map((att, i) => (
                                  <button key={i} onClick={() => toast.success(`Opening ${att}`)}
                                    className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-[8.5px] font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg cursor-pointer">
                                    <Paperclip className="w-2.5 h-2.5 text-red-500" /> {att}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2">
                              {t.tags.map((tag, i) => (
                                <span key={i} className="flex items-center gap-0.5 bg-slate-100 text-slate-600 text-[7.5px] font-bold px-1.5 py-0.5 rounded-full">
                                  <Tag className="w-2 h-2" /> {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Admin Actions Panel */}
                        <div className="space-y-3">
                          {/* Status Update */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                            <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Update Status</h4>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value as TicketStatus)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-medium bg-white outline-none">
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button onClick={() => updateStatus(t.id, newStatus)} disabled={updatingStatus}
                              className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-extrabold rounded-lg cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                              {updatingStatus ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Apply Status
                            </button>
                          </div>

                          {/* Assign */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                            <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Assign To</h4>
                            <input type="text" placeholder="e.g. HOD Science" value={assignText}
                              onChange={e => setAssignText(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-medium outline-none focus:ring-2 focus:ring-red-200" />
                            <button onClick={assignTicket}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-extrabold rounded-lg cursor-pointer flex items-center justify-center gap-1">
                              <UserCheck className="w-3 h-3" /> Assign & Notify
                            </button>
                          </div>

                          {/* Resolution Target */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
                            <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Resolution Timeline</h4>
                            <p className="text-[9px] text-slate-600 font-mono">Expected: <span className="font-extrabold text-red-600">{t.expectedResolution || '—'}</span></p>
                            {t.resolvedAt && <p className="text-[9px] text-emerald-600 font-bold">✅ Resolved: {t.resolvedAt}</p>}
                            <p className="text-[8px] text-slate-400">Updated: {t.updatedAt}</p>
                          </div>
                        </div>
                      </div>

                      {/* Response Thread */}
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <h4 className="text-[10px] font-extrabold text-slate-700">Communication Thread ({t.responses.length})</h4>
                          <span className="text-[8px] text-slate-400">🔒 = Internal note only</span>
                        </div>

                        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {t.responses.length === 0 && (
                            <div className="py-6 text-center text-slate-400">
                              <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-30" />
                              <p className="text-[9px]">No responses yet. Add the first reply below.</p>
                            </div>
                          )}
                          {t.responses.map(resp => (
                            <div key={resp.id} className={`p-3 ${resp.isInternal ? 'bg-amber-50/30' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${resp.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {resp.author.charAt(0)}
                                </div>
                                <span className="text-[9px] font-extrabold text-slate-700">{resp.author}</span>
                                <span className="text-[8px] text-slate-400">· {resp.authorRole}</span>
                                {resp.isInternal && <span className="text-[7.5px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"><Lock className="w-2 h-2" /> Internal</span>}
                                <span className="text-[7.5px] text-slate-400 ml-auto">{resp.timestamp}</span>
                              </div>
                              <p className="text-[9px] text-slate-700 leading-relaxed ml-7">{resp.message}</p>
                            </div>
                          ))}
                        </div>

                        {/* Reply Composer */}
                        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[9px] font-bold text-slate-600">Reply Type:</span>
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                              <input type="radio" name="replyType" checked={!isInternalNote} onChange={() => setIsInternalNote(false)} className="text-blue-500" />
                              <span className="text-[8.5px] font-medium text-slate-600">Send to Complainant</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                              <input type="radio" name="replyType" checked={isInternalNote} onChange={() => setIsInternalNote(true)} className="text-amber-500" />
                              <span className="text-[8.5px] font-medium text-amber-700">🔒 Internal Note</span>
                            </label>
                          </div>
                          <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder={isInternalNote ? "Add internal note visible only to admins…" : "Type response to be sent to the complainant…"}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[9.5px] font-medium outline-none focus:ring-2 focus:ring-red-200 bg-white" />
                          <div className="flex justify-end">
                            <button onClick={sendReply} disabled={sendingReply}
                              className={`flex items-center gap-1.5 text-white text-[9px] font-extrabold px-4 py-2 rounded-lg cursor-pointer shadow-sm disabled:opacity-50 ${isInternalNote ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'}`}>
                              {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              {isInternalNote ? 'Save Internal Note' : 'Send Reply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ SUBMIT GRIEVANCE ═════════ */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-700 to-rose-600 px-5 py-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <LifeBuoy className="w-4 h-4" />
                  <h3 className="text-[12px] font-extrabold">Register New Complaint / Grievance</h3>
                </div>
                <p className="text-[9px] text-red-100">All complaints are treated confidentially. Your ticket will be tracked and resolved within the SLA period.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600">Subject of Complaint <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Brief one-line summary of your complaint…" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600">Detailed Description <span className="text-red-500">*</span></label>
                  <textarea rows={5} placeholder="Describe the issue in complete detail. Include dates, names, incidents, and any prior communication made…" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Grievance Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as TicketCategory, department: CATEGORY_CFG[e.target.value as TicketCategory].dept })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white">
                      {Object.entries(CATEGORY_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Urgency / Priority <span className="text-red-500">*</span></label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white">
                      <option value="low">⚪ Low – Minor inconvenience</option>
                      <option value="medium">🟡 Medium – Moderately affecting</option>
                      <option value="high">🟠 High – Significantly disrupting</option>
                      <option value="critical">🔴 Critical – Immediate action needed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Complaint Raised By</label>
                    <select value={form.raisedBy} onChange={e => setForm({ ...form, raisedBy: e.target.value as RaisedBy })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white">
                      <option value="parent">👨‍👩‍👧 Parent</option>
                      <option value="student">🎓 Student</option>
                      <option value="teacher">📖 Teacher</option>
                      <option value="staff">🏢 Non-Teaching Staff</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Full Name {!form.isAnonymous && <span className="text-red-500">*</span>}</label>
                    <input type="text" placeholder={form.isAnonymous ? 'Hidden (anonymous)' : 'Your full name'} value={form.raisedByName}
                      disabled={form.isAnonymous}
                      onChange={e => setForm({ ...form, raisedByName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Class / Ward Class</label>
                    <input type="text" placeholder="e.g. 10-A or Parent of 10-A" value={form.raisedByClass}
                      onChange={e => setForm({ ...form, raisedByClass: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Evidence / Attachment Names</label>
                    <input type="text" placeholder="photo.jpg, proof.pdf (comma-separated)" value={form.attachments}
                      onChange={e => setForm({ ...form, attachments: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600">Keywords / Tags</label>
                    <input type="text" placeholder="bus, delay, morning (comma-separated)" value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 bg-white" />
                  </div>
                </div>

                <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 flex items-start gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({ ...form, isAnonymous: e.target.checked, raisedByName: e.target.checked ? '' : form.raisedByName })}
                      className="rounded border-amber-400 text-amber-500 w-4 h-4" />
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1"><Lock className="w-3 h-3" /> Submit Anonymously</span>
                      <p className="text-[8.5px] text-amber-700 font-medium mt-0.5">Your identity will be completely hidden from all parties. Only the Grievance Committee can view your original submission.</p>
                    </div>
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <button type="button" onClick={() => setForm(emptyForm())}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition">
                    Clear Form
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-[9px] font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Grievance Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ ESCALATION RULES ═════════ */}
        {activeTab === 'rules' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-[12px] font-extrabold">Escalation Rules Engine</h3>
                  <p className="text-[9px] text-slate-300 font-medium">Automated SLA breach monitoring and ticket escalation triggers</p>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3 text-emerald-300" />
                  <span className="text-[9px] font-bold text-emerald-200">{rules.filter(r => r.isEnabled).length} Active Rules</span>
                </div>
              </div>

              {/* SLA Reference Bands */}
              <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 text-center bg-slate-50/50">
                {[
                  { label: 'Critical SLA', val: '4 hrs', color: 'text-red-600' },
                  { label: 'High Priority SLA', val: '24 hrs', color: 'text-amber-600' },
                  { label: 'Medium Priority SLA', val: '48 hrs', color: 'text-blue-600' },
                  { label: 'Low Priority SLA', val: '72 hrs', color: 'text-slate-500' }
                ].map((b, i) => (
                  <div key={i} className="p-3">
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">{b.label}</p>
                    <p className={`text-[12px] font-extrabold mt-0.5 ${b.color}`}>{b.val}</p>
                  </div>
                ))}
              </div>

              {/* Rules List */}
              <div className="divide-y divide-slate-200">
                {rules.map(rule => {
                  const catCfg = rule.category !== 'all' ? CATEGORY_CFG[rule.category as TicketCategory] : null;
                  return (
                    <div key={rule.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition">
                      <div className="space-y-1 pr-6 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-slate-800">{rule.name}</span>
                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-red-50 border border-red-100 text-red-600 rounded-full">⏱ {rule.triggerAfterHours}h SLA</span>
                          {catCfg && (
                            <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${catCfg.bg} ${catCfg.color}`}>{catCfg.emoji} {catCfg.label}</span>
                          )}
                          {!catCfg && <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full">🗂 All Categories</span>}
                        </div>
                        <p className="text-[9px] text-slate-600 mt-0.5">{rule.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-bold text-slate-500">Escalate to: <span className="text-slate-700 font-extrabold">{rule.escalateTo}</span></span>
                          <span className="text-[8px] font-bold text-slate-400">via {rule.channel.toUpperCase()}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleRule(rule.id)} className="cursor-pointer mt-0.5">
                        {rule.isEnabled ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-400" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policy note */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-blue-900">Grievance Policy SLA Guidelines</h4>
                <p className="text-[9px] text-blue-700 leading-relaxed mt-0.5">As per the School Grievance Policy 2024, all Critical and Bullying-related complaints must be acknowledged within 2 hours and resolved within 24 hours. Any breach triggers an automatic escalation to the next administrative level and alerts the Grievance Committee members.</p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Resolution Rate', val: `${Math.round((resolvedCount / tickets.length) * 100)}%`, sub: `${resolvedCount} of ${tickets.length} resolved`, color: 'text-emerald-600' },
                { label: 'Avg Resolution Time', val: '2.4 days', sub: 'Across all resolved tickets', color: 'text-blue-600' },
                { label: 'Escalation Rate', val: `${Math.round((escalatedCount / tickets.length) * 100)}%`, sub: `${escalatedCount} escalated tickets`, color: 'text-rose-600' },
                { label: 'Satisfaction Rate', val: `${satisfactionRate}%`, sub: `${satisfiedCount} of ${ratedTickets} rated positive`, color: 'text-amber-600' }
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <h4 className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</h4>
                  <div className={`text-[22px] font-extrabold mt-1 ${k.color}`}>{k.val}</div>
                  <p className="text-[8px] text-slate-500 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Grievance Distribution by Category</h3>
              {Object.entries(CATEGORY_CFG).map(([k, v]) => {
                const count = tickets.filter(t => t.category === k).length;
                if (count === 0) return null;
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-700">
                      <span>{v.emoji} {v.label}</span>
                      <span>{count} ticket{count > 1 ? 's' : ''}</span>
                    </div>
                    <MiniBar value={count} max={tickets.length} color={`bg-gradient-to-r from-red-500 to-rose-400`} />
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Status Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Ticket Status Breakdown</h3>
              {Object.entries(STATUS_CFG).map(([k, v]) => {
                const count = tickets.filter(t => t.status === k).length;
                if (count === 0) return null;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[8.5px] font-bold w-28 ${v.color}`}>{v.icon} {v.label}</span>
                    <div className="flex-1">
                      <MiniBar value={count} max={tickets.length} color={k === 'resolved' || k === 'closed' ? 'bg-emerald-500' : k === 'open' ? 'bg-blue-500' : k === 'escalated' ? 'bg-rose-500' : k === 'in_progress' ? 'bg-amber-500' : 'bg-slate-400'} />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-600 w-8 text-right">{count}</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Priority vs Raised-by grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <h3 className="text-[11px] font-extrabold text-slate-800">By Priority Level</h3>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => {
                  const count = tickets.filter(t => t.priority === k).length;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold w-16 ${v.color}`}>{v.label}</span>
                      <div className="flex-1"><MiniBar value={count} max={tickets.length} color={k === 'critical' ? 'bg-red-500' : k === 'high' ? 'bg-amber-500' : k === 'medium' ? 'bg-blue-500' : 'bg-slate-400'} /></div>
                      <span className="text-[8.5px] font-extrabold text-slate-600">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <h3 className="text-[11px] font-extrabold text-slate-800">By Complainant Type</h3>
                {Object.entries(RAISED_BY_CFG).map(([k, v]) => {
                  const count = tickets.filter(t => t.raisedBy === k).length;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold w-16 flex items-center gap-1 ${v.color}`}>{v.icon} {v.label}</span>
                      <div className="flex-1"><MiniBar value={count} max={tickets.length} color="bg-slate-500" /></div>
                      <span className="text-[8.5px] font-extrabold text-slate-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Satisfaction summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
              <ThumbsUp className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-emerald-900">Resolution Quality Score</h4>
                <p className="text-[9px] text-emerald-700 leading-relaxed mt-0.5">
                  Current grievance satisfaction score is <strong>{satisfactionRate}%</strong> based on {ratedTickets} post-resolution feedback responses. The average resolution cycle is 2.4 working days. Critical complaints have a 100% acknowledgement rate within 4 hours. Continue improving response quality by using the Communication Thread to keep complainants informed proactively.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ComplaintGrievanceDesk;
