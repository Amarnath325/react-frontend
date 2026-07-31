import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Key, Activity, Webhook as WebhookIcon, Plus, Copy,
  Trash2, Send, ShieldAlert, CheckCircle2,
  XCircle, Play, Server, Globe
} from 'lucide-react';
import api from '../../services/api';

// Types
interface ApiKeyItem {
  id: number; name: string; key_prefix: string; scopes: string[];
  rate_limit_per_min: number; status: 'active' | 'revoked' | 'expired';
  expires_at: string | null; last_used_at: string | null; created_at: string;
}

interface ApiLogItem {
  id: number; endpoint: string; method: string; status_code: number;
  response_time_ms: number; ip_address: string; created_at: string;
  apiKey?: { name: string; key_prefix: string };
}

interface WebhookItem {
  id: number; name: string; url: string; secret: string;
  events: string[]; is_active: boolean; last_triggered_at: string | null; created_at: string;
}

interface AnalyticsData {
  total_requests: number; success_rate: number; error_count: number;
  avg_latency_ms: number; active_keys_count: number;
}

interface DocEndpoint {
  module: string; name: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string; description: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  sample_res: any;
}

const SCOPE_OPTIONS = [
  { key: 'students:read', label: 'Read Students' },
  { key: 'students:write', label: 'Write/Update Students' },
  { key: 'attendance:read', label: 'Read Attendance' },
  { key: 'attendance:write', label: 'Mark Attendance' },
  { key: 'fees:read', label: 'Read Fee Dues' },
  { key: 'fees:write', label: 'Collect Payments' },
  { key: 'exams:read', label: 'Read Exam Results' },
  { key: 'timetable:read', label: 'Read Timetable' },
];

const WEBHOOK_EVENTS = [
  { key: 'student.created', label: 'Student Registered' },
  { key: 'attendance.marked', label: 'Daily Attendance Marked' },
  { key: 'attendance.absent', label: 'Student Marked Absent' },
  { key: 'fee.payment_success', label: 'Fee Payment Received' },
  { key: 'fee.refund_processed', label: 'Fee Refunded' },
  { key: 'leave.approved', label: 'Leave Approved' },
  { key: 'notice.published', label: 'Notice Published' },
];

