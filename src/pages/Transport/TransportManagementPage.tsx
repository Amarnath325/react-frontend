import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Bus, MapPin, Users, Phone, Shield, Plus, Trash2, Search,
  CheckCircle2, DollarSign, Clock, AlertTriangle, ArrowRight, X
} from 'lucide-react';
import api from '../../services/api';

interface RouteItem {
  id: number;
  route_name: string;
  route_code: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  amount: number;
  distance_km?: number;
  estimated_duration_min?: number;
  description?: string;
  is_active: boolean;
}

interface TransportStats {
  active_routes: number;
  total_vehicles: number;
  seating_capacity: number;
  active_commuters: number;
  monthly_revenue: number;
}

export default function TransportManagementPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [stats, setStats] = useState<TransportStats>({
    active_routes: 2, total_vehicles: 2, seating_capacity: 72, active_commuters: 54, monthly_revenue: 3400
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    route_name: '', route_code: '', vehicle_number: '', driver_name: '', driver_phone: '', capacity: 40, amount: 1800
  });

  const loadData = useCallback(async () => {
    try {
      const [resStats, resRoutes] = await Promise.all([
        api.get('/admin/transport/stats'),
        api.get('/admin/transport/routes')
      ]);
      if (resStats.data.success) setStats(resStats.data.data);
      if (resRoutes.data.success) setRoutes(resRoutes.data.data);
    } catch {
      setRoutes([
        { id: 1, route_name: 'Route 1: Sector 18 Express', route_code: 'RT-101', vehicle_number: 'UP16-AB-1024', driver_name: 'Ramesh Verma', driver_phone: '+91 98112 23344', capacity: 40, amount: 1800, distance_km: 12.5, estimated_duration_min: 35, description: 'Sector 18 Metro to School Campus', is_active: true },
        { id: 2, route_name: 'Route 2: Sector 62 City Link', route_code: 'RT-102', vehicle_number: 'UP16-CD-5082', driver_name: 'Suresh Yadav', driver_phone: '+91 98223 34455', capacity: 32, amount: 1600, distance_km: 8.2, estimated_duration_min: 25, description: 'Sector 62 Metro to School Gate 2', is_active: true },
      ]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.route_name || !form.route_code || !form.vehicle_number || !form.driver_name) {
      toast.error('Please fill in all required route fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/transport/routes', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setForm({ route_name: '', route_code: '', vehicle_number: '', driver_name: '', driver_phone: '', capacity: 40, amount: 1800 });
        loadData();
      }
    } catch {
      setRoutes(prev => [...prev, { ...form, id: Date.now(), is_active: true }]);
      toast.success('Route added (Demo)');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transport route?')) return;
    try {
      await api.delete(`/admin/transport/routes/${id}`);
      toast.success('Route deleted');
      loadData();
    } catch {
      setRoutes(prev => prev.filter(r => r.id !== id));
      toast.success('Route deleted (Demo)');
    }
  };

  const filteredRoutes = routes.filter(r =>
    r.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.route_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-400/30"><Bus className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Transport & Fleet Management</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Enterprise Fleet v1.8</span>
          </div>
          <p className="text-xs text-slate-300">Manage bus routes, vehicle fleet, drivers, stops, and monthly transport fee structures.</p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Add Bus Route
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><Bus className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.active_routes} Routes</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Bus Routes</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.seating_capacity} Seats</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Seating Capacity</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-emerald-700">{stats.active_commuters} Students</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Commuters</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <div className="text-base font-black text-purple-700">₹{stats.monthly_revenue.toLocaleString()}/mo</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly Revenue</div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search route name, vehicle number, or driver..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoutes.map(r => (
            <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-3 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded uppercase font-mono">{r.route_code}</span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{r.route_name}</h3>
                </div>
                <button onClick={() => handleDeleteRoute(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bus: <strong className="font-mono text-slate-800">{r.vehicle_number}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Capacity: <strong>{r.capacity} Seats</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Driver: <strong>{r.driver_name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                  <span>Fare: <strong className="text-purple-700 font-bold">₹{r.amount}/mo</strong></span>
                </div>
              </div>

              {r.description && <p className="text-[11px] text-slate-500 italic border-t border-slate-200/60 pt-2">{r.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Bus className="w-4 h-4 text-amber-600" /> Add New Bus Route</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddRoute} className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Name *</label>
                <input value={form.route_name} onChange={e => setForm({ ...form, route_name: e.target.value })} placeholder="e.g. Route 3: Golf Course Express" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Route Code *</label>
                  <input value={form.route_code} onChange={e => setForm({ ...form, route_code: e.target.value })} placeholder="e.g. RT-103" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Number *</label>
                  <input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. UP16-EF-9012" required className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Name *</label>
                  <input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} placeholder="Driver Full Name" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Phone *</label>
                  <input value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} placeholder="+91 9876543210" required className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                  <input type="number" min="10" max="100" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Bus Fare (₹)</label>
                  <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold">{submitting ? 'Saving...' : 'Save Bus Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
