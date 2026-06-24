import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Calendar, MessageSquare, TrendingUp, Bell, Plus, Search,
  X, Check, Clock, ChevronRight, Phone, Video, Mail, Edit3,
  Trash2, Eye, Download, Upload, Star, AlertCircle, CheckCircle,
  BookOpen, Award, BarChart2, FileText, Paperclip, Send, Filter,
  UserCheck, Home, GraduationCap, Briefcase, ArrowRight, Pin,
  RefreshCw, Share2, ChevronDown, Info, Flag, Activity, Zap,
  ThumbsUp, Heart, Hash, Settings, Archive, MoreVertical,
  User, CalendarCheck, ClipboardList, XCircle, ChevronUp,
  BookMarked, Radio, Target, ShieldCheck, Smile
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'meetings' | 'progress' | 'messages' | 'requests' | 'reports';
type MeetingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
type MeetingMode = 'in-person' | 'online' | 'phone';
type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type MessageStatus = 'sent' | 'delivered' | 'read';
type ProgressTrend = 'up' | 'down' | 'stable';
type AttendanceStatus = 'present' | 'absent' | 'late';

interface Parent {
  id: number; name: string; avatar: string; phone: string; email: string;
  relation: 'Father' | 'Mother' | 'Guardian'; isOnline: boolean; lastSeen?: string;
}

interface Student {
  id: number; name: string; avatar: string; class: string; section: string;
  rollNo: string; parentId: number;
  attendance: number; gpa: number; behavior: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
}

interface Meeting {
  id: number; parentId: number; teacherId: number; studentId: number;
  title: string; purpose: string; date: string; time: string;
  duration: number; mode: MeetingMode; status: MeetingStatus;
  venue?: string; meetLink?: string; notes?: string;
  requestedBy: 'parent' | 'teacher'; createdAt: string;
  agenda: string[]; followUpRequired: boolean; followUpNote?: string;
}

interface ProgressReport {
  id: number; studentId: number; parentId: number; teacherId: number;
  subject: string; marks: number; totalMarks: number; grade: string;
  trend: ProgressTrend; remarks: string; examType: string;
  date: string; isShared: boolean; strengths: string[]; improvements: string[];
}

interface Message {
  id: number; fromId: number; toId: number; fromName: string; fromAvatar: string;
  text: string; time: string; timestamp: number; status: MessageStatus;
  isMe: boolean; attachmentName?: string;
}

interface MeetingRequest {
  id: number; parentId: number; parentName: string; parentAvatar: string;
  studentId: number; studentName: string; studentClass: string;
  reason: string; preferredDate: string; preferredTime: string;
  mode: MeetingMode; status: RequestStatus; urgency: 'low' | 'medium' | 'high';
  createdAt: string; teacherNote?: string;
}

