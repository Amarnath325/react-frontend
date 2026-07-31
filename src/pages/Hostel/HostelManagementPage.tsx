import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Building, Bed, FileText, CheckCircle2, Clock, Plus, Trash2,
  Search, AlertTriangle, ShieldCheck, X, Users, DollarSign
} from 'lucide-react';
import api from '../../services/api';

interface RoomItem {
  id: number;
  hostel_name: string;
  building: string;
  floor?: string;
  room_number: string;
  room_type: string;
  total_beds: number;
  is_active: boolean;
  remarks?: string;
}

interface OutpassItem {
  id: number;
  student_name: string;
  room_number: string;
  reason: string;
  leave_datetime: string;
  return_datetime: string;
  status: string;
  approved_by?: string;
}

interface HostelStats {
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  active_outpasses: number;
  monthly_mess_fee: number;
}

export default function HostelManagementPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'outpass'>('rooms');
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [outpasses, setOutpasses] = useState<OutpassItem[]>([]);
  const [stats, setStats] = useState<HostelStats>({
    total_rooms: 2, total_beds: 4, occupied_beds: 3, active_outpasses: 1, monthly_mess_fee: 4500
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hostel_name: 'Tagore Boys Hostel', building: 'Block A', room_number: '', room_type: 'Double Sharing', total_beds: 2
  });

  const loadData = useCallback(async () => {
    try {
      const [resStats, resRooms, resOutpasses] = await Promise.all([
        api.get('/admin/hostel/stats'),
        api.get('/admin/hostel/rooms'),
        api.get('/admin/hostel/outpasses')
      ]);
      if (resStats.data.success) setStats(resStats.data.data);
      if (resRooms.data.success) setRooms(resRooms.data.data);
      if (resOutpasses.data.success) setOutpasses(resOutpasses.data.data);
    } catch {
      setRooms([
        { id: 1, hostel_name: 'Tagore Boys Hostel', building: 'Block A', floor: '1st Floor', room_number: 'A-101', room_type: 'Double Sharing', total_beds: 2, is_active: true, remarks: 'Fully air-conditioned room' },
        { id: 2, hostel_name: 'Sarojini Girls Hostel', building: 'Block B', floor: '2nd Floor', room_number: 'B-204', room_type: 'Double Sharing', total_beds: 2, is_active: true, remarks: 'Standard ventilated room' },
      ]);
      setOutpasses([
        { id: 1, student_name: 'Aarav Sharma', room_number: 'A-101', reason: 'Weekend home visit to Delhi', leave_datetime: new Date(Date.now() + 86400000).toISOString(), return_datetime: new Date(Date.now() + 259200000).toISOString(), status: 'approved', approved_by: 'Warden Chief' },
      ]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_number) {
      toast.error('Please enter a room number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/hostel/rooms', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setForm({ hostel_name: 'Tagore Boys Hostel', building: 'Block A', room_number: '', room_type: 'Double Sharing', total_beds: 2 });
        loadData();
      }
    } catch {
      setRooms(prev => [...prev, { ...form, id: Date.now(), is_active: true }]);
      toast.success('Room added (Demo)');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Delete this hostel room?')) return;
    try {
      await api.delete(`/admin/hostel/rooms/${id}`);
      toast.success('Room deleted');
      loadData();
    } catch {
      setRooms(prev => prev.filter(r => r.id !== id));
      toast.success('Room deleted (Demo)');
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-400/30"><Building className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Hostel & Mess Management</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Hostel ERP v2.1</span>
          </div>
          <p className="text-xs text-slate-300">Manage hostel blocks, room bed allocation, student outpass approvals, and mess fees.</p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Add Hostel Room
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><Building className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.total_rooms} Rooms</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Rooms</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Bed className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.occupied_beds} / {stats.total_beds}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Occupied Beds</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-amber-700">{stats.active_outpasses} Outpasses</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Gate Passes</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <div className="text-base font-black text-emerald-700">₹{stats.monthly_mess_fee.toLocaleString()}/mo</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly Mess Fee</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button onClick={() => setActiveTab('rooms')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${activeTab === 'rooms' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <Building className="w-4 h-4" /> Rooms Inventory ({rooms.length})
        </button>
        <button onClick={() => setActiveTab('outpass')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${activeTab === 'outpass' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <FileText className="w-4 h-4" /> Student Outpasses ({outpasses.length})
        </button>
      </div>

      {/* Tab 1: Rooms Inventory */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-2 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded uppercase font-mono">{r.room_number}</span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{r.hostel_name}</h3>
                  </div>
                  <button onClick={() => handleDeleteRoom(r.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                  <span>Building: <strong>{r.building}</strong></span>
                  <span>Type: <strong>{r.room_type}</strong></span>
                  <span>Capacity: <strong>{r.total_beds} Beds</strong></span>
                  <span>Status: <strong className="text-emerald-600">Active</strong></span>
                </div>
                {r.remarks && <p className="text-[11px] text-slate-500 italic border-t border-slate-200/60 pt-1.5">{r.remarks}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Outpasses */}
      {activeTab === 'outpass' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          {outpasses.map(o => (
            <div key={o.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{o.student_name}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono font-bold rounded text-[10px]">Room {o.room_number}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">{o.status}</span>
                </div>
                <div className="text-slate-500 mt-1">Reason: <strong>{o.reason}</strong> • Approved by: {o.approved_by}</div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-500">
                <div>Leave: {new Date(o.leave_datetime).toLocaleString()}</div>
                <div>Return: {new Date(o.return_datetime).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Building className="w-4 h-4 text-purple-600" /> Add Hostel Room</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddRoom} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hostel Block Name *</label>
                <input value={form.hostel_name} onChange={e => setForm({ ...form, hostel_name: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Building Block *</label>
                  <input value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room Number *</label>
                  <input value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. C-302" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room Type</label>
                  <select value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                    <option value="Single Occupancy">Single Occupancy</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Beds</label>
                  <input type="number" min="1" max="10" value={form.total_beds} onChange={e => setForm({ ...form, total_beds: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold">{submitting ? 'Saving...' : 'Save Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
