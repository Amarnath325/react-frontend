import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, Send, Plus, Search, Filter, RefreshCw, Settings, BarChart2,
  Check, X, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronRight, Download, Eye, Edit3, Trash2, Copy, Star, Users,
  User, GraduationCap, Home, Briefcase, Globe, Zap, Activity,
  TrendingUp, TrendingDown, Smartphone, Tablet, Monitor, Wifi,
  WifiOff, ToggleLeft, ToggleRight, FileText, Hash, Tag, Calendar,
  Archive, Inbox, Layers, Radio, Percent, Phone, Info, Flag,
  BookOpen, MoreVertical, Image, MessageSquare, Target, Shield,
  Key, Server, Database, AlertTriangle, ChevronUp, Volume2,
  VolumeX, Moon, Sun, Repeat, AlarmClock, Play, Pause,
  BarChart, PieChart, Move, Sliders, Sparkles, Navigation,
  BellOff, BellRing, Vibrate, Maximize2, ExternalLink, Lock, Upload
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = 'compose' | 'campaigns' | 'subscribers' | 'analytics' | 'config';
type NotifStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
type Platform = 'android' | 'ios' | 'web' | 'all';
type AudienceSegment = 'all' | 'students' | 'parents' | 'teachers' | 'staff' | 'class' | 'custom';
type NotifCategory = 'fee' | 'attendance' | 'exam' | 'event' | 'academic' | 'emergency' | 'general' | 'result';
type DeviceStatus = 'active' | 'inactive' | 'unsubscribed';
type Priority = 'low' | 'normal' | 'high' | 'critical';

interface NotifCampaign {
  id: number; title: string; body: string; imageUrl?: string;
  category: NotifCategory; platform: Platform; segment: AudienceSegment;
  status: NotifStatus; priority: Priority;
  scheduledFor?: string; sentAt?: string;
  totalTargeted: number; delivered: number; opened: number; failed: number;
  clickRate: number; createdAt: string; triggeredBy: string;
  deepLink?: string; sound?: string; badge?: number;
  isSilent?: boolean; ttl?: number; collapseKey?: string;
  actionButtons?: { label: string; action: string }[];
  tags?: string[];
}

interface Subscriber {
  id: number; name: string; avatar: string; role: 'student' | 'parent' | 'teacher' | 'staff';
  class?: string; deviceCount: number; platforms: Platform[];
  status: DeviceStatus; lastActive: string; notifEnabled: boolean;
  soundEnabled: boolean; token: string;
}

interface Device {
  id: number; subscriberId: number; name: string; platform: 'android' | 'ios' | 'web';
  model: string; token: string; appVersion: string; osVersion: string;
  lastSeen: string; isActive: boolean;
}

interface AnalyticsDay {
  date: string; sent: number; delivered: number; opened: number; failed: number;
}