interface Notification {
  id: number; type: 'meeting' | 'progress' | 'message' | 'request' | 'reminder';
  title: string; body: string; time: string; isRead: boolean; relatedId?: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PARENTS: Parent[] = [
  { id: 1, name: 'Rajesh Kumar', avatar: 'RK', phone: '+91 98765 43210', email: 'rajesh@email.com', relation: 'Father', isOnline: true },
  { id: 2, name: 'Sunita Patel', avatar: 'SP', phone: '+91 94321 87654', email: 'sunita@email.com', relation: 'Mother', isOnline: false, lastSeen: '2 hours ago' },
  { id: 3, name: 'Mohan Sharma', avatar: 'MS', phone: '+91 99887 76655', email: 'mohan@email.com', relation: 'Father', isOnline: true },
  { id: 4, name: 'Priya Gupta', avatar: 'PG', phone: '+91 90011 22334', email: 'priya.g@email.com', relation: 'Mother', isOnline: false, lastSeen: 'Yesterday' },
  { id: 5, name: 'Vikash Singh', avatar: 'VS', phone: '+91 87654 32109', email: 'vikash@email.com', relation: 'Father', isOnline: false, lastSeen: '3 days ago' },
];

const STUDENTS: Student[] = [
  { id: 1, name: 'Aryan Kumar', avatar: 'AK', class: '10', section: 'A', rollNo: '101', parentId: 1, attendance: 92, gpa: 8.4, behavior: 'Good' },
  { id: 2, name: 'Priya Patel', avatar: 'PP', class: '10', section: 'B', rollNo: '215', parentId: 2, attendance: 78, gpa: 6.2, behavior: 'Average' },
  { id: 3, name: 'Rahul Sharma', avatar: 'RS', class: '12', section: 'A', rollNo: '001', parentId: 3, attendance: 96, gpa: 9.1, behavior: 'Excellent' },
  { id: 4, name: 'Kavya Gupta', avatar: 'KG', class: '8', section: 'C', rollNo: '342', parentId: 4, attendance: 85, gpa: 7.5, behavior: 'Good' },
  { id: 5, name: 'Rohan Singh', avatar: 'RoS', class: '6', section: 'A', rollNo: '402', parentId: 5, attendance: 65, gpa: 5.1, behavior: 'Needs Improvement' },
];

const INITIAL_MEETINGS: Meeting[] = [
  { id: 1, parentId: 1, teacherId: 0, studentId: 1, title: 'Mid-Term Performance Review', purpose: 'Discuss Aryan\'s mid-term exam performance and areas of improvement in Maths', date: '2026-06-25', time: '10:00 AM', duration: 30, mode: 'in-person', status: 'confirmed', venue: 'Room 204', requestedBy: 'teacher', createdAt: '2026-06-20', agenda: ['Review exam results', 'Discuss study plan', 'Address concerns'], followUpRequired: true, followUpNote: 'Share practice worksheets', notes: 'Parent is very cooperative and engaged.' },
  { id: 2, parentId: 2, teacherId: 0, studentId: 2, title: 'Attendance & Behaviour Concern', purpose: 'Priya\'s attendance has dropped below 80% and there are concerns about class participation', date: '2026-06-26', time: '11:30 AM', duration: 45, mode: 'online', status: 'pending', meetLink: 'https://meet.school.edu/room123', requestedBy: 'teacher', createdAt: '2026-06-22', agenda: ['Discuss attendance issue', 'Understand home situation', 'Action plan'], followUpRequired: true },
  { id: 3, parentId: 3, teacherId: 0, studentId: 3, title: 'College Counselling Discussion', purpose: 'Discuss college application strategy and board exam preparation for Rahul', date: '2026-06-28', time: '2:00 PM', duration: 60, mode: 'in-person', status: 'confirmed', venue: 'Counselling Room', requestedBy: 'parent', createdAt: '2026-06-21', agenda: ['Target colleges', 'Entrance exam prep', 'Subject selection'], followUpRequired: false },
  { id: 4, parentId: 4, teacherId: 0, studentId: 4, title: 'Progress Update Meeting', purpose: 'Regular quarterly progress update for Kavya', date: '2026-06-20', time: '9:00 AM', duration: 30, mode: 'phone', status: 'completed', requestedBy: 'teacher', createdAt: '2026-06-15', agenda: ['Report card discussion', 'Extracurriculars'], followUpRequired: false, notes: 'Parent satisfied with progress. Asked to increase focus on Science.' },
  { id: 5, parentId: 5, teacherId: 0, studentId: 5, title: 'Urgent: Academic Intervention Required', purpose: 'Rohan is at risk of failing. Immediate parent meeting required.', date: '2026-06-24', time: '3:30 PM', duration: 60, mode: 'in-person', status: 'confirmed', venue: 'Principal Office', requestedBy: 'teacher', createdAt: '2026-06-23', agenda: ['Academic performance', 'Behavioural issues', 'Remedial plan', 'Parent support'], followUpRequired: true },
];

const INITIAL_REQUESTS: MeetingRequest[] = [
  { id: 1, parentId: 2, parentName: 'Sunita Patel', parentAvatar: 'SP', studentId: 2, studentName: 'Priya Patel', studentClass: '10-B', reason: 'I want to discuss about the sudden drop in marks. Priya was scoring well last term but this term she seems demotivated.', preferredDate: '2026-06-26', preferredTime: '10:00–11:00 AM', mode: 'online', status: 'pending', urgency: 'high', createdAt: '2026-06-23' },
  { id: 2, parentId: 4, parentName: 'Priya Gupta', parentAvatar: 'PG', studentId: 4, studentName: 'Kavya Gupta', studentClass: '8-C', reason: 'Kavya has started showing interest in arts and I wanted to discuss if she can be enrolled in the school art club.', preferredDate: '2026-06-27', preferredTime: '2:00–3:00 PM', mode: 'in-person', status: 'pending', urgency: 'low', createdAt: '2026-06-22' },
  { id: 3, parentId: 1, parentName: 'Rajesh Kumar', parentAvatar: 'RK', studentId: 1, studentName: 'Aryan Kumar', studentClass: '10-A', reason: 'Aryan wants to skip the school trip. I would like to know more details and discuss alternatives.', preferredDate: '2026-06-25', preferredTime: 'Any time', mode: 'phone', status: 'approved', urgency: 'medium', createdAt: '2026-06-21', teacherNote: 'Approved — called on 22nd June. Meeting confirmed at 10 AM.' },
  { id: 4, parentId: 3, parentName: 'Mohan Sharma', parentAvatar: 'MS', studentId: 3, studentName: 'Rahul Sharma', studentClass: '12-A', reason: 'Want to know which engineering stream to choose based on Rahul\'s aptitude.', preferredDate: '2026-06-28', preferredTime: '2:00–3:00 PM', mode: 'in-person', status: 'completed', urgency: 'medium', createdAt: '2026-06-20', teacherNote: 'Meeting done on 28th. Advised to choose CS. Provided college list.' },
];

const INITIAL_PROGRESS: ProgressReport[] = [
  { id: 1, studentId: 1, parentId: 1, teacherId: 0, subject: 'Mathematics', marks: 78, totalMarks: 100, grade: 'B+', trend: 'up', remarks: 'Good improvement from last test. Needs work on calculus.', examType: 'Mid-Term', date: '2026-06-15', isShared: true, strengths: ['Algebra', 'Trigonometry'], improvements: ['Calculus', 'Coordinate Geometry'] },
  { id: 2, studentId: 1, parentId: 1, teacherId: 0, subject: 'Physics', marks: 85, totalMarks: 100, grade: 'A', trend: 'stable', remarks: 'Excellent in theory. Practical work needs attention.', examType: 'Mid-Term', date: '2026-06-15', isShared: true, strengths: ['Mechanics', 'Electrostatics'], improvements: ['Optics Lab work'] },
  { id: 3, studentId: 2, parentId: 2, teacherId: 0, subject: 'Mathematics', marks: 45, totalMarks: 100, grade: 'D', trend: 'down', remarks: 'Significant drop from last term. Extra coaching recommended.', examType: 'Mid-Term', date: '2026-06-15', isShared: false, strengths: ['Basic Arithmetic'], improvements: ['Algebra', 'Geometry', 'Statistics'] },
  { id: 4, studentId: 3, parentId: 3, teacherId: 0, subject: 'Chemistry', marks: 93, totalMarks: 100, grade: 'A+', trend: 'up', remarks: 'Outstanding performance. Scholarship worthy.', examType: 'Mid-Term', date: '2026-06-15', isShared: true, strengths: ['Organic Chemistry', 'Reactions'], improvements: ['Inorganic equations'] },
];

const INIT_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, fromId: 1, toId: 0, fromName: 'Rajesh Kumar', fromAvatar: 'RK', text: 'Good evening sir. I wanted to check on Aryan\'s recent test performance.', time: '5:30 PM', timestamp: Date.now() - 3600000, status: 'read', isMe: false },
    { id: 2, fromId: 0, toId: 1, fromName: 'You', fromAvatar: 'ME', text: 'Good evening Mr. Rajesh. Aryan scored 78 in Maths this time, which is an improvement. Well done to him!', time: '5:35 PM', timestamp: Date.now() - 3300000, status: 'read', isMe: true },
    { id: 3, fromId: 1, toId: 0, fromName: 'Rajesh Kumar', fromAvatar: 'RK', text: 'That\'s great to hear! Is there any specific area where he still needs to focus?', time: '5:40 PM', timestamp: Date.now() - 3000000, status: 'read', isMe: false },
    { id: 4, fromId: 0, toId: 1, fromName: 'You', fromAvatar: 'ME', text: 'Yes, Calculus needs more attention. I\'ve attached some practice papers.', time: '5:42 PM', timestamp: Date.now() - 2800000, status: 'read', isMe: true, attachmentName: 'Calculus_Practice.pdf' },
    { id: 5, fromId: 1, toId: 0, fromName: 'Rajesh Kumar', fromAvatar: 'RK', text: 'Thank you so much sir! Will ensure he practices daily. 🙏', time: '5:45 PM', timestamp: Date.now() - 2600000, status: 'read', isMe: false },
  ],
  2: [
    { id: 1, fromId: 2, toId: 0, fromName: 'Sunita Patel', fromAvatar: 'SP', text: 'Sir, Priya said she got 45 in maths. I am very worried. What happened?', time: '8:00 AM', timestamp: Date.now() - 86400000, status: 'read', isMe: false },
    { id: 2, fromId: 0, toId: 2, fromName: 'You', fromAvatar: 'ME', text: 'Hello Sunita ji. Yes, Priya\'s maths performance needs attention. I would like to schedule a meeting.', time: '9:30 AM', timestamp: Date.now() - 79200000, status: 'read', isMe: true },
  ],
};

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'request', title: 'New Meeting Request', body: 'Sunita Patel has requested a meeting regarding Priya\'s performance.', time: '2 hours ago', isRead: false, relatedId: 1 },
  { id: 2, type: 'meeting', title: 'Meeting Reminder', body: 'Meeting with Vikash Singh (Rohan\'s father) is tomorrow at 3:30 PM.', time: '4 hours ago', isRead: false, relatedId: 5 },
  { id: 3, type: 'progress', title: 'Report Shared', body: 'Aryan Kumar\'s mid-term report has been shared with parents.', time: 'Yesterday', isRead: true, relatedId: 1 },
  { id: 4, type: 'message', title: 'New Message', body: 'Rajesh Kumar sent a message about Aryan\'s study schedule.', time: '2 days ago', isRead: true, relatedId: 1 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<MeetingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
};

