import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronUp, Eye, Trash2, Star, Calendar, FileText,
  Flag, MessageSquare, Globe, Zap, Activity, BarChart2, PieChart,
  Smartphone, BellOff, BellRing, AlarmClock,
  ToggleLeft, ToggleRight, RotateCcw, Save, TrendingUp, TrendingDown,
  BookOpen, AlertTriangle, Download, Layers,
  Target, Hash, Tag, Edit3, CheckSquare, MoreVertical,
  Percent, UserCheck, UserX, Home, GraduationCap, Wifi,
  WifiOff, Radio, PlayCircle, PauseCircle, Filter, Award,
  MapPin, Phone, Mail, ShieldAlert, Repeat, Info
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'live' | 'students' | 'alerts' | 'rules' | 'analytics';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday';
type AlertStatus = 'queued' | 'sent' | 'failed' | 'skipped';
type AlertType = 'absent_alert' | 'late_alert' | 'low_attendance' | 'critical_attendance' | 'present_confirm' | 'leave_approved' | 'consecutive_absent' | 'monthly_report';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';
type Period = 'morning' | 'afternoon' | 'full_day';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface StudentAttendance {
  id: number;
  name: string;
  rollNo: string;
  avatar: string;
  className: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy: string;
  period: Period;
  presentDays: number;
  totalDays: number;
  consecutiveAbsent: number;
  alertSent: boolean;
  isLeaveApproved: boolean;
  remarks: string;
}

interface ClassAttendance {
  id: number;
  className: string;
  section: string;
  classTeacher: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  markedAt: string;
  isMarked: boolean;
  alertsSent: number;
}

interface AlertLog {
  id: number;
  studentName: string;
  studentClass: string;
  type: AlertType;
  channel: NotifChannel;
  recipient: string;
  status: AlertStatus;
  sentAt: string;
  message: string;
  attendancePct?: number;
  consecutiveDays?: number;
}

interface AlertRule {
  id: number;
  name: string;
  trigger: AlertType;
  channel: NotifChannel;
  recipientType: 'parent' | 'student' | 'both' | 'teacher';
  isEnabled: boolean;
  threshold?: number;
  consecutiveDays?: number;
  template: string;
  conditions: string;
  timing: string;
}

interface AnalyticsDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  alertsSent: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CLASSES: ClassAttendance[] = [
  { id: 1, className: '10', section: 'A', classTeacher: 'Mr. Sharma', totalStudents: 42, present: 38, absent: 3, late: 1, onLeave: 0, markedAt: '08:35 AM', isMarked: true, alertsSent: 3 },
  { id: 2, className: '10', section: 'B', classTeacher: 'Ms. Patel', totalStudents: 40, present: 36, absent: 2, late: 2, onLeave: 0, markedAt: '08:40 AM', isMarked: true, alertsSent: 4 },
  { id: 3, className: '11', section: 'A', classTeacher: 'Dr. Iyer', totalStudents: 38, present: 35, absent: 2, late: 0, onLeave: 1, markedAt: '08:38 AM', isMarked: true, alertsSent: 2 },
  { id: 4, className: '11', section: 'B', classTeacher: 'Ms. Verma', totalStudents: 36, present: 0, absent: 0, late: 0, onLeave: 0, markedAt: '', isMarked: false, alertsSent: 0 },
  { id: 5, className: '12', section: 'A', classTeacher: 'Mr. Kumar', totalStudents: 42, present: 40, absent: 1, late: 1, onLeave: 0, markedAt: '08:32 AM', isMarked: true, alertsSent: 2 },
  { id: 6, className: '12', section: 'B', classTeacher: 'Ms. Nair', totalStudents: 40, present: 38, absent: 2, late: 0, onLeave: 0, markedAt: '08:45 AM', isMarked: true, alertsSent: 2 },
  { id: 7, className: '9', section: 'A', classTeacher: 'Mr. Singh', totalStudents: 44, present: 0, absent: 0, late: 0, onLeave: 0, markedAt: '', isMarked: false, alertsSent: 0 },
  { id: 8, className: '9', section: 'B', classTeacher: 'Ms. Gupta', totalStudents: 42, present: 39, absent: 2, late: 1, onLeave: 0, markedAt: '08:50 AM', isMarked: true, alertsSent: 2 },
  { id: 9, className: '8', section: 'A', classTeacher: 'Mr. Mishra', totalStudents: 40, present: 37, absent: 3, late: 0, onLeave: 0, markedAt: '08:42 AM', isMarked: true, alertsSent: 3 },
  { id: 10, className: '8', section: 'B', classTeacher: 'Ms. Rao', totalStudents: 38, present: 35, absent: 2, late: 1, onLeave: 0, markedAt: '08:48 AM', isMarked: true, alertsSent: 3 },
];

