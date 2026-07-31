import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Activity, UserCheck, AlertTriangle, FileText,
  Search, Filter, RefreshCw, Trash2, Eye, Shield, CheckCircle2,
  XCircle, Clock, ArrowRight, Laptop, Calendar, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

// Types
interface ActivityLogItem {
  id: number; user_id: number | null; user_name: string; user_role: string;
  module: string; action: string; description: string; ip_address: string;
  user_agent: string; properties: { old?: any; attributes?: any } | null;
  created_at: string;
}

interface SystemLogItem {
  id: number; level: 'critical' | 'error' | 'warning' | 'info';
  message: string; file: string | null; line: number | null;
  stack_trace: string | null; context: any; created_at: string;
}

interface LogStats {
  totalToday: number; failedLogins: number; criticalErrs: number;
  uniqueUsers: number; modulesBreakdown: { module: string; count: number }[];
}

const ACTION_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  create:       { label: 'CREATE', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  update:       { label: 'UPDATE', bg: 'bg-blue-100', text: 'text-blue-800' },
  delete:       { label: 'DELETE', bg: 'bg-rose-100', text: 'text-rose-800' },
  login:        { label: 'LOGIN', bg: 'bg-purple-100', text: 'text-purple-800' },
  login_failed: { label: 'FAILED LOGIN', bg: 'bg-rose-100', text: 'text-rose-900 font-black' },
  export:       { label: 'EXPORT', bg: 'bg-amber-100', text: 'text-amber-800' },
};

