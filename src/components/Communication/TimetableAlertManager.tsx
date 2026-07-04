import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, ChevronDown, ChevronUp, Eye, Trash2,
  Calendar, FileText, Flag, MessageSquare, Globe, Zap,
  Activity, BarChart2, Smartphone, BellOff, BellRing,
  ToggleLeft, ToggleRight, RotateCcw, Save, TrendingUp,
  AlertTriangle, BookOpen, Users, User, GraduationCap,
  Home, Target, Info, Tag, Edit3, CheckCircle, XCircle,
  AlertCircle, MoreVertical, Layers, ArrowRight, ArrowLeftRight,
  Repeat, Radio, MapPin, Shuffle, UserCheck, ClipboardList,
  PieChart, Hash, ChevronRight, Package, Coffee, Microscope
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'changes' | 'compose' | 'alerts' | 'rules' | 'analytics';
type ChangeType = 'substitute' | 'period_cancel' | 'room_change' | 'time_shift' | 'extra_class' | 'holiday_special' | 'swap';
type ChangeStatus = 'draft' | 'approved' | 'notified' | 'cancelled';
type AlertStatus = 'queued' | 'sent' | 'failed' | 'skipped';
type AlertType = 'change_announced' | 'reminder_30min' | 'substitute_assigned' | 'period_cancelled' | 'room_changed' | 'extra_class' | 'day_cancelled';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';
type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface TimetableChange {
  id: number;
  changeType: ChangeType;
  date: string;
  day: Day;
  period: number;
  periodTime: string;
  affectedClasses: string[];
  subject: string;
  originalTeacher: string;
  substituteTeacher?: string;
  originalRoom?: string;
  newRoom?: string;
  reason: string;
  status: ChangeStatus;
  alertsSent: number;
  channel: NotifChannel;
  isUrgent: boolean;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  note?: string;
  totalAffectedStudents: number;
}

interface AlertLog {
  id: number;
  changeId: number;
  changeTitle: string;
  type: AlertType;
  channel: NotifChannel;
  recipient: string;
  recipientType: 'student' | 'parent' | 'teacher' | 'all';
  status: AlertStatus;
  sentAt: string;
  message: string;
  affectedClass: string;
}

interface AlertRule {
  id: number;
  name: string;
  trigger: AlertType;
  channel: NotifChannel;
  recipientType: 'student' | 'parent' | 'teacher' | 'all';
  isEnabled: boolean;
  reminderMinutes?: number;
  template: string;
  conditions: string;
  timing: string;
}

interface AnalyticsDay {
  date: string;
  changes: number;
  alerts: number;
  substitutes: number;
  cancellations: number;
}

