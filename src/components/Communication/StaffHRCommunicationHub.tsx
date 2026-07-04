import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users, MessageSquare, Send, Plus, Search, Settings, RefreshCw,
  Bell, BellOff, FileText, Download, Calendar, Flag, Zap,
  BarChart2, Smartphone, ToggleLeft, ToggleRight, Star, Paperclip,
  Hash, CheckCircle, XCircle, Clock, User, Building, BookOpen,
  Edit3, Archive, ChevronRight, Info, Tag, Shield, TrendingUp,
  Mail, Phone, Globe, Layers, Activity, Award, Briefcase, Coffee,
  Heart, Lock, Megaphone, AlertCircle, ThumbsUp, Mic, Video,
  MoreVertical, Check, X, Image, Smile, GraduationCap, FileSpreadsheet,
  ChevronDown, ChevronUp, DollarSign, Clipboard, HelpCircle, PieChart
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'noticeboard' | 'channels' | 'hr_updates' | 'directory' | 'analytics';
type Department = 'all' | 'academic' | 'admin' | 'accounts' | 'transport' | 'hostel' | 'facilities' | 'hr' | 'it' | 'sports';
type NoticePriority = 'normal' | 'important' | 'urgent';
type HRUpdateType = 'payroll' | 'leave' | 'policy' | 'circular' | 'training' | 'holiday' | 'appraisal' | 'recruitment';
type StaffRole = 'teacher' | 'hod' | 'admin' | 'vice_principal' | 'principal' | 'accounts' | 'support';

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface StaffNotice {
  id: number;
  title: string;
  body: string;
  postedBy: string;
  postedByRole: StaffRole;
  department: Department;
  priority: NoticePriority;
  postedAt: string;
  isRead: boolean;
  isPinned: boolean;
  likes: number;
  attachments: string[];
  tags: string[];
  isLikedByMe: boolean;
}

interface ChatChannel {
  id: number;
  name: string;
  description: string;
  department: Department;
  emoji: string;
  memberCount: number;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageBy: string;
  isPrivate: boolean;
  color: string;
}

interface ChatMessage {
  id: number;
  channelId: number;
  author: string;
  authorRole: StaffRole;
  authorDept: string;
  text: string;
  timestamp: string;
  reactions: Record<string, number>;
  hasFile?: string;
  isMe: boolean;
}

interface HRUpdate {
  id: number;
  title: string;
  summary: string;
  type: HRUpdateType;
  postedBy: string;
  postedAt: string;
  isNew: boolean;
  isPriority: boolean;
  actionLabel?: string;
  actionUrl?: string;
  attachments: string[];
}

interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
  department: Department;
  designation: string;
  email: string;
  phone: string;
  extension: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar: string; // initials
  joinedYear: number;
  subjects?: string[];
  isAdmin: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_NOTICES: StaffNotice[] = [
  {
    id: 1, title: 'Staff Meeting – Monthly Review & Academic Planning',
    body: 'All teaching staff and department heads are hereby informed that the Monthly Review Meeting for June 2026 will be held on Saturday, 28th June 2026 in the Main Conference Room (2nd Floor) from 09:30 AM to 12:00 PM.\n\nAgenda includes:\n• Mid-term exam performance analysis\n• Q2 academic calendar finalization\n• New digital learning tools demo\n• Departmental updates and HOD reports\n\nAttendance is mandatory for all teaching staff. Please bring your departmental progress reports.',
    postedBy: 'Dr. R. Sharma', postedByRole: 'principal', department: 'all',
    priority: 'important', postedAt: '2026-06-24 09:00 AM', isRead: false, isPinned: true,
    likes: 12, attachments: ['meeting_agenda.pdf'], tags: ['meeting', 'mandatory'], isLikedByMe: false
  },
  {
    id: 2, title: 'Salary Slip – June 2026 Uploaded to HR Portal',
    body: 'This is to inform all staff members that the June 2026 salary slips have been uploaded to the HR self-service portal. Please log in using your Employee ID to download your payslip.\n\nNote: Increment letters for eligible staff (Performance Cycle 2025-26) have also been attached. Please review and acknowledge within 5 working days.\n\nFor any salary-related queries, contact the Accounts Department before June 30.',
    postedBy: 'Mr. R. Tiwari', postedByRole: 'hr', department: 'all',
    priority: 'urgent', postedAt: '2026-06-24 08:30 AM', isRead: false, isPinned: true,
    likes: 24, attachments: ['salary_portal_guide.pdf'], tags: ['salary', 'payslip', 'june'], isLikedByMe: true
  },
  {
    id: 3, title: 'New Leave Policy – Effective July 2026',
    body: 'The school management has approved a revised leave policy effective from 1st July 2026. Key changes include:\n\n• Casual Leave: 12 days/year (increased from 8)\n• Medical Leave: 15 days/year (with medical certificate)\n• New: Remote Work Leave – 2 days/month with HOD approval\n• Earned Leave encashment allowed up to 10 days/year\n\nFull policy document is attached. All staff are requested to read and confirm receipt via the acknowledgement portal.',
    postedBy: 'Mr. R. Tiwari', postedByRole: 'hr', department: 'all',
    priority: 'important', postedAt: '2026-06-22 11:00 AM', isRead: true, isPinned: false,
    likes: 38, attachments: ['leave_policy_2026.pdf', 'leave_form_updated.docx'], tags: ['leave', 'policy', 'HR'], isLikedByMe: true
  },
  {
    id: 4, title: 'Summer Workshop – Digital Tools for Teachers (Online)',
    body: 'The Academic Development Committee is organizing a 2-day online workshop on Digital Teaching Tools for the upcoming academic year. Sessions will cover Google Classroom advanced features, AI-assisted lesson planning, and interactive quiz platforms.\n\nDates: July 3-4, 2026 | Time: 10 AM – 1 PM (Zoom)\n\nRegistration link is in the attachment. Participation will be counted towards CPD hours.',
    postedBy: 'Mrs. S. Verma', postedByRole: 'hod', department: 'academic',
    priority: 'normal', postedAt: '2026-06-21 03:30 PM', isRead: true, isPinned: false,
    likes: 15, attachments: ['workshop_registration.pdf'], tags: ['training', 'digital', 'CPD'], isLikedByMe: false
  },
  {
    id: 5, title: 'Cafeteria Menu Update – July 2026 Revised Menu',
    body: 'The school cafeteria has introduced a revised menu effective July 2026. The new menu includes healthier options and a variety of regional dishes. Staff lunch tokens are now available at the accounts office at a subsidized rate of ₹60/meal.\n\nFeedback forms for the previous menu are available at the cafeteria reception.',
    postedBy: 'Admin Office', postedByRole: 'admin', department: 'admin',
    priority: 'normal', postedAt: '2026-06-20 12:00 PM', isRead: true, isPinned: false,
    likes: 9, attachments: ['july_menu.pdf'], tags: ['cafeteria', 'food', 'staff-welfare'], isLikedByMe: false
  }
];

