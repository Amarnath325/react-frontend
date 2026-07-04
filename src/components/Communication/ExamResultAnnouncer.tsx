import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  GraduationCap, Bell, Send, Plus, Search, Settings, RefreshCw,
  Check, X, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronUp, Eye, Trash2, Star, Users, Calendar, FileText,
  Flag, MessageSquare, Globe, Zap, Activity, BarChart2, PieChart,
  Smartphone, Monitor, BellOff, BellRing, AlarmClock, Upload,
  ToggleLeft, ToggleRight, RotateCcw, Save, TrendingUp, TrendingDown,
  BookOpen, Award, ClipboardList, Download, Paperclip, Layers,
  Target, Info, Hash, Tag, Edit3, AlertTriangle, CheckSquare,
  MoreVertical, Percent, Trophy
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'exams' | 'results' | 'alerts' | 'rules' | 'analytics';
type ExamType = 'unit_test' | 'mid_term' | 'final' | 'practical' | 'board' | 'competitive' | 'olympiad';
type ExamStatus = 'upcoming' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
type ResultStatus = 'pending' | 'published' | 'withheld';
type AlertStatus = 'queued' | 'sent' | 'failed' | 'skipped';
type AlertType = 'schedule_announce' | 'exam_reminder' | 'hall_ticket' | 'result_published' | 'grade_update' | 'postponed' | 'cancelled' | 'toppers';
type NotifChannel = 'push' | 'sms' | 'email' | 'all';
type Subject = 'mathematics' | 'science' | 'english' | 'hindi' | 'social_science' | 'computer' | 'physics' | 'chemistry' | 'biology' | 'history' | 'all_subjects';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface Exam {
  id: number;
  title: string;
  examType: ExamType;
  className: string;
  subjects: string[];
  startDate: string;
  endDate: string;
  venue: string;
  totalStudents: number;
  duration: string;
  maxMarks: number;
  passMarks: number;
  status: ExamStatus;
  alertsSent: number;
  channel: NotifChannel;
  isImportant: boolean;
  tags: string[];
  invigilator: string;
  reminderDays: number[];
  hallTicketReady: boolean;
  syllabusPdf?: string;
}

interface Result {
  id: number;
  examId: number;
  examTitle: string;
  className: string;
  subject: string;
  examType: ExamType;
  status: ResultStatus;
  publishedAt?: string;
  totalStudents: number;
  appeared: number;
  passed: number;
  avgMarks: number;
  highestMarks: number;
  lowestMarks: number;
  maxMarks: number;
  toppers: { name: string; marks: number; roll: string }[];
  alertsSent: number;
  channel: NotifChannel;
  gradeDistribution: Record<string, number>;
}