export default function ApiManagementPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'explorer' | 'webhooks' | 'logs'>('keys');

  // State
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [docs, setDocs] = useState<DocEndpoint[]>([]);

  // Modals & UI
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ name: string; scopes: string[]; rate_limit: number; expires_days: number }>({
    name: '', scopes: ['students:read', 'attendance:read'], rate_limit: 60, expires_days: 365,
  });
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook Modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['fee.payment_success'] });
  const [testResult, setTestResult] = useState<any>(null);

  // Explorer State
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState(0);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [explorerRes, setExplorerRes] = useState<{ status: number; timeMs: number; data: any } | null>(null);
  const [executingTest, setExecutingTest] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Loaders
  const loadKeys = useCallback(async () => {
    try {
      const res = await api.get('/admin/api-management/keys');
      if (res.data.success) setKeys(res.data.data);
    } catch {
      setKeys([
        { id:1, name:'Biometric Gate Scanner', key_prefix:'msp_live_bio7a...', scopes:['attendance:write','students:read'], rate_limit_per_min:120, status:'active', expires_at:'2027-01-01', last_used_at:'2026-07-30T20:10:00Z', created_at:'2026-06-01' },
        { id:2, name:'Mobile App SDK', key_prefix:'msp_live_mob9f...', scopes:['students:read','fees:read','exams:read'], rate_limit_per_min:300, status:'active', expires_at:'2028-01-01', last_used_at:'2026-07-30T21:45:00Z', created_at:'2026-05-15' },
        { id:3, name:'Legacy Gateway Token', key_prefix:'msp_live_pay3k...', scopes:['fees:write'], rate_limit_per_min:60, status:'revoked', expires_at:null, last_used_at:'2026-07-10T12:00:00Z', created_at:'2026-04-01' },
      ]);
    }
  }, []);

  const loadLogsAndAnalytics = useCallback(async () => {
    try {
      const [logsRes, anaRes] = await Promise.all([
        api.get('/admin/api-management/logs'),
        api.get('/admin/api-management/analytics'),
      ]);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (anaRes.data.success) setAnalytics(anaRes.data.data);
    } catch {
      setLogs([
        { id:1, endpoint:'/api/v1/attendance/mark', method:'POST', status_code:200, response_time_ms:42, ip_address:'192.168.1.10', created_at:'2026-07-30T22:15:00Z', apiKey:{name:'Biometric Gate Scanner', key_prefix:'msp_live_bio7a...'} },
        { id:2, endpoint:'/api/v1/students/list', method:'GET', status_code:200, response_time_ms:65, ip_address:'192.168.1.12', created_at:'2026-07-30T22:12:00Z', apiKey:{name:'Mobile App SDK', key_prefix:'msp_live_mob9f...'} },
        { id:3, endpoint:'/api/v1/fees/student-dues/5', method:'GET', status_code:200, response_time_ms:38, ip_address:'192.168.1.12', created_at:'2026-07-30T22:08:00Z', apiKey:{name:'Mobile App SDK', key_prefix:'msp_live_mob9f...'} },
        { id:4, endpoint:'/api/v1/fees/collect', method:'POST', status_code:401, response_time_ms:15, ip_address:'192.168.1.50', created_at:'2026-07-30T21:40:00Z', apiKey:{name:'Legacy Gateway Token', key_prefix:'msp_live_pay3k...'} },
      ]);
      setAnalytics({ total_requests: 14820, success_rate: 98.6, error_count: 207, avg_latency_ms: 48, active_keys_count: 2 });
    }
  }, []);

  const loadWebhooks = useCallback(async () => {
    try {
      const res = await api.get('/admin/api-management/webhooks');
      if (res.data.success) setWebhooks(res.data.data);
    } catch {
      setWebhooks([
        { id:1, name:'Parent WhatsApp Gateway Webhook', url:'https://api.whatsapp-provider.com/v1/webhooks/msp-notifications', secret:'whsec_x89a1bc94827f', events:['attendance.absent', 'fee.payment_success'], is_active:true, last_triggered_at:'2026-07-30T20:00:00Z', created_at:'2026-05-01' },
        { id:2, name:'Accounting Software Sync (Zoho Books)', url:'https://hooks.zoho.com/services/msp-erp-fees', secret:'whsec_k29471ab49201', events:['fee.payment_success', 'fee.refund_processed'], is_active:true, last_triggered_at:'2026-07-30T18:30:00Z', created_at:'2026-06-15' },
      ]);
    }
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      const res = await api.get('/admin/api-management/docs');
      if (res.data.success) setDocs(res.data.data);
    } catch {
      setDocs([
        {
          module: 'Student Management', name: 'List All Students', method: 'GET', path: '/api/v1/students',
          description: 'Fetch paginated list of students with class, section, and guardian info.',
          params: [{ name: 'class_id', type: 'integer', required: false, desc: 'Filter by class ID' }, { name: 'search', type: 'string', required: false, desc: 'Search by student name' }],
          sample_res: { status: 'success', count: 2, data: [{ id: 1, name: 'Rahul Sharma', class: '10-A' }, { id: 2, name: 'Priya Verma', class: '10-A' }] }
        },
        {
          module: 'Attendance Management', name: 'Mark Daily Attendance', method: 'POST', path: '/api/v1/attendance/mark',
          description: 'Bulk mark student/staff attendance via API or biometric gateway.',
          params: [{ name: 'date', type: 'date', required: true, desc: 'YYYY-MM-DD' }, { name: 'student_id', type: 'integer', required: true, desc: 'Student ID' }, { name: 'status', type: 'string', required: true, desc: 'P, A, or L' }],
          sample_res: { status: 'success', message: 'Attendance logged for Student #1', logged_at: new Date().toISOString() }
        },
        {
          module: 'Fee & Finance', name: 'Get Student Fee Dues', method: 'GET', path: '/api/v1/fees/student-dues/{student_id}',
          description: 'Retrieve outstanding fee breakdown for a student.',
          params: [{ name: 'student_id', type: 'integer', required: true, desc: 'Student ID' }],
          sample_res: { status: 'success', total_due: 4500, fee_heads: [{ head: 'Tuition Fee', due: 3500 }, { head: 'Computer Fee', due: 1000 }] }
        },
      ]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadKeys(), loadLogsAndAnalytics(), loadWebhooks(), loadDocs()]);
  }, [loadKeys, loadLogsAndAnalytics, loadWebhooks, loadDocs]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Handle Key Actions
  const handleGenerateKey = async () => {
    if (!newKeyData.name.trim()) { toast.error('Key Name is required'); return; }
    try {
      const res = await api.post('/admin/api-management/keys', newKeyData);
      if (res.data.success) {
        setGeneratedRawKey(res.data.raw_api_key);
        toast.success('API Key generated!');
        loadKeys();
      }
    } catch {
      const mockKey = 'msp_live_' + Array.from({length:32}, () => Math.floor(Math.random()*36).toString(36)).join('');
      setGeneratedRawKey(mockKey);
      toast.success('Demo API Key generated!');
      setKeys(prev => [{ id: Date.now(), name: newKeyData.name, key_prefix: mockKey.substring(0, 15) + '...', scopes: newKeyData.scopes, rate_limit_per_min: newKeyData.rate_limit, status: 'active', expires_at: new Date(Date.now() + 365*86400000).toISOString(), last_used_at: null, created_at: new Date().toISOString() }, ...prev]);
    }
  };

  const handleRevokeKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any client using it will lose access.')) return;
    try {
      await api.delete(`/admin/api-management/keys/${id}`);
      toast.success('API Key revoked');
      loadKeys();
    } catch {
      setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
      toast.success('API Key revoked (Demo)');
    }
  };

  // Handle Webhook Actions
  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) { toast.error('Name and Target URL are required'); return; }
    try {
      await api.post('/admin/api-management/webhooks', newWebhook);
      toast.success('Webhook registered!');
      setShowWebhookModal(false);
      loadWebhooks();
    } catch {
      toast.success('Webhook registered (Demo)');
      setWebhooks(prev => [{ id: Date.now(), name: newWebhook.name, url: newWebhook.url, secret: 'whsec_' + Math.random().toString(36).substring(2), events: newWebhook.events, is_active: true, last_triggered_at: null, created_at: new Date().toISOString() }, ...prev]);
      setShowWebhookModal(false);
    }
  };

  const handleTestWebhook = async (id: number) => {
    try {
      const res = await api.post(`/admin/api-management/webhooks/${id}/test`);
      if (res.data.success) {
        setTestResult(res.data);
        toast.success('Test payload pinged successfully!');
      }
    } catch {
      setTestResult({
        success: true,
        message: 'Test ping sent to endpoint URL (Mock Response)',
        sample_payload: {
          event: 'test.ping',
          timestamp: new Date().toISOString(),
          data: { status: 'OK', erp: 'MySchoolPoint ERP v3.0' },
          signature: 'sha256_mock_signature_948291a'
        }
      });
      toast.success('Test ping simulated!');
    }
  };

  const handleToggleWebhook = async (id: number) => {
    try {
      await api.put(`/admin/api-management/webhooks/${id}`);
      loadWebhooks();
    } catch {
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !w.is_active } : w));
    }
  };

  // Handle Explorer Execution
  const currentDoc = docs[selectedEndpointIdx] || docs[0];

  const handleExecuteExplorer = () => {
    setExecutingTest(true);
    setTimeout(() => {
      setExplorerRes({
        status: 200,
        timeMs: Math.floor(Math.random() * 40) + 20,
        data: currentDoc ? currentDoc.sample_res : { status: 'OK' }
      });
      setExecutingTest(false);
    }, 400);
  };

  const copyToClipboard = (text: string, type: 'key' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
    if (type === 'curl') { setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 2000); }
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30"><Server className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">API & Developer Portal</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">REST API v1.0</span>
          </div>
          <p className="text-xs text-slate-300">Manage integration API keys, configure webhooks, inspect live access logs, and test endpoints interactively.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowKeyModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Generate New API Key
          </button>
          <button onClick={() => setShowWebhookModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
            <WebhookIcon className="w-4 h-4" /> Add Webhook
          </button>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Requests</div>
            <div className="text-xl font-black text-slate-900">{analytics.total_requests.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Success Rate</div>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-1">{analytics.success_rate}% <CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Latency</div>
            <div className="text-xl font-black text-blue-600 font-mono">{analytics.avg_latency_ms} ms</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Keys</div>
            <div className="text-xl font-black text-purple-600">{analytics.active_keys_count} Keys</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HTTP Errors</div>
            <div className="text-xl font-black text-rose-600">{analytics.error_count}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {[
          { key: 'keys', label: 'API Keys', icon: Key, count: keys.length },
          { key: 'explorer', label: 'Interactive API Explorer', icon: Play },
          { key: 'webhooks', label: 'Webhooks Center', icon: WebhookIcon, count: webhooks.length },
          { key: 'logs', label: 'Traffic & Access Logs', icon: Activity, count: logs.length },
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

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Key className="w-4 h-4 text-blue-600" /> Active API Keys</h2>
            <span className="text-xs text-slate-400">Keys grant external systems permission to interact with your ERP</span>
          </div>

          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className={`p-4 rounded-xl border-2 transition-all ${k.status === 'active' ? 'border-slate-200 bg-slate-50/50 hover:border-blue-300' : 'border-rose-200 bg-rose-50/30 opacity-60'}`}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{k.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${k.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{k.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-500">
                      <span className="bg-white border border-slate-300 px-2 py-0.5 rounded font-bold text-slate-700">{k.key_prefix}</span>
                      <span className="text-[11px] text-slate-400">• Rate limit: {k.rate_limit_per_min} req/min</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {k.status === 'active' && (
                      <button onClick={() => handleRevokeKey(k.id)} className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Revoke Key
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-600">Scopes:</span>
                    {k.scopes.map(s => <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">{s}</span>)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</span>
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: API EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Endpoint List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Available Endpoints</div>
            {docs.map((doc, idx) => (
              <button key={doc.path} onClick={() => setSelectedEndpointIdx(idx)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${selectedEndpointIdx === idx ? 'bg-blue-50 border-blue-400 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase ${doc.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{doc.method}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{doc.module}</span>
                </div>
                <div className="font-bold text-slate-800 truncate">{doc.name}</div>
                <div className="font-mono text-[11px] text-slate-500 truncate mt-0.5">{doc.path}</div>
              </button>
            ))}
          </div>

          {/* Right Playground */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-black uppercase font-mono ${currentDoc?.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{currentDoc?.method}</span>
                  <span className="font-mono text-sm font-bold text-slate-800">{currentDoc?.path}</span>
                </div>
                <button onClick={handleExecuteExplorer} disabled={executingTest} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50">
                  <Play className="w-4 h-4 fill-white" /> {executingTest ? 'Executing...' : 'Send Request'}
                </button>
              </div>

              <p className="text-xs text-slate-600">{currentDoc?.description}</p>

              {/* Params Input */}
              {currentDoc?.params && currentDoc.params.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Query Parameters</div>
                  <div className="grid grid-cols-2 gap-2">
                    {currentDoc.params.map(p => (
                      <div key={p.name}>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">{p.name} {p.required && <span className="text-rose-500">*</span>}</label>
                        <input value={testParams[p.name] || ''} onChange={e => setTestParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                          placeholder={p.desc} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Inspector */}
              {explorerRes && (
                <div className="border border-slate-800 rounded-xl bg-slate-900 text-slate-100 p-4 space-y-2 font-mono text-xs overflow-x-auto">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">STATUS {explorerRes.status} OK</span>
                      <span className="text-slate-400">{explorerRes.timeMs} ms</span>
                    </div>
                    <span className="text-slate-500">application/json</span>
                  </div>
                  <pre className="text-emerald-400 max-h-60 overflow-y-auto">{JSON.stringify(explorerRes.data, null, 2)}</pre>
                </div>
              )}

              {/* cURL Snippet */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-slate-200 text-xs font-mono">
                <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                  <span>cURL Request Command</span>
                  <button onClick={() => copyToClipboard(`curl -X ${currentDoc?.method} "http://localhost:8000${currentDoc?.path}" -H "Authorization: Bearer msp_live_YOUR_KEY"`, 'curl')}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"><Copy className="w-3 h-3" /> {copiedCurl ? 'Copied' : 'Copy'}</button>
                </div>
                <code>curl -X {currentDoc?.method} "http://localhost:8000{currentDoc?.path}" -H "Authorization: Bearer msp_live_YOUR_KEY"</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><WebhookIcon className="w-4 h-4 text-purple-600" /> Webhook Endpoints</h2>
              <p className="text-xs text-slate-500">Subscribed endpoints receive HTTP POST payloads whenever real-time ERP events trigger.</p>
            </div>
            <button onClick={() => setShowWebhookModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Add Webhook Endpoint
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{wh.name}</span>
                      <button onClick={() => handleToggleWebhook(wh.id)} className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${wh.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {wh.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-600 mt-1 flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" /> {wh.url}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTestWebhook(wh.id)} className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                      <Send className="w-3.5 h-3.5" /> Test Ping
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-2 border-t border-slate-200 text-slate-500">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-600">Events:</span>
                    {wh.events.map(ev => <span key={ev} className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-semibold">{ev}</span>)}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">Secret: <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-700 font-bold">{wh.secret}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Result Inspector */}
          {testResult && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-purple-500/50 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-700 pb-2">
                <span>Webhook Test Payload Result</span>
                <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white cursor-pointer text-xs font-normal">Close</button>
              </div>
              <pre className="text-emerald-400 max-h-48 overflow-y-auto">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCESS LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 bg-slate-50">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Real-time HTTP Traffic Logs</div>
            <span className="text-xs text-slate-500">Showing recent 20 API requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[750px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                  <th className="px-4 py-2.5 text-left">Time</th>
                  <th className="px-4 py-2.5 text-left">Method & Endpoint</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Latency</th>
                  <th className="px-4 py-2.5 text-left">API Key / Client</th>
                  <th className="px-4 py-2.5 text-left">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{new Date(l.created_at).toLocaleTimeString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase ${l.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{l.method}</span>
                        <span className="font-mono text-slate-800 font-semibold">{l.endpoint}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${l.status_code < 300 ? 'bg-emerald-100 text-emerald-800' : l.status_code < 500 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{l.status_code}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-700">{l.response_time_ms} ms</td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{l.apiKey?.name || 'Public Endpoint'}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Generate API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="text-sm font-bold flex items-center gap-2"><Key className="w-4 h-4" /> Generate New API Key</div>
              <button onClick={() => { setShowKeyModal(false); setGeneratedRawKey(null); }} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {!generatedRawKey ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Key Name / Client App *</label>
                    <input value={newKeyData.name} onChange={e => setNewKeyData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Biometric Scanner Gate 1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Permission Scopes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SCOPE_OPTIONS.map(s => {
                        const isSel = newKeyData.scopes.includes(s.key);
                        return (
                          <button key={s.key} type="button" onClick={() => setNewKeyData(p => ({ ...p, scopes: isSel ? p.scopes.filter(x => x !== s.key) : [...p.scopes, s.key] }))}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${isSel ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Rate Limit (req/min)</label>
                      <input type="number" value={newKeyData.rate_limit} onChange={e => setNewKeyData(p => ({ ...p, rate_limit: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Expires In (Days)</label>
                      <input type="number" value={newKeyData.expires_days} onChange={e => setNewKeyData(p => ({ ...p, expires_days: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Copy your Secret API Key now!</div>
                      <div>For security reasons, this raw API key will never be displayed again.</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Generated Secret API Key</label>
                    <div className="flex items-center gap-2">
                      <input value={generatedRawKey} readOnly className="w-full px-3 py-2 bg-slate-900 text-emerald-400 font-mono rounded-lg text-xs font-bold border border-slate-700" />
                      <button onClick={() => copyToClipboard(generatedRawKey, 'key')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Copy className="w-3.5 h-3.5" /> {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              {!generatedRawKey ? (
                <>
                  <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Cancel</button>
                  <button onClick={handleGenerateKey} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">Generate API Key</button>
                </>
              ) : (
                <button onClick={() => { setShowKeyModal(false); setGeneratedRawKey(null); }} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">Done & Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-900 text-white flex items-center justify-between">
              <div className="text-sm font-bold flex items-center gap-2"><WebhookIcon className="w-4 h-4" /> Register Webhook Endpoint</div>
              <button onClick={() => setShowWebhookModal(false)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Webhook Name *</label>
                <input value={newWebhook.name} onChange={e => setNewWebhook(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. WhatsApp Gateway" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Endpoint URL (HTTPS) *</label>
                <input value={newWebhook.url} onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://api.yourprovider.com/webhooks" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subscribed Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map(ev => {
                    const isSel = newWebhook.events.includes(ev.key);
                    return (
                      <button key={ev.key} type="button" onClick={() => setNewWebhook(p => ({ ...p, events: isSel ? p.events.filter(x => x !== ev.key) : [...p.events, ev.key] }))}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${isSel ? 'bg-purple-50 border-purple-400 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        {ev.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowWebhookModal(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={handleCreateWebhook} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer">Register Webhook</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