const MOCK_CHANNELS: ChatChannel[] = [
  { id: 1, name: 'All Staff – General', description: 'School-wide announcements and general discussion', department: 'all', emoji: '🏫', memberCount: 87, unreadCount: 4, lastMessage: 'Reminder: please submit your lesson plans by Friday EOD.', lastMessageTime: '10 mins ago', lastMessageBy: 'Mrs. S. Verma', isPrivate: false, color: 'bg-indigo-100 text-indigo-700' },
  { id: 2, name: 'Teaching Faculty', description: 'Discussion channel for all subject teachers', department: 'academic', emoji: '📖', memberCount: 52, unreadCount: 8, lastMessage: 'Class 10 Science project submissions portal is now open.', lastMessageTime: '25 mins ago', lastMessageBy: 'Dr. Iyer', isPrivate: false, color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'HODs & Department Heads', description: 'Private channel for heads of departments', department: 'academic', emoji: '🎯', memberCount: 12, unreadCount: 2, lastMessage: 'Mid-term analysis report to be shared by 26th June.', lastMessageTime: '1 hr ago', lastMessageBy: 'Dr. R. Sharma', isPrivate: true, color: 'bg-violet-100 text-violet-700' },
  { id: 4, name: 'Accounts & Finance', description: 'Fee collection, payroll and finance updates', department: 'accounts', emoji: '💰', memberCount: 8, unreadCount: 0, lastMessage: 'Q2 collection report uploaded. Please verify your class data.', lastMessageTime: '2 hrs ago', lastMessageBy: 'Mr. A. Gupta', isPrivate: false, color: 'bg-emerald-100 text-emerald-700' },
  { id: 5, name: 'Transport Coordinators', description: 'Route management and driver coordination', department: 'transport', emoji: '🚌', memberCount: 14, unreadCount: 1, lastMessage: 'Route 7 driver replaced. New schedule attached.', lastMessageTime: '3 hrs ago', lastMessageBy: 'Mr. V. Singh', isPrivate: false, color: 'bg-amber-100 text-amber-700' },
  { id: 6, name: 'Hostel Staff', description: 'Warden and hostel administration coordination', department: 'hostel', emoji: '🏢', memberCount: 10, unreadCount: 0, lastMessage: 'Room 204 heater repair scheduled for tomorrow 8 AM.', lastMessageTime: '4 hrs ago', lastMessageBy: 'Mr. S. Menon', isPrivate: false, color: 'bg-rose-100 text-rose-700' },
  { id: 7, name: 'IT & Systems', description: 'IT support, portal issues, system maintenance', department: 'it', emoji: '💻', memberCount: 6, unreadCount: 3, lastMessage: 'Portal maintenance window: 11 PM - 1 AM tonight.', lastMessageTime: '5 hrs ago', lastMessageBy: 'IT Support', isPrivate: false, color: 'bg-teal-100 text-teal-700' },
];

const CHANNEL_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    { id: 1, channelId: 1, author: 'Mrs. S. Verma', authorRole: 'hod', authorDept: 'Academic', text: 'Good morning everyone! Quick reminder – all lesson plan submissions for July are due by this Friday EOD. Please use the updated template shared last week.', timestamp: '09:10 AM', reactions: { '👍': 8, '✅': 5 }, isMe: false },
    { id: 2, channelId: 1, author: 'Mr. K. Singh', authorRole: 'teacher', authorDept: 'Sports', text: 'Received! Will submit by Thursday. Also, the sports day roster will be shared in the Sports channel today.', timestamp: '09:15 AM', reactions: { '👍': 3 }, isMe: false },
    { id: 3, channelId: 1, author: 'Dr. Iyer', authorRole: 'teacher', authorDept: 'Science', text: 'Quick question – can we use the old template or must we use the new one? The new one has extra columns for digital tools integration.', timestamp: '09:22 AM', reactions: {}, isMe: false },
    { id: 4, channelId: 1, author: 'Mrs. S. Verma', authorRole: 'hod', authorDept: 'Academic', text: 'The NEW template is mandatory for July onwards. It integrates with our new digital assessment system. The template is on the shared drive: HR > Templates > Lesson_Plan_July2026.xlsx', timestamp: '09:25 AM', reactions: { '👍': 12, '📌': 4 }, isMe: false },
    { id: 5, channelId: 1, author: 'You', authorRole: 'admin', authorDept: 'Administration', text: 'Thanks for the clarification! Will use the new template. 👍', timestamp: '09:30 AM', reactions: {}, isMe: true },
    { id: 6, channelId: 1, author: 'Ms. P. Nair', authorRole: 'vice_principal', authorDept: 'Administration', text: 'Also – salary slips are now live on the HR portal. Please check and acknowledge the increment letters by June 30th. Any issues, contact Accounts.', timestamp: '09:45 AM', reactions: { '🙏': 7, '👍': 15 }, isMe: false },
    { id: 7, channelId: 1, author: 'Mr. R. Tiwari', authorRole: 'hr', authorDept: 'HR', text: 'Confirmed ✅ All payslips uploaded. For discrepancies, email hr@dps.edu.in with subject line "Payslip Query - June 2026"', timestamp: '10:00 AM', reactions: { '✅': 9 }, isMe: false },
  ],
  2: [
    { id: 1, channelId: 2, author: 'Ms. Patel', authorRole: 'teacher', authorDept: 'English', text: 'Has anyone tried the new Google Workspace integration? The shared docs feature is really useful for collaborative lesson planning.', timestamp: '08:30 AM', reactions: { '👍': 4 }, isMe: false },
    { id: 2, channelId: 2, author: 'Dr. Iyer', authorRole: 'teacher', authorDept: 'Science', text: 'Class 10 Science project submission portal is now open. Students can upload their PPTs directly. Teachers please monitor and grade by July 1.', timestamp: '09:40 AM', reactions: { '👍': 6, '✅': 3 }, isMe: false },
    { id: 3, channelId: 2, author: 'Mrs. Gupta', authorRole: 'teacher', authorDept: 'Math', text: 'Should we also upload the marking scheme alongside the submissions? Or just the final grades?', timestamp: '09:50 AM', reactions: {}, isMe: false },
    { id: 4, channelId: 2, author: 'You', authorRole: 'admin', authorDept: 'Administration', text: 'Upload both – marking scheme + final grades. The portal has two separate upload fields for this now.', timestamp: '10:05 AM', reactions: { '👍': 2 }, isMe: true },
  ],
};

