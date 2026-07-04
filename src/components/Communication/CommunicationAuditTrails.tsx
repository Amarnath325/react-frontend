import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, Search, Filter, Download, RefreshCw, Clock,
  CheckCircle, XCircle, AlertTriangle, Eye, Send, Mail,
  Bell, MessageSquare, Smartphone, Volume2, MessageCircle,
  Users, Calendar, ChevronRight, ChevronDown, ChevronUp,
  Shield, Activity, TrendingUp, Hash, User, Tag,
  AlertCircle, Archive, Settings, Trash2, Lock,
  BarChart2, List, Grid, Star, Layers, Zap, Info,
  ArrowUpRight, BookOpen, Database, Copy, ExternalLink,
  UserCheck, Globe
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MainTab = 'timeline' | 'activity' | 'compliance' | 'retention';
type EventType =
  | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced'
  | 'scheduled' | 'cancelled' | 'recalled' | 'edited'
  | 'template_used' | 'broadcast' | 'login' | 'export' | 'deleted';
type ChannelKey = 'sms' | 'email' | 'push' | 'app' | 'pa' | 'whatsapp';
type SeverityLevel = 'info' | 'success' | 'warning' | 'error' | 'critical';
type AudienceKey = 'students' | 'parents' | 'teachers' | 'staff' | 'alumni' | 'all';

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: EventType;
  severity: SeverityLevel;
  actor: string;
  actorRole: string;
  actorAvatar: string;
  action: string;
  description: string;
  channel?: ChannelKey;
  audience?: AudienceKey;
  recipients?: number;
  messageTitle?: string;
  ipAddress: string;
  deviceInfo: string;
  sessionId: string;
  metadata: Record<string, string | number>;
  tags: string[];
  relatedId?: string;
  isRead: boolean;
}

interface UserActivity {
  userId: string;
  name: string;
  role: string;
  avatar: string;
  totalActions: number;
  messagesSent: number;
  broadcastsSent: number;
  lastActive: string;
  topChannel: ChannelKey;
  failureRate: number;
}

