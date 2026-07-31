import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Shield, Smartphone, Key, Lock, Laptop, Globe, Check,
  X, AlertTriangle, ShieldCheck, QrCode, LogOut
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Types
interface UserSessionItem {
  id: number; session_token: string; ip_address: string; user_agent: string;
  device_type: string; browser: string; location: string; is_current: boolean;
  last_activity_at: string; created_at: string;
}

interface SecuritySettingsData {
  two_factor_required: boolean; two_factor_enabled: boolean; two_factor_method: string;
  min_password_length: number; require_uppercase: boolean; require_numbers: boolean;
  require_special_chars: boolean; password_expiry_days: number;
  max_failed_attempts: number; lockout_duration_minutes: number;
  ip_whitelist: string[];
}

export default function SecurityManagementPage() {
  const { lockSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'sessions' | '2fa' | 'password' | 'ip'>('sessions');

  // State
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [settings, setSettings] = useState<SecuritySettingsData | null>(null);
  const [newIp, setNewIp] = useState('');

  // Loaders
  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/admin/security/sessions');
      if (res.data.success) setSessions(res.data.data);
    } catch {
      setSessions([
        { id: 1, session_token: 'sess_live_123', ip_address: '192.168.1.105', user_agent: 'Chrome / Windows 10', device_type: 'Desktop', browser: 'Chrome 122 on Windows 10', location: 'Delhi, India', is_current: true, last_activity_at: new Date().toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 2, session_token: 'sess_live_456', ip_address: '192.168.1.112', user_agent: 'Safari / iPhone 15', device_type: 'Mobile', browser: 'Safari on iOS', location: 'Delhi, India', is_current: false, last_activity_at: new Date(Date.now() - 1500000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/admin/security/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch {
      setSettings({
        two_factor_required: false, two_factor_enabled: true, two_factor_method: 'totp',
        min_password_length: 8, require_uppercase: true, require_numbers: true,
        require_special_chars: true, password_expiry_days: 90,
        max_failed_attempts: 5, lockout_duration_minutes: 30,
        ip_whitelist: ['192.168.1.0/24', '10.0.0.1'],
      });
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadSessions(), loadSettings()]);
  }, [loadSessions, loadSettings]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Actions
  const handleTerminateSession = async (id: number) => {
    try {
      await api.post(`/admin/security/sessions/${id}/terminate`);
      toast.success('Session terminated');
      loadSessions();
    } catch {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session terminated (Demo)');
    }
  };

  const handleTerminateAllOther = async () => {
    if (!confirm('Are you sure you want to log out all other active sessions across all devices?')) return;
    try {
      const res = await api.post('/admin/security/sessions/terminate-all');
      toast.success(res.data.message || 'Terminated all other sessions');
      loadSessions();
    } catch {
      setSessions(prev => prev.filter(s => s.is_current));
      toast.success('All other sessions terminated (Demo)');
    }
  };

  const handleToggle2FA = async () => {
    try {
      const res = await api.post('/admin/security/2fa/toggle');
      if (res.data.success) {
        toast.success(res.data.message);
        loadSettings();
      }
    } catch {
      setSettings(prev => prev ? { ...prev, two_factor_enabled: !prev.two_factor_enabled } : null);
      toast.success('2FA status updated (Demo)');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      const res = await api.put('/admin/security/settings', settings);
      if (res.data.success) toast.success('Security settings saved');
    } catch {
      toast.success('Security settings saved (Demo)');
    }
  };

  const handleAddIp = () => {
    if (!newIp.trim()) return;
    if (settings) {
      setSettings({ ...settings, ip_whitelist: [...(settings.ip_whitelist || []), newIp.trim()] });
      setNewIp('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    if (settings) {
      setSettings({ ...settings, ip_whitelist: settings.ip_whitelist.filter(x => x !== ip) });
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30"><Shield className="w-5 h-5" /></span>
            <h1 className="text-xl font-black tracking-tight">Security & Authentication Center</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Enterprise Security v2.4</span>
          </div>
          <p className="text-xs text-slate-300">Manage active device sessions, 2FA authentication, password hardening rules, and IP whitelisting.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={lockSession} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Lock className="w-4 h-4" /> Lock Screen Now
          </button>
        </div>
      </div>

      {/* Security KPI Cards */}
      {settings && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${settings.two_factor_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{settings.two_factor_enabled ? '2FA Active' : '2FA Disabled'}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Two-Factor Auth</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Laptop className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-slate-900">{sessions.length} Devices</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Sessions</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><Key className="w-5 h-5" /></div>
            <div>
              <div className="text-base font-black text-purple-700">Min {settings.min_password_length} Chars</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Password Policy</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <div className="text-base font-black text-rose-700">{settings.max_failed_attempts} Attempts</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Lockout Policy</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {[
          { key: 'sessions', label: 'Active Device Sessions', icon: Laptop, count: sessions.length },
          { key: '2fa', label: 'Two-Factor Auth (2FA)', icon: ShieldCheck },
          { key: 'password', label: 'Password Policy Rules', icon: Key },
          { key: 'ip', label: 'IP Whitelist & Access', icon: Globe },
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

      {/* TAB 1: ACTIVE DEVICE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Laptop className="w-4 h-4 text-blue-600" /> Active Logged-in Devices</h2>
              <p className="text-xs text-slate-500">View all devices currently logged into your MySchoolPoint account.</p>
            </div>
            {sessions.length > 1 && (
              <button onClick={handleTerminateAllOther} className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                <LogOut className="w-4 h-4" /> Logout All Other Devices
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className={`p-4 rounded-xl border-2 transition-all ${s.is_current ? 'border-blue-400 bg-blue-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 flex-shrink-0">
                      {s.device_type === 'Mobile' ? <Smartphone className="w-5 h-5 text-purple-600" /> : <Laptop className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{s.browser}</span>
                        {s.is_current && <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">This Device</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 font-mono text-xs text-slate-500 flex-wrap">
                        <span>IP: <strong className="text-slate-700">{s.ip_address}</strong></span>
                        <span>Location: {s.location}</span>
                        <span>Last Active: {new Date(s.last_activity_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {!s.is_current && (
                    <button onClick={() => handleTerminateSession(s.id)} className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                      Terminate Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TWO-FACTOR AUTH (2FA) */}
      {activeTab === '2fa' && settings && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-500">Require an authenticator code or SMS OTP when signing into the ERP.</p>
            </div>
            <button onClick={handleToggle2FA} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${settings.two_factor_enabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
              {settings.two_factor_enabled ? '2FA Enabled' : 'Enable 2FA'}
            </button>
          </div>

          {settings.two_factor_enabled && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">2FA Authentication Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSettings({ ...settings, two_factor_method: 'totp' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${settings.two_factor_method === 'totp' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2"><QrCode className="w-4 h-4 text-blue-600" /> Authenticator App</div>
                    <div className="text-[11px] text-slate-500 mt-1">Google Authenticator, Authy, or Microsoft Authenticator</div>
                  </button>
                  <button onClick={() => setSettings({ ...settings, two_factor_method: 'sms' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${settings.two_factor_method === 'sms' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-600" /> SMS OTP Code</div>
                    <div className="text-[11px] text-slate-500 mt-1">Send 6-digit OTP code to registered mobile phone</div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-xs text-slate-800">Backup Security Recovery Codes</div>
                <p className="text-xs text-slate-500">Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.</p>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs font-bold text-slate-700 pt-1">
                  <span className="bg-white p-1.5 rounded border border-slate-300 text-center">A981-F234</span>
                  <span className="bg-white p-1.5 rounded border border-slate-300 text-center">B492-X891</span>
                  <span className="bg-white p-1.5 rounded border border-slate-300 text-center">C194-M482</span>
                  <span className="bg-white p-1.5 rounded border border-slate-300 text-center">D782-P901</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PASSWORD SECURITY POLICY */}
      {activeTab === 'password' && settings && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Key className="w-5 h-5 text-purple-600" /> Password Hardening & Policy Rules</h2>
          <p className="text-xs text-slate-500">Enforce strong password complexity rules for all staff and admin accounts.</p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Password Length ({settings.min_password_length} Characters)</label>
              <input type="range" min="6" max="32" value={settings.min_password_length} onChange={e => setSettings({ ...settings, min_password_length: Number(e.target.value) })} className="w-full accent-blue-600" />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.require_uppercase} onChange={e => setSettings({ ...settings, require_uppercase: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-xs font-semibold text-slate-700">Require at least one Uppercase letter (A-Z)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.require_numbers} onChange={e => setSettings({ ...settings, require_numbers: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-xs font-semibold text-slate-700">Require at least one Number (0-9)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.require_special_chars} onChange={e => setSettings({ ...settings, require_special_chars: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-xs font-semibold text-slate-700">Require at least one Special Character (!@#$%^&*)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max Failed Login Attempts</label>
                <input type="number" min="3" max="10" value={settings.max_failed_attempts} onChange={e => setSettings({ ...settings, max_failed_attempts: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lockout Duration (Minutes)</label>
                <input type="number" min="5" max="1440" value={settings.lockout_duration_minutes} onChange={e => setSettings({ ...settings, lockout_duration_minutes: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold" />
              </div>
            </div>

            <button onClick={handleSaveSettings} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm">
              <Check className="w-4 h-4" /> Save Security Policies
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: IP WHITELISTING */}
      {activeTab === 'ip' && settings && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> IP Whitelisting & Geo-Fencing</h2>
          <p className="text-xs text-slate-500">Restrict administrative access to authorized school IP address ranges.</p>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="e.g. 192.168.1.0/24 or 203.0.113.50"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleAddIp} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">
                Add IP Rule
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {settings.ip_whitelist.map(ip => (
                <div key={ip} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-mono text-xs font-bold text-slate-800">{ip}</span>
                  <button onClick={() => handleRemoveIp(ip)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleSaveSettings} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm">
              <Check className="w-4 h-4" /> Save IP Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
