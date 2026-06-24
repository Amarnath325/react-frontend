import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen, Bell, Send, Plus, Search, Filter, RefreshCw, Settings,
  Check, X, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronUp, Download, Eye, Edit3, Trash2, Copy, Star, Users,
  User, GraduationCap, Home, Briefcase, Calendar, FileText,
  Tag, Archive, Layers, Percent, Info, Flag, MoreVertical,
  Image, MessageSquare, Target, Shield, AlertTriangle,
  ToggleLeft, ToggleRight, Zap, Activity, TrendingUp, TrendingDown,
  BarChart2, PieChart, Smartphone, Monitor, Wifi, BellOff, BellRing,
  PlayCircle, PauseCircle, SkipForward, ChevronRight, Hash, Repeat,
  AlarmClock, Upload, Globe, Book, Paperclip, ClipboardList,
  CheckSquare, Square, RotateCcw, Save
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'assignments' | 'alerts' | 'rules' | 'analytics' | 'settings';
type AssignmentStatus = 'draft' | 'published' | 'overdue' | 'submitted' | 'graded';
type AlertStatus = 'queued' | 'sent' | 'failed' | 'skipped';
type Subject = 'mathematics' | 'science' | 'english' | 'hindi' | 'social_science' | 'computer' | 'physics' | 'chemistry' | 'biology' | 'history';
type AlertType = 'new_assignment' | 'due_reminder' | 'overdue' | 'submission_confirm' | 'grade_published' | 'extension_granted';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';

interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: Subject;
  className: string;
  section: string;
  teacherId: number;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  maxMarks: number;
  attachments: string[];
  status: AssignmentStatus;
  totalStudents: number;
  submitted: number;
  graded: number;
  alertsSent: number;
  channel: NotifChannel;
  isImportant: boolean;
  tags: string[];
  reminderHours: number[];
}

interface AlertLog {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  type: AlertType;
  channel: NotifChannel;
  recipient: string;
  recipientType: 'student' | 'parent' | 'both';
  status: AlertStatus;
  sentAt: string;
  message: string;
  subject: Subject;
  className: string;
}

interface AlertRule {
  id: number;
  name: string;
  trigger: AlertType;
  channel: NotifChannel;
  recipientType: 'student' | 'parent' | 'both';
  isEnabled: boolean;
  reminderOffsets: number[];
  template: string;
  conditions: string;
}

interface AnalyticsData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const ASSIGNMENTS: Assignment[] = [
  { id: 1, title: 'Integration & Differentiation', description: 'Solve Chapter 12 exercises on integration techniques. Show all working steps clearly.', subject: 'mathematics', className: '12', section: 'A', teacherId: 1, teacherName: 'Mr. Sharma', assignedDate: '2026-06-22', dueDate: '2026-06-26', dueTime: '23:59', maxMarks: 20, attachments: ['ch12_problems.pdf'], status: 'published', totalStudents: 42, submitted: 28, graded: 15, alertsSent: 126, channel: 'all', isImportant: true, tags: ['calculus', 'chapter12'], reminderHours: [24, 2] },
  { id: 2, title: 'Photosynthesis Lab Report', description: 'Document your observations from the photosynthesis experiment. Include diagrams and conclusions.', subject: 'biology', className: '11', section: 'B', teacherId: 2, teacherName: 'Ms. Verma', assignedDate: '2026-06-21', dueDate: '2026-06-25', dueTime: '17:00', maxMarks: 25, attachments: ['lab_template.docx', 'rubric.pdf'], status: 'published', totalStudents: 38, submitted: 22, graded: 0, alertsSent: 114, channel: 'push', isImportant: false, tags: ['lab', 'biology', 'photosynthesis'], reminderHours: [48, 24, 2] },
  { id: 3, title: 'Essay: Freedom Struggle', description: 'Write a 500-word essay on the role of youth in India\'s freedom struggle.', subject: 'history', className: '10', section: 'A', teacherId: 3, teacherName: 'Mr. Kumar', assignedDate: '2026-06-20', dueDate: '2026-06-23', dueTime: '23:59', maxMarks: 15, attachments: [], status: 'overdue', totalStudents: 45, submitted: 40, graded: 40, alertsSent: 180, channel: 'all', isImportant: false, tags: ['essay', 'history'], reminderHours: [24] },
  { id: 4, title: 'Python Programming – OOP Concepts', description: 'Create a Python program demonstrating classes, inheritance, and polymorphism with a real-world example.', subject: 'computer', className: '12', section: 'B', teacherId: 4, teacherName: 'Ms. Nair', assignedDate: '2026-06-23', dueDate: '2026-06-28', dueTime: '23:59', maxMarks: 30, attachments: ['oop_guidelines.pdf'], status: 'published', totalStudents: 40, submitted: 5, graded: 0, alertsSent: 40, channel: 'all', isImportant: true, tags: ['python', 'oop', 'programming'], reminderHours: [48, 24, 6, 2] },
  { id: 5, title: 'Prose Summary: The Last Lesson', description: 'Write a summary and character analysis of "The Last Lesson" by Alphonse Daudet.', subject: 'english', className: '12', section: 'A', teacherId: 5, teacherName: 'Ms. Patel', assignedDate: '2026-06-23', dueDate: '2026-06-27', dueTime: '23:59', maxMarks: 10, attachments: [], status: 'draft', totalStudents: 42, submitted: 0, graded: 0, alertsSent: 0, channel: 'push', isImportant: false, tags: ['english', 'prose'], reminderHours: [24, 2] },
  { id: 6, title: 'Newton\'s Laws Numericals', description: 'Solve the 15 numerical problems from Chapter 5 on Newton\'s Laws of Motion.', subject: 'physics', className: '11', section: 'A', teacherId: 6, teacherName: 'Dr. Iyer', assignedDate: '2026-06-19', dueDate: '2026-06-22', dueTime: '23:59', maxMarks: 20, attachments: ['numericals_ch5.pdf'], status: 'graded', totalStudents: 36, submitted: 35, graded: 35, alertsSent: 144, channel: 'all', isImportant: false, tags: ['physics', 'numericals'], reminderHours: [24] },
  { id: 7, title: 'Acids, Bases and Salts – Q&A', description: 'Answer questions from Chapter 2 workbook. Include examples from daily life.', subject: 'chemistry', className: '10', section: 'B', teacherId: 7, teacherName: 'Ms. Singh', assignedDate: '2026-06-22', dueDate: '2026-06-25', dueTime: '20:00', maxMarks: 15, attachments: ['ch2_workbook.pdf'], status: 'published', totalStudents: 44, submitted: 18, graded: 0, alertsSent: 88, channel: 'sms', isImportant: false, tags: ['chemistry', 'acids'], reminderHours: [24, 3] },
];