const STUDENTS: StudentAttendance[] = [
  { id: 1, name: 'Aryan Kumar', rollNo: '10A-01', avatar: 'AK', className: '10', section: 'A', parentName: 'Rajesh Kumar', parentPhone: '9876543210', parentEmail: 'rajesh@gmail.com', status: 'absent', markedAt: '08:35 AM', markedBy: 'Mr. Sharma', period: 'full_day', presentDays: 58, totalDays: 75, consecutiveAbsent: 2, alertSent: true, isLeaveApproved: false, remarks: '' },
  { id: 2, name: 'Priya Patel', rollNo: '10A-12', avatar: 'PP', className: '10', section: 'A', parentName: 'Sunita Patel', parentPhone: '9876543211', parentEmail: 'sunita@gmail.com', status: 'present', markedAt: '08:33 AM', markedBy: 'Mr. Sharma', period: 'full_day', presentDays: 74, totalDays: 75, consecutiveAbsent: 0, alertSent: false, isLeaveApproved: false, remarks: '' },
  { id: 3, name: 'Rahul Sharma', rollNo: '10B-11', avatar: 'RS', className: '10', section: 'B', parentName: 'Amit Sharma', parentPhone: '9876543212', parentEmail: 'amit@gmail.com', status: 'late', markedAt: '09:10 AM', markedBy: 'Ms. Patel', period: 'full_day', presentDays: 70, totalDays: 75, consecutiveAbsent: 0, alertSent: true, isLeaveApproved: false, remarks: 'Late by 40 min' },
  { id: 4, name: 'Kavya Gupta', rollNo: '11A-08', avatar: 'KG', className: '11', section: 'A', parentName: 'Dinesh Gupta', parentPhone: '9876543213', parentEmail: 'dinesh@gmail.com', status: 'absent', markedAt: '08:38 AM', markedBy: 'Dr. Iyer', period: 'full_day', presentDays: 45, totalDays: 75, consecutiveAbsent: 5, alertSent: true, isLeaveApproved: false, remarks: 'Consecutive absent - 5 days' },
  { id: 5, name: 'Rohan Singh', rollNo: '12A-07', avatar: 'RoS', className: '12', section: 'A', parentName: 'Harpal Singh', parentPhone: '9876543214', parentEmail: 'harpal@gmail.com', status: 'present', markedAt: '08:31 AM', markedBy: 'Mr. Kumar', period: 'full_day', presentDays: 73, totalDays: 75, consecutiveAbsent: 0, alertSent: false, isLeaveApproved: false, remarks: '' },
  { id: 6, name: 'Anita Mishra', rollNo: '12B-22', avatar: 'AM', className: '12', section: 'B', parentName: 'Suresh Mishra', parentPhone: '9876543215', parentEmail: 'suresh@gmail.com', status: 'absent', markedAt: '08:45 AM', markedBy: 'Ms. Nair', period: 'full_day', presentDays: 50, totalDays: 75, consecutiveAbsent: 3, alertSent: true, isLeaveApproved: false, remarks: '' },
  { id: 7, name: 'Dev Patel', rollNo: '9B-04', avatar: 'DP', className: '9', section: 'B', parentName: 'Kiran Patel', parentPhone: '9876543216', parentEmail: 'kiran@gmail.com', status: 'late', markedAt: '09:05 AM', markedBy: 'Ms. Gupta', period: 'full_day', presentDays: 68, totalDays: 75, consecutiveAbsent: 0, alertSent: true, isLeaveApproved: false, remarks: 'Late - 35 min' },
  { id: 8, name: 'Sneha Rao', rollNo: '8A-03', avatar: 'SR', className: '8', section: 'A', parentName: 'Prakash Rao', parentPhone: '9876543217', parentEmail: 'prakash@gmail.com', status: 'absent', markedAt: '08:42 AM', markedBy: 'Mr. Mishra', period: 'full_day', presentDays: 40, totalDays: 75, consecutiveAbsent: 8, alertSent: true, isLeaveApproved: false, remarks: 'Critical - below 60%' },
  { id: 9, name: 'Vikram Joshi', rollNo: '10A-15', avatar: 'VJ', className: '10', section: 'A', parentName: 'Ramesh Joshi', parentPhone: '9876543218', parentEmail: 'ramesh@gmail.com', status: 'leave', markedAt: '08:35 AM', markedBy: 'Mr. Sharma', period: 'full_day', presentDays: 65, totalDays: 75, consecutiveAbsent: 0, alertSent: false, isLeaveApproved: true, remarks: 'Medical leave approved' },
  { id: 10, name: 'Nisha Verma', rollNo: '11A-19', avatar: 'NV', className: '11', section: 'A', parentName: 'Mahesh Verma', parentPhone: '9876543219', parentEmail: 'mahesh@gmail.com', status: 'present', markedAt: '08:37 AM', markedBy: 'Dr. Iyer', period: 'full_day', presentDays: 72, totalDays: 75, consecutiveAbsent: 0, alertSent: false, isLeaveApproved: false, remarks: '' },
];

const ALERT_LOGS: AlertLog[] = [
  { id: 1, studentName: 'Aryan Kumar', studentClass: '10-A', type: 'absent_alert', channel: 'all', recipient: 'Rajesh Kumar (Parent)', status: 'sent', sentAt: '08:36 AM', message: '⚠️ Attendance Alert: Aryan Kumar (10-A, Roll: 10A-01) was marked ABSENT today (24 Jun). If this is an error, contact the school immediately. Attendance: 77.3%.', consecutiveDays: 2 },
  { id: 2, studentName: 'Kavya Gupta', studentClass: '11-A', type: 'consecutive_absent', channel: 'all', recipient: 'Dinesh Gupta (Parent)', status: 'sent', sentAt: '08:39 AM', message: '🚨 URGENT: Kavya Gupta (11-A) has been ABSENT for 5 consecutive days. Please contact the school at the earliest. Attendance: 60%.', consecutiveDays: 5 },
  { id: 3, studentName: 'Sneha Rao', studentClass: '8-A', type: 'critical_attendance', channel: 'sms', recipient: 'Prakash Rao (Parent)', status: 'sent', sentAt: '08:43 AM', message: '🔴 CRITICAL: Sneha Rao (8-A) attendance has dropped below 60% (53.3%). Minimum 75% required. Please ensure regular attendance.', attendancePct: 53.3 },
  { id: 4, studentName: 'Rahul Sharma', studentClass: '10-B', type: 'late_alert', channel: 'push', recipient: 'Amit Sharma (Parent)', status: 'sent', sentAt: '09:11 AM', message: '⏰ Late Arrival: Rahul Sharma (10-B) arrived 40 minutes late today. Please ensure punctuality.', },
  { id: 5, studentName: 'Anita Mishra', studentClass: '12-B', type: 'absent_alert', channel: 'sms', recipient: 'Suresh Mishra (Parent)', status: 'sent', sentAt: '08:46 AM', message: '⚠️ Anita Mishra (12-B) was marked absent today. Attendance: 66.7%. 3 consecutive absences.', consecutiveDays: 3 },
  { id: 6, studentName: 'Dev Patel', studentClass: '9-B', type: 'late_alert', channel: 'push', recipient: 'Kiran Patel (Parent)', status: 'sent', sentAt: '09:06 AM', message: '⏰ Dev Patel (9-B) arrived 35 minutes late. Repeated late arrivals may affect attendance record.', },
  { id: 7, studentName: 'Class 8-A Summary', studentClass: '8-A', type: 'monthly_report', channel: 'email', recipient: 'All Class 8-A Parents', status: 'sent', sentAt: '08:00 AM', message: '📊 Monthly Attendance Report – June 2026. Class 8-A. Total Working Days: 20. Your child\'s attendance summary is attached.', },
  { id: 8, studentName: 'All Classes', studentClass: 'School-wide', type: 'low_attendance', channel: 'push', recipient: 'Class Teachers (10 classes)', status: 'sent', sentAt: '09:00 AM', message: '📋 Daily Attendance Summary: 8 of 10 classes marked. School-wide attendance: 87.2%. 2 classes pending.', },
  { id: 9, studentName: 'Aryan Kumar', studentClass: '10-A', type: 'absent_alert', channel: 'email', recipient: 'Rajesh Kumar (Parent)', status: 'failed', sentAt: '08:36 AM', message: 'Email delivery failed. Retrying...', },
];