const MOCK_HR_UPDATES: HRUpdate[] = [
  { id: 1, title: 'Salary Slips – June 2026 Now Available', summary: 'Download your June 2026 payslip from the HR portal. Increment letters for eligible staff have also been attached. Please acknowledge receipt by June 30th.', type: 'payroll', postedBy: 'Accounts Dept.', postedAt: '2026-06-24', isNew: true, isPriority: true, actionLabel: 'Download Payslip', attachments: ['june_payslip_portal_guide.pdf'] },
  { id: 2, title: 'Leave Policy Updated – Effective July 1, 2026', summary: 'Revised leave policy includes increased casual leaves (12 days), new remote work leave provision, and earned leave encashment allowance.', type: 'leave', postedBy: 'HR Dept.', postedAt: '2026-06-22', isNew: true, isPriority: true, actionLabel: 'Read Full Policy', attachments: ['leave_policy_v2.pdf', 'leave_application_form.docx'] },
  { id: 3, title: 'Annual Appraisal 2025-26 – Results Published', summary: 'Performance appraisal results for the academic year 2025-26 have been published. Log in to the HR portal to view your rating and increment details.', type: 'appraisal', postedBy: 'HR Dept.', postedAt: '2026-06-20', isNew: false, isPriority: true, actionLabel: 'View Appraisal', attachments: [] },
  { id: 4, title: 'Mandatory Training: Child Safety & POCSO Awareness', summary: 'All staff are required to complete the mandatory POCSO awareness e-learning module. Deadline: July 10, 2026. Certificate will be issued on completion.', type: 'training', postedBy: 'Principal', postedAt: '2026-06-18', isNew: false, isPriority: true, actionLabel: 'Start Training', attachments: ['pocso_training_guide.pdf'] },
  { id: 5, title: 'Holiday Calendar – July to December 2026', summary: 'The approved school holiday calendar for July-December 2026 has been published. Includes government gazette holidays, school events, and examination days.', type: 'holiday', postedBy: 'Admin Office', postedAt: '2026-06-15', isNew: false, isPriority: false, actionLabel: 'View Calendar', attachments: ['holiday_calendar_H2_2026.pdf'] },
  { id: 6, title: 'New Recruitment: 2 Mathematics Teachers (Vacancies)', summary: 'The school has opened 2 positions for Mathematics teachers (PGT level). Existing staff may refer eligible candidates. Referral bonus applicable per HR policy.', type: 'recruitment', postedBy: 'HR Dept.', postedAt: '2026-06-12', isNew: false, isPriority: false, actionLabel: 'View JD', attachments: ['math_teacher_jd.pdf'] },
  { id: 7, title: 'Staff Provident Fund – Annual Statement FY2025-26', summary: 'Annual PF statements for FY 2025-26 have been made available via EPFO portal. Employees are advised to verify their UAN details and download statements.', type: 'payroll', postedBy: 'Accounts Dept.', postedAt: '2026-06-10', isNew: false, isPriority: false, actionLabel: 'EPFO Portal', attachments: [] },
];

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: 'Dr. R. Sharma', role: 'principal', department: 'admin', designation: 'Principal', email: 'rsharma@dps.edu.in', phone: '+91 98100 10001', extension: 'Ext. 001', status: 'online', avatar: 'RS', joinedYear: 2010, isAdmin: true },
  { id: 2, name: 'Ms. P. Nair', role: 'vice_principal', department: 'admin', designation: 'Vice Principal', email: 'pnair@dps.edu.in', phone: '+91 98100 10002', extension: 'Ext. 002', status: 'busy', avatar: 'PN', joinedYear: 2013, isAdmin: true },
  { id: 3, name: 'Mrs. S. Verma', role: 'hod', department: 'academic', designation: 'HOD – Academics / English', email: 'sverma@dps.edu.in', phone: '+91 98100 10010', extension: 'Ext. 010', status: 'online', avatar: 'SV', joinedYear: 2015, subjects: ['English', 'Literature'], isAdmin: false },
  { id: 4, name: 'Dr. Iyer', role: 'hod', department: 'academic', designation: 'HOD – Science / Chemistry', email: 'iyer@dps.edu.in', phone: '+91 98100 10011', extension: 'Ext. 011', status: 'away', avatar: 'DI', joinedYear: 2014, subjects: ['Chemistry', 'Physics'], isAdmin: false },
  { id: 5, name: 'Mrs. Gupta', role: 'teacher', department: 'academic', designation: 'PGT Mathematics', email: 'gupta.m@dps.edu.in', phone: '+91 98100 10020', extension: 'Ext. 020', status: 'online', avatar: 'MG', joinedYear: 2018, subjects: ['Mathematics'], isAdmin: false },
  { id: 6, name: 'Mr. K. Singh', role: 'teacher', department: 'sports', designation: 'Sports Director & PET', email: 'ksingh@dps.edu.in', phone: '+91 98100 10030', extension: 'Ext. 030', status: 'online', avatar: 'KS', joinedYear: 2016, isAdmin: false },
  { id: 7, name: 'Mr. A. Gupta', role: 'accounts', department: 'accounts', designation: 'Senior Accounts Manager', email: 'agupta@dps.edu.in', phone: '+91 98100 10040', extension: 'Ext. 040', status: 'online', avatar: 'AG', joinedYear: 2012, isAdmin: false },
  { id: 8, name: 'Mr. R. Tiwari', role: 'hr', department: 'hr', designation: 'HR & Payroll Manager', email: 'rtiwari@dps.edu.in', phone: '+91 98100 10050', extension: 'Ext. 050', status: 'online', avatar: 'RT', joinedYear: 2017, isAdmin: false },
  { id: 9, name: 'Mr. V. Singh', role: 'admin', department: 'transport', designation: 'Transport Coordinator', email: 'vsingh@dps.edu.in', phone: '+91 98100 10060', extension: 'Ext. 060', status: 'away', avatar: 'VS', joinedYear: 2019, isAdmin: false },
  { id: 10, name: 'Mr. S. Menon', role: 'admin', department: 'hostel', designation: 'Chief Hostel Warden', email: 'smenon@dps.edu.in', phone: '+91 98100 10070', extension: 'Ext. 070', status: 'offline', avatar: 'SM', joinedYear: 2020, isAdmin: false },
  { id: 11, name: 'Ms. Patel', role: 'teacher', department: 'academic', designation: 'PGT English', email: 'patel.e@dps.edu.in', phone: '+91 98100 10021', extension: 'Ext. 021', status: 'online', avatar: 'EP', joinedYear: 2019, subjects: ['English', 'EVS'], isAdmin: false },
  { id: 12, name: 'Mrs. Sunita Gupta', role: 'teacher', department: 'academic', designation: 'PGT Science (Biology)', email: 'sgupta@dps.edu.in', phone: '+91 98100 10022', extension: 'Ext. 022', status: 'busy', avatar: 'SG', joinedYear: 2017, subjects: ['Biology', 'Science'], isAdmin: false },
];

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