interface ComplianceReport {
  id: number;
  name: string;
  period: string;
  generatedOn: string;
  generatedBy: string;
  totalEvents: number;
  criticalEvents: number;
  status: 'ready' | 'generating' | 'scheduled';
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: AuditEntry[] = [
  {
    id: 'AUD-2026-0892', timestamp: '2026-06-24 11:02:14 PM',
    eventType: 'broadcast', severity: 'warning',
    actor: 'Principal Dr. Sharma', actorRole: 'Principal', actorAvatar: 'PS',
    action: 'Emergency broadcast sent',
    description: 'Emergency broadcast "FIRE DRILL — Block C Evacuation" dispatched to all 1420 recipients across 3 channels.',
    channel: 'pa', audience: 'all', recipients: 1420,
    messageTitle: 'FIRE DRILL — Block C Evacuation',
    ipAddress: '192.168.1.10', deviceInfo: 'Chrome 126 / Windows 11',
    sessionId: 'SID-7A3F9', metadata: { channels: 3, templates_used: 1, delivery_rate: 98.5 },
    tags: ['emergency', 'broadcast', 'fire-drill'],
    relatedId: 'INC-2026-0089', isRead: true,
  },
  {
    id: 'AUD-2026-0891', timestamp: '2026-06-24 09:15:42 AM',
    eventType: 'sent', severity: 'success',
    actor: 'Mrs. Anjali Mehta', actorRole: 'Vice Principal', actorAvatar: 'AM',
    action: 'Bulk SMS sent',
    description: 'Fee reminder SMS dispatched to 748 parents for July 2026 fee cycle.',
    channel: 'sms', audience: 'parents', recipients: 748,
    messageTitle: 'Monthly Fee Reminder — July 2026',
    ipAddress: '192.168.1.22', deviceInfo: 'Safari 17 / macOS Sonoma',
    sessionId: 'SID-4D2B1', metadata: { delivered: 742, failed: 6, delivery_rate: 99.2, cost_units: 748 },
    tags: ['fee', 'reminder', 'sms', 'parents'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0890', timestamp: '2026-06-24 08:48:00 AM',
    eventType: 'scheduled', severity: 'info',
    actor: 'Mr. K. Singh', actorRole: 'Class Teacher', actorAvatar: 'KS',
    action: 'Message scheduled',
    description: 'Attendance alert for Batch 12-A scheduled for 4:30 PM to 42 parents via SMS and App.',
    channel: 'app', audience: 'parents', recipients: 42,
    messageTitle: 'Attendance Alert — Batch 12-A',
    ipAddress: '192.168.1.55', deviceInfo: 'Chrome 126 / Android 14',
    sessionId: 'SID-8E1C7', metadata: { scheduled_time: '4:30 PM', channels: 2 },
    tags: ['attendance', 'scheduled', 'parents'],
    isRead: false,
  },
  {
    id: 'AUD-2026-0889', timestamp: '2026-06-23 06:30:02 PM',
    eventType: 'broadcast', severity: 'warning',
    actor: 'Mrs. Anjali Mehta', actorRole: 'Vice Principal', actorAvatar: 'AM',
    action: 'School closure broadcast sent',
    description: 'School closure notice for June 25 sent to all 1420 recipients via 4 channels due to IMD Red Alert.',
    channel: 'sms', audience: 'all', recipients: 1420,
    messageTitle: 'SCHOOL CLOSURE — Heavy Rain Advisory',
    ipAddress: '192.168.1.22', deviceInfo: 'Safari 17 / macOS Sonoma',
    sessionId: 'SID-4D2B1', metadata: { channels: 4, delivered: 1411, read: 1387 },
    tags: ['closure', 'weather', 'emergency'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0888', timestamp: '2026-06-23 05:55:18 PM',
    eventType: 'failed', severity: 'error',
    actor: 'System (Auto)', actorRole: 'Automated', actorAvatar: 'SY',
    action: 'Message delivery failed',
    description: '6 SMS messages failed to deliver for fee reminder campaign. Error: DND/Invalid numbers.',
    channel: 'sms', audience: 'parents', recipients: 6,
    messageTitle: 'Monthly Fee Reminder — July 2026',
    ipAddress: 'SYSTEM', deviceInfo: 'Auto-Scheduler v2.1',
    sessionId: 'SID-AUTO-01', metadata: { error_code: 'SMS_DND', retries: 3, failed_numbers: 6 },
    tags: ['failure', 'sms', 'dnd'],
    relatedId: 'AUD-2026-0891', isRead: false,
  },
  {
    id: 'AUD-2026-0887', timestamp: '2026-06-22 02:14:33 PM',
    eventType: 'broadcast', severity: 'critical',
    actor: 'Admin Control Room', actorRole: 'Admin', actorAvatar: 'AC',
    action: 'Medical emergency alert sent',
    description: 'URGENT medical emergency broadcast sent to teachers and staff (68 recipients) via PA and App.',
    channel: 'pa', audience: 'teachers', recipients: 68,
    messageTitle: '⚠️ MEDICAL EMERGENCY — Student Assistance Required',
    ipAddress: '192.168.1.1', deviceInfo: 'Chrome 126 / Windows Server',
    sessionId: 'SID-CTRL-5', metadata: { channels: 2, response_time_sec: 18 },
    tags: ['medical', 'emergency', 'critical', 'broadcast'],
    relatedId: 'INC-2026-0087', isRead: true,
  },
  {
    id: 'AUD-2026-0886', timestamp: '2026-06-22 01:10:00 PM',
    eventType: 'template_used', severity: 'info',
    actor: 'Admin Control Room', actorRole: 'Admin', actorAvatar: 'AC',
    action: 'Emergency template used',
    description: 'Pre-defined template "Medical Emergency (Staff)" loaded and used for broadcast.',
    channel: undefined, audience: undefined, recipients: undefined,
    messageTitle: 'Medical Emergency Template',
    ipAddress: '192.168.1.1', deviceInfo: 'Chrome 126 / Windows Server',
    sessionId: 'SID-CTRL-5', metadata: { template_id: 4, template_name: 'Medical Emergency (Staff)' },
    tags: ['template', 'medical'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0885', timestamp: '2026-06-22 10:15:09 AM',
    eventType: 'recalled', severity: 'warning',
    actor: 'Principal Dr. Sharma', actorRole: 'Principal', actorAvatar: 'PS',
    action: 'Message recalled',
    description: 'Circular "Revised Uniform Policy" recalled and corrected before final broadcast. 0 recipients affected.',
    channel: 'app', audience: 'all', recipients: 0,
    messageTitle: 'Revised Uniform Policy (DRAFT)',
    ipAddress: '192.168.1.10', deviceInfo: 'Chrome 126 / Windows 11',
    sessionId: 'SID-7A3F9', metadata: { reason: 'Content error - wrong date mentioned' },
    tags: ['recalled', 'circular', 'correction'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0884', timestamp: '2026-06-21 04:00:00 PM',
    eventType: 'export', severity: 'info',
    actor: 'Mr. Rajan Verma', actorRole: 'IT Admin', actorAvatar: 'RV',
    action: 'Audit log exported',
    description: 'Full delivery audit log exported as CSV for June 2026 compliance review.',
    channel: undefined, audience: undefined,
    messageTitle: 'Audit Export — June 2026',
    ipAddress: '192.168.1.100', deviceInfo: 'Firefox 127 / Ubuntu 22.04',
    sessionId: 'SID-IT-02', metadata: { format: 'CSV', records_exported: 892, size_kb: 248 },
    tags: ['export', 'compliance', 'csv'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0883', timestamp: '2026-06-20 09:42:15 AM',
    eventType: 'broadcast', severity: 'critical',
    actor: 'Security Head Mr. Verma', actorRole: 'Security', actorAvatar: 'SV',
    action: 'Security alert broadcast',
    description: 'CRITICAL security alert sent to teachers and staff for unauthorized entry at Gate 3.',
    channel: 'pa', audience: 'teachers', recipients: 68,
    messageTitle: '🔒 SECURITY ALERT — Unauthorized Entry Detected',
    ipAddress: '192.168.1.88', deviceInfo: 'Chrome 126 / Windows 10',
    sessionId: 'SID-SEC-1', metadata: { incident_id: 'INC-2026-0085', all_clear_sent: true },
    tags: ['security', 'emergency', 'critical'],
    relatedId: 'INC-2026-0085', isRead: true,
  },
  {
    id: 'AUD-2026-0882', timestamp: '2026-06-20 08:30:00 AM',
    eventType: 'login', severity: 'info',
    actor: 'Mr. Rajan Verma', actorRole: 'IT Admin', actorAvatar: 'RV',
    action: 'Admin panel login',
    description: 'Successful login to Communication Admin Console from office network.',
    channel: undefined, audience: undefined,
    messageTitle: undefined,
    ipAddress: '192.168.1.100', deviceInfo: 'Firefox 127 / Ubuntu 22.04',
    sessionId: 'SID-IT-02', metadata: { auth_method: '2FA', login_duration_min: 87 },
    tags: ['login', 'admin', 'security'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0881', timestamp: '2026-06-18 10:30:04 AM',
    eventType: 'sent', severity: 'success',
    actor: 'Mrs. Priya Nair', actorRole: 'Admin Staff', actorAvatar: 'PN',
    action: 'PTM invitation sent',
    description: 'Parent-Teacher Meeting invitation dispatched to 812 recipients (parents + teachers) via 3 channels.',
    channel: 'email', audience: 'parents', recipients: 812,
    messageTitle: 'PTM Invitation — July 5th',
    ipAddress: '192.168.1.33', deviceInfo: 'Edge 126 / Windows 11',
    sessionId: 'SID-3C9D2', metadata: { delivered: 800, read: 712, clicked: 0, delivery_rate: 98.5 },
    tags: ['ptm', 'parents', 'teachers', 'event'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0880', timestamp: '2026-06-17 02:00:01 PM',
    eventType: 'bounced', severity: 'warning',
    actor: 'System (Auto)', actorRole: 'Automated', actorAvatar: 'SY',
    action: 'Email bounce detected',
    description: '5 emails bounced for PTM Invitation — mailboxes full or invalid addresses.',
    channel: 'email', audience: 'parents', recipients: 5,
    messageTitle: 'PTM Invitation — July 5th',
    ipAddress: 'SYSTEM', deviceInfo: 'Mail Server v3.2',
    sessionId: 'SID-MAIL-01', metadata: { bounce_type: 'Hard/Soft mix', mailbox_full: 3, invalid_address: 2 },
    tags: ['bounce', 'email', 'failure'],
    relatedId: 'AUD-2026-0881', isRead: false,
  },
  {
    id: 'AUD-2026-0879', timestamp: '2026-06-15 02:00:05 PM',
    eventType: 'sent', severity: 'success',
    actor: 'Principal Dr. Sharma', actorRole: 'Principal', actorAvatar: 'PS',
    action: 'Summer vacation circular sent',
    description: 'Summer vacation notice sent to all 1420 stakeholders via 4 channels.',
    channel: 'sms', audience: 'all', recipients: 1420,
    messageTitle: 'Summer Vacation Notice 2026',
    ipAddress: '192.168.1.10', deviceInfo: 'Chrome 126 / Windows 11',
    sessionId: 'SID-7A3F9', metadata: { channels: 4, delivered: 1405, read: 1190 },
    tags: ['circular', 'vacation', 'all-stakeholders'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0878', timestamp: '2026-06-15 01:15:00 PM',
    eventType: 'edited', severity: 'info',
    actor: 'Principal Dr. Sharma', actorRole: 'Principal', actorAvatar: 'PS',
    action: 'Message edited before sending',
    description: 'Summer vacation notice edited 2 times before final dispatch — dates corrected.',
    channel: undefined, audience: undefined,
    messageTitle: 'Summer Vacation Notice 2026',
    ipAddress: '192.168.1.10', deviceInfo: 'Chrome 126 / Windows 11',
    sessionId: 'SID-7A3F9', metadata: { edits: 2, last_edit_reason: 'Date correction' },
    tags: ['edit', 'draft', 'circular'],
    isRead: true,
  },
  {
    id: 'AUD-2026-0877', timestamp: '2026-06-12 11:00:02 AM',
    eventType: 'sent', severity: 'success',
    actor: 'Exam Controller', actorRole: 'Exam Department', actorAvatar: 'EC',
    action: 'Exam timetable sent',
    description: 'Annual exam timetable notification sent to 1620 recipients (students + parents) via 3 channels.',
    channel: 'app', audience: 'students', recipients: 1620,
    messageTitle: 'Exam Timetable — Annual Exams 2026',
    ipAddress: '192.168.1.44', deviceInfo: 'Chrome 126 / Windows 10',
    sessionId: 'SID-EX-3', metadata: { delivered: 1608, read: 1420, clicked: 890 },
    tags: ['exam', 'timetable', 'academic'],
    isRead: true,
  },
];

const USER_ACTIVITIES: UserActivity[] = [
  { userId: 'USR-001', name: 'Principal Dr. Sharma', role: 'Principal', avatar: 'PS', totalActions: 284, messagesSent: 42, broadcastsSent: 8, lastActive: '2026-06-24 11:02 PM', topChannel: 'app', failureRate: 0.8 },
  { userId: 'USR-002', name: 'Mrs. Anjali Mehta', role: 'Vice Principal', avatar: 'AM', totalActions: 196, messagesSent: 38, broadcastsSent: 5, lastActive: '2026-06-24 09:15 AM', topChannel: 'sms', failureRate: 1.2 },
  { userId: 'USR-003', name: 'Mr. Rajan Verma', role: 'IT Admin', avatar: 'RV', totalActions: 142, messagesSent: 0, broadcastsSent: 0, lastActive: '2026-06-21 04:00 PM', topChannel: 'email', failureRate: 0.0 },
  { userId: 'USR-004', name: 'Admin Control Room', role: 'Admin', avatar: 'AC', totalActions: 118, messagesSent: 22, broadcastsSent: 14, lastActive: '2026-06-22 02:14 PM', topChannel: 'pa', failureRate: 0.4 },
  { userId: 'USR-005', name: 'Mrs. Priya Nair', role: 'Admin Staff', avatar: 'PN', totalActions: 89, messagesSent: 18, broadcastsSent: 2, lastActive: '2026-06-18 10:30 AM', topChannel: 'email', failureRate: 1.8 },
  { userId: 'USR-006', name: 'Exam Controller', role: 'Exam Dept.', avatar: 'EC', totalActions: 64, messagesSent: 12, broadcastsSent: 1, lastActive: '2026-06-12 11:00 AM', topChannel: 'app', failureRate: 0.6 },
  { userId: 'USR-007', name: 'Security Head Mr. Verma', role: 'Security', avatar: 'SV', totalActions: 28, messagesSent: 4, broadcastsSent: 3, lastActive: '2026-06-20 09:42 AM', topChannel: 'pa', failureRate: 2.1 },
];

const COMPLIANCE_REPORTS: ComplianceReport[] = [
  { id: 1, name: 'Monthly Communication Audit — June 2026', period: '01 Jun – 30 Jun 2026', generatedOn: '2026-06-21 04:00 PM', generatedBy: 'Mr. Rajan Verma', totalEvents: 892, criticalEvents: 4, status: 'ready' },
  { id: 2, name: 'Emergency Broadcast Compliance Report', period: '01 Jan – 30 Jun 2026', generatedOn: '2026-06-24 10:00 AM', generatedBy: 'Principal Dr. Sharma', totalEvents: 48, criticalEvents: 12, status: 'ready' },
  { id: 3, name: 'User Activity Audit — June 2026', period: '01 Jun – 30 Jun 2026', generatedOn: '2026-06-24 05:00 PM', generatedBy: 'System (Scheduled)', totalEvents: 921, criticalEvents: 2, status: 'generating' },
  { id: 4, name: 'Annual Communication Audit 2025–26', period: '01 Apr 2025 – 31 Mar 2026', generatedOn: '2026-07-01 08:00 AM', generatedBy: 'System (Scheduled)', totalEvents: 0, criticalEvents: 0, status: 'scheduled' },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const EVENT_CFG: Record<EventType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  sent:          { label: 'Sent',           icon: <Send className="w-3 h-3" />,        color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  delivered:     { label: 'Delivered',      icon: <CheckCircle className="w-3 h-3" />, color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-200' },
  read:          { label: 'Read',           icon: <Eye className="w-3 h-3" />,         color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  failed:        { label: 'Failed',         icon: <XCircle className="w-3 h-3" />,     color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
  bounced:       { label: 'Bounced',        icon: <AlertTriangle className="w-3 h-3" />,color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-200' },
  scheduled:     { label: 'Scheduled',      icon: <Clock className="w-3 h-3" />,       color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200' },
  cancelled:     { label: 'Cancelled',      icon: <XCircle className="w-3 h-3" />,     color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  recalled:      { label: 'Recalled',       icon: <RefreshCw className="w-3 h-3" />,   color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  edited:        { label: 'Edited',         icon: <FileText className="w-3 h-3" />,    color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  template_used: { label: 'Template Used',  icon: <Layers className="w-3 h-3" />,      color: 'text-cyan-700',    bg: 'bg-cyan-50',     border: 'border-cyan-200' },
  broadcast:     { label: 'Broadcast',      icon: <Bell className="w-3 h-3" />,        color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200' },
  login:         { label: 'Login',          icon: <Lock className="w-3 h-3" />,        color: 'text-slate-700',   bg: 'bg-slate-50',    border: 'border-slate-200' },
  export:        { label: 'Data Export',    icon: <Download className="w-3 h-3" />,    color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200' },
  deleted:       { label: 'Deleted',        icon: <Trash2 className="w-3 h-3" />,      color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
};

const SEVERITY_CFG: Record<SeverityLevel, { label: string; color: string; bg: string; border: string; dot: string; left: string }> = {
  info:     { label: 'Info',     color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-400',    left: 'border-l-blue-300' },
  success:  { label: 'Success',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', left: 'border-l-emerald-400' },
  warning:  { label: 'Warning',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',   left: 'border-l-amber-400' },
  error:    { label: 'Error',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     left: 'border-l-red-400' },
  critical: { label: 'Critical', color: 'text-red-800',     bg: 'bg-red-100',    border: 'border-red-300',     dot: 'bg-red-600',     left: 'border-l-red-600' },
};

const CHANNEL_CFG: Record<ChannelKey, { label: string; icon: React.ReactNode; color: string }> = {
  sms:      { label: 'SMS',       icon: <MessageSquare className="w-3 h-3" />, color: 'text-green-700 bg-green-50 border-green-200' },
  email:    { label: 'Email',     icon: <Mail className="w-3 h-3" />,          color: 'text-violet-700 bg-violet-50 border-violet-200' },
  push:     { label: 'Push',      icon: <Bell className="w-3 h-3" />,          color: 'text-blue-700 bg-blue-50 border-blue-200' },
  app:      { label: 'App',       icon: <Smartphone className="w-3 h-3" />,    color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  pa:       { label: 'PA',        icon: <Volume2 className="w-3 h-3" />,       color: 'text-orange-700 bg-orange-50 border-orange-200' },
  whatsapp: { label: 'WhatsApp',  icon: <MessageCircle className="w-3 h-3" />, color: 'text-teal-700 bg-teal-50 border-teal-200' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600', 'from-teal-500 to-cyan-600',
  'from-slate-600 to-slate-800', 'from-indigo-500 to-blue-700',
];

const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CommunicationAuditTrails: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('timeline');
  const [entries, setEntries] = useState<AuditEntry[]>(MOCK_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(MOCK_ENTRIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [eventFilter, setEventFilter] = useState<EventType | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelKey | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('2026-06');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');

  // Retention settings state
  const [retentionDays, setRetentionDays] = useState(365);
  const [autoArchive, setAutoArchive] = useState(true);
  const [alertOnCritical, setAlertOnCritical] = useState(true);
  const [compressOld, setCompressOld] = useState(true);
  const [gdprMode, setGdprMode] = useState(false);

  // Live mode counter
  useEffect(() => {
    if (!liveMode) return;
    const iv = setInterval(() => setLiveCount(p => p + 1), 5000);
    return () => clearInterval(iv);
  }, [liveMode]);

  // Derived stats
  const totalEvents   = entries.length;
  const criticalCount = entries.filter(e => e.severity === 'critical').length;
  const errorCount    = entries.filter(e => e.severity === 'error').length;
  const unreadCount   = entries.filter(e => !e.isRead).length;
  const broadcastCount = entries.filter(e => e.eventType === 'broadcast').length;

  // Filtered entries
  const filtered = entries.filter(e => {
    if (unreadOnly && e.isRead) return false;
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (eventFilter !== 'all' && e.eventType !== eventFilter) return false;
    if (channelFilter !== 'all' && e.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.messageTitle || '').toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      );
    }
    return true;
  });

  const markAllRead = () => {
    setEntries(prev => prev.map(e => ({ ...e, isRead: true })));
    toast.success('All audit entries marked as read.');
  };

  const generateComplianceReport = async () => {
    setGeneratingReport(true);
    await new Promise(r => setTimeout(r, 2000));
    setGeneratingReport(false);
    toast.success(`📋 Compliance report generated as ${reportFormat.toUpperCase()}!`);
  };

  const copyEntryId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied: ${id}`);
  };

  // Group entries by date
  const grouped = filtered.reduce((acc, e) => {
    const date = e.timestamp.split(' ')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {} as Record<string, AuditEntry[]>);

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><Shield className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Communication Audit Trails</h1>
            <p className="text-[9px] text-slate-300 font-medium">Immutable Log · User Activity · Compliance · Retention Policy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live mode */}
          <button onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8.5px] font-extrabold transition cursor-pointer ${liveMode ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {liveMode ? `Live +${liveCount} events` : 'Live Monitor'}
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full text-[8.5px] font-bold cursor-pointer hover:bg-amber-500/30 transition">
              <Eye className="w-3 h-3" /> Mark all read ({unreadCount})
            </button>
          )}
          <button onClick={() => setActiveTab('compliance')}
            className="flex items-center gap-1.5 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Total Events', val: totalEvents, icon: <Activity className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Critical', val: criticalCount, icon: <AlertCircle className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Errors', val: errorCount, icon: <XCircle className="w-3 h-3" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Broadcasts', val: broadcastCount, icon: <Bell className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'Unread', val: unreadCount, icon: <BookOpen className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Users Tracked', val: USER_ACTIVITIES.length, icon: <Users className="w-3 h-3" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Retention', val: `${retentionDays}d`, icon: <Database className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto">
        {([
          { key: 'timeline',   label: 'Audit Timeline',    icon: <List className="w-3.5 h-3.5" />,     badge: unreadCount },
          { key: 'activity',   label: 'User Activity',     icon: <UserCheck className="w-3.5 h-3.5" />,badge: USER_ACTIVITIES.length },
          { key: 'compliance', label: 'Compliance Reports',icon: <FileText className="w-3.5 h-3.5" />, badge: COMPLIANCE_REPORTS.filter(r => r.status === 'ready').length },
          { key: 'retention',  label: 'Retention Policy',  icon: <Database className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-slate-900 border-b-2 border-slate-800 bg-slate-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full ${t.key === 'timeline' ? 'bg-amber-500' : 'bg-slate-700'} text-white`}>
                {(t as any).badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════ TIMELINE TAB ═══════ */}
        {activeTab === 'timeline' && (
          <div className="flex h-full">
            {/* ── LEFT: Filter + Log List ── */}
            <div className="w-[340px] flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden">
              {/* Filters */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2.5 z-10 space-y-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search ID, actor, action, message…" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Severity</option>
                    {(Object.keys(SEVERITY_CFG) as SeverityLevel[]).map(s => (
                      <option key={s} value={s}>{SEVERITY_CFG[s].label}</option>
                    ))}
                  </select>
                  <select value={eventFilter} onChange={e => setEventFilter(e.target.value as any)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Event Types</option>
                    {(Object.keys(EVENT_CFG) as EventType[]).map(et => (
                      <option key={et} value={et}>{EVENT_CFG[et].label}</option>
                    ))}
                  </select>
                  <select value={channelFilter} onChange={e => setChannelFilter(e.target.value as any)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white outline-none">
                    <option value="all">All Channels</option>
                    {(Object.keys(CHANNEL_CFG) as ChannelKey[]).map(ch => (
                      <option key={ch} value={ch}>{CHANNEL_CFG[ch].label}</option>
                    ))}
                  </select>
                  <button onClick={() => setUnreadOnly(!unreadOnly)}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition ${unreadOnly ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                    <BookOpen className="w-3 h-3" /> Unread Only
                  </button>
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-400 font-medium">
                  <span>{filtered.length} of {totalEvents} events</span>
                  <button onClick={() => { setSearchQuery(''); setSeverityFilter('all'); setEventFilter('all'); setChannelFilter('all'); setUnreadOnly(false); }}
                    className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-700">Clear Filters</button>
                </div>
              </div>

              {/* Timeline list grouped by date */}
              <div className="flex-1 overflow-y-auto">
                {Object.entries(grouped).map(([date, dayEntries]) => (
                  <div key={date}>
                    {/* Date divider */}
                    <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-50 border-b border-t border-slate-100 flex items-center gap-2">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">{date}</span>
                      <span className="text-[7.5px] text-slate-400 font-medium">({dayEntries.length} events)</span>
                    </div>
                    {dayEntries.map(entry => {
                      const sc = SEVERITY_CFG[entry.severity];
                      const ec = EVENT_CFG[entry.eventType];
                      const isSelected = selectedEntry?.id === entry.id;
                      return (
                        <div key={entry.id}
                          onClick={() => { setSelectedEntry(entry); setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isRead: true } : e)); }}
                          className={`relative px-4 py-3 cursor-pointer border-l-4 transition hover:bg-slate-50 ${sc.left} ${isSelected ? 'bg-indigo-50/40' : 'bg-white'} ${!entry.isRead ? 'font-semibold' : ''}`}>
                          {!entry.isRead && (
                            <span className="absolute right-3 top-3.5 w-2 h-2 bg-amber-400 rounded-full" />
                          )}
                          <div className="flex items-start gap-2.5">
                            {/* Actor avatar */}
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColor(entry.actorAvatar)} flex items-center justify-center text-white text-[8px] font-extrabold flex-shrink-0 mt-0.5`}>
                              {entry.actorAvatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className={`flex items-center gap-1 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border ${ec.color} ${ec.bg} ${ec.border}`}>
                                  {ec.icon} {ec.label}
                                </span>
                                <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>
                                  {sc.label}
                                </span>
                              </div>
                              <p className={`text-[9.5px] text-slate-800 leading-snug ${!entry.isRead ? 'font-extrabold' : 'font-bold'} line-clamp-2`}>{entry.action}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[7.5px] text-slate-400 font-medium">
                                <span>{entry.actor}</span>
                                <span>{entry.timestamp.split(' ').slice(1).join(' ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <Shield className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-[10px] font-bold">No audit entries found</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Entry Detail ── */}
            <div className="flex-1 overflow-y-auto">
              {!selectedEntry ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <Shield className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-[11px] font-bold">Select an audit entry to view details</p>
                </div>
              ) : (() => {
                const sc = SEVERITY_CFG[selectedEntry.severity];
                const ec = EVENT_CFG[selectedEntry.eventType];
                return (
                  <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className={`border-l-4 ${sc.left} pl-5 py-1`}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`flex items-center gap-1.5 text-[8px] font-extrabold px-2 py-1 rounded-full border ${ec.color} ${ec.bg} ${ec.border}`}>
                          {ec.icon} {ec.label}
                        </span>
                        <span className={`text-[8px] font-extrabold px-2 py-1 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</span>
                        <button onClick={() => copyEntryId(selectedEntry.id)}
                          className="flex items-center gap-1 text-[8px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full cursor-pointer hover:bg-slate-200 transition font-mono">
                          <Hash className="w-2.5 h-2.5" /> {selectedEntry.id} <Copy className="w-2.5 h-2.5" />
                        </button>
                        {selectedEntry.relatedId && (
                          <span className="flex items-center gap-1 text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full font-mono">
                            <ExternalLink className="w-2.5 h-2.5" /> {selectedEntry.relatedId}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[14px] font-extrabold text-slate-900">{selectedEntry.action}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {selectedEntry.timestamp} · by <strong className="text-slate-700">{selectedEntry.actor}</strong> ({selectedEntry.actorRole})
                      </p>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Event Description</h4>
                      <p className="text-[10px] text-slate-700 leading-relaxed">{selectedEntry.description}</p>
                      {selectedEntry.messageTitle && (
                        <div className="mt-3 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium">Related Message</p>
                            <p className="text-[9.5px] font-bold text-slate-800">{selectedEntry.messageTitle}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2-column detail grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Channel + Audience */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Delivery Info</h4>
                        {selectedEntry.channel && (
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-lg border ${CHANNEL_CFG[selectedEntry.channel].color}`}>
                              {CHANNEL_CFG[selectedEntry.channel].icon} {CHANNEL_CFG[selectedEntry.channel].label}
                            </span>
                            <span className="text-[8.5px] text-slate-400 font-medium">Channel</span>
                          </div>
                        )}
                        {selectedEntry.audience && (
                          <div className="flex items-center gap-2 text-[8.5px] text-slate-600">
                            <Users className="w-3 h-3 text-slate-400" /> Audience: <strong>{selectedEntry.audience}</strong>
                          </div>
                        )}
                        {selectedEntry.recipients !== undefined && (
                          <div className="flex items-center gap-2 text-[8.5px] text-slate-600">
                            <Globe className="w-3 h-3 text-slate-400" /> Recipients: <strong className="text-indigo-600">{selectedEntry.recipients.toLocaleString()}</strong>
                          </div>
                        )}
                        {!selectedEntry.channel && !selectedEntry.audience && (
                          <p className="text-[8.5px] text-slate-400">No delivery target for this event type.</p>
                        )}
                      </div>

                      {/* Session / Device */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Session Details</h4>
                        <div className="space-y-1.5 text-[8.5px] text-slate-600">
                          <div className="flex items-center gap-2"><Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />IP: <span className="font-mono font-bold text-slate-800">{selectedEntry.ipAddress}</span></div>
                          <div className="flex items-start gap-2"><Smartphone className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /><span>{selectedEntry.deviceInfo}</span></div>
                          <div className="flex items-center gap-2"><Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />Session: <span className="font-mono font-bold text-slate-800 text-[8px]">{selectedEntry.sessionId}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {Object.keys(selectedEntry.metadata).length > 0 && (
                      <div className="bg-slate-900 rounded-2xl p-4 space-y-2">
                        <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Raw Metadata</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(selectedEntry.metadata).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2 text-[8.5px]">
                              <span className="text-slate-500 font-mono">{k}:</span>
                              <span className="text-emerald-400 font-bold font-mono">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedEntry.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {selectedEntry.tags.map((tag, i) => (
                          <span key={i} className="text-[7.5px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Tamper-proof notice */}
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-[9.5px] font-extrabold text-emerald-800">Tamper-Proof Record</p>
                        <p className="text-[8.5px] text-emerald-700 mt-0.5">This audit entry is cryptographically signed and cannot be modified. Any alteration will invalidate the hash chain.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═══════ USER ACTIVITY TAB ═══════ */}
        {activeTab === 'activity' && (
          <div className="p-4 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {USER_ACTIVITIES.map((u, idx) => {
                const topCh = CHANNEL_CFG[u.topChannel];
                return (
                  <div key={u.userId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className="relative flex-shrink-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(u.avatar)} flex items-center justify-center text-white font-extrabold text-[11px]`}>{u.avatar}</div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-white rounded-full text-[7px] font-extrabold flex items-center justify-center">#{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-extrabold text-slate-800 truncate">{u.name}</p>
                        <p className="text-[8.5px] text-slate-500">{u.role}</p>
                        <p className="text-[7.5px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Last active: {u.lastActive}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-[7.5px] font-bold px-2 py-1 rounded-lg border ${topCh.color} flex-shrink-0`}>
                        {topCh.icon} {topCh.label}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-0 border-t border-slate-100 divide-x divide-slate-100">
                      {[
                        { label: 'Actions', val: u.totalActions, color: 'text-slate-700' },
                        { label: 'Sent', val: u.messagesSent, color: 'text-emerald-600' },
                        { label: 'Broadcasts', val: u.broadcastsSent, color: 'text-rose-600' },
                        { label: 'Fail%', val: `${u.failureRate}%`, color: u.failureRate > 2 ? 'text-red-600' : 'text-slate-500' },
                      ].map((k, i) => (
                        <div key={i} className="py-2.5 text-center">
                          <p className={`text-[13px] font-extrabold ${k.color}`}>{k.val}</p>
                          <p className="text-[7.5px] text-slate-400 font-bold">{k.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activity event breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Event Type Distribution</h3>
              {(Object.keys(EVENT_CFG) as EventType[]).filter(et =>
                entries.some(e => e.eventType === et)
              ).map(et => {
                const count = entries.filter(e => e.eventType === et).length;
                const pct = Math.round((count / totalEvents) * 100);
                const ec = EVENT_CFG[et];
                return (
                  <div key={et} className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[7.5px] font-bold px-2 py-0.5 rounded-full border w-28 flex-shrink-0 ${ec.color} ${ec.bg} ${ec.border}`}>
                      {ec.icon} {ec.label}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full ${ec.bg.replace('-50', '-400')} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-600 w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>

            {/* Severity distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[11px] font-extrabold text-slate-800 mb-4">Severity Distribution</h3>
              <div className="flex items-end gap-3 h-28">
                {(Object.keys(SEVERITY_CFG) as SeverityLevel[]).map(s => {
                  const count = entries.filter(e => e.severity === s).length;
                  const pct = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                  const sc = SEVERITY_CFG[s];
                  const barColor = s === 'info' ? 'bg-blue-400' : s === 'success' ? 'bg-emerald-500' : s === 'warning' ? 'bg-amber-500' : s === 'error' ? 'bg-red-400' : 'bg-red-700';
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                      <span className="text-[8px] font-extrabold text-slate-600">{count}</span>
                      <div className="w-full flex items-end" style={{ height: 80 }}>
                        <div className={`w-full ${barColor} rounded-t-lg opacity-80 group-hover:opacity-100 transition`} style={{ height: `${Math.max(4, pct)}%` }} />
                      </div>
                      <p className={`text-[7.5px] font-bold ${sc.color}`}>{sc.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ COMPLIANCE TAB ═══════ */}
        {activeTab === 'compliance' && (
          <div className="p-4 space-y-5">
            {/* Custom report builder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-700" />
                <h3 className="text-[12px] font-extrabold text-slate-800">Generate Compliance Report</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Report Period</label>
                  <input type="month" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-medium bg-white outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Export Format</label>
                  <div className="flex gap-1.5 mt-1">
                    {(['pdf', 'csv', 'xlsx'] as const).map(f => (
                      <button key={f} onClick={() => setReportFormat(f)}
                        className={`flex-1 py-2 rounded-xl border text-[9px] font-extrabold cursor-pointer transition ${reportFormat === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Include Sections</label>
                  <div className="grid grid-cols-1 gap-1 mt-1.5">
                    {['All Events Log', 'User Activity', 'Critical Events Only', 'Failure Analysis'].map((s, i) => (
                      <label key={i} className="flex items-center gap-2 text-[9px] font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 3} className="accent-slate-700" />{s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={generateComplianceReport} disabled={generatingReport}
                className="w-full py-3 bg-gradient-to-r from-slate-800 to-indigo-800 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shadow-sm disabled:opacity-50">
                {generatingReport
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Report…</>
                  : <><Download className="w-4 h-4" /> Generate {reportFormat.toUpperCase()} Compliance Report</>}
              </button>
            </div>

            {/* Past reports */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Archive className="w-4 h-4 text-slate-500" /> Compliance Report Archive</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {COMPLIANCE_REPORTS.map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${r.status === 'ready' ? 'bg-emerald-50 border border-emerald-200' : r.status === 'generating' ? 'bg-blue-50 border border-blue-200' : 'bg-slate-100 border border-slate-200'}`}>
                      <FileText className={`w-4 h-4 ${r.status === 'ready' ? 'text-emerald-600' : r.status === 'generating' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold text-slate-800 truncate">{r.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[7.5px] text-slate-400 font-medium">
                        <span>Period: {r.period}</span>
                        {r.status === 'ready' && <><span>{r.totalEvents.toLocaleString()} events</span><span className="text-red-500 font-bold">{r.criticalEvents} critical</span></>}
                      </div>
                      <p className="text-[7.5px] text-slate-400 mt-0.5">{r.status === 'scheduled' ? `Scheduled: ${r.generatedOn}` : `Generated ${r.generatedOn} by ${r.generatedBy}`}</p>
                    </div>
                    <span className={`text-[7.5px] font-extrabold px-2 py-1 rounded-full border flex-shrink-0 ${r.status === 'ready' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : r.status === 'generating' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                      {r.status === 'ready' ? '✅ Ready' : r.status === 'generating' ? '⏳ Generating…' : '📅 Scheduled'}
                    </span>
                    {r.status === 'ready' && (
                      <button onClick={() => toast.success(`Downloading ${r.name}…`)}
                        className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[8.5px] font-extrabold cursor-pointer hover:bg-slate-200 transition flex-shrink-0">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GDPR / Data compliance notice */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex gap-3">
              <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-extrabold text-indigo-900">Data Protection & Compliance</h4>
                <p className="text-[9px] text-indigo-700 leading-relaxed mt-1">
                  All audit logs are stored with <strong>AES-256 encryption</strong>, hash-chained for tamper detection, and retained per your policy ({retentionDays} days).
                  Exports are logged as audit events. Personal data in logs is protected under DPDP Act 2023 (India).
                  Contact your DPO before sharing reports externally.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ RETENTION POLICY TAB ═══════ */}
        {activeTab === 'retention' && (
          <div className="max-w-xl mx-auto p-5 space-y-5">
            {/* Storage overview */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Log Records', val: '16,482', icon: <Database className="w-4 h-4 text-slate-500" />, sub: 'across all modules' },
                { label: 'Storage Used', val: '2.8 GB', icon: <Archive className="w-4 h-4 text-blue-500" />, sub: '18% of 16 GB quota' },
                { label: 'Oldest Record', val: '2024-01-01', icon: <Calendar className="w-4 h-4 text-emerald-500" />, sub: '541 days ago' },
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <div className="flex justify-center mb-1.5">{k.icon}</div>
                  <p className="text-[14px] font-extrabold text-slate-800">{k.val}</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                  <p className="text-[7.5px] text-slate-400 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Retention settings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <h3 className="text-[12px] font-extrabold text-slate-800 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-600" /> Retention & Archival Settings</h3>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-bold text-slate-700">Log Retention Period</label>
                  <span className="text-[10px] font-extrabold text-indigo-600">{retentionDays} days</span>
                </div>
                <input type="range" min={30} max={1825} step={30} value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                  className="w-full accent-slate-800" />
                <div className="flex justify-between text-[7.5px] text-slate-400 mt-1">
                  <span>30 days (min)</span>
                  <span>1 year</span>
                  <span>5 years (max)</span>
                </div>
              </div>

              {[
                { label: 'Auto-Archive Old Logs', desc: 'Automatically archive logs older than retention period to cold storage', state: autoArchive, setter: setAutoArchive },
                { label: 'Alert on Critical Events', desc: 'Send email alert to IT Admin when critical audit events are logged', state: alertOnCritical, setter: setAlertOnCritical },
                { label: 'Compress Archived Logs', desc: 'Apply gzip compression to archived logs to save storage space', state: compressOld, setter: setCompressOld },
                { label: 'GDPR/DPDP Strict Mode', desc: 'Anonymize personal data in logs after 90 days per data protection regulations', state: gdprMode, setter: setGdprMode },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="flex-1 pr-4">
                    <p className="text-[10px] font-bold text-slate-800">{setting.label}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">{setting.desc}</p>
                  </div>
                  <button onClick={() => setting.setter(!setting.state)}
                    className={`transition cursor-pointer flex-shrink-0 ${setting.state ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <div className={`w-10 h-5.5 rounded-full transition-all duration-300 flex items-center px-0.5 ${setting.state ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                      style={{ width: 40, height: 22 }}>
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Purge controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-500" /> Manual Purge Controls</h3>
              <p className="text-[8.5px] text-slate-500 leading-relaxed">Manually purge expired audit logs. This action is <strong>irreversible</strong> and will generate its own audit event. Only available to System Administrators.</p>
              <div className="flex gap-3">
                <button onClick={() => toast.success('Purge simulation: 0 records eligible for deletion (within retention period).')}
                  className="flex-1 py-2.5 border border-slate-200 text-[9px] font-bold text-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 transition flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Preview Purgeable
                </button>
                <button onClick={() => toast.error('Purge action requires 2FA confirmation. Check your email.')}
                  className="flex-1 py-2.5 bg-red-50 border border-red-200 text-[9px] font-bold text-red-700 rounded-xl cursor-pointer hover:bg-red-100 transition flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Purge Expired Logs
                </button>
              </div>
            </div>

            <button onClick={() => toast.success('✅ Retention policy saved successfully!')}
              className="w-full py-3 bg-gradient-to-r from-slate-800 to-indigo-800 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90 transition">
              <CheckCircle className="w-4 h-4" /> Save Retention Policy
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CommunicationAuditTrails;