const ALERT_RULES: AlertRule[] = [
  { id: 1, name: 'Absent Alert – Immediate', trigger: 'absent_alert', channel: 'all', recipientType: 'parent', isEnabled: true, template: '⚠️ Attendance Alert: {name} ({class}, Roll: {roll}) was marked ABSENT today ({date}). Attendance: {pct}%. Contact school if this is an error.', conditions: 'Triggered immediately when student marked absent', timing: 'Real-time (within 2 min of marking)' },
  { id: 2, name: 'Late Arrival Alert', trigger: 'late_alert', channel: 'push', recipientType: 'parent', isEnabled: true, template: '⏰ Late Arrival: {name} ({class}) arrived {lateBy} minutes late today. Please ensure punctuality in future.', conditions: 'Triggered when student marked late', timing: 'Real-time (within 1 min of marking)' },
  { id: 3, name: 'Consecutive Absence Alert', trigger: 'consecutive_absent', channel: 'all', recipientType: 'both', isEnabled: true, consecutiveDays: 3, template: '🚨 URGENT: {name} ({class}) has been absent for {days} consecutive days. Please contact school at: {phone}.', conditions: 'When student is absent for 3+ consecutive days', timing: 'Morning, after attendance is marked' },
  { id: 4, name: 'Low Attendance Warning (75%)', trigger: 'low_attendance', channel: 'sms', recipientType: 'parent', isEnabled: true, threshold: 75, template: '⚠️ Low Attendance Warning: {name}\'s attendance is {pct}% (below 75% threshold). Regular attendance is mandatory for examinations.', conditions: 'When attendance falls below 75%', timing: 'Weekly, every Monday 8 AM' },
  { id: 5, name: 'Critical Attendance Alert (<60%)', trigger: 'critical_attendance', channel: 'all', recipientType: 'both', isEnabled: true, threshold: 60, template: '🔴 CRITICAL: {name} ({class}) attendance is {pct}% – critically low. Minimum 75% required. Risk of exam detention.', conditions: 'When attendance falls below 60%', timing: 'Immediately when threshold crossed' },
  { id: 6, name: 'Present Confirmation (Optional)', trigger: 'present_confirm', channel: 'push', recipientType: 'parent', isEnabled: false, template: '✅ {name} ({class}) has been marked PRESENT today at {time}. Attendance: {pct}%.', conditions: 'When student marked present (opt-in only)', timing: 'Real-time, optional per parent preference' },
  { id: 7, name: 'Monthly Attendance Report', trigger: 'monthly_report', channel: 'email', recipientType: 'parent', isEnabled: true, template: '📊 Monthly Attendance Report – {month}. {name}: {presentDays}/{totalDays} days present ({pct}%). Detailed report attached.', conditions: 'Auto-generated on last working day of month', timing: 'Monthly – Last working day, 8 AM' },
  { id: 8, name: 'Leave Approval Notification', trigger: 'leave_approved', channel: 'push', recipientType: 'both', isEnabled: true, template: '✅ Leave Approved: {name}\'s leave application for {date} has been approved by {teacher}. Marked as authorized absence.', conditions: 'When teacher approves leave application', timing: 'Real-time on approval' },
];

const ANALYTICS_DATA: AnalyticsDay[] = [
  { date: 'Jun 18', present: 1100, absent: 140, late: 25, alertsSent: 165 },
  { date: 'Jun 19', present: 1080, absent: 155, late: 30, alertsSent: 185 },
  { date: 'Jun 20', present: 1150, absent: 90, late: 20, alertsSent: 110 },
  { date: 'Jun 21', present: 0, absent: 0, late: 0, alertsSent: 0 },
  { date: 'Jun 22', present: 0, absent: 0, late: 0, alertsSent: 0 },
  { date: 'Jun 23', present: 1090, absent: 125, late: 28, alertsSent: 153 },
  { date: 'Jun 24', present: 1062, absent: 165, late: 35, alertsSent: 200 },
];