const MODULE_LIST = ['All Modules', 'Students', 'Fees', 'Attendance', 'Staff', 'Exams', 'Settings', 'Auth'];

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState<'activity' | 'security' | 'system' | 'settings'>('activity');

  // Logs & Stats Data
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [sysLevelFilter, setSysLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [diffModalLog, setDiffModalLog] = useState<ActivityLogItem | null>(null);
  const [stackTraceModalLog, setStackTraceModalLog] = useState<SystemLogItem | null>(null);
  const [purgeDays, setPurgeDays] = useState(30);

  // Fetch Loaders
  const loadActivityLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/logs/activity', {
        params: {
          page,
          per_page: 20,
          module: moduleFilter === 'All Modules' ? undefined : moduleFilter || undefined,
          action: actionFilter || (activeTab === 'security' ? 'login_failed' : undefined),
          search: search || undefined,
        }
      });
      if (res.data.success) {
        setActivityLogs(res.data.data);
        setTotalItems(res.data.total);
      }
    } catch {
      // Mock Fallback
      const mockActivities: ActivityLogItem[] = [
        { id: 1, user_id: 1, user_name: 'Super Admin', user_role: 'super_admin', module: 'Students', action: 'create', description: 'Admitted new student "Aarav Sharma" (ADM-2026-042) to Class 10-A', ip_address: '192.168.1.105', user_agent: 'Chrome / Windows', properties: { attributes: { name: 'Aarav Sharma', class: '10-A', roll_no: 42 }, old: null }, created_at: new Date(Date.now() - 12*60000).toISOString() },
        { id: 2, user_id: 1, user_name: 'Super Admin', user_role: 'super_admin', module: 'Fees', action: 'create', description: 'Collected fee payment ₹4,500 for Student "Priya Verma" (RCP-8910)', ip_address: '192.168.1.105', user_agent: 'Chrome / Windows', properties: { attributes: { amount: 4500, payment_mode: 'UPI' }, old: null }, created_at: new Date(Date.now() - 35*60000).toISOString() },
        { id: 3, user_id: 2, user_name: 'Amit Verma', user_role: 'teacher', module: 'Attendance', action: 'update', description: 'Marked daily attendance for Class 8-B (38 Present, 2 Absent)', ip_address: '192.168.1.112', user_agent: 'Safari / Mac', properties: { attributes: { present: 38, absent: 2 }, old: { present: 0, absent: 0 } }, created_at: new Date(Date.now() - 60*60000).toISOString() },
        { id: 4, user_id: null, user_name: 'Unknown (IP: 203.0.113.45)', user_role: 'Guest', module: 'Auth', action: 'login_failed', description: 'Failed login attempt for username "admin_test" — invalid password', ip_address: '203.0.113.45', user_agent: 'Python-urllib/3.9', properties: { username: 'admin_test', attempt: 3 }, created_at: new Date(Date.now() - 180*60000).toISOString() },
        { id: 5, user_id: 1, user_name: 'Super Admin', user_role: 'super_admin', module: 'Auth', action: 'login', description: 'Successful login from Chrome / Windows 10', ip_address: '192.168.1.105', user_agent: 'Chrome / Windows', properties: null, created_at: new Date(Date.now() - 240*60000).toISOString() },
      ];
      setActivityLogs(mockActivities);
      setTotalItems(mockActivities.length);
    }
  }, [page, moduleFilter, actionFilter, activeTab, search]);

  const loadSystemLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/logs/system', {
        params: { page, per_page: 20, level: sysLevelFilter || undefined, search: search || undefined }
      });
      if (res.data.success) setSystemLogs(res.data.data);
    } catch {
      setSystemLogs([
        { id: 1, level: 'error', message: 'SMS Gateway HTTP 503: Connection Timeout to SMSProvider API Endpoint', file: 'app/Services/SMSGatewayService.php', line: 142, stack_trace: "App\\Services\\SMSGatewayService->sendSMS('9876543210', 'Fee Due Notice')\nApp\\Http\\Controllers\\API\\WEB\\General\\FeeController->sendReminders()", context: { provider: 'Fast2SMS' }, created_at: new Date(Date.now() - 45*60000).toISOString() },
        { id: 2, level: 'warning', message: 'Biometric API Rate Limit Warning: Client "192.168.1.110" reached 95% quota', file: 'app/Http/Middleware/RateLimitMiddleware.php', line: 58, stack_trace: null, context: { limit: 120, current: 114 }, created_at: new Date(Date.now() - 120*60000).toISOString() },
        { id: 3, level: 'info', message: 'Automated Nightly Backup Completed: database_backup_2026_07_30.sql.gz (14.2 MB)', file: 'app/Console/Commands/DatabaseBackupCommand.php', line: 89, stack_trace: null, context: { file_size_mb: 14.2 }, created_at: new Date(Date.now() - 480*60000).toISOString() },
      ]);
    }
  }, [page, sysLevelFilter, search]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/logs/stats');
      if (res.data.success) setStats(res.data.data);
    } catch {
      setStats({ totalToday: 142, failedLogins: 4, criticalErrs: 2, uniqueUsers: 18, modulesBreakdown: [{ module: 'Students', count: 45 }, { module: 'Fees', count: 32 }, { module: 'Attendance', count: 55 }] });
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadActivityLogs(), loadSystemLogs(), loadStats()]);
    setLoading(false);
  }, [loadActivityLogs, loadSystemLogs, loadStats]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePurgeLogs = async () => {
    if (!confirm(`Purge all audit logs older than ${purgeDays} days? This action is permanent.`)) return;
    try {
      const res = await api.post('/admin/logs/clear', { days: purgeDays });
      toast.success(res.data.message || 'Logs purged successfully');
      loadAll();
    } catch {
      toast.success(`Purged logs older than ${purgeDays} days (Demo)`);
    }
  };

  const exportLogsCSV = () => {
    const csvRows = [
      ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Description', 'IP Address'],
      ...activityLogs.map(l => [
        new Date(l.created_at).toLocaleString(),
        `"${l.user_name}"`,
        l.user_role,
        l.module,
        l.action,
        `"${l.description.replace(/"/g, '""')}"`,
        l.ip_address
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported to CSV');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30"><Activity className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">System Audit & Activity Logs</h1>
            <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Audit Compliance</span>
          </div>
          <p className="text-xs text-slate-300">Complete audit trail of user actions, data modifications, security login events, and application errors.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportLogsCSV} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={loadAll} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Activity className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-slate-900">{stats.totalToday}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Actions Today</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0"><UserCheck className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-emerald-700">{stats.uniqueUsers} Users</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Logged Today</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0"><ShieldAlert className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-rose-600">{stats.failedLogins}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Failed Logins (7d)</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-amber-700">{stats.criticalErrs} Exceptions</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">System Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {[
          { key: 'activity', label: 'User Audit Trail', icon: Activity },
          { key: 'security', label: 'Security & Auth Logs', icon: Shield },
          { key: 'system', label: 'System Error Logs', icon: AlertCircle, count: systemLogs.length },
          { key: 'settings', label: 'Retention & Cleanup', icon: Trash2 },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== undefined && <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* TAB 1: USER AUDIT TRAIL */}
      {(activeTab === 'activity' || activeTab === 'security') && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by user, description, or IP..." className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" />
              </div>

              {activeTab === 'activity' && (
                <>
                  <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer">
                    {MODULE_LIST.map(m => <option key={m} value={m === 'All Modules' ? '' : m}>{m}</option>)}
                  </select>

                  <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer">
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="login">Login</option>
                    <option value="export">Export</option>
                  </select>
                </>
              )}
            </div>

            <button onClick={() => { setSearch(''); setModuleFilter(''); setActionFilter(''); }} className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer">Clear</button>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                    <th className="px-4 py-2.5 text-left">Time</th>
                    <th className="px-4 py-2.5 text-left">Performer</th>
                    <th className="px-4 py-2.5 text-left">Module</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                    <th className="px-4 py-2.5 text-left">Description</th>
                    <th className="px-4 py-2.5 text-left">IP & Device</th>
                    <th className="px-4 py-2.5 text-center">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityLogs.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">No audit logs found matching criteria</td></tr>
                  ) : activityLogs.map(l => {
                    const badge = ACTION_BADGES[l.action] || { label: l.action.toUpperCase(), bg: 'bg-slate-100', text: 'text-slate-700' };
                    return (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-900">{l.user_name}</div>
                          <div className="text-[10px] text-slate-400 font-medium capitalize">{l.user_role}</div>
                        </td>
                        <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">{l.module}</span></td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-700">{l.description}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                          <div>{l.ip_address}</div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[140px]">{l.user_agent}</div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {l.properties ? (
                            <button onClick={() => setDiffModalLog(l)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors" title="View Changes Diff">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : <span className="text-slate-300 text-[10px]">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ERROR LOGS */}
      {activeTab === 'system' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1">
              <select value={sysLevelFilter} onChange={e => setSysLevelFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer">
                <option value="">All Log Levels</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {systemLogs.map(s => {
              const isErr = s.level === 'error' || s.level === 'critical';
              return (
                <div key={s.id} className={`p-4 rounded-2xl border ${isErr ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'} shadow-sm space-y-2`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${s.level === 'critical' ? 'bg-rose-600 text-white' : s.level === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{s.level}</span>
                      <span className="font-mono text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</span>
                    </div>

                    {s.stack_trace && (
                      <button onClick={() => setStackTraceModalLog(s)} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono cursor-pointer flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Stack Trace
                      </button>
                    )}
                  </div>

                  <div className="font-bold text-sm text-slate-900 font-mono">{s.message}</div>

                  {s.file && (
                    <div className="text-xs font-mono text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-200">
                      File: <span className="font-bold text-slate-700">{s.file}:{s.line}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RETENTION & CLEANUP */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Trash2 className="w-4.5 h-4.5 text-rose-600" /> Log Retention & Purge Settings</h2>
          <p className="text-xs text-slate-500">Purge old activity and error logs to optimize database performance and save disk space.</p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Purge Logs Older Than (Days)</label>
              <select value={purgeDays} onChange={e => setPurgeDays(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white">
                <option value={7}>7 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
              </select>
            </div>

            <button onClick={handlePurgeLogs} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm">
              <Trash2 className="w-4 h-4" /> Purge Old Logs Now
            </button>
          </div>
        </div>
      )}

      {/* MODAL: View Diff */}
      {diffModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="text-sm font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> Audit Data Changes Diff</div>
              <button onClick={() => setDiffModalLog(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto font-mono text-xs">
              <div className="text-slate-700 font-sans text-xs">
                <strong className="text-slate-900">{diffModalLog.user_name}</strong> performed <strong className="uppercase text-blue-600">{diffModalLog.action}</strong> on {diffModalLog.module}.
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 overflow-x-auto">
                {diffModalLog.properties?.old && (
                  <div>
                    <div className="text-rose-400 text-[10px] uppercase font-bold mb-1">- Previous Values (Before)</div>
                    <pre className="text-rose-300 text-[11px]">{JSON.stringify(diffModalLog.properties.old, null, 2)}</pre>
                  </div>
                )}
                {diffModalLog.properties?.attributes && (
                  <div className="mt-2">
                    <div className="text-emerald-400 text-[10px] uppercase font-bold mb-1">+ New Values (After)</div>
                    <pre className="text-emerald-300 text-[11px]">{JSON.stringify(diffModalLog.properties.attributes, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setDiffModalLog(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Stack Trace */}
      {stackTraceModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> System Exception Stack Trace</div>
              <button onClick={() => setStackTraceModalLog(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto font-mono text-xs">
              <div className="text-rose-700 font-bold font-mono text-sm">{stackTraceModalLog.message}</div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 overflow-x-auto">
                <pre className="text-rose-300 text-[11px]">{stackTraceModalLog.stack_trace || 'No stack trace available.'}</pre>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setStackTraceModalLog(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
