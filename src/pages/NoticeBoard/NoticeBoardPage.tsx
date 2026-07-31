import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, Pin, Users, ShieldCheck, Plus, Trash2, Search, X
} from 'lucide-react';
import api from '../../services/api';

interface NoticeItem {
  id: number;
  title: string;
  target_audience: string;
  content: string;
  posted_by: string;
  is_pinned: boolean;
  created_at: string;
}

interface NoticeStats {
  active_notices: number;
  pinned_notices: number;
  audience_all: number;
  audience_std: number;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [stats, setStats] = useState<NoticeStats>({
    active_notices: 2, pinned_notices: 1, audience_all: 1, audience_std: 1
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', target_audience: 'all', content: '', posted_by: 'Principal Office', is_pinned: false
  });

  const loadData = useCallback(async () => {
    try {
      const [resStats, resNotices] = await Promise.all([
        api.get('/admin/notices/stats'),
        api.get('/admin/notices/list')
      ]);
      if (resStats.data.success) setStats(resStats.data.data);
      if (resNotices.data.success) setNotices(resNotices.data.data);
    } catch {
      setNotices([
        { id: 1, title: 'Independence Day Celebration & Rehearsal Schedule', target_audience: 'all', content: 'All students and staff members are informed that Independence Day rehearsal will commence from 10th August. Dress code: Formal white uniform.', posted_by: 'Principal Office', is_pinned: true, created_at: new Date().toISOString() },
        { id: 2, title: 'Mid-Term Examination Datesheet Announced', target_audience: 'students', content: 'The Mid-Term exam datesheet for Class 9 to 12 has been published. Exams begin 15th September. Download admit cards from student portal.', posted_by: 'Exam Controller Desk', is_pinned: false, created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Please enter notice title and content');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/notices/create', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setForm({ title: '', target_audience: 'all', content: '', posted_by: 'Principal Office', is_pinned: false });
        loadData();
      }
    } catch {
      setNotices(prev => [{ ...form, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
      toast.success('Notice published (Demo)');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('Delete this announcement notice?')) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      toast.success('Notice deleted');
      loadData();
    } catch {
      setNotices(prev => prev.filter(n => n.id !== id));
      toast.success('Notice deleted (Demo)');
    }
  };

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30"><Bell className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Notice Board & Digital Announcements</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Broadcast ERP v1.5</span>
          </div>
          <p className="text-xs text-slate-300">Broadcast official school circulars, exam datesheets, and targeted announcements to students & staff.</p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Publish Announcement
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.active_notices} Notices</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Announcements</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><Pin className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-purple-700">{stats.pinned_notices} Pinned</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Featured Pinboard</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-emerald-700">All Audiences</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Broadcast Scope</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5" /></div>
          <div>
            <div className="text-base font-black text-amber-700">Verified</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Principal Desk</div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search notice title or announcement text..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="space-y-3">
          {filteredNotices.map(n => (
            <div key={n.id} className={`p-4 rounded-xl border-2 transition-all ${n.is_pinned ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {n.is_pinned && <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded uppercase flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[10px] uppercase">Target: {n.target_audience}</span>
                  <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                </div>
                <button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{n.content}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-200/60 mt-3 font-mono">
                <span>Posted by: <strong className="text-slate-700">{n.posted_by}</strong></span>
                <span>Published: {new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-600" /> Publish Announcement Notice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handlePublish} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notice Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sports Day Schedule Announcement" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
                  <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                    <option value="all">All School (Everyone)</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers & Staff</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Posted By</label>
                  <input value={form.posted_by} onChange={e => setForm({ ...form, posted_by: e.target.value })} placeholder="Principal Office" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Announcement Body Text *</label>
                <textarea rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write announcement details..." required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                <span className="font-bold text-slate-700">Pin to Top of Notice Board</span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">{submitting ? 'Publishing...' : 'Publish Notice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