const ALERT_LOGS: AlertLog[] = [
  { id: 1, assignmentId: 1, assignmentTitle: 'Integration & Differentiation', type: 'new_assignment', channel: 'push', recipient: 'Class 12-A (42 students)', recipientType: 'student', status: 'sent', sentAt: '2026-06-22 09:15', message: '📚 New Assignment! Integration & Differentiation assigned by Mr. Sharma. Due: 26 Jun, 11:59 PM. Marks: 20', subject: 'mathematics', className: '12-A' },
  { id: 2, assignmentId: 1, assignmentTitle: 'Integration & Differentiation', type: 'new_assignment', channel: 'email', recipient: 'Parents of Class 12-A', recipientType: 'parent', status: 'sent', sentAt: '2026-06-22 09:15', message: 'Your ward has received a new Maths assignment due on 26 June.', subject: 'mathematics', className: '12-A' },
  { id: 3, assignmentId: 2, assignmentTitle: 'Photosynthesis Lab Report', type: 'due_reminder', channel: 'push', recipient: 'Class 11-B (38 students)', recipientType: 'student', status: 'sent', sentAt: '2026-06-24 09:00', message: '⏰ Reminder! "Photosynthesis Lab Report" is due tomorrow at 5:00 PM. 16 submissions pending.', subject: 'biology', className: '11-B' },
  { id: 4, assignmentId: 3, assignmentTitle: 'Essay: Freedom Struggle', type: 'overdue', channel: 'sms', recipient: '5 students (Class 10-A)', recipientType: 'both', status: 'sent', sentAt: '2026-06-24 00:05', message: '⚠️ OVERDUE: Essay: Freedom Struggle was due on 23 Jun. Submit immediately to avoid penalty.', subject: 'history', className: '10-A' },
  { id: 5, assignmentId: 4, assignmentTitle: 'Python Programming – OOP', type: 'new_assignment', channel: 'all', recipient: 'Class 12-B (40 students)', recipientType: 'student', status: 'sent', sentAt: '2026-06-23 10:00', message: '💻 New Assignment! Python OOP Concepts assigned by Ms. Nair. Due: 28 Jun. Marks: 30', subject: 'computer', className: '12-B' },
  { id: 6, assignmentId: 1, assignmentTitle: 'Integration & Differentiation', type: 'due_reminder', channel: 'push', recipient: 'Class 12-A – 14 pending', recipientType: 'student', status: 'sent', sentAt: '2026-06-26 22:00', message: '🔔 2 hours left! Submit "Integration & Differentiation" before midnight.', subject: 'mathematics', className: '12-A' },
  { id: 7, assignmentId: 6, assignmentTitle: 'Newton\'s Laws Numericals', type: 'grade_published', channel: 'push', recipient: 'Class 11-A (35 students)', recipientType: 'student', status: 'sent', sentAt: '2026-06-23 14:30', message: '🏆 Grades published! Check your score for "Newton\'s Laws Numericals". Avg: 16/20', subject: 'physics', className: '11-A' },
  { id: 8, assignmentId: 7, assignmentTitle: 'Acids, Bases and Salts – Q&A', type: 'due_reminder', channel: 'sms', recipient: 'Parents of 26 students (10-B)', recipientType: 'parent', status: 'failed', sentAt: '2026-06-24 08:00', message: 'Your child\'s Chemistry assignment is due today at 8 PM. Only 18/44 submissions received.', subject: 'chemistry', className: '10-B' },
];

