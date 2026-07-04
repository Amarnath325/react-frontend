import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart2, TrendingUp, TrendingDown, Send, CheckCircle, Eye,
  XCircle, AlertTriangle, MessageSquare, Mail, Bell, Smartphone,
  Users, Clock, RefreshCw, Download, Filter, Search, Calendar,
  ChevronRight, ChevronUp, ChevronDown, Activity, Zap, Target,
  Globe, ArrowUpRight, ArrowDownRight, Layers, PieChart,
  FileText, Settings, Radio, MessageCircle, Volume2, Star,
  Inbox, AlertCircle, CheckSquare, Hash, ToggleLeft, ToggleRight,
  Award, Percent, Phone
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MainTab = 'overview' | 'channels' | 'campaigns' | 'audience' | 'failures' | 'reports';
type ChannelKey = 'sms' | 'email' | 'push' | 'app' | 'pa' | 'whatsapp';
type AudienceKey = 'students' | 'parents' | 'teachers' | 'staff' | 'alumni';
type DateRange = '7d' | '30d' | '90d' | 'custom';

interface KPI {
  label: string;
  value: number | string;
  unit?: string;
  trend: number;
  trendDir: 'up' | 'down';
  trendGood: boolean;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

interface ChannelStats {
  key: ChannelKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  gradFrom: string;
  gradTo: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  bounced: number;
  avgDeliveryMs: number;
  deliveryRate: number;
  readRate: number;
  failRate: number;
  trend: number;
  enabled: boolean;
}

interface Campaign {
  id: number;
  title: string;
  type: string;
  channels: ChannelKey[];
  audience: AudienceKey[];
  sentAt: string;
  totalSent: number;
  delivered: number;
  read: number;
  clicked: number;
  failed: number;
  bounced: number;
  deliveryRate: number;
  readRate: number;
  status: 'completed' | 'sending' | 'scheduled' | 'failed';
  category: string;
}

interface DailyData {
  label: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

interface FailureRecord {
  id: number;
  channel: ChannelKey;
  recipient: string;
  recipientType: AudienceKey;
  message: string;
  reason: string;
  errorCode: string;
  timestamp: string;
  retries: number;
  resolved: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const WEEKLY_DATA: DailyData[] = [
  { label: 'Mon', sent: 1820, delivered: 1798, read: 1410, failed: 22 },
  { label: 'Tue', sent: 2340, delivered: 2290, read: 1870, failed: 50 },
  { label: 'Wed', sent: 980,  delivered: 970,  read: 750,  failed: 10 },
  { label: 'Thu', sent: 3150, delivered: 3100, read: 2540, failed: 50 },
  { label: 'Fri', sent: 2670, delivered: 2610, read: 2100, failed: 60 },
  { label: 'Sat', sent: 1240, delivered: 1220, read: 890,  failed: 20 },
  { label: 'Sun', sent: 540,  delivered: 535,  read: 380,  failed: 5 },
];

const MONTHLY_DATA: DailyData[] = [
  { label: 'W1', sent: 12400, delivered: 12180, read: 9800,  failed: 220 },
  { label: 'W2', sent: 15600, delivered: 15300, read: 12100, failed: 300 },
  { label: 'W3', sent: 11200, delivered: 10900, read: 8600,  failed: 300 },
  { label: 'W4', sent: 18900, delivered: 18600, read: 15200, failed: 300 },
];

const CHANNEL_STATS: ChannelStats[] = [
  {
    key: 'sms', label: 'SMS', icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    gradFrom: 'from-green-500', gradTo: 'to-emerald-600',
    sent: 18420, delivered: 18102, read: 14280, failed: 318, bounced: 94,
    avgDeliveryMs: 1200, deliveryRate: 98.3, readRate: 77.5, failRate: 1.7,
    trend: 3.2, enabled: true,
  },
  {
    key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />,
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    gradFrom: 'from-violet-500', gradTo: 'to-purple-600',
    sent: 12840, delivered: 12290, read: 7890, failed: 550, bounced: 310,
    avgDeliveryMs: 4800, deliveryRate: 95.7, readRate: 61.4, failRate: 4.3,
    trend: -1.1, enabled: true,
  },
  {
    key: 'push', label: 'Push Notif.', icon: <Bell className="w-4 h-4" />,
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    gradFrom: 'from-blue-500', gradTo: 'to-indigo-600',
    sent: 24680, delivered: 22980, read: 16480, failed: 1700, bounced: 420,
    avgDeliveryMs: 800, deliveryRate: 93.1, readRate: 66.8, failRate: 6.9,
    trend: 5.8, enabled: true,
  },
  {
    key: 'app', label: 'App Alert', icon: <Smartphone className="w-4 h-4" />,
    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200',
    gradFrom: 'from-indigo-500', gradTo: 'to-blue-700',
    sent: 28940, delivered: 28760, read: 23480, failed: 180, bounced: 42,
    avgDeliveryMs: 320, deliveryRate: 99.4, readRate: 81.1, failRate: 0.6,
    trend: 7.2, enabled: true,
  },
  {
    key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200',
    gradFrom: 'from-teal-500', gradTo: 'to-green-600',
    sent: 9240, delivered: 9140, read: 8290, failed: 100, bounced: 18,
    avgDeliveryMs: 600, deliveryRate: 98.9, readRate: 89.7, failRate: 1.1,
    trend: 12.4, enabled: true,
  },
  {
    key: 'pa', label: 'PA System', icon: <Volume2 className="w-4 h-4" />,
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',
    gradFrom: 'from-orange-500', gradTo: 'to-amber-600',
    sent: 420, delivered: 418, read: 418, failed: 2, bounced: 0,
    avgDeliveryMs: 100, deliveryRate: 99.5, readRate: 99.5, failRate: 0.5,
    trend: 0.5, enabled: true,
  },
];

const CAMPAIGNS: Campaign[] = [
  { id: 1, title: 'Monthly Fee Reminder — July 2026', type: 'Fee Reminder', channels: ['sms', 'push', 'email'], audience: ['parents'], sentAt: '2026-06-20 09:00 AM', totalSent: 748, delivered: 742, read: 618, clicked: 294, failed: 6, bounced: 2, deliveryRate: 99.2, readRate: 82.6, status: 'completed', category: 'Finance' },
  { id: 2, title: 'PTM Invitation — July 5th', type: 'Event Notification', channels: ['sms', 'email', 'app'], audience: ['parents', 'teachers'], sentAt: '2026-06-18 10:30 AM', totalSent: 812, delivered: 800, read: 712, clicked: 0, failed: 12, bounced: 5, deliveryRate: 98.5, readRate: 87.6, status: 'completed', category: 'Events' },
  { id: 3, title: 'Summer Vacation Notice 2026', type: 'School Announcement', channels: ['sms', 'push', 'app', 'email'], audience: ['students', 'parents', 'teachers'], sentAt: '2026-06-15 02:00 PM', totalSent: 1420, delivered: 1405, read: 1190, clicked: 0, failed: 15, bounced: 8, deliveryRate: 98.9, readRate: 83.8, status: 'completed', category: 'Academics' },
  { id: 4, title: 'FIRE DRILL Emergency Broadcast', type: 'Emergency Alert', channels: ['pa', 'push', 'app'], audience: ['students', 'parents', 'teachers', 'staff'], sentAt: '2026-06-24 10:55 AM', totalSent: 1420, delivered: 1398, read: 1310, clicked: 0, failed: 22, bounced: 0, deliveryRate: 98.5, readRate: 92.2, status: 'completed', category: 'Emergency' },
  { id: 5, title: 'Exam Timetable — Annual Exams 2026', type: 'Academic Alert', channels: ['app', 'push', 'email'], audience: ['students', 'parents'], sentAt: '2026-06-12 11:00 AM', totalSent: 1620, delivered: 1608, read: 1420, clicked: 890, failed: 12, bounced: 4, deliveryRate: 99.3, readRate: 87.6, status: 'completed', category: 'Academics' },
  { id: 6, title: 'Attendance Alert — Batch 12-A', type: 'Attendance Alert', channels: ['sms', 'app'], audience: ['parents'], sentAt: '2026-06-24 04:30 PM', totalSent: 42, delivered: 0, read: 0, clicked: 0, failed: 0, bounced: 0, deliveryRate: 0, readRate: 0, status: 'sending', category: 'Attendance' },
  { id: 7, title: 'Annual Day Rehearsal Schedule', type: 'Event Notification', channels: ['app', 'push'], audience: ['students', 'teachers'], sentAt: '2026-07-01 09:00 AM', totalSent: 920, delivered: 0, read: 0, clicked: 0, failed: 0, bounced: 0, deliveryRate: 0, readRate: 0, status: 'scheduled', category: 'Events' },
];

const FAILURE_RECORDS: FailureRecord[] = [
  { id: 1, channel: 'email', recipient: 'parent.sharma@gmail.com', recipientType: 'parents', message: 'Fee Reminder — July 2026', reason: 'Invalid email address', errorCode: 'SMTP_550', timestamp: '2026-06-20 09:02 AM', retries: 3, resolved: false },
  { id: 2, channel: 'sms', recipient: '+91-99887-XXXXX', recipientType: 'parents', message: 'PTM Invitation', reason: 'Number not reachable (switched off)', errorCode: 'SMS_404', timestamp: '2026-06-18 10:32 AM', retries: 2, resolved: false },
  { id: 3, channel: 'push', recipient: 'Device: Android (Rohit Mehta)', recipientType: 'students', message: 'Exam Timetable', reason: 'App uninstalled / Device token expired', errorCode: 'FCM_401', timestamp: '2026-06-12 11:05 AM', retries: 1, resolved: true },
  { id: 4, channel: 'email', recipient: 'teacher.khan@school.edu', recipientType: 'teachers', message: 'Summer Vacation Notice', reason: 'Mailbox full', errorCode: 'SMTP_452', timestamp: '2026-06-15 02:04 PM', retries: 3, resolved: false },
  { id: 5, channel: 'push', recipient: 'Device: iOS (Priya Nair)', recipientType: 'parents', message: 'Fee Reminder', reason: 'Push notifications disabled by user', errorCode: 'APNS_403', timestamp: '2026-06-20 09:08 AM', retries: 0, resolved: true },
  { id: 6, channel: 'sms', recipient: '+91-77665-XXXXX', recipientType: 'parents', message: 'Fee Reminder — July 2026', reason: 'DND (Do Not Disturb) activated', errorCode: 'SMS_DND', timestamp: '2026-06-20 09:01 AM', retries: 0, resolved: false },
];

const AUDIENCE_DATA: Record<AudienceKey, { label: string; emoji: string; color: string; bg: string; border: string; total: number; delivered: number; read: number; optOut: number }> = {
  students: { label: 'Students',  emoji: '🎓', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    total: 860,  delivered: 845,  read: 690,  optOut: 12 },
  parents:  { label: 'Parents',   emoji: '👨‍👩‍👧', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', total: 748,  delivered: 740,  read: 612,  optOut: 8 },
  teachers: { label: 'Teachers',  emoji: '👩‍🏫', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  total: 48,   delivered: 48,   read: 44,   optOut: 0 },
  staff:    { label: 'Staff',     emoji: '👷', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  total: 20,   delivered: 20,   read: 18,   optOut: 0 },
  alumni:   { label: 'Alumni',    emoji: '🏫', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   total: 124,  delivered: 118,  read: 84,   optOut: 6 },
};

const STATUS_CFG = {
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  sending:   { label: 'Sending…',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  scheduled: { label: 'Scheduled', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  failed:    { label: 'Failed',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
};

const CHANNEL_ICONS: Record<ChannelKey, React.ReactNode> = {
  sms:      <MessageSquare className="w-3 h-3" />,
  email:    <Mail className="w-3 h-3" />,
  push:     <Bell className="w-3 h-3" />,
  app:      <Smartphone className="w-3 h-3" />,
  pa:       <Volume2 className="w-3 h-3" />,
  whatsapp: <MessageCircle className="w-3 h-3" />,
};

const CHANNEL_COLORS: Record<ChannelKey, string> = {
  sms:      'text-green-700 bg-green-50 border-green-200',
  email:    'text-violet-700 bg-violet-50 border-violet-200',
  push:     'text-blue-700 bg-blue-50 border-blue-200',
  app:      'text-indigo-700 bg-indigo-50 border-indigo-200',
  pa:       'text-orange-700 bg-orange-50 border-orange-200',
  whatsapp: 'text-teal-700 bg-teal-50 border-teal-200',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

const MiniSparkBar: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 28 }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className={`flex-1 rounded-sm ${color} opacity-80 transition-all duration-300`}
          style={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }} />
      ))}
    </div>
  );
};

const ProgressBar: React.FC<{ value: number; color: string; height?: string; showLabel?: boolean }> = ({ value, color, height = 'h-2', showLabel }) => (
  <div className={`w-full bg-slate-100 rounded-full ${height} overflow-hidden`}>
    <div className={`${height} rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }}>
      {showLabel && <span className="text-[7px] font-bold text-white px-1">{value}%</span>}
    </div>
  </div>
);

const TrendBadge: React.FC<{ trend: number; trendGood: boolean }> = ({ trend, trendGood }) => {
  const isPositive = trend >= 0;
  const isGood = isPositive === trendGood;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${isGood ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
      {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {Math.abs(trend)}%
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const MessageDeliveryAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [chartMetric, setChartMetric] = useState<'delivered' | 'read' | 'failed'>('delivered');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(CAMPAIGNS[0]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [failureFilter, setFailureFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Compute global totals
  const totalSent      = CHANNEL_STATS.reduce((a, c) => a + c.sent, 0);
  const totalDelivered = CHANNEL_STATS.reduce((a, c) => a + c.delivered, 0);
  const totalRead      = CHANNEL_STATS.reduce((a, c) => a + c.read, 0);
  const totalFailed    = CHANNEL_STATS.reduce((a, c) => a + c.failed, 0);
  const totalBounced   = CHANNEL_STATS.reduce((a, c) => a + c.bounced, 0);
  const overallDeliveryRate = pct(totalDelivered, totalSent);
  const overallReadRate     = pct(totalRead, totalDelivered);
  const overallFailRate     = pct(totalFailed, totalSent);

  const chartData = dateRange === '30d' ? MONTHLY_DATA : WEEKLY_DATA;
  const chartMax = Math.max(...chartData.map(d => d.sent));

  // Live counter effect
  useEffect(() => {
    if (!liveMode) return;
    const iv = setInterval(() => {
      setLiveCount(p => p + Math.floor(Math.random() * 12) + 1);
    }, 800);
    return () => clearInterval(iv);
  }, [liveMode]);

  const generateReport = async () => {
    setGeneratingReport(true);
    await new Promise(r => setTimeout(r, 2000));
    setGeneratingReport(false);
    toast.success(`📊 ${reportFormat.toUpperCase()} report generated and ready to download!`);
  };

  const filteredCampaigns = CAMPAIGNS.filter(c =>
    !campaignSearch || c.title.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const filteredFailures = FAILURE_RECORDS.filter(f =>
    failureFilter === 'all' ? true : failureFilter === 'resolved' ? f.resolved : !f.resolved
  );

  const KPI_LIST: KPI[] = [
    { label: 'Total Sent',      value: fmt(totalSent),      trend: 8.4,  trendDir: 'up',   trendGood: true,  icon: <Send className="w-4 h-4" />,         color: 'text-slate-700',   bg: 'bg-slate-50',    border: 'border-slate-200' },
    { label: 'Delivered',       value: fmt(totalDelivered), unit: `${overallDeliveryRate}%`, trend: 1.2,  trendDir: 'up',   trendGood: true,  icon: <CheckCircle className="w-4 h-4" />,   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
    { label: 'Read / Opened',   value: fmt(totalRead),      unit: `${overallReadRate}%`,     trend: 3.8,  trendDir: 'up',   trendGood: true,  icon: <Eye className="w-4 h-4" />,           color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
    { label: 'Failed',          value: fmt(totalFailed),    unit: `${overallFailRate}%`,     trend: 0.3,  trendDir: 'down', trendGood: false, icon: <XCircle className="w-4 h-4" />,       color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
    { label: 'Bounced',         value: fmt(totalBounced),   trend: -2.1, trendDir: 'down', trendGood: false, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200' },
    { label: 'Channels Active', value: CHANNEL_STATS.filter(c => c.enabled).length, trend: 0, trendDir: 'up', trendGood: true, icon: <Radio className="w-4 h-4" />, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-800 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg"><BarChart2 className="w-4 h-4" /></div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Message Delivery Analytics</h1>
            <p className="text-[9px] text-slate-300 font-medium">Real-time · Multi-channel · Campaigns · Failure Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live mode toggle */}
          <button onClick={() => { setLiveMode(!liveMode); if (!liveMode) setLiveCount(0); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8.5px] font-extrabold transition cursor-pointer ${liveMode ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {liveMode ? `Live +${liveCount}` : 'Live Off'}
          </button>
          {/* Date range */}
          <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as DateRange[]).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded-md text-[8px] font-extrabold cursor-pointer transition ${dateRange === r ? 'bg-white text-slate-800' : 'text-slate-300 hover:bg-white/10'}`}>
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── GLOBAL KPI PILLS ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
        {KPI_LIST.map((kpi, i) => (
          <div key={i} className={`flex items-center gap-2 ${kpi.bg} border ${kpi.border} px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0`}>
            <span className={kpi.color}>{kpi.icon}</span>
            <div>
              <span className="text-[11px] font-extrabold text-slate-800">{kpi.value}</span>
              {kpi.unit && <span className="text-[8px] text-slate-500 font-bold ml-1">{kpi.unit}</span>}
            </div>
            <span className="text-[8px] text-slate-400 font-medium">{kpi.label}</span>
            {kpi.trend !== 0 && (
              <TrendBadge trend={kpi.trend} trendGood={kpi.trendGood} />
            )}
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto">
        {([
          { key: 'overview',  label: 'Overview',         icon: <Activity className="w-3.5 h-3.5" /> },
          { key: 'channels',  label: 'Channels',         icon: <Radio className="w-3.5 h-3.5" />, badge: CHANNEL_STATS.length },
          { key: 'campaigns', label: 'Campaigns',        icon: <Send className="w-3.5 h-3.5" />, badge: CAMPAIGNS.length },
          { key: 'audience',  label: 'Audience Insights',icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'failures',  label: 'Failure Analysis', icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: FAILURE_RECORDS.filter(f => !f.resolved).length },
          { key: 'reports',   label: 'Reports & Export', icon: <Download className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as MainTab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full ${t.key === 'failures' ? 'bg-red-500' : 'bg-indigo-500'} text-white`}>{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-5">
            {/* Main chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[12px] font-extrabold text-slate-800">Delivery Trends</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">{dateRange === '30d' ? 'Weekly aggregates for the last 30 days' : 'Daily breakdown for the last 7 days'}</p>
                </div>
                <div className="flex gap-1">
                  {([
                    { key: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
                    { key: 'read',      label: 'Read',      color: 'bg-blue-500' },
                    { key: 'failed',    label: 'Failed',    color: 'bg-red-400' },
                  ] as const).map(m => (
                    <button key={m.key} onClick={() => setChartMetric(m.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8.5px] font-bold cursor-pointer transition ${chartMetric === m.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${m.color}`} />{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom bar chart */}
              <div className="flex items-end gap-3" style={{ height: 140 }}>
                {chartData.map((d, i) => {
                  const metricVal = d[chartMetric];
                  const sentPct = (d.sent / chartMax) * 100;
                  const metricPct = (metricVal / chartMax) * 100;
                  const color = chartMetric === 'delivered' ? 'bg-emerald-500' : chartMetric === 'read' ? 'bg-blue-500' : 'bg-red-400';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default relative">
                      <div className="w-full flex-1 flex items-end gap-0.5 relative">
                        {/* Sent bar (ghost) */}
                        <div className="w-full bg-slate-100 rounded-t-sm" style={{ height: `${sentPct}%` }} />
                        {/* Metric bar overlay */}
                        <div className={`absolute bottom-0 left-0 w-full ${color} rounded-t-sm opacity-80 transition-all duration-500`} style={{ height: `${metricPct}%` }} />
                      </div>
                      <p className="text-[8px] font-bold text-slate-500 whitespace-nowrap">{d.label}</p>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-lg p-2 text-[7.5px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none shadow-lg">
                        <p>Sent: {d.sent.toLocaleString()}</p>
                        <p>Delivered: {d.delivered.toLocaleString()}</p>
                        <p>Read: {d.read.toLocaleString()}</p>
                        <p className="text-red-300">Failed: {d.failed.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[
                  { color: 'bg-slate-200', label: 'Sent' },
                  { color: 'bg-emerald-500', label: 'Delivered' },
                  { color: 'bg-blue-500', label: 'Read' },
                  { color: 'bg-red-400', label: 'Failed' },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500">
                    <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />{l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Gauges */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Delivery Rate', value: overallDeliveryRate, color: 'bg-emerald-500', ring: 'ring-emerald-100', text: 'text-emerald-600', desc: 'Messages successfully delivered' },
                { label: 'Read Rate',     value: overallReadRate,     color: 'bg-blue-500',    ring: 'ring-blue-100',    text: 'text-blue-600',    desc: 'Delivered messages that were opened' },
                { label: 'Failure Rate',  value: overallFailRate,     color: 'bg-red-400',     ring: 'ring-red-100',     text: 'text-red-600',     desc: 'Messages that failed to deliver' },
              ].map((g, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center space-y-3">
                  {/* Ring gauge using CSS */}
                  <div className="relative w-20 h-20 mx-auto">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke={i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#f87171'}
                        strokeWidth="8" strokeDasharray={`${(g.value / 100) * 201} 201`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[13px] font-extrabold ${g.text}`}>{g.value}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-800">{g.label}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Channel snapshot */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800">Channel Performance Snapshot</h3>
                <button onClick={() => setActiveTab('channels')} className="text-[8.5px] font-bold text-indigo-600 flex items-center gap-1 cursor-pointer hover:text-indigo-700">
                  Full Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {CHANNEL_STATS.map(ch => (
                  <div key={ch.key} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                    <div className={`p-2 rounded-xl ${ch.bg} border ${ch.border} flex-shrink-0`}>
                      <span className={ch.color}>{ch.icon}</span>
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <p className="text-[9.5px] font-extrabold text-slate-800">{ch.label}</p>
                      <p className="text-[7.5px] text-slate-400">{ch.sent.toLocaleString()} sent</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[7.5px] font-medium text-slate-500">
                        <span>Delivery</span><span className="font-extrabold text-slate-700">{ch.deliveryRate}%</span>
                      </div>
                      <ProgressBar value={ch.deliveryRate} color={`bg-gradient-to-r ${ch.gradFrom} ${ch.gradTo}`} />
                      <div className="flex justify-between text-[7.5px] font-medium text-slate-500">
                        <span>Read Rate</span><span className="font-extrabold text-slate-700">{ch.readRate}%</span>
                      </div>
                      <ProgressBar value={ch.readRate} color="bg-blue-400" />
                    </div>
                    <TrendBadge trend={ch.trend} trendGood={true} />
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] font-extrabold text-red-500">{ch.failed.toLocaleString()}</p>
                      <p className="text-[7.5px] text-slate-400">failed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ CHANNELS TAB ═══════ */}
        {activeTab === 'channels' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {CHANNEL_STATS.map(ch => (
                <div key={ch.key} onClick={() => setSelectedChannel(selectedChannel === ch.key ? null : ch.key)}
                  className={`bg-white border rounded-2xl shadow-sm cursor-pointer transition hover:shadow-md ${selectedChannel === ch.key ? `border-2 ${ch.border}` : 'border-slate-200'}`}>
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-r ${ch.gradFrom} ${ch.gradTo} rounded-t-2xl p-4 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">{ch.icon}</div>
                        <span className="text-[11px] font-extrabold">{ch.label}</span>
                      </div>
                      <TrendBadge trend={ch.trend} trendGood={true} />
                    </div>
                    <MiniSparkBar
                      data={WEEKLY_DATA.map(d => Math.round(d.delivered * (ch.sent / totalSent)))}
                      color="bg-white"
                      height={32}
                    />
                  </div>
                  {/* Stats body */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Sent',      val: ch.sent.toLocaleString(),      color: 'text-slate-700' },
                        { label: 'Delivered', val: ch.delivered.toLocaleString(), color: 'text-emerald-600' },
                        { label: 'Read',      val: ch.read.toLocaleString(),       color: 'text-blue-600' },
                        { label: 'Failed',    val: ch.failed.toLocaleString(),     color: 'text-red-600' },
                      ].map((k, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                          <p className={`text-[13px] font-extrabold ${k.color}`}>{k.val}</p>
                          <p className="text-[7.5px] text-slate-400 font-bold">{k.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-medium text-slate-500">
                        <span>Delivery Rate</span><span className="font-extrabold text-slate-700">{ch.deliveryRate}%</span>
                      </div>
                      <ProgressBar value={ch.deliveryRate} color={`bg-gradient-to-r ${ch.gradFrom} ${ch.gradTo}`} height="h-2.5" />
                      <div className="flex justify-between text-[8px] font-medium text-slate-500">
                        <span>Read Rate</span><span className="font-extrabold text-slate-700">{ch.readRate}%</span>
                      </div>
                      <ProgressBar value={ch.readRate} color="bg-blue-400" height="h-2.5" />
                      <div className="flex justify-between text-[8px] font-medium text-slate-500">
                        <span>Failure Rate</span><span className="font-extrabold text-red-600">{ch.failRate}%</span>
                      </div>
                      <ProgressBar value={ch.failRate} color="bg-red-400" height="h-2.5" />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[8px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />Avg. {ch.avgDeliveryMs < 1000 ? `${ch.avgDeliveryMs}ms` : `${(ch.avgDeliveryMs / 1000).toFixed(1)}s`}
                      </span>
                      <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full ${ch.failRate < 2 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : ch.failRate < 5 ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                        {ch.failRate < 2 ? '✅ Excellent' : ch.failRate < 5 ? '⚠️ Good' : '❌ Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ CAMPAIGNS TAB ═══════ */}
        {activeTab === 'campaigns' && (
          <div className="flex h-full">
            {/* Left */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 z-10">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search campaigns…" value={campaignSearch}
                    onChange={e => setCampaignSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredCampaigns.map(c => {
                  const sc = STATUS_CFG[c.status];
                  const isSelected = selectedCampaign?.id === c.id;
                  return (
                    <div key={c.id} onClick={() => setSelectedCampaign(c)}
                      className={`px-4 py-3 cursor-pointer hover:bg-indigo-50/20 transition ${isSelected ? 'bg-indigo-50/40 border-l-2 border-indigo-500' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border} flex-shrink-0`}>{sc.label}</span>
                        <span className="text-[7px] font-bold text-slate-400 truncate">{c.category}</span>
                      </div>
                      <p className="text-[9.5px] font-bold text-slate-800 leading-tight line-clamp-2">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[7.5px] text-slate-400">
                        <span>{c.sentAt.split(' ')[0]}</span>
                        <span className="text-emerald-600 font-bold">{c.deliveryRate}%</span>
                        <span>{c.totalSent.toLocaleString()} sent</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Campaign detail */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedCampaign ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <Send className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-[11px] font-bold">Select a campaign to view analytics</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full border ${STATUS_CFG[selectedCampaign.status].color} ${STATUS_CFG[selectedCampaign.status].bg} ${STATUS_CFG[selectedCampaign.status].border}`}>{STATUS_CFG[selectedCampaign.status].label}</span>
                      <span className="text-[7.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{selectedCampaign.category}</span>
                      <span className="text-[7.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{selectedCampaign.type}</span>
                    </div>
                    <h3 className="text-[14px] font-extrabold text-slate-800">{selectedCampaign.title}</h3>
                    <p className="text-[9px] text-slate-400 mt-1">Sent: {selectedCampaign.sentAt} · Audience: {selectedCampaign.audience.join(', ')}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {selectedCampaign.channels.map(ch => (
                        <span key={ch} className={`flex items-center gap-1 text-[7.5px] font-bold px-2 py-0.5 rounded-full border ${CHANNEL_COLORS[ch]}`}>
                          {CHANNEL_ICONS[ch]} {ch.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total Sent', val: selectedCampaign.totalSent.toLocaleString(), color: 'text-slate-700' },
                      { label: 'Delivered',  val: `${selectedCampaign.delivered.toLocaleString()} (${selectedCampaign.deliveryRate}%)`, color: 'text-emerald-600' },
                      { label: 'Read',       val: `${selectedCampaign.read.toLocaleString()} (${pct(selectedCampaign.read, selectedCampaign.delivered)}%)`, color: 'text-blue-600' },
                      { label: 'Failed',     val: selectedCampaign.failed.toLocaleString(), color: 'text-red-600' },
                    ].map((k, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                        <p className={`text-[11px] font-extrabold ${k.color}`}>{k.val}</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Funnel */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h4 className="text-[11px] font-extrabold text-slate-800">Delivery Funnel</h4>
                    {[
                      { label: 'Sent',      val: selectedCampaign.totalSent, pct: 100, color: 'bg-slate-400' },
                      { label: 'Delivered', val: selectedCampaign.delivered,  pct: selectedCampaign.deliveryRate, color: 'bg-emerald-500' },
                      { label: 'Read',      val: selectedCampaign.read,       pct: pct(selectedCampaign.read, selectedCampaign.totalSent), color: 'bg-blue-500' },
                      { label: 'Clicked',   val: selectedCampaign.clicked,    pct: pct(selectedCampaign.clicked, selectedCampaign.totalSent), color: 'bg-violet-500' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-slate-600 w-20">{f.label}</span>
                        <div className="flex-1">
                          <ProgressBar value={f.pct} color={f.color} height="h-3" />
                        </div>
                        <span className="text-[8.5px] font-extrabold text-slate-700 w-24 text-right">{f.val.toLocaleString()} ({f.pct}%)</span>
                      </div>
                    ))}
                  </div>

                  {/* Bounce & Failure */}
                  {(selectedCampaign.failed > 0 || selectedCampaign.bounced > 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                      <h4 className="text-[11px] font-extrabold text-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Failure Summary</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-red-100 rounded-xl p-3 text-center">
                          <p className="text-[18px] font-extrabold text-red-600">{selectedCampaign.failed}</p>
                          <p className="text-[8px] text-slate-400 font-bold">Hard Failures</p>
                        </div>
                        <div className="bg-white border border-orange-100 rounded-xl p-3 text-center">
                          <p className="text-[18px] font-extrabold text-orange-600">{selectedCampaign.bounced}</p>
                          <p className="text-[8px] text-slate-400 font-bold">Bounced</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ AUDIENCE TAB ═══════ */}
        {activeTab === 'audience' && (
          <div className="p-4 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {(Object.entries(AUDIENCE_DATA) as [AudienceKey, typeof AUDIENCE_DATA[AudienceKey]][]).map(([key, aud]) => {
                const deliveryRate = pct(aud.delivered, aud.total);
                const readRate = pct(aud.read, aud.total);
                const optOutRate = pct(aud.optOut, aud.total);
                return (
                  <div key={key} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className={`px-5 py-3 ${aud.bg} border-b ${aud.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[18px]">{aud.emoji}</span>
                          <div>
                            <h3 className={`text-[11px] font-extrabold ${aud.color}`}>{aud.label}</h3>
                            <p className="text-[8px] text-slate-500">{aud.total.toLocaleString()} contacts</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold ${aud.color}`}>{deliveryRate}%</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Delivered', val: aud.delivered, color: 'text-emerald-600' },
                          { label: 'Read',      val: aud.read,      color: 'text-blue-600' },
                          { label: 'Opt-Out',   val: aud.optOut,    color: 'text-red-600' },
                        ].map((k, i) => (
                          <div key={i}>
                            <p className={`text-[14px] font-extrabold ${k.color}`}>{k.val}</p>
                            <p className="text-[7.5px] text-slate-400 font-bold">{k.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[7.5px] text-slate-500"><span>Delivery Rate</span><span className="font-extrabold">{deliveryRate}%</span></div>
                        <ProgressBar value={deliveryRate} color={`${aud.bg.replace('bg-', 'bg-').replace('-50', '-400')}`} />
                        <div className="flex justify-between text-[7.5px] text-slate-500"><span>Read Rate</span><span className="font-extrabold">{readRate}%</span></div>
                        <ProgressBar value={readRate} color="bg-blue-400" />
                        <div className="flex justify-between text-[7.5px] text-slate-500"><span>Opt-Out Rate</span><span className="font-extrabold text-red-600">{optOutRate}%</span></div>
                        <ProgressBar value={optOutRate} color="bg-red-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top engaged segments */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-800">Comparative Audience Performance</h3>
              <div className="space-y-3">
                {(Object.entries(AUDIENCE_DATA) as [AudienceKey, typeof AUDIENCE_DATA[AudienceKey]][])
                  .sort((a, b) => pct(b[1].read, b[1].total) - pct(a[1].read, a[1].total))
                  .map(([key, aud], i) => (
                    <div key={key} className="flex items-center gap-4">
                      <span className="text-[10px] font-extrabold text-slate-400 w-5 text-center">#{i + 1}</span>
                      <span className="text-[14px]">{aud.emoji}</span>
                      <div className="w-20 flex-shrink-0">
                        <p className={`text-[9px] font-extrabold ${aud.color}`}>{aud.label}</p>
                        <p className="text-[7.5px] text-slate-400">{aud.total} contacts</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className={`h-3 ${aud.bg.replace('-50', '-400')} rounded-full transition-all duration-700 flex items-center justify-end pr-1.5`}
                            style={{ width: `${pct(aud.read, aud.total)}%` }}>
                            <span className="text-[7px] font-extrabold text-white">{pct(aud.read, aud.total)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-20 flex-shrink-0">
                        <p className="text-[9px] font-extrabold text-slate-700">{aud.read.toLocaleString()}</p>
                        <p className="text-[7.5px] text-slate-400">messages read</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ FAILURES TAB ═══════ */}
        {activeTab === 'failures' && (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Failures', val: totalFailed.toLocaleString(), color: 'text-red-600' },
                { label: 'Unresolved', val: FAILURE_RECORDS.filter(f => !f.resolved).length, color: 'text-orange-600' },
                { label: 'Resolved', val: FAILURE_RECORDS.filter(f => f.resolved).length, color: 'text-emerald-600' },
                { label: 'Total Bounced', val: totalBounced.toLocaleString(), color: 'text-amber-600' },
              ].map((k, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                  <p className={`text-[18px] font-extrabold ${k.color}`}>{k.val}</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Failure by channel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-800">Failures by Channel</h3>
              {CHANNEL_STATS.sort((a, b) => b.failed - a.failed).map(ch => (
                <div key={ch.key} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${ch.bg} border ${ch.border} flex-shrink-0`}>
                    <span className={ch.color}>{ch.icon}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 w-24 flex-shrink-0">{ch.label}</span>
                  <div className="flex-1">
                    <ProgressBar value={(ch.failed / totalFailed) * 100} color="bg-red-400" height="h-2.5" />
                  </div>
                  <span className="text-[8.5px] font-extrabold text-red-600 w-16 text-right flex-shrink-0">{ch.failed.toLocaleString()} ({ch.failRate}%)</span>
                </div>
              ))}
            </div>

            {/* Failure log */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Failure Log</h3>
                <div className="flex gap-1">
                  {(['all', 'unresolved', 'resolved'] as const).map(f => (
                    <button key={f} onClick={() => setFailureFilter(f)}
                      className={`text-[8px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition ${failureFilter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredFailures.map(f => {
                  const chColors = CHANNEL_COLORS[f.channel].split(' ');
                  return (
                    <div key={f.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition">
                      <div className={`p-2 rounded-xl ${chColors[1]} border ${chColors[2]} flex-shrink-0`}>
                        <span className={chColors[0]}>{CHANNEL_ICONS[f.channel]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[9.5px] font-bold text-slate-800 truncate">{f.message}</p>
                          <span className={`flex-shrink-0 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border font-mono ${f.resolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {f.errorCode}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-red-600 font-semibold">{f.reason}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[7.5px] text-slate-400 font-medium">
                          <span>{f.recipient}</span>
                          <span>{f.recipientType}</span>
                          <span>{f.timestamp}</span>
                          <span>{f.retries} retries</span>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-[7.5px] font-extrabold px-2 py-1 rounded-full border ${f.resolved ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                        {f.resolved ? '✅ Resolved' : '❌ Unresolved'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ REPORTS TAB ═══════ */}
        {activeTab === 'reports' && (
          <div className="max-w-2xl mx-auto p-5 space-y-5">
            {/* Quick report cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <BarChart2 className="w-5 h-5" />, label: 'Full Delivery Report', desc: 'All channels · all campaigns · date range', color: 'text-indigo-600', bg: 'from-indigo-600 to-blue-700' },
                { icon: <AlertTriangle className="w-5 h-5" />, label: 'Failure & Bounce Report', desc: 'Error codes · resolution status · retries', color: 'text-red-600', bg: 'from-red-600 to-rose-700' },
                { icon: <Users className="w-5 h-5" />, label: 'Audience Engagement Report', desc: 'Per-segment delivery & read rates', color: 'text-emerald-600', bg: 'from-emerald-600 to-teal-700' },
                { icon: <Send className="w-5 h-5" />, label: 'Campaign Performance Report', desc: 'All campaigns · funnel · conversion', color: 'text-violet-600', bg: 'from-violet-600 to-purple-700' },
              ].map((r, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => { toast.success(`Generating ${r.label}…`); }}>
                  <div className={`bg-gradient-to-r ${r.bg} p-4 text-white`}>
                    {r.icon}
                  </div>
                  <div className="p-4">
                    <h4 className="text-[10.5px] font-extrabold text-slate-800">{r.label}</h4>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom report builder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Custom Report Builder</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
                  <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-[9.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Export Format</label>
                  <div className="flex gap-1.5 mt-1">
                    {(['pdf', 'csv', 'xlsx'] as const).map(f => (
                      <button key={f} onClick={() => setReportFormat(f)}
                        className={`flex-1 py-2 rounded-xl border text-[9px] font-extrabold cursor-pointer transition ${reportFormat === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Include Channels</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {CHANNEL_STATS.map(ch => (
                    <span key={ch.key} className={`flex items-center gap-1 text-[8px] font-bold px-2.5 py-1 rounded-full border cursor-pointer ${ch.color} ${ch.bg} ${ch.border}`}>
                      {ch.icon} {ch.label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Include Sections</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {['Delivery Summary', 'Channel Breakdown', 'Campaign Analysis', 'Audience Insights', 'Failure Log', 'Trend Charts'].map((s, i) => (
                    <label key={i} className="flex items-center gap-2 text-[9px] font-medium text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={generateReport} disabled={generatingReport}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shadow-sm disabled:opacity-50">
                {generatingReport
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Report…</>
                  : <><Download className="w-4 h-4" /> Generate {reportFormat.toUpperCase()} Report</>}
              </button>
            </div>

            {/* Scheduled reports */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> Scheduled Reports</h3>
                <button onClick={() => toast.success('Scheduled report created!')}
                  className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-indigo-100">
                  <Plus className="w-3 h-3" /> Schedule
                </button>
              </div>
              {[
                { name: 'Weekly Delivery Summary', freq: 'Every Monday 8:00 AM', format: 'PDF', to: 'principal@school.edu', active: true },
                { name: 'Monthly Channel Performance', freq: '1st of every month', format: 'XLSX', to: 'admin@school.edu', active: true },
                { name: 'Failure & Bounce Alert', freq: 'Daily — if failures > 50', format: 'CSV', to: 'it@school.edu', active: false },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9.5px] font-bold text-slate-800">{r.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[7.5px] text-slate-400">
                      <span>{r.freq}</span>
                      <span className="font-bold text-indigo-600">{r.format}</span>
                      <span>→ {r.to}</span>
                    </div>
                  </div>
                  <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-full ${r.active ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>
                    {r.active ? 'Active' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageDeliveryAnalytics;
