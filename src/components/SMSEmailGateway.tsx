import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Mail, MessageSquare, Send, Plus, Search, Filter, RefreshCw,
  Settings, BarChart2, Check, X, Clock, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronRight, Download, Upload,
  Eye, Edit3, Trash2, Copy, Star, Paperclip, Users, User,
  GraduationCap, Home, Briefcase, Globe, Zap, Activity,
  TrendingUp, TrendingDown, AlertTriangle, Shield, Key,
  Database, Server, Wifi, WifiOff, ToggleLeft, ToggleRight,
  FileText, Image, Hash, Tag, Calendar, Archive, Inbox,
  Layers, Radio, Bell, Percent, DollarSign, Phone,
  ChevronUp, Info, Flag, BookOpen, MoreVertical
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Channel = 'sms' | 'email';
type MessageStatus = 'sent' | 'delivered' | 'failed' | 'pending' | 'queued' | 'bounced' | 'opened';
type RecipientGroup = 'all' | 'students' | 'parents' | 'teachers' | 'staff' | 'custom';
type TemplateCategory = 'fee' | 'attendance' | 'exam' | 'event' | 'general' | 'emergency' | 'result';
type Tab = 'compose' | 'logs' | 'templates' | 'analytics' | 'config';
type ProviderStatus = 'connected' | 'disconnected' | 'error' | 'testing';

interface Provider {
  id: string; name: string; type: 'sms' | 'email'; status: ProviderStatus;
  apiKey: string; senderId: string; balance?: number; balanceUnit?: string;
  monthlyLimit: number; used: number; successRate: number;
  logo: string; color: string;
}

interface Template {
  id: number; name: string; subject?: string; body: string;
  channel: Channel; category: TemplateCategory; variables: string[];
  usageCount: number; lastUsed?: string; isActive: boolean;
}

interface MessageLog {
  id: number; channel: Channel; recipient: string; recipientName: string;
  recipientGroup: string; subject?: string; body: string;
  status: MessageStatus; sentAt: string; deliveredAt?: string;
  openedAt?: string; provider: string; cost?: number; errorMsg?: string;
  triggeredBy: string;
}

interface BulkJob {
  id: number; channel: Channel; subject?: string; body: string;
  recipientGroup: RecipientGroup; totalRecipients: number;
  sent: number; delivered: number; failed: number; pending: number;
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  scheduledFor?: string; startedAt?: string; completedAt?: string;
  triggeredBy: string; templateId?: number;
}

