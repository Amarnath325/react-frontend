import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Radio, Zap, Shield, Phone, Mail, Bell, MessageSquare,
  Users, Clock, CheckCircle, XCircle, Send, X, ChevronRight, Eye,
  Volume2, RefreshCw, History, Settings, Flame, Wind, Heart,
  Lock, Unlock, CloudRain, Megaphone, AlertOctagon, Activity,
  BarChart2, TrendingUp, Filter, Search, ChevronDown, Info,
  ArrowRight, ThumbsUp, Monitor, Smartphone, Siren, MapPin,
  FileText, Plus, Trash2, Edit3, Copy, Star, ToggleRight, ToggleLeft
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type MainTab = 'console' | 'compose' | 'templates' | 'history' | 'settings';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'info';
type AlertCategory = 'lockdown' | 'fire' | 'medical' | 'weather' | 'closure' | 'evacuation' | 'security' | 'drill' | 'allclear' | 'general';
type BroadcastStatus = 'active' | 'sent' | 'cancelled' | 'scheduled' | 'draft';
type DeliveryChannel = 'sms' | 'push' | 'email' | 'pa' | 'app';
type AudienceTarget = 'all' | 'students' | 'parents' | 'teachers' | 'staff' | 'transport';
type ComposeStep = 1 | 2 | 3;

interface BroadcastRecord {
  id: number;
  title: string;
  message: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: BroadcastStatus;
  audience: AudienceTarget[];
  channels: DeliveryChannel[];
  sentAt: string;
  sentBy: string;
  totalTargets: number;
  delivered: number;
  read: number;
  failed: number;
  followUpSent: boolean;
  allClearSent: boolean;
  location?: string;
  incidentId: string;
}

