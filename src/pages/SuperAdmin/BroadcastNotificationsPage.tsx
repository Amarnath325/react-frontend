import toast from 'react-hot-toast';
import { Megaphone, Plus, RefreshCw } from 'lucide-react';

export default function BroadcastNotificationsPage() {
  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-yellow-500/20 text-yellow-400 border-yellow-400/30 rounded-xl border"><Megaphone className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight text-white">Broadcast Notifications</h1>
          </div>
          <p className="text-xs text-slate-400">Send platform-wide notifications to all tenants.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Refreshed')} className="px-3.5 py-2 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => toast.success('Action performed')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total Records', '24', 'text-blue-400'], ['Active', '18', 'text-emerald-400'], ['This Month', '6', 'text-amber-400'], ['Alerts', '2', 'text-red-400']].map(([label, val, color]) => (
          <div key={label} className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
            <div className={`text-2xl font-black ${color}`}>{val}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center min-h-48">
        <span className="p-4 bg-yellow-500/20 text-yellow-400 border-yellow-400/30 rounded-2xl border mb-4 inline-flex"><Megaphone className="w-8 h-8" /></span>
        <h3 className="text-sm font-extrabold text-white mb-1">Broadcast Notifications</h3>
        <p className="text-xs text-slate-400 max-w-sm">Send platform-wide notifications to all tenants.</p>
        <button onClick={() => toast.success('Broadcast Notifications loaded')} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer">
          Load Data
        </button>
      </div>
    </div>
  );
}