interface ComposeForm {
  changeType: ChangeType;
  date: string;
  period: string;
  periodTime: string;
  affectedClasses: string;
  subject: string;
  originalTeacher: string;
  substituteTeacher: string;
  originalRoom: string;
  newRoom: string;
  reason: string;
  channel: NotifChannel;
  isUrgent: boolean;
  note: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PERIOD_TIMES: Record<number, string> = {
  1: '08:00–08:45', 2: '08:45–09:30', 3: '09:45–10:30',
  4: '10:30–11:15', 5: '11:30–12:15', 6: '12:15–01:00',
  7: '01:45–02:30', 8: '02:30–03:15',
};

const TIMETABLE_CHANGES: TimetableChange[] = [
  {
    id: 1, changeType: 'substitute', date: '2026-06-24', day: 'Wednesday',
    period: 3, periodTime: '09:45–10:30', affectedClasses: ['10-A', '10-B'],
    subject: 'Mathematics', originalTeacher: 'Mr. Sharma',
    substituteTeacher: 'Ms. Verma', reason: 'Teacher unwell – fever',
    status: 'notified', alertsSent: 162, channel: 'all', isUrgent: true,
    createdBy: 'Principal', createdAt: '06:30 AM', approvedBy: 'Vice Principal',
    note: 'Ms. Verma will cover from textbook Ch. 12', totalAffectedStudents: 82,
  },
  {
    id: 2, changeType: 'period_cancel', date: '2026-06-24', day: 'Wednesday',
    period: 5, periodTime: '11:30–12:15', affectedClasses: ['11-A'],
    subject: 'Chemistry', originalTeacher: 'Dr. Iyer',
    reason: 'Teacher attending board meeting', status: 'notified',
    alertsSent: 38, channel: 'push', isUrgent: false,
    createdBy: 'Dr. Iyer', createdAt: '07:00 AM',
    note: 'Students to use this period for self-study', totalAffectedStudents: 38,
  },
  {
    id: 3, changeType: 'room_change', date: '2026-06-24', day: 'Wednesday',
    period: 7, periodTime: '01:45–02:30', affectedClasses: ['12-A', '12-B'],
    subject: 'Physics', originalTeacher: 'Dr. Iyer',
    originalRoom: 'Room 301', newRoom: 'Physics Lab',
    reason: 'Practical demonstration scheduled today',
    status: 'notified', alertsSent: 82, channel: 'push', isUrgent: false,
    createdBy: 'Dr. Iyer', createdAt: '07:15 AM',
    note: 'Bring lab coat and safety glasses', totalAffectedStudents: 82,
  },
  {
    id: 4, changeType: 'extra_class', date: '2026-06-25', day: 'Thursday',
    period: 8, periodTime: '02:30–03:15', affectedClasses: ['12-A', '12-B'],
    subject: 'Mathematics', originalTeacher: 'Mr. Sharma',
    reason: 'Pre-board preparation – extra session for board students',
    status: 'approved', alertsSent: 82, channel: 'all', isUrgent: false,
    createdBy: 'Mr. Sharma', createdAt: '2026-06-23 03:00 PM', approvedBy: 'Principal',
    note: 'Covers integration and differentiation', totalAffectedStudents: 82,
  },
  {
    id: 5, changeType: 'swap', date: '2026-06-25', day: 'Thursday',
    period: 2, periodTime: '08:45–09:30', affectedClasses: ['9-A'],
    subject: 'English ↔ History', originalTeacher: 'Ms. Patel / Mr. Kumar',
    reason: 'Scheduling conflict – both teachers requested swap',
    status: 'notified', alertsSent: 44, channel: 'push', isUrgent: false,
    createdBy: 'Class Coordinator', createdAt: '2026-06-24 11:00 AM',
    note: 'Period 2 (English) and Period 4 (History) swapped', totalAffectedStudents: 44,
  },
  {
    id: 6, changeType: 'time_shift', date: '2026-06-26', day: 'Friday',
    period: 1, periodTime: '08:00–08:45 → 09:45–10:30', affectedClasses: ['8-A', '8-B', '8-C'],
    subject: 'Hindi', originalTeacher: 'Mrs. Gupta',
    reason: 'Morning assembly extended for Republic Day practice',
    status: 'approved', alertsSent: 0, channel: 'all', isUrgent: true,
    createdBy: 'Principal', createdAt: '2026-06-24 02:00 PM',
    note: 'School assembly till 09:30. Hindi period moved.', totalAffectedStudents: 120,
  },
  {
    id: 7, changeType: 'substitute', date: '2026-06-23', day: 'Tuesday',
    period: 4, periodTime: '10:30–11:15', affectedClasses: ['8-A'],
    subject: 'Science', originalTeacher: 'Ms. Nair',
    substituteTeacher: 'Mr. Mishra', reason: 'Teacher on official duty',
    status: 'notified', alertsSent: 40, channel: 'sms', isUrgent: false,
    createdBy: 'HOD Science', createdAt: '2026-06-23 06:45 AM', approvedBy: 'Vice Principal',
    totalAffectedStudents: 40,
  },
  {
    id: 8, changeType: 'holiday_special', date: '2026-06-27', day: 'Saturday',
    period: 0, periodTime: 'Full Day', affectedClasses: ['All Classes'],
    subject: 'All Subjects', originalTeacher: 'All Teachers',
    reason: 'School Foundation Day – Special program',
    status: 'draft', alertsSent: 0, channel: 'all', isUrgent: false,
    createdBy: 'Principal', createdAt: '2026-06-24 04:00 PM',
    note: 'No regular classes. Cultural events from 09:00 AM.', totalAffectedStudents: 1240,
  },
];

const ALERT_LOGS: AlertLog[] = [
  { id: 1, changeId: 1, changeTitle: 'Math Substitute – Class 10', type: 'substitute_assigned', channel: 'all', recipient: 'Class 10-A & 10-B (82 students + parents)', recipientType: 'all', status: 'sent', sentAt: '06:35 AM', message: '📢 Substitute Alert: Period 3 (09:45–10:30) Mathematics for Class 10-A & B will be taken by Ms. Verma instead of Mr. Sharma. Reason: Teacher unwell.', affectedClass: '10-A, 10-B' },
  { id: 2, changeId: 2, changeTitle: 'Chemistry Period Cancelled – 11-A', type: 'period_cancelled', channel: 'push', recipient: 'Class 11-A (38 students)', recipientType: 'student', status: 'sent', sentAt: '07:05 AM', message: '❌ Period Cancelled: Period 5 (11:30–12:15) Chemistry class for Class 11-A is cancelled today. Self-study period. Dr. Iyer is attending a meeting.', affectedClass: '11-A' },
  { id: 3, changeId: 3, changeTitle: 'Physics – Room Change to Lab', type: 'room_changed', channel: 'push', recipient: 'Class 12-A & 12-B (82 students)', recipientType: 'student', status: 'sent', sentAt: '07:20 AM', message: '🏫 Room Change: Period 7 (01:45–02:30) Physics for Class 12-A & B will be in Physics Lab instead of Room 301. Bring lab coat!', affectedClass: '12-A, 12-B' },
  { id: 4, changeId: 4, changeTitle: 'Extra Maths Class – Class 12', type: 'extra_class', channel: 'all', recipient: 'Class 12-A & 12-B (82 students + parents)', recipientType: 'all', status: 'sent', sentAt: 'Yesterday 04:00 PM', message: '📚 Extra Class Announced: An additional Mathematics session (Period 8, 02:30–03:15) has been added for Class 12-A & B on Thursday 25 Jun. Pre-board preparation.', affectedClass: '12-A, 12-B' },
  { id: 5, changeId: 5, changeTitle: 'English ↔ History Swap – 9-A', type: 'change_announced', channel: 'push', recipient: 'Class 9-A (44 students)', recipientType: 'student', status: 'sent', sentAt: 'Yesterday 11:05 AM', message: '🔄 Period Swap: For Class 9-A tomorrow, Period 2 (English) and Period 4 (History) have been swapped. Period 2 will now be History, Period 4 will be English.', affectedClass: '9-A' },
  { id: 6, changeId: 1, changeTitle: '30-min Reminder – Maths Sub', type: 'reminder_30min', channel: 'push', recipient: 'Class 10-A & 10-B (82 students)', recipientType: 'student', status: 'sent', sentAt: '09:15 AM', message: '⏰ Reminder (30 min): Period 3 Mathematics for Class 10 will be taught by Ms. Verma. Please reach class on time.', affectedClass: '10-A, 10-B' },
  { id: 7, changeId: 2, changeTitle: 'Chemistry Cancel – Parent Alert', type: 'period_cancelled', channel: 'sms', recipient: 'Parents of Class 11-A', recipientType: 'parent', status: 'failed', sentAt: '07:05 AM', message: 'SMS delivery failed. Retrying...', affectedClass: '11-A' },
  { id: 8, changeId: 6, changeTitle: 'Hindi Period Shift – Class 8', type: 'change_announced', channel: 'all', recipient: 'Class 8-A, 8-B, 8-C + Parents (120 students)', recipientType: 'all', status: 'queued', sentAt: '—', message: '⏰ Time Change: Hindi Period 1 for Class 8 shifted from 08:00–08:45 to 09:45–10:30 on Friday. Extended assembly morning.', affectedClass: '8-A, 8-B, 8-C' },
];

const ALERT_RULES: AlertRule[] = [
  { id: 1, name: 'Instant Change Announcement', trigger: 'change_announced', channel: 'all', recipientType: 'all', isEnabled: true, template: '📢 Timetable Change: {changeType} for {subject} (Period {period}, {time}) – Class {class}. {reason}. {note}', conditions: 'Triggered immediately when a change is approved', timing: 'Real-time on approval' },
  { id: 2, name: 'Substitute Teacher Assigned', trigger: 'substitute_assigned', channel: 'push', recipientType: 'student', isEnabled: true, template: '👨‍🏫 Substitute Alert: Period {period} {subject} for Class {class} will be taken by {substitute} instead of {original}. Reason: {reason}.', conditions: 'When substitute teacher is assigned', timing: 'Real-time, sent to affected class' },
  { id: 3, name: 'Period Cancellation Alert', trigger: 'period_cancelled', channel: 'all', recipientType: 'all', isEnabled: true, template: '❌ Period Cancelled: {subject} (Period {period}, {time}) for Class {class} is cancelled today. {note}. Teacher: {original}.', conditions: 'When a period is marked cancelled', timing: 'Real-time, morning priority' },
  { id: 4, name: '30-Minute Reminder', trigger: 'reminder_30min', channel: 'push', recipientType: 'student', isEnabled: true, reminderMinutes: 30, template: '⏰ Reminder (30 min): {changeType} – {subject} Period {period} for Class {class}. {substitute} will take class.', conditions: '30 minutes before the affected period', timing: '30 min before period start' },
  { id: 5, name: 'Room Change Alert', trigger: 'room_changed', channel: 'push', recipientType: 'student', isEnabled: true, template: '🏫 Room Change: {subject} Period {period} for Class {class} moved from {oldRoom} to {newRoom}. Please go to {newRoom} directly.', conditions: 'When room is changed for any period', timing: 'Real-time & 30 min before period' },
  { id: 6, name: 'Extra Class Notification', trigger: 'extra_class', channel: 'all', recipientType: 'all', isEnabled: true, template: '📚 Extra Class: An additional {subject} session added for Class {class} – Period {period} ({time}) on {date}. {reason}.', conditions: 'When an extra period is added to timetable', timing: 'Immediately + 1 day before' },
  { id: 7, name: 'Full Day Change / Event', trigger: 'day_cancelled', channel: 'all', recipientType: 'all', isEnabled: true, template: '🏫 Schedule Change: No regular classes on {date} ({day}). {reason}. {note}.', conditions: 'When a holiday or special event is declared', timing: '3 days before + day-of reminder' },
];

const ANALYTICS_DATA: AnalyticsDay[] = [
  { date: 'Jun 18', changes: 2, alerts: 84, substitutes: 1, cancellations: 1 },
  { date: 'Jun 19', changes: 4, alerts: 196, substitutes: 2, cancellations: 2 },
  { date: 'Jun 20', changes: 1, alerts: 40, substitutes: 0, cancellations: 1 },
  { date: 'Jun 21', changes: 0, alerts: 0, substitutes: 0, cancellations: 0 },
  { date: 'Jun 22', changes: 0, alerts: 0, substitutes: 0, cancellations: 0 },
  { date: 'Jun 23', changes: 3, alerts: 164, substitutes: 2, cancellations: 1 },
  { date: 'Jun 24', changes: 8, alerts: 366, substitutes: 2, cancellations: 1 },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const CHANGE_TYPE_CFG: Record<ChangeType, { label: string; color: string; bg: string; border: string; emoji: string; icon: React.ReactNode }> = {
  substitute:      { label: 'Substitute',     color: 'text-amber-700',   bg: 'bg-amber-100',    border: 'border-amber-300',   emoji: '👨‍🏫', icon: <UserCheck className="w-3 h-3" /> },
  period_cancel:   { label: 'Period Cancel',  color: 'text-red-700',     bg: 'bg-red-100',      border: 'border-red-300',     emoji: '❌',   icon: <XCircle className="w-3 h-3" /> },
  room_change:     { label: 'Room Change',    color: 'text-blue-700',    bg: 'bg-blue-100',     border: 'border-blue-300',    emoji: '🏫',  icon: <MapPin className="w-3 h-3" /> },
  time_shift:      { label: 'Time Shift',     color: 'text-violet-700',  bg: 'bg-violet-100',   border: 'border-violet-300',  emoji: '⏰',  icon: <Clock className="w-3 h-3" /> },
  extra_class:     { label: 'Extra Class',    color: 'text-emerald-700', bg: 'bg-emerald-100',  border: 'border-emerald-300', emoji: '📚',  icon: <BookOpen className="w-3 h-3" /> },
  holiday_special: { label: 'Special Day',   color: 'text-orange-700',  bg: 'bg-orange-100',   border: 'border-orange-300',  emoji: '🏫',  icon: <Layers className="w-3 h-3" /> },
  swap:            { label: 'Period Swap',    color: 'text-teal-700',    bg: 'bg-teal-100',     border: 'border-teal-300',    emoji: '🔄',  icon: <ArrowLeftRight className="w-3 h-3" /> },
};

const CHANGE_STATUS_CFG: Record<ChangeStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:    { label: 'Draft',    color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  approved: { label: 'Approved', color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  notified: { label: 'Notified', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  cancelled:{ label: 'Cancelled',color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500' },
};

const ALERT_TYPE_CFG: Record<AlertType, { label: string; color: string; bg: string; emoji: string }> = {
  change_announced:    { label: 'Change Announced',  color: 'text-blue-700',    bg: 'bg-blue-100',    emoji: '📢' },
  reminder_30min:      { label: '30-min Reminder',   color: 'text-amber-700',   bg: 'bg-amber-100',   emoji: '⏰' },
  substitute_assigned: { label: 'Substitute',        color: 'text-orange-700',  bg: 'bg-orange-100',  emoji: '👨‍🏫' },
  period_cancelled:    { label: 'Period Cancelled',  color: 'text-red-700',     bg: 'bg-red-100',     emoji: '❌' },
  room_changed:        { label: 'Room Changed',      color: 'text-blue-700',    bg: 'bg-blue-100',    emoji: '🏫' },
  extra_class:         { label: 'Extra Class',       color: 'text-emerald-700', bg: 'bg-emerald-100', emoji: '📚' },
  day_cancelled:       { label: 'Special Day',       color: 'text-violet-700',  bg: 'bg-violet-100',  emoji: '🗓️' },
};

const ALERT_STATUS_CFG: Record<AlertStatus, { label: string; color: string; bg: string }> = {
  queued:  { label: 'Queued',  color: 'text-amber-700',  bg: 'bg-amber-100' },
  sent:    { label: 'Sent',    color: 'text-emerald-700',bg: 'bg-emerald-100' },
  failed:  { label: 'Failed',  color: 'text-red-700',    bg: 'bg-red-100' },
  skipped: { label: 'Skipped', color: 'text-slate-600',  bg: 'bg-slate-100' },
};

const CHANNEL_CFG: Record<NotifChannel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  push:  { label: 'Push',  color: 'text-violet-700', bg: 'bg-violet-100', icon: <Smartphone className="w-3 h-3" /> },
  sms:   { label: 'SMS',   color: 'text-emerald-700',bg: 'bg-emerald-100',icon: <MessageSquare className="w-3 h-3" /> },
  email: { label: 'Email', color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <FileText className="w-3 h-3" /> },
  all:   { label: 'All',   color: 'text-slate-700',  bg: 'bg-slate-100',  icon: <Globe className="w-3 h-3" /> },
};

const CLASS_LIST = ['6-A','6-B','7-A','7-B','8-A','8-B','8-C','9-A','9-B','10-A','10-B','10-C','11-A','11-B','12-A','12-B'];
const SUBJECT_LIST = ['Mathematics','Science','English','Hindi','Social Science','Physics','Chemistry','Biology','Computer','History','Geography','Economics','Physical Education'];
const TEACHER_LIST = ['Mr. Sharma','Ms. Patel','Dr. Iyer','Ms. Verma','Mr. Kumar','Ms. Nair','Mr. Mishra','Ms. Gupta','Mr. Singh','Ms. Rao'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const AnalyticsBar: React.FC<{ data: AnalyticsDay[]; field: keyof AnalyticsDay; color: string }> = ({ data, field, color }) => {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = val === 0 ? 0 : Math.max(6, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {val === 0
              ? <div className="w-full bg-slate-100 rounded-sm" style={{ height: '100%' }} />
              : <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all`} style={{ height: `${pct}%` }} />
            }
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              {val === 0 ? 'Weekend' : val}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const emptyForm = (): ComposeForm => ({
  changeType: 'substitute', date: new Date().toISOString().split('T')[0],
  period: '3', periodTime: '09:45–10:30', affectedClasses: '',
  subject: 'Mathematics', originalTeacher: '', substituteTeacher: '',
  originalRoom: '', newRoom: '', reason: '', channel: 'all',
  isUrgent: false, note: '',
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TimetableAlertManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('changes');
  const [changes, setChanges] = useState<TimetableChange[]>(TIMETABLE_CHANGES);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>(ALERT_LOGS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(ALERT_RULES);
  const [selectedChange, setSelectedChange] = useState<TimetableChange | null>(TIMETABLE_CHANGES[0]);
  const [form, setForm] = useState<ComposeForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [searchChanges, setSearchChanges] = useState('');
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ChangeStatus | 'all'>('all');
  const [searchLogs, setSearchLogs] = useState('');
  const [filterLogType, setFilterLogType] = useState<AlertType | 'all'>('all');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [sendingAlert, setSendingAlert] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState(true);
  const [ticker, setTicker] = useState<string[]>([]);
  const tickerItems = [
    'Period 3 Maths – Substitute Ms. Verma notified ✓',
    'Class 11-A Chemistry cancel alert sent ✓',
    'Physics Lab room change – 12-A, 12-B alerted ✓',
    'Extra Maths Class Thu 25 Jun – alerts dispatched ✓',
  ];

  useEffect(() => {
    if (!liveMode) return;
    const iv = setInterval(() => {
      setTicker(prev => {
        const item = tickerItems[Math.floor(Math.random() * tickerItems.length)];
        return [item, ...prev].slice(0, 6);
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [liveMode]);

  // ── Derived Stats ──
  const todayStr = new Date().toISOString().split('T')[0];
  const todayChanges = changes.filter(c => c.date === todayStr);
  const upcomingChanges = changes.filter(c => c.date > todayStr);
  const totalAlertsSent = changes.reduce((s, c) => s + c.alertsSent, 0);
  const pendingNotify = changes.filter(c => c.status === 'approved').length;
  const totalAffected = changes.reduce((s, c) => s + c.totalAffectedStudents, 0);

  // Filtered
  const filteredChanges = changes.filter(c => {
    if (filterType !== 'all' && c.changeType !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchChanges && !c.subject.toLowerCase().includes(searchChanges.toLowerCase()) &&
        !c.originalTeacher.toLowerCase().includes(searchChanges.toLowerCase()) &&
        !c.affectedClasses.join(' ').toLowerCase().includes(searchChanges.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = alertLogs.filter(l => {
    if (filterLogType !== 'all' && l.type !== filterLogType) return false;
    if (searchLogs && !l.changeTitle.toLowerCase().includes(searchLogs.toLowerCase()) &&
        !l.recipient.toLowerCase().includes(searchLogs.toLowerCase())) return false;
    return true;
  });

  // ── Handlers ──
  const handleSubmit = async () => {
    if (!form.affectedClasses.trim()) { toast.error('Affected classes required'); return; }
    if (!form.reason.trim()) { toast.error('Reason is required'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    const ct = CHANGE_TYPE_CFG[form.changeType];
    const nc: TimetableChange = {
      id: Date.now(), changeType: form.changeType,
      date: form.date, day: new Date(form.date).toLocaleDateString('en-US', { weekday: 'long' }) as Day,
      period: parseInt(form.period), periodTime: form.periodTime || PERIOD_TIMES[parseInt(form.period)] || '',
      affectedClasses: form.affectedClasses.split(',').map(s => s.trim()).filter(Boolean),
      subject: form.subject, originalTeacher: form.originalTeacher,
      substituteTeacher: form.substituteTeacher || undefined,
      originalRoom: form.originalRoom || undefined, newRoom: form.newRoom || undefined,
      reason: form.reason, status: 'notified',
      alertsSent: form.channel === 'all' ? 120 : 40,
      channel: form.channel, isUrgent: form.isUrgent,
      createdBy: 'You', createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      note: form.note || undefined,
      totalAffectedStudents: form.affectedClasses.split(',').length * 40,
    };
    setChanges(prev => [nc, ...prev]);
    setSelectedChange(nc);
    setAlertLogs(prev => [{
      id: Date.now(), changeId: nc.id, changeTitle: `${ct.emoji} ${nc.subject} – ${nc.affectedClasses.join(', ')}`,
      type: 'change_announced', channel: nc.channel,
      recipient: `${nc.affectedClasses.join(', ')} (students & parents)`,
      recipientType: 'all', status: 'sent',
      sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      message: `${ct.emoji} Timetable Change: ${ct.label} for ${nc.subject} Period ${nc.period} (${nc.periodTime}) – Class ${nc.affectedClasses.join(', ')}. ${nc.reason}.`,
      affectedClass: nc.affectedClasses.join(', '),
    }, ...prev]);
    toast.success(`✅ Change announced & alerts sent via ${CHANNEL_CFG[form.channel].label}!`);
    setForm(emptyForm());
    setActiveTab('changes');
  };

  const approveAndNotify = async (changeId: number) => {
    setApprovingId(changeId);
    await new Promise(r => setTimeout(r, 1500));
    setApprovingId(null);
    setChanges(prev => prev.map(c => c.id === changeId ? { ...c, status: 'notified', alertsSent: c.alertsSent + c.totalAffectedStudents } : c));
    const ch = changes.find(c => c.id === changeId);
    toast.success(`📲 Approved & ${ch?.totalAffectedStudents} notifications sent!`);
  };

  const sendReminder = async (change: TimetableChange) => {
    setSendingAlert(change.id);
    await new Promise(r => setTimeout(r, 1400));
    setSendingAlert(null);
    setAlertLogs(prev => [{
      id: Date.now(), changeId: change.id, changeTitle: `${change.subject} Period ${change.period}`,
      type: 'reminder_30min', channel: 'push',
      recipient: `${change.affectedClasses.join(', ')} (${change.totalAffectedStudents} students)`,
      recipientType: 'student', status: 'sent',
      sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      message: `⏰ Reminder: ${CHANGE_TYPE_CFG[change.changeType].label} – ${change.subject} Period ${change.period} for Class ${change.affectedClasses.join(', ')}. ${change.reason}.`,
      affectedClass: change.affectedClasses.join(', '),
    }, ...prev]);
    setChanges(prev => prev.map(c => c.id === change.id ? { ...c, alertsSent: c.alertsSent + change.totalAffectedStudents } : c));
    toast.success(`📲 Reminder sent to ${change.totalAffectedStudents} students!`);
  };

  const toggleRule = (id: number) => {
    const rule = alertRules.find(r => r.id === id);
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Timetable Change Alert Center</h1>
            <p className="text-[9px] text-orange-200 font-medium">Substitute · Cancel · Room change · Extra class · Instant alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold cursor-pointer transition ${liveMode ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-slate-500/20 border-slate-400/40 text-slate-300'}`}
            onClick={() => setLiveMode(!liveMode)}>
            {liveMode ? <><Radio className="w-3 h-3 animate-pulse" /> LIVE</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{totalAlertsSent.toLocaleString()} alerts sent</span>
          </div>
          {pendingNotify > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 border border-red-400/40 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 text-red-300" />
              <span className="text-[9px] font-bold text-red-200">{pendingNotify} pending notify</span>
            </div>
          )}
          <button
            onClick={() => { setGlobalEnabled(!globalEnabled); toast.success(globalEnabled ? 'Timetable alerts paused' : 'Timetable alerts resumed'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalEnabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200 hover:bg-red-500/30'}`}>
            {globalEnabled ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
          <button onClick={() => setActiveTab('compose')}
            className="flex items-center gap-1.5 bg-white text-orange-700 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Change Alert
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: "Today's Changes", val: todayChanges.length, icon: <Calendar className="w-3 h-3" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Upcoming', val: upcomingChanges.length, icon: <Clock className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Pending Notify', val: pendingNotify, icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Students Affected', val: totalAffected, icon: <Users className="w-3 h-3" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Alerts Sent', val: totalAlertsSent, icon: <Send className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Active Rules', val: alertRules.filter(r => r.isEnabled).length, icon: <Settings className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'changes',   label: 'Change Log',    icon: <ClipboardList className="w-3.5 h-3.5" />, badge: pendingNotify },
          { key: 'compose',   label: 'New Alert',     icon: <Plus className="w-3.5 h-3.5" /> },
          { key: 'alerts',    label: 'Alert Logs',    icon: <Bell className="w-3.5 h-3.5" />, badge: alertLogs.filter(l => l.status === 'failed').length },
          { key: 'rules',     label: 'Alert Rules',   icon: <Settings className="w-3.5 h-3.5" /> },
          { key: 'analytics', label: 'Analytics',     icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ CHANGE LOG ═════════ */}
        {activeTab === 'changes' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search subject, teacher, class…" value={searchChanges}
                      onChange={e => setSearchChanges(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <button onClick={() => setActiveTab('compose')} className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg cursor-pointer transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all', 'draft', 'approved', 'notified', 'cancelled'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'}`}>
                      {s === 'all' ? 'All' : CHANGE_STATUS_CFG[s]?.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {filteredChanges.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Clock className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No changes found</p>
                  </div>
                )}
                {filteredChanges.map(change => {
                  const ct = CHANGE_TYPE_CFG[change.changeType];
                  const cs = CHANGE_STATUS_CFG[change.status];
                  const isSelected = selectedChange?.id === change.id;
                  return (
                    <div key={change.id} onClick={() => setSelectedChange(change)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-orange-50/50 transition ${isSelected ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${ct.bg}`}>{ct.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            {change.isUrgent && <Flag className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
                            <p className="text-[10px] font-bold text-slate-800 truncate">{change.subject}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${ct.bg} ${ct.color}`}>{ct.label}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${cs.bg} ${cs.color}`}>
                              <span className={`w-1 h-1 rounded-full ${cs.dot} inline-block`} /> {cs.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-slate-400">{change.affectedClasses.join(', ')} · P{change.period}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] text-slate-400">{change.date}</span>
                              {change.alertsSent > 0 && <span className="text-[8px] font-bold text-orange-600">{change.alertsSent}🔔</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detail + Live Feed */}
            <div className="flex flex-1 overflow-hidden">
              {/* Detail */}
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedChange ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Clock className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[11px] font-medium">Select a change to view details</p>
                  </div>
                ) : (() => {
                  const c = selectedChange;
                  const ct = CHANGE_TYPE_CFG[c.changeType];
                  const cs = CHANGE_STATUS_CFG[c.status];
                  const ch = CHANNEL_CFG[c.channel];
                  return (
                    <div className="space-y-4 max-w-xl">
                      {/* Header */}
                      <div className={`rounded-2xl p-4 ${ct.bg} border ${ct.border}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className="text-4xl">{ct.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {c.isUrgent && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-0.5"><Flag className="w-2.5 h-2.5" /> Urgent</span>}
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${ct.bg} ${ct.color}`}>{ct.label}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${cs.bg} ${cs.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} inline-block`} /> {cs.label}
                                </span>
                              </div>
                              <h2 className="text-[13px] font-extrabold text-slate-800">{c.subject}</h2>
                              <p className="text-[9px] text-slate-600 font-medium mt-0.5">
                                Period {c.period} · {c.periodTime} · {c.day}, {c.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {c.status === 'approved' && (
                              <button onClick={() => approveAndNotify(c.id)} disabled={approvingId === c.id}
                                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-orange-50 border border-orange-300 text-orange-700 rounded-xl cursor-pointer transition disabled:opacity-60">
                                {approvingId === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Approve & Notify
                              </button>
                            )}
                            {c.status === 'notified' && (
                              <button onClick={() => sendReminder(c)} disabled={sendingAlert === c.id}
                                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 rounded-xl cursor-pointer transition disabled:opacity-60">
                                {sendingAlert === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                                Re-send Reminder
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                          <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">Change Details</h4>
                          {[
                            { label: 'Original Teacher', val: c.originalTeacher, icon: <User className="w-3 h-3 text-slate-400" /> },
                            ...(c.substituteTeacher ? [{ label: 'Substitute', val: c.substituteTeacher, icon: <UserCheck className="w-3 h-3 text-amber-500" /> }] : []),
                            ...(c.originalRoom ? [{ label: 'From Room', val: c.originalRoom, icon: <MapPin className="w-3 h-3 text-red-400" /> }] : []),
                            ...(c.newRoom ? [{ label: 'To Room', val: c.newRoom, icon: <MapPin className="w-3 h-3 text-emerald-500" /> }] : []),
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              {item.icon}
                              <div>
                                <p className="text-[8px] text-slate-400">{item.label}</p>
                                <p className="text-[9px] font-bold text-slate-700">{item.val}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                          <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">Alert Info</h4>
                          {[
                            { label: 'Channel', val: ch.label, icon: ch.icon },
                            { label: 'Alerts Sent', val: c.alertsSent.toLocaleString(), icon: <Bell className="w-3 h-3 text-violet-500" /> },
                            { label: 'Students Affected', val: c.totalAffectedStudents, icon: <Users className="w-3 h-3 text-teal-500" /> },
                            { label: 'Created By', val: c.createdBy, icon: <User className="w-3 h-3 text-slate-400" /> },
                            { label: 'Created At', val: c.createdAt, icon: <Clock className="w-3 h-3 text-slate-400" /> },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              {item.icon}
                              <div>
                                <p className="text-[8px] text-slate-400">{item.label}</p>
                                <p className="text-[9px] font-bold text-slate-700">{item.val}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Affected Classes */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">Affected Classes</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {c.affectedClasses.map((cls, i) => (
                            <span key={i} className="text-[9px] font-bold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                              <GraduationCap className="w-2.5 h-2.5" /> Class {cls}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Reason & Note */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <h4 className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Reason</h4>
                          <p className="text-[10px] text-amber-800 font-medium">{c.reason}</p>
                        </div>
                        {c.note && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Note</h4>
                            <p className="text-[10px] text-slate-700 font-medium">{c.note}</p>
                          </div>
                        )}
                      </div>

                      {/* Alert History */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Bell className="w-3 h-3 text-orange-500" /> Alert History</h4>
                        {alertLogs.filter(l => l.changeId === c.id).length === 0
                          ? <p className="text-[9px] text-slate-400 py-2 text-center">No alerts sent yet</p>
                          : alertLogs.filter(l => l.changeId === c.id).map(log => {
                            const at = ALERT_TYPE_CFG[log.type];
                            const as_ = ALERT_STATUS_CFG[log.status];
                            return (
                              <div key={log.id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                                <span className="text-sm">{at.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${at.bg} ${at.color}`}>{at.label}</span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${as_.bg} ${as_.color}`}>{as_.label}</span>
                                    <span className="text-[8px] text-slate-400">{log.sentAt}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">{log.recipient}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Live Feed sidebar */}
              <div className="w-52 flex-shrink-0 border-l border-slate-200 flex flex-col">
                <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                  <p className="text-[9px] font-extrabold text-slate-600 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-orange-500 animate-pulse" /> Live Alert Feed
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {ticker.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-300">
                      <Radio className="w-8 h-8 mb-2 animate-pulse" />
                      <p className="text-[9px]">Listening…</p>
                    </div>
                  ) : ticker.map((t, i) => (
                    <div key={i} className="px-3 py-2 flex items-start gap-1.5 hover:bg-slate-50">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
                      <p className="text-[9px] text-slate-600 leading-snug">{t}</p>
                    </div>
                  ))}
                </div>
                {/* Today summary */}
                <div className="px-3 py-2.5 bg-orange-50 border-t border-orange-100">
                  <p className="text-[8px] font-extrabold text-orange-700 mb-1">Today's Summary</p>
                  {(Object.keys(CHANGE_TYPE_CFG) as ChangeType[]).map(type => {
                    const count = changes.filter(c => c.date === todayStr && c.changeType === type).length;
                    if (count === 0) return null;
                    const ct = CHANGE_TYPE_CFG[type];
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-[8px] text-slate-600">{ct.emoji} {ct.label}</span>
                        <span className="text-[8px] font-bold text-orange-700">{count}</span>
                      </div>
                    );
                  })}
                  {todayChanges.length === 0 && <p className="text-[8px] text-slate-400">No changes today</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ COMPOSE ═════════ */}
        {activeTab === 'compose' && (
          <div className="p-4 max-w-2xl">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-orange-50 border-b border-orange-200">
                <h3 className="text-[11px] font-extrabold text-orange-800 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Timetable Change Alert</h3>
                <button onClick={() => { setForm(emptyForm()); toast.success('Form reset'); }}
                  className="flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Change Type Selection */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Change Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(CHANGE_TYPE_CFG) as [ChangeType, typeof CHANGE_TYPE_CFG[ChangeType]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setForm(p => ({ ...p, changeType: k }))}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-[8px] font-bold transition cursor-pointer ${form.changeType === k ? `${v.bg} ${v.border} ${v.color}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <span className="text-xl">{v.emoji}</span>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period No.</label>
                    <select value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value, periodTime: PERIOD_TIMES[parseInt(e.target.value)] || '' }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Period {n} — {PERIOD_TIMES[n]}</option>)}
                      <option value="0">Full Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period Timing</label>
                    <input type="text" placeholder="e.g. 09:45–10:30" value={form.periodTime}
                      onChange={e => setForm(p => ({ ...p, periodTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                    <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                      {SUBJECT_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Affected Classes <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. 10-A, 10-B" value={form.affectedClasses}
                      onChange={e => setForm(p => ({ ...p, affectedClasses: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>

                {/* Row 3 — Teacher */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Original Teacher</label>
                    <select value={form.originalTeacher} onChange={e => setForm(p => ({ ...p, originalTeacher: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                      <option value="">Select teacher…</option>
                      {TEACHER_LIST.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  {(form.changeType === 'substitute') && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Substitute Teacher</label>
                      <select value={form.substituteTeacher} onChange={e => setForm(p => ({ ...p, substituteTeacher: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                        <option value="">Select substitute…</option>
                        {TEACHER_LIST.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  {(form.changeType === 'room_change') && (
                    <>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Original Room</label>
                        <input type="text" placeholder="e.g. Room 301" value={form.originalRoom}
                          onChange={e => setForm(p => ({ ...p, originalRoom: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                    </>
                  )}
                </div>

                {form.changeType === 'room_change' && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Room</label>
                    <input type="text" placeholder="e.g. Physics Lab" value={form.newRoom}
                      onChange={e => setForm(p => ({ ...p, newRoom: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason <span className="text-red-500">*</span></label>
                  <textarea rows={2} placeholder="Reason for the change…" value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Note (optional)</label>
                  <textarea rows={2} placeholder="E.g. Bring lab coat, carry textbook Ch.12…" value={form.note}
                    onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Alert Channel</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(CHANNEL_CFG) as [NotifChannel, typeof CHANNEL_CFG[NotifChannel]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setForm(p => ({ ...p, channel: k }))}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] font-bold transition cursor-pointer ${form.channel === k ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'}`}>
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(p => ({ ...p, isUrgent: e.target.checked }))} className="rounded" />
                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Flag className="w-3 h-3 text-red-500" /> Mark as Urgent (high-priority alert)</span>
                </label>

                <div className="flex gap-3 pt-1">
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60">
                    {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <><Send className="w-3.5 h-3.5" /> Announce & Alert Now</>}
                  </button>
                  <button onClick={() => toast.success('Saved as draft')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition">
                    <Save className="w-3.5 h-3.5" /> Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ ALERT LOGS ═════════ */}
        {activeTab === 'alerts' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search alert logs…" value={searchLogs}
                  onChange={e => setSearchLogs(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <select value={filterLogType} onChange={e => setFilterLogType(e.target.value as AlertType | 'all')}
                className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                <option value="all">All Types</option>
                {(Object.entries(ALERT_TYPE_CFG) as [AlertType, typeof ALERT_TYPE_CFG[AlertType]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
              <button onClick={() => { setSearchLogs(''); setFilterLogType('all'); }}
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', val: alertLogs.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
                { label: 'Sent', val: alertLogs.filter(l => l.status === 'sent').length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Queued', val: alertLogs.filter(l => l.status === 'queued').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Failed', val: alertLogs.filter(l => l.status === 'failed').length, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                  <p className={`text-[20px] font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Change', 'Alert Type', 'Channel', 'Recipient', 'Message Preview', 'Status', 'Sent At'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map(log => {
                    const at = ALERT_TYPE_CFG[log.type];
                    const as_ = ALERT_STATUS_CFG[log.status];
                    const ch = CHANNEL_CFG[log.channel];
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2">
                          <p className="text-[10px] font-bold text-slate-800">{log.changeTitle}</p>
                          <p className="text-[8px] text-slate-400">{log.affectedClass}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${at.bg} ${at.color}`}>
                            {at.emoji} {at.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${ch.bg} ${ch.color}`}>
                            {ch.icon} {ch.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-[9px] font-medium text-slate-600">{log.recipient}</p>
                          <p className="text-[8px] text-slate-400 capitalize">{log.recipientType}</p>
                        </td>
                        <td className="px-3 py-2 max-w-[180px]">
                          <p className="text-[8px] text-slate-500 truncate">{log.message}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${as_.bg} ${as_.color}`}>{as_.label}</span>
                        </td>
                        <td className="px-3 py-2 text-[8px] text-slate-500 whitespace-nowrap">{log.sentAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px] font-medium">No logs found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════ RULES ═════════ */}
        {activeTab === 'rules' && (
          <div className="p-4 space-y-3 max-w-3xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-600" />
                <h2 className="text-[11px] font-extrabold text-slate-700">Automated Timetable Alert Rules</h2>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {alertRules.filter(r => r.isEnabled).length} active
                <span className="w-2 h-2 rounded-full bg-slate-300 ml-1" /> {alertRules.filter(r => !r.isEnabled).length} disabled
              </div>
            </div>

            {alertRules.map(rule => {
              const at = ALERT_TYPE_CFG[rule.trigger];
              const ch = CHANNEL_CFG[rule.channel];
              const isExpanded = expandedRule === rule.id;
              return (
                <div key={rule.id} className={`bg-white border-2 rounded-xl overflow-hidden transition ${rule.isEnabled ? 'border-orange-200' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${rule.isEnabled ? 'bg-orange-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{at.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] font-extrabold text-slate-800">{rule.name}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${at.bg} ${at.color}`}>{at.label}</span>
                          {rule.reminderMinutes && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{rule.reminderMinutes} min before</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          {ch.icon} {ch.label} → <span className="capitalize">{rule.recipientType}</span>
                          <span className="text-slate-300">·</span>
                          <Clock className="w-2.5 h-2.5" /> {rule.timing}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rule.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {rule.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                      <button onClick={() => setExpandedRule(isExpanded ? null : rule.id)} className="p-1 hover:bg-white/60 rounded-lg cursor-pointer">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button onClick={() => toggleRule(rule.id)} className="cursor-pointer">
                        {rule.isEnabled ? <ToggleRight className="w-7 h-7 text-orange-500" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[9px] text-slate-600 font-medium">{rule.conditions}</p>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message Template</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-medium text-slate-700 leading-relaxed">{rule.template}</p>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-1">Variables: {'{subject}'}, {'{period}'}, {'{time}'}, {'{class}'}, {'{original}'}, {'{substitute}'}, {'{oldRoom}'}, {'{newRoom}'}, {'{reason}'}, {'{date}'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toast.success(`Test alert for: ${rule.name}`)}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl cursor-pointer transition">
                          <Zap className="w-3 h-3" /> Test Rule
                        </button>
                        <button onClick={() => toast.success('Rule saved')}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition">
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Changes (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.changes, 0), sub: 'timetable modifications', icon: <ClipboardList className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                { label: 'Alerts Sent (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.alerts, 0), sub: 'total dispatched', icon: <Bell className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
                { label: 'Substitutes (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.substitutes, 0), sub: 'teacher substitutions', icon: <UserCheck className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Cancellations (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.cancellations, 0), sub: 'period cancellations', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-orange-600" /> 7-Day Change Volume</h3>
                <p className="text-[8px] text-slate-400 mb-3">Total timetable changes per day</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="changes" color="bg-orange-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-violet-600" /> 7-Day Alerts Dispatched</h3>
                <p className="text-[8px] text-slate-400 mb-3">Notifications sent per day</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="alerts" color="bg-violet-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
            </div>

            {/* Change Type Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-orange-600" /> Change Type Breakdown</h3>
              <div className="grid grid-cols-4 gap-4">
                {(Object.keys(CHANGE_TYPE_CFG) as ChangeType[]).map(type => {
                  const ct = CHANGE_TYPE_CFG[type];
                  const count = changes.filter(c => c.changeType === type).length;
                  const total = changes.length || 1;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-xl flex-shrink-0">{ct.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] font-bold text-slate-700 truncate">{ct.label}</span>
                          <span className="text-[9px] font-bold text-slate-500">{count}</span>
                        </div>
                        <MiniBar value={count} max={total} color="bg-orange-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Changes Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-600" /> All Timetable Changes</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Date', 'Subject', 'Type', 'Classes', 'Period', 'Status', 'Alerts', 'Students'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {changes.map(change => {
                      const ct = CHANGE_TYPE_CFG[change.changeType];
                      const cs = CHANGE_STATUS_CFG[change.status];
                      return (
                        <tr key={change.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-[9px] text-slate-600 whitespace-nowrap">{change.date}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {change.isUrgent && <Flag className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
                              <p className="text-[9px] font-bold text-slate-800 truncate max-w-[100px]">{change.subject}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${ct.bg} ${ct.color}`}>{ct.emoji} {ct.label}</span>
                          </td>
                          <td className="px-3 py-2 text-[9px] text-slate-600">{change.affectedClasses.join(', ')}</td>
                          <td className="px-3 py-2 text-[9px] font-medium text-slate-600">P{change.period}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 w-fit ${cs.bg} ${cs.color}`}>
                              <span className={`w-1 h-1 rounded-full ${cs.dot} inline-block`} /> {cs.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-violet-600">{change.alertsSent}</td>
                          <td className="px-3 py-2 text-[9px] text-slate-600">{change.totalAffectedStudents}</td>
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

export default TimetableAlertManager;