interface ComposeForm {
  title: string; body: string; imageUrl: string; category: NotifCategory;
  platform: Platform; segment: AudienceSegment; priority: Priority;
  isScheduled: boolean; scheduledFor: string; deepLink: string;
  sound: string; isSilent: boolean; ttl: number; collapseKey: string;
  actionLabel1: string; actionAction1: string;
  actionLabel2: string; actionAction2: string;
  tags: string; customClass: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CAMPAIGNS: NotifCampaign[] = [
  { id: 1, title: '📚 Exam Schedule Released!', body: 'Mid-term exam schedule for Class 10 has been published. Check your timetable now.', category: 'exam', platform: 'all', segment: 'students', status: 'sent', priority: 'high', sentAt: '2026-06-23 09:00', totalTargeted: 640, delivered: 628, opened: 412, failed: 12, clickRate: 65.6, createdAt: '2026-06-22', triggeredBy: 'Exam Cell', deepLink: '/exams/schedule', tags: ['exam', 'class10'] },
  { id: 2, title: '💰 Fee Due Reminder', body: 'School fee payment for July 2026 is due on 5th July. Pay now to avoid late fee.', category: 'fee', platform: 'all', segment: 'parents', status: 'sent', priority: 'high', sentAt: '2026-06-22 10:00', totalTargeted: 480, delivered: 472, opened: 380, failed: 8, clickRate: 80.5, createdAt: '2026-06-21', triggeredBy: 'Accounts Office', deepLink: '/fees/pay', tags: ['fee', 'july'] },
  { id: 3, title: '🔴 Emergency: School Closed', body: 'School is CLOSED tomorrow (24 June) due to heavy rain. Online classes will continue as scheduled.', category: 'emergency', platform: 'all', segment: 'all', status: 'sent', priority: 'critical', sentAt: '2026-06-23 19:00', totalTargeted: 1240, delivered: 1235, opened: 1180, failed: 5, clickRate: 95.5, createdAt: '2026-06-23', triggeredBy: 'Principal Office', tags: ['emergency', 'closure'] },
  { id: 4, title: '🏆 Result Published – Term 1', body: 'Term 1 results are now available. Login to the portal to view your scorecard.', category: 'result', platform: 'android', segment: 'students', status: 'scheduled', priority: 'high', scheduledFor: '2026-06-25 08:00', totalTargeted: 640, delivered: 0, opened: 0, failed: 0, clickRate: 0, createdAt: '2026-06-23', triggeredBy: 'Academic Office', deepLink: '/results/term1', tags: ['result'] },
  { id: 5, title: '📅 PTM Tomorrow – Don\'t Miss!', body: 'Parent-Teacher Meeting is scheduled for tomorrow at 9 AM. All parents are requested to attend.', category: 'event', platform: 'all', segment: 'parents', status: 'draft', priority: 'normal', totalTargeted: 480, delivered: 0, opened: 0, failed: 0, clickRate: 0, createdAt: '2026-06-23', triggeredBy: 'Admin', tags: ['ptm', 'meeting'] },
  { id: 6, title: '✅ Attendance Marked', body: 'Your ward Aryan was marked Present today. Attendance: 93%.', category: 'attendance', platform: 'all', segment: 'parents', status: 'sent', priority: 'low', isSilent: false, sentAt: '2026-06-23 08:30', totalTargeted: 1, delivered: 1, opened: 1, failed: 0, clickRate: 100, createdAt: '2026-06-23', triggeredBy: 'Auto: Attendance', deepLink: '/attendance/aryan', tags: ['attendance'] },
  { id: 7, title: '📖 New Assignment Posted', body: 'Mr. Sharma posted a new Maths assignment: "Chapter 12 – Integration". Due: 26 June.', category: 'academic', platform: 'ios', segment: 'students', status: 'sending', priority: 'normal', totalTargeted: 45, delivered: 38, opened: 22, failed: 2, clickRate: 57.9, createdAt: '2026-06-23', triggeredBy: 'Auto: Homework', deepLink: '/homework/1023', tags: ['homework', 'maths'] },
];

const SUBSCRIBERS: Subscriber[] = [
  { id: 1, name: 'Aryan Kumar', avatar: 'AK', role: 'student', class: '10-A', deviceCount: 2, platforms: ['android', 'web'], status: 'active', lastActive: '2 min ago', notifEnabled: true, soundEnabled: true, token: 'FCM:aK7xR...m2pQ' },
  { id: 2, name: 'Rajesh Kumar', avatar: 'RK', role: 'parent', deviceCount: 1, platforms: ['android'], status: 'active', lastActive: '10 min ago', notifEnabled: true, soundEnabled: true, token: 'FCM:rK9bX...p3wL' },
  { id: 3, name: 'Priya Patel', avatar: 'PP', role: 'student', class: '10-B', deviceCount: 1, platforms: ['ios'], status: 'active', lastActive: '1 hour ago', notifEnabled: true, soundEnabled: false, token: 'APNs:pP3dC...q8vN' },
  { id: 4, name: 'Sunita Patel', avatar: 'SP', role: 'parent', deviceCount: 2, platforms: ['ios', 'web'], status: 'active', lastActive: '30 min ago', notifEnabled: false, soundEnabled: false, token: 'APNs:sP4fG...r9mT' },
  { id: 5, name: 'Rahul Sharma', avatar: 'RS', role: 'student', class: '12-A', deviceCount: 1, platforms: ['android'], status: 'active', lastActive: '5 min ago', notifEnabled: true, soundEnabled: true, token: 'FCM:rS1mK...h5eP' },
  { id: 6, name: 'Dr. Anil Verma', avatar: 'AV', role: 'teacher', deviceCount: 3, platforms: ['android', 'ios', 'web'], status: 'active', lastActive: 'Just now', notifEnabled: true, soundEnabled: true, token: 'FCM:aV2nL...k6rQ' },
  { id: 7, name: 'Kavya Gupta', avatar: 'KG', role: 'student', class: '8-C', deviceCount: 1, platforms: ['ios'], status: 'inactive', lastActive: '3 days ago', notifEnabled: true, soundEnabled: true, token: 'APNs:kG5jH...t2wM' },
  { id: 8, name: 'Priya Gupta', avatar: 'PG', role: 'parent', deviceCount: 1, platforms: ['android'], status: 'inactive', lastActive: '1 week ago', notifEnabled: false, soundEnabled: false, token: 'FCM:pG7kL...v4sN' },
  { id: 9, name: 'Rohan Singh', avatar: 'RoS', role: 'student', class: '6-A', deviceCount: 1, platforms: ['android'], status: 'unsubscribed', lastActive: '2 weeks ago', notifEnabled: false, soundEnabled: false, token: 'FCM:rS8mP...w6tQ' },
  { id: 10, name: 'Ms. Deepa Nair', avatar: 'DN', role: 'teacher', deviceCount: 2, platforms: ['ios', 'web'], status: 'active', lastActive: '15 min ago', notifEnabled: true, soundEnabled: true, token: 'APNs:dN3pQ...j9uR' },
];

const ANALYTICS_DATA: AnalyticsDay[] = [
  { date: 'Jun 17', sent: 240, delivered: 236, opened: 142, failed: 4 },
  { date: 'Jun 18', sent: 1240, delivered: 1225, opened: 980, failed: 15 },
  { date: 'Jun 19', sent: 90, delivered: 88, opened: 52, failed: 2 },
  { date: 'Jun 20', sent: 480, delivered: 472, opened: 380, failed: 8 },
  { date: 'Jun 21', sent: 45, delivered: 44, opened: 32, failed: 1 },
  { date: 'Jun 22', sent: 640, delivered: 628, opened: 412, failed: 12 },
  { date: 'Jun 23', sent: 1887, delivered: 1874, opened: 1614, failed: 17 },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<NotifStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Draft',     color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  sending:   { label: 'Sending',   color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500 animate-pulse' },
  sent:      { label: 'Sent',      color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  failed:    { label: 'Failed',    color: 'text-red-700',     bg: 'bg-red-100',     dot: 'bg-red-500' },
};

const CAT_CFG: Record<NotifCategory, { label: string; color: string; bg: string; icon: string }> = {
  fee:        { label: 'Fee',        color: 'text-orange-700', bg: 'bg-orange-100', icon: '💰' },
  attendance: { label: 'Attendance', color: 'text-red-700',    bg: 'bg-red-100',    icon: '✅' },
  exam:       { label: 'Exam',       color: 'text-violet-700', bg: 'bg-violet-100', icon: '📚' },
  event:      { label: 'Event',      color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '📅' },
  academic:   { label: 'Academic',   color: 'text-teal-700',   bg: 'bg-teal-100',   icon: '📖' },
  emergency:  { label: 'Emergency',  color: 'text-red-800',    bg: 'bg-red-200',    icon: '🔴' },
  general:    { label: 'General',    color: 'text-slate-600',  bg: 'bg-slate-100',  icon: '📢' },
  result:     { label: 'Result',     color: 'text-emerald-700',bg: 'bg-emerald-100',icon: '🏆' },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: 'Low',      color: 'text-slate-500',  bg: 'bg-slate-100',  border: 'border-slate-200' },
  normal:   { label: 'Normal',   color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  high:     { label: 'High',     color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-300' },
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-400' },
};

const SEGMENTS: { value: AudienceSegment; label: string; count: number; icon: React.ReactNode }[] = [
  { value: 'all',      label: 'Everyone',   count: 1240, icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'students', label: 'Students',   count: 640,  icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { value: 'parents',  label: 'Parents',    count: 480,  icon: <Home className="w-3.5 h-3.5" /> },
  { value: 'teachers', label: 'Teachers',   count: 82,   icon: <Briefcase className="w-3.5 h-3.5" /> },
  { value: 'staff',    label: 'Staff',      count: 38,   icon: <User className="w-3.5 h-3.5" /> },
  { value: 'class',    label: 'Class-wise', count: 0,    icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'custom',   label: 'Custom',     count: 0,    icon: <Hash className="w-3.5 h-3.5" /> },
];

const PLATFORMS: { value: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'all',     label: 'All Platforms', icon: <Globe className="w-4 h-4" />,      color: 'bg-slate-600' },
  { value: 'android', label: 'Android (FCM)', icon: <Smartphone className="w-4 h-4" />, color: 'bg-green-600' },
  { value: 'ios',     label: 'iOS (APNs)',    icon: <Smartphone className="w-4 h-4" />, color: 'bg-slate-700' },
  { value: 'web',     label: 'Web Push',      icon: <Monitor className="w-4 h-4" />,    color: 'bg-blue-600' },
];

const ROLE_CFG = {
  student: { color: 'bg-blue-600',   label: 'Student' },
  parent:  { color: 'bg-amber-500',  label: 'Parent' },
  teacher: { color: 'bg-violet-600', label: 'Teacher' },
  staff:   { color: 'bg-teal-600',   label: 'Staff' },
};

const emptyForm = (): ComposeForm => ({
  title: '', body: '', imageUrl: '', category: 'general', platform: 'all',
  segment: 'all', priority: 'normal', isScheduled: false, scheduledFor: '',
  deepLink: '', sound: 'default', isSilent: false, ttl: 86400,
  collapseKey: '', actionLabel1: '', actionAction1: '',
  actionLabel2: '', actionAction2: '', tags: '', customClass: '',
});

// ─── PHONE PREVIEW COMPONENT ──────────────────────────────────────────────────

const PhonePreview: React.FC<{ title: string; body: string; imageUrl?: string; category: NotifCategory; platform: Platform }> = ({ title, body, imageUrl, category, platform }) => {
  const cat = CAT_CFG[category];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48">
        {/* Phone shell */}
        <div className="bg-slate-900 rounded-[28px] p-3 shadow-2xl border-2 border-slate-700">
          {/* Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-16 h-4 bg-slate-800 rounded-full" />
          </div>
          {/* Screen */}
          <div className="bg-slate-800 rounded-[18px] overflow-hidden min-h-[260px]">
            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800">
              <span className="text-[7px] text-slate-400 font-bold">9:41</span>
              <div className="flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-slate-400" />
                <div className="flex gap-0.5">
                  {[1,2,3,4].map(i => <div key={i} className={`w-0.5 rounded-sm ${i <= 3 ? 'bg-slate-400' : 'bg-slate-600'}`} style={{ height: `${i * 2}px` }} />)}
                </div>
                <span className="text-[7px] text-slate-400">100%</span>
              </div>
            </div>
            {/* Lock screen wallpaper */}
            <div className="bg-gradient-to-b from-indigo-900 via-violet-900 to-slate-900 p-3">
              <div className="flex flex-col items-center mb-4 mt-2">
                <span className="text-slate-300 text-[10px] font-medium">Wednesday, 24 June</span>
                <span className="text-white text-2xl font-thin font-mono">12:30</span>
              </div>
              {/* Notification card */}
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-lg">
                <div className="flex items-start gap-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] ${platform === 'ios' ? 'bg-white rounded-xl' : 'bg-violet-500 rounded-lg'}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[8px] font-bold text-white truncate">
                        {platform === 'ios' ? 'MySchool App' : 'MySchool'}
                      </p>
                      <span className="text-[7px] text-white/60 ml-1 flex-shrink-0">now</span>
                    </div>
                    <p className="text-[8px] font-bold text-white leading-tight line-clamp-1">{title || 'Notification Title'}</p>
                    <p className="text-[7px] text-white/75 leading-snug mt-0.5 line-clamp-2">{body || 'Your notification message will appear here.'}</p>
                  </div>
                </div>
                {/* Image preview if provided */}
                {imageUrl && (
                  <div className="mt-1.5 rounded-lg overflow-hidden bg-slate-700 h-12 flex items-center justify-center">
                    <Image className="w-4 h-4 text-slate-500" />
                    <span className="text-[7px] text-slate-400 ml-1">Rich media</span>
                  </div>
                )}
              </div>
              {/* More notifications placeholder */}
              <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-2 mt-1.5 opacity-60">
                <p className="text-[7px] text-white/60 text-center">2 more notifications</p>
              </div>
            </div>
          </div>
          {/* Home bar */}
          <div className="flex justify-center mt-2">
            <div className="w-12 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
        {/* Platform label */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
            {platform === 'android' ? '🤖 Android' : platform === 'ios' ? '🍎 iOS' : platform === 'web' ? '🌐 Web' : '📱 All Platforms'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: AnalyticsDay[]; field: keyof AnalyticsDay; color: string }> = ({ data, field, color }) => {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d, i) => {
        const val = d[field] as number;
        const pct = Math.max(4, (val / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className={`w-full ${color} rounded-sm opacity-80 hover:opacity-100 transition-all cursor-default`} style={{ height: `${pct}%` }} />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">{val.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const PushNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('compose');
  const [campaigns, setCampaigns] = useState<NotifCampaign[]>(CAMPAIGNS);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(SUBSCRIBERS);
  const [compose, setCompose] = useState<ComposeForm>(emptyForm());
  const [sending, setSending] = useState(false);
  const [searchCampaigns, setSearchCampaigns] = useState('');
  const [filterStatus, setFilterStatus] = useState<NotifStatus | 'all'>('all');
  const [filterCat, setFilterCat] = useState<NotifCategory | 'all'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<NotifCampaign | null>(CAMPAIGNS[0]);
  const [searchSubs, setSearchSubs] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'parent' | 'teacher' | 'staff'>('all');
  const [filterSubStatus, setFilterSubStatus] = useState<DeviceStatus | 'all'>('all');
  const [fcmEnabled, setFcmEnabled] = useState(true);
  const [apnsEnabled, setApnsEnabled] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [testDevice, setTestDevice] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Live "sending" simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCampaigns(prev => prev.map(c => {
        if (c.status === 'sending' && c.delivered < c.totalTargeted) {
          const newDel = Math.min(c.totalTargeted, c.delivered + Math.floor(Math.random() * 5) + 1);
          return { ...c, delivered: newDel, opened: Math.floor(newDel * 0.58) };
        }
        if (c.status === 'sending' && c.delivered >= c.totalTargeted) {
          return { ...c, status: 'sent', sentAt: new Date().toLocaleString() };
        }
        return c;
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // ── Derived ──
  const filteredCampaigns = campaigns.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    if (searchCampaigns && !c.title.toLowerCase().includes(searchCampaigns.toLowerCase()) &&
        !c.body.toLowerCase().includes(searchCampaigns.toLowerCase())) return false;
    return true;
  });

  const filteredSubs = subscribers.filter(s => {
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    if (filterSubStatus !== 'all' && s.status !== filterSubStatus) return false;
    if (searchSubs && !s.name.toLowerCase().includes(searchSubs.toLowerCase())) return false;
    return true;
  });

  const totalSubs = subscribers.filter(s => s.status !== 'unsubscribed').length;
  const activeSubs = subscribers.filter(s => s.status === 'active').length;
  const androidSubs = subscribers.filter(s => s.platforms.includes('android')).length;
  const iosSubs = subscribers.filter(s => s.platforms.includes('ios')).length;
  const webSubs = subscribers.filter(s => s.platforms.includes('web')).length;

  const totalSent = ANALYTICS_DATA.reduce((s, d) => s + d.sent, 0);
  const totalDelivered = ANALYTICS_DATA.reduce((s, d) => s + d.delivered, 0);
  const totalOpened = ANALYTICS_DATA.reduce((s, d) => s + d.opened, 0);
  const avgOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0';

  const selectedSeg = SEGMENTS.find(s => s.value === compose.segment);
  const estimatedReach = compose.segment === 'custom' ? '—' : (selectedSeg?.count || 0).toLocaleString();

  // ── Handlers ──
  const handleSend = async () => {
    if (!compose.title.trim()) { toast.error('Notification title is required'); return; }
    if (!compose.body.trim()) { toast.error('Notification body is required'); return; }
    if (compose.isScheduled && !compose.scheduledFor) { toast.error('Please select schedule date/time'); return; }

    setSending(true);
    await new Promise(r => setTimeout(r, 2000));
    setSending(false);

    const seg = SEGMENTS.find(s => s.value === compose.segment);
    const count = seg?.count || 0;

    const nc: NotifCampaign = {
      id: Date.now(), title: compose.title, body: compose.body, imageUrl: compose.imageUrl || undefined,
      category: compose.category, platform: compose.platform, segment: compose.segment,
      status: compose.isScheduled ? 'scheduled' : 'sending',
      priority: compose.priority, scheduledFor: compose.scheduledFor || undefined,
      sentAt: compose.isScheduled ? undefined : new Date().toLocaleString(),
      totalTargeted: count, delivered: 0, opened: 0, failed: 0, clickRate: 0,
      createdAt: new Date().toISOString().split('T')[0], triggeredBy: 'Manual',
      deepLink: compose.deepLink || undefined,
      tags: compose.tags ? compose.tags.split(',').map(t => t.trim()) : undefined,
      actionButtons: compose.actionLabel1 ? [
        { label: compose.actionLabel1, action: compose.actionAction1 },
        ...(compose.actionLabel2 ? [{ label: compose.actionLabel2, action: compose.actionAction2 }] : []),
      ] : undefined,
      isSilent: compose.isSilent,
    };
    setCampaigns(prev => [nc, ...prev]);
    setSelectedCampaign(nc);

    if (compose.isScheduled) toast.success(`⏰ Scheduled! Will reach ${count.toLocaleString()} users on ${compose.scheduledFor}`);
    else toast.success(`🚀 Sending to ${count.toLocaleString()} devices!`);
    setCompose(emptyForm());
  };

  const sendTest = async () => {
    if (!testDevice.trim()) { toast.error('Enter device token or email'); return; }
    setSendingTest(true);
    await new Promise(r => setTimeout(r, 1500));
    setSendingTest(false);
    toast.success('✅ Test notification sent to device!');
    setTestDevice('');
  };

  const duplicateCampaign = (c: NotifCampaign) => {
    setCompose({ ...emptyForm(), title: c.title + ' (Copy)', body: c.body, category: c.category, platform: c.platform, segment: c.segment, priority: c.priority });
    setActiveTab('compose');
    toast.success('Campaign loaded in composer');
  };

  const deleteCampaign = (id: number) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selectedCampaign?.id === id) setSelectedCampaign(null);
    toast.success('Campaign deleted');
  };

  const Av: React.FC<{ text: string; size?: 'xs' | 'sm' | 'md'; color?: string }> = ({ text, size = 'sm', color = 'bg-violet-600' }) => {
    const sz = { xs: 'w-5 h-5 text-[7px]', sm: 'w-7 h-7 text-[9px]', md: 'w-9 h-9 text-[10px]' }[size];
    return <div className={`${sz} ${color} text-white font-bold rounded-full flex items-center justify-center flex-shrink-0`}>{text.slice(0, 2)}</div>;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Mobile Push Notification Center</h1>
            <p className="text-[9px] text-violet-200 font-medium">FCM · APNs · Web Push · Real-time delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live stats pills */}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold">{activeSubs} active devices</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Smartphone className="w-3 h-3 text-violet-300" />
            <span className="text-[9px] font-bold">{totalSubs} subscribers</span>
          </div>
          <button
            onClick={() => { setGlobalEnabled(!globalEnabled); toast.success(globalEnabled ? 'Push notifications paused' : 'Push notifications resumed'); }}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${globalEnabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30' : 'bg-red-500/20 border-red-400/40 text-red-200 hover:bg-red-500/30'}`}>
            {globalEnabled ? <><BellRing className="w-3 h-3" /> Active</> : <><BellOff className="w-3 h-3" /> Paused</>}
          </button>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto flex-shrink-0">
        {([
          { key: 'compose',     label: 'Compose',      icon: <Send className="w-3.5 h-3.5" /> },
          { key: 'campaigns',   label: 'Campaigns',    icon: <Radio className="w-3.5 h-3.5" />, badge: campaigns.filter(c => c.status === 'sending').length },
          { key: 'subscribers', label: 'Subscribers',  icon: <Smartphone className="w-3.5 h-3.5" /> },
          { key: 'analytics',   label: 'Analytics',    icon: <BarChart2 className="w-3.5 h-3.5" /> },
          { key: 'config',      label: 'Configuration',icon: <Settings className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition ${activeTab === t.key ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.icon} {t.label}
            {'badge' in t && (t as any).badge > 0 && (
              <span className="bg-blue-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse">{(t as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══════════ COMPOSE ═══════════ */}
        {activeTab === 'compose' && (
          <div className="flex overflow-hidden" style={{ minHeight: '100%' }}>
            {/* Left: Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 border-r border-slate-100">

              {/* Title & Body */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Notification Title <span className="text-red-500">*</span></label>
                    <span className={`text-[9px] font-bold ${compose.title.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>{compose.title.length}/65</span>
                  </div>
                  <input type="text" maxLength={65} placeholder="e.g. 📚 Exam Schedule Released!" value={compose.title}
                    onChange={e => setCompose(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Message Body <span className="text-red-500">*</span></label>
                    <span className={`text-[9px] font-bold ${compose.body.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>{compose.body.length}/180</span>
                  </div>
                  <textarea rows={3} maxLength={180} placeholder="Your notification message..." value={compose.body}
                    onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>
              </div>

              {/* Platform + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Platform</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLATFORMS.map(pl => (
                      <button key={pl.value} onClick={() => setCompose(p => ({ ...p, platform: pl.value }))}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-bold transition cursor-pointer ${compose.platform === pl.value ? `${pl.color} text-white border-transparent` : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300'}`}>
                        {pl.icon} {pl.value === 'all' ? 'All' : pl.value === 'android' ? 'Android' : pl.value === 'ios' ? 'iOS' : 'Web'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={compose.category} onChange={e => setCompose(p => ({ ...p, category: e.target.value as NotifCategory }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400 bg-white h-10">
                    {Object.entries(CAT_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 mt-2">Priority</label>
                  <div className="flex gap-1">
                    {(['low', 'normal', 'high', 'critical'] as Priority[]).map(pr => (
                      <button key={pr} onClick={() => setCompose(p => ({ ...p, priority: pr }))}
                        className={`flex-1 text-[8px] font-bold py-1.5 rounded-lg border transition cursor-pointer capitalize ${compose.priority === pr ? `${PRIORITY_CFG[pr].bg} ${PRIORITY_CFG[pr].color} ${PRIORITY_CFG[pr].border} border` : 'bg-white text-slate-400 border-slate-200 hover:border-violet-300'}`}>
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Audience Segment</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SEGMENTS.map(s => (
                    <button key={s.value} onClick={() => setCompose(p => ({ ...p, segment: s.value }))}
                      className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${compose.segment === s.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}>
                      {s.icon} {s.label}
                      {s.count > 0 && <span className={`text-[8px] ${compose.segment === s.value ? 'text-violet-200' : 'text-slate-400'}`}>({s.count})</span>}
                    </button>
                  ))}
                </div>
                {compose.segment === 'class' && (
                  <input type="text" value={compose.customClass} onChange={e => setCompose(p => ({ ...p, customClass: e.target.value }))}
                    placeholder="E.g. 10-A, 10-B, 12-A (comma-separated)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400 mb-2" />
                )}
                {compose.segment !== 'custom' && (
                  <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5">
                    <BellRing className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-[9px] font-bold text-violet-700">
                      Estimated reach: <strong>{estimatedReach} devices</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Rich Image URL <span className="text-slate-400">(optional)</span></label>
                <div className="flex gap-2">
                  <input type="text" placeholder="https://school.edu/banner.jpg" value={compose.imageUrl}
                    onChange={e => setCompose(p => ({ ...p, imageUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                  <button onClick={() => toast.success('Image picker coming soon')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-bold text-slate-600 cursor-pointer transition flex items-center gap-1">
                    <Image className="w-3.5 h-3.5" /> Browse
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Send Time</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={compose.isScheduled} onChange={e => setCompose(p => ({ ...p, isScheduled: e.target.checked }))} className="rounded" />
                      <span className="text-[9px] font-medium text-slate-600">Schedule</span>
                    </label>
                  </div>
                  {compose.isScheduled
                    ? <input type="datetime-local" value={compose.scheduledFor} onChange={e => setCompose(p => ({ ...p, scheduledFor: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                    : <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500">
                        <Zap className="w-3 h-3" /> Send Immediately
                      </div>
                  }
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Deep Link / Action URL</label>
                  <input type="text" placeholder="/fees/pay or https://..." value={compose.deepLink}
                    onChange={e => setCompose(p => ({ ...p, deepLink: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {advancedOpen && (
                  <div className="p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sound</label>
                        <select value={compose.sound} onChange={e => setCompose(p => ({ ...p, sound: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-violet-400 bg-white font-medium">
                          <option value="default">Default</option>
                          <option value="bell">Bell</option>
                          <option value="alert">Alert</option>
                          <option value="chime">Chime</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">TTL (seconds)</label>
                        <input type="number" value={compose.ttl} onChange={e => setCompose(p => ({ ...p, ttl: +e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collapse Key</label>
                        <input type="text" placeholder="e.g. fee_reminders" value={compose.collapseKey} onChange={e => setCompose(p => ({ ...p, collapseKey: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={compose.isSilent} onChange={e => setCompose(p => ({ ...p, isSilent: e.target.checked }))} className="rounded" />
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1"><VolumeX className="w-3 h-3" /> Silent Notification</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                      <input type="text" placeholder="e.g. fee, july, urgent" value={compose.tags} onChange={e => setCompose(p => ({ ...p, tags: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Action Button 1</label>
                        <div className="flex gap-1.5">
                          <input type="text" placeholder="Label" value={compose.actionLabel1} onChange={e => setCompose(p => ({ ...p, actionLabel1: e.target.value }))}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                          <input type="text" placeholder="Action" value={compose.actionAction1} onChange={e => setCompose(p => ({ ...p, actionAction1: e.target.value }))}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Action Button 2</label>
                        <div className="flex gap-1.5">
                          <input type="text" placeholder="Label" value={compose.actionLabel2} onChange={e => setCompose(p => ({ ...p, actionLabel2: e.target.value }))}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                          <input type="text" placeholder="Action" value={compose.actionAction2} onChange={e => setCompose(p => ({ ...p, actionAction2: e.target.value }))}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none focus:ring-1 focus:ring-violet-400 font-medium" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Send */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[9px] font-bold text-amber-700 mb-2 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Test Notification</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Device token or your email..." value={testDevice}
                    onChange={e => setTestDevice(e.target.value)}
                    className="flex-1 px-2.5 py-2 border border-amber-300 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                  <button onClick={sendTest} disabled={sendingTest}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[9px] font-bold px-3 py-2 rounded-lg cursor-pointer transition">
                    {sendingTest ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Test
                  </button>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex gap-2 pb-4">
                <button onClick={handleSend} disabled={sending}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[11px] transition cursor-pointer shadow-sm ${sending ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                  {sending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                    : compose.isScheduled ? <><AlarmClock className="w-4 h-4" /> Schedule Notification</>
                    : <><Send className="w-4 h-4" /> Push Now to {estimatedReach} devices</>}
                </button>
                <button onClick={() => { setCompose(emptyForm()); setAdvancedOpen(false); }} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-xl cursor-pointer transition">Clear</button>
              </div>
            </div>

            {/* Right: Live Phone Preview */}
            <div className="w-64 flex-shrink-0 flex flex-col items-center justify-start gap-6 p-6 bg-slate-50">
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Live Preview</p>
                <p className="text-[8px] text-slate-400">How it looks on device</p>
              </div>
              <PhonePreview
                title={compose.title || 'Notification Title'}
                body={compose.body || 'Your message appears here...'}
                imageUrl={compose.imageUrl}
                category={compose.category}
                platform={compose.platform === 'all' ? 'android' : compose.platform}
              />
              {compose.priority === 'critical' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 w-full">
                  <p className="text-[9px] font-bold text-red-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Critical Priority</p>
                  <p className="text-[8px] text-red-600 mt-0.5">Bypasses DND mode. Use only for emergencies.</p>
                </div>
              )}
              {compose.isSilent && (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 w-full">
                  <p className="text-[9px] font-bold text-slate-600 flex items-center gap-1"><VolumeX className="w-3.5 h-3.5" /> Silent Mode</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">No sound or banner. Data-only push.</p>
                </div>
              )}
              {/* Platform breakdown */}
              <div className="w-full bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[8px] font-bold text-slate-500 uppercase mb-2">Subscriber Breakdown</p>
                {[
                  { label: 'Android', count: androidSubs, icon: '🤖', color: 'bg-green-500' },
                  { label: 'iOS', count: iosSubs, icon: '🍎', color: 'bg-slate-600' },
                  { label: 'Web', count: webSubs, icon: '🌐', color: 'bg-blue-500' },
                ].map((pl, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px]">{pl.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[8px] font-medium text-slate-600">{pl.label}</span>
                        <span className="text-[8px] font-bold text-slate-700">{pl.count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div className={`${pl.color} h-1 rounded-full`} style={{ width: `${(pl.count / totalSubs) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ CAMPAIGNS ═══════════ */}
        {activeTab === 'campaigns' && (
          <div className="flex overflow-hidden" style={{ minHeight: '100%' }}>
            {/* List */}
            <div className={`${selectedCampaign ? 'w-[45%]' : 'flex-1'} flex flex-col overflow-hidden border-r border-slate-200`}>
              <div className="p-2.5 border-b border-slate-100 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input type="text" placeholder="Search campaigns..." value={searchCampaigns}
                      onChange={e => setSearchCampaigns(e.target.value)}
                      className="bg-transparent text-[10px] font-medium outline-none flex-1 placeholder:text-slate-400" />
                  </div>
                  <button onClick={() => { setActiveTab('compose'); setCompose(emptyForm()); }} className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition flex-shrink-0">
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'draft', 'scheduled', 'sending', 'sent', 'failed'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer capitalize ${filterStatus === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}>
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {filteredCampaigns.map(c => {
                  const sc = STATUS_CFG[c.status];
                  const cat = CAT_CFG[c.category];
                  const isSelected = selectedCampaign?.id === c.id;
                  const deliveryPct = c.totalTargeted > 0 ? Math.round((c.delivered / c.totalTargeted) * 100) : 0;
                  return (
                    <div key={c.id} onClick={() => setSelectedCampaign(isSelected ? null : c)}
                      className={`px-3 py-3 cursor-pointer transition group ${isSelected ? 'bg-violet-50 border-r-4 border-violet-600' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-start gap-2">
                        <div className="text-xl flex-shrink-0 mt-0.5">{cat.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <p className={`text-[10px] font-extrabold leading-tight line-clamp-1 ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>{c.title}</p>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                              <span className={`text-[8px] font-bold ${sc.color}`}>{sc.label}</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium line-clamp-1 mb-1.5">{c.body}</p>
                          {c.status === 'sent' || c.status === 'sending' ? (
                            <>
                              <div className="flex items-center gap-3 text-[8px] font-bold mb-1">
                                <span className="text-emerald-600">✓ {c.delivered}</span>
                                <span className="text-violet-600">👁 {c.opened}</span>
                                <span className="text-red-400">✗ {c.failed}</span>
                                <span className="text-slate-400 ml-auto">{c.clickRate.toFixed(1)}% open</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1">
                                <div className="bg-violet-500 h-1 rounded-full transition-all" style={{ width: `${deliveryPct}%` }} />
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-[8px] text-slate-400 font-medium">
                              <span>{PLATFORMS.find(p => p.value === c.platform)?.label}</span>
                              <span>·</span>
                              <span>{SEGMENTS.find(s => s.value === c.segment)?.label}</span>
                              {c.scheduledFor && <span className="text-amber-600 font-bold">· {c.scheduledFor}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredCampaigns.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Bell className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-[10px] font-semibold">No campaigns found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedCampaign && (() => {
              const c = selectedCampaign;
              const sc = STATUS_CFG[c.status];
              const cat = CAT_CFG[c.category];
              const pr = PRIORITY_CFG[c.priority];
              const deliveryPct = c.totalTargeted > 0 ? Math.round((c.delivered / c.totalTargeted) * 100) : 0;
              const openPct = c.delivered > 0 ? Math.round((c.opened / c.delivered) * 100) : 0;
              return (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <h2 className="text-[11px] font-extrabold text-slate-800 leading-tight">{c.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${pr.bg} ${pr.color} ${pr.border}`}>{pr.label}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => duplicateCampaign(c)} className="p-1.5 hover:bg-violet-50 rounded-lg cursor-pointer" title="Duplicate"><Copy className="w-3.5 h-3.5 text-violet-500" /></button>
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                    <p className="text-[10px] text-slate-700 font-medium leading-relaxed">{c.body}</p>
                    {c.deepLink && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200">
                        <Navigation className="w-3 h-3 text-violet-500" />
                        <span className="text-[9px] font-bold text-violet-600">{c.deepLink}</span>
                      </div>
                    )}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.map(tag => <span key={tag} className="text-[8px] font-bold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded">#{tag}</span>)}
                      </div>
                    )}
                  </div>

                  {/* Delivery Metrics */}
                  {(c.status === 'sent' || c.status === 'sending') && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { label: 'Targeted', val: c.totalTargeted, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
                        { label: 'Delivered', val: c.delivered, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                        { label: 'Opened', val: c.opened, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
                        { label: 'Failed', val: c.failed, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                      ].map((m, i) => (
                        <div key={i} className={`${m.bg} border ${m.border} rounded-xl p-2.5`}>
                          <p className={`text-xl font-extrabold ${m.color}`}>{m.val.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rates */}
                  {(c.status === 'sent' || c.status === 'sending') && (
                    <div className="space-y-2.5 mb-3">
                      {[
                        { label: 'Delivery Rate', pct: deliveryPct, color: 'bg-emerald-500' },
                        { label: 'Open Rate', pct: openPct, color: 'bg-violet-500' },
                        { label: 'Click-Through Rate', pct: c.clickRate, color: 'bg-blue-500' },
                      ].map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-600">{r.label}</span>
                            <span className="text-[9px] font-extrabold text-slate-700">{typeof r.pct === 'number' ? r.pct.toFixed(1) : r.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className={`${r.color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(100, r.pct)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Details</p>
                    {[
                      { label: 'Platform', val: PLATFORMS.find(p => p.value === c.platform)?.label || c.platform },
                      { label: 'Segment', val: SEGMENTS.find(s => s.value === c.segment)?.label || c.segment },
                      { label: 'Created', val: c.createdAt },
                      { label: 'Triggered by', val: c.triggeredBy },
                      ...(c.sentAt ? [{ label: 'Sent At', val: c.sentAt }] : []),
                      ...(c.scheduledFor ? [{ label: 'Scheduled For', val: c.scheduledFor }] : []),
                      ...(c.isSilent ? [{ label: 'Type', val: 'Silent Notification' }] : []),
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-[9px] text-slate-400 font-medium w-20 flex-shrink-0">{r.label}:</span>
                        <span className="text-[9px] font-bold text-slate-700">{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {c.actionButtons && c.actionButtons.length > 0 && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-3">
                      <p className="text-[9px] font-bold text-violet-700 mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Action Buttons</p>
                      <div className="flex gap-2">
                        {c.actionButtons.map((btn, i) => (
                          <div key={i} className="flex-1 bg-white border border-violet-200 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-[9px] font-bold text-violet-700">{btn.label}</p>
                            <p className="text-[8px] text-slate-400">{btn.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => duplicateCampaign(c)} className="flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    {c.status === 'sent' && (
                      <button onClick={() => { setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sending', delivered: 0, opened: 0 } : x)); toast.success('Resending...'); }} className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                        <RefreshCw className="w-3 h-3" /> Resend
                      </button>
                    )}
                    {c.status === 'draft' && (
                      <button onClick={() => { setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sending' } : x)); toast.success('Campaign started!'); }} className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                        <Play className="w-3 h-3" /> Send Now
                      </button>
                    )}
                    <button onClick={() => toast.success('Campaign report exported')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════ SUBSCRIBERS ═══════════ */}
        {activeTab === 'subscribers' && (
          <div className="p-4">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Subscribers', val: totalSubs, icon: <Smartphone className="w-4 h-4" />, color: 'from-violet-500 to-violet-600', sub: 'All platforms' },
                { label: 'Active Devices', val: activeSubs, icon: <BellRing className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600', sub: 'Receiving push' },
                { label: 'Unsubscribed', val: subscribers.filter(s => s.status === 'unsubscribed').length, icon: <BellOff className="w-4 h-4" />, color: 'from-slate-500 to-slate-600', sub: 'Opted out' },
                { label: 'Notif Disabled', val: subscribers.filter(s => !s.notifEnabled).length, icon: <VolumeX className="w-4 h-4" />, color: 'from-red-500 to-rose-600', sub: 'In-app off' },
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

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type="text" placeholder="Search subscribers..." value={searchSubs} onChange={e => setSearchSubs(e.target.value)}
                  className="bg-transparent text-[10px] font-medium outline-none flex-1 placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'student', 'parent', 'teacher', 'staff'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRole(r)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-full border cursor-pointer transition capitalize ${filterRole === r ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}>
                    {r === 'all' ? 'All Roles' : r}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(['all', 'active', 'inactive', 'unsubscribed'] as const).map(s => (
                  <button key={s} onClick={() => setFilterSubStatus(s)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-full border cursor-pointer transition capitalize ${filterSubStatus === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}>
                    {s === 'all' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1.5fr_1fr] gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                {['Subscriber', 'Role', 'Platforms', 'Devices', 'Status', 'Notif'].map(h => (
                  <p key={h} className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-slate-50">
                {filteredSubs.map(sub => {
                  const rc = ROLE_CFG[sub.role];
                  return (
                    <div key={sub.id} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1.5fr_1fr] gap-2 px-3 py-2.5 hover:bg-slate-50 transition items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 ${rc.color} text-white font-bold rounded-full flex items-center justify-center text-[9px] flex-shrink-0`}>{sub.avatar.slice(0, 2)}</div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">{sub.name}</p>
                          <p className="text-[8px] text-slate-400 font-medium">{sub.class || sub.role}</p>
                        </div>
                      </div>
                      <div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rc.color.replace('bg-', 'bg-opacity-10 text-').replace('-600', '-700').replace('-500', '-700')} bg-opacity-10`} style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#6d28d9' }}>{rc.label}</span>
                      </div>
                      <div className="flex gap-1">
                        {sub.platforms.includes('android') && <span title="Android" className="text-[9px]">🤖</span>}
                        {sub.platforms.includes('ios') && <span title="iOS" className="text-[9px]">🍎</span>}
                        {sub.platforms.includes('web') && <span title="Web" className="text-[9px]">🌐</span>}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-700">{sub.deviceCount}</span>
                        <span className="text-[8px] text-slate-400 ml-0.5">device{sub.deviceCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sub.status === 'active' ? 'bg-emerald-500' : sub.status === 'inactive' ? 'bg-amber-500' : 'bg-red-400'}`} />
                          <span className={`text-[9px] font-bold capitalize ${sub.status === 'active' ? 'text-emerald-700' : sub.status === 'inactive' ? 'text-amber-700' : 'text-red-600'}`}>{sub.status}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-0.5">{sub.lastActive}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {sub.notifEnabled
                          ? <BellRing className="w-3.5 h-3.5 text-emerald-500" />
                          : <BellOff className="w-3.5 h-3.5 text-red-400" />}
                        {sub.soundEnabled
                          ? <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                          : <VolumeX className="w-3.5 h-3.5 text-slate-300" />}
                      </div>
                    </div>
                  );
                })}
                {filteredSubs.length === 0 && (
                  <div className="text-center py-12 text-slate-400"><p className="text-[10px] font-semibold">No subscribers found</p></div>
                )}
              </div>
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-[9px] text-slate-400 font-semibold">{filteredSubs.length} of {subscribers.length} subscribers</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Sent (7d)', val: totalSent.toLocaleString(), icon: <Send className="w-4 h-4" />, color: 'from-violet-500 to-violet-600', sub: 'Last 7 days' },
                { label: 'Delivered', val: totalDelivered.toLocaleString(), icon: <CheckCircle className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600', sub: `${((totalDelivered / totalSent) * 100).toFixed(1)}% rate` },
                { label: 'Opened', val: totalOpened.toLocaleString(), icon: <Eye className="w-4 h-4" />, color: 'from-blue-500 to-blue-600', sub: `${avgOpenRate}% open rate` },
                { label: 'Avg CTR', val: '68.4%', icon: <Target className="w-4 h-4" />, color: 'from-orange-500 to-orange-600', sub: 'Click-through rate' },
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 7-day trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-700">7-Day Delivery Trend</p>
                  <div className="flex gap-3 text-[8px] font-bold">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Sent</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Delivered</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Opened</span>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-32 mb-2">
                  {ANALYTICS_DATA.map((d, i) => {
                    const maxVal = Math.max(...ANALYTICS_DATA.map(x => x.sent));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div className="w-full flex flex-col items-center justify-end h-full gap-0.5">
                          <div className="w-full bg-violet-500 rounded-t opacity-80 hover:opacity-100 transition" style={{ height: `${(d.sent / maxVal) * 100}%`, minHeight: '3px' }} />
                          <div className="w-full bg-emerald-500 rounded-t opacity-80" style={{ height: `${(d.delivered / maxVal) * 100}%`, minHeight: '3px', marginTop: '-100%' }} />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                          Sent: {d.sent} · Del: {d.delivered} · Open: {d.opened}
                        </div>
                        <span className="text-[7px] text-slate-400 font-medium">{d.date.slice(-3)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-1">
                  {ANALYTICS_DATA.map((d, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[8px] font-bold text-slate-500">{d.date}</p>
                      <p className="text-[9px] font-extrabold text-violet-600">{d.sent}</p>
                    </div>
                  )).slice(-3)}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-700 mb-3">Notifications by Category</p>
                <div className="space-y-2.5">
                  {Object.entries(CAT_CFG).map(([key, cat]) => {
                    const count = campaigns.filter(c => c.category === key).length;
                    const total = campaigns.length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return count > 0 ? (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1.5">
                            <span>{cat.icon}</span> {cat.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-extrabold text-slate-700">{count}</span>
                            <span className="text-[8px] text-slate-400">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${cat.bg.replace('bg-', 'bg-').replace('-100', '-500')}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Platform performance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-700 mb-3">Platform Performance</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Android (FCM)', icon: '🤖', subs: androidSubs, delivRate: 98.1, openRate: 62.4, color: 'bg-green-500' },
                  { label: 'iOS (APNs)', icon: '🍎', subs: iosSubs, delivRate: 99.3, openRate: 71.8, color: 'bg-slate-600' },
                  { label: 'Web Push', icon: '🌐', subs: webSubs, delivRate: 94.7, openRate: 48.2, color: 'bg-blue-500' },
                ].map((pl, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{pl.icon}</span>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-700">{pl.label}</p>
                        <p className="text-[8px] text-slate-400">{pl.subs} subscribers</p>
                      </div>
                    </div>
                    {[
                      { label: 'Delivery Rate', val: pl.delivRate, color: pl.color },
                      { label: 'Open Rate', val: pl.openRate, color: 'bg-violet-500' },
                    ].map((m, j) => (
                      <div key={j} className="mb-2">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[8px] text-slate-500 font-medium">{m.label}</span>
                          <span className="text-[8px] font-extrabold text-slate-700">{m.val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className={`${m.color} h-1.5 rounded-full`} style={{ width: `${m.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Top performing campaigns */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-700">Top Performing Campaigns</p>
                <button onClick={() => toast.success('Report exported!')} className="flex items-center gap-1 text-[9px] font-bold text-violet-600 cursor-pointer hover:underline">
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Campaign', 'Segment', 'Delivered', 'Opened', 'CTR', 'Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {campaigns.filter(c => c.status === 'sent').sort((a, b) => b.clickRate - a.clickRate).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span>{CAT_CFG[c.category].icon}</span>
                            <p className="text-[9px] font-bold text-slate-800 max-w-[150px] truncate">{c.title}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2"><span className="text-[9px] font-bold text-slate-600 capitalize">{c.segment}</span></td>
                        <td className="px-3 py-2"><span className="text-[9px] font-bold text-emerald-600">{c.delivered.toLocaleString()}</span></td>
                        <td className="px-3 py-2"><span className="text-[9px] font-bold text-blue-600">{c.opened.toLocaleString()}</span></td>
                        <td className="px-3 py-2"><span className="text-[9px] font-bold text-violet-600">{c.clickRate.toFixed(1)}%</span></td>
                        <td className="px-3 py-2"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CFG[c.status].bg} ${STATUS_CFG[c.status].color}`}>{STATUS_CFG[c.status].label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ CONFIGURATION ═══════════ */}
        {activeTab === 'config' && (
          <div className="p-4 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-violet-600" />
              <h2 className="text-[11px] font-extrabold text-slate-700">Push Provider Configuration</h2>
            </div>

            {/* FCM */}
            <div className={`bg-white border-2 rounded-xl overflow-hidden ${fcmEnabled ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${fcmEnabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-extrabold text-slate-800">Firebase Cloud Messaging (FCM)</p>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Android + Web</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Google Firebase · FCM v1 API · Project: myschool-prod</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${fcmEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{fcmEnabled ? 'Active' : 'Disabled'}</span>
                  <button onClick={() => { setFcmEnabled(!fcmEnabled); toast.success(`FCM ${fcmEnabled ? 'disabled' : 'enabled'}`); }} className="cursor-pointer">
                    {fcmEnabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Server Key</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-600 flex-1 truncate">AAAA••••••••••••••••••••••••••••••••••••:APA91b</span>
                      <button onClick={() => toast.success('Key revealed!')} className="text-[8px] text-violet-600 font-bold cursor-pointer">Show</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project ID</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <Database className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-700">myschool-prod-2024</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toast.success('FCM connection tested successfully!')} className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Wifi className="w-3 h-3" /> Test FCM
                  </button>
                  <button onClick={() => toast.success('Service account updated!')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Upload className="w-3 h-3" /> Upload Service Account JSON
                  </button>
                </div>
              </div>
            </div>

            {/* APNs */}
            <div className={`bg-white border-2 rounded-xl overflow-hidden ${apnsEnabled ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${apnsEnabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-extrabold text-slate-800">Apple Push Notification service (APNs)</p>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">iOS + macOS</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Apple Developer · Bundle ID: com.myschool.app · Env: Production</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${apnsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{apnsEnabled ? 'Active' : 'Disabled'}</span>
                  <button onClick={() => { setApnsEnabled(!apnsEnabled); toast.success(`APNs ${apnsEnabled ? 'disabled' : 'enabled'}`); }} className="cursor-pointer">
                    {apnsEnabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Auth Key (.p8)</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-600 truncate">AuthKey_AB1234XY.p8</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key ID / Team ID</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-semibold text-slate-700">AB1234XY / TEAM9876</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toast.success('APNs connection tested!')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Wifi className="w-3 h-3" /> Test APNs
                  </button>
                  <button onClick={() => toast.success('Certificate updated!')} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition">
                    <Upload className="w-3 h-3" /> Upload Auth Key
                  </button>
                </div>
              </div>
            </div>

            {/* Web Push */}
            <div className={`bg-white border-2 rounded-xl overflow-hidden ${webPushEnabled ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${webPushEnabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-extrabold text-slate-800">Web Push (VAPID)</p>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Chrome · Firefox · Safari</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">W3C Web Push Protocol · Service Worker registered</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${webPushEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{webPushEnabled ? 'Active' : 'Disabled'}</span>
                  <button onClick={() => { setWebPushEnabled(!webPushEnabled); toast.success(`Web Push ${webPushEnabled ? 'disabled' : 'enabled'}`); }} className="cursor-pointer">
                    {webPushEnabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">VAPID Public Key</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-600 truncate">BEl6••••••••••••••••••••••••••••••••••••••••••••Qw</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service Worker</label>
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-700">sw.js · Registered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Global Notification Settings</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Global Push Enabled', val: globalEnabled ? 'Yes — All platforms active' : 'PAUSED — No notifications sending', isRed: !globalEnabled },
                  { label: 'DND Hours (quiet time)', val: '10:00 PM – 6:00 AM IST' },
                  { label: 'Max daily per subscriber', val: '5 notifications/day' },
                  { label: 'Critical bypass DND', val: 'Enabled (Emergency only)' },
                  { label: 'Auto-retry failed', val: '3 attempts, 10 min interval' },
                  { label: 'Token refresh interval', val: 'Every 30 days' },
                  { label: 'Default TTL', val: '86400 seconds (24 hours)' },
                  { label: 'Unsubscribe on bounce', val: 'After 3 consecutive failures' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[10px] text-slate-600 font-medium">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${s.isRed ? 'text-red-600' : 'text-slate-700'}`}>{s.val}</span>
                      <button onClick={() => toast.success('Setting updated!')} className="text-[8px] text-violet-600 font-bold cursor-pointer hover:underline">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationCenter;