const DEPT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  all:        { label: 'All School',      color: 'text-slate-700',   bg: 'bg-slate-100' },
  academic:   { label: 'Academic',        color: 'text-blue-700',    bg: 'bg-blue-50' },
  admin:      { label: 'Administration',  color: 'text-violet-700',  bg: 'bg-violet-50' },
  accounts:   { label: 'Accounts',        color: 'text-emerald-700', bg: 'bg-emerald-50' },
  transport:  { label: 'Transport',       color: 'text-amber-700',   bg: 'bg-amber-50' },
  hostel:     { label: 'Hostel',          color: 'text-rose-700',    bg: 'bg-rose-50' },
  facilities: { label: 'Facilities',      color: 'text-teal-700',    bg: 'bg-teal-50' },
  hr:         { label: 'HR',              color: 'text-orange-700',  bg: 'bg-orange-50' },
  it:         { label: 'IT & Systems',    color: 'text-cyan-700',    bg: 'bg-cyan-50' },
  sports:     { label: 'Sports',          color: 'text-indigo-700',  bg: 'bg-indigo-50' },
};

const HR_TYPE_CFG: Record<HRUpdateType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  payroll:     { label: 'Payroll',      color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <DollarSign className="w-3 h-3" /> },
  leave:       { label: 'Leave',        color: 'text-blue-700',    bg: 'bg-blue-50',    icon: <Calendar className="w-3 h-3" /> },
  policy:      { label: 'Policy',       color: 'text-violet-700',  bg: 'bg-violet-50',  icon: <FileText className="w-3 h-3" /> },
  circular:    { label: 'Circular',     color: 'text-slate-700',   bg: 'bg-slate-100',  icon: <Clipboard className="w-3 h-3" /> },
  training:    { label: 'Training',     color: 'text-amber-700',   bg: 'bg-amber-50',   icon: <GraduationCap className="w-3 h-3" /> },
  holiday:     { label: 'Holiday',      color: 'text-orange-700',  bg: 'bg-orange-50',  icon: <Star className="w-3 h-3" /> },
  appraisal:   { label: 'Appraisal',   color: 'text-rose-700',    bg: 'bg-rose-50',    icon: <Award className="w-3 h-3" /> },
  recruitment: { label: 'Recruitment', color: 'text-teal-700',    bg: 'bg-teal-50',    icon: <Users className="w-3 h-3" /> },
};

const PRIORITY_CFG: Record<NoticePriority, { label: string; color: string; bg: string }> = {
  normal:    { label: 'Normal',    color: 'text-slate-600',   bg: 'bg-slate-100' },
  important: { label: 'Important', color: 'text-amber-700',   bg: 'bg-amber-100' },
  urgent:    { label: 'Urgent',    color: 'text-red-700',     bg: 'bg-red-100' },
};

const ROLE_CFG: Record<StaffRole, { label: string; color: string; bg: string }> = {
  teacher:       { label: 'Teacher',       color: 'text-blue-700',    bg: 'bg-blue-50' },
  hod:           { label: 'HOD',           color: 'text-violet-700',  bg: 'bg-violet-50' },
  admin:         { label: 'Admin Staff',   color: 'text-slate-600',   bg: 'bg-slate-100' },
  vice_principal:{ label: 'Vice Principal',color: 'text-indigo-700',  bg: 'bg-indigo-50' },
  principal:     { label: 'Principal',     color: 'text-rose-700',    bg: 'bg-rose-50' },
  accounts:      { label: 'Accounts',      color: 'text-emerald-700', bg: 'bg-emerald-50' },
  support:       { label: 'Support Staff', color: 'text-amber-700',   bg: 'bg-amber-50' },
  hr:            { label: 'HR',            color: 'text-orange-700',  bg: 'bg-orange-50' },
};