// ─── CONFIGS ──────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AttendanceStatus, { label: string; color: string; bg: string; dot: string; icon: React.ReactNode }> = {
  present:  { label: 'Present',  color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500', icon: <UserCheck className="w-3 h-3" /> },
  absent:   { label: 'Absent',   color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500 animate-pulse', icon: <UserX className="w-3 h-3" /> },
  late:     { label: 'Late',     color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500', icon: <Clock className="w-3 h-3" /> },
  leave:    { label: 'On Leave', color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500', icon: <Award className="w-3 h-3" /> },
  holiday:  { label: 'Holiday',  color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400', icon: <Star className="w-3 h-3" /> },
};

const ALERT_TYPE_CFG: Record<AlertType, { label: string; color: string; bg: string; emoji: string }> = {
  absent_alert:         { label: 'Absent Alert',        color: 'text-red-700',     bg: 'bg-red-100',     emoji: '⚠️' },
  late_alert:           { label: 'Late Alert',           color: 'text-amber-700',   bg: 'bg-amber-100',   emoji: '⏰' },
  low_attendance:       { label: 'Low Attendance',       color: 'text-orange-700',  bg: 'bg-orange-100',  emoji: '📉' },
  critical_attendance:  { label: 'Critical Attendance',  color: 'text-red-800',     bg: 'bg-red-200',     emoji: '🔴' },
  present_confirm:      { label: 'Present Confirm',      color: 'text-emerald-700', bg: 'bg-emerald-100', emoji: '✅' },
  leave_approved:       { label: 'Leave Approved',       color: 'text-blue-700',    bg: 'bg-blue-100',    emoji: '📋' },
  consecutive_absent:   { label: 'Consecutive Absent',   color: 'text-rose-700',    bg: 'bg-rose-100',    emoji: '🚨' },
  monthly_report:       { label: 'Monthly Report',       color: 'text-violet-700',  bg: 'bg-violet-100',  emoji: '📊' },
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const AttendanceRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 44 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
};

const AnalyticsBar: React.FC<{ data: AnalyticsDay[]; field: keyof AnalyticsDay; color: string }> = ({ data, field, color }) => {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = val === 0 ? 0 : Math.max(4, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {val === 0
              ? <div className="w-full bg-slate-100 rounded-sm" style={{ height: '100%' }} />
              : <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all`} style={{ height: `${pct}%` }} />
            }
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              {val === 0 ? 'Holiday' : val.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AttendanceAlertManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [classes, setClasses] = useState<ClassAttendance[]>(CLASSES);
  const [students, setStudents] = useState<StudentAttendance[]>(STUDENTS);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>(ALERT_LOGS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(ALERT_RULES);
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(CLASSES[0]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendance | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [searchStudents, setSearchStudents] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all');
  const [filterClass, setFilterClass] = useState('all');
  const [searchLogs, setSearchLogs] = useState('');
  const [filterLogType, setFilterLogType] = useState<AlertType | 'all'>('all');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [sendingAlert, setSendingAlert] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);
  const liveAlertNames = ['Riya Sharma (10-C)', 'Mohit Jain (9-A)', 'Anika Sen (8-B)', 'Vikas Yadav (12-A)', 'Pooja Nair (11-B)'];
  const liveAlertMsgs = [
    '⚠️ Absent alert sent to parent',
    '⏰ Late arrival alert dispatched',
    '🚨 Consecutive absent – 4th day',
    '📉 Low attendance warning sent',
    '✅ Present confirmation sent',
  ];

  // Live ticker simulation
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      if (Math.random() > 0.5) {
        const name = liveAlertNames[Math.floor(Math.random() * liveAlertNames.length)];
        const msg = liveAlertMsgs[Math.floor(Math.random() * liveAlertMsgs.length)];
        setLiveAlerts(prev => [`${name} — ${msg}`, ...prev].slice(0, 8));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [liveMode]);

  // ── Derived Stats ──
  const totalStudents = classes.reduce((s, c) => s + c.totalStudents, 0);
  const totalPresent = classes.reduce((s, c) => s + c.present, 0);
  const totalAbsent = classes.reduce((s, c) => s + c.absent, 0);
  const totalLate = classes.reduce((s, c) => s + c.late, 0);
  const markedClasses = classes.filter(c => c.isMarked).length;
  const schoolAttendancePct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
  const totalAlertsSent = alertLogs.filter(l => l.status === 'sent').length;
  const criticalStudents = students.filter(s => (s.presentDays / s.totalDays) * 100 < 60).length;
  const consecutiveAbsents = students.filter(s => s.consecutiveAbsent >= 3).length;

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterClass !== 'all' && `${s.className}-${s.section}` !== filterClass) return false;
    if (searchStudents && !s.name.toLowerCase().includes(searchStudents.toLowerCase()) &&
        !s.rollNo.toLowerCase().includes(searchStudents.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = alertLogs.filter(l => {
    if (filterLogType !== 'all' && l.type !== filterLogType) return false;
    if (searchLogs && !l.studentName.toLowerCase().includes(searchLogs.toLowerCase()) &&
        !l.recipient.toLowerCase().includes(searchLogs.toLowerCase())) return false;
    return true;
  });

  const uniqueClasses = [...new Set(students.map(s => `${s.className}-${s.section}`))].sort();

  // ── Handlers ──
  const sendManualAlert = async (student: StudentAttendance, type: AlertType) => {
    setSendingAlert(student.id);
    await new Promise(r => setTimeout(r, 1500));
    setSendingAlert(null);
    const at = ALERT_TYPE_CFG[type];
    const pct = Math.round((student.presentDays / student.totalDays) * 100);
    setAlertLogs(prev => [{
      id: Date.now(), studentName: student.name, studentClass: `${student.className}-${student.section}`,
      type, channel: 'all', recipient: `${student.parentName} (Parent)`,
      status: 'sent', sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      message: `${at.emoji} ${at.label}: ${student.name} (${student.className}-${student.section}). Attendance: ${pct}%.`,
      attendancePct: pct, consecutiveDays: student.consecutiveAbsent,
    }, ...prev]);
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, alertSent: true } : s));
    toast.success(`📲 Alert sent to ${student.parentName}!`);
  };

  const sendBulkAlerts = async (classId: number) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    toast.loading(`Sending alerts for Class ${cls.className}-${cls.section}…`, { duration: 2000 });
    await new Promise(r => setTimeout(r, 2000));
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, alertsSent: c.alertsSent + c.absent } : c));
    toast.success(`✅ ${cls.absent} absent alerts sent for Class ${cls.className}-${cls.section}!`);
  };

  const toggleRule = (id: number) => {
    const rule = alertRules.find(r => r.id === id);
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  const Av: React.FC<{ text: string; color?: string; size?: string }> = ({ text, color = 'bg-teal-600', size = 'w-8 h-8' }) => (
    <div className={`${size} ${color} text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[9px] uppercase`}>
      {text.slice(0, 2)}
    </div>
  );

  const getStudentColor = (s: StudentAttendance) => {
    const pct = Math.round((s.presentDays / s.totalDays) * 100);
    return pct < 60 ? 'bg-red-600' : pct < 75 ? 'bg-amber-600' : 'bg-teal-600';
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Real-time Attendance Alert Center</h1>
            <p className="text-[9px] text-teal-200 font-medium">Live marking · Auto-alerts · Absence tracking · Parent notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live ticker pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold transition cursor-pointer ${liveMode ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-slate-500/20 border-slate-400/40 text-slate-300'}`}
            onClick={() => setLiveMode(!liveMode)}>
            {liveMode ? <><Radio className="w-3 h-3 animate-pulse" /> LIVE</> : <><WifiOff className="w-3 h-3" /> Paused</>}
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{totalAlertsSent} alerts today</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Users className="w-3 h-3 text-teal-300" />
            <span className="text-[9px] font-bold">{schoolAttendancePct}% present</span>
          </div>
          <button
            onClick={() => { setGlobalEnabled(!globalEnabled); toast.success(globalEnabled ? 'Attendance alerts paused' : 'Attendance alerts resumed'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalEnabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200 hover:bg-red-500/30'}`}>
            {globalEnabled ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Present Today', val: `${totalPresent}`, sub: `${schoolAttendancePct}%`, icon: <UserCheck className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Absent Today', val: `${totalAbsent}`, sub: 'alerts sent', icon: <UserX className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Late Today', val: `${totalLate}`, sub: 'arrivals', icon: <Clock className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Classes Marked', val: `${markedClasses}/${classes.length}`, sub: 'attendance done', icon: <CheckSquare className="w-3 h-3" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Critical (<60%)', val: `${criticalStudents}`, sub: 'students', icon: <ShieldAlert className="w-3 h-3" />, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
          { label: 'Consec. Absent (3+)', val: `${consecutiveAbsents}`, sub: 'students', icon: <Repeat className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'Active Rules', val: `${alertRules.filter(r => r.isEnabled).length}`, sub: 'auto-rules', icon: <Settings className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-white', border: 'border-violet-200' },
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
          { key: 'live',     label: 'Live Dashboard', icon: <Radio className="w-3.5 h-3.5" />, badge: classes.filter(c => !c.isMarked).length },
          { key: 'students', label: 'Student Tracker', icon: <Users className="w-3.5 h-3.5" />, badge: students.filter(s => s.status === 'absent' && !s.alertSent).length },
          { key: 'alerts',   label: 'Alert Logs',     icon: <Bell className="w-3.5 h-3.5" />, badge: alertLogs.filter(l => l.status === 'failed').length },
          { key: 'rules',    label: 'Alert Rules',    icon: <Settings className="w-3.5 h-3.5" /> },
          { key: 'analytics',label: 'Analytics',      icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ LIVE DASHBOARD ═════════ */}
        {activeTab === 'live' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>
            {/* Class List */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-teal-50 border-b border-teal-100 px-3 py-2 z-10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-extrabold text-teal-700 uppercase tracking-wider">Class-wise Status</p>
                  <div className="flex items-center gap-1 text-[8px] text-teal-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Live
                  </div>
                </div>
              </div>
              <div className="flex-1 divide-y divide-slate-100">
                {classes.map(cls => {
                  const pct = cls.totalStudents > 0 ? Math.round((cls.present / cls.totalStudents) * 100) : 0;
                  const isSelected = selectedClass?.id === cls.id;
                  return (
                    <div key={cls.id} onClick={() => setSelectedClass(cls)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-teal-50/50 transition ${isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 ${cls.isMarked ? (pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-500'}`}>
                          {cls.className}{cls.section}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[10px] font-bold text-slate-800">Class {cls.className}-{cls.section}</p>
                            {cls.isMarked
                              ? <span className="text-[8px] font-bold text-emerald-600">{pct}%</span>
                              : <span className="text-[8px] font-bold text-amber-600">Pending</span>}
                          </div>
                          <p className="text-[8px] text-slate-400 mb-1">{cls.classTeacher}</p>
                          {cls.isMarked ? (
                            <>
                              <MiniBar value={cls.present} max={cls.totalStudents} color={pct >= 80 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-red-500'} />
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[7px] font-bold text-emerald-600">✓{cls.present}</span>
                                  <span className="text-[7px] font-bold text-red-600">✗{cls.absent}</span>
                                  {cls.late > 0 && <span className="text-[7px] font-bold text-amber-600">⏰{cls.late}</span>}
                                </div>
                                <span className="text-[7px] text-slate-400">{cls.markedAt}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 text-[8px] text-amber-600 font-bold">
                              <AlertTriangle className="w-2.5 h-2.5" /> Attendance not marked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Class Detail + Live Feed */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-0">
              {/* School-wide summary bar */}
              <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-extrabold text-teal-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> School-wide Attendance — Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </h3>
                  <div className="flex items-center gap-1 text-[8px] text-teal-600">
                    <Clock className="w-2.5 h-2.5" /> Updated {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Total', val: totalStudents, color: 'text-slate-700', bg: 'bg-white' },
                    { label: 'Present', val: totalPresent, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Absent', val: totalAbsent, color: 'text-red-700', bg: 'bg-red-50' },
                    { label: 'Late', val: totalLate, color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Attendance', val: `${schoolAttendancePct}%`, color: schoolAttendancePct >= 80 ? 'text-emerald-700' : 'text-amber-700', bg: 'bg-white' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border border-slate-200 rounded-xl px-3 py-2 text-center`}>
                      <p className={`text-[16px] font-extrabold ${s.color}`}>{s.val}</p>
                      <p className="text-[8px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <MiniBar value={totalPresent} max={totalStudents} color="bg-teal-500" />
                </div>
              </div>

              {/* Class Detail + Live Alerts side by side */}
              <div className="flex flex-1 gap-0">
                {/* Selected class detail */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {!selectedClass ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                      <Users className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-[10px]">Select a class to view details</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Class header */}
                      <div className={`rounded-2xl p-4 ${selectedClass.isMarked ? 'bg-teal-50 border border-teal-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${selectedClass.isMarked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {selectedClass.isMarked ? '✓ Marked' : '⏳ Pending'}
                              </span>
                              {selectedClass.isMarked && <span className="text-[8px] text-slate-500">{selectedClass.markedAt}</span>}
                            </div>
                            <h2 className="text-[13px] font-extrabold text-slate-800">Class {selectedClass.className}-{selectedClass.section}</h2>
                            <p className="text-[9px] text-slate-600 font-medium">{selectedClass.classTeacher} · {selectedClass.totalStudents} students</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <AttendanceRing pct={selectedClass.totalStudents > 0 ? Math.round((selectedClass.present / selectedClass.totalStudents) * 100) : 0} size={50} />
                            {selectedClass.isMarked && selectedClass.absent > 0 && (
                              <button onClick={() => sendBulkAlerts(selectedClass.id)}
                                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-xl cursor-pointer transition">
                                <Bell className="w-3 h-3" /> Alert {selectedClass.absent} Absent
                              </button>
                            )}
                          </div>
                        </div>
                        {selectedClass.isMarked && (
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {[
                              { label: 'Present', val: selectedClass.present, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                              { label: 'Absent', val: selectedClass.absent, color: 'text-red-700', bg: 'bg-red-50' },
                              { label: 'Late', val: selectedClass.late, color: 'text-amber-700', bg: 'bg-amber-50' },
                              { label: 'Alerts Sent', val: selectedClass.alertsSent, color: 'text-teal-700', bg: 'bg-white' },
                            ].map((s, i) => (
                              <div key={i} className={`${s.bg} border border-slate-200 rounded-xl p-2 text-center`}>
                                <p className={`text-[14px] font-extrabold ${s.color}`}>{s.val}</p>
                                <p className="text-[8px] text-slate-400">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Students in this class */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                          <p className="text-[10px] font-extrabold text-slate-700">Today's Attendance — Class {selectedClass.className}-{selectedClass.section}</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {students.filter(s => s.className === selectedClass.className && s.section === selectedClass.section).length === 0
                            ? <p className="text-[9px] text-slate-400 py-6 text-center">No student data available</p>
                            : students.filter(s => s.className === selectedClass.className && s.section === selectedClass.section).map(student => {
                              const st = STATUS_CFG[student.status];
                              const pct = Math.round((student.presentDays / student.totalDays) * 100);
                              return (
                                <div key={student.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition">
                                  <Av text={student.avatar} color={getStudentColor(student)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[10px] font-bold text-slate-800">{student.name}</p>
                                      <span className="text-[8px] text-slate-400">{student.rollNo}</span>
                                      {student.consecutiveAbsent >= 3 && (
                                        <span className="text-[7px] font-bold px-1 py-0.5 bg-rose-100 text-rose-700 rounded-full">{student.consecutiveAbsent}d streak</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                                        <span className={`w-1 h-1 rounded-full ${st.dot} inline-block`} /> {st.label}
                                      </span>
                                      <span className={`text-[8px] font-bold ${pct < 60 ? 'text-red-600' : pct < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}% overall</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {student.alertSent
                                      ? <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Check className="w-2 h-2" /> Alerted</span>
                                      : (student.status === 'absent' || student.status === 'late') && (
                                        <button onClick={() => sendManualAlert(student, student.status === 'absent' ? 'absent_alert' : 'late_alert')}
                                          disabled={sendingAlert === student.id}
                                          className="text-[8px] font-bold px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg cursor-pointer transition flex items-center gap-1 disabled:opacity-60">
                                          {sendingAlert === student.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Bell className="w-2.5 h-2.5" />}
                                          Alert
                                        </button>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Alert Feed */}
                <div className="w-56 flex-shrink-0 border-l border-slate-200 flex flex-col">
                  <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                    <p className="text-[9px] font-extrabold text-slate-600 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-teal-500 animate-pulse" /> Live Alert Feed
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {liveAlerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
                        <Radio className="w-8 h-8 mb-2 animate-pulse" />
                        <p className="text-[9px]">Waiting for alerts…</p>
                      </div>
                    ) : liveAlerts.map((alert, i) => (
                      <div key={i} className="px-3 py-2 flex items-start gap-1.5 hover:bg-slate-50">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                        <div>
                          <p className="text-[9px] text-slate-700 leading-snug">{alert}</p>
                          <p className="text-[7px] text-slate-400 mt-0.5">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pending classes warning */}
                  {classes.filter(c => !c.isMarked).length > 0 && (
                    <div className="px-3 py-2.5 bg-amber-50 border-t border-amber-200">
                      <p className="text-[8px] font-bold text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {classes.filter(c => !c.isMarked).length} classes pending
                      </p>
                      <p className="text-[7px] text-amber-600 mt-0.5">
                        {classes.filter(c => !c.isMarked).map(c => `${c.className}-${c.section}`).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ STUDENT TRACKER ═════════ */}
        {activeTab === 'students' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>
            {/* Left: Filters + List */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search students…" value={searchStudents}
                    onChange={e => setSearchStudents(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all', 'absent', 'late', 'present', 'leave'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'}`}>
                      {s === 'all' ? 'All' : STATUS_CFG[s]?.label}
                    </button>
                  ))}
                </div>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300 bg-white">
                  <option value="all">All Classes</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {filteredStudents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Users className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px]">No students found</p>
                  </div>
                )}
                {filteredStudents.map(student => {
                  const st = STATUS_CFG[student.status];
                  const pct = Math.round((student.presentDays / student.totalDays) * 100);
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <div key={student.id} onClick={() => setSelectedStudent(student)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-teal-50/50 transition ${isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <Av text={student.avatar} color={getStudentColor(student)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{student.name}</p>
                            {student.consecutiveAbsent >= 3 && <span className="text-[7px] font-bold px-1 bg-rose-100 text-rose-700 rounded">{student.consecutiveAbsent}d</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                            <span className="text-[8px] text-slate-400">{student.rollNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <MiniBar value={student.presentDays} max={student.totalDays} color={pct < 60 ? 'bg-red-500' : pct < 75 ? 'bg-amber-500' : 'bg-emerald-500'} />
                            </div>
                            <span className={`text-[8px] font-bold w-8 text-right ${pct < 60 ? 'text-red-600' : pct < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Student Detail */}
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select a student to view details</p>
                </div>
              ) : (() => {
                const s = selectedStudent;
                const st = STATUS_CFG[s.status];
                const pct = Math.round((s.presentDays / s.totalDays) * 100);
                const absentDays = s.totalDays - s.presentDays;
                return (
                  <div className="space-y-4 max-w-xl">
                    {/* Student Header */}
                    <div className={`rounded-2xl p-4 ${pct < 60 ? 'bg-red-50 border border-red-200' : pct < 75 ? 'bg-amber-50 border border-amber-200' : 'bg-teal-50 border border-teal-200'}`}>
                      <div className="flex items-start gap-4">
                        <Av text={s.avatar} color={getStudentColor(s)} size="w-12 h-12" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot} inline-block`} /> {st.label}
                            </span>
                            {s.consecutiveAbsent >= 3 && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full">🚨 {s.consecutiveAbsent} days consecutive absent</span>
                            )}
                          </div>
                          <h2 className="text-[13px] font-extrabold text-slate-800">{s.name}</h2>
                          <p className="text-[9px] text-slate-600 font-medium">Roll: {s.rollNo} · Class {s.className}-{s.section} · Marked at {s.markedAt} by {s.markedBy}</p>
                          {s.remarks && <p className="text-[8px] text-slate-500 mt-0.5 italic">"{s.remarks}"</p>}
                        </div>
                        <AttendanceRing pct={pct} size={56} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Present Days', val: s.presentDays, color: 'text-emerald-700' },
                        { label: 'Absent Days', val: absentDays, color: 'text-red-700' },
                        { label: 'Total Days', val: s.totalDays, color: 'text-slate-700' },
                        { label: 'Streak Absent', val: s.consecutiveAbsent, color: s.consecutiveAbsent >= 3 ? 'text-rose-700' : 'text-slate-500' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className={`text-[18px] font-extrabold ${stat.color}`}>{stat.val}</p>
                          <p className="text-[8px] text-slate-400 font-medium">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Attendance Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-teal-600" /> Attendance Progress</h3>
                      {[
                        { label: 'Present', val: s.presentDays, max: s.totalDays, color: 'bg-emerald-500' },
                        { label: 'Absent', val: absentDays, max: s.totalDays, color: 'bg-red-500' },
                      ].map((bar, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-600">{bar.label}</span>
                            <span className="text-[9px] font-bold text-slate-600">{bar.val} / {bar.max}</span>
                          </div>
                          <MiniBar value={bar.val} max={bar.max} color={bar.color} />
                        </div>
                      ))}
                      <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-bold ${pct < 60 ? 'bg-red-100 text-red-700' : pct < 75 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {pct < 60 ? <ShieldAlert className="w-3.5 h-3.5" /> : pct < 75 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {pct < 60 ? `CRITICAL: Below 60% — Exam detention risk!` : pct < 75 ? `WARNING: Below 75% — Minimum threshold` : `GOOD: Above 75% threshold`}
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h3 className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-teal-600" /> Parent / Guardian</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {s.parentName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">{s.parentName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[8px] text-slate-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {s.parentPhone}</span>
                            <span className="text-[8px] text-slate-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {s.parentEmail}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => sendManualAlert(s, 'absent_alert')} disabled={sendingAlert === s.id}
                          className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl cursor-pointer transition disabled:opacity-60">
                          {sendingAlert === s.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                          Send Absent Alert
                        </button>
                        {s.consecutiveAbsent >= 3 && (
                          <button onClick={() => sendManualAlert(s, 'consecutive_absent')} disabled={sendingAlert === s.id}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl cursor-pointer transition">
                            <ShieldAlert className="w-3 h-3" /> Urgent Alert
                          </button>
                        )}
                        {pct < 75 && (
                          <button onClick={() => sendManualAlert(s, pct < 60 ? 'critical_attendance' : 'low_attendance')}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl cursor-pointer transition">
                            <TrendingDown className="w-3 h-3" /> Low Att. Warning
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ ALERT LOGS ═════════ */}
        {activeTab === 'alerts' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search logs…" value={searchLogs}
                  onChange={e => setSearchLogs(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <select value={filterLogType} onChange={e => setFilterLogType(e.target.value as AlertType | 'all')}
                className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-300 bg-white">
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
                { label: 'Total Logs', val: alertLogs.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
                { label: 'Sent', val: alertLogs.filter(l => l.status === 'sent').length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Failed', val: alertLogs.filter(l => l.status === 'failed').length, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Queued', val: alertLogs.filter(l => l.status === 'queued').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
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
                    {['Student', 'Alert Type', 'Channel', 'Recipient', 'Message Preview', 'Status', 'Time'].map(h => (
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
                          <p className="text-[10px] font-bold text-slate-800">{log.studentName}</p>
                          <p className="text-[8px] text-slate-400">{log.studentClass}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${at.bg} ${at.color}`}>
                            {at.emoji} {at.label}
                          </span>
                          {log.consecutiveDays && log.consecutiveDays >= 3 && (
                            <span className="text-[7px] text-rose-600 font-bold block mt-0.5">{log.consecutiveDays} days streak</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${ch.bg} ${ch.color}`}>
                            {ch.icon} {ch.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-[9px] font-medium text-slate-600">{log.recipient}</p>
                        </td>
                        <td className="px-3 py-2 max-w-[200px]">
                          <p className="text-[8px] text-slate-500 truncate">{log.message}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${as_.bg} ${as_.color}`}>{as_.label}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">{log.sentAt}</span>
                        </td>
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

        {/* ═════════ ALERT RULES ═════════ */}
        {activeTab === 'rules' && (
          <div className="p-4 space-y-3 max-w-3xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-600" />
                <h2 className="text-[11px] font-extrabold text-slate-700">Automated Attendance Alert Rules</h2>
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
                <div key={rule.id} className={`bg-white border-2 rounded-xl overflow-hidden transition ${rule.isEnabled ? 'border-teal-200' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${rule.isEnabled ? 'bg-teal-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{at.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] font-extrabold text-slate-800">{rule.name}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${at.bg} ${at.color}`}>{at.label}</span>
                          {rule.threshold && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              &lt;{rule.threshold}% threshold
                            </span>
                          )}
                          {rule.consecutiveDays && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              {rule.consecutiveDays}+ days
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          {ch.icon} {ch.label} → <span className="capitalize">{rule.recipientType}</span>
                          <span className="text-slate-400">·</span>
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
                        {rule.isEnabled ? <ToggleRight className="w-7 h-7 text-teal-500" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
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
                        <p className="text-[8px] text-slate-400 mt-1">Variables: {'{name}'}, {'{class}'}, {'{roll}'}, {'{date}'}, {'{pct}'}, {'{days}'}, {'{time}'}, {'{teacher}'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toast.success(`Testing rule: ${rule.name}`)}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl cursor-pointer transition">
                          <Zap className="w-3 h-3" /> Test Rule
                        </button>
                        <button onClick={() => toast.success('Rule saved successfully')}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition">
                          <Save className="w-3 h-3" /> Save Changes
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
                { label: 'Avg Attendance (7d)', val: `${Math.round(ANALYTICS_DATA.filter(d => d.present > 0).reduce((s, d) => s + (d.present / (d.present + d.absent + d.late)) * 100, 0) / ANALYTICS_DATA.filter(d => d.present > 0).length)}%`, sub: 'school average', icon: <Percent className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
                { label: 'Absent (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.absent, 0).toLocaleString(), sub: 'total absences', icon: <UserX className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Late (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.late, 0).toLocaleString(), sub: 'late arrivals', icon: <Clock className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Alerts Sent (7d)', val: ANALYTICS_DATA.reduce((s, d) => s + d.alertsSent, 0).toLocaleString(), sub: 'total dispatched', icon: <Bell className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
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
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-teal-600" /> 7-Day Present vs Absent</h3>
                <p className="text-[8px] text-slate-400 mb-2">Daily attendance breakdown</p>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" /><span className="text-[8px] text-slate-500 flex-1">Present</span>
                    <AnalyticsBar data={ANALYTICS_DATA} field="present" color="bg-emerald-500" />
                  </div>
                </div>
                <AnalyticsBar data={ANALYTICS_DATA} field="absent" color="bg-red-500" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500 flex-shrink-0" /><span className="text-[8px] text-slate-500">Absent</span>
                </div>
                <div className="flex justify-between mt-2">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-violet-600" /> 7-Day Alerts Dispatched</h3>
                <p className="text-[8px] text-slate-400 mb-3">Total alerts sent to parents per day</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="alertsSent" color="bg-violet-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
            </div>

            {/* Class-wise Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-teal-600" /> Today's Class-wise Attendance Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Class', 'Teacher', 'Total', 'Present', 'Absent', 'Late', 'Attendance %', 'Alerts Sent', 'Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classes.map(cls => {
                      const pct = cls.totalStudents > 0 ? Math.round((cls.present / cls.totalStudents) * 100) : 0;
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-[10px] font-bold text-slate-800">{cls.className}-{cls.section}</td>
                          <td className="px-3 py-2 text-[9px] text-slate-600">{cls.classTeacher}</td>
                          <td className="px-3 py-2 text-[9px] font-medium text-slate-700">{cls.totalStudents}</td>
                          <td className="px-3 py-2 text-[9px] font-bold text-emerald-700">{cls.present}</td>
                          <td className="px-3 py-2 text-[9px] font-bold text-red-700">{cls.absent}</td>
                          <td className="px-3 py-2 text-[9px] font-bold text-amber-700">{cls.late}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16">
                                <MiniBar value={cls.present} max={cls.totalStudents} color={pct >= 80 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-red-500'} />
                              </div>
                              <span className={`text-[9px] font-bold ${pct >= 80 ? 'text-emerald-700' : pct >= 65 ? 'text-amber-700' : 'text-red-700'}`}>{cls.isMarked ? `${pct}%` : '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-violet-600">{cls.alertsSent}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cls.isMarked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {cls.isMarked ? '✓ Marked' : '⏳ Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students requiring attention */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Students Requiring Immediate Attention</h3>
              <div className="space-y-2">
                {students.filter(s => {
                  const pct = Math.round((s.presentDays / s.totalDays) * 100);
                  return pct < 75 || s.consecutiveAbsent >= 3;
                }).map(student => {
                  const pct = Math.round((student.presentDays / student.totalDays) * 100);
                  const st = STATUS_CFG[student.status];
                  return (
                    <div key={student.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${pct < 60 ? 'bg-red-50 border-red-200' : pct < 75 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                      <Av text={student.avatar} color={getStudentColor(student)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-bold text-slate-800">{student.name}</p>
                          <span className="text-[8px] text-slate-400">{student.rollNo}</span>
                          <span className="text-[8px] text-slate-400">·</span>
                          <span className="text-[8px] font-medium text-slate-500">Class {student.className}-{student.section}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {pct < 60 && <span className="text-[7px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">🔴 Critical: {pct}% attendance</span>}
                          {pct >= 60 && pct < 75 && <span className="text-[7px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">⚠️ Low: {pct}% attendance</span>}
                          {student.consecutiveAbsent >= 3 && <span className="text-[7px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full">🚨 {student.consecutiveAbsent} days streak</span>}
                        </div>
                      </div>
                      <button onClick={() => sendManualAlert(student, pct < 60 ? 'critical_attendance' : 'low_attendance')}
                        disabled={sendingAlert === student.id}
                        className="text-[8px] font-bold px-2.5 py-1.5 bg-white hover:bg-red-50 border border-red-300 text-red-700 rounded-xl cursor-pointer transition disabled:opacity-60 flex items-center gap-1 flex-shrink-0">
                        {sendingAlert === student.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Bell className="w-2.5 h-2.5" />}
                        Alert Parent
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceAlertManager;