interface AlertLog {
  id: number;
  examId?: number;
  resultId?: number;
  title: string;
  type: AlertType;
  channel: NotifChannel;
  recipient: string;
  recipientType: 'student' | 'parent' | 'both' | 'teacher';
  status: AlertStatus;
  sentAt: string;
  message: string;
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

interface AnalyticsDay {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const EXAMS: Exam[] = [
  { id: 1, title: 'Mid-Term Examination 2026', examType: 'mid_term', className: 'All Classes (6–12)', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], startDate: '2026-07-01', endDate: '2026-07-10', venue: 'School Examination Hall', totalStudents: 1240, duration: '3 hours', maxMarks: 100, passMarks: 33, status: 'upcoming', alertsSent: 3720, channel: 'all', isImportant: true, tags: ['mid-term', 'all-classes'], invigilator: 'Exam Committee', reminderDays: [7, 3, 1], hallTicketReady: true, syllabusPdf: 'midterm_syllabus.pdf' },
  { id: 2, title: 'Class 10 Pre-Board Exam', examType: 'mid_term', className: 'Class 10 (A, B, C)', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], startDate: '2026-06-28', endDate: '2026-07-05', venue: 'Rooms 201–210', totalStudents: 135, duration: '3 hours', maxMarks: 80, passMarks: 27, status: 'upcoming', alertsSent: 540, channel: 'all', isImportant: true, tags: ['preboard', 'class10', 'board-prep'], invigilator: 'Mr. Kumar', reminderDays: [7, 3, 1], hallTicketReady: true },
  { id: 3, title: 'Unit Test 3 – Science (Class 9)', examType: 'unit_test', className: 'Class 9-A, 9-B', subjects: ['Science'], startDate: '2026-06-26', endDate: '2026-06-26', venue: 'Regular Classrooms', totalStudents: 82, duration: '1.5 hours', maxMarks: 25, passMarks: 9, status: 'ongoing', alertsSent: 246, channel: 'push', isImportant: false, tags: ['unit-test', 'science', 'class9'], invigilator: 'Ms. Verma', reminderDays: [1], hallTicketReady: false },
  { id: 4, title: 'Term 1 Final Examination', examType: 'final', className: 'Classes 6–8', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Computer'], startDate: '2026-06-10', endDate: '2026-06-20', venue: 'School Hall', totalStudents: 680, duration: '2.5 hours', maxMarks: 100, passMarks: 33, status: 'completed', alertsSent: 4080, channel: 'all', isImportant: false, tags: ['term1', 'final'], invigilator: 'Exam Committee', reminderDays: [7, 3, 1], hallTicketReady: true, syllabusPdf: 'term1_syllabus.pdf' },
  { id: 5, title: 'Physics Practical Exam (Class 12)', examType: 'practical', className: 'Class 12 (A, B)', subjects: ['Physics Practical'], startDate: '2026-07-08', endDate: '2026-07-08', venue: 'Physics Lab', totalStudents: 82, duration: '3 hours', maxMarks: 30, passMarks: 10, status: 'upcoming', alertsSent: 164, channel: 'push', isImportant: false, tags: ['practical', 'physics', 'class12'], invigilator: 'Dr. Iyer', reminderDays: [3, 1], hallTicketReady: false },
  { id: 6, title: 'Maths Olympiad – School Round', examType: 'olympiad', className: 'Classes 8–12', subjects: ['Mathematics'], startDate: '2026-07-15', endDate: '2026-07-15', venue: 'Computer Lab & Exam Hall', totalStudents: 180, duration: '2 hours', maxMarks: 50, passMarks: 20, status: 'upcoming', alertsSent: 360, channel: 'all', isImportant: true, tags: ['olympiad', 'maths', 'competition'], invigilator: 'Mr. Sharma', reminderDays: [7, 3, 1], hallTicketReady: false },
];

const RESULTS: Result[] = [
  { id: 1, examId: 4, examTitle: 'Term 1 Final Examination – Mathematics', className: 'Class 8-A', subject: 'Mathematics', examType: 'final', status: 'published', publishedAt: '2026-06-22 10:00', totalStudents: 42, appeared: 41, passed: 38, avgMarks: 71.4, highestMarks: 98, lowestMarks: 24, maxMarks: 100, toppers: [{ name: 'Aryan Kumar', marks: 98, roll: 'A01' }, { name: 'Priya Patel', marks: 95, roll: 'A12' }, { name: 'Rohan Singh', marks: 93, roll: 'A07' }], alertsSent: 123, channel: 'all', gradeDistribution: { A1: 8, A2: 12, B1: 10, B2: 8, C: 2, D: 1, F: 0 } },
  { id: 2, examId: 4, examTitle: 'Term 1 Final Examination – Science', className: 'Class 8-A', subject: 'Science', examType: 'final', status: 'published', publishedAt: '2026-06-22 11:00', totalStudents: 42, appeared: 41, passed: 39, avgMarks: 74.2, highestMarks: 96, lowestMarks: 28, maxMarks: 100, toppers: [{ name: 'Priya Patel', marks: 96, roll: 'A12' }, { name: 'Aryan Kumar', marks: 91, roll: 'A01' }, { name: 'Kavya Gupta', marks: 88, roll: 'A19' }], alertsSent: 123, channel: 'all', gradeDistribution: { A1: 10, A2: 14, B1: 8, B2: 7, C: 2, D: 0, F: 0 } },
  { id: 3, examId: 4, examTitle: 'Term 1 Final Examination – English', className: 'Class 8-B', subject: 'English', examType: 'final', status: 'published', publishedAt: '2026-06-23 09:30', totalStudents: 40, appeared: 40, passed: 37, avgMarks: 68.5, highestMarks: 92, lowestMarks: 22, maxMarks: 100, toppers: [{ name: 'Sneha Rao', marks: 92, roll: 'B03' }, { name: 'Rahul Sharma', marks: 89, roll: 'B11' }, { name: 'Anita Mishra', marks: 85, roll: 'B22' }], alertsSent: 120, channel: 'all', gradeDistribution: { A1: 5, A2: 10, B1: 12, B2: 9, C: 4, D: 0, F: 0 } },
  { id: 4, examId: 3, examTitle: 'Unit Test 3 – Science', className: 'Class 9-A', subject: 'Science', examType: 'unit_test', status: 'pending', totalStudents: 42, appeared: 0, passed: 0, avgMarks: 0, highestMarks: 0, lowestMarks: 0, maxMarks: 25, toppers: [], alertsSent: 0, channel: 'push', gradeDistribution: {} },
  { id: 5, examId: 4, examTitle: 'Term 1 Final Examination – Hindi', className: 'Class 7-A', subject: 'Hindi', examType: 'final', status: 'withheld', totalStudents: 38, appeared: 38, passed: 0, avgMarks: 0, highestMarks: 0, lowestMarks: 0, maxMarks: 100, toppers: [], alertsSent: 38, channel: 'sms', gradeDistribution: {} },
];

const ALERT_LOGS: AlertLog[] = [
  { id: 1, examId: 1, title: 'Mid-Term 2026 Schedule', type: 'schedule_announce', channel: 'all', recipient: 'All Students & Parents (1240)', recipientType: 'both', status: 'sent', sentAt: '2026-06-20 09:00', message: '📋 Mid-Term Exam Schedule 2026 announced! Exams from 1 July – 10 July. Download hall ticket from portal.', className: 'All Classes' },
  { id: 2, examId: 2, title: 'Class 10 Pre-Board Reminder', type: 'exam_reminder', channel: 'push', recipient: 'Class 10 Students (135)', recipientType: 'student', status: 'sent', sentAt: '2026-06-24 08:00', message: '📚 Pre-Board exams start in 4 days (28 June)! Prepare well. Hall ticket available for download.', className: 'Class 10' },
  { id: 3, examId: 2, title: 'Pre-Board Hall Ticket Ready', type: 'hall_ticket', channel: 'all', recipient: 'Class 10 (135 students + parents)', recipientType: 'both', status: 'sent', sentAt: '2026-06-22 10:30', message: '🎫 Hall ticket for Class 10 Pre-Board Exam is now available! Download from student portal immediately.', className: 'Class 10' },
  { id: 4, resultId: 1, title: 'Term 1 Maths Result – Class 8-A', type: 'result_published', channel: 'all', recipient: 'Class 8-A (42 students + parents)', recipientType: 'both', status: 'sent', sentAt: '2026-06-22 10:05', message: '🏆 Term 1 Mathematics results are out! Class Average: 71.4/100. Topper: Aryan Kumar (98). Check your scorecard now.', className: 'Class 8-A' },
  { id: 5, resultId: 2, title: 'Term 1 Science Result – Class 8-A', type: 'result_published', channel: 'all', recipient: 'Class 8-A (42 students + parents)', recipientType: 'both', status: 'sent', sentAt: '2026-06-22 11:05', message: '🏆 Term 1 Science results published! Class Average: 74.2/100. Topper: Priya Patel (96). Login to view scorecard.', className: 'Class 8-A' },
  { id: 6, examId: 6, title: 'Maths Olympiad Registration', type: 'schedule_announce', channel: 'all', recipient: 'Class 8–12 Students (180)', recipientType: 'student', status: 'sent', sentAt: '2026-06-23 09:00', message: '🥇 School Maths Olympiad on 15 July! Register by 5 July. Top 3 winners represent school at District level.', className: 'Classes 8–12' },
  { id: 7, resultId: 3, title: 'Term 1 English Result – Class 8-B', type: 'result_published', channel: 'all', recipient: 'Class 8-B (40 students + parents)', recipientType: 'both', status: 'sent', sentAt: '2026-06-23 09:35', message: '📝 Term 1 English results published! Class Average: 68.5/100. Topper: Sneha Rao (92). View detailed scorecard.', className: 'Class 8-B' },
  { id: 8, resultId: 1, title: 'Topper Announcement – Maths Class 8-A', type: 'toppers', channel: 'push', recipient: 'All Students & Parents', recipientType: 'both', status: 'sent', sentAt: '2026-06-22 12:00', message: '🏅 Congratulations to our toppers! Maths Class 8-A: 1st Aryan Kumar (98), 2nd Priya Patel (95), 3rd Rohan Singh (93).', className: 'Class 8-A' },
  { id: 9, examId: 3, title: 'Unit Test 3 Tomorrow', type: 'exam_reminder', channel: 'push', recipient: 'Class 9-A, 9-B (82 students)', recipientType: 'student', status: 'failed', sentAt: '2026-06-25 20:00', message: '⏰ Unit Test 3 (Science) is TOMORROW! Syllabus: Ch 8, 9, 10. Duration: 1.5 hours. All the best!', className: 'Class 9' },
];

const ALERT_RULES: AlertRule[] = [
  { id: 1, name: 'Exam Schedule Announcement', trigger: 'schedule_announce', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '📋 {examTitle} announced! Dates: {startDate}–{endDate}. Venue: {venue}. Hall ticket download: {link}', conditions: 'When exam is created and published' },
  { id: 2, name: 'Exam Countdown Reminder (Student)', trigger: 'exam_reminder', channel: 'push', recipientType: 'student', isEnabled: true, reminderOffsets: [7, 3, 1], template: '📚 {examTitle} in {days} day(s)! Prepare well. Venue: {venue}. Timing: {time}. Good luck!', conditions: '7 days, 3 days, 1 day before exam' },
  { id: 3, name: 'Exam Reminder (Parent)', trigger: 'exam_reminder', channel: 'sms', recipientType: 'parent', isEnabled: true, reminderOffsets: [3, 1], template: 'Dear Parent, your ward\'s {examTitle} is on {date}. Please ensure punctuality. Report time: {reportTime}.', conditions: '3 days, 1 day before exam' },
  { id: 4, name: 'Hall Ticket Availability', trigger: 'hall_ticket', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '🎫 Hall ticket for {examTitle} is ready! Download from student portal before {date}. Carry it compulsory.', conditions: 'When hall ticket is marked as ready' },
  { id: 5, name: 'Result Published Alert', trigger: 'result_published', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '🏆 {subject} results for {className} published! Average: {avg}/{max}. Topper: {topper}. Check scorecard on portal.', conditions: 'When result status is set to Published' },
  { id: 6, name: 'Topper Announcement', trigger: 'toppers', channel: 'push', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '🏅 Congratulations to {className} toppers! 1st: {t1} ({m1}), 2nd: {t2} ({m2}), 3rd: {t3} ({m3}). Keep it up!', conditions: 'Auto-triggered after result is published' },
  { id: 7, name: 'Exam Postponed Alert', trigger: 'postponed', channel: 'all', recipientType: 'both', isEnabled: true, reminderOffsets: [], template: '⚠️ IMPORTANT: {examTitle} originally on {oldDate} has been postponed to {newDate}. New hall ticket will be issued.', conditions: 'When exam status is changed to Postponed' },
  { id: 8, name: 'Exam Cancelled Alert', trigger: 'cancelled', channel: 'all', recipientType: 'both', isEnabled: false, reminderOffsets: [], template: '🚫 {examTitle} on {date} has been CANCELLED. Fresh dates will be announced via portal. Apologies for inconvenience.', conditions: 'When exam status is changed to Cancelled' },
];

const ANALYTICS_DATA: AnalyticsDay[] = [
  { date: 'Jun 17', sent: 80, delivered: 78, opened: 62 },
  { date: 'Jun 18', sent: 360, delivered: 354, opened: 295 },
  { date: 'Jun 19', sent: 45, delivered: 44, opened: 32 },
  { date: 'Jun 20', sent: 3720, delivered: 3695, opened: 3120 },
  { date: 'Jun 21', sent: 164, delivered: 162, opened: 128 },
  { date: 'Jun 22', sent: 540, delivered: 532, opened: 445 },
  { date: 'Jun 23', sent: 862, delivered: 851, opened: 710 },
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const EXAM_TYPE_CFG: Record<ExamType, { label: string; color: string; bg: string; emoji: string }> = {
  unit_test:    { label: 'Unit Test',    color: 'text-blue-700',   bg: 'bg-blue-100',    emoji: '📝' },
  mid_term:     { label: 'Mid-Term',     color: 'text-amber-700',  bg: 'bg-amber-100',   emoji: '📋' },
  final:        { label: 'Final Exam',   color: 'text-violet-700', bg: 'bg-violet-100',  emoji: '🎓' },
  practical:    { label: 'Practical',    color: 'text-teal-700',   bg: 'bg-teal-100',    emoji: '🔬' },
  board:        { label: 'Board Exam',   color: 'text-red-700',    bg: 'bg-red-100',     emoji: '📜' },
  competitive:  { label: 'Competitive',  color: 'text-emerald-700',bg: 'bg-emerald-100', emoji: '🏆' },
  olympiad:     { label: 'Olympiad',     color: 'text-yellow-700', bg: 'bg-yellow-100',  emoji: '🥇' },
};

const EXAM_STATUS_CFG: Record<ExamStatus, { label: string; color: string; bg: string; dot: string }> = {
  upcoming:   { label: 'Upcoming',   color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  ongoing:    { label: 'Ongoing',    color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500 animate-pulse' },
  completed:  { label: 'Completed',  color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  postponed:  { label: 'Postponed',  color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500' },
};

const RESULT_STATUS_CFG: Record<ResultStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  published: { label: 'Published', color: 'text-emerald-700',bg: 'bg-emerald-100' },
  withheld:  { label: 'Withheld',  color: 'text-red-700',    bg: 'bg-red-100' },
};

const ALERT_TYPE_CFG: Record<AlertType, { label: string; color: string; bg: string; emoji: string }> = {
  schedule_announce: { label: 'Schedule',     color: 'text-blue-700',   bg: 'bg-blue-100',   emoji: '📋' },
  exam_reminder:     { label: 'Reminder',     color: 'text-amber-700',  bg: 'bg-amber-100',  emoji: '⏰' },
  hall_ticket:       { label: 'Hall Ticket',  color: 'text-violet-700', bg: 'bg-violet-100', emoji: '🎫' },
  result_published:  { label: 'Result',       color: 'text-emerald-700',bg: 'bg-emerald-100',emoji: '🏆' },
  grade_update:      { label: 'Grade Update', color: 'text-teal-700',   bg: 'bg-teal-100',   emoji: '📊' },
  postponed:         { label: 'Postponed',    color: 'text-orange-700', bg: 'bg-orange-100', emoji: '⚠️' },
  cancelled:         { label: 'Cancelled',    color: 'text-red-700',    bg: 'bg-red-100',    emoji: '🚫' },
  toppers:           { label: 'Toppers',      color: 'text-yellow-700', bg: 'bg-yellow-100', emoji: '🏅' },
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

const GRADE_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500', A2: 'bg-green-500', B1: 'bg-blue-500',
  B2: 'bg-indigo-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500',
};

// ─── COMPOSE FORM ─────────────────────────────────────────────────────────────

interface ExamForm {
  title: string;
  examType: ExamType;
  className: string;
  subjects: string;
  startDate: string;
  endDate: string;
  venue: string;
  duration: string;
  maxMarks: number;
  passMarks: number;
  channel: NotifChannel;
  isImportant: boolean;
  tags: string;
  reminderDays: string;
  invigilator: string;
}

const emptyExamForm = (): ExamForm => ({
  title: '', examType: 'unit_test', className: 'Class 10',
  subjects: '', startDate: '', endDate: '', venue: 'School Examination Hall',
  duration: '3 hours', maxMarks: 100, passMarks: 33, channel: 'all',
  isImportant: false, tags: '', reminderDays: '7,3,1', invigilator: '',
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const AnalyticsBar: React.FC<{ data: AnalyticsDay[]; field: keyof AnalyticsDay; color: string }> = ({ data, field, color }) => {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = Math.max(4, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all cursor-default`} style={{ height: `${pct}%` }} />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">{val.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const ExamResultAnnouncer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exams');
  const [exams, setExams] = useState<Exam[]>(EXAMS);
  const [results, setResults] = useState<Result[]>(RESULTS);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>(ALERT_LOGS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(ALERT_RULES);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(EXAMS[0]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(RESULTS[0]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState<ExamForm>(emptyExamForm());
  const [publishing, setPublishing] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [searchExams, setSearchExams] = useState('');
  const [filterExamStatus, setFilterExamStatus] = useState<ExamStatus | 'all'>('all');
  const [filterExamType, setFilterExamType] = useState<ExamType | 'all'>('all');
  const [searchLogs, setSearchLogs] = useState('');
  const [filterLogType, setFilterLogType] = useState<AlertType | 'all'>('all');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [publishingResult, setPublishingResult] = useState<number | null>(null);

  // ── Derived Stats ──
  const upcoming = exams.filter(e => e.status === 'upcoming').length;
  const ongoing = exams.filter(e => e.status === 'ongoing').length;
  const totalAlertsSent = [...exams, ...results].reduce((s, x) => s + x.alertsSent, 0);
  const publishedResults = results.filter(r => r.status === 'published').length;
  const totalSent7d = ANALYTICS_DATA.reduce((s, d) => s + d.sent, 0);
  const totalDelivered7d = ANALYTICS_DATA.reduce((s, d) => s + d.delivered, 0);
  const totalOpened7d = ANALYTICS_DATA.reduce((s, d) => s + d.opened, 0);
  const openRate = totalDelivered7d > 0 ? ((totalOpened7d / totalDelivered7d) * 100).toFixed(1) : '0';

  // ── Filtered ──
  const filteredExams = exams.filter(e => {
    if (filterExamStatus !== 'all' && e.status !== filterExamStatus) return false;
    if (filterExamType !== 'all' && e.examType !== filterExamType) return false;
    if (searchExams && !e.title.toLowerCase().includes(searchExams.toLowerCase()) &&
        !e.className.toLowerCase().includes(searchExams.toLowerCase())) return false;
    return true;
  });

  const filteredLogs = alertLogs.filter(l => {
    if (filterLogType !== 'all' && l.type !== filterLogType) return false;
    if (searchLogs && !l.title.toLowerCase().includes(searchLogs.toLowerCase()) &&
        !l.recipient.toLowerCase().includes(searchLogs.toLowerCase())) return false;
    return true;
  });

  // ── Handlers ──
  const handlePublishExam = async () => {
    if (!examForm.title.trim()) { toast.error('Exam title is required'); return; }
    if (!examForm.startDate) { toast.error('Start date is required'); return; }
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1800));
    setPublishing(false);
    const ne: Exam = {
      id: Date.now(), title: examForm.title, examType: examForm.examType,
      className: examForm.className, subjects: examForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
      startDate: examForm.startDate, endDate: examForm.endDate || examForm.startDate,
      venue: examForm.venue, totalStudents: 120, duration: examForm.duration,
      maxMarks: examForm.maxMarks, passMarks: examForm.passMarks, status: 'upcoming',
      alertsSent: examForm.channel === 'all' ? 360 : 120, channel: examForm.channel,
      isImportant: examForm.isImportant, tags: examForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      invigilator: examForm.invigilator, reminderDays: examForm.reminderDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)),
      hallTicketReady: false,
    };
    setExams(prev => [ne, ...prev]);
    setSelectedExam(ne);
    setAlertLogs(prev => [{
      id: Date.now(), examId: ne.id, title: ne.title, type: 'schedule_announce',
      channel: ne.channel, recipient: `${ne.className} (students & parents)`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `📋 ${ne.title} announced! Dates: ${ne.startDate} – ${ne.endDate}. Venue: ${ne.venue}. Check portal for details.`,
      className: ne.className,
    }, ...prev]);
    toast.success(`✅ Exam announced & alerts sent via ${CHANNEL_CFG[ne.channel].label}!`);
    setExamForm(emptyExamForm());
    setShowExamForm(false);
  };

  const sendExamReminder = async (exam: Exam) => {
    setSendingReminder(exam.id);
    await new Promise(r => setTimeout(r, 1500));
    setSendingReminder(null);
    setAlertLogs(prev => [{
      id: Date.now(), examId: exam.id, title: exam.title, type: 'exam_reminder',
      channel: exam.channel, recipient: `${exam.className} (${exam.totalStudents} students)`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `📚 Reminder: ${exam.title} is on ${exam.startDate}. Venue: ${exam.venue}. All the best!`,
      className: exam.className,
    }, ...prev]);
    toast.success(`📲 Exam reminder sent to ${exam.totalStudents} students & parents!`);
  };

  const publishResult = async (result: Result) => {
    setPublishingResult(result.id);
    await new Promise(r => setTimeout(r, 2000));
    setPublishingResult(null);
    setResults(prev => prev.map(r => r.id === result.id
      ? { ...r, status: 'published', publishedAt: new Date().toLocaleString(), alertsSent: r.totalStudents * 3 }
      : r));
    setAlertLogs(prev => [{
      id: Date.now(), resultId: result.id, title: result.examTitle, type: 'result_published',
      channel: result.channel, recipient: `${result.className} (students & parents)`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `🏆 ${result.subject} results for ${result.className} are out! Check your scorecard on the portal.`,
      className: result.className,
    }, ...prev]);
    toast.success(`🏆 Result published & notifications sent!`);
  };

  const toggleRule = (id: number) => {
    const rule = alertRules.find(r => r.id === id);
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    toast.success(`Rule "${rule?.name}" ${rule?.isEnabled ? 'disabled' : 'enabled'}`);
  };

  const markHallTicketReady = (examId: number) => {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, hallTicketReady: true } : e));
    const exam = exams.find(e => e.id === examId);
    setAlertLogs(prev => [{
      id: Date.now(), examId, title: exam?.title || '', type: 'hall_ticket',
      channel: exam?.channel || 'all', recipient: `${exam?.className} (students & parents)`,
      recipientType: 'both', status: 'sent',
      sentAt: new Date().toLocaleString('en-IN', { hour12: false }).replace(',', ''),
      message: `🎫 Hall ticket for ${exam?.title} is ready! Download from student portal immediately.`,
      className: exam?.className || '',
    }, ...prev]);
    toast.success('🎫 Hall ticket marked ready & notification sent!');
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Exam Dates & Results Announcer</h1>
            <p className="text-[9px] text-violet-200 font-medium">Schedule · Reminders · Hall Ticket · Result publish · Toppers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{totalAlertsSent.toLocaleString()} alerts sent</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <GraduationCap className="w-3 h-3 text-violet-300" />
            <span className="text-[9px] font-bold">{exams.length} exams</span>
          </div>
          <button
            onClick={() => { setGlobalEnabled(!globalEnabled); toast.success(globalEnabled ? 'Exam alerts paused' : 'Exam alerts resumed'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalEnabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200 hover:bg-red-500/30'}`}>
            {globalEnabled ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
          <button
            onClick={() => { setShowExamForm(true); setActiveTab('exams'); }}
            className="flex items-center gap-1.5 bg-white text-violet-700 hover:bg-violet-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Schedule Exam
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-violet-50 border-b border-violet-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Upcoming', val: upcoming, icon: <Calendar className="w-3 h-3" />, color: 'text-blue-600' },
          { label: 'Ongoing', val: ongoing, icon: <Activity className="w-3 h-3" />, color: 'text-emerald-600' },
          { label: 'Results Published', val: publishedResults, icon: <Award className="w-3 h-3" />, color: 'text-violet-600' },
          { label: '7d Alerts', val: totalSent7d, icon: <Bell className="w-3 h-3" />, color: 'text-indigo-600' },
          { label: '7d Open Rate', val: `${openRate}%`, icon: <Eye className="w-3 h-3" />, color: 'text-teal-600' },
          { label: 'Active Rules', val: alertRules.filter(r => r.isEnabled).length, icon: <Settings className="w-3 h-3" />, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-white border border-violet-200 px-3 py-1.5 rounded-full whitespace-nowrap">
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'exams',     label: 'Exam Schedule',  icon: <ClipboardList className="w-3.5 h-3.5" />, badge: ongoing },
          { key: 'results',   label: 'Results',        icon: <Award className="w-3.5 h-3.5" />, badge: results.filter(r => r.status === 'pending').length },
          { key: 'alerts',    label: 'Alert Logs',     icon: <Bell className="w-3.5 h-3.5" />, badge: alertLogs.filter(l => l.status === 'failed').length },
          { key: 'rules',     label: 'Alert Rules',    icon: <Settings className="w-3.5 h-3.5" /> },
          { key: 'analytics', label: 'Analytics',      icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ EXAM SCHEDULE ═════════ */}
        {activeTab === 'exams' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>
            {/* Compose Panel */}
            {showExamForm && (
              <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto bg-violet-50/30">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                  <h3 className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 text-violet-600" /> Schedule New Exam</h3>
                  <button onClick={() => setShowExamForm(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exam Title <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Mid-Term Exam 2026" value={examForm.title}
                      onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exam Type</label>
                      <select value={examForm.examType} onChange={e => setExamForm(p => ({ ...p, examType: e.target.value as ExamType }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                        {Object.entries(EXAM_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class / Group</label>
                      <input type="text" placeholder="e.g. Class 10 (A,B,C)" value={examForm.className}
                        onChange={e => setExamForm(p => ({ ...p, className: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subjects (comma-separated)</label>
                    <input type="text" placeholder="e.g. Maths, Science, English" value={examForm.subjects}
                      onChange={e => setExamForm(p => ({ ...p, subjects: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date <span className="text-red-500">*</span></label>
                      <input type="date" value={examForm.startDate} onChange={e => setExamForm(p => ({ ...p, startDate: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                      <input type="date" value={examForm.endDate} onChange={e => setExamForm(p => ({ ...p, endDate: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Venue</label>
                    <input type="text" placeholder="e.g. School Examination Hall" value={examForm.venue}
                      onChange={e => setExamForm(p => ({ ...p, venue: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                      <input type="text" placeholder="e.g. 3 hrs" value={examForm.duration}
                        onChange={e => setExamForm(p => ({ ...p, duration: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Marks</label>
                      <input type="number" min={1} value={examForm.maxMarks}
                        onChange={e => setExamForm(p => ({ ...p, maxMarks: +e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pass Marks</label>
                      <input type="number" min={1} value={examForm.passMarks}
                        onChange={e => setExamForm(p => ({ ...p, passMarks: +e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alert Channel</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(CHANNEL_CFG) as [NotifChannel, typeof CHANNEL_CFG[NotifChannel]][]).map(([k, v]) => (
                        <button key={k} onClick={() => setExamForm(p => ({ ...p, channel: k }))}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold transition cursor-pointer ${examForm.channel === k ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300'}`}>
                          {v.icon} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reminder Days (before exam)</label>
                    <input type="text" placeholder="e.g. 7,3,1" value={examForm.reminderDays}
                      onChange={e => setExamForm(p => ({ ...p, reminderDays: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invigilator</label>
                    <input type="text" placeholder="e.g. Mr. Kumar" value={examForm.invigilator}
                      onChange={e => setExamForm(p => ({ ...p, invigilator: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags</label>
                    <input type="text" placeholder="e.g. midterm, board-prep" value={examForm.tags}
                      onChange={e => setExamForm(p => ({ ...p, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={examForm.isImportant} onChange={e => setExamForm(p => ({ ...p, isImportant: e.target.checked }))} className="rounded" />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><Flag className="w-3 h-3 text-red-500" /> Mark as Important</span>
                  </label>
                  <button onClick={handlePublishExam} disabled={publishing}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60">
                    {publishing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Announcing…</> : <><Send className="w-3.5 h-3.5" /> Announce & Alert</>}
                  </button>
                </div>
              </div>
            )}

            {/* Exam List */}
            <div className={`${showExamForm ? 'flex-1' : 'w-80 flex-shrink-0'} border-r border-slate-200 overflow-y-auto flex flex-col`}>
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 space-y-2 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search exams…" value={searchExams}
                      onChange={e => setSearchExams(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-300" />
                  </div>
                  <button onClick={() => setShowExamForm(!showExamForm)} className="p-1.5 bg-violet-100 hover:bg-violet-200 text-violet-600 rounded-lg cursor-pointer transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(['all', 'upcoming', 'ongoing', 'completed', 'postponed'] as const).map(s => (
                    <button key={s} onClick={() => setFilterExamStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border transition cursor-pointer capitalize ${filterExamStatus === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300'}`}>
                      {s === 'all' ? 'All' : EXAM_STATUS_CFG[s]?.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 divide-y divide-slate-100">
                {filteredExams.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <GraduationCap className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[10px] font-medium">No exams found</p>
                  </div>
                )}
                {filteredExams.map(exam => {
                  const et = EXAM_TYPE_CFG[exam.examType];
                  const es = EXAM_STATUS_CFG[exam.status];
                  const isSelected = selectedExam?.id === exam.id;
                  return (
                    <div key={exam.id} onClick={() => setSelectedExam(exam)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-violet-50/50 transition ${isSelected ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${et.bg}`}>{et.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            {exam.isImportant && <Flag className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
                            <p className="text-[10px] font-bold text-slate-800 truncate">{exam.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${et.bg} ${et.color}`}>{et.label}</span>
                            <span className="text-[8px] font-medium text-slate-400">{exam.className}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${es.bg} ${es.color}`}>
                              <span className={`w-1 h-1 rounded-full ${es.dot}`} /> {es.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {exam.startDate}</span>
                            <div className="flex items-center gap-1.5">
                              {exam.hallTicketReady && <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">🎫 HT</span>}
                              <span className="text-[8px] font-bold text-violet-600">{exam.alertsSent} alerts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exam Detail */}
            {!showExamForm && (
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedExam ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <GraduationCap className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[11px] font-medium">Select an exam to view details</p>
                  </div>
                ) : (() => {
                  const e = selectedExam;
                  const et = EXAM_TYPE_CFG[e.examType];
                  const es = EXAM_STATUS_CFG[e.status];
                  return (
                    <div className="space-y-4 max-w-2xl">
                      {/* Header Card */}
                      <div className={`rounded-2xl p-4 ${et.bg}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <span className="text-4xl">{et.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {e.isImportant && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-0.5"><Flag className="w-2.5 h-2.5" /> Important</span>}
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${es.bg} ${es.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${es.dot} inline-block`} /> {es.label}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${et.bg} ${et.color}`}>{et.label}</span>
                              </div>
                              <h2 className="text-[13px] font-extrabold text-slate-800">{e.title}</h2>
                              <p className="text-[9px] text-slate-600 font-medium mt-0.5">{e.className} · {e.totalStudents} students · Max: {e.maxMarks} marks · Pass: {e.passMarks}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => sendExamReminder(e)} disabled={sendingReminder === e.id}
                              className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-violet-50 border border-violet-200 text-violet-600 rounded-xl cursor-pointer transition disabled:opacity-60">
                              {sendingReminder === e.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                              Send Reminder
                            </button>
                            {!e.hallTicketReady && (
                              <button onClick={() => markHallTicketReady(e.id)}
                                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 rounded-xl cursor-pointer transition">
                                <Award className="w-3 h-3" /> Mark Hall Ticket Ready
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick info row */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Start Date', val: e.startDate, icon: <Calendar className="w-3 h-3" /> },
                            { label: 'End Date', val: e.endDate, icon: <Calendar className="w-3 h-3" /> },
                            { label: 'Duration', val: e.duration, icon: <Clock className="w-3 h-3" /> },
                            { label: 'Venue', val: e.venue, icon: <Target className="w-3 h-3" /> },
                          ].map((item, i) => (
                            <div key={i} className="bg-white/70 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-1 mb-0.5 text-slate-500">{item.icon}<span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span></div>
                              <p className="text-[9px] font-bold text-slate-700">{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Students', val: e.totalStudents, icon: <Users className="w-3.5 h-3.5" />, color: 'text-slate-600' },
                          { label: 'Alerts Sent', val: e.alertsSent, icon: <Bell className="w-3.5 h-3.5" />, color: 'text-violet-600' },
                          { label: 'Hall Ticket', val: e.hallTicketReady ? 'Ready' : 'Not Ready', icon: <Award className="w-3.5 h-3.5" />, color: e.hallTicketReady ? 'text-emerald-600' : 'text-amber-600' },
                          { label: 'Reminders', val: e.reminderDays.join('d, ') + 'd', icon: <AlarmClock className="w-3.5 h-3.5" />, color: 'text-indigo-600' },
                        ].map((s, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                            <p className={`text-[12px] font-extrabold ${s.color}`}>{s.val}</p>
                            <p className="text-[8px] text-slate-400 font-medium">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Subjects */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-violet-600" /> Subjects</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {e.subjects.map((s, i) => (
                            <span key={i} className="text-[9px] font-bold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Tags & Invigilator */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <h4 className="text-[9px] font-extrabold text-slate-600 mb-2 flex items-center gap-1"><Users className="w-3 h-3 text-violet-600" /> Invigilator</h4>
                          <p className="text-[10px] font-bold text-slate-700">{e.invigilator || '—'}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <h4 className="text-[9px] font-extrabold text-slate-600 mb-2 flex items-center gap-1"><Tag className="w-3 h-3 text-violet-600" /> Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {e.tags.map((tag, i) => <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">#{tag}</span>)}
                          </div>
                        </div>
                      </div>

                      {/* Recent Alerts */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <h3 className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-violet-600" /> Alert History</h3>
                        {alertLogs.filter(l => l.examId === e.id).length === 0
                          ? <p className="text-[9px] text-slate-400 py-2 text-center">No alerts sent yet</p>
                          : alertLogs.filter(l => l.examId === e.id).slice(0, 4).map(log => {
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
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═════════ RESULTS ═════════ */}
        {activeTab === 'results' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>
            {/* Result List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10">
                <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">All Results</p>
                <div className="flex gap-1.5">
                  {(['all', 'pending', 'published', 'withheld'] as const).map(s => (
                    <button key={s} onClick={() => {}}
                      className="flex-shrink-0 text-[8px] font-bold px-2 py-1 rounded-full border bg-white text-slate-500 border-slate-200 hover:border-violet-300 transition cursor-pointer capitalize">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 divide-y divide-slate-100">
                {results.map(result => {
                  const rs = RESULT_STATUS_CFG[result.status];
                  const et = EXAM_TYPE_CFG[result.examType];
                  const isSelected = selectedResult?.id === result.id;
                  const passRate = result.appeared > 0 ? Math.round((result.passed / result.appeared) * 100) : 0;
                  return (
                    <div key={result.id} onClick={() => setSelectedResult(result)}
                      className={`px-3 py-2.5 cursor-pointer hover:bg-violet-50/50 transition ${isSelected ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${et.bg}`}>{et.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">{result.examTitle}</p>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[8px] font-medium text-slate-400">{result.className}</span>
                            <span className="text-[8px] font-bold text-slate-500">·</span>
                            <span className="text-[8px] font-medium text-slate-500">{result.subject}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rs.bg} ${rs.color}`}>{rs.label}</span>
                            {result.status === 'published' && (
                              <span className="text-[8px] font-bold text-emerald-600">{passRate}% pass rate</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result Detail */}
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedResult ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Award className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-[11px] font-medium">Select a result to view details</p>
                </div>
              ) : (() => {
                const r = selectedResult;
                const rs = RESULT_STATUS_CFG[r.status];
                const et = EXAM_TYPE_CFG[r.examType];
                const passRate = r.appeared > 0 ? Math.round((r.passed / r.appeared) * 100) : 0;
                const avgPct = r.maxMarks > 0 ? Math.round((r.avgMarks / r.maxMarks) * 100) : 0;
                return (
                  <div className="space-y-4 max-w-2xl">
                    {/* Header */}
                    <div className={`rounded-2xl p-4 ${et.bg}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{et.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rs.bg} ${rs.color}`}>{rs.label}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${et.bg} ${et.color}`}>{et.label}</span>
                            </div>
                            <h2 className="text-[13px] font-extrabold text-slate-800">{r.examTitle}</h2>
                            <p className="text-[9px] text-slate-600 font-medium mt-0.5">{r.className} · {r.subject} · Max: {r.maxMarks} marks</p>
                            {r.publishedAt && <p className="text-[8px] text-slate-500 mt-0.5">Published: {r.publishedAt}</p>}
                          </div>
                        </div>
                        {r.status === 'pending' && (
                          <button onClick={() => publishResult(r)} disabled={publishingResult === r.id}
                            className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition disabled:opacity-60">
                            {publishingResult === r.id ? <><RefreshCw className="w-3 h-3 animate-spin" /> Publishing…</> : <><Send className="w-3 h-3" /> Publish & Notify</>}
                          </button>
                        )}
                      </div>
                    </div>

                    {r.status === 'published' && (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Appeared', val: r.appeared, icon: <Users className="w-3.5 h-3.5" />, color: 'text-slate-600' },
                            { label: 'Passed', val: `${r.passed} (${passRate}%)`, icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
                            { label: 'Avg Marks', val: `${r.avgMarks}/${r.maxMarks}`, icon: <BarChart2 className="w-3.5 h-3.5" />, color: 'text-blue-600' },
                            { label: 'Highest', val: `${r.highestMarks}/${r.maxMarks}`, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-violet-600' },
                          ].map((s, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                              <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                              <p className={`text-[12px] font-extrabold ${s.color}`}>{s.val}</p>
                              <p className="text-[8px] text-slate-400 font-medium">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Pass Rate Bar */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-violet-600" /> Performance Snapshot</h3>
                          <div className="space-y-2.5">
                            {[
                              { label: 'Pass Rate', val: r.passed, max: r.appeared, color: 'bg-emerald-500', pct: passRate },
                              { label: 'Avg Score', val: r.avgMarks, max: r.maxMarks, color: 'bg-blue-500', pct: avgPct },
                              { label: 'Highest Score', val: r.highestMarks, max: r.maxMarks, color: 'bg-violet-500', pct: Math.round((r.highestMarks / r.maxMarks) * 100) },
                            ].map((p, i) => (
                              <div key={i}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-[9px] font-bold text-slate-600">{p.label}</span>
                                  <span className="text-[9px] font-bold text-slate-600">{p.pct}%</span>
                                </div>
                                <MiniBar value={p.val} max={p.max} color={p.color} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Grade Distribution */}
                        {Object.keys(r.gradeDistribution).length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-violet-600" /> Grade Distribution</h3>
                            <div className="flex items-end gap-2 h-16 mb-2">
                              {Object.entries(r.gradeDistribution).map(([grade, count]) => {
                                const maxCount = Math.max(...Object.values(r.gradeDistribution), 1);
                                const pct = Math.max(8, (count / maxCount) * 100);
                                return (
                                  <div key={grade} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div className={`w-full ${GRADE_COLORS[grade] || 'bg-slate-400'} rounded-sm opacity-80 hover:opacity-100 transition`} style={{ height: `${pct}%` }} />
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">{count} students</div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-around">
                              {Object.entries(r.gradeDistribution).map(([grade, count]) => (
                                <div key={grade} className="text-center">
                                  <p className="text-[8px] font-extrabold text-slate-700">{grade}</p>
                                  <p className="text-[7px] text-slate-400">{count}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Toppers */}
                        {r.toppers.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-yellow-500" /> Class Toppers</h3>
                            <div className="space-y-2">
                              {r.toppers.map((t, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-slate-50 border border-slate-200' : 'bg-orange-50 border border-orange-200'}`}>
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : 'bg-orange-400 text-white'}`}>
                                    {i + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-800">{t.name}</p>
                                    <p className="text-[8px] text-slate-500">Roll: {t.roll}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-[13px] font-extrabold ${i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-600' : 'text-orange-600'}`}>{t.marks}</p>
                                    <p className="text-[8px] text-slate-400">/{r.maxMarks}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => toast.success('🏅 Topper announcement sent to all students & parents!')}
                              className="w-full mt-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-[9px] font-extrabold rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5">
                              <Bell className="w-3 h-3" /> Send Topper Announcement
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {r.status === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                        <AlarmClock className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-amber-700">Result Not Yet Published</p>
                        <p className="text-[9px] text-amber-500 mt-1">Upload marks and click "Publish & Notify" to release results and auto-notify all students & parents.</p>
                      </div>
                    )}

                    {r.status === 'withheld' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-red-700">Result Withheld</p>
                        <p className="text-[9px] text-red-500 mt-1">Result is currently withheld. Students have been notified. Contact the exam committee for resolution.</p>
                      </div>
                    )}
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
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <select value={filterLogType} onChange={e => setFilterLogType(e.target.value as AlertType | 'all')}
                className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                <option value="all">All Types</option>
                {Object.entries(ALERT_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
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
                    {['Title', 'Alert Type', 'Channel', 'Recipient', 'Status', 'Sent At'].map(h => (
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
                            <p className="text-[10px] font-bold text-slate-800">{log.title}</p>
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

        {/* ═════════ ALERT RULES ═════════ */}
        {activeTab === 'rules' && (
          <div className="p-4 space-y-3 max-w-3xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600" />
                <h2 className="text-[11px] font-extrabold text-slate-700">Automated Exam & Result Alert Rules</h2>
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
                <div key={rule.id} className={`bg-white border-2 rounded-xl overflow-hidden transition ${rule.isEnabled ? 'border-violet-200' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${rule.isEnabled ? 'bg-violet-50' : 'bg-slate-50'}`}>
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
                        {rule.isEnabled ? <ToggleRight className="w-7 h-7 text-violet-500" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
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
                        <p className="text-[8px] text-slate-400 mt-1">Variables: {'{examTitle}'}, {'{date}'}, {'{venue}'}, {'{subject}'}, {'{avg}'}, {'{topper}'}, {'{days}'}</p>
                      </div>
                      {rule.reminderOffsets.length > 0 && (
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reminder Offsets</label>
                          <div className="flex gap-2">
                            {rule.reminderOffsets.map((d, i) => (
                              <span key={i} className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full">
                                <AlarmClock className="w-2.5 h-2.5" /> {d} day{d !== 1 ? 's' : ''} before
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => toast.success(`Testing rule: ${rule.name}`)}
                          className="flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl cursor-pointer transition">
                          <Zap className="w-3 h-3" /> Test Rule
                        </button>
                        <button onClick={() => toast.success('Rule changes saved')}
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
                { label: 'Alerts Sent (7d)', val: totalSent7d, sub: 'Total dispatched', icon: <Send className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
                { label: 'Delivered (7d)', val: totalDelivered7d, sub: `${((totalDelivered7d / totalSent7d) * 100).toFixed(1)}% delivery rate`, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
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

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-violet-600" /> 7-Day Alert Volume</h3>
                <p className="text-[8px] text-slate-400 mb-3">Total alerts sent per day</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="sent" color="bg-violet-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Opens</h3>
                <p className="text-[8px] text-slate-400 mb-3">Alerts opened by recipients</p>
                <AnalyticsBar data={ANALYTICS_DATA} field="opened" color="bg-emerald-500" />
                <div className="flex justify-between mt-1">
                  {ANALYTICS_DATA.map((d, i) => <span key={i} className="text-[7px] text-slate-400 flex-1 text-center">{d.date.split(' ')[1]}</span>)}
                </div>
              </div>
            </div>

            {/* Alert Type Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-violet-600" /> Alert Type Breakdown</h3>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(ALERT_TYPE_CFG) as AlertType[]).map(type => {
                  const at = ALERT_TYPE_CFG[type];
                  const count = alertLogs.filter(l => l.type === type).length;
                  const total = alertLogs.length || 1;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-base flex-shrink-0">{at.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] font-bold text-slate-700 truncate">{at.label}</span>
                          <span className="text-[9px] font-bold text-slate-500">{count}</span>
                        </div>
                        <MiniBar value={count} max={total} color="bg-violet-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exam Summary Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-extrabold text-slate-700 mb-3 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-violet-600" /> Exam-wise Alert Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Exam', 'Type', 'Status', 'Students', 'Alerts Sent', 'Channel'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {exams.map(exam => {
                      const et = EXAM_TYPE_CFG[exam.examType];
                      const es = EXAM_STATUS_CFG[exam.status];
                      const ch = CHANNEL_CFG[exam.channel];
                      return (
                        <tr key={exam.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span>{et.emoji}</span>
                              <p className="text-[9px] font-bold text-slate-800 truncate max-w-[140px]">{exam.title}</p>
                            </div>
                            <p className="text-[8px] text-slate-400 ml-5">{exam.className}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${et.bg} ${et.color}`}>{et.label}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${es.bg} ${es.color}`}>{es.label}</span>
                          </td>
                          <td className="px-3 py-2 text-[9px] font-medium text-slate-600">{exam.totalStudents}</td>
                          <td className="px-3 py-2 text-[9px] font-bold text-violet-600">{exam.alertsSent.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${ch.bg} ${ch.color}`}>
                              {ch.icon} {ch.label}
                            </span>
                          </td>
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

export default ExamResultAnnouncer;