interface ComposeForm {
  channel: Channel; recipientGroup: RecipientGroup; customRecipients: string;
  subject: string; body: string; scheduleFor: string; isScheduled: boolean;
  sendNow: boolean; priority: 'normal' | 'high' | 'urgent';
  templateId: number | null;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PROVIDERS: Provider[] = [
  { id: 'twilio', name: 'Twilio SMS', type: 'sms', status: 'connected', apiKey: 'AC••••••••••••3a7f', senderId: 'SCHOOL', balance: 4280, balanceUnit: '₹', monthlyLimit: 10000, used: 3240, successRate: 98.2, logo: '📱', color: 'bg-red-500' },
  { id: 'msg91', name: 'MSG91', type: 'sms', status: 'connected', apiKey: '3•••••••••E5F', senderId: 'MYSCHL', balance: 1840, balanceUnit: '₹', monthlyLimit: 5000, used: 1240, successRate: 97.5, logo: '💬', color: 'bg-blue-500' },
  { id: 'sendgrid', name: 'SendGrid Email', type: 'email', status: 'connected', apiKey: 'SG.••••••••••••••••', senderId: 'noreply@school.edu', monthlyLimit: 50000, used: 18400, successRate: 99.1, logo: '📧', color: 'bg-indigo-500' },
  { id: 'smtp', name: 'SMTP Server', type: 'email', status: 'error', apiKey: 'smtp://••••••••', senderId: 'admin@school.edu', monthlyLimit: 20000, used: 0, successRate: 0, logo: '🖥️', color: 'bg-slate-500' },
];

const TEMPLATES: Template[] = [
  { id: 1, name: 'Fee Payment Reminder', subject: 'Fee Payment Due – {{student_name}} – {{school_name}}', body: 'Dear {{parent_name}},\n\nThis is a reminder that the school fee of ₹{{amount}} for {{student_name}} (Class {{class}}) is due on {{due_date}}.\n\nPay online: {{payment_link}}\n\nRegards,\n{{school_name}}', channel: 'email', category: 'fee', variables: ['parent_name', 'student_name', 'amount', 'class', 'due_date', 'payment_link', 'school_name'], usageCount: 142, lastUsed: '2026-06-20', isActive: true },
  { id: 2, name: 'Fee SMS Reminder', body: 'Dear {{parent_name}}, Fee of Rs.{{amount}} for {{student_name}} is due on {{due_date}}. Pay at: {{payment_link}}. - {{school_name}}', channel: 'sms', category: 'fee', variables: ['parent_name', 'amount', 'student_name', 'due_date', 'payment_link', 'school_name'], usageCount: 98, lastUsed: '2026-06-20', isActive: true },
  { id: 3, name: 'Absent Alert SMS', body: '{{parent_name}}, your ward {{student_name}} was ABSENT today ({{date}}). Please contact us at {{school_phone}} if you have any concerns. - {{school_name}}', channel: 'sms', category: 'attendance', variables: ['parent_name', 'student_name', 'date', 'school_phone', 'school_name'], usageCount: 567, lastUsed: '2026-06-23', isActive: true },
  { id: 4, name: 'Exam Schedule Email', subject: 'Exam Schedule – {{exam_name}} – {{school_name}}', body: 'Dear {{parent_name}},\n\nExam schedule for {{student_name}} (Class {{class}}) has been released.\n\nExam Name: {{exam_name}}\nStart Date: {{start_date}}\nEnd Date: {{end_date}}\n\nPlease ensure your ward is well-prepared.\n\nBest regards,\nAcademic Team, {{school_name}}', channel: 'email', category: 'exam', variables: ['parent_name', 'student_name', 'class', 'exam_name', 'start_date', 'end_date', 'school_name'], usageCount: 31, lastUsed: '2026-06-10', isActive: true },
  { id: 5, name: 'Result Published', body: '{{parent_name}}, result of {{student_name}} for {{exam_name}} is published. Score: {{marks}}/{{total}} ({{percentage}}%). Login to portal: {{portal_link}} - {{school_name}}', channel: 'sms', category: 'result', variables: ['parent_name', 'student_name', 'exam_name', 'marks', 'total', 'percentage', 'portal_link', 'school_name'], usageCount: 24, lastUsed: '2026-06-12', isActive: true },
  { id: 6, name: 'Emergency Alert', subject: 'URGENT: {{alert_title}} – {{school_name}}', body: 'Dear {{parent_name}},\n\nURGENT NOTICE: {{alert_message}}\n\nPlease take immediate action.\n\n{{school_name}} Administration', channel: 'email', category: 'emergency', variables: ['parent_name', 'alert_title', 'alert_message', 'school_name'], usageCount: 3, lastUsed: '2026-06-18', isActive: true },
  { id: 7, name: 'Event Invitation', subject: '{{event_name}} – You are invited! – {{school_name}}', body: 'Dear {{parent_name}},\n\nWe are delighted to invite you to our upcoming event:\n\n📅 Event: {{event_name}}\n📍 Venue: {{venue}}\n🕒 Date & Time: {{event_date}} at {{event_time}}\n\nKindly confirm your attendance.\n\n{{school_name}}', channel: 'email', category: 'event', variables: ['parent_name', 'event_name', 'venue', 'event_date', 'event_time', 'school_name'], usageCount: 18, lastUsed: '2026-06-16', isActive: true },
  { id: 8, name: 'General Announcement SMS', body: 'Dear {{name}}, {{message}} For details visit: {{portal_link}} - {{school_name}}', channel: 'sms', category: 'general', variables: ['name', 'message', 'portal_link', 'school_name'], usageCount: 45, lastUsed: '2026-06-22', isActive: true },
];

const LOGS: MessageLog[] = [
  { id: 1, channel: 'sms', recipient: '+91 98765 43210', recipientName: 'Rajesh Kumar', recipientGroup: 'Parents', body: 'Dear Rajesh, Fee of Rs.4500 for Aryan is due on 30 Jun. Pay at: school.edu/pay - MySchool', status: 'delivered', sentAt: '2026-06-20 10:05', deliveredAt: '2026-06-20 10:05', provider: 'Twilio SMS', cost: 0.42, triggeredBy: 'Bulk Job #12' },
  { id: 2, channel: 'email', recipient: 'sunita@email.com', recipientName: 'Sunita Patel', recipientGroup: 'Parents', subject: 'Fee Payment Due – Priya Patel', body: 'Dear Sunita, Fee reminder for Priya...', status: 'opened', sentAt: '2026-06-20 10:05', deliveredAt: '2026-06-20 10:06', openedAt: '2026-06-20 11:30', provider: 'SendGrid Email', cost: 0.01, triggeredBy: 'Bulk Job #12' },
  { id: 3, channel: 'sms', recipient: '+91 94321 87654', recipientName: 'Sunita Patel', recipientGroup: 'Parents', body: 'Sunita, your ward Priya was ABSENT today (23 Jun). Contact: 0120-123456 - MySchool', status: 'delivered', sentAt: '2026-06-23 09:15', deliveredAt: '2026-06-23 09:15', provider: 'MSG91', cost: 0.28, triggeredBy: 'Auto: Attendance Alert' },
  { id: 4, channel: 'email', recipient: 'mohan@email.com', recipientName: 'Mohan Sharma', recipientGroup: 'Parents', subject: 'URGENT: School Closed Tomorrow', body: 'Dear Mohan, URGENT NOTICE: School will remain closed...', status: 'delivered', sentAt: '2026-06-23 07:00', deliveredAt: '2026-06-23 07:01', provider: 'SendGrid Email', cost: 0.01, triggeredBy: 'Manual' },
  { id: 5, channel: 'sms', recipient: '+91 99887 76655', recipientName: 'Mohan Sharma', recipientGroup: 'Parents', body: 'Mohan, School CLOSED tomorrow 24 Jun due to heavy rain. Online classes as usual. - MySchool', status: 'delivered', sentAt: '2026-06-23 07:00', deliveredAt: '2026-06-23 07:01', provider: 'Twilio SMS', cost: 0.42, triggeredBy: 'Manual' },
  { id: 6, channel: 'sms', recipient: '+91 90011 22334', recipientName: 'Priya Gupta', recipientGroup: 'Parents', body: 'Priya G, Fee reminder...', status: 'failed', sentAt: '2026-06-20 10:05', provider: 'Twilio SMS', cost: 0, triggeredBy: 'Bulk Job #12', errorMsg: 'Invalid phone number format' },
  { id: 7, channel: 'email', recipient: 'vikash@email.com', recipientName: 'Vikash Singh', recipientGroup: 'Parents', subject: 'Fee Payment Due', body: 'Dear Vikash...', status: 'bounced', sentAt: '2026-06-20 10:05', provider: 'SendGrid Email', cost: 0.01, triggeredBy: 'Bulk Job #12', errorMsg: 'Mailbox not found' },
  { id: 8, channel: 'sms', recipient: '+91 87654 32109', recipientName: 'Vikash Singh', recipientGroup: 'Parents', body: 'Vikash, Rohan\'s attendance is critically low (65%). Urgent meeting requested. - MySchool', status: 'delivered', sentAt: '2026-06-22 11:30', deliveredAt: '2026-06-22 11:31', provider: 'MSG91', cost: 0.28, triggeredBy: 'Manual' },
];

const BULK_JOBS: BulkJob[] = [
  { id: 12, channel: 'sms', body: 'Fee payment reminder for June 2026...', recipientGroup: 'parents', totalRecipients: 480, sent: 480, delivered: 471, failed: 9, pending: 0, status: 'completed', startedAt: '2026-06-20 10:00', completedAt: '2026-06-20 10:08', triggeredBy: 'Accounts Office', templateId: 2 },
  { id: 12, channel: 'email', subject: 'Fee Payment Due – June 2026', body: 'Fee reminder email...', recipientGroup: 'parents', totalRecipients: 480, sent: 480, delivered: 477, failed: 3, pending: 0, status: 'completed', startedAt: '2026-06-20 10:00', completedAt: '2026-06-20 10:05', triggeredBy: 'Accounts Office', templateId: 1 },
  { id: 13, channel: 'sms', body: 'Attendance alert for absent students...', recipientGroup: 'parents', totalRecipients: 45, sent: 45, delivered: 44, failed: 1, pending: 0, status: 'completed', startedAt: '2026-06-23 09:15', completedAt: '2026-06-23 09:16', triggeredBy: 'Auto: Daily Attendance', templateId: 3 },
  { id: 14, channel: 'email', subject: 'Annual Day Invitation', body: 'Event invitation...', recipientGroup: 'all', totalRecipients: 1240, sent: 1240, delivered: 1228, failed: 12, pending: 0, status: 'completed', startedAt: '2026-06-18 09:00', completedAt: '2026-06-18 09:22', triggeredBy: 'Principal Office', templateId: 7 },
  { id: 15, channel: 'sms', body: 'Exam schedule released...', recipientGroup: 'students', totalRecipients: 640, sent: 0, delivered: 0, failed: 0, pending: 640, status: 'scheduled', scheduledFor: '2026-06-25 08:00', triggeredBy: 'Exam Cell', templateId: 3 },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<MessageStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  sent:      { label: 'Sent',      color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <Send className="w-3 h-3" /> },
  delivered: { label: 'Delivered', color: 'text-emerald-700',bg: 'bg-emerald-100',icon: <CheckCircle className="w-3 h-3" /> },
  failed:    { label: 'Failed',    color: 'text-red-700',    bg: 'bg-red-100',    icon: <XCircle className="w-3 h-3" /> },
  pending:   { label: 'Pending',   color: 'text-amber-700',  bg: 'bg-amber-100',  icon: <Clock className="w-3 h-3" /> },
  queued:    { label: 'Queued',    color: 'text-slate-600',  bg: 'bg-slate-100',  icon: <Layers className="w-3 h-3" /> },
  bounced:   { label: 'Bounced',   color: 'text-orange-700', bg: 'bg-orange-100', icon: <AlertCircle className="w-3 h-3" /> },
  opened:    { label: 'Opened',    color: 'text-violet-700', bg: 'bg-violet-100', icon: <Eye className="w-3 h-3" /> },
};

const CAT_CFG: Record<TemplateCategory, { label: string; color: string; bg: string }> = {
  fee:        { label: 'Fee',        color: 'text-orange-700', bg: 'bg-orange-100' },
  attendance: { label: 'Attendance', color: 'text-red-700',    bg: 'bg-red-100' },
  exam:       { label: 'Exam',       color: 'text-rose-700',   bg: 'bg-rose-100' },
  event:      { label: 'Event',      color: 'text-purple-700', bg: 'bg-purple-100' },
  general:    { label: 'General',    color: 'text-slate-600',  bg: 'bg-slate-100' },
  emergency:  { label: 'Emergency',  color: 'text-red-800',    bg: 'bg-red-200' },
  result:     { label: 'Result',     color: 'text-blue-700',   bg: 'bg-blue-100' },
};

const RECIPIENT_GROUPS: { value: RecipientGroup; label: string; count: number; icon: React.ReactNode }[] = [
  { value: 'all',      label: 'Everyone',  count: 1240, icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'parents',  label: 'Parents',   count: 480,  icon: <Home className="w-3.5 h-3.5" /> },
  { value: 'students', label: 'Students',  count: 640,  icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { value: 'teachers', label: 'Teachers',  count: 82,   icon: <Briefcase className="w-3.5 h-3.5" /> },
  { value: 'staff',    label: 'Staff',     count: 38,   icon: <User className="w-3.5 h-3.5" /> },
  { value: 'custom',   label: 'Custom',    count: 0,    icon: <Hash className="w-3.5 h-3.5" /> },
];

const emptyCompose = (): ComposeForm => ({
  channel: 'sms', recipientGroup: 'parents', customRecipients: '',
  subject: '', body: '', scheduleFor: '', isScheduled: false,
  sendNow: true, priority: 'normal', templateId: null,
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SMSEmailGateway: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('compose');
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [logs, setLogs] = useState<MessageLog[]>(LOGS);
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>(BULK_JOBS);
  const [compose, setCompose] = useState<ComposeForm>(emptyCompose());
  const [searchLogs, setSearchLogs] = useState('');
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MessageStatus | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFilter, setTemplateFilter] = useState<Channel | 'all'>('all');
  const [templateCatFilter, setTemplateCatFilter] = useState<TemplateCategory | 'all'>('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [tplForm, setTplForm] = useState({ name: '', subject: '', body: '', channel: 'sms' as Channel, category: 'general' as TemplateCategory });
  const [sending, setSending] = useState(false);
  const [providerTest, setProviderTest] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [showBulkHistory, setShowBulkHistory] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // ── Derived ──
  const filteredLogs = logs.filter(l => {
    if (filterChannel !== 'all' && l.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (searchLogs && !l.recipientName.toLowerCase().includes(searchLogs.toLowerCase()) &&
        !l.recipient.includes(searchLogs) && !(l.subject || '').toLowerCase().includes(searchLogs.toLowerCase())) return false;
    return true;
  });

  const filteredTemplates = templates.filter(t => {
    if (templateFilter !== 'all' && t.channel !== templateFilter) return false;
    if (templateCatFilter !== 'all' && t.category !== templateCatFilter) return false;
    return true;
  });

  const smsProvider = providers.find(p => p.type === 'sms' && p.status === 'connected');
  const emailProvider = providers.find(p => p.type === 'email' && p.status === 'connected');

  const totalSent = logs.length;
  const totalDelivered = logs.filter(l => ['delivered', 'opened'].includes(l.status)).length;
  const totalFailed = logs.filter(l => ['failed', 'bounced'].includes(l.status)).length;
  const totalOpened = logs.filter(l => l.status === 'opened').length;
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';

  // ── Handlers ──
  const handleSend = async () => {
    if (!compose.body.trim()) { toast.error('Message body is required'); return; }
    if (compose.channel === 'email' && !compose.subject.trim()) { toast.error('Email subject is required'); return; }
    if (compose.isScheduled && !compose.scheduleFor) { toast.error('Please select schedule date/time'); return; }

    setSending(true);
    await new Promise(r => setTimeout(r, 1800));
    setSending(false);

    const group = RECIPIENT_GROUPS.find(g => g.value === compose.recipientGroup);
    const count = compose.recipientGroup === 'custom'
      ? compose.customRecipients.split(',').filter(Boolean).length
      : group?.count || 0;

    const newJob: BulkJob = {
      id: Date.now(), channel: compose.channel,
      subject: compose.subject, body: compose.body,
      recipientGroup: compose.recipientGroup, totalRecipients: count,
      sent: compose.isScheduled ? 0 : count, delivered: compose.isScheduled ? 0 : Math.round(count * 0.97),
      failed: compose.isScheduled ? 0 : Math.round(count * 0.03), pending: compose.isScheduled ? count : 0,
      status: compose.isScheduled ? 'scheduled' : 'completed',
      scheduledFor: compose.scheduleFor, startedAt: compose.isScheduled ? undefined : new Date().toLocaleString(),
      completedAt: compose.isScheduled ? undefined : new Date().toLocaleString(),
      triggeredBy: 'Manual',
    };
    setBulkJobs(prev => [newJob, ...prev]);

    if (compose.isScheduled) {
      toast.success(`✅ Scheduled! Will send to ${count} recipients on ${compose.scheduleFor}`);
    } else {
      toast.success(`✅ Sent successfully to ${count} recipients!`);
    }
    setCompose(emptyCompose());
    setCharCount(0);
  };

  const loadTemplate = (t: Template) => {
    setCompose(prev => ({
      ...prev, channel: t.channel, body: t.body,
      subject: t.subject || '', templateId: t.id,
    }));
    setCharCount(t.body.length);
    setSelectedTemplate(null);
    toast.success(`Template "${t.name}" loaded`);
  };

  const testProvider = async (id: string) => {
    setProviderTest(id);
    await new Promise(r => setTimeout(r, 2000));
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'connected' } : p));
    setProviderTest(null);
    toast.success('Provider connection verified!');
  };

  const saveTemplate = () => {
    if (!tplForm.name || !tplForm.body) { toast.error('Name and body are required'); return; }
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...tplForm } : t));
      toast.success('Template updated!');
    } else {
      const vars = [...(tplForm.body.match(/\{\{(\w+)\}\}/g) || [])].map(v => v.replace(/[{}]/g, ''));
      const nt: Template = { id: Date.now(), ...tplForm, variables: vars, usageCount: 0, isActive: true };
      setTemplates(prev => [nt, ...prev]);
      toast.success('Template created!');
    }
    setShowTemplateForm(false);
    setEditingTemplate(null);
    setTplForm({ name: '', subject: '', body: '', channel: 'sms', category: 'general' });
  };

  const insertVar = (v: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const val = compose.body;
    const newVal = val.slice(0, start) + `{{${v}}}` + val.slice(end);
    setCompose(p => ({ ...p, body: newVal }));
    setCharCount(newVal.length);
  };

  const COMMON_VARS = ['parent_name', 'student_name', 'class', 'amount', 'due_date', 'date', 'school_name', 'portal_link'];

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white/10 rounded-lg">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">SMS & Email Gateway</h1>
            <p className="text-[9px] text-emerald-200 font-medium">Multi-channel messaging integration · Twilio · MSG91 · SendGrid</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider status pills */}
          {providers.filter(p => p.status !== 'error').slice(0, 2).map(p => (
            <div key={p.id} className="flex items-center gap-1 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[8px] font-bold">{p.name.split(' ')[0]}</span>
            </div>
          ))}
          <button onClick={() => setActiveTab('compose')} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer">
            <Send className="w-3 h-3" /> Compose
          </button>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'compose',   label: 'Compose & Send', icon: <Send className="w-3.5 h-3.5" /> },
          { key: 'logs',      label: 'Message Logs',   icon: <Inbox className="w-3.5 h-3.5" />, badge: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length },
          { key: 'templates', label: 'Templates',      icon: <FileText className="w-3.5 h-3.5" /> },
          { key: 'analytics', label: 'Analytics',      icon: <BarChart2 className="w-3.5 h-3.5" /> },
          { key: 'config',    label: 'Configuration',  icon: <Settings className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════ COMPOSE & SEND ═══════════ */}
        {activeTab === 'compose' && (
          <div className="flex h-full overflow-hidden" style={{ minHeight: '100%' }}>
            {/* Left: Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 border-r border-slate-200">

              {/* Channel toggle */}
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2">Channel</label>
                <div className="flex gap-2">
                  {([
                    { val: 'sms',   label: 'SMS',   icon: <MessageSquare className="w-4 h-4" />, sub: smsProvider ? `via ${smsProvider.name}` : 'Not connected', ok: !!smsProvider },
                    { val: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, sub: emailProvider ? `via ${emailProvider.name}` : 'Not connected', ok: !!emailProvider },
                  ] as const).map(ch => (
                    <button key={ch.val} onClick={() => setCompose(p => ({ ...p, channel: ch.val as Channel }))}
                      className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${compose.channel === ch.val ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                      <div className={`p-2 rounded-lg ${compose.channel === ch.val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {ch.icon}
                      </div>
                      <div className="text-left">
                        <p className={`text-[11px] font-extrabold ${compose.channel === ch.val ? 'text-emerald-700' : 'text-slate-700'}`}>{ch.label}</p>
                        <p className={`text-[9px] font-medium ${ch.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                          {ch.ok ? '🟢 ' : '🔴 '}{ch.sub}
                        </p>
                      </div>
                      {compose.channel === ch.val && <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Group */}
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2">Recipients</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {RECIPIENT_GROUPS.map(g => (
                    <button key={g.value} onClick={() => setCompose(p => ({ ...p, recipientGroup: g.value }))}
                      className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${compose.recipientGroup === g.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                      {g.icon} {g.label} {g.count > 0 && <span className={`text-[8px] ${compose.recipientGroup === g.value ? 'text-emerald-200' : 'text-slate-400'}`}>({g.count})</span>}
                    </button>
                  ))}
                </div>
                {compose.recipientGroup === 'custom' && (
                  <textarea rows={2} placeholder="Enter phone numbers (SMS) or emails (Email), comma-separated...&#10;E.g. +919876543210, +919876543211" value={compose.customRecipients}
                    onChange={e => setCompose(p => ({ ...p, customRecipients: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                )}
                {compose.recipientGroup !== 'custom' && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700">
                      {RECIPIENT_GROUPS.find(g => g.value === compose.recipientGroup)?.count || 0} recipients will receive this message
                    </span>
                  </div>
                )}
              </div>

              {/* Email Subject */}
              {compose.channel === 'email' && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Subject <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter email subject..." value={compose.subject}
                    onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              )}

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">Message Body <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewMode(!previewMode)} className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${previewMode ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                      <Eye className="w-3 h-3 inline mr-0.5" />{previewMode ? 'Edit' : 'Preview'}
                    </button>
                    {compose.channel === 'sms' && (
                      <span className={`text-[9px] font-bold ${charCount > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                        {charCount}/160 {charCount > 160 && `(${Math.ceil(charCount / 160)} parts)`}
                      </span>
                    )}
                  </div>
                </div>

                {previewMode ? (
                  <div className={`p-4 rounded-xl border text-[11px] leading-relaxed font-medium whitespace-pre-wrap ${compose.channel === 'sms' ? 'bg-emerald-50 border-emerald-200 text-slate-800 font-mono' : 'bg-white border-slate-200 text-slate-700'}`}>
                    {compose.body || <span className="text-slate-300 italic">No content yet...</span>}
                  </div>
                ) : (
                  <textarea
                    ref={bodyRef}
                    rows={compose.channel === 'email' ? 8 : 4}
                    placeholder={compose.channel === 'sms' ? 'Type your SMS message... Use {{variable}} for dynamic content' : 'Type your email body... Use {{variable}} for dynamic content'}
                    value={compose.body}
                    onChange={e => { setCompose(p => ({ ...p, body: e.target.value })); setCharCount(e.target.value.length); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                )}

                {/* Dynamic variable inserter */}
                <div className="mt-1.5">
                  <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase">Insert Variable:</p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_VARS.map(v => (
                      <button key={v} onClick={() => insertVar(v)} className="text-[8px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 hover:border-emerald-300 cursor-pointer transition">
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Template loader */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Load from Template</span>
                  <button onClick={() => setActiveTab('templates')} className="text-[9px] text-emerald-600 font-bold cursor-pointer hover:underline flex items-center gap-0.5">
                    Manage <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {templates.filter(t => t.channel === compose.channel && t.isActive).slice(0, 6).map(t => (
                    <button key={t.id} onClick={() => loadTemplate(t)}
                      className="flex items-center gap-1 text-[9px] font-bold bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-2 py-1 rounded-lg cursor-pointer transition">
                      <span className={`w-1.5 h-1.5 rounded-full ${CAT_CFG[t.category].bg.replace('bg-', 'bg-')}`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Priority</label>
                  <div className="flex gap-1.5">
                    {(['normal', 'high', 'urgent'] as const).map(p => (
                      <button key={p} onClick={() => setCompose(prev => ({ ...prev, priority: p }))}
                        className={`flex-1 text-[9px] font-bold py-2 rounded-lg border transition cursor-pointer capitalize ${compose.priority === p ? (p === 'urgent' ? 'bg-red-600 text-white border-red-600' : p === 'high' ? 'bg-orange-500 text-white border-orange-500' : 'bg-emerald-600 text-white border-emerald-600') : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">Schedule</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={compose.isScheduled} onChange={e => setCompose(p => ({ ...p, isScheduled: e.target.checked }))} className="rounded" />
                      <span className="text-[9px] font-bold text-slate-600">Schedule for later</span>
                    </label>
                  </div>
                  {compose.isScheduled
                    ? <input type="datetime-local" value={compose.scheduleFor} onChange={e => setCompose(p => ({ ...p, scheduleFor: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                    : <div className="w-full px-3 py-2 bg-slate-100 rounded-xl text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Send immediately
                      </div>
                  }
                </div>
              </div>

              {/* Send Button */}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSend} disabled={sending}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-sm ${sending ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'}`}>
                  {sending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : compose.isScheduled ? (
                    <><Calendar className="w-4 h-4" /> Schedule Message</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Now to {RECIPIENT_GROUPS.find(g => g.value === compose.recipientGroup)?.count || 0} recipients</>
                  )}
                </button>
                <button onClick={() => { setCompose(emptyCompose()); setCharCount(0); }} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-xl cursor-pointer transition">
                  Clear
                </button>
              </div>
            </div>

            {/* Right: Bulk Job History */}
            <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-700">Recent Send Jobs</span>
                <span className="text-[8px] text-slate-400 font-medium">{bulkJobs.length} total</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {bulkJobs.map((job, i) => {
                  const rate = job.totalRecipients > 0 ? Math.round((job.delivered / job.totalRecipients) * 100) : 0;
                  return (
                    <div key={`${job.id}-${i}`} className="p-3 hover:bg-white transition cursor-default">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${job.channel === 'sms' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                          {job.channel === 'sms' ? <MessageSquare className="w-3 h-3 text-blue-600" /> : <Mail className="w-3 h-3 text-violet-600" />}
                        </div>
                        <p className="text-[9px] font-bold text-slate-700 truncate flex-1">{job.subject || job.body.slice(0, 30) + '...'}</p>
                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full flex-shrink-0 ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : job.status === 'running' ? 'bg-blue-100 text-blue-700' : job.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{job.status}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] text-slate-500 font-medium">{job.totalRecipients} recipients</span>
                        <span className="text-[8px] text-slate-500 font-medium">{rate}% delivered</span>
                      </div>
                      {job.status === 'completed' && (
                        <div className="w-full bg-slate-200 rounded-full h-1 mb-1">
                          <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      )}
                      <div className="flex gap-1.5 text-[8px] font-bold">
                        <span className="text-emerald-600">✓ {job.delivered}</span>
                        <span className="text-red-500">✗ {job.failed}</span>
                        {job.pending > 0 && <span className="text-amber-600">⏳ {job.pending}</span>}
                        <span className="text-slate-400 ml-auto">{job.startedAt?.split(' ')[0] || job.scheduledFor?.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ MESSAGE LOGS ═══════════ */}
        {activeTab === 'logs' && (
          <div className="flex h-full overflow-hidden" style={{ minHeight: '100%' }}>
            {/* Log list */}
            <div className={`${selectedLog ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden border-r border-slate-200`}>
              {/* Filters */}
              <div className="p-3 border-b border-slate-100 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input type="text" placeholder="Search by name, number, email..." value={searchLogs}
                      onChange={e => setSearchLogs(e.target.value)}
                      className="bg-transparent text-[10px] font-medium outline-none flex-1 placeholder:text-slate-400" />
                  </div>
                  <button onClick={() => setLogs([...logs])} className="p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-400 transition">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => toast.success('Logs exported!')} className="p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-400 transition">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <div className="flex gap-1">
                    {(['all', 'sms', 'email'] as const).map(ch => (
                      <button key={ch} onClick={() => setFilterChannel(ch)}
                        className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${filterChannel === ch ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                        {ch === 'all' ? 'All Channels' : ch === 'sms' ? '📱 SMS' : '📧 Email'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(['all', 'delivered', 'opened', 'sent', 'pending', 'failed', 'bounced'] as const).map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                        {s === 'all' ? 'All Status' : s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                {['Recipient', 'Message', 'Channel', 'Status', 'Sent At'].map(h => (
                  <p key={h} className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{h}</p>
                ))}
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {filteredLogs.map(l => {
                  const sc = STATUS_CFG[l.status];
                  return (
                    <div key={l.id} onClick={() => setSelectedLog(selectedLog?.id === l.id ? null : l)}
                      className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 px-3 py-2.5 cursor-pointer transition hover:bg-slate-50 ${selectedLog?.id === l.id ? 'bg-emerald-50 border-r-2 border-emerald-500' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{l.recipientName}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate">{l.recipient}</p>
                      </div>
                      <div className="min-w-0">
                        {l.subject && <p className="text-[9px] font-bold text-slate-600 truncate">{l.subject}</p>}
                        <p className="text-[9px] text-slate-400 font-medium truncate">{l.body.slice(0, 40)}...</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${l.channel === 'sms' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                          {l.channel === 'sms' ? <MessageSquare className="w-2.5 h-2.5" /> : <Mail className="w-2.5 h-2.5" />}
                          {l.channel.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 font-medium">{l.sentAt.split(' ')[0]}</p>
                        <p className="text-[8px] text-slate-400">{l.sentAt.split(' ')[1]}</p>
                      </div>
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-[10px] font-semibold">No logs found</p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <p className="text-[9px] text-slate-400 font-semibold">{filteredLogs.length} of {logs.length} messages</p>
              </div>
            </div>

            {/* Log Detail */}
            {selectedLog && (
              <div className="w-1/2 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-700">Message Detail</span>
                  <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <div className="p-4 space-y-3">
                  {/* Status banner */}
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${STATUS_CFG[selectedLog.status].bg} border-current`}>
                    <div className={STATUS_CFG[selectedLog.status].color}>{STATUS_CFG[selectedLog.status].icon}</div>
                    <div>
                      <p className={`text-[10px] font-extrabold ${STATUS_CFG[selectedLog.status].color}`}>{STATUS_CFG[selectedLog.status].label}</p>
                      {selectedLog.errorMsg && <p className="text-[9px] text-red-600 font-medium">{selectedLog.errorMsg}</p>}
                    </div>
                  </div>

                  {/* Delivery timeline */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Delivery Timeline</p>
                    {[
                      { label: 'Sent', time: selectedLog.sentAt, done: true },
                      { label: 'Delivered', time: selectedLog.deliveredAt, done: !!selectedLog.deliveredAt },
                      ...(selectedLog.channel === 'email' ? [{ label: 'Opened', time: selectedLog.openedAt, done: !!selectedLog.openedAt }] : []),
                    ].map((step, i) => (
                      <div key={i} className={`flex items-center gap-2 mb-2 ${i < 2 ? 'pb-2 border-b border-slate-50' : ''}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {step.done ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div>
                          <p className={`text-[9px] font-bold ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
                          <p className="text-[8px] text-slate-400 font-medium">{step.time || 'Not yet'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Details</p>
                    {[
                      { label: 'Recipient', val: `${selectedLog.recipientName} (${selectedLog.recipient})` },
                      { label: 'Group', val: selectedLog.recipientGroup },
                      { label: 'Channel', val: selectedLog.channel.toUpperCase() },
                      { label: 'Provider', val: selectedLog.provider },
                      { label: 'Triggered By', val: selectedLog.triggeredBy },
                      ...(selectedLog.cost !== undefined ? [{ label: 'Cost', val: `₹${selectedLog.cost.toFixed(2)}` }] : []),
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-[9px] text-slate-400 font-medium w-20 flex-shrink-0">{r.label}:</span>
                        <span className="text-[9px] font-bold text-slate-700">{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Message content */}
                  {selectedLog.subject && (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
                      <p className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{selectedLog.subject}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message</p>
                    <div className="text-[10px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap">{selectedLog.body}</div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setCompose(p => ({ ...p, channel: selectedLog.channel, body: selectedLog.body, subject: selectedLog.subject || '' })); setActiveTab('compose'); setSelectedLog(null); toast.success('Message loaded in composer'); }}
                      className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <RefreshCw className="w-3 h-3" /> Resend
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(selectedLog.body); toast.success('Copied!'); }}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TEMPLATES ═══════════ */}
        {activeTab === 'templates' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1">
                  {(['all', 'sms', 'email'] as const).map(ch => (
                    <button key={ch} onClick={() => setTemplateFilter(ch)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${templateFilter === ch ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                      {ch === 'all' ? 'All' : ch === 'sms' ? '📱 SMS' : '📧 Email'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['all', ...Object.keys(CAT_CFG)] as (TemplateCategory | 'all')[]).map(cat => (
                    <button key={cat} onClick={() => setTemplateCatFilter(cat)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${templateCatFilter === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
                      {cat === 'all' ? 'All Categories' : CAT_CFG[cat as TemplateCategory]?.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setEditingTemplate(null); setTplForm({ name: '', subject: '', body: '', channel: 'sms', category: 'general' }); setShowTemplateForm(true); }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition">
                <Plus className="w-3.5 h-3.5" /> New Template
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredTemplates.map(t => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-300 transition group">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${t.channel === 'sms' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                        {t.channel === 'sms' ? <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-violet-600" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-800">{t.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${CAT_CFG[t.category].bg} ${CAT_CFG[t.category].color}`}>{CAT_CFG[t.category].label}</span>
                          <span className="text-[8px] text-slate-400">Used {t.usageCount}x</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => loadTemplate(t)} className="p-1 hover:bg-emerald-50 rounded cursor-pointer" title="Use template">
                        <Send className="w-3 h-3 text-emerald-600" />
                      </button>
                      <button onClick={() => { setEditingTemplate(t); setTplForm({ name: t.name, subject: t.subject || '', body: t.body, channel: t.channel, category: t.category }); setShowTemplateForm(true); }} className="p-1 hover:bg-blue-50 rounded cursor-pointer">
                        <Edit3 className="w-3 h-3 text-blue-500" />
                      </button>
                      <button onClick={() => { setTemplates(prev => prev.filter(x => x.id !== t.id)); toast.success('Template deleted'); }} className="p-1 hover:bg-red-50 rounded cursor-pointer">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    {t.subject && <p className="text-[9px] font-bold text-slate-500 mb-0.5">Subject: {t.subject}</p>}
                    <p className="text-[10px] text-slate-600 font-medium leading-snug line-clamp-2">{t.body}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.variables.map(v => (
                        <span key={v} className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">{`{{${v}}}`}</span>
                      ))}
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-slate-50 bg-slate-50 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">Last used: {t.lastUsed || 'Never'}</span>
                    <button onClick={() => { setCompose(p => ({ ...p, channel: t.channel, body: t.body, subject: t.subject || '', templateId: t.id })); setActiveTab('compose'); toast.success('Template loaded!'); }}
                      className="text-[9px] font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5">
                      Use <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Sent', val: totalSent, icon: <Send className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600', sub: 'All channels' },
                { label: 'Delivered', val: totalDelivered, icon: <CheckCircle className="w-4 h-4" />, color: 'from-blue-500 to-blue-600', sub: `${deliveryRate}% rate` },
                { label: 'Failed/Bounced', val: totalFailed, icon: <XCircle className="w-4 h-4" />, color: 'from-red-500 to-rose-600', sub: 'Need attention' },
                { label: 'Emails Opened', val: totalOpened, icon: <Eye className="w-4 h-4" />, color: 'from-violet-500 to-violet-600', sub: `${openRate}% open rate` },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} text-white p-3 rounded-xl shadow-sm`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-white/20 rounded-lg">{s.icon}</div>
                    <span className="text-xl font-extrabold">{s.val}</span>
                  </div>
                  <p className="text-[10px] font-bold opacity-90">{s.label}</p>
                  <p className="text-[8px] opacity-70">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Provider Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-700">Provider Usage & Balance</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {providers.map(p => (
                    <div key={p.id} className="px-3 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.logo}</span>
                          <div>
                            <p className="text-[10px] font-bold text-slate-800">{p.name}</p>
                            <p className="text-[8px] text-slate-400 font-medium">{p.senderId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : p.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                          {p.balance !== undefined && <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{p.balanceUnit}{p.balance.toLocaleString()}</p>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[8px] text-slate-400">Monthly Usage</span>
                          <span className="text-[8px] font-bold text-slate-600">{p.used.toLocaleString()} / {p.monthlyLimit.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${(p.used / p.monthlyLimit) > 0.8 ? 'bg-red-500' : (p.used / p.monthlyLimit) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (p.used / p.monthlyLimit) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[8px] text-slate-400">Success Rate</span>
                          <span className="text-[8px] font-bold text-emerald-600">{p.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-700">Channel Breakdown</p>
                </div>
                <div className="p-3 space-y-3">
                  {(['sms', 'email'] as Channel[]).map(ch => {
                    const chLogs = logs.filter(l => l.channel === ch);
                    const chDel = chLogs.filter(l => ['delivered', 'opened'].includes(l.status)).length;
                    const rate = chLogs.length > 0 ? Math.round((chDel / chLogs.length) * 100) : 0;
                    return (
                      <div key={ch} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ch === 'sms' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                              {ch === 'sms' ? <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-violet-600" />}
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-700 uppercase">{ch}</span>
                          </div>
                          <span className="text-xl font-extrabold text-slate-700">{chLogs.length}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {[
                            { label: 'Delivered', val: chDel, color: 'text-emerald-600' },
                            { label: 'Failed', val: chLogs.filter(l => ['failed', 'bounced'].includes(l.status)).length, color: 'text-red-500' },
                            { label: 'Rate', val: `${rate}%`, color: 'text-blue-600' },
                          ].map((item, i) => (
                            <div key={i} className="text-center">
                              <p className={`text-[11px] font-extrabold ${item.color}`}>{item.val}</p>
                              <p className="text-[8px] text-slate-400 font-medium">{item.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Top triggered */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Top Triggers</p>
                    {['Auto: Attendance Alert', 'Manual', 'Bulk Job #12', 'Accounts Office'].map((trigger, i) => {
                      const count = logs.filter(l => l.triggeredBy === trigger).length;
                      return count > 0 ? (
                        <div key={trigger} className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[9px] font-medium text-slate-600">{trigger}</span>
                              <span className="text-[9px] font-bold text-slate-700">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(count / logs.length) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Job Summary Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-700">Bulk Send Campaign History</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Campaign', 'Channel', 'Recipients', 'Delivered', 'Failed', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bulkJobs.map((job, i) => {
                      const rate = job.totalRecipients > 0 ? Math.round((job.delivered / job.totalRecipients) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2"><p className="text-[9px] font-bold text-slate-700 max-w-[140px] truncate">{job.subject || job.body.slice(0, 30)+'...'}</p></td>
                          <td className="px-3 py-2"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${job.channel === 'sms' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>{job.channel.toUpperCase()}</span></td>
                          <td className="px-3 py-2"><p className="text-[9px] font-bold text-slate-700">{job.totalRecipients.toLocaleString()}</p></td>
                          <td className="px-3 py-2"><p className="text-[9px] font-bold text-emerald-600">{job.delivered} <span className="text-slate-400 font-medium">({rate}%)</span></p></td>
                          <td className="px-3 py-2"><p className="text-[9px] font-bold text-red-500">{job.failed}</p></td>
                          <td className="px-3 py-2"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : job.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{job.status}</span></td>
                          <td className="px-3 py-2"><p className="text-[9px] text-slate-500">{(job.startedAt || job.scheduledFor || '').split(' ')[0]}</p></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ CONFIGURATION ═══════════ */}
        {activeTab === 'config' && (
          <div className="p-4 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[11px] font-extrabold text-slate-700">Provider Configuration & API Settings</h2>
            </div>

            {providers.map(p => (
              <div key={p.id} className={`bg-white border-2 rounded-xl overflow-hidden ${p.status === 'connected' ? 'border-emerald-200' : p.status === 'error' ? 'border-red-200' : 'border-slate-200'}`}>
                {/* Provider Header */}
                <div className={`flex items-center justify-between px-4 py-3 ${p.status === 'connected' ? 'bg-emerald-50' : p.status === 'error' ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-extrabold text-slate-800">{p.name}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${p.type === 'sms' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-violet-100 text-violet-700 border-violet-200'}`}>
                          {p.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-emerald-500' : p.status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
                        <span className={`text-[9px] font-bold capitalize ${p.status === 'connected' ? 'text-emerald-600' : p.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{p.status}</span>
                        {p.balance !== undefined && <span className="text-[9px] text-slate-500 font-medium">· Balance: <strong className="text-emerald-600">{p.balanceUnit}{p.balance.toLocaleString()}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => testProvider(p.id)} disabled={providerTest === p.id}
                      className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${providerTest === p.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600'}`}>
                      {providerTest === p.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                      {providerTest === p.id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button onClick={() => {
                      setProviders(prev => prev.map(x => x.id === p.id ? { ...x, status: x.status === 'connected' ? 'disconnected' : 'connected' } : x));
                      toast.success(`Provider ${p.status === 'connected' ? 'disabled' : 'enabled'}`);
                    }} className={`p-1.5 rounded-lg cursor-pointer transition ${p.status === 'connected' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-100'}`}>
                      {p.status === 'connected' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Config Fields */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">API Key / Auth Token</label>
                      <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                        <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-slate-600 flex-1 truncate">{p.apiKey}</span>
                        <button onClick={() => toast.success('Key revealed!')} className="text-[8px] text-emerald-600 font-bold cursor-pointer hover:underline">Show</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sender ID / From</label>
                      <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                        <Radio className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-700">{p.senderId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Monthly Usage</span>
                      <span className="text-[9px] font-bold text-slate-600">{p.used.toLocaleString()} / {p.monthlyLimit.toLocaleString()} ({Math.round((p.used / p.monthlyLimit) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${(p.used / p.monthlyLimit) > 0.8 ? 'bg-red-500' : (p.used / p.monthlyLimit) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (p.used / p.monthlyLimit) * 100)}%` }} />
                    </div>
                    {(p.used / p.monthlyLimit) > 0.8 && (
                      <p className="text-[9px] text-red-600 font-bold mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Usage above 80% — consider upgrading your plan</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => toast.success('API key updated!')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Edit3 className="w-3 h-3" /> Update API Key
                    </button>
                    <button onClick={() => toast.success('Test message sent!')} className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Send className="w-3 h-3" /> Send Test Message
                    </button>
                    <button onClick={() => toast.success('Webhook configured!')} className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Server className="w-3 h-3" /> Configure Webhook
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new provider */}
            <button onClick={() => toast.success('Provider wizard coming soon!')} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl py-4 text-slate-400 hover:text-emerald-600 transition cursor-pointer">
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-bold">Add New Provider (Vonage, Amazon SES, etc.)</span>
            </button>

            {/* Global Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Global Gateway Settings</p>
              <div className="space-y-3">
                {[
                  { label: 'Daily SMS Limit per Contact', val: '3 messages/day' },
                  { label: 'Default SMS Provider', val: 'Twilio SMS (Primary)' },
                  { label: 'Default Email Provider', val: 'SendGrid Email (Primary)' },
                  { label: 'Retry failed messages', val: '3 attempts, 5min interval' },
                  { label: 'DND Hours (no sending)', val: '10:00 PM – 6:00 AM' },
                  { label: 'Unsubscribe handling', val: 'Auto-remove from list' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[10px] text-slate-600 font-medium">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-700">{s.val}</span>
                      <button onClick={() => toast.success('Setting updated!')} className="text-[8px] text-emerald-600 font-bold cursor-pointer hover:underline">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TEMPLATE FORM MODAL ── */}
      {showTemplateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl flex-shrink-0">
              <span className="text-white font-extrabold text-[11px] flex items-center gap-2"><FileText className="w-4 h-4" />{editingTemplate ? 'Edit Template' : 'New Template'}</span>
              <button onClick={() => setShowTemplateForm(false)} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Template Name</label>
                <input type="text" value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} placeholder="E.g. Fee Reminder SMS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Channel</label>
                  <select value={tplForm.channel} onChange={e => setTplForm(p => ({ ...p, channel: e.target.value as Channel }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    <option value="sms">📱 SMS</option>
                    <option value="email">📧 Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Category</label>
                  <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value as TemplateCategory }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    {Object.entries(CAT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {tplForm.channel === 'email' && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email Subject</label>
                  <input type="text" value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))} placeholder="Use {{variable}} for dynamic content"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              )}
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Message Body</label>
                <textarea rows={5} value={tplForm.body} onChange={e => setTplForm(p => ({ ...p, body: e.target.value }))} placeholder="Use {{variable_name}} for dynamic content..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                <p className="text-[8px] text-slate-400 mt-0.5">Variables detected: {[...(tplForm.body.match(/\{\{(\w+)\}\}/g) || [])].join(', ') || 'none'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
              <button onClick={() => setShowTemplateForm(false)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Cancel</button>
              <button onClick={saveTemplate} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-xl cursor-pointer transition">
                <Check className="w-3 h-3" /> {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSEmailGateway;