const ALERT_RULES: AlertRule[] = [
  { id: 1, name: 'New Assignment Alert', trigger: 'new_assignment', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '📚 New {subject} Assignment! "{title}" assigned by {teacher}. Due: {dueDate}. Max Marks: {marks}.', conditions: 'When any assignment is published' },
  { id: 2, name: 'Due Date Reminder', trigger: 'due_reminder', channel: 'push', recipientType: 'student', isEnabled: true, reminderOffsets: [48, 24, 2], template: '⏰ Reminder! "{title}" is due in {hours}. {pending} submissions pending. Submit now!', conditions: '48h, 24h, 2h before due date' },
  { id: 3, name: 'Parent Due Reminder', trigger: 'due_reminder', channel: 'sms', recipientType: 'parent', isEnabled: true, reminderOffsets: [24], template: 'Dear Parent, your ward\'s {subject} assignment "{title}" is due tomorrow. Please ensure timely submission.', conditions: '24h before due date' },
  { id: 4, name: 'Overdue Alert', trigger: 'overdue', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '⚠️ OVERDUE: "{title}" was due on {dueDate}. Submit immediately. Contact {teacher} for late submission policy.', conditions: 'When submission missed after due date' },
  { id: 5, name: 'Submission Confirmation', trigger: 'submission_confirm', channel: 'push', recipientType: 'student', isEnabled: true, reminderOffsets: [], template: '✅ Submitted! Your "{title}" assignment has been received. Marks: /{maxMarks}. Grading in progress.', conditions: 'On successful submission' },
  { id: 6, name: 'Grade Published Alert', trigger: 'grade_published', channel: 'push', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '🏆 Grades Published! Check your score for "{title}". Average class score: {avg}/{maxMarks}.', conditions: 'When teacher publishes grades' },
  { id: 7, name: 'Extension Alert', trigger: 'extension_granted', channel: 'push', recipientType: 'student', isEnabled: false, reminderOffsets: [], template: '🕐 Due date extended! "{title}" new deadline: {newDate}. Take advantage of the extra time!', conditions: 'When teacher grants extension' },
];

const ANALYTICS_DATA: AnalyticsData[] = [
  { date: 'Jun 17', sent: 42, delivered: 41, opened: 32 },
  { date: 'Jun 18', sent: 168, delivered: 165, opened: 130 },
  { date: 'Jun 19', sent: 38, delivered: 37, opened: 28 },
  { date: 'Jun 20', sent: 90, delivered: 88, opened: 75 },
  { date: 'Jun 21', sent: 114, delivered: 112, opened: 88 },
  { date: 'Jun 22', sent: 252, delivered: 247, opened: 198 },
  { date: 'Jun 23', sent: 310, delivered: 305, opened: 246 },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SUBJECT_CFG: Record<Subject, { label: string; color: string; bg: string; emoji: string }> = {
  mathematics:    { label: 'Mathematics',    color: 'text-blue-700',   bg: 'bg-blue-100',    emoji: '📐' },
  science:        { label: 'Science',        color: 'text-green-700',  bg: 'bg-green-100',   emoji: '🔬' },
  english:        { label: 'English',        color: 'text-purple-700', bg: 'bg-purple-100',  emoji: '📝' },
  hindi:          { label: 'Hindi',          color: 'text-orange-700', bg: 'bg-orange-100',  emoji: '🪔' },
  social_science: { label: 'Social Science', color: 'text-amber-700',  bg: 'bg-amber-100',   emoji: '🌍' },
  computer:       { label: 'Computer',       color: 'text-cyan-700',   bg: 'bg-cyan-100',    emoji: '💻' },
  physics:        { label: 'Physics',        color: 'text-indigo-700', bg: 'bg-indigo-100',  emoji: '⚛️'  },
  chemistry:      { label: 'Chemistry',      color: 'text-red-700',    bg: 'bg-red-100',     emoji: '🧪' },
  biology:        { label: 'Biology',        color: 'text-emerald-700',bg: 'bg-emerald-100', emoji: '🌿' },
  history:        { label: 'History',        color: 'text-yellow-700', bg: 'bg-yellow-100',  emoji: '🏛️'  },
};

const STATUS_CFG: Record<AssignmentStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Draft',     color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  published: { label: 'Published', color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  overdue:   { label: 'Overdue',   color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500 animate-pulse' },
  submitted: { label: 'Submitted', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  graded:    { label: 'Graded',    color: 'text-violet-700',  bg: 'bg-violet-100',  dot: 'bg-violet-500' },
};