const REQ_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const URGENCY_COLORS = { low: 'text-slate-500 bg-slate-100', medium: 'text-amber-600 bg-amber-100', high: 'text-red-600 bg-red-100' };

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-100', 'A': 'text-emerald-600 bg-emerald-50',
  'B+': 'text-blue-700 bg-blue-100', 'B': 'text-blue-600 bg-blue-50',
  'C+': 'text-amber-700 bg-amber-100', 'C': 'text-amber-600 bg-amberse-50',
  'D': 'text-red-600 bg-red-100', 'F': 'text-red-700 bg-red-200',
};

const BEHAVIOR_COLORS = {
  'Excellent': 'text-emerald-700 bg-emerald-100',
  'Good': 'text-blue-700 bg-blue-100',
  'Average': 'text-amber-700 bg-amber-100',
  'Needs Improvement': 'text-red-600 bg-red-100',
};

const TREND_ICON = (t: ProgressTrend) =>
  t === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> :
  t === 'down' ? <TrendingUp className="w-3 h-3 text-red-500 rotate-180" /> :
  <Activity className="w-3 h-3 text-slate-400" />;

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Avatar
const Av: React.FC<{ text: string; size?: 'xs'|'sm'|'md'|'lg'; color?: string; online?: boolean }> = ({ text, size='md', color='bg-indigo-600', online }) => {
  const sz = { xs:'w-5 h-5 text-[7px]', sm:'w-7 h-7 text-[9px]', md:'w-9 h-9 text-[10px]', lg:'w-11 h-11 text-xs' }[size];
  const dot = { xs:'w-1.5 h-1.5', sm:'w-2 h-2', md:'w-2.5 h-2.5', lg:'w-3 h-3' }[size];
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} ${color} text-white font-bold rounded-full flex items-center justify-center`}>{text.slice(0,2)}</div>
      {online !== undefined && <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const ParentTeacherHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [requests, setRequests] = useState<MeetingRequest[]>(INITIAL_REQUESTS);
  const [progress, setProgress] = useState<ProgressReport[]>(INITIAL_PROGRESS);
  const [messages, setMessages] = useState<Record<number, Message[]>>(INIT_MESSAGES);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(1);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(1);
  const [msgText, setMsgText] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | 'all'>('all');
  const [meetingForm, setMeetingForm] = useState({ parentId: 1, studentId: 1, title: '', purpose: '', date: '', time: '', duration: 30, mode: 'in-person' as MeetingMode, venue: '', agenda: '' });
  const [reqFilter, setReqFilter] = useState<RequestStatus | 'all'>('all');
  const [progressStudentId, setProgressStudentId] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Derived ──
  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const selectedParent = PARENTS.find(p => p.id === selectedParentId);
  const selectedStudent = STUDENTS.find(s => s.parentId === selectedParentId);
  const chatMessages = selectedParentId ? (messages[selectedParentId] || []) : [];
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
  const filteredMeetings = meetings.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQ) {
      const parent = PARENTS.find(p => p.id === m.parentId);
      const student = STUDENTS.find(s => s.id === m.studentId);
      return m.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        parent?.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        student?.name.toLowerCase().includes(searchQ.toLowerCase());
    }
    return true;
  });
  const filteredRequests = requests.filter(r => reqFilter === 'all' || r.status === reqFilter);
  const studentProgress = progress.filter(p => p.studentId === progressStudentId);

  // ── Stats ──
  const stats = {
    totalParents: PARENTS.length,
    totalMeetings: meetings.length,
    upcoming: meetings.filter(m => m.status === 'confirmed').length,
    pending: requests.filter(r => r.status === 'pending').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    reportsShared: progress.filter(p => p.isShared).length,
    avgAttendance: Math.round(STUDENTS.reduce((s, st) => s + st.attendance, 0) / STUDENTS.length),
    avgGpa: (STUDENTS.reduce((s, st) => s + st.gpa, 0) / STUDENTS.length).toFixed(1),
  };

  // ── Handlers ──
  const sendMessage = () => {
    if (!msgText.trim() || !selectedParentId) return;
    const newMsg: Message = {
      id: Date.now(), fromId: 0, toId: selectedParentId,
      fromName: 'You', fromAvatar: 'ME',
      text: msgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(), status: 'sent', isMe: true,
    };
    setMessages(prev => ({ ...prev, [selectedParentId]: [...(prev[selectedParentId] || []), newMsg] }));
    setMsgText('');
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [selectedParentId]: (prev[selectedParentId] || []).map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m) }));
    }, 800);
    setTimeout(() => {
      const replies = ['Noted sir, thank you!', 'Okay ji, will do.', 'Thank you for the update!', 'Sure, we will work on it.', 'Understood. Will follow up.'];
      const reply: Message = {
        id: Date.now() + 1, fromId: selectedParentId, toId: 0,
        fromName: selectedParent?.name || '', fromAvatar: selectedParent?.avatar || '',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(), status: 'read', isMe: false,
      };
      setMessages(prev => ({ ...prev, [selectedParentId]: [...(prev[selectedParentId] || []), reply] }));
    }, 3000);
  };

  const updateMeetingStatus = (id: number, status: MeetingStatus) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    toast.success(`Meeting ${status}`);
  };

  const updateRequestStatus = (id: number, status: RequestStatus, note?: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, teacherNote: note || r.teacherNote } : r));
    if (status === 'approved') toast.success('Request approved — meeting scheduled');
    else if (status === 'rejected') toast.success('Request declined');
  };

  const saveMeeting = () => {
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) {
      toast.error('Title, date and time required'); return;
    }
    const m: Meeting = {
      id: Date.now(), parentId: meetingForm.parentId, teacherId: 0, studentId: meetingForm.studentId,
      title: meetingForm.title, purpose: meetingForm.purpose, date: meetingForm.date, time: meetingForm.time,
      duration: meetingForm.duration, mode: meetingForm.mode, status: 'confirmed',
      venue: meetingForm.venue, requestedBy: 'teacher', createdAt: new Date().toISOString().split('T')[0],
      agenda: meetingForm.agenda.split('\n').filter(Boolean), followUpRequired: false,
    };
    setMeetings(prev => [m, ...prev]);
    setSelectedMeetingId(m.id);
    setShowMeetingForm(false);
    toast.success('Meeting scheduled!');
  };

  const shareReport = (id: number) => {
    setProgress(prev => prev.map(r => r.id === id ? { ...r, isShared: true } : r));
    toast.success('Report shared with parent');
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'meetings', label: 'Meetings', icon: <CalendarCheck className="w-3.5 h-3.5" />, badge: stats.upcoming },
    { key: 'requests', label: 'Requests', icon: <ClipboardList className="w-3.5 h-3.5" />, badge: stats.pending },
    { key: 'progress', label: 'Progress', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white/10 rounded-lg"><Users className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Parent-Teacher Communication Hub</h1>
            <p className="text-[9px] text-teal-200 font-medium">Meetings · Progress · Messages · Requests</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Notification Bell */}
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition">
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{unreadNotifs}</span>}
          </button>
          <button onClick={() => setShowMeetingForm(true)} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer">
            <Plus className="w-3 h-3" /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS DROPDOWN ── */}
      {showNotifications && (
        <div className="absolute top-16 right-4 z-50 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-700">Notifications</span>
            <div className="flex gap-2">
              <button onClick={markAllRead} className="text-[9px] text-teal-600 font-bold cursor-pointer hover:underline">Mark all read</button>
              <button onClick={() => setShowNotifications(false)} className="cursor-pointer"><X className="w-3.5 h-3.5 text-slate-400" /></button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifications.map(n => {
              const icons = { meeting: <CalendarCheck className="w-3.5 h-3.5 text-teal-500" />, progress: <TrendingUp className="w-3.5 h-3.5 text-blue-500" />, message: <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />, request: <ClipboardList className="w-3.5 h-3.5 text-amber-500" />, reminder: <Bell className="w-3.5 h-3.5 text-red-500" /> };
              return (
                <div key={n.id} className={`px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition ${!n.isRead ? 'bg-teal-50/40' : ''}`} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))}>
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 mt-0.5">{icons[n.type]}</div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold text-slate-800 leading-tight ${!n.isRead ? 'text-teal-800' : ''}`}>{n.title}</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="flex border-b border-slate-200 flex-shrink-0 bg-white overflow-x-auto">
        {tabConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition relative ${activeTab === t.key ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            {t.icon} {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Parents', val: stats.totalParents, icon: <Users className="w-4 h-4" />, color: 'from-teal-500 to-teal-600', sub: 'Linked families' },
                { label: 'Upcoming Meetings', val: stats.upcoming, icon: <CalendarCheck className="w-4 h-4" />, color: 'from-blue-500 to-blue-600', sub: 'Confirmed' },
                { label: 'Pending Requests', val: stats.pending, icon: <ClipboardList className="w-4 h-4" />, color: 'from-amber-500 to-orange-500', sub: 'Awaiting approval' },
                { label: 'Reports Shared', val: stats.reportsShared, icon: <FileText className="w-4 h-4" />, color: 'from-violet-500 to-violet-600', sub: 'This term' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} text-white p-3 rounded-xl shadow-sm`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-white/20 rounded-lg">{s.icon}</div>
                    <span className="text-xl font-extrabold">{s.val}</span>
                  </div>
                  <p className="text-[10px] font-bold opacity-90">{s.label}</p>
                  <p className="text-[8px] opacity-70 font-medium">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Upcoming Meetings */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-teal-500" /> Upcoming Meetings</span>
                  <button onClick={() => setActiveTab('meetings')} className="text-[9px] text-teal-600 font-bold cursor-pointer hover:underline flex items-center gap-0.5">View All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="divide-y divide-slate-50">
                  {meetings.filter(m => ['confirmed', 'pending'].includes(m.status)).slice(0, 4).map(m => {
                    const parent = PARENTS.find(p => p.id === m.parentId);
                    const student = STUDENTS.find(s => s.id === m.studentId);
                    return (
                      <div key={m.id} onClick={() => { setActiveTab('meetings'); setSelectedMeetingId(m.id); }} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-teal-50/30 cursor-pointer transition group">
                        <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {m.mode === 'online' ? <Video className="w-4 h-4 text-teal-600" /> : m.mode === 'phone' ? <Phone className="w-4 h-4 text-teal-600" /> : <Users className="w-4 h-4 text-teal-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">{m.title}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{parent?.name} · {student?.name} · {fmt(m.date)} {m.time}</p>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Students Overview */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Student Overview</span>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                    <span>Avg Attendance: <strong className="text-teal-600">{stats.avgAttendance}%</strong></span>
                    <span>Avg GPA: <strong className="text-blue-600">{stats.avgGpa}</strong></span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {STUDENTS.map(st => {
                    const parent = PARENTS.find(p => p.id === st.parentId);
                    const attColor = st.attendance >= 90 ? 'text-emerald-600' : st.attendance >= 75 ? 'text-amber-600' : 'text-red-600';
                    const attBg = st.attendance >= 90 ? 'bg-emerald-500' : st.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={st.id} className="px-3 py-2.5 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-2.5">
                          <Av text={st.avatar} size="sm" color="bg-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold text-slate-800">{st.name}</p>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${BEHAVIOR_COLORS[st.behavior]}`}>{st.behavior}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium">Class {st.class}-{st.section} · {parent?.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex-1">
                                <div className="flex justify-between mb-0.5">
                                  <span className="text-[8px] text-slate-400">Attendance</span>
                                  <span className={`text-[8px] font-bold ${attColor}`}>{st.attendance}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1">
                                  <div className={`${attBg} h-1 rounded-full`} style={{ width: `${st.attendance}%` }} />
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="text-[8px] text-slate-400">GPA</span>
                                <p className="text-[10px] font-extrabold text-blue-600">{st.gpa}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-amber-500" /> Recent Requests</span>
                <button onClick={() => setActiveTab('requests')} className="text-[9px] text-teal-600 font-bold cursor-pointer hover:underline flex items-center gap-0.5">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="divide-y divide-slate-50">
                {requests.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <Av text={r.parentAvatar} size="sm" color="bg-amber-500" online={PARENTS.find(p => p.id === r.parentId)?.isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-800">{r.parentName} <span className="text-slate-400 font-medium">({r.studentName})</span></p>
                      <p className="text-[9px] text-slate-500 font-medium truncate">{r.reason}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">{fmt(r.preferredDate)} · {r.mode}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${REQ_STATUS_COLORS[r.status]}`}>{r.status}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${URGENCY_COLORS[r.urgency]}`}>{r.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MEETINGS ═══════════════ */}
        {activeTab === 'meetings' && (
          <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Left: Meeting List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden">
              {/* Search + Filter */}
              <div className="p-2.5 border-b border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Search meetings..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    className="bg-transparent text-[10px] font-medium outline-none flex-1 text-slate-700 placeholder:text-slate-400" />
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`flex-shrink-0 text-[8px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {filteredMeetings.map(m => {
                  const parent = PARENTS.find(p => p.id === m.parentId);
                  const student = STUDENTS.find(s => s.id === m.studentId);
                  const isSelected = m.id === selectedMeetingId;
                  return (
                    <div key={m.id} onClick={() => setSelectedMeetingId(m.id)}
                      className={`px-3 py-2.5 cursor-pointer transition group ${isSelected ? 'bg-teal-50 border-r-4 border-teal-600' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${m.mode === 'online' ? 'bg-blue-100' : m.mode === 'phone' ? 'bg-emerald-100' : 'bg-teal-100'}`}>
                          {m.mode === 'online' ? <Video className="w-3.5 h-3.5 text-blue-600" /> : m.mode === 'phone' ? <Phone className="w-3.5 h-3.5 text-emerald-600" /> : <Users className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-bold leading-tight truncate ${isSelected ? 'text-teal-700' : 'text-slate-800'}`}>{m.title}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">{parent?.name} · {student?.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                            <span className="text-[8px] text-slate-400">{fmt(m.date)} {m.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <div className="p-2.5 border-t border-slate-100 flex-shrink-0">
                <button onClick={() => setShowMeetingForm(true)} className="w-full flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Schedule New Meeting
                </button>
              </div>
            </div>

            {/* Right: Meeting Detail */}
            <div className="flex-1 overflow-y-auto">
              {selectedMeeting ? (() => {
                const parent = PARENTS.find(p => p.id === selectedMeeting.parentId);
                const student = STUDENTS.find(s => s.id === selectedMeeting.studentId);
                return (
                  <div className="p-5 max-w-2xl">
                    {/* Meeting header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[selectedMeeting.status]}`}>{selectedMeeting.status}</span>
                          {selectedMeeting.followUpRequired && <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Follow-up required</span>}
                        </div>
                        <h2 className="text-xs font-extrabold text-slate-800 leading-tight">{selectedMeeting.title}</h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{selectedMeeting.purpose}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {selectedMeeting.status === 'pending' && <>
                          <button onClick={() => updateMeetingStatus(selectedMeeting.id, 'confirmed')} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition"><CheckCircle className="w-3 h-3" /> Confirm</button>
                          <button onClick={() => updateMeetingStatus(selectedMeeting.id, 'cancelled')} className="flex items-center gap-1 bg-red-100 text-red-600 text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition"><XCircle className="w-3 h-3" /> Cancel</button>
                        </>}
                        {selectedMeeting.status === 'confirmed' && <>
                          <button onClick={() => updateMeetingStatus(selectedMeeting.id, 'completed')} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition"><Check className="w-3 h-3" /> Mark Done</button>
                          <button onClick={() => updateMeetingStatus(selectedMeeting.id, 'rescheduled')} className="flex items-center gap-1 bg-purple-100 text-purple-600 text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition"><RefreshCw className="w-3 h-3" /> Reschedule</button>
                        </>}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Meeting Details</p>
                        {[
                          { icon: <Calendar className="w-3 h-3 text-teal-500" />, label: 'Date', val: fmt(selectedMeeting.date) },
                          { icon: <Clock className="w-3 h-3 text-blue-500" />, label: 'Time', val: `${selectedMeeting.time} (${selectedMeeting.duration} min)` },
                          { icon: selectedMeeting.mode === 'online' ? <Video className="w-3 h-3 text-purple-500" /> : selectedMeeting.mode === 'phone' ? <Phone className="w-3 h-3 text-emerald-500" /> : <Users className="w-3 h-3 text-teal-500" />, label: 'Mode', val: selectedMeeting.mode },
                          ...(selectedMeeting.venue ? [{ icon: <Home className="w-3 h-3 text-slate-400" />, label: 'Venue', val: selectedMeeting.venue }] : []),
                          ...(selectedMeeting.meetLink ? [{ icon: <Video className="w-3 h-3 text-blue-400" />, label: 'Link', val: 'Join Meeting' }] : []),
                        ].map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5 mb-1.5">
                            {r.icon}
                            <span className="text-[9px] text-slate-400 w-10 flex-shrink-0">{r.label}:</span>
                            <span className="text-[9px] font-bold text-slate-700">{r.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Participants</p>
                        {parent && (
                          <div className="flex items-center gap-2 mb-2">
                            <Av text={parent.avatar} size="sm" color="bg-amber-500" online={parent.isOnline} />
                            <div>
                              <p className="text-[9px] font-bold text-slate-700">{parent.name}</p>
                              <p className="text-[8px] text-slate-400">{parent.relation} · {parent.phone}</p>
                            </div>
                          </div>
                        )}
                        {student && (
                          <div className="flex items-center gap-2 mb-2">
                            <Av text={student.avatar} size="sm" color="bg-blue-600" />
                            <div>
                              <p className="text-[9px] font-bold text-slate-700">{student.name}</p>
                              <p className="text-[8px] text-slate-400">Class {student.class}-{student.section} · Roll #{student.rollNo}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Av text="ME" size="sm" color="bg-teal-600" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-700">You (Teacher)</p>
                            <p className="text-[8px] text-slate-400">Requested by: {selectedMeeting.requestedBy}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agenda */}
                    {selectedMeeting.agenda.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Agenda</p>
                        <div className="space-y-1.5">
                          {selectedMeeting.agenda.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-teal-100 text-teal-700 text-[8px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <span className="text-[10px] text-slate-700 font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedMeeting.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-[9px] font-bold text-amber-700 mb-1 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Teacher Notes</p>
                        <p className="text-[10px] text-amber-800 font-medium">{selectedMeeting.notes}</p>
                      </div>
                    )}

                    {/* Follow-up */}
                    {selectedMeeting.followUpRequired && selectedMeeting.followUpNote && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                        <p className="text-[9px] font-bold text-blue-700 mb-1 flex items-center gap-1"><Flag className="w-3 h-3" /> Follow-up Action</p>
                        <p className="text-[10px] text-blue-800 font-medium">{selectedMeeting.followUpNote}</p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setActiveTab('messages'); setSelectedParentId(selectedMeeting.parentId); }} className="flex items-center gap-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                        <MessageSquare className="w-3 h-3" /> Message Parent
                      </button>
                      {selectedMeeting.mode === 'online' && (
                        <button onClick={() => toast.success('Joining meeting room...')} className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <Video className="w-3 h-3" /> Join Meeting
                        </button>
                      )}
                      <button onClick={() => toast.success('Reminder sent to parent!')} className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                        <Bell className="w-3 h-3" /> Send Reminder
      </button>
                      <button onClick={() => toast.success('Meeting summary downloaded')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                        <Download className="w-3 h-3" /> Download Summary
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <CalendarCheck className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-500">Select a meeting to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ REQUESTS ═══════════════ */}
        {activeTab === 'requests' && (
          <div className="p-4">
            {/* Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] font-bold text-slate-600">Filter:</span>
              {(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map(s => (
                <button key={s} onClick={() => setReqFilter(s)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer capitalize ${reqFilter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-400'}`}>
                  {s} {s !== 'all' && `(${requests.filter(r => r.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredRequests.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-300 transition">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <Av text={r.parentAvatar} size="sm" color="bg-amber-500" online={PARENTS.find(p => p.id === r.parentId)?.isOnline} />
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-800">{r.parentName}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{r.studentName} · Class {r.studentClass} · {fmt(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${URGENCY_COLORS[r.urgency]}`}>{r.urgency} urgency</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${REQ_STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-slate-700 leading-relaxed mb-3">{r.reason}</p>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { icon: <Calendar className="w-3 h-3 text-teal-500" />, label: 'Preferred Date', val: fmt(r.preferredDate) },
                        { icon: <Clock className="w-3 h-3 text-blue-500" />, label: 'Time Slot', val: r.preferredTime },
                        { icon: r.mode === 'online' ? <Video className="w-3 h-3 text-purple-500" /> : r.mode === 'phone' ? <Phone className="w-3 h-3 text-emerald-500" /> : <Users className="w-3 h-3 text-teal-500" />, label: 'Mode', val: r.mode },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {item.icon}
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium">{item.label}</p>
                            <p className="text-[9px] font-bold text-slate-700 capitalize">{item.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {r.teacherNote && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-3">
                        <p className="text-[9px] font-bold text-teal-700 mb-0.5">Teacher Note:</p>
                        <p className="text-[9px] text-teal-700 font-medium">{r.teacherNote}</p>
                      </div>
                    )}

                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateRequestStatus(r.id, 'approved', 'Meeting approved. Will confirm time shortly.')}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <CheckCircle className="w-3 h-3" /> Approve & Schedule
                        </button>
                        <button onClick={() => updateRequestStatus(r.id, 'rejected', 'Unable to accommodate at this time.')}
                          className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-[9px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <XCircle className="w-3 h-3" /> Decline
                        </button>
                        <button onClick={() => { setActiveTab('messages'); setSelectedParentId(r.parentId); }}
                          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <MessageSquare className="w-3 h-3" /> Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-[10px] font-semibold">No requests found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PROGRESS ═══════════════ */}
        {activeTab === 'progress' && (
          <div className="p-4">
            {/* Student Selector */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {STUDENTS.map(st => (
                <button key={st.id} onClick={() => setProgressStudentId(st.id)}
                  className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${progressStudentId === st.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                  <Av text={st.avatar} size="xs" color="bg-blue-600" />
                  {st.name} <span className="opacity-70">(Class {st.class}-{st.section})</span>
                </button>
              ))}
            </div>

            {/* Student Card */}
            {(() => {
              const st = STUDENTS.find(s => s.id === progressStudentId);
              const parent = st ? PARENTS.find(p => p.id === st.parentId) : null;
              if (!st) return null;
              const attColor = st.attendance >= 90 ? 'text-emerald-600 bg-emerald-100' : st.attendance >= 75 ? 'text-amber-600 bg-amber-100' : 'text-red-600 bg-red-100';
              const attBg = st.attendance >= 90 ? 'bg-emerald-500' : st.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4 rounded-2xl mb-4 flex items-center gap-4">
                  <Av text={st.avatar} size="lg" color="bg-white/20" />
                  <div className="flex-1">
                    <h2 className="font-extrabold text-sm">{st.name}</h2>
                    <p className="text-[10px] text-teal-100 font-medium">Class {st.class}-{st.section} · Roll #{st.rollNo} · Parent: {parent?.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {[
                        { label: 'Attendance', val: `${st.attendance}%` },
                        { label: 'GPA', val: st.gpa },
                        { label: 'Behaviour', val: st.behavior },
                      ].map((item, i) => (
                        <div key={i} className="text-center">
                          <p className="text-[9px] text-teal-200 font-medium">{item.label}</p>
                          <p className="text-xs font-extrabold">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => toast.success('Full report downloaded')} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl border border-white/20 cursor-pointer transition">
                    <Download className="w-3 h-3" /> Download Report
                  </button>
                </div>
              );
            })()}

            {/* Attendance bar */}
            {(() => {
              const st = STUDENTS.find(s => s.id === progressStudentId);
              if (!st) return null;
              const attBg = st.attendance >= 90 ? 'bg-emerald-500' : st.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-700">Attendance</p>
                    <span className={`text-[10px] font-extrabold ${st.attendance >= 90 ? 'text-emerald-600' : st.attendance >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{st.attendance}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                    <div className={`${attBg} h-2 rounded-full`} style={{ width: `${st.attendance}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-medium">
                    <span>0%</span><span>Minimum: 75%</span><span>100%</span>
                  </div>
                  {st.attendance < 75 && (
                    <div className="mt-2 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <p className="text-[9px] text-red-600 font-bold">Attendance below minimum requirement! Parent notification sent.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Subject Reports */}
            {studentProgress.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Subject-wise Performance</p>
                  <button onClick={() => toast.success('All reports shared with parent!')} className="flex items-center gap-1 bg-teal-100 hover:bg-teal-200 text-teal-700 text-[9px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition">
                    <Share2 className="w-3 h-3" /> Share All Reports
                  </button>
                </div>
                {studentProgress.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-300 transition">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-800">{r.subject}</p>
                          <p className="text-[8px] text-slate-400 font-medium">{r.examType} · {fmt(r.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {TREND_ICON(r.trend)}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${GRADE_COLORS[r.grade] || 'text-slate-600 bg-slate-100'}`}>{r.grade}</span>
                        {r.isShared
                          ? <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Shared</span>
                          : <button onClick={() => shareReport(r.id)} className="text-[8px] text-teal-600 font-bold border border-teal-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-teal-50"><Share2 className="w-3 h-3 inline" /> Share</button>
                        }
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      {/* Score bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-slate-500 font-medium">Score</span>
                            <span className="text-[10px] font-extrabold text-slate-700">{r.marks}/{r.totalMarks} ({Math.round((r.marks/r.totalMarks)*100)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${r.marks/r.totalMarks >= 0.75 ? 'bg-emerald-500' : r.marks/r.totalMarks >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${(r.marks/r.totalMarks)*100}%` }} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium mb-2 italic">"{r.remarks}"</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                          <p className="text-[8px] font-bold text-emerald-700 mb-1 flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" /> Strengths</p>
                          {r.strengths.map((s, i) => <p key={i} className="text-[9px] text-emerald-700 font-medium">• {s}</p>)}
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <p className="text-[8px] font-bold text-amber-700 mb-1 flex items-center gap-1"><Target className="w-2.5 h-2.5" /> Improve</p>
                          {r.improvements.map((s, i) => <p key={i} className="text-[9px] text-amber-700 font-medium">• {s}</p>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-[10px] font-semibold">No progress reports for this student</p>
                <button onClick={() => setShowReportForm(true)} className="mt-3 bg-teal-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:bg-teal-700 transition">Add Report</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ MESSAGES ═══════════════ */}
        {activeTab === 'messages' && (
          <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Parent list */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden">
              <div className="p-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Search parents..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    className="bg-transparent text-[10px] outline-none flex-1 text-slate-700 placeholder:text-slate-400 font-medium" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {PARENTS.filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase())).map(p => {
                  const student = STUDENTS.find(s => s.parentId === p.id);
                  const lastMsg = (messages[p.id] || []).slice(-1)[0];
                  const isSelected = p.id === selectedParentId;
                  return (
                    <div key={p.id} onClick={() => setSelectedParentId(p.id)}
                      className={`px-3 py-2.5 cursor-pointer transition group ${isSelected ? 'bg-teal-50 border-r-4 border-teal-600' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2.5">
                        <Av text={p.avatar} size="md" color="bg-amber-500" online={p.isOnline} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-teal-700' : 'text-slate-800'}`}>{p.name}</p>
                            <span className="text-[8px] text-slate-400">{lastMsg?.time || ''}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium truncate">{student?.name} · Class {student?.class}-{student?.section}</p>
                          {lastMsg && <p className="text-[9px] text-slate-400 truncate font-medium mt-0.5">{lastMsg.isMe ? 'You: ' : ''}{lastMsg.text}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedParent ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <Av text={selectedParent.avatar} size="sm" color="bg-amber-500" online={selectedParent.isOnline} />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 leading-tight">{selectedParent.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {selectedParent.relation} · {selectedParent.isOnline ? '🟢 Online' : `⚫ ${selectedParent.lastSeen || 'Offline'}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.success('Voice call initiated')} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><Phone className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => toast.success('Video call initiated')} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><Video className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => toast.success('Student profile opened')} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><GraduationCap className="w-4 h-4 text-slate-500" /></button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/40">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-[10px] font-semibold text-slate-400">Start a conversation with {selectedParent.name}</p>
                      </div>
                    ) : chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} gap-1.5`}>
                        {!msg.isMe && <Av text={msg.fromAvatar} size="xs" color="bg-amber-500" />}
                        <div className={`max-w-[65%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-2 rounded-2xl text-[11px] font-medium shadow-sm ${msg.isMe ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                            {msg.attachmentName && (
                              <div className={`flex items-center gap-1.5 mb-1.5 pb-1.5 border-b ${msg.isMe ? 'border-teal-500' : 'border-slate-200'}`}>
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-[9px] font-bold">{msg.attachmentName}</span>
                              </div>
                            )}
                            <p className="leading-snug">{msg.text}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[8px] text-slate-400 font-medium">{msg.time}</span>
                            {msg.isMe && (
                              msg.status === 'read'
                                ? <span className="flex"><Check className="w-3 h-3 text-teal-400 -mr-1.5" /><Check className="w-3 h-3 text-teal-400" /></span>
                                : msg.status === 'delivered'
                                ? <span className="flex"><Check className="w-3 h-3 text-slate-400 -mr-1.5" /><Check className="w-3 h-3 text-slate-400" /></span>
                                : <Check className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                        </div>
                        {msg.isMe && <Av text="ME" size="xs" color="bg-teal-600" />}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-slate-200 flex-shrink-0">
                    <button onClick={() => toast.success('Attachment picker opened')} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer flex-shrink-0">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                      <input type="text" placeholder="Type a message to parent..." value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        className="flex-1 bg-transparent text-[11px] font-medium outline-none text-slate-800 placeholder:text-slate-400" />
                      <button onClick={() => toast.success('Emoji picker')} className="cursor-pointer hover:opacity-70">
                        <Smile className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <button onClick={sendMessage} disabled={!msgText.trim()}
                      className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition active:scale-95">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-500">Select a parent to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ REPORTS ═══════════════ */}
        {activeTab === 'reports' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold text-slate-700">Communication Reports & Analytics</h2>
              <button onClick={() => toast.success('Full report exported!')} className="flex items-center gap-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                <Download className="w-3 h-3" /> Export Report
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Meetings', val: meetings.length, sub: `${stats.completed} completed`, color: 'border-teal-300 bg-teal-50', textColor: 'text-teal-700' },
                { label: 'Pending Requests', val: stats.pending, sub: 'Awaiting response', color: 'border-amber-300 bg-amber-50', textColor: 'text-amber-700' },
                { label: 'Reports Shared', val: stats.reportsShared, sub: 'With parents', color: 'border-blue-300 bg-blue-50', textColor: 'text-blue-700' },
                { label: 'Avg Attendance', val: `${stats.avgAttendance}%`, sub: 'School average', color: 'border-violet-300 bg-violet-50', textColor: 'text-violet-700' },
              ].map((s, i) => (
                <div key={i} className={`border-2 ${s.color} rounded-xl p-3`}>
                  <p className={`text-2xl font-extrabold ${s.textColor}`}>{s.val}</p>
                  <p className={`text-[10px] font-bold ${s.textColor}`}>{s.label}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Meeting Report Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-700">Meeting Log</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Meeting', 'Parent', 'Student', 'Date & Time', 'Mode', 'Status', 'Follow-up'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {meetings.map(m => {
                      const parent = PARENTS.find(p => p.id === m.parentId);
                      const student = STUDENTS.find(s => s.id === m.studentId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2">
                            <p className="text-[10px] font-bold text-slate-800 leading-tight max-w-[150px] truncate">{m.title}</p>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <Av text={parent?.avatar || '?'} size="xs" color="bg-amber-500" />
                              <span className="text-[9px] font-medium text-slate-700">{parent?.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-[9px] font-medium text-slate-700">{student?.name}</span>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-[9px] font-medium text-slate-700">{fmt(m.date)}</p>
                            <p className="text-[8px] text-slate-400">{m.time} ({m.duration}min)</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-[9px] font-bold text-slate-600 capitalize">{m.mode}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                          </td>
                          <td className="px-3 py-2">
                            {m.followUpRequired
                              ? <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Required</span>
                              : <span className="text-[8px] text-slate-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parent Engagement */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-700">Parent Engagement Summary</p>
              </div>
              <div className="divide-y divide-slate-50">
                {PARENTS.map(p => {
                  const student = STUDENTS.find(s => s.parentId === p.id);
                  const pMeetings = meetings.filter(m => m.parentId === p.id);
                  const pRequests = requests.filter(r => r.parentId === p.id);
                  const pMsgs = (messages[p.id] || []).length;
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Av text={p.avatar} size="sm" color="bg-amber-500" online={p.isOnline} />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-800">{p.name} <span className="text-slate-400 font-medium">({p.relation})</span></p>
                        <p className="text-[9px] text-slate-400 font-medium">{student?.name} · Class {student?.class}-{student?.section}</p>
                      </div>
                      <div className="flex items-center gap-4 text-center">
                        <div><p className="text-[11px] font-extrabold text-teal-600">{pMeetings.length}</p><p className="text-[8px] text-slate-400">Meetings</p></div>
                        <div><p className="text-[11px] font-extrabold text-amber-600">{pRequests.length}</p><p className="text-[8px] text-slate-400">Requests</p></div>
                        <div><p className="text-[11px] font-extrabold text-blue-600">{pMsgs}</p><p className="text-[8px] text-slate-400">Messages</p></div>
                      </div>
                      <button onClick={() => { setActiveTab('messages'); setSelectedParentId(p.id); }} className="flex items-center gap-1 bg-teal-100 hover:bg-teal-200 text-teal-700 text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition">
                        <MessageSquare className="w-3 h-3" /> Message
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SCHEDULE MEETING MODAL ── */}
      {showMeetingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl flex-shrink-0">
              <span className="text-white font-extrabold text-[11px] flex items-center gap-2"><CalendarCheck className="w-4 h-4" /> Schedule Meeting</span>
              <button onClick={() => setShowMeetingForm(false)} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Meeting Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Mid-Term Performance Review" value={meetingForm.title} onChange={e => setMeetingForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Parent</label>
                  <select value={meetingForm.parentId} onChange={e => setMeetingForm(p => ({ ...p, parentId: +e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {PARENTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Student</label>
                  <select value={meetingForm.studentId} onChange={e => setMeetingForm(p => ({ ...p, studentId: +e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} (Class {s.class}-{s.section})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Purpose / Agenda</label>
                <textarea rows={3} placeholder="Describe the purpose..." value={meetingForm.purpose} onChange={e => setMeetingForm(p => ({ ...p, purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={meetingForm.date} onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-teal-400 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={meetingForm.time} onChange={e => setMeetingForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-teal-400 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Duration (min)</label>
                  <select value={meetingForm.duration} onChange={e => setMeetingForm(p => ({ ...p, duration: +e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mode</label>
                  <div className="flex gap-1.5">
                    {(['in-person', 'online', 'phone'] as MeetingMode[]).map(m => (
                      <button key={m} type="button" onClick={() => setMeetingForm(p => ({ ...p, mode: m }))}
                        className={`flex-1 flex items-center justify-center gap-1 text-[8px] font-bold py-1.5 rounded-lg border transition cursor-pointer capitalize ${meetingForm.mode === m ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-400'}`}>
                        {m === 'online' ? <Video className="w-3 h-3" /> : m === 'phone' ? <Phone className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Venue / Link</label>
                  <input type="text" placeholder={meetingForm.mode === 'online' ? 'Meeting link...' : 'Room / Location...'} value={meetingForm.venue} onChange={e => setMeetingForm(p => ({ ...p, venue: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Agenda Items (one per line)</label>
                <textarea rows={3} placeholder="1. Review exam results&#10;2. Discuss study plan&#10;3. Set action items" value={meetingForm.agenda} onChange={e => setMeetingForm(p => ({ ...p, agenda: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
              <button onClick={() => setShowMeetingForm(false)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Cancel</button>
              <div className="flex gap-2">
                <button onClick={() => { toast.success('Reminder scheduled!'); setShowMeetingForm(false); }} className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                  <Bell className="w-3 h-3" /> Notify Only
                </button>
                <button onClick={saveMeeting} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-xl transition cursor-pointer">
                  <CalendarCheck className="w-3 h-3" /> Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentTeacherHub;
