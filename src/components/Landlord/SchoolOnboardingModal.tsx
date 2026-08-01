import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Database, Building, Mail, Lock, X, CheckCircle2, ShieldCheck, Server } from 'lucide-react';
import api from '../../services/api';

interface SchoolOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SchoolOnboardingModal({ isOpen, onClose, onSuccess }: SchoolOnboardingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{
    database_name: string;
    admin_email: string;
    admin_password?: string;
  } | null>(null);

  const [form, setForm] = useState({
    school_name: '',
    school_code: '',
    admin_email: '',
    admin_password: 'School@12345'
  });

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.school_name || !form.school_code || !form.admin_email) {
      toast.error('Please enter school name, unique code, and admin email');
      return;
    }

    setSubmitting(true);
    setProvisionResult(null);

    try {
      const res = await api.post('/landlord/register-school', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setProvisionResult(res.data.data);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'School database provisioning failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 font-sans text-slate-800">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Provision Dedicated Tenant Database</h3>
              <p className="text-[11px] text-slate-300">Register new school & auto-provision isolated MySQL DB</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!provisionResult ? (
          <form onSubmit={handleRegister} className="p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">School Name *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.school_name}
                  onChange={e => {
                    const val = e.target.value;
                    const code = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    setForm({ ...form, school_name: val, school_code: code });
                  }}
                  placeholder="e.g. Cambridge International Academy"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Unique School Code *</label>
                <div className="relative">
                  <Server className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.school_code}
                    onChange={e => setForm({ ...form, school_code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="e.g. cambridge_intl"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">DB Name: <span className="font-mono text-slate-700">school_{form.school_code || 'code'}</span></div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">School Admin Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={e => setForm({ ...form, admin_email: e.target.value })}
                    placeholder="admin@school.com"
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Default Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.admin_password}
                  onChange={e => setForm({ ...form, admin_password: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">⚡ Automated Provisioning Engine:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                <li>Creates isolated raw MySQL database <code className="bg-slate-200 px-1 rounded font-bold">school_{form.school_code || 'code'}</code></li>
                <li>Executes 190+ ERP migrations programmatically</li>
                <li>Seeds default school admin credentials & role security</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Provisioning DB...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" /> Provision Tenant Database
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Provision Success Result */
          <div className="p-6 space-y-4 text-xs text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">Tenant Database Live!</h4>
              <p className="text-slate-500 text-xs mt-0.5">Isolated MySQL database created & 100% migrated.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 font-mono text-[11px]">
              <div><span className="text-slate-400">Database Name:</span> <strong className="text-blue-700">{provisionResult.database_name}</strong></div>
              <div><span className="text-slate-400">Admin Email:</span> <strong className="text-slate-900">{provisionResult.admin_email}</strong></div>
              <div><span className="text-slate-400">Default Password:</span> <strong className="text-emerald-700">{provisionResult.admin_password || 'School@12345'}</strong></div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('tenant_code', form.school_code);
                  toast.success(`Switched active tenant DB to ${provisionResult.database_name}`);
                  onClose();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Switch Active Tenant DB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