interface BroadcastTemplate {
  id: number;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  defaultAudience: AudienceTarget[];
  defaultChannels: DeliveryChannel[];
  isCustom: boolean;
  usageCount: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_BROADCASTS: BroadcastRecord[] = [
  {
    id: 1,
    title: 'FIRE DRILL — Block C Evacuation',
    message: 'ATTENTION: A scheduled fire drill will commence at 11:00 AM today. All students and staff in Block C must evacuate immediately via designated exits to the assembly point at the main ground. This is a drill. Please proceed calmly and orderly.',
    category: 'drill',
    severity: 'medium',
    status: 'sent',
    audience: ['all'],
    channels: ['pa', 'app', 'push'],
    sentAt: '2026-06-24 10:55 AM',
    sentBy: 'Principal Dr. Sharma',
    totalTargets: 1420,
    delivered: 1398,
    read: 1102,
    failed: 22,
    followUpSent: true,
    allClearSent: true,
    location: 'Block C',
    incidentId: 'INC-2026-0089',
  },
  {
    id: 2,
    title: 'SCHOOL CLOSURE — Heavy Rain Advisory',
    message: 'IMPORTANT NOTICE: Due to the IMD Red Alert for heavy rainfall in the district, school will remain CLOSED tomorrow (June 25, 2026). Online classes will be conducted as per regular timetable. Parents are requested to ensure student safety. School will resume on June 26 (subject to weather conditions).',
    category: 'closure',
    severity: 'high',
    status: 'sent',
    audience: ['all'],
    channels: ['sms', 'push', 'email', 'app'],
    sentAt: '2026-06-23 06:30 PM',
    sentBy: 'Vice Principal Mrs. Nair',
    totalTargets: 1420,
    delivered: 1411,
    read: 1387,
    failed: 9,
    followUpSent: false,
    allClearSent: false,
    location: 'District-wide',
    incidentId: 'INC-2026-0088',
  },
  {
    id: 3,
    title: '⚠️ MEDICAL EMERGENCY — Student Assistance Required',
    message: 'URGENT: A student requires immediate medical attention on the 2nd floor, Block A near Room 204. School doctor and first-aid team — please respond immediately. All other students and staff stay in classrooms until further notice.',
    category: 'medical',
    severity: 'critical',
    status: 'sent',
    audience: ['teachers', 'staff'],
    channels: ['pa', 'app'],
    sentAt: '2026-06-22 02:14 PM',
    sentBy: 'Admin Control Room',
    totalTargets: 68,
    delivered: 68,
    read: 65,
    failed: 0,
    followUpSent: true,
    allClearSent: true,
    location: 'Block A, Room 204',
    incidentId: 'INC-2026-0087',
  },
  {
    id: 4,
    title: '🔒 SECURITY ALERT — Unauthorized Entry Detected',
    message: 'SECURITY NOTICE: An unauthorized individual was detected near the rear gate (Gate 3). Security personnel are managing the situation. All students must remain in classrooms and not move to corridors. Staff — please lock classroom doors and take attendance immediately.',
    category: 'security',
    severity: 'critical',
    status: 'sent',
    audience: ['teachers', 'staff'],
    channels: ['pa', 'app', 'push'],
    sentAt: '2026-06-20 09:42 AM',
    sentBy: 'Security Head Mr. Verma',
    totalTargets: 68,
    delivered: 67,
    read: 67,
    failed: 1,
    followUpSent: true,
    allClearSent: true,
    location: 'Gate 3',
    incidentId: 'INC-2026-0085',
  },
  {
    id: 5,
    title: '✅ ALL CLEAR — Security Situation Resolved',
    message: 'UPDATE: The security situation at Gate 3 has been fully resolved. The unauthorized individual has been escorted off premises. All students and staff may resume normal activities. Additional security measures are now in place. School is safe.',
    category: 'allclear',
    severity: 'info',
    status: 'sent',
    audience: ['all'],
    channels: ['pa', 'app', 'push'],
    sentAt: '2026-06-20 10:15 AM',
    sentBy: 'Principal Dr. Sharma',
    totalTargets: 1420,
    delivered: 1415,
    read: 1300,
    failed: 5,
    followUpSent: false,
    allClearSent: false,
    location: 'School Campus',
    incidentId: 'INC-2026-0085-AC',
  },
];

const MOCK_TEMPLATES: BroadcastTemplate[] = [
  {
    id: 1, name: 'School Lockdown',
    category: 'lockdown', severity: 'critical',
    title: '🔴 LOCKDOWN — Secure All Areas Immediately',
    message: 'EMERGENCY LOCKDOWN IN EFFECT. All students must move to the nearest classroom immediately. Lock and secure all doors and windows. Do not open doors for anyone. Turn off lights. Stay low and quiet. This is NOT a drill. Await further instructions from school administration.',
    defaultAudience: ['all'], defaultChannels: ['pa', 'push', 'sms', 'app'],
    isCustom: false, usageCount: 0,
  },
  {
    id: 2, name: 'Fire Emergency',
    category: 'fire', severity: 'critical',
    title: '🔥 FIRE ALERT — Evacuate Immediately',
    message: 'FIRE EMERGENCY: Fire detected on school premises. All students and staff must EVACUATE immediately via nearest emergency exit. Do NOT use elevators. Proceed to the main ground assembly point. Teachers — account for all students. This is NOT a drill.',
    defaultAudience: ['all'], defaultChannels: ['pa', 'push', 'sms'],
    isCustom: false, usageCount: 3,
  },
  {
    id: 3, name: 'School Closure',
    category: 'closure', severity: 'high',
    title: '⚠️ SCHOOL CLOSURE NOTICE',
    message: 'NOTICE: School will remain CLOSED tomorrow due to [REASON]. Online classes will be conducted as per regular schedule. Parents are requested to ensure student safety. School will resume on [DATE]. For queries, contact the school office.',
    defaultAudience: ['all'], defaultChannels: ['sms', 'push', 'email', 'app'],
    isCustom: false, usageCount: 5,
  },
  {
    id: 4, name: 'Medical Emergency (Staff)',
    category: 'medical', severity: 'critical',
    title: '🚑 MEDICAL EMERGENCY — Immediate Response Required',
    message: 'URGENT MEDICAL EMERGENCY at [LOCATION]. School doctor and first-aid team — respond immediately. All other staff and students remain in classrooms until further notice. Do NOT crowd the area.',
    defaultAudience: ['teachers', 'staff'], defaultChannels: ['pa', 'app'],
    isCustom: false, usageCount: 2,
  },
  {
    id: 5, name: 'Weather Advisory',
    category: 'weather', severity: 'high',
    title: '⛈️ SEVERE WEATHER ADVISORY',
    message: 'WEATHER ALERT: Severe weather conditions are expected in the area. All outdoor activities are cancelled. Students must remain indoors. Parents planning to pick up students early may do so after signing out at the gate. School will update further as conditions develop.',
    defaultAudience: ['all'], defaultChannels: ['sms', 'push', 'app'],
    isCustom: false, usageCount: 4,
  },
  {
    id: 6, name: 'Scheduled Fire Drill',
    category: 'drill', severity: 'medium',
    title: '🧯 FIRE DRILL — Scheduled Evacuation Exercise',
    message: 'NOTICE: A scheduled fire drill will commence shortly. All students and staff must evacuate via designated emergency exits to the assembly point. This is a DRILL. Please proceed calmly and cooperate with teachers and safety wardens.',
    defaultAudience: ['all'], defaultChannels: ['pa', 'app', 'push'],
    isCustom: false, usageCount: 7,
  },
  {
    id: 7, name: 'All Clear',
    category: 'allclear', severity: 'info',
    title: '✅ ALL CLEAR — Situation Resolved',
    message: 'UPDATE: The emergency situation has been fully resolved. All students and staff may resume normal activities. Thank you for your cooperation and calm response. Additional details will be shared via the school app and notice board.',
    defaultAudience: ['all'], defaultChannels: ['pa', 'push', 'app'],
    isCustom: false, usageCount: 8,
  },
  {
    id: 8, name: 'Evacuation Notice',
    category: 'evacuation', severity: 'critical',
    title: '🚨 EVACUATION ORDER — Leave Campus Immediately',
    message: 'EVACUATION ORDER: All persons on campus must evacuate immediately. Proceed to the designated external assembly point. Do NOT return to classrooms. Teachers — lead students in an orderly manner. Emergency services have been notified.',
    defaultAudience: ['all'], defaultChannels: ['pa', 'push', 'sms', 'app'],
    isCustom: false, usageCount: 1,
  },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<AlertSeverity, { label: string; color: string; bg: string; border: string; ring: string; glow: string; dot: string }> = {
  critical: { label: 'CRITICAL', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300',   ring: 'ring-red-500',    glow: 'shadow-red-200',    dot: 'bg-red-500' },
  high:     { label: 'HIGH',     color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300',ring: 'ring-orange-500', glow: 'shadow-orange-200', dot: 'bg-orange-500' },
  medium:   { label: 'MEDIUM',   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-300', ring: 'ring-amber-500',  glow: 'shadow-amber-200',  dot: 'bg-amber-500' },
  info:     { label: 'INFO',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-300',  ring: 'ring-blue-500',   glow: 'shadow-blue-200',   dot: 'bg-blue-400' },
};

const CATEGORY_CFG: Record<AlertCategory, { label: string; emoji: string; color: string }> = {
  lockdown:  { label: 'Lockdown',   emoji: '🔴', color: 'text-red-700' },
  fire:      { label: 'Fire Alert', emoji: '🔥', color: 'text-orange-700' },
  medical:   { label: 'Medical',    emoji: '🚑', color: 'text-rose-700' },
  weather:   { label: 'Weather',    emoji: '⛈️', color: 'text-blue-700' },
  closure:   { label: 'Closure',    emoji: '🏫', color: 'text-amber-700' },
  evacuation:{ label: 'Evacuation', emoji: '🚨', color: 'text-red-700' },
  security:  { label: 'Security',   emoji: '🔒', color: 'text-slate-700' },
  drill:     { label: 'Drill',      emoji: '🧯', color: 'text-teal-700' },
  allclear:  { label: 'All Clear',  emoji: '✅', color: 'text-emerald-700' },
  general:   { label: 'General',    emoji: '📢', color: 'text-violet-700' },
};

const CHANNEL_CFG: Record<DeliveryChannel, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  sms:   { label: 'SMS',            icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  push:  { label: 'Push Notif.',    icon: <Bell className="w-3.5 h-3.5" />,          color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  email: { label: 'Email',          icon: <Mail className="w-3.5 h-3.5" />,          color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  pa:    { label: 'PA System',      icon: <Volume2 className="w-3.5 h-3.5" />,       color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  app:   { label: 'App Alert',      icon: <Smartphone className="w-3.5 h-3.5" />,    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

const AUDIENCE_CFG: Record<AudienceTarget, { label: string; emoji: string; count: number }> = {
  all:       { label: 'Everyone',  emoji: '🌐', count: 1420 },
  students:  { label: 'Students',  emoji: '🎓', count: 860 },
  parents:   { label: 'Parents',   emoji: '👨‍👩‍👧', count: 750 },
  teachers:  { label: 'Teachers',  emoji: '👩‍🏫', count: 48 },
  staff:     { label: 'Staff',     emoji: '👷', count: 20 },
  transport: { label: 'Transport', emoji: '🚌', count: 12 },
};

const STATUS_CFG: Record<BroadcastStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Active',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  sent:      { label: 'Sent',       color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled',  color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200' },
  scheduled: { label: 'Scheduled',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  draft:     { label: 'Draft',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const EmergencyBroadcast: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('console');
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(MOCK_BROADCASTS);
  const [templates, setTemplates] = useState<BroadcastTemplate[]>(MOCK_TEMPLATES);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<BroadcastRecord | null>(MOCK_BROADCASTS[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplate | null>(null);

  // ── Compose state ──
  const [composeStep, setComposeStep] = useState<ComposeStep>(1);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCategory, setAlertCategory] = useState<AlertCategory>('general');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('high');
  const [alertAudience, setAlertAudience] = useState<AudienceTarget[]>(['all']);
  const [alertChannels, setAlertChannels] = useState<DeliveryChannel[]>(['push', 'app']);
  const [alertLocation, setAlertLocation] = useState('');
  const [alertScheduled, setAlertScheduled] = useState(false);
  const [alertScheduleTime, setAlertScheduleTime] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [liveDeliveryCount, setLiveDeliveryCount] = useState(0);

  // ── Settings state ──
  const [channels, setChannels] = useState({
    sms: true, push: true, email: true, pa: true, app: true,
  });
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [requireConfirm, setRequireConfirm] = useState(true);
  const [paVolume, setPaVolume] = useState(80);
  const [smsLimit, setSmsLimit] = useState(1000);

  // ── Stat helpers ──
  const activeBroadcasts = broadcasts.filter(b => b.status === 'active').length;
  const todaySent = broadcasts.filter(b => b.sentAt.includes('Jun 24')).length;
  const totalDelivered = broadcasts.reduce((a, b) => a + b.delivered, 0);
  const avgDeliveryRate = broadcasts.length > 0
    ? Math.round(broadcasts.reduce((a, b) => a + (b.delivered / b.totalTargets) * 100, 0) / broadcasts.length)
    : 0;

  // ── Animated delivery counter ──
  const liveCountRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (broadcastSent) {
      const targetCount = alertAudience.includes('all') ? 1420 : alertAudience.reduce((a, aud) => a + AUDIENCE_CFG[aud].count, 0);
      let count = 0;
      liveCountRef.current = setInterval(() => {
        count += Math.floor(Math.random() * 80) + 20;
        if (count >= targetCount) { count = targetCount; clearInterval(liveCountRef.current!); }
        setLiveDeliveryCount(count);
      }, 120);
    }
    return () => { if (liveCountRef.current) clearInterval(liveCountRef.current); };
  }, [broadcastSent]);

  // ── Handlers ──
  const toggleAudience = (a: AudienceTarget) => {
    if (a === 'all') { setAlertAudience(['all']); return; }
    setAlertAudience(prev => {
      const without = prev.filter(x => x !== 'all');
      return without.includes(a) ? without.filter(x => x !== a) : [...without, a];
    });
  };

  const toggleChannel = (c: DeliveryChannel) => {
    setAlertChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const loadTemplate = (t: BroadcastTemplate) => {
    setAlertTitle(t.title);
    setAlertMessage(t.message);
    setAlertCategory(t.category);
    setAlertSeverity(t.severity);
    setAlertAudience(t.defaultAudience);
    setAlertChannels(t.defaultChannels);
    setActiveTab('compose');
    setComposeStep(1);
    toast.success(`Template "${t.name}" loaded!`);
  };

  const targetCount = alertAudience.includes('all')
    ? AUDIENCE_CFG['all'].count
    : alertAudience.reduce((a, aud) => a + AUDIENCE_CFG[aud].count, 0);

  const handleSendBroadcast = async () => {
    if (requireConfirm && confirmText !== 'SEND EMERGENCY ALERT') {
      toast.error('Please type the confirmation phrase exactly as shown.');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 2000));
    setSending(false);
    setBroadcastSent(true);
    setLiveDeliveryCount(0);

    const newBroadcast: BroadcastRecord = {
      id: Date.now(),
      title: alertTitle,
      message: alertMessage,
      category: alertCategory,
      severity: alertSeverity,
      status: alertScheduled ? 'scheduled' : 'sent',
      audience: alertAudience,
      channels: alertChannels,
      sentAt: new Date().toLocaleString('en-IN'),
      sentBy: 'You (Admin)',
      totalTargets: targetCount,
      delivered: 0,
      read: 0,
      failed: 0,
      followUpSent: false,
      allClearSent: false,
      location: alertLocation,
      incidentId: `INC-2026-${String(Date.now()).slice(-4)}`,
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
    toast.success('🚨 Emergency broadcast sent!', { duration: 5000 });
  };

  const resetCompose = () => {
    setComposeStep(1); setAlertTitle(''); setAlertMessage(''); setAlertCategory('general');
    setAlertSeverity('high'); setAlertAudience(['all']); setAlertChannels(['push', 'app']);
    setAlertLocation(''); setAlertScheduled(false); setAlertScheduleTime('');
    setConfirmText(''); setSending(false); setBroadcastSent(false); setLiveDeliveryCount(0);
  };

  const sendAllClear = (id: number) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, allClearSent: true } : b));
    toast.success('✅ All Clear notification sent!');
  };

  const deleteTemplate = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted.');
  };

  const filteredHistory = broadcasts.filter(b =>
    !historySearch || b.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    b.incidentId.toLowerCase().includes(historySearch.toLowerCase())
  );

  const sevCfg = SEVERITY_CFG[alertSeverity];

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-700 via-rose-700 to-orange-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg relative">
            <Radio className="w-4 h-4" />
            {activeBroadcasts > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-red-700 animate-ping" />
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Emergency Broadcast Console</h1>
            <p className="text-[9px] text-red-200 font-medium">Multi-channel · Real-time · All Campus Alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeBroadcasts > 0 && (
            <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 px-2.5 py-1 rounded-full animate-pulse">
              <AlertOctagon className="w-3 h-3 text-yellow-300" />
              <span className="text-[9px] font-bold text-yellow-200">{activeBroadcasts} Active Alert{activeBroadcasts > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Activity className="w-3 h-3 text-red-200" />
            <span className="text-[9px] font-bold">{avgDeliveryRate}% avg delivery</span>
          </div>
          <button
            onClick={() => { setActiveTab('compose'); resetCompose(); }}
            className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Siren className="w-3.5 h-3.5" /> New Broadcast
          </button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50/40 border-b border-red-100 flex-shrink-0 overflow-x-auto">
        {[
          { label: 'Active Alerts', val: activeBroadcasts, icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Sent Today', val: todaySent, icon: <Send className="w-3 h-3" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Total Sent', val: broadcasts.filter(b => b.status === 'sent').length, icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Recipients Reached', val: totalDelivered.toLocaleString(), icon: <Users className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Avg. Delivery', val: `${avgDeliveryRate}%`, icon: <TrendingUp className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Templates', val: templates.length, icon: <FileText className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${s.bg} border ${s.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
            <span className="text-[9px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        {([
          { key: 'console',   label: 'Control Center', icon: <Monitor className="w-3.5 h-3.5" /> },
          { key: 'compose',   label: 'New Broadcast',  icon: <Siren className="w-3.5 h-3.5" />, badge: true },
          { key: 'templates', label: 'Templates',      icon: <FileText className="w-3.5 h-3.5" />, badge: templates.length },
          { key: 'history',   label: 'Broadcast Log',  icon: <History className="w-3.5 h-3.5" />, badge: broadcasts.length },
          { key: 'settings',  label: 'Settings',       icon: <Settings className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-red-700 border-b-2 border-red-600 bg-red-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && typeof (t as any).badge === 'number' && (t as any).badge > 0 && (
              <span className="bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════ CONSOLE TAB ═══════ */}
        {activeTab === 'console' && (
          <div className="p-4 space-y-5">
            {/* Active Alerts Banner */}
            {activeBroadcasts > 0 ? (
              <div className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <AlertOctagon className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-extrabold">{activeBroadcasts} ACTIVE EMERGENCY ALERT{activeBroadcasts > 1 ? 'S' : ''}</p>
                  <p className="text-[9px] text-red-200">Ongoing incident — monitor and send All Clear when situation resolves</p>
                </div>
                <button className="bg-white text-red-700 px-3 py-1.5 rounded-lg text-[9px] font-extrabold cursor-pointer hover:bg-red-50 transition flex-shrink-0">
                  View Active
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-extrabold text-emerald-800">All Clear — No Active Emergencies</p>
                  <p className="text-[9px] text-emerald-600">School campus is currently in normal operation mode.</p>
                </div>
              </div>
            )}

            {/* Quick Action Grid */}
            <div>
              <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">⚡ Quick Broadcast — Select Alert Type</h3>
              <div className="grid grid-cols-4 gap-3">
                {([
                  { cat: 'lockdown' as AlertCategory, sev: 'critical' as AlertSeverity, label: 'Lockdown', icon: <Lock className="w-5 h-5" />, bg: 'bg-red-600', hover: 'hover:bg-red-700' },
                  { cat: 'fire' as AlertCategory,     sev: 'critical' as AlertSeverity, label: 'Fire Alert', icon: <Flame className="w-5 h-5" />, bg: 'bg-orange-600', hover: 'hover:bg-orange-700' },
                  { cat: 'medical' as AlertCategory,  sev: 'critical' as AlertSeverity, label: 'Medical', icon: <Heart className="w-5 h-5" />, bg: 'bg-rose-600', hover: 'hover:bg-rose-700' },
                  { cat: 'evacuation' as AlertCategory, sev: 'critical' as AlertSeverity, label: 'Evacuation', icon: <ArrowRight className="w-5 h-5" />, bg: 'bg-red-700', hover: 'hover:bg-red-800' },
                  { cat: 'security' as AlertCategory, sev: 'critical' as AlertSeverity, label: 'Security', icon: <Shield className="w-5 h-5" />, bg: 'bg-slate-700', hover: 'hover:bg-slate-800' },
                  { cat: 'weather' as AlertCategory,  sev: 'high' as AlertSeverity,     label: 'Weather', icon: <CloudRain className="w-5 h-5" />, bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
                  { cat: 'closure' as AlertCategory,  sev: 'high' as AlertSeverity,     label: 'Closure', icon: <Lock className="w-5 h-5" />, bg: 'bg-amber-600', hover: 'hover:bg-amber-700' },
                  { cat: 'allclear' as AlertCategory, sev: 'info' as AlertSeverity,     label: 'All Clear', icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
                ]).map((q, i) => {
                  const tmpl = templates.find(t => t.category === q.cat);
                  return (
                    <button key={i} onClick={() => {
                      if (tmpl) { loadTemplate(tmpl); } else {
                        setAlertCategory(q.cat); setAlertSeverity(q.sev); setActiveTab('compose'); setComposeStep(1);
                      }
                    }}
                      className={`${q.bg} ${q.hover} text-white rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm`}>
                      {q.icon}
                      <span className="text-[9px] font-extrabold">{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent broadcasts */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><History className="w-4 h-4 text-red-500" /> Recent Broadcasts</h3>
                <button onClick={() => setActiveTab('history')} className="text-[8.5px] font-bold text-red-600 hover:text-red-700 cursor-pointer flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {broadcasts.slice(0, 4).map(b => {
                  const sevCfg2 = SEVERITY_CFG[b.severity];
                  const catCfg2 = CATEGORY_CFG[b.category];
                  const deliveryRate = Math.round((b.delivered / b.totalTargets) * 100);
                  return (
                    <div key={b.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => { setSelectedHistory(b); setActiveTab('history'); }}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${sevCfg2.bg}`}>{catCfg2.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-full border ${sevCfg2.color} ${sevCfg2.bg} ${sevCfg2.border}`}>{sevCfg2.label}</span>
                        </div>
                        <p className="text-[9.5px] font-bold text-slate-800 truncate">{b.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[7.5px] text-slate-400 font-medium">
                          <span>{b.incidentId}</span><span>{b.sentAt}</span>
                          <span className="text-emerald-600 font-bold">{deliveryRate}% delivered</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!b.allClearSent && b.category !== 'allclear' && b.status === 'sent' && (
                          <button onClick={e => { e.stopPropagation(); sendAllClear(b.id); }}
                            className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg text-[7.5px] font-extrabold cursor-pointer hover:bg-emerald-100 transition">
                            <CheckCircle className="w-2.5 h-2.5" /> All Clear
                          </button>
                        )}
                        <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_CFG[b.status].color} ${STATUS_CFG[b.status].bg} ${STATUS_CFG[b.status].border}`}>
                          {STATUS_CFG[b.status].label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel status */}
            <div className="grid grid-cols-5 gap-3">
              {(Object.entries(CHANNEL_CFG) as [DeliveryChannel, typeof CHANNEL_CFG[DeliveryChannel]][]).map(([key, cfg]) => (
                <div key={key} className={`border ${channels[key] ? cfg.border + ' ' + cfg.bg : 'border-slate-200 bg-slate-50'} rounded-xl p-3 text-center`}>
                  <div className={`flex justify-center mb-1.5 ${channels[key] ? cfg.color : 'text-slate-400'}`}>{cfg.icon}</div>
                  <p className={`text-[8.5px] font-extrabold ${channels[key] ? cfg.color : 'text-slate-400'}`}>{cfg.label}</p>
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${channels[key] ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <p className="text-[7px] text-slate-400 mt-0.5">{channels[key] ? 'Online' : 'Disabled'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ COMPOSE TAB ═══════ */}
        {activeTab === 'compose' && (
          <div className="max-w-2xl mx-auto p-5">
            {broadcastSent ? (
              /* ── POST-SEND VIEW ── */
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Radio className="w-7 h-7 animate-pulse" />
                  </div>
                  <h3 className="text-[16px] font-extrabold">Broadcast Sent!</h3>
                  <p className="text-[10px] text-red-200 mt-1">Emergency alert dispatched across {alertChannels.length} channel{alertChannels.length > 1 ? 's' : ''}</p>
                </div>
                {/* Live delivery counter */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center space-y-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Live Delivery Count</p>
                  <div className="text-[40px] font-extrabold text-red-600 tabular-nums">{liveDeliveryCount.toLocaleString()}</div>
                  <p className="text-[9px] text-slate-400">of {targetCount.toLocaleString()} recipients</p>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (liveDeliveryCount / targetCount) * 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { label: 'Channels', val: alertChannels.length },
                      { label: 'Audience', val: alertAudience.includes('all') ? 'All' : alertAudience.length + ' groups' },
                      { label: 'Severity', val: SEVERITY_CFG[alertSeverity].label },
                    ].map((k, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className="text-[10px] font-extrabold text-slate-700">{k.val}</p>
                        <p className="text-[7.5px] text-slate-400 font-medium">{k.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetCompose} className="flex-1 py-3 border border-slate-200 text-[10px] font-extrabold text-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                    New Broadcast
                  </button>
                  <button onClick={() => { resetCompose(); setAlertCategory('allclear'); setAlertSeverity('info'); loadTemplate(templates.find(t => t.category === 'allclear')!); }}
                    className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-extrabold rounded-xl cursor-pointer hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Send All Clear
                  </button>
                </div>
              </div>
            ) : (
              /* ── COMPOSE FORM ── */
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-2">
                  {([
                    { step: 1 as ComposeStep, label: 'Alert Details' },
                    { step: 2 as ComposeStep, label: 'Recipients & Channels' },
                    { step: 3 as ComposeStep, label: 'Review & Confirm' },
                  ]).map((s, i) => (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => composeStep > s.step && setComposeStep(s.step)}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold border-2 transition ${composeStep === s.step ? 'bg-red-600 text-white border-red-600' : composeStep > s.step ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-300'}`}>
                          {composeStep > s.step ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                        </div>
                        <span className={`text-[9px] font-bold hidden sm:block ${composeStep === s.step ? 'text-red-700' : 'text-slate-400'}`}>{s.label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${composeStep > s.step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* STEP 1 – Alert Details */}
                {composeStep === 1 && (
                  <div className="space-y-4">
                    {/* Severity selector */}
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Alert Severity *</label>
                      <div className="grid grid-cols-4 gap-2 mt-1.5">
                        {(Object.entries(SEVERITY_CFG) as [AlertSeverity, typeof SEVERITY_CFG[AlertSeverity]][]).map(([sev, cfg]) => (
                          <button key={sev} type="button" onClick={() => setAlertSeverity(sev)}
                            className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${alertSeverity === sev ? `${cfg.border} ${cfg.bg}` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <div className={`w-3 h-3 rounded-full ${cfg.dot} mx-auto mb-1 ${sev === 'critical' || sev === 'high' ? 'animate-pulse' : ''}`} />
                            <span className={`text-[8px] font-extrabold ${alertSeverity === sev ? cfg.color : 'text-slate-500'}`}>{cfg.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Alert Category *</label>
                      <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                        {(Object.entries(CATEGORY_CFG) as [AlertCategory, typeof CATEGORY_CFG[AlertCategory]][]).map(([cat, cfg]) => (
                          <button key={cat} type="button" onClick={() => setAlertCategory(cat)}
                            className={`p-2 rounded-xl border text-center transition cursor-pointer ${alertCategory === cat ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-red-200'}`}>
                            <div className="text-[14px] mb-0.5">{cfg.emoji}</div>
                            <span className={`text-[7.5px] font-bold ${alertCategory === cat ? cfg.color : 'text-slate-500'}`}>{cfg.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Alert Title *</label>
                      <input type="text" placeholder="e.g. 🔥 FIRE ALERT — Evacuate Immediately"
                        value={alertTitle} onChange={e => setAlertTitle(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-red-300" />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Alert Message *</label>
                      <textarea rows={5} placeholder="Describe the emergency situation, instructions, and next steps clearly…"
                        value={alertMessage} onChange={e => setAlertMessage(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300 resize-none" />
                      <p className="text-[8px] text-slate-400 mt-0.5 text-right">{alertMessage.length} chars</p>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Incident Location <span className="text-slate-400 font-medium">(optional)</span></label>
                      <div className="relative mt-1">
                        <MapPin className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="e.g. Block A, Room 204 / Main Gate / Sports Ground"
                          value={alertLocation} onChange={e => setAlertLocation(e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300" />
                      </div>
                    </div>

                    <button onClick={() => { if (!alertTitle.trim() || !alertMessage.trim()) { toast.error('Title and message are required.'); return; } setComposeStep(2); }}
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shadow-sm">
                      Next: Set Audience & Channels <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2 – Audience & Channels */}
                {composeStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-red-600" /> Target Audience</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(AUDIENCE_CFG) as [AudienceTarget, typeof AUDIENCE_CFG[AudienceTarget]][]).map(([aud, cfg]) => {
                          const isSelected = alertAudience.includes(aud);
                          return (
                            <button key={aud} type="button" onClick={() => toggleAudience(aud)}
                              className={`p-3 rounded-xl border-2 text-center transition cursor-pointer ${isSelected ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-red-200'}`}>
                              <div className="text-[18px] mb-1">{cfg.emoji}</div>
                              <p className={`text-[9px] font-extrabold ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>{cfg.label}</p>
                              <p className="text-[7.5px] text-slate-400">{cfg.count.toLocaleString()}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        <p className="text-[9px] font-bold text-red-700">
                          {targetCount.toLocaleString()} people will receive this broadcast
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Radio className="w-4 h-4 text-red-600" /> Delivery Channels</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(CHANNEL_CFG) as [DeliveryChannel, typeof CHANNEL_CFG[DeliveryChannel]][]).map(([ch, cfg]) => {
                          const isSelected = alertChannels.includes(ch);
                          const isEnabled = channels[ch];
                          return (
                            <button key={ch} type="button" disabled={!isEnabled}
                              onClick={() => toggleChannel(ch)}
                              className={`p-3 rounded-xl border-2 text-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isSelected && isEnabled ? `${cfg.border} ${cfg.bg}` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <div className={`flex justify-center mb-1.5 ${isSelected && isEnabled ? cfg.color : 'text-slate-400'}`}>{cfg.icon}</div>
                              <p className={`text-[9px] font-extrabold ${isSelected && isEnabled ? cfg.color : 'text-slate-500'}`}>{cfg.label}</p>
                              {!isEnabled && <p className="text-[7px] text-red-400 font-bold">Disabled</p>}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[8px] text-slate-400">You can enable/disable channels globally in Settings tab.</p>
                    </div>

                    {/* Schedule toggle */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> Schedule Broadcast</h3>
                        <button type="button" onClick={() => setAlertScheduled(!alertScheduled)}
                          className={`transition cursor-pointer ${alertScheduled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {alertScheduled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </div>
                      {alertScheduled && (
                        <input type="datetime-local" value={alertScheduleTime} onChange={e => setAlertScheduleTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-red-300" />
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setComposeStep(1)} className="px-5 py-3 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50">← Back</button>
                      <button onClick={() => { if (alertChannels.length === 0) { toast.error('Select at least one channel.'); return; } setComposeStep(3); }}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shadow-sm">
                        Next: Review & Confirm <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 – Review & Confirm */}
                {composeStep === 3 && (
                  <div className="space-y-4">
                    {/* Alert preview */}
                    <div className={`border-2 ${sevCfg.border} rounded-2xl overflow-hidden shadow-sm`}>
                      <div className={`px-5 py-3 ${alertSeverity === 'critical' ? 'bg-red-600' : alertSeverity === 'high' ? 'bg-orange-600' : alertSeverity === 'medium' ? 'bg-amber-500' : 'bg-blue-600'} text-white flex items-center gap-2`}>
                        <AlertOctagon className={`w-4 h-4 ${alertSeverity === 'critical' ? 'animate-pulse' : ''}`} />
                        <span className="text-[9px] font-extrabold uppercase tracking-wider">{sevCfg.label} — {CATEGORY_CFG[alertCategory].emoji} {CATEGORY_CFG[alertCategory].label}</span>
                      </div>
                      <div className="p-5 space-y-3 bg-white">
                        <h4 className="text-[12px] font-extrabold text-slate-900">{alertTitle}</h4>
                        <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{alertMessage}</p>
                        {alertLocation && (
                          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3" /> {alertLocation}
                          </div>
                        )}
                        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
                          {alertChannels.map(ch => {
                            const cfg = CHANNEL_CFG[ch];
                            return (
                              <span key={ch} className={`flex items-center gap-1 text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Sending to: {alertAudience.map(a => AUDIENCE_CFG[a].label).join(', ')} — <strong className="text-red-600">{targetCount.toLocaleString()} recipients</strong>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation phrase */}
                    {requireConfirm && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-extrabold text-amber-800">Authorization Required</h4>
                            <p className="text-[9px] text-amber-700 mt-0.5">Type exactly the phrase below to authorize this broadcast:</p>
                          </div>
                        </div>
                        <div className="bg-white border border-amber-300 rounded-xl px-3 py-2">
                          <p className="text-[10px] font-extrabold text-red-700 tracking-wide font-mono">SEND EMERGENCY ALERT</p>
                        </div>
                        <input type="text" placeholder="Type the phrase above…" value={confirmText}
                          onChange={e => setConfirmText(e.target.value)}
                          className={`w-full px-3 py-2.5 border-2 rounded-xl text-[10px] font-bold outline-none transition ${confirmText === 'SEND EMERGENCY ALERT' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:ring-2 focus:ring-red-300'}`} />
                        {confirmText === 'SEND EMERGENCY ALERT' && (
                          <p className="text-[8.5px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Authorization confirmed</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setComposeStep(2)} className="px-5 py-3 border border-slate-200 text-[9px] font-bold text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50">← Back</button>
                      <button onClick={handleSendBroadcast} disabled={sending || (requireConfirm && confirmText !== 'SEND EMERGENCY ALERT')}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {sending
                          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                          : <><Radio className="w-4 h-4 animate-pulse" /> Send Emergency Broadcast</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════ TEMPLATES TAB ═══════ */}
        {activeTab === 'templates' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold text-slate-800">{templates.length} Emergency Templates</h3>
              <button onClick={() => toast('Custom templates coming soon!', { icon: '🛠️' })}
                className="flex items-center gap-1.5 text-[9px] font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg cursor-pointer">
                <Plus className="w-3 h-3" /> Custom Template
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {templates.map(tmpl => {
                const sevCfg2 = SEVERITY_CFG[tmpl.severity];
                const catCfg2 = CATEGORY_CFG[tmpl.category];
                return (
                  <div key={tmpl.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className={`px-5 py-3 ${tmpl.severity === 'critical' ? 'bg-gradient-to-r from-red-600 to-rose-600' : tmpl.severity === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : tmpl.severity === 'medium' ? 'bg-gradient-to-r from-amber-400 to-yellow-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{catCfg2.emoji}</span>
                        <div>
                          <h4 className="text-[10px] font-extrabold">{tmpl.name}</h4>
                          <p className="text-[8px] opacity-80">{sevCfg2.label} severity · used {tmpl.usageCount}×</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          {tmpl.defaultAudience.map(a => AUDIENCE_CFG[a].emoji).join('')}
                        </span>
                        {tmpl.isCustom && <span className="text-[7.5px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Custom</span>}
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <h5 className="text-[9.5px] font-bold text-slate-800 mb-1.5">{tmpl.title}</h5>
                      <p className="text-[8.5px] text-slate-500 leading-relaxed line-clamp-3">{tmpl.message}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {tmpl.defaultChannels.map(ch => {
                          const cfg = CHANNEL_CFG[ch];
                          return (
                            <span key={ch} className={`flex items-center gap-1 text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })}
                        <div className="ml-auto flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(tmpl.message); toast.success('Message copied!'); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition" title="Copy">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {tmpl.isCustom && (
                            <button onClick={() => deleteTemplate(tmpl.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => loadTemplate(tmpl)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-1.5 rounded-lg text-[8.5px] font-extrabold cursor-pointer hover:opacity-90 transition">
                            Use Template <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ HISTORY TAB ═══════ */}
        {activeTab === 'history' && (
          <div className="flex h-full">
            {/* Left: list */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search broadcasts…" value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-red-300" />
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredHistory.map(b => {
                  const sevCfg2 = SEVERITY_CFG[b.severity];
                  const catCfg2 = CATEGORY_CFG[b.category];
                  const isSelected = selectedHistory?.id === b.id;
                  return (
                    <div key={b.id} onClick={() => setSelectedHistory(b)}
                      className={`px-4 py-3 cursor-pointer hover:bg-red-50/30 transition ${isSelected ? 'bg-red-50/50 border-l-2 border-red-500' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px]">{catCfg2.emoji}</span>
                        <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-full ${sevCfg2.color} ${sevCfg2.bg} border ${sevCfg2.border}`}>{sevCfg2.label}</span>
                        <span className={`text-[7px] font-bold ml-auto ${STATUS_CFG[b.status].color}`}>{STATUS_CFG[b.status].label}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-800 leading-tight line-clamp-2">{b.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[7.5px] text-slate-400 font-medium">
                        <span>{b.incidentId}</span>
                        <span>{b.sentAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <History className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-[11px] font-bold">Select a broadcast to view details</p>
                </div>
              ) : (() => {
                const b = selectedHistory;
                const sevCfg2 = SEVERITY_CFG[b.severity];
                const catCfg2 = CATEGORY_CFG[b.category];
                const deliveryRate = Math.round((b.delivered / b.totalTargets) * 100);
                const readRate = Math.round((b.read / b.totalTargets) * 100);
                return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className={`border-2 ${sevCfg2.border} rounded-2xl overflow-hidden`}>
                      <div className={`px-5 py-3 ${b.severity === 'critical' ? 'bg-red-600' : b.severity === 'high' ? 'bg-orange-600' : b.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-600'} text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider">{sevCfg2.label} · {catCfg2.emoji} {catCfg2.label}</span>
                          </div>
                          <span className="text-[8px] font-bold opacity-80">{b.incidentId}</span>
                        </div>
                        <h4 className="text-[12px] font-extrabold mt-2 leading-snug">{b.title}</h4>
                        <p className="text-[8.5px] opacity-80 mt-0.5">Sent {b.sentAt} by {b.sentBy}</p>
                      </div>
                      <div className="p-5 space-y-3 bg-white">
                        <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{b.message}</p>
                        {b.location && (
                          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3" /> {b.location}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {b.channels.map(ch => {
                            const cfg = CHANNEL_CFG[ch];
                            return (
                              <span key={ch} className={`flex items-center gap-1 text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {b.audience.map(a => {
                              const cfg = AUDIENCE_CFG[a];
                              return (
                                <span key={a} className="text-[7.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {cfg.emoji} {cfg.label}
                                </span>
                              );
                            })}
                          </div>
                          {!b.allClearSent && b.category !== 'allclear' && b.status === 'sent' && (
                            <button onClick={() => sendAllClear(b.id)}
                              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-[8.5px] font-extrabold cursor-pointer hover:bg-emerald-100 transition">
                              <CheckCircle className="w-3 h-3" /> Send All Clear
                            </button>
                          )}
                          {b.allClearSent && (
                            <span className="flex items-center gap-1 text-[7.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-2.5 h-2.5" /> All Clear Sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery analytics */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-red-500" /> Delivery Analytics</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Total Targets', val: b.totalTargets.toLocaleString(), color: 'text-slate-700' },
                          { label: 'Delivered', val: b.delivered.toLocaleString(), color: 'text-emerald-600', pct: deliveryRate },
                          { label: 'Read', val: b.read.toLocaleString(), color: 'text-blue-600', pct: readRate },
                          { label: 'Failed', val: b.failed.toLocaleString(), color: 'text-red-600' },
                        ].map((k, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className={`text-[18px] font-extrabold ${k.color}`}>{k.val}</div>
                            <p className="text-[7.5px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                            {'pct' in k && <p className={`text-[8px] font-extrabold mt-0.5 ${k.color}`}>{k.pct}%</p>}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { label: 'Delivery Rate', pct: deliveryRate, color: 'bg-emerald-500' },
                          { label: 'Read Rate', pct: readRate, color: 'bg-blue-500' },
                          { label: 'Failure Rate', pct: Math.round((b.failed / b.totalTargets) * 100), color: 'bg-red-400' },
                        ].map((bar, i) => (
                          <div key={i}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[8.5px] font-bold text-slate-600">{bar.label}</span>
                              <span className="text-[8.5px] font-extrabold text-slate-700">{bar.pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full transition-all duration-700 ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-[11px] font-extrabold text-slate-800 mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Incident Flags</h4>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { label: 'Follow-up Sent', val: b.followUpSent, trueColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', falseColor: 'text-slate-500 bg-slate-50 border-slate-200' },
                          { label: 'All Clear Sent', val: b.allClearSent, trueColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', falseColor: 'text-amber-600 bg-amber-50 border-amber-200' },
                        ].map((f, i) => (
                          <span key={i} className={`flex items-center gap-1.5 text-[8.5px] font-bold px-3 py-1.5 rounded-full border ${f.val ? f.trueColor : f.falseColor}`}>
                            {f.val ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {f.label}: {f.val ? 'Yes' : 'No'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═══════ SETTINGS TAB ═══════ */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto p-5 space-y-5">
            {/* Channel toggles */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Radio className="w-4 h-4 text-red-600" /> Broadcast Channels</h3>
              {(Object.entries(CHANNEL_CFG) as [DeliveryChannel, typeof CHANNEL_CFG[DeliveryChannel]][]).map(([ch, cfg]) => (
                <div key={ch} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${cfg.bg} border ${cfg.border}`}><span className={cfg.color}>{cfg.icon}</span></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800">{cfg.label}</p>
                      <p className="text-[8px] text-slate-400">{ch === 'pa' ? 'School intercom system' : ch === 'sms' ? 'Registered mobile numbers' : ch === 'push' ? 'School mobile app' : ch === 'email' ? 'Registered email addresses' : 'In-app notification banner'}</p>
                    </div>
                  </div>
                  <button onClick={() => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }))}
                    className={`transition cursor-pointer ${channels[ch] ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {channels[ch] ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Security settings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Shield className="w-4 h-4 text-slate-600" /> Security & Safety</h3>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-800">Require Confirmation Phrase</p>
                  <p className="text-[8px] text-slate-400">Mandatory phrase before sending any broadcast</p>
                </div>
                <button onClick={() => setRequireConfirm(!requireConfirm)}
                  className={`transition cursor-pointer ${requireConfirm ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {requireConfirm ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-800">Auto-Escalation</p>
                  <p className="text-[8px] text-slate-400">Notify Principal & Emergency Contacts automatically on critical alerts</p>
                </div>
                <button onClick={() => setAutoEscalate(!autoEscalate)}
                  className={`transition cursor-pointer ${autoEscalate ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {autoEscalate ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>
            </div>

            {/* Channel config */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-500" /> Channel Configuration</h3>
              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">PA System Volume ({paVolume}%)</label>
                <input type="range" min={20} max={100} value={paVolume} onChange={e => setPaVolume(Number(e.target.value))}
                  className="w-full mt-2 accent-red-600" />
                <div className="flex justify-between text-[7.5px] text-slate-400 mt-1"><span>Low</span><span>Max</span></div>
              </div>
              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Daily SMS Quota Limit</label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="number" value={smsLimit} onChange={e => setSmsLimit(Number(e.target.value))}
                    className="w-28 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-red-300" />
                  <span className="text-[9px] text-slate-500 font-medium">messages/day</span>
                </div>
              </div>
            </div>

            <button onClick={() => toast.success('Settings saved successfully!')}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90 transition">
              <CheckCircle className="w-4 h-4" /> Save Settings
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmergencyBroadcast;