const STATUS_DOT: Record<StaffMember['status'], string> = {
  online:  'bg-emerald-500',
  away:    'bg-amber-400',
  busy:    'bg-red-500',
  offline: 'bg-slate-300',
};

const STATUS_LABEL: Record<StaffMember['status'], string> = {
  online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-700`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏', '✅'];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const StaffHRCommunicationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('noticeboard');
  const [notices, setNotices] = useState<StaffNotice[]>(MOCK_NOTICES);
  const [channels, setChannels] = useState<ChatChannel[]>(MOCK_CHANNELS);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>(CHANNEL_MESSAGES);
  const [hrUpdates] = useState<HRUpdate[]>(MOCK_HR_UPDATES);
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [activeChannelId, setActiveChannelId] = useState<number>(1);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [expandedNotice, setExpandedNotice] = useState<number | null>(1);
  const [noticeFilter, setNoticeFilter] = useState<Department | 'all'>('all');
  const [hrFilter, setHRFilter] = useState<HRUpdateType | 'all'>('all');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState<Department | 'all'>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [newNoticeForm, setNewNoticeForm] = useState({ title: '', body: '', priority: 'normal' as NoticePriority, department: 'all' as Department, tags: '' });
  const [showNewNotice, setShowNewNotice] = useState(false);
  const [postingNotice, setPostingNotice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stats
  const totalOnline = staff.filter(s => s.status === 'online').length;
  const unreadNotices = notices.filter(n => !n.isRead).length;
  const totalUnreadChats = channels.reduce((acc, c) => acc + c.unreadCount, 0);
  const newHRUpdates = hrUpdates.filter(h => h.isNew).length;

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeMessages = messages[activeChannelId] || [];

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (staffDeptFilter !== 'all' && s.department !== staffDeptFilter) return false;
    if (staffSearch && !s.name.toLowerCase().includes(staffSearch.toLowerCase()) &&
        !s.designation.toLowerCase().includes(staffSearch.toLowerCase())) return false;
    return true;
  });

  // Filter HR updates
  const filteredHR = hrUpdates.filter(h => {
    if (hrFilter !== 'all' && h.type !== hrFilter) return false;
    return true;
  });

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeChannelId]);

  // Handlers
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    setSendingMsg(true);
    await new Promise(r => setTimeout(r, 400));
    setSendingMsg(false);
    const newMsg: ChatMessage = {
      id: Date.now(), channelId: activeChannelId, author: 'You',
      authorRole: 'admin', authorDept: 'Administration',
      text: chatInput, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      reactions: {}, isMe: true
    };
    setMessages(prev => ({ ...prev, [activeChannelId]: [...(prev[activeChannelId] || []), newMsg] }));
    setChannels(prev => prev.map(c => c.id === activeChannelId
      ? { ...c, lastMessage: chatInput, lastMessageTime: 'just now', lastMessageBy: 'You' }
      : c));
    setChatInput('');
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages(prev => {
      const channelMsgs = prev[activeChannelId] || [];
      return {
        ...prev,
        [activeChannelId]: channelMsgs.map(m => {
          if (m.id !== msgId) return m;
          return { ...m, reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] || 0) + 1 } };
        })
      };
    });
    setShowEmojiPicker(null);
    toast.success(`Reacted with ${emoji}`);
  };

  const toggleLike = (noticeId: number) => {
    setNotices(prev => prev.map(n => n.id === noticeId
      ? { ...n, likes: n.isLikedByMe ? n.likes - 1 : n.likes + 1, isLikedByMe: !n.isLikedByMe }
      : n));
  };

  const markRead = (noticeId: number) => {
    setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, isRead: true } : n));
  };

  const postNewNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeForm.title.trim() || !newNoticeForm.body.trim()) { toast.error('Title and body required'); return; }
    setPostingNotice(true);
    await new Promise(r => setTimeout(r, 1400));
    setPostingNotice(false);
    const newN: StaffNotice = {
      id: Date.now(), title: newNoticeForm.title, body: newNoticeForm.body,
      postedBy: 'You', postedByRole: 'admin', department: newNoticeForm.department,
      priority: newNoticeForm.priority, postedAt: new Date().toLocaleString('en-IN'),
      isRead: true, isPinned: false, likes: 0, attachments: [],
      tags: newNoticeForm.tags.split(',').map(t => t.trim()).filter(Boolean), isLikedByMe: false
    };
    setNotices(prev => [newN, ...prev]);
    setNewNoticeForm({ title: '', body: '', priority: 'normal', department: 'all', tags: '' });
    setShowNewNotice(false);
    toast.success('📢 Notice posted to staff noticeboard!');
  };

  const sendDirectMessage = (s: StaffMember) => {
    toast.success(`💬 Opening direct message with ${s.name}…`);
    setSelectedStaff(null);
    setActiveTab('channels');
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-700 to-violet-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><Briefcase className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Staff HR & Internal Communication Hub</h1>
            <p className="text-[9px] text-indigo-200 font-medium">Noticeboard · Channels · HR Updates · Staff Directory · Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-200">{totalOnline} Online</span>
          </div>
          {totalUnreadChats > 0 && (
            <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
              <MessageSquare className="w-3 h-3 text-indigo-200" />
              <span className="text-[9px] font-bold">{totalUnreadChats} unread</span>
            </div>
          )}
          <button onClick={() => { setShowNewNotice(true); setActiveTab('noticeboard'); }}
            className="flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Post Notice
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/30 border-b border-indigo-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Staff Online', val: `${totalOnline}/${staff.length}`, icon: <Activity className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Unread Notices', val: unreadNotices, icon: <Megaphone className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Unread Chats', val: totalUnreadChats, icon: <MessageSquare className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'New HR Updates', val: newHRUpdates, icon: <Bell className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'Active Channels', val: channels.length, icon: <Hash className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Total Staff', val: staff.length, icon: <Users className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
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
          { key: 'noticeboard', label: 'Staff Noticeboard',    icon: <Megaphone className="w-3.5 h-3.5" />,    badge: unreadNotices },
          { key: 'channels',    label: 'Team Channels & Chat', icon: <MessageSquare className="w-3.5 h-3.5" />, badge: totalUnreadChats },
          { key: 'hr_updates',  label: 'HR & Payroll Updates', icon: <Briefcase className="w-3.5 h-3.5" />,     badge: newHRUpdates },
          { key: 'directory',   label: 'Staff Directory',       icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'analytics',   label: 'Engagement Analytics',  icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-indigo-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═════════ NOTICEBOARD ═════════ */}
        {activeTab === 'noticeboard' && (
          <div className="max-w-3xl mx-auto p-5 space-y-4">

            {/* Post New Notice Banner */}
            {showNewNotice && (
              <div className="bg-white border-2 border-indigo-200 rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold">Post New Staff Notice</h4>
                  <button onClick={() => setShowNewNotice(false)} className="p-1 hover:bg-white/20 rounded cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
                <form onSubmit={postNewNotice} className="p-4 space-y-3">
                  <input type="text" placeholder="Notice title / subject…" value={newNoticeForm.title}
                    onChange={e => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                  <textarea rows={3} placeholder="Write full notice content here…" value={newNoticeForm.body}
                    onChange={e => setNewNoticeForm({ ...newNoticeForm, body: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                  <div className="grid grid-cols-3 gap-3">
                    <select value={newNoticeForm.priority} onChange={e => setNewNoticeForm({ ...newNoticeForm, priority: e.target.value as NoticePriority })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                      <option value="normal">Normal Priority</option>
                      <option value="important">Important</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                    <select value={newNoticeForm.department} onChange={e => setNewNoticeForm({ ...newNoticeForm, department: e.target.value as Department })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                      {Object.entries(DEPT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <input type="text" placeholder="Tags: meeting, leave…" value={newNoticeForm.tags}
                      onChange={e => setNewNoticeForm({ ...newNoticeForm, tags: e.target.value })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-medium outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewNotice(false)} className="px-3 py-1.5 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-lg cursor-pointer">Cancel</button>
                    <button type="submit" disabled={postingNotice}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                      {postingNotice ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Post Notice
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'academic', 'admin', 'hr', 'accounts'] as const).map(d => (
                <button key={d} onClick={() => setNoticeFilter(d)}
                  className={`text-[8.5px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${noticeFilter === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                  {DEPT_CFG[d]?.label}
                </button>
              ))}
            </div>

            {/* Notice Cards */}
            {notices
              .filter(n => noticeFilter === 'all' || n.department === noticeFilter)
              .map(notice => {
                const pri = PRIORITY_CFG[notice.priority];
                const isExpanded = expandedNotice === notice.id;
                const deptCfg = DEPT_CFG[notice.department] || DEPT_CFG['all'];
                return (
                  <div key={notice.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${!notice.isRead ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
                    {/* Card Header */}
                    <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={() => { setExpandedNotice(isExpanded ? null : notice.id); markRead(notice.id); }}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] flex-shrink-0 ${notice.isPinned ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                        {notice.isPinned ? '📌' : notice.priority === 'urgent' ? '🔴' : notice.priority === 'important' ? '🟡' : '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          {!notice.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />}
                          <span className="text-[10px] font-extrabold text-slate-800">{notice.title}</span>
                          {notice.isPinned && <span className="text-[7.5px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.2 rounded-full">📌 Pinned</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${pri.bg} ${pri.color}`}>{pri.label}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${deptCfg.bg} ${deptCfg.color}`}>{deptCfg.label}</span>
                          <span className="text-[7.5px] text-slate-400 font-medium">By {notice.postedBy} · {notice.postedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); toggleLike(notice.id); }}
                          className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-1 rounded-lg transition cursor-pointer ${notice.isLikedByMe ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500'}`}>
                          <ThumbsUp className="w-3 h-3" /> {notice.likes}
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                        <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line pt-3">{notice.body}</p>
                        {notice.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {notice.attachments.map((f, i) => (
                              <button key={i} onClick={() => toast.success(`Downloading ${f}`)}
                                className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[8.5px] font-bold text-slate-600 px-2 py-1 rounded-lg cursor-pointer">
                                <Download className="w-2.5 h-2.5 text-indigo-500" /> {f}
                              </button>
                            ))}
                          </div>
                        )}
                        {notice.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {notice.tags.map((t, i) => (
                              <span key={i} className="flex items-center gap-0.5 text-[7.5px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                <Tag className="w-2 h-2" /> {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ═════════ CHANNELS & CHAT ═════════ */}
        {activeTab === 'channels' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Channel List */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-y-auto flex flex-col bg-slate-50/40">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Department Channels</p>
                <div className="space-y-0.5">
                  {channels.map(ch => (
                    <button key={ch.id} onClick={() => { setActiveChannelId(ch.id); setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, unreadCount: 0 } : c)); }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${activeChannelId === ch.id ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-white border border-transparent'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold ${ch.color}`}>{ch.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-extrabold text-slate-800 truncate flex items-center gap-1">
                            {ch.isPrivate && <Lock className="w-2.5 h-2.5 text-slate-400" />} {ch.name}
                          </span>
                          {ch.unreadCount > 0 && <span className="bg-indigo-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full ml-1">{ch.unreadCount}</span>}
                        </div>
                        <p className="text-[7.5px] text-slate-400 truncate">{ch.lastMessage}</p>
                        <p className="text-[7px] text-slate-300 font-medium">{ch.lastMessageTime} · {ch.memberCount} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Channel Header */}
              {activeChannel && (
                <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${activeChannel.color}`}>{activeChannel.emoji}</div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1">
                        {activeChannel.isPrivate && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                        {activeChannel.name}
                      </p>
                      <p className="text-[7.5px] text-slate-400">{activeChannel.description} · {activeChannel.memberCount} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toast.success('📹 Starting video call…')} className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition">
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toast.success('📞 Starting voice call…')} className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50/20 to-white">
                {activeMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-[10px]">No messages in this channel yet. Start the conversation!</p>
                  </div>
                )}
                {activeMessages.map(msg => {
                  const roleCfg = ROLE_CFG[msg.authorRole] || ROLE_CFG['admin'];
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 ${msg.isMe ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {msg.author.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className={`max-w-[65%] group relative`}>
                        {!msg.isMe && (
                          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                            <span className="text-[8.5px] font-extrabold text-slate-700">{msg.author}</span>
                            <span className={`text-[7.5px] font-bold px-1 py-0.2 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</span>
                            <span className="text-[7px] text-slate-400">{msg.timestamp}</span>
                          </div>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-[9.5px] leading-relaxed font-medium shadow-sm ${msg.isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                        {msg.isMe && <p className="text-[7px] text-slate-400 text-right mt-0.5 mr-1">{msg.timestamp}</p>}

                        {/* Reactions */}
                        {Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${msg.isMe ? 'justify-end' : ''}`}>
                            {Object.entries(msg.reactions).map(([emoji, count]) => (
                              <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                                className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer">
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Emoji picker trigger */}
                        <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                          className={`absolute ${msg.isMe ? 'left-0 -translate-x-6' : 'right-0 translate-x-6'} top-0 opacity-0 group-hover:opacity-100 p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-500 cursor-pointer shadow-sm transition`}>
                          <Smile className="w-3 h-3" />
                        </button>
                        {showEmojiPicker === msg.id && (
                          <div className={`absolute ${msg.isMe ? 'left-0 -translate-x-32' : 'right-0 translate-x-4'} top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex gap-1`}>
                            {EMOJI_REACTIONS.map(e => (
                              <button key={e} onClick={() => addReaction(msg.id, e)} className="text-[14px] hover:scale-125 transition cursor-pointer">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300 transition">
                  <button onClick={() => toast.success('Uploading file…')} className="p-1 text-slate-400 hover:text-indigo-500 cursor-pointer"><Paperclip className="w-3.5 h-3.5" /></button>
                  <input type="text" placeholder={`Message #${activeChannel?.name || 'channel'}…`} value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1 bg-transparent text-[10px] font-medium outline-none text-slate-700 placeholder-slate-400" />
                  <button onClick={sendMessage} disabled={sendingMsg || !chatInput.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer disabled:opacity-40 transition">
                    {sendingMsg ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[7.5px] text-slate-400 mt-1 ml-1">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ HR & PAYROLL UPDATES ═════════ */}
        {activeTab === 'hr_updates' && (
          <div className="max-w-3xl mx-auto p-5 space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'payroll', 'leave', 'appraisal', 'training', 'holiday', 'policy', 'recruitment'] as const).map(type => {
                const cfg = type === 'all' ? null : HR_TYPE_CFG[type as HRUpdateType];
                return (
                  <button key={type} onClick={() => setHRFilter(type)}
                    className={`flex items-center gap-1 text-[8.5px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${hrFilter === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                    {cfg && <span className={cfg.color}>{cfg.icon}</span>}
                    {type === 'all' ? 'All Updates' : cfg?.label}
                  </button>
                );
              })}
            </div>

            {/* HR Update Cards */}
            {filteredHR.map(upd => {
              const typeCfg = HR_TYPE_CFG[upd.type];
              return (
                <div key={upd.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${upd.isPriority ? 'border-indigo-200' : 'border-slate-200'}`}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                      <span className={typeCfg.color}>{typeCfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-extrabold text-slate-800">{upd.title}</span>
                            {upd.isNew && <span className="text-[7px] font-extrabold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>}
                            {upd.isPriority && <span className="text-[7px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">⚡ Priority</span>}
                          </div>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                          <span className="text-[7.5px] text-slate-400 ml-2">· {upd.postedBy} · {upd.postedAt}</span>
                        </div>
                        {upd.actionLabel && (
                          <button onClick={() => toast.success(`Opening: ${upd.actionLabel}`)}
                            className="flex items-center gap-1 text-[8.5px] font-extrabold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg cursor-pointer transition flex-shrink-0">
                            <ChevronRight className="w-3 h-3" /> {upd.actionLabel}
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed mt-1.5">{upd.summary}</p>
                      {upd.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {upd.attachments.map((att, i) => (
                            <button key={i} onClick={() => toast.success(`Downloading: ${att}`)}
                              className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[8px] font-bold text-slate-600 px-2 py-0.5 rounded-lg cursor-pointer">
                              <Download className="w-2.5 h-2.5 text-indigo-400" /> {att}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═════════ STAFF DIRECTORY ═════════ */}
        {activeTab === 'directory' && (
          <div className="flex h-full" style={{ minHeight: '100%' }}>

            {/* Left: Directory list */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Search & Filter */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search staff by name, designation…" value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <select value={staffDeptFilter} onChange={e => setStaffDeptFilter(e.target.value as Department | 'all')}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-[9px] font-bold bg-white outline-none">
                  {Object.entries(DEPT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Status summary */}
              <div className="flex items-center gap-3 mb-4 text-[8.5px] font-bold">
                {(['online', 'away', 'busy', 'offline'] as const).map(s => (
                  <span key={s} className="flex items-center gap-1 text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                    {STATUS_LABEL[s]}: <span className="text-slate-700">{staff.filter(m => m.status === s).length}</span>
                  </span>
                ))}
              </div>

              {/* Grid of staff cards */}
              <div className="grid grid-cols-3 gap-3">
                {filteredStaff.map(member => {
                  const roleCfg = ROLE_CFG[member.role] || ROLE_CFG['admin'];
                  const deptCfg = DEPT_CFG[member.department] || DEPT_CFG['all'];
                  return (
                    <div key={member.id} onClick={() => setSelectedStaff(member)}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition group">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="relative flex-shrink-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-extrabold ${roleCfg.bg} ${roleCfg.color}`}>
                            {member.avatar}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[member.status]}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9.5px] font-extrabold text-slate-800 truncate">{member.name}</p>
                          <p className="text-[8px] text-slate-500 truncate">{member.designation}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${deptCfg.bg} ${deptCfg.color}`}>{deptCfg.label}</span>
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={e => { e.stopPropagation(); sendDirectMessage(member); }}
                          className="flex-1 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5">
                          <MessageSquare className="w-2.5 h-2.5" /> Message
                        </button>
                        <button onClick={e => { e.stopPropagation(); toast.success(`Calling ${member.phone}`); }}
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer">
                          <Phone className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); toast.success(`Emailing ${member.email}`); }}
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer">
                          <Mail className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Profile Detail */}
            {selectedStaff && (
              <div className="w-72 flex-shrink-0 border-l border-slate-200 overflow-y-auto bg-slate-50/40 p-4 space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setSelectedStaff(null)} className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-400"><X className="w-3.5 h-3.5" /></button>
                </div>
                {(() => {
                  const m = selectedStaff;
                  const roleCfg = ROLE_CFG[m.role] || ROLE_CFG['admin'];
                  const deptCfg = DEPT_CFG[m.department] || DEPT_CFG['all'];
                  return (
                    <>
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-extrabold mx-auto ${roleCfg.bg} ${roleCfg.color}`}>
                            {m.avatar}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${STATUS_DOT[m.status]}`} />
                        </div>
                        <h3 className="text-[12px] font-extrabold text-slate-800">{m.name}</h3>
                        <p className="text-[9px] text-slate-500 font-medium">{m.designation}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${deptCfg.bg} ${deptCfg.color}`}>{deptCfg.label}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { icon: <Mail className="w-3 h-3 text-indigo-400" />, label: 'Email', val: m.email },
                          { icon: <Phone className="w-3 h-3 text-emerald-400" />, label: 'Phone', val: m.phone },
                          { icon: <Hash className="w-3 h-3 text-slate-400" />, label: 'Extension', val: m.extension },
                          { icon: <Calendar className="w-3 h-3 text-amber-400" />, label: 'Joined', val: `Since ${m.joinedYear}` },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2">
                            {item.icon}
                            <div>
                              <p className="text-[7.5px] text-slate-400 font-medium">{item.label}</p>
                              <p className="text-[9px] font-bold text-slate-700">{item.val}</p>
                            </div>
                          </div>
                        ))}
                        {m.subjects && m.subjects.length > 0 && (
                          <div className="bg-white border border-slate-100 rounded-xl px-3 py-2">
                            <p className="text-[7.5px] text-slate-400 font-medium mb-1">Subjects</p>
                            <div className="flex flex-wrap gap-1">
                              {m.subjects.map((s, i) => <span key={i} className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{s}</span>)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => sendDirectMessage(m)} className="flex items-center justify-center gap-1 bg-indigo-600 text-white text-[9px] font-extrabold py-2 rounded-xl cursor-pointer hover:bg-indigo-700 transition">
                          <MessageSquare className="w-3 h-3" /> Message
                        </button>
                        <button onClick={() => toast.success(`Calling ${m.phone}`)} className="flex items-center justify-center gap-1 border border-slate-200 text-slate-600 text-[9px] font-extrabold py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                          <Phone className="w-3 h-3" /> Call
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═════════ ANALYTICS ═════════ */}
        {activeTab === 'analytics' && (
          <div className="max-w-3xl mx-auto p-5 space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Staff Online Now', val: `${totalOnline}/${staff.length}`, sub: 'Currently active', color: 'text-emerald-600' },
                { label: 'Notices This Month', val: notices.length, sub: `${unreadNotices} unread`, color: 'text-indigo-600' },
                { label: 'HR Updates Pending', val: newHRUpdates, sub: 'Action required', color: 'text-amber-600' },
                { label: 'Avg Satisfaction', val: '4.2 / 5', sub: 'Staff pulse survey', color: 'text-violet-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <h4 className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</h4>
                  <div className={`text-[20px] font-extrabold mt-1 ${k.color}`}>{k.val}</div>
                  <p className="text-[8px] text-slate-500 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Channel Activity */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Channel Engagement Metrics</h3>
              {channels.map(ch => (
                <div key={ch.id} className="flex items-center gap-3">
                  <span className="text-[10px] w-6">{ch.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-700 w-36 truncate">{ch.name}</span>
                  <div className="flex-1"><MiniBar value={ch.memberCount} max={87} color="bg-indigo-400" /></div>
                  <span className="text-[8.5px] font-extrabold text-slate-600 w-16 text-right">{ch.memberCount} members</span>
                </div>
              ))}
            </div>

            {/* HR Update distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">HR Update Category Distribution</h3>
              {Object.entries(HR_TYPE_CFG).map(([k, v]) => {
                const count = hrUpdates.filter(h => h.type === k).length;
                if (count === 0) return null;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className={`${v.color} w-4`}>{v.icon}</span>
                    <span className="text-[9px] font-bold text-slate-700 w-24">{v.label}</span>
                    <div className="flex-1"><MiniBar value={count} max={hrUpdates.length} color="bg-violet-400" /></div>
                    <span className="text-[8.5px] font-extrabold text-slate-600">{count}</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Department presence */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Department Online Presence</h3>
              {['academic', 'admin', 'accounts', 'hr', 'transport'].map(dept => {
                const deptStaff = staff.filter(s => s.department === dept);
                const onlineCount = deptStaff.filter(s => s.status === 'online').length;
                const cfg = DEPT_CFG[dept];
                return (
                  <div key={dept} className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold ${cfg.color} w-28`}>{cfg.label}</span>
                    <div className="flex-1"><MiniBar value={onlineCount} max={deptStaff.length || 1} color="bg-emerald-400" /></div>
                    <span className="text-[8.5px] font-extrabold text-emerald-600">{onlineCount}/{deptStaff.length} online</span>
                  </div>
                );
              })}
            </div>

            {/* Staff pulse */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
              <Heart className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-indigo-900">Staff Wellbeing Pulse</h4>
                <p className="text-[9px] text-indigo-700 leading-relaxed mt-0.5">
                  Latest staff pulse survey (June 2026) shows an overall engagement score of <strong>4.2 / 5</strong>. Communication transparency rated highest (4.6). Areas for improvement: workload balance (3.8) and infrastructure facilities (3.7). Suggest conducting a department-level focus group session in July for actionable feedback.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffHRCommunicationHub;
