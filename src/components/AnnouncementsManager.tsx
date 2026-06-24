import React, { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, Search, Filter, Pin, PinOff, Edit3, Trash2,
  Eye, Send, X, ChevronDown, ChevronRight, Calendar, Clock,
  Users, User, BookOpen, GraduationCap, Briefcase, Home,
  CheckCircle, AlertCircle, Info, Star, Bell, BellOff,
  Paperclip, Image, FileText, Download, Share2, Copy,
  BarChart2, TrendingUp, Tag, Archive, RefreshCw, MoreVertical,
  Globe, Lock, ChevronUp, Award, Zap, Radio, Layers, Flag
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type AnnouncementType = 'general' | 'academic' | 'event' | 'fee' | 'exam' | 'holiday' | 'emergency' | 'circular';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'draft' | 'scheduled' | 'published' | 'archived';
type AudienceTarget = 'all' | 'teachers' | 'students' | 'parents' | 'staff' | 'class' | 'custom';

interface Attachment {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  type: AnnouncementType;
  priority: Priority;
  status: Status;
  audience: AudienceTarget;
  audienceLabel: string;
  targetClasses?: string[];
  author: string;
  authorRole: string;
  createdAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  expiresAt?: string;
  isPinned: boolean;
  isRead?: boolean;
  views: number;
  reactions: { emoji: string; count: number }[];
  attachments: Attachment[];
  tags: string[];
  allowComments: boolean;
  comments: number;
  deliveryChannels: string[];
  sentTo: number;
  readBy: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1, title: 'Annual Day Celebration – December 15, 2026',
    body: 'We are thrilled to announce our Annual Day celebration on 15th December 2026 at the school auditorium. All students are requested to participate. Parents are cordially invited. Detailed schedule and dress code will be shared soon.',
    type: 'event', priority: 'high', status: 'published', audience: 'all', audienceLabel: 'All School',
    author: 'Principal Singh', authorRole: 'Principal', createdAt: '2026-06-20', publishedAt: '2026-06-20',
    expiresAt: '2026-12-15', isPinned: true, isRead: false, views: 342, tags: ['event', 'annual-day', 'celebration'],
    reactions: [{ emoji: '🎉', count: 48 }, { emoji: '❤️', count: 21 }],
    attachments: [{ id: 1, name: 'Annual_Day_Schedule.pdf', size: '1.2 MB', type: 'pdf' }],
    allowComments: true, comments: 12, deliveryChannels: ['Portal', 'Email', 'SMS'], sentTo: 1240, readBy: 342
  },
  {
    id: 2, title: '🚨 URGENT: School Closed Tomorrow Due to Heavy Rain',
    body: 'Due to heavy rainfall forecast by the Meteorological Department and district administration advisory, the school will remain CLOSED tomorrow i.e. 24th June 2026. Online classes will be conducted as per normal timetable. Students must join from home.',
    type: 'emergency', priority: 'urgent', status: 'published', audience: 'all', audienceLabel: 'All School',
    author: 'Admin Office', authorRole: 'Administration', createdAt: '2026-06-23', publishedAt: '2026-06-23',
    isPinned: true, isRead: false, views: 891, tags: ['emergency', 'closure', 'weather'],
    reactions: [{ emoji: '🌧️', count: 89 }, { emoji: '👍', count: 34 }],
    attachments: [], allowComments: false, comments: 0,
    deliveryChannels: ['Portal', 'Email', 'SMS', 'Push', 'WhatsApp'], sentTo: 1240, readBy: 891
  },
  {
    id: 3, title: 'Mid-Term Examination Schedule – July 2026',
    body: 'The mid-term examination schedule for all classes (1–12) has been finalized. Examinations will commence from 10th July 2026. Students are advised to collect their admit cards from the school office by 5th July. No student will be allowed to appear without an admit card.',
    type: 'exam', priority: 'high', status: 'published', audience: 'students', audienceLabel: 'All Students',
    author: 'Exam Cell', authorRole: 'Academic', createdAt: '2026-06-18', publishedAt: '2026-06-18',
    expiresAt: '2026-07-20', isPinned: false, views: 512, tags: ['exam', 'schedule', 'mid-term'],
    reactions: [{ emoji: '📝', count: 67 }, { emoji: '😰', count: 23 }],
    attachments: [
      { id: 2, name: 'Exam_Schedule_July2026.pdf', size: '0.8 MB', type: 'pdf' },
      { id: 3, name: 'Admit_Card_Instructions.pdf', size: '0.4 MB', type: 'pdf' }
    ],
    allowComments: true, comments: 31, deliveryChannels: ['Portal', 'Email'], sentTo: 640, readBy: 512
  },
  {
    id: 4, title: 'Fee Payment Deadline – Last Date: June 30, 2026',
    body: 'This is a reminder that the last date for payment of school fees for the month of June 2026 is 30th June 2026. A fine of ₹50/day will be charged for late payment. Parents are requested to pay fees online via the school portal or at the accounts office.',
    type: 'fee', priority: 'medium', status: 'published', audience: 'parents', audienceLabel: 'All Parents',
    author: 'Accounts Office', authorRole: 'Finance', createdAt: '2026-06-15', publishedAt: '2026-06-15',
    expiresAt: '2026-06-30', isPinned: false, views: 218, tags: ['fee', 'payment', 'deadline'],
    reactions: [{ emoji: '💳', count: 12 }],
    attachments: [{ id: 4, name: 'Fee_Structure_2026.pdf', size: '0.6 MB', type: 'pdf' }],
    allowComments: false, comments: 0, deliveryChannels: ['Portal', 'SMS', 'Email'], sentTo: 480, readBy: 218
  },
  {
    id: 5, title: 'New Lab Equipment Arrival – Physics & Chemistry',
    body: 'We are pleased to inform all science department teachers that new laboratory equipment has arrived and has been installed in Physics Lab (Room 204) and Chemistry Lab (Room 205). All teachers are requested to schedule their practical sessions accordingly.',
    type: 'academic', priority: 'low', status: 'published', audience: 'teachers', audienceLabel: 'Science Teachers',
    author: 'Lab Incharge', authorRole: 'Staff', createdAt: '2026-06-10', publishedAt: '2026-06-10',
    isPinned: false, views: 28, tags: ['lab', 'science', 'equipment'],
    reactions: [{ emoji: '🔬', count: 8 }, { emoji: '👍', count: 5 }],
    attachments: [], allowComments: true, comments: 3,
    deliveryChannels: ['Portal'], sentTo: 12, readBy: 28
  },
  {
    id: 6, title: 'Parent-Teacher Meeting – Class 10 & 12',
    body: 'A Parent-Teacher Meeting (PTM) for classes 10 and 12 is scheduled for Saturday, 28th June 2026 from 9:00 AM to 1:00 PM. Parents are urged to attend and discuss their ward\'s academic progress. Please carry your ward\'s previous test papers.',
    type: 'event', priority: 'medium', status: 'scheduled', scheduledFor: '2026-06-25', audience: 'parents', audienceLabel: 'Class 10 & 12 Parents',
    targetClasses: ['10-A', '10-B', '12-A', '12-B'], author: 'Class Teacher',
    authorRole: 'Academic', createdAt: '2026-06-22', isPinned: false, views: 0, tags: ['ptm', 'parents', 'meeting'],
    reactions: [], attachments: [], allowComments: true, comments: 0,
    deliveryChannels: ['Portal', 'SMS'], sentTo: 0, readBy: 0
  },
  {
    id: 7, title: 'Summer Vacation Notice – July 2026',
    body: 'School will remain closed for Summer Vacation from 1st July to 31st July 2026. School will reopen on 1st August 2026. Students are advised to complete their holiday homework during this period. The holiday homework will be available on the school portal.',
    type: 'holiday', priority: 'medium', status: 'draft', audience: 'all', audienceLabel: 'All School',
    author: 'Principal Singh', authorRole: 'Principal', createdAt: '2026-06-23', isPinned: false, views: 0,
    tags: ['vacation', 'holiday', 'summer'], reactions: [], attachments: [],
    allowComments: false, comments: 0, deliveryChannels: ['Portal', 'Email', 'SMS'], sentTo: 0, readBy: 0
  },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  general:   { label: 'General',   icon: <Megaphone className="w-3 h-3" />,   color: 'text-slate-600',  bg: 'bg-slate-100',   border: 'border-slate-300' },
  academic:  { label: 'Academic',  icon: <BookOpen className="w-3 h-3" />,    color: 'text-blue-700',   bg: 'bg-blue-100',    border: 'border-blue-300' },
  event:     { label: 'Event',     icon: <Star className="w-3 h-3" />,        color: 'text-purple-700', bg: 'bg-purple-100',  border: 'border-purple-300' },
  fee:       { label: 'Fee',       icon: <Tag className="w-3 h-3" />,         color: 'text-orange-700', bg: 'bg-orange-100',  border: 'border-orange-300' },
  exam:      { label: 'Exam',      icon: <Award className="w-3 h-3" />,       color: 'text-rose-700',   bg: 'bg-rose-100',    border: 'border-rose-300' },
  holiday:   { label: 'Holiday',   icon: <Home className="w-3 h-3" />,        color: 'text-emerald-700',bg: 'bg-emerald-100', border: 'border-emerald-300' },
  emergency: { label: 'Emergency', icon: <Zap className="w-3 h-3" />,         color: 'text-red-700',    bg: 'bg-red-100',     border: 'border-red-300' },
  circular:  { label: 'Circular',  icon: <Layers className="w-3 h-3" />,      color: 'text-indigo-700', bg: 'bg-indigo-100',  border: 'border-indigo-300' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  low:    { label: 'Low',    color: 'text-slate-500',  dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-amber-600',  dot: 'bg-amber-400' },
  high:   { label: 'High',   color: 'text-orange-600', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'text-red-600',    dot: 'bg-red-500 animate-pulse' },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-slate-600',  bg: 'bg-slate-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600',   bg: 'bg-blue-100' },
  published: { label: 'Published', color: 'text-emerald-700',bg: 'bg-emerald-100' },
  archived:  { label: 'Archived',  color: 'text-slate-400',  bg: 'bg-slate-50' },
};

const AUDIENCE_OPTIONS: { value: AudienceTarget; label: string; icon: React.ReactNode }[] = [
  { value: 'all',      label: 'All School',  icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'teachers', label: 'Teachers',    icon: <Briefcase className="w-3.5 h-3.5" /> },
  { value: 'students', label: 'Students',    icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { value: 'parents',  label: 'Parents',     icon: <Home className="w-3.5 h-3.5" /> },
  { value: 'staff',    label: 'Staff',       icon: <User className="w-3.5 h-3.5" /> },
  { value: 'class',    label: 'Class-wise',  icon: <Layers className="w-3.5 h-3.5" /> },
];

const DELIVERY_CHANNELS = ['Portal', 'Email', 'SMS', 'Push', 'WhatsApp'];

const ALL_TAGS = ['urgent', 'event', 'academic', 'fee', 'exam', 'holiday', 'ptm', 'circular', 'lab', 'sports', 'library', 'discipline'];

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────

const emptyForm = (): Partial<Announcement> => ({
  title: '', body: '', type: 'general', priority: 'medium', status: 'draft',
  audience: 'all', audienceLabel: 'All School', targetClasses: [],
  isPinned: false, tags: [], attachments: [], allowComments: true,
  deliveryChannels: ['Portal'], expiresAt: '', scheduledFor: '',
  reactions: [], views: 0, comments: 0, sentTo: 0, readBy: 0,
  author: 'Admin', authorRole: 'Administration',
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'archived'>('all');
  const [selectedType, setSelectedType] = useState<AnnouncementType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedAudience, setSelectedAudience] = useState<AudienceTarget | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'priority'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Announcement>>(emptyForm());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ──
  const selectedAnnouncement = announcements.find(a => a.id === selectedId) || null;

  const filtered = announcements.filter(a => {
    if (activeTab !== 'all' && a.status !== activeTab) return false;
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    if (selectedPriority !== 'all' && a.priority !== selectedPriority) return false;
    if (selectedAudience !== 'all' && a.audience !== selectedAudience) return false;
    if (searchQ && !a.title.toLowerCase().includes(searchQ.toLowerCase()) && !a.body.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'priority') {
      const order = { urgent: 4, high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    }
    return 0;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  // stats
  const stats = {
    total: announcements.length,
    published: announcements.filter(a => a.status === 'published').length,
    draft: announcements.filter(a => a.status === 'draft').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    totalViews: announcements.reduce((s, a) => s + a.views, 0),
    totalSent: announcements.reduce((s, a) => s + a.sentTo, 0),
    pinned: announcements.filter(a => a.isPinned).length,
    urgent: announcements.filter(a => a.priority === 'urgent').length,
  };

  // ── Handlers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setTagInput('');
    setShowForm(true);
    setShowPreview(false);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({ ...a });
    setTagInput('');
    setShowForm(true);
    setShowPreview(false);
  };

  const saveAnnouncement = () => {
    if (!form.title?.trim() || !form.body?.trim()) {
      toast.error('Title and body are required');
      return;
    }
    const audienceMap: Record<AudienceTarget, string> = {
      all: 'All School', teachers: 'Teachers', students: 'Students',
      parents: 'Parents', staff: 'Staff', class: form.targetClasses?.join(', ') || 'Selected Classes',
      custom: 'Custom'
    };
    const now = new Date().toISOString().split('T')[0];
    if (editingId) {
      setAnnouncements(prev => prev.map(a =>
        a.id === editingId
          ? { ...a, ...form, audienceLabel: audienceMap[form.audience as AudienceTarget] || 'All' } as Announcement
          : a
      ));
      toast.success('Announcement updated!');
    } else {
      const newA: Announcement = {
        id: Date.now(),
        title: form.title!,
        body: form.body!,
        type: form.type as AnnouncementType,
        priority: form.priority as Priority,
        status: form.status as Status,
        audience: form.audience as AudienceTarget,
        audienceLabel: audienceMap[form.audience as AudienceTarget] || 'All',
        targetClasses: form.targetClasses || [],
        author: 'Admin',
        authorRole: 'Administration',
        createdAt: now,
        publishedAt: form.status === 'published' ? now : undefined,
        scheduledFor: form.scheduledFor,
        expiresAt: form.expiresAt,
        isPinned: form.isPinned || false,
        views: 0,
        reactions: [],
        attachments: form.attachments || [],
        tags: form.tags || [],
        allowComments: form.allowComments ?? true,
        comments: 0,
        deliveryChannels: form.deliveryChannels || ['Portal'],
        sentTo: form.status === 'published' ? 100 : 0,
        readBy: 0,
      };
      setAnnouncements(prev => [newA, ...prev]);
      setSelectedId(newA.id);
      toast.success('Announcement created!');
    }
    setShowForm(false);
  };

  const deleteAnnouncement = (id: number) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    setShowDeleteConfirm(null);
    toast.success('Announcement deleted');
  };

  const togglePin = (id: number) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    toast.success('Pin status updated');
  };

  const changeStatus = (id: number, status: Status) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const now = new Date().toISOString().split('T')[0];
      return { ...a, status, publishedAt: status === 'published' ? now : a.publishedAt, sentTo: status === 'published' ? 100 : a.sentTo };
    }));
    toast.success(`Status changed to ${status}`);
  };

  const duplicateAnnouncement = (a: Announcement) => {
    const copy: Announcement = { ...a, id: Date.now(), title: `[Copy] ${a.title}`, status: 'draft', isPinned: false, views: 0, readBy: 0, sentTo: 0, createdAt: new Date().toISOString().split('T')[0] };
    setAnnouncements(prev => [copy, ...prev]);
    toast.success('Announcement duplicated as draft');
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !(form.tags || []).includes(t)) {
      setForm(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));

  const toggleChannel = (ch: string) => {
    setForm(prev => {
      const chs = prev.deliveryChannels || [];
      return { ...prev, deliveryChannels: chs.includes(ch) ? chs.filter(c => c !== ch) : [...chs, ch] };
    });
  };

  const toggleClass = (cls: string) => {
    setForm(prev => {
      const cls_ = prev.targetClasses || [];
      return { ...prev, targetClasses: cls_.includes(cls) ? cls_.filter(c => c !== cls) : [...cls_, cls] };
    });
  };

  const addReaction = (id: number, emoji: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const existing = a.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...a, reactions: a.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      }
      return { ...a, reactions: [...a.reactions, { emoji, count: 1 }] };
    }));
  };

  // ── Helpers ──
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const readRate = (a: Announcement) => a.sentTo > 0 ? Math.round((a.readBy / a.sentTo) * 100) : 0;

  const CLASSES = ['6-A','6-B','7-A','7-B','8-A','8-B','9-A','9-B','10-A','10-B','11-Science','11-Commerce','12-Science','12-Commerce'];
  const EMOJIS = ['👍','❤️','🎉','📢','✅','👀','🔥'];

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white/10 rounded-lg">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Announcements & Notices</h1>
            <p className="text-[9px] text-violet-200 font-medium">Broadcast communications to your school community</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer border ${showStats ? 'bg-white text-violet-700 border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
          >
            <BarChart2 className="w-3 h-3" /> Analytics
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
          >
            <Plus className="w-3 h-3" /> New Announcement
          </button>
        </div>
      </div>

      {/* ── ANALYTICS BAR ── */}
      {showStats && (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-0 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 flex-shrink-0">
          {[
            { label: 'Total', val: stats.total, icon: <Layers className="w-3 h-3" />, color: 'text-slate-600' },
            { label: 'Published', val: stats.published, icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-600' },
            { label: 'Scheduled', val: stats.scheduled, icon: <Clock className="w-3 h-3" />, color: 'text-blue-600' },
            { label: 'Drafts', val: stats.draft, icon: <Edit3 className="w-3 h-3" />, color: 'text-slate-400' },
            { label: 'Pinned', val: stats.pinned, icon: <Pin className="w-3 h-3" />, color: 'text-amber-600' },
            { label: 'Urgent', val: stats.urgent, icon: <Zap className="w-3 h-3" />, color: 'text-red-600' },
            { label: 'Total Views', val: stats.totalViews.toLocaleString(), icon: <Eye className="w-3 h-3" />, color: 'text-violet-600' },
            { label: 'Total Sent', val: stats.totalSent.toLocaleString(), icon: <Send className="w-3 h-3" />, color: 'text-indigo-600' },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center justify-center py-2.5 px-1 ${i < 7 ? 'border-r border-slate-200/70' : ''}`}>
              <div className={`flex items-center gap-1 ${s.color} mb-0.5`}>{s.icon}</div>
              <span className={`text-[12px] font-extrabold ${s.color}`}>{s.val}</span>
              <span className="text-[8px] text-slate-400 font-semibold text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 flex-shrink-0">

          {/* Status Tabs */}
          <div className="flex border-b border-slate-200 text-[9px] font-bold overflow-x-auto flex-shrink-0">
            {(['all', 'published', 'scheduled', 'draft', 'archived'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-3 py-2 capitalize transition ${activeTab === tab ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {tab}
                {tab !== 'all' && (
                  <span className="ml-1 text-[8px]">
                    ({announcements.filter(a => a.status === tab).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + Filter bar */}
          <div className="p-2.5 border-b border-slate-100 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="bg-transparent text-[10px] font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                />
                {searchQ && <button onClick={() => setSearchQ('')}><X className="w-3 h-3 text-slate-400 cursor-pointer" /></button>}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${showFilters ? 'bg-violet-100 border-violet-300 text-violet-600' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300'}`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="text-[9px] font-bold text-slate-600 border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none cursor-pointer bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Viewed</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {showFilters && (
              <div className="space-y-1.5">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Type</p>
                  <div className="flex flex-wrap gap-1">
                    {(['all', ...Object.keys(TYPE_CONFIG)] as (AnnouncementType | 'all')[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border transition cursor-pointer ${selectedType === t ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}
                      >
                        {t === 'all' ? 'All Types' : TYPE_CONFIG[t as AnnouncementType].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Priority</p>
                  <div className="flex gap-1">
                    {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedPriority(p)}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border transition cursor-pointer capitalize ${selectedPriority === p ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}
                      >
                        {p === 'all' ? 'All' : p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Audience</p>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'teachers', 'students', 'parents', 'staff'] as const).map(a => (
                      <button
                        key={a}
                        onClick={() => setSelectedAudience(a)}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border transition cursor-pointer capitalize ${selectedAudience === a ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'}`}
                      >
                        {a === 'all' ? 'Everyone' : a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Announcement List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Megaphone className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-[10px] font-semibold">No announcements found</p>
              </div>
            ) : filtered.map(a => {
              const isSelected = a.id === selectedId;
              const tc = TYPE_CONFIG[a.type];
              const pc = PRIORITY_CONFIG[a.priority];
              const sc = STATUS_CONFIG[a.status];
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`p-3 cursor-pointer transition group relative ${isSelected ? 'bg-violet-50 border-r-4 border-violet-600' : 'hover:bg-slate-50'}`}
                >
                  {/* Pinned badge */}
                  {a.isPinned && (
                    <div className="absolute top-2 right-2">
                      <Pin className="w-3 h-3 text-amber-500" />
                    </div>
                  )}

                  <div className="flex items-start gap-2 pr-4">
                    {/* Type icon */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${tc.bg} ${tc.color}`}>
                      {tc.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[11px] font-bold leading-tight truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'} ${!a.isRead && a.status === 'published' ? 'font-extrabold' : ''}`}>
                          {a.title}
                        </p>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${pc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                          {pc.label}
                        </span>
                        <span className="text-[8px] text-slate-400 font-medium">{a.audienceLabel}</span>
                      </div>

                      {/* Bottom row */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-medium">{formatDate(a.publishedAt || a.createdAt)}</span>
                        {a.status === 'published' && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> {a.views}
                          </span>
                        )}
                        {a.attachments.length > 0 && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Paperclip className="w-2.5 h-2.5" /> {a.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <p className="text-[9px] text-slate-400 font-semibold">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''} shown</p>
          </div>
        </div>

        {/* ── RIGHT: Detail View ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedAnnouncement ? (
            <>
              {/* Detail Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const tc = TYPE_CONFIG[selectedAnnouncement.type];
                    return (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.bg} ${tc.color}`}>
                        {tc.icon}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 leading-tight truncate">{selectedAnnouncement.title}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[selectedAnnouncement.status].bg} ${STATUS_CONFIG[selectedAnnouncement.status].color}`}>
                        {STATUS_CONFIG[selectedAnnouncement.status].label}
                      </span>
                      <span className="text-[8px] text-slate-400">by {selectedAnnouncement.author}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Quick status change */}
                  {selectedAnnouncement.status === 'draft' && (
                    <button
                      onClick={() => changeStatus(selectedAnnouncement.id, 'published')}
                      className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" /> Publish
                    </button>
                  )}
                  {selectedAnnouncement.status === 'published' && (
                    <button
                      onClick={() => changeStatus(selectedAnnouncement.id, 'archived')}
                      className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Archive className="w-3 h-3" /> Archive
                    </button>
                  )}
                  <button onClick={() => togglePin(selectedAnnouncement.id)} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer transition" title={selectedAnnouncement.isPinned ? 'Unpin' : 'Pin'}>
                    {selectedAnnouncement.isPinned ? <Pin className="w-4 h-4 text-amber-500" /> : <PinOff className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => duplicateAnnouncement(selectedAnnouncement)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition" title="Duplicate">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => { toast.success('Shared!'); }} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition" title="Share">
                    <Share2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => openEdit(selectedAnnouncement)} className="p-1.5 hover:bg-violet-50 rounded-lg cursor-pointer transition" title="Edit">
                    <Edit3 className="w-4 h-4 text-violet-500" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(selectedAnnouncement.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 max-w-3xl">

                  {/* Priority + Type badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${TYPE_CONFIG[selectedAnnouncement.type].bg} ${TYPE_CONFIG[selectedAnnouncement.type].color} ${TYPE_CONFIG[selectedAnnouncement.type].border}`}>
                      {TYPE_CONFIG[selectedAnnouncement.type].icon}
                      {TYPE_CONFIG[selectedAnnouncement.type].label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${PRIORITY_CONFIG[selectedAnnouncement.priority].color}`}>
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[selectedAnnouncement.priority].dot}`} />
                      {PRIORITY_CONFIG[selectedAnnouncement.priority].label} Priority
                    </span>
                    {selectedAnnouncement.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    {selectedAnnouncement.expiresAt && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400">
                        <Clock className="w-2.5 h-2.5" /> Expires {formatDate(selectedAnnouncement.expiresAt)}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className={`p-4 rounded-xl text-[11px] leading-relaxed text-slate-700 font-medium border mb-4 ${
                    selectedAnnouncement.priority === 'urgent'
                      ? 'bg-red-50 border-red-200'
                      : selectedAnnouncement.priority === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {selectedAnnouncement.body}
                  </div>

                  {/* Attachments */}
                  {selectedAnnouncement.attachments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments ({selectedAnnouncement.attachments.length})</p>
                      <div className="space-y-1.5">
                        {selectedAnnouncement.attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:border-violet-300 transition group cursor-pointer">
                            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{att.name}</p>
                              <p className="text-[9px] text-slate-400">{att.size}</p>
                            </div>
                            <button onClick={() => toast.success(`Downloading ${att.name}`)} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-violet-50 rounded-lg cursor-pointer">
                              <Download className="w-3.5 h-3.5 text-violet-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedAnnouncement.tags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAnnouncement.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="mb-4">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reactions</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedAnnouncement.reactions.map(r => (
                        <button
                          key={r.emoji}
                          onClick={() => addReaction(selectedAnnouncement.id, r.emoji)}
                          className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 hover:border-violet-300 shadow-sm cursor-pointer transition"
                        >
                          {r.emoji} <span className="text-[9px] font-bold text-slate-500">{r.count}</span>
                        </button>
                      ))}
                      <div className="flex gap-1">
                        {EMOJIS.map(e => (
                          !selectedAnnouncement.reactions.find(r => r.emoji === e) && (
                            <button
                              key={e}
                              onClick={() => addReaction(selectedAnnouncement.id, e)}
                              className="text-sm hover:scale-125 transition cursor-pointer p-0.5"
                            >
                              {e}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Delivery + Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Delivery Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Delivery Info</p>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Audience', val: selectedAnnouncement.audienceLabel, icon: <Users className="w-3 h-3 text-violet-500" /> },
                          { label: 'Author', val: `${selectedAnnouncement.author} (${selectedAnnouncement.authorRole})`, icon: <User className="w-3 h-3 text-blue-500" /> },
                          { label: 'Created', val: formatDate(selectedAnnouncement.createdAt), icon: <Calendar className="w-3 h-3 text-slate-400" /> },
                          { label: 'Published', val: formatDate(selectedAnnouncement.publishedAt), icon: <Send className="w-3 h-3 text-emerald-500" /> },
                          ...(selectedAnnouncement.scheduledFor ? [{ label: 'Scheduled', val: formatDate(selectedAnnouncement.scheduledFor), icon: <Clock className="w-3 h-3 text-blue-400" /> }] : []),
                        ].map((row, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            {row.icon}
                            <span className="text-[9px] text-slate-500 font-medium w-14 flex-shrink-0">{row.label}:</span>
                            <span className="text-[9px] font-bold text-slate-700 truncate">{row.val}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {selectedAnnouncement.deliveryChannels.map(ch => (
                            <span key={ch} className="text-[8px] font-bold bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Read Stats */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Engagement</p>
                      {selectedAnnouncement.status === 'published' ? (
                        <div className="space-y-2">
                          {[
                            { label: 'Total Views', val: selectedAnnouncement.views, icon: <Eye className="w-3 h-3 text-blue-500" />, total: null },
                            { label: 'Sent To', val: selectedAnnouncement.sentTo, icon: <Send className="w-3 h-3 text-violet-500" />, total: null },
                            { label: 'Read By', val: selectedAnnouncement.readBy, icon: <CheckCircle className="w-3 h-3 text-emerald-500" />, total: selectedAnnouncement.sentTo },
                            { label: 'Comments', val: selectedAnnouncement.comments, icon: <Radio className="w-3 h-3 text-amber-500" />, total: null },
                          ].map((s, i) => (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">{s.icon}{s.label}</span>
                                <span className="text-[10px] font-extrabold text-slate-700">{s.val}</span>
                              </div>
                              {s.total !== null && s.total > 0 && (
                                <div className="w-full bg-slate-200 rounded-full h-1">
                                  <div
                                    className="bg-emerald-500 h-1 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Math.round((s.val / s.total) * 100))}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="text-center pt-1">
                            <span className="text-[9px] font-bold text-emerald-600">
                              {readRate(selectedAnnouncement)}% Read Rate
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-20 text-slate-300">
                          <BarChart2 className="w-6 h-6 mb-1" />
                          <p className="text-[9px] font-semibold">Not published yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncement.status === 'draft' && (
                      <>
                        <button onClick={() => changeStatus(selectedAnnouncement.id, 'published')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <Send className="w-3 h-3" /> Publish Now
                        </button>
                        <button onClick={() => changeStatus(selectedAnnouncement.id, 'scheduled')} className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <Clock className="w-3 h-3" /> Schedule
                        </button>
                      </>
                    )}
                    {selectedAnnouncement.status === 'published' && (
                      <>
                        <button onClick={() => toast.success('Resent to all recipients!')} className="flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <RefreshCw className="w-3 h-3" /> Resend
                        </button>
                        <button onClick={() => toast.success('Reminder sent!')} className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                          <Bell className="w-3 h-3" /> Send Reminder
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(selectedAnnouncement)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => duplicateAnnouncement(selectedAnnouncement)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    <button onClick={() => setShowDeleteConfirm(selectedAnnouncement.id)} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mb-3">
                <Megaphone className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="font-extrabold text-slate-700 text-xs mb-1">Select an announcement</h3>
              <p className="text-slate-400 text-[10px] font-medium max-w-[200px] leading-snug">Choose an announcement from the list or create a new one.</p>
              <button onClick={openCreate} className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer">
                + Create Announcement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs">Delete Announcement</h3>
                <p className="text-[10px] text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer">Cancel</button>
              <button onClick={() => deleteAnnouncement(showDeleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-white" />
                <span className="font-extrabold text-white text-[11px]">{editingId ? 'Edit Announcement' : 'New Announcement'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${showPreview ? 'bg-white text-violet-700 border-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                >
                  <Eye className="w-3 h-3 inline mr-1" />{showPreview ? 'Edit' : 'Preview'}
                </button>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {showPreview ? (
              /* PREVIEW MODE */
              <div className="flex-1 overflow-y-auto p-5">
                <div className={`p-4 rounded-xl border mb-3 ${
                  form.priority === 'urgent' ? 'bg-red-50 border-red-200' : form.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {form.type && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_CONFIG[form.type as AnnouncementType].bg} ${TYPE_CONFIG[form.type as AnnouncementType].color} ${TYPE_CONFIG[form.type as AnnouncementType].border}`}>{TYPE_CONFIG[form.type as AnnouncementType].label}</span>}
                    {form.priority && <span className={`text-[8px] font-bold ${PRIORITY_CONFIG[form.priority as Priority].color}`}>{PRIORITY_CONFIG[form.priority as Priority].label}</span>}
                    {form.audience && <span className="text-[8px] text-slate-400">{AUDIENCE_OPTIONS.find(a => a.value === form.audience)?.label}</span>}
                  </div>
                  <h2 className="font-extrabold text-slate-800 text-xs mb-2">{form.title || 'Announcement Title'}</h2>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{form.body || 'Announcement body will appear here...'}</p>
                  {(form.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(form.tags || []).map(t => <span key={t} className="text-[8px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                  <p>📣 Audience: <strong>{AUDIENCE_OPTIONS.find(a => a.value === form.audience)?.label}</strong></p>
                  <p>📦 Channels: <strong>{(form.deliveryChannels || []).join(', ')}</strong></p>
                  <p>💬 Comments: <strong>{form.allowComments ? 'Allowed' : 'Disabled'}</strong></p>
                  <p>📌 Pinned: <strong>{form.isPinned ? 'Yes' : 'No'}</strong></p>
                  {form.scheduledFor && <p>⏰ Scheduled: <strong>{formatDate(form.scheduledFor)}</strong></p>}
                  {form.expiresAt && <p>📅 Expires: <strong>{formatDate(form.expiresAt)}</strong></p>}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Title */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter announcement title..."
                    value={form.title || ''}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 text-slate-800"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Body / Content <span className="text-red-500">*</span></label>
                  <textarea
                    rows={5}
                    placeholder="Write the announcement content here..."
                    value={form.body || ''}
                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-violet-400 text-slate-800 resize-none"
                  />
                  <p className="text-[8px] text-slate-400 mt-0.5 text-right">{(form.body || '').length} characters</p>
                </div>

                {/* Type + Priority + Status row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value as AnnouncementType }))}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    >
                      {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => (
                        <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    >
                      {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
                        <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    >
                      {(['draft', 'scheduled', 'published'] as Status[]).map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Target Audience</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, audience: opt.value }))}
                        className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                          form.audience === opt.value
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Class picker when audience is 'class' */}
                  {form.audience === 'class' && (
                    <div className="mt-2">
                      <p className="text-[8px] font-bold text-slate-400 mb-1.5">Select Classes:</p>
                      <div className="flex flex-wrap gap-1">
                        {CLASSES.map(cls => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => toggleClass(cls)}
                            className={`text-[8px] font-bold px-1.5 py-1 rounded-lg border transition cursor-pointer ${
                              (form.targetClasses || []).includes(cls)
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Channels */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Delivery Channels</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DELIVERY_CHANNELS.map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                          (form.deliveryChannels || []).includes(ch)
                            ? 'bg-violet-100 text-violet-700 border-violet-400'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {form.status === 'scheduled' ? 'Schedule For' : 'Expiry Date'}
                    </label>
                    {form.status === 'scheduled' ? (
                      <input type="date" value={form.scheduledFor || ''} onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                    ) : (
                      <input type="date" value={form.expiresAt || ''} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">Options</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isPinned || false} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded" />
                      <span className="text-[10px] font-semibold text-slate-600">📌 Pin this announcement</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.allowComments ?? true} onChange={e => setForm(p => ({ ...p, allowComments: e.target.checked }))} className="rounded" />
                      <span className="text-[10px] font-semibold text-slate-600">💬 Allow comments</span>
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tags</label>
                  <div className="flex gap-2 mb-1.5">
                    <input
                      type="text"
                      placeholder="Add tag and press Enter..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button onClick={addTag} type="button" className="px-2.5 py-1.5 bg-violet-100 text-violet-700 text-[9px] font-bold rounded-lg border border-violet-200 cursor-pointer hover:bg-violet-200">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(form.tags || []).map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">
                        #{tag}
                        <button onClick={() => removeTag(tag)} type="button" className="cursor-pointer hover:text-red-500">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {/* Suggested tags */}
                    <div className="w-full mt-1 flex flex-wrap gap-1">
                      {ALL_TAGS.filter(t => !(form.tags || []).includes(t)).slice(0, 8).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, tags: [...(p.tags || []), t] }))}
                          className="text-[8px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full hover:border-violet-400 hover:text-violet-600 cursor-pointer transition"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attachments (simulated) */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Attachments</label>
                  <button
                    type="button"
                    onClick={() => toast.success('File picker opened (demo mode)')}
                    className="flex items-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl p-3 text-slate-400 hover:text-violet-600 transition cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">Click to attach files (PDF, Image, Doc)</span>
                  </button>
                  {(form.attachments || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {(form.attachments || []).map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                          <FileText className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">{att.name}</span>
                          <span className="text-[9px] text-slate-400">{att.size}</span>
                          <button onClick={() => setForm(p => ({ ...p, attachments: (p.attachments || []).filter(a => a.id !== att.id) }))} className="cursor-pointer">
                            <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
              <button onClick={() => setShowForm(false)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                Cancel
              </button>
              <div className="flex gap-2">
                {!editingId && (
                  <button
                    onClick={() => { setForm(p => ({ ...p, status: 'draft' })); saveAnnouncement(); }}
                    className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Save as Draft
                  </button>
                )}
                <button
                  onClick={saveAnnouncement}
                  className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Send className="w-3 h-3" /> {editingId ? 'Update' : (form.status === 'published' ? 'Publish' : form.status === 'scheduled' ? 'Schedule' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManager;