const ALERT_TYPE_CFG: Record<AlertType, { label: string; color: string; bg: string; emoji: string }> = {
  new_assignment:     { label: 'New Assignment',     color: 'text-blue-700',   bg: 'bg-blue-100',   emoji: '📚' },
  due_reminder:       { label: 'Due Reminder',       color: 'text-amber-700',  bg: 'bg-amber-100',  emoji: '⏰' },
  overdue:            { label: 'Overdue Alert',      color: 'text-red-700',    bg: 'bg-red-100',    emoji: '⚠️' },
  submission_confirm: { label: 'Submission Confirm', color: 'text-emerald-700',bg: 'bg-emerald-100',emoji: '✅' },
  grade_published:    { label: 'Grade Published',    color: 'text-violet-700', bg: 'bg-violet-100', emoji: '🏆' },
  extension_granted:  { label: 'Extension Granted',  color: 'text-cyan-700',   bg: 'bg-cyan-100',   emoji: '🕐' },
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

// ─── COMPOSE FORM ─────────────────────────────────────────────────────────────

interface ComposeForm {
  title: string;
  description: string;
  subject: Subject;
  className: string;
  section: string;
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  maxMarks: number;
  channel: NotifChannel;
  isImportant: boolean;
  tags: string;
  reminderHours: string;
}

const emptyForm = (): ComposeForm => ({
  title: '', description: '', subject: 'mathematics', className: '10',
  section: 'A', assignedDate: new Date().toISOString().split('T')[0],
  dueDate: '', dueTime: '23:59', maxMarks: 10, channel: 'all',
  isImportant: false, tags: '', reminderHours: '48,24,2',
});

// ─── MINI BAR ─────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

// ─── ANALYTICS BAR CHART ──────────────────────────────────────────────────────

const AnalyticsBar: React.FC<{ data: AnalyticsData[]; field: keyof AnalyticsData; color: string }> = ({ data, field, color }) => {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1.5 h-12">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = Math.max(4, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all cursor-default`} style={{ height: `${pct}%` }} />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">{val}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HomeworkAlertManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>(ASSIGNMENTS);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>(ALERT_LOGS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(ALERT_RULES);
  const [compose, setCompose] = useState<ComposeForm>(emptyForm());
  const [showCompose, setShowCompose] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(ASSIGNMENTS[0]);
  const [searchAssign, setSearchAssign] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchLogs, setSearchLogs] = useState('');
  const [filterAlertType, setFilterAlertType] = useState<AlertType | 'all'>('all');
  const [sendingTest, setSendingTest] = useState<number | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // Stats
  const totalAssignments = assignments.length;
  const published = assignments.filter(a => a.status === 'published').length;
  const overdue = assignments.filter(a => a.status === 'overdue').length;
  const totalAlertsSent = assignments.reduce((s, a) => s + a.alertsSent, 0);
  const totalSent7d = ANALYTICS_DATA.reduce((s, d) => s + d.sent, 0);
  const totalDelivered7d = ANALYTICS_DATA.reduce((s, d) => s + d.delivered, 0);
  const totalOpened7d = ANALYTICS_DATA.reduce((s, d) => s + d.opened, 0);
  const openRate = totalDelivered7d > 0 ? ((totalOpened7d / totalDelivered7d) * 100).toFixed(1) : '0';

  // Filtered
  const filteredAssignments = assignments.filter(a => {
    if (filterSubject !== 'all' && a.subject !== filterSubject) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchAssign && !a.title.toLowerCase().includes(searchAssign.toLowerCase()) &&
        !a.teacherName.toLowerCase().includes(searchAssign.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = alertLogs.filter(l => {
    if (filterAlertType !== 'all' && l.type !== filterAlertType) return false;
    if (searchLogs && !l.assignmentTitle.toLowerCase().includes(searchLogs.toLowerCase()) &&
        !l.recipient.toLowerCase().includes(searchLogs.toLowerCase())) return false;
    return true;
  });

  // Handlers
  const handlePublish = async () => {
    if (!compose.title.trim()) { toast.error('Assignment title is required'); return; }
    if (!compose.dueDate) { toast.error('Due date is required'); return; }
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1800));
    setPublishing(false);
    const na: Assignment = {
      id: Date.now(), title: compose.title, description: compose.description,
      subject: compose.subject, className: compose.className, section: compose.section,
      teacherId: 99, teacherName: 'You',
      assignedDate: compose.assignedDate, dueDate: compose.dueDate, dueTime: compose.dueTime,
      maxMarks: compose.maxMarks, attachments: [], status: 'published',
      totalStudents: 40, submitted: 0, graded: 0,
      alertsSent: compose.channel === 'all' ? 120 : 40,
      channel: compose.channel, isImportant: compose.isImportant,
      tags: compose.tags.split(',').map(t => t.trim()).filter(Boolean),
      reminderHours: compose.reminderHours.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h)),
    };
    setAssignments(prev => [na, ...prev]);
    setSelectedAssignment(na);
    // Add alert log
    setAlertLogs(prev => [{
      id: Date.now(), assignmentId: na.id, assignmentTitle: na.title, type: 'new_assignment',
      channel: na.channel, recipient: `Class ${na.className}-${na.section} (40 students)`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `📚 New ${SUBJECT_CFG[na.subject].label} Assignment! "${na.title}". Due: ${na.dueDate}.`,
      subject: na.subject, className: `${na.className}-${na.section}`,
    }, ...prev]);
    toast.success(`✅ Assignment published & alerts sent via ${CHANNEL_CFG[na.channel].label}!`);
    setCompose(emptyForm());
    setShowCompose(false);
  };

  const sendManualReminder = async (a: Assignment) => {
    setSendingTest(a.id);
    await new Promise(r => setTimeout(r, 1500));
    setSendingTest(null);
    const pending = a.totalStudents - a.submitted;
    setAlertLogs(prev => [{
      id: Date.now(), assignmentId: a.id, assignmentTitle: a.title, type: 'due_reminder',
      channel: a.channel, recipient: `${pending} pending students (${a.className}-${a.section})`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `⏰ Reminder: "${a.title}" is due on ${a.dueDate}. ${pending} submissions pending!`,
      subject: a.subject, className: `${a.className}-${a.section}`,
    }, ...prev]);
    toast.success(`📲 Reminder sent to ${pending} pending students!`);
  };

  const deleteAssignment = (id: number) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (selectedAssignment?.id === id) setSelectedAssignment(null);
    toast.success('Assignment deleted');
  };

  const toggleRule = (id: number) => {
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    const rule = alertRules.find(r => r.id === id);
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  const Av: React.FC<{ text: string; color?: string }> = ({ text, color = 'bg-indigo-600' }) => (
    <div className={`w-7 h-7 ${color} text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[9px]`}>
      {text.split(' ').map(w => w[0]).join('').slice(0, 2)}
    </div>
  );

  const SubmissionProgress: React.FC<{ a: Assignment }> = ({ a }) => {
    const pct = a.totalStudents > 0 ? Math.round((a.submitted / a.totalStudents) * 100) : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <MiniBar value={a.submitted} max={a.totalStudents} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
        </div>
        <span className="text-[9px] font-bold text-slate-600 w-10 text-right">{a.submitted}/{a.totalStudents}</span>
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Homework & Assignment Alert Center</h1>
            <p className="text-[9px] text-indigo-200 font-medium">Auto-alerts · Reminders · Overdue · Grade notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{totalAlertsSent.toLocaleString()} alerts sent</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3 h-3 text-indigo-300" />
            <span className="text-[9px] font-bold">{totalAssignments} assignments</span>
          </div>
          <button
            onClick={() => { setGlobalEnabled(!globalEnabled); toast.success(globalEnabled ? 'Homework alerts paused' : 'Homework alerts resumed'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalEnabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200 hover:bg-red-500/30'}`}>
            {globalEnabled ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
          <button
            onClick={() => { setShowCompose(true); setActiveTab('assignments'); }}
            className="flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Assignment
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Published', val: published, icon: <CheckCircle className="w-3 h-3" />, color: 'text-blue-600' },
          { label: 'Overdue', val: overdue, icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-600' },
          { label: 'Graded', val: assignments.filter(a => a.status === 'graded').length, icon: <Star className="w-3 h-3" />, color: 'text-violet-600' },
          { label: '7d Alerts Sent', val: totalSent7d, icon: <Send className="w-3 h-3" />, color: 'text-indigo-600' },
          { label: '7d Open Rate', val: `${openRate}%`, icon: <Eye className="w-3 h-3" />, color: 'text-emerald-600' },
          { label: 'Active Rules', val: alertRules.filter(r => r.isEnabled).length, icon: <Settings className="w-3 h-3" />, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-white border border-indigo-200 px-3 py-1.5 rounded-full whitespace-nowrap">
            <span className={`${s.color}`}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-3.5 h-3.5" />, badge: overdue },
          { key: 'alerts', label: 'Alert Logs', icon: <Bell className="w-3.5 h-3.5" />, badge: alertLogs.filter(l => l.status === 'failed').length },
          { key: 'rules', label: 'Alert Rules', icon: <Settings className="w-3.5 h-3.5" /> },
          { key: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════ ASSIGNMENTS TAB ═══════════ */}
        {activeTab === 'assignments' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>
            {/* Compose Panel */}
            {showCompose && (
              <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto bg-indigo-50/30">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                  <h3 className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 text-indigo-600" /> New Assignment</h3>
                  <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Chapter 12 Exercises" value={compose.title}
                      onChange={e => setCompose(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea rows={3} placeholder="Instructions for students..." value={compose.description}
                      onChange={e => setCompose(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                      <select value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value as Subject }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        {Object.entries(SUBJECT_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Marks</label>
                      <input type="number" min={1} value={compose.maxMarks}
                        onChange={e => setCompose(p => ({ ...p, maxMarks: +e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class</label>
                      <select value={compose.className} onChange={e => setCompose(p => ({ ...p, className: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</label>
                      <select value={compose.section} onChange={e => setCompose(p => ({ ...p, section: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date <span className="text-red-500">*</span></label>
                      <input type="date" value={compose.dueDate} onChange={e => setCompose(p => ({ ...p, dueDate: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Time</label>
                      <input type="time" value={compose.dueTime} onChange={e => setCompose(p => ({ ...p, dueTime: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alert Channel</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(CHANNEL_CFG) as [NotifChannel, typeof CHANNEL_CFG[NotifChannel]][]).map(([k, v]) => (
                        <button key={k} onClick={() => setCompose(p => ({ ...p, channel: k }))}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold transition cursor-pointer ${compose.channel === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                          {v.icon} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reminder Offsets (hours before)</label>
                    <input type="text" placeholder="e.g. 48,24,2" value={compose.reminderHours}
                      onChange={e => setCompose(p => ({ ...p, reminderHours: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    <p className="text-[8px] text-slate-400 mt-1">Auto-reminders sent at specified hours before due date</p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags</label>
                    <input type="text" placeholder="e.g. chapter12, exam, important" value={compose.tags}
                      onChange={e => setCompose(p => ({ ...p, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={compose.isImportant} onChange={e => setCompose(p => ({ ...p, isImportant: e.target.checked }))} className="rounded" />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Flag className="w-3 h-3 text-red-500" /> Mark as Important</span>
                  </label>
                  <button onClick={handlePublish} disabled={publishing}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60">
                    {publishing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing…</> : <><Send className="w-3.5 h-3.5" /> Publish & Send Alerts</>}
                  </button>
                </div>
              </div>
            )}

            {/* Assignment List */}
            <div className={`${showCompose ? 'flex-1' : 'w-80 flex-shrink-0'} border-r border-slate-200 overflow-y-auto flex flex-col`}>
              {/* Filters */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search assignments…" value={searchAssign}
                      onChange={e => setSearchAssign(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <button onClick={() => setShowCompose(!showCompose)} className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg cursor-pointer transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all', 'draft', 'published', 'overdue', 'graded'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                      {s === 'all' ? 'All' : STATUS_CFG[s]?.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 divide-y divide-slate-100">
                {filteredAssignments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px] font-medium">No assignments found</p>
                  </div>
                )}
                {filteredAssignments.map(a => {
                  const sub = SUBJECT_CFG[a.subject];
                  const st = STATUS_CFG[a.status];
                  const isSelected = selectedAssignment?.id === a.id;
                  return (
                    <div key={a.id} onClick={() => setSelectedAssignment(a)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-indigo-50/50 transition ${isSelected ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${sub.bg}`}>
                          {sub.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            {a.isImportant && <Flag className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
                            <p className="text-[10px] font-bold text-slate-800 truncate">{a.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sub.bg} ${sub.color}`}>{sub.label}</span>
                            <span className="text-[8px] font-medium text-slate-400">Class {a.className}-{a.section}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                          </div>
                          <SubmissionProgress a={a} />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Due {a.dueDate}</span>
                            <span className="text-[8px] font-bold text-indigo-600">{a.alertsSent} alerts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignment Detail */}
            {!showCompose && (
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedAssignment ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[11px] font-medium">Select an assignment to view details</p>
                  </div>
                ) : (() => {
                  const a = selectedAssignment;
                  const sub = SUBJECT_CFG[a.subject];
                  const st = STATUS_CFG[a.status];
                  const submPct = a.totalStudents > 0 ? Math.round((a.submitted / a.totalStudents) * 100) : 0;
                  const gradedPct = a.submitted > 0 ? Math.round((a.graded / a.submitted) * 100) : 0;
                  return (
                    <div className="space-y-4 max-w-2xl">
                      {/* Header */}
                      <div className={`rounded-2xl p-4 ${sub.bg} border border-opacity-20`} style={{ borderColor: sub.color }}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{sub.emoji}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {a.isImportant && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-0.5"><Flag className="w-2.5 h-2.5" /> Important</span>}
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color} flex items-center gap-0.5`}>
                                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${st.dot}`} /> {st.label}
                                </span>
                              </div>
                              <h2 className="text-[13px] font-extrabold text-slate-800">{a.title}</h2>
                              <p className="text-[9px] text-slate-600 font-medium mt-0.5">{a.teacherName} · Class {a.className}-{a.section} · {sub.label} · {a.maxMarks} marks</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => sendManualReminder(a)} disabled={sendingTest === a.id}
                              className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl cursor-pointer transition disabled:opacity-60">
                              {sendingTest === a.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                              Send Reminder
                            </button>
                            <button onClick={() => deleteAssignment(a.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl cursor-pointer transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {a.description && <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">{a.description}</p>}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Total Students', val: a.totalStudents, icon: <Users className="w-3.5 h-3.5" />, color: 'text-slate-600' },
                          { label: 'Submitted', val: `${a.submitted} (${submPct}%)`, icon: <CheckSquare className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
                          { label: 'Graded', val: `${a.graded} (${gradedPct}%)`, icon: <Star className="w-3.5 h-3.5" />, color: 'text-violet-600' },
                          { label: 'Alerts Sent', val: a.alertsSent, icon: <Bell className="w-3.5 h-3.5" />, color: 'text-indigo-600' },
                        ].map((s, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                            <p className="text-[12px] font-extrabold text-slate-800">{s.val}</p>
                            <p className="text-[8px] text-slate-400 font-medium">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Submission Progress */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-600" /> Submission Progress</h3>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Submitted', val: a.submitted, max: a.totalStudents, color: 'bg-emerald-500' },
                            { label: 'Graded', val: a.graded, max: a.totalStudents, color: 'bg-violet-500' },
                            { label: 'Pending', val: a.totalStudents - a.submitted, max: a.totalStudents, color: 'bg-amber-500' },
                          ].map((p, i) => (
                            <div key={i}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[9px] font-bold text-slate-600">{p.label}</span>
                                <span className="text-[9px] font-bold text-slate-600">{p.val} / {p.max}</span>
                              </div>
                              <MiniBar value={p.val} max={p.max} color={p.color} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Due Date & Channel */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <h4 className="text-[9px] font-extrabold text-slate-600 mb-2 flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-600" /> Schedule</h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-[9px] text-slate-400">Assigned</span>
                              <span className="text-[9px] font-bold text-slate-700">{a.assignedDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] text-slate-400">Due Date</span>
                              <span className={`text-[9px] font-bold ${a.status === 'overdue' ? 'text-red-600' : 'text-slate-700'}`}>{a.dueDate} {a.dueTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] text-slate-400">Reminders</span>
                              <span className="text-[9px] font-bold text-indigo-600">{a.reminderHours.join('h, ')}h before</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <h4 className="text-[9px] font-extrabold text-slate-600 mb-2 flex items-center gap-1"><Bell className="w-3 h-3 text-indigo-600" /> Alert Channel</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 rounded-xl ${CHANNEL_CFG[a.channel].bg} ${CHANNEL_CFG[a.channel].color}`}>
                              {CHANNEL_CFG[a.channel].icon} {CHANNEL_CFG[a.channel].label}
                            </span>
                          </div>
                          {a.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {a.tags.map((tag, i) => (
                                <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">#{tag}</span>
                              ))}
                            </div>
                          )}
                          {a.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {a.attachments.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] text-indigo-600 font-bold cursor-pointer hover:underline">
                                  <Paperclip className="w-3 h-3" /> {f}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent Alerts for this assignment */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <h3 className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-indigo-600" /> Alert History for this Assignment</h3>
                        <div className="space-y-1.5">
                          {alertLogs.filter(l => l.assignmentId === a.id).length === 0
                            ? <p className="text-[9px] text-slate-400 py-2 text-center">No alerts sent yet</p>
                            : alertLogs.filter(l => l.assignmentId === a.id).slice(0, 5).map(log => {
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
                                    <p className="text-[9px] text-slate-500 mt-0.5 truncate">{log.recipient} via {CHANNEL_CFG[log.channel].label}</p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ ALERT LOGS TAB ═══════════ */}
        {activeTab === 'alerts' && (
          <div className="p-4 space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search logs…" value={searchLogs}
                  onChange={e => setSearchLogs(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <select value={filterAlertType} onChange={e => setFilterAlertType(e.target.value as AlertType | 'all')}
                className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                <option value="all">All Types</option>
                {Object.entries(ALERT_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
              <button onClick={() => { setSearchLogs(''); setFilterAlertType('all'); }} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Logs', val: alertLogs.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
                { label: 'Sent', val: alertLogs.filter(l => l.status === 'sent').length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Failed', val: alertLogs.filter(l => l.status === 'failed').length, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Queued', val: alertLogs.filter(l => l.status === 'queued').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                  <p className={`text-[16px] font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Assignment', 'Alert Type', 'Channel', 'Recipient', 'Status', 'Sent At'].map(h => (
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
                          <div>
                            <p className="text-[10px] font-bold text-slate-800 leading-tight">{log.assignmentTitle}</p>
                            <p className="text-[8px] text-slate-400">{log.className}</p>
                          </div>
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
                        <td className="px-3 py-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${as_.bg} ${as_.color}`}>{as_.label}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[8px] text-slate-500 font-medium">{log.sentAt}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px] font-medium">No alert logs found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ ALERT RULES TAB ═══════════ */}
        {activeTab === 'rules' && (
          <div className="p-4 space-y-3 max-w-3xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h2 className="text-[11px] font-extrabold text-slate-700">Automated Alert Rules</h2>
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
                <div key={rule.id} className={`bg-white border-2 rounded-xl overflow-hidden transition ${rule.isEnabled ? 'border-indigo-200' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${rule.isEnabled ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{at.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-extrabold text-slate-800">{rule.name}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${at.bg} ${at.color}`}>{at.label}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          {ch.icon} {ch.label} → <span className="capitalize">{rule.recipientType}</span> · {rule.conditions}
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
                        {rule.isEnabled ? <ToggleRight className="w-7 h-7 text-indigo-500" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message Template</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-medium text-slate-700 leading-relaxed">{rule.template}</p>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-1">Variables: {'{title}'}, {'{subject}'}, {'{teacher}'}, {'{dueDate}'}, {'{marks}'}, {'{pending}'}, {'{hours}'}</p>
                      </div>
                      {rule.reminderOffsets.length > 0 && (
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reminder Offsets</label>
                          <div className="flex gap-2">
                            {rule.reminderOffsets.map((h, i) => (
                              <span key={i} className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                <AlarmClock className="w-2.5 h-2.5" /> {h}h before
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { toast.success(`Testing rule: ${rule.name}`); }}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl cursor-pointer transition">
                          <Zap className="w-3 h-3" /> Test Rule
                        </button>
                        <button onClick={() => { toast.success('Rule settings saved'); }}
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

        {/* ═══════════ ANALYTICS TAB ═══════════ */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Alerts Sent (7d)', val: totalSent7d, sub: 'Total delivered', icon: <Send className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                { label: 'Delivered (7d)', val: totalDelivered7d, sub: `${((totalDelivered7d/totalSent7d)*100).toFixed(1)}% delivery`, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Opened (7d)', val: totalOpened7d, sub: `${openRate}% open rate`, icon: <Eye className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Failed (7d)', val: totalSent7d - totalDelivered7d, sub: 'Delivery failures', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              ].map((kpi, i) => (
                <div key={i} className={`${kpi.bg} border ${kpi.border} rounded-xl p-4`}>
                  <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                  <p className={`text-[22px] font-extrabold ${kpi.color}`}>{kpi.val.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-700">{kpi.label}</p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* 7-day Delivery Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-600" /> 7-Day Alert Activity
                </h3>
                <p className="text-[8px] text-slate-400 mb-3">Alerts sent per day this week</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="sent" color="bg-indigo-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>

              {/* Open Rate by Day */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Opens
                </h3>
                <p className="text-[8px] text-slate-400 mb-3">How many students opened alerts</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="opened" color="bg-emerald-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
            </div>

            {/* Alert Type Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-600" /> Alert Type Breakdown (Total)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { type: 'new_assignment' as AlertType, count: alertLogs.filter(l => l.type === 'new_assignment').length },
                  { type: 'due_reminder' as AlertType, count: alertLogs.filter(l => l.type === 'due_reminder').length },
                  { type: 'overdue' as AlertType, count: alertLogs.filter(l => l.type === 'overdue').length },
                  { type: 'grade_published' as AlertType, count: alertLogs.filter(l => l.type === 'grade_published').length },
                  { type: 'submission_confirm' as AlertType, count: alertLogs.filter(l => l.type === 'submission_confirm').length },
                  { type: 'extension_granted' as AlertType, count: alertLogs.filter(l => l.type === 'extension_granted').length },
                ]).map(({ type, count }) => {
                  const at = ALERT_TYPE_CFG[type];
                  const total = alertLogs.length || 1;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-base flex-shrink-0">{at.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] font-bold text-slate-700 truncate">{at.label}</span>
                          <span className="text-[9px] font-bold text-slate-500">{count}</span>
                        </div>
                        <MiniBar value={count} max={total} color={at.bg.replace('bg-', 'bg-').replace('100', '400')} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject-wise */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                <Book className="w-3.5 h-3.5 text-indigo-600" /> Subject-wise Assignment Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Subject', 'Assignments', 'Total Students', 'Avg Submission %', 'Alerts Sent'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.entries(SUBJECT_CFG).map(([subj, cfg]) => {
                      const subAssigns = assignments.filter(a => a.subject === (subj as Subject));
                      if (subAssigns.length === 0) return null;
                      const avgSubm = subAssigns.reduce((s, a) => s + (a.totalStudents > 0 ? a.submitted / a.totalStudents : 0), 0) / subAssigns.length * 100;
                      const totalStud = subAssigns.reduce((s, a) => s + a.totalStudents, 0);
                      const totalAl = subAssigns.reduce((s, a) => s + a.alertsSent, 0);
                      return (
                        <tr key={subj} className="hover:bg-slate-50">
                          <td className="px-3 py-2">
                            <span className={`flex items-center gap-1.5 text-[9px] font-bold ${cfg.color}`}>
                              <span>{cfg.emoji}</span> {cfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-slate-700">{subAssigns.length}</td>
                          <td className="px-3 py-2 text-[9px] font-medium text-slate-600">{totalStud}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-16">
                                <div className={`h-1.5 rounded-full ${avgSubm >= 80 ? 'bg-emerald-500' : avgSubm >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, avgSubm)}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-600">{avgSubm.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-indigo-600">{totalAl}</td>
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

export default HomeworkAlertManager;
