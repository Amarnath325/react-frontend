import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Trash2, Edit3, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, ChevronLeft, Download, FileUp, Eye, Info,
  AlertTriangle, ClipboardList, Clock, CheckSquare
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface Registration {
  id: number;
  registration_number: string;
  registration_date: string;
  status: number;
  status_label: string;
  full_name: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  father_name: string;
  father_mobile: string;
  mother_name: string;
  mother_mobile: string;
  applied_class_name: string;
  applied_class_id: number;
  gender_label: string;
  city: string;
  state: string;
  previous_school: string;
  photo_url: string | null;
  rejection_reason: string | null;
}

interface Stats { total: number; pending: number; approved: number; rejected: number; trashed: number; }
interface MasterOption { value: number; label: string; }
interface ConfirmConfig {
  title: string; message: string; confirmText?: string; danger?: boolean; onConfirm: () => void;
}

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base, borderRadius: '0.375rem', borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
    minHeight: '28px', height: '28px', backgroundColor: '#fff',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' }, transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({ ...base, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (base: any) => ({ ...base, margin: '0', padding: '0', fontSize: '11px', color: '#111827' }),
  placeholder: (base: any) => ({ ...base, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (base: any) => ({ ...base, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (base: any) => ({ ...base, height: '26px' }),
  option: (base: any, state: any) => ({
    ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f3f4f6' : 'transparent',
    color: state.isSelected ? '#fff' : '#374151', fontSize: '11px', padding: '6px 8px', cursor: 'pointer',
  }),
  menu: (base: any) => ({ ...base, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 9999 }),
};

// Status configuration
const STATUS_CONFIG = {
  0: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  1: { label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  2: { label: 'Rejected', cls: 'bg-red-100 text-red-600 border-red-200',         dot: 'bg-red-500' },
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ cfg, onClose }: { cfg: ConfirmConfig; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-gray-150">
        <div className={`mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full ${cfg.danger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          {cfg.danger ? <AlertTriangle size={24} /> : <Info size={24} />}
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-2">{cfg.title}</h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">{cfg.message}</p>
        <div className="flex gap-2.5 justify-center">
          <button className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition" onClick={onClose}>Cancel</button>
          <button
            className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg transition ${cfg.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => { cfg.onConfirm(); onClose(); }}
          >{cfg.confirmText ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────
function ViewModal({ reg, onClose, onStatusChange }: { reg: Registration; onClose: () => void; onStatusChange: (id: number, status: number, reason?: string) => void }) {
  const [statusChanging, setStatusChanging] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleStatus = async (newStatus: number) => {
    setStatusChanging(true);
    try {
      onStatusChange(reg.id, newStatus, newStatus === 2 ? rejectionReason : undefined);
    } finally {
      setStatusChanging(false);
    }
  };

  const Row = ({ label, val }: { label: string; val?: string | null }) =>
    val ? (
      <div>
        <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
        <p className="text-[11px] text-gray-800 font-medium">{val}</p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1100 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-white flex justify-between items-start flex-shrink-0">
          <div>
            <p className="text-[10px] text-gray-400 font-bold">{reg.registration_number}</p>
            <h3 className="text-sm font-extrabold text-gray-800">{reg.full_name}</h3>
            <p className="text-[10px] text-gray-500">{reg.mobile_number} • {reg.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG]?.cls}`}>
              {STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG]?.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><XCircle size={20} /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div className="grid grid-cols-3 gap-3">
            <Row label="Class Applied" val={reg.applied_class_name} />
            <Row label="Gender" val={reg.gender_label} />
            <Row label="Father Name" val={reg.father_name} />
            <Row label="Father Mobile" val={reg.father_mobile} />
            <Row label="Mother Name" val={reg.mother_name} />
            <Row label="Mother Mobile" val={reg.mother_mobile} />
            <Row label="City" val={reg.city} />
            <Row label="State" val={reg.state} />
            <Row label="Previous School" val={reg.previous_school} />
          </div>
          {reg.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-[10px] text-red-600 font-bold mb-1">Rejection Reason</p>
              <p className="text-[11px] text-red-700">{reg.rejection_reason}</p>
            </div>
          )}

          {/* Quick Status Actions */}
          {reg.status !== 1 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Quick Action</p>
              <div className="flex gap-2 flex-wrap">
                {reg.status !== 1 && (
                  <button
                    disabled={statusChanging}
                    onClick={() => handleStatus(1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                )}
                {reg.status !== 2 && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-700 outline-none focus:border-red-400 w-48"
                    />
                    <button
                      disabled={statusChanging}
                      onClick={() => handleStatus(2)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer disabled:opacity-60"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ──────────────────────────────────────────────────────────
function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [warns, setWarns] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const doImport = async () => {
    if (!file) { toast.error('Select a CSV file first'); return; }
    setImporting(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/student-registrations/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult({ created: res.data.created, skipped: res.data.skipped });
      setWarns(res.data.warnings ?? []);
      if (res.data.created > 0) onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Import failed');
    } finally { setImporting(false); }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await api.get('/student-registrations/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_registration_sample.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download sample file');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1100 }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800">Import Registrations</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><XCircle size={18} /></button>
        </div>
        {!result ? (
          <>
            <p className="text-xs text-gray-500">
              Upload a CSV file with registration data.{' '}
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-violet-600 underline font-semibold hover:text-violet-800 bg-transparent border-none p-0 cursor-pointer inline-block"
              >
                Download sample
              </button>
            </p>
            <div
              className="border-2 border-dashed border-violet-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 transition"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp size={28} className="text-violet-400 mx-auto mb-2" />
              <p className="text-[11px] text-gray-600 font-semibold">{file ? file.name : 'Click to select CSV file'}</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <button
              disabled={!file || importing}
              onClick={doImport}
              className="w-full py-2 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-60 cursor-pointer"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </button>
          </>
        ) : (
          <div className="text-center space-y-3">
            <CheckCircle2 size={36} className="text-green-500 mx-auto" />
            <p className="text-sm font-bold text-gray-800">Import Complete!</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-3"><p className="text-lg font-extrabold text-green-600">{result.created}</p><p className="text-[10px] text-green-700">Created</p></div>
              <div className="bg-amber-50 rounded-lg p-3"><p className="text-lg font-extrabold text-amber-600">{result.skipped}</p><p className="text-[10px] text-amber-700">Skipped</p></div>
            </div>
            {warns.length > 0 && (
              <div className="bg-amber-50 rounded p-2 text-left max-h-24 overflow-y-auto">
                {warns.map((w, i) => <p key={i} className="text-[10px] text-amber-700">{w}</p>)}
              </div>
            )}
            <button onClick={onClose} className="w-full py-2 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function StudentRegistration() {
  const navigate = useNavigate();

  const [showTrashed, setShowTrashed] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [current, setCurrent] = useState<Registration | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/student-registrations/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (filterClass) params.class_id = filterClass;
      if (filterStatus !== '') params.status = filterStatus;
      if (filterFrom) params.from_date = filterFrom;
      if (filterTo) params.to_date = filterTo;
      if (showTrashed) params.trashed = '1';

      const res = await api.get('/student-registrations', { params });
      setRegistrations(res.data.data ?? []);
      setPage(res.data.current_page ?? 1);
      setLastPage(res.data.last_page ?? 1);
      setTotal(res.data.total ?? 0);
      setSelected([]);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterStatus, filterFrom, filterTo, perPage, showTrashed]);

  useEffect(() => {
    api.get('/master/classes').then(r => {
      if (r.data?.success && r.data.data) {
        const mapped = Object.entries(r.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        }));
        setClasses(mapped);
      }
    }).catch(() => {});
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { loadData(1); }, 300);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [loadData]);

  const handleStatusChange = async (id: number, status: number, reason?: string) => {
    try {
      await api.patch(`/student-registrations/${id}/toggle-status`, { status, rejection_reason: reason });
      toast.success(`Registration ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}!`);
      loadData(page);
      loadStats();
      if (viewOpen) {
        const updated = registrations.find(r => r.id === id);
        if (updated) { setCurrent({ ...updated, status, status_label: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label, rejection_reason: reason ?? null }); }
        setViewOpen(false);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Status update failed');
    }
  };

  const handleDelete = (id: number) => {
    setConfirm({
      title: 'Move to Trash?',
      message: 'This registration will be moved to trash. You can restore it later.',
      confirmText: 'Move to Trash',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/student-registrations/${id}`);
          toast.success('Moved to trash.');
          loadData(page); loadStats();
        } catch { toast.error('Delete failed'); }
      },
    });
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/student-registrations/${id}/restore`);
      toast.success('Restored!'); loadData(page); loadStats();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = (id: number) => {
    setConfirm({
      title: 'Permanently Delete?',
      message: 'This registration will be permanently deleted and cannot be recovered.',
      confirmText: 'Delete Permanently',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/student-registrations/${id}/force`);
          toast.success('Permanently deleted.'); loadData(page); loadStats();
        } catch { toast.error('Delete failed'); }
      },
    });
  };

  const handleBulkStatus = async (status: number) => {
    if (!selected.length) return;
    try {
      await api.post('/student-registrations/bulk-status', { ids: selected, status });
      toast.success(`Bulk status updated!`); loadData(page); loadStats(); setSelected([]);
    } catch { toast.error('Bulk status failed'); }
  };

  const handleBulkTrash = async () => {
    if (!selected.length) return;
    setConfirm({
      title: `Trash ${selected.length} registration(s)?`,
      message: 'Selected registrations will be moved to trash.',
      confirmText: 'Move to Trash',
      danger: true,
      onConfirm: async () => {
        try {
          await api.post('/student-registrations/bulk-trash', { ids: selected });
          toast.success(`${selected.length} moved to trash.`); loadData(page); loadStats(); setSelected([]);
        } catch { toast.error('Bulk trash failed'); }
      },
    });
  };

  const handleBulkRestore = async () => {
    if (!selected.length) return;
    try {
      await api.post('/student-registrations/bulk-restore', { ids: selected });
      toast.success(`${selected.length} restored.`); loadData(page); loadStats(); setSelected([]);
    } catch { toast.error('Bulk restore failed'); }
  };

  const handleBulkForceDelete = () => {
    if (!selected.length) return;
    setConfirm({
      title: `Permanently delete ${selected.length} registration(s)?`,
      message: 'This action cannot be undone.',
      confirmText: 'Delete Permanently',
      danger: true,
      onConfirm: async () => {
        try {
          await api.post('/student-registrations/bulk-force-delete', { ids: selected });
          toast.success(`${selected.length} permanently deleted.`); loadData(page); loadStats(); setSelected([]);
        } catch { toast.error('Bulk delete failed'); }
      },
    });
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filterStatus !== '') params.status = filterStatus;
      const res = await api.get('/student-registrations/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await api.get('/student-registrations/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_registration_sample.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download sample file');
    }
  };

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === registrations.length ? [] : registrations.map(r => r.id));
  const isAllSelected = registrations.length > 0 && selected.length === registrations.length;

  const statCards = [
    { label: 'Total',    value: stats?.total    ?? 0, icon: <ClipboardList size={18} />,  color: 'from-violet-500 to-violet-600' },
    { label: 'Pending',  value: stats?.pending  ?? 0, icon: <Clock size={18} />,          color: 'from-amber-500 to-amber-600' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: <CheckSquare size={18} />,    color: 'from-green-500 to-green-600' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: <XCircle size={18} />,        color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="text-xs h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-50">
      {confirm && <ConfirmDialog cfg={confirm} onClose={() => setConfirm(null)} />}
      {viewOpen && current && (
        <ViewModal
          reg={current}
          onClose={() => { setViewOpen(false); setCurrent(null); }}
          onStatusChange={handleStatusChange}
        />
      )}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onSuccess={() => { loadData(1); loadStats(); }}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* Header */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-gray-800 leading-tight">Student Registration</h2>
              <p className="text-[10px] text-gray-400">Manage pre-enrollment registration requests</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition cursor-pointer"
              >
                <Download size={13} /> Export
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition cursor-pointer"
              >
                <FileUp size={13} /> Import
              </button>
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition cursor-pointer"
              >
                <Download size={13} /> Download Sample
              </button>
              <button
                onClick={() => navigate('/students/registration/new')}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer"
              >
                <Plus size={13} /> New Registration
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {statCards.map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-lg p-2.5 flex items-center justify-between shadow-sm`}>
                <div>
                  <p className="text-[10px] font-bold opacity-80">{s.label}</p>
                  <p className="text-xl font-extrabold">{s.value}</p>
                </div>
                <div className="opacity-60">{s.icon}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-4 py-2.5 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, reg. no..."
                className="pl-7 pr-3 py-1 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-violet-400"
              />
            </div>

            {/* Class filter */}
            <div className="w-32">
              <Select
                options={[{ value: '', label: 'All Classes' }, ...classes]}
                value={classes.find(c => String(c.value) === filterClass) ?? { value: '', label: 'All Classes' }}
                onChange={opt => setFilterClass(opt?.value !== undefined ? String(opt.value) : '')}
                styles={compactSelectStyles}
                placeholder="Class"
                isClearable={false}
              />
            </div>

            {/* Status filter */}
            <div className="w-32">
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: '0', label: 'Pending' },
                  { value: '1', label: 'Approved' },
                  { value: '2', label: 'Rejected' },
                ]}
                value={filterStatus === '' ? { value: '', label: 'All Status' } : { value: filterStatus, label: STATUS_CONFIG[parseInt(filterStatus) as keyof typeof STATUS_CONFIG]?.label }}
                onChange={opt => setFilterStatus(opt?.value ?? '')}
                styles={compactSelectStyles}
                isClearable={false}
              />
            </div>

            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-violet-400" title="From date" />
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-violet-400" title="To date" />

            <button
              onClick={() => { setSearch(''); setFilterClass(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setShowTrashed(false); loadData(1); loadStats(); }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-violet-600 bg-transparent border-none cursor-pointer"
              title="Reset filters"
            >
              <RefreshCw size={12} />
            </button>

            <div className="ml-auto">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <div
                  className={`w-7 h-4 rounded-full relative transition-all duration-200 ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
                  onClick={() => { setShowTrashed(p => !p); loadData(1); }}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${showTrashed ? 'left-3.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] text-gray-500 font-semibold">Trashed</span>
              </label>
            </div>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-violet-50/50 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-violet-700 font-bold">{selected.length} selected</span>
              {!showTrashed ? (
                <>
                  <button onClick={() => handleBulkStatus(1)} className="px-2 py-1 text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded transition cursor-pointer">Approve</button>
                  <button onClick={() => handleBulkStatus(2)} className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded transition cursor-pointer">Reject</button>
                  <button onClick={() => handleBulkStatus(0)} className="px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded transition cursor-pointer">Set Pending</button>
                  <button onClick={handleBulkTrash} className="px-2 py-1 text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition cursor-pointer">Trash</button>
                </>
              ) : (
                <>
                  <button onClick={handleBulkRestore} className="px-2 py-1 text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded transition cursor-pointer">Restore</button>
                  <button onClick={handleBulkForceDelete} className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded transition cursor-pointer">Delete Permanently</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left w-8">
                    <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Reg. No</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Father</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Mobile</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Class</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-bold text-[10px] uppercase">Date</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-bold text-[10px] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center text-gray-400 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                      Loading registrations...
                    </div>
                  </td></tr>
                ) : registrations.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-gray-400 text-xs">
                    <ClipboardList size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-500">{showTrashed ? 'No trashed registrations' : 'No registrations found'}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{showTrashed ? '' : 'Click "New Registration" to add the first one'}</p>
                  </td></tr>
                ) : (
                  registrations.map(reg => {
                    const sc = STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[0];
                    return (
                      <tr
                        key={reg.id}
                        className={`border-b border-gray-50 hover:bg-violet-50/30 transition group ${selected.includes(reg.id) ? 'bg-violet-50/50' : ''}`}
                      >
                        <td className="px-3 py-2 w-8">
                          <input type="checkbox" checked={selected.includes(reg.id)} onChange={() => toggleSelect(reg.id)} className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] text-violet-600 font-bold">{reg.registration_number}</span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-gray-800">{reg.full_name}</p>
                          <p className="text-[10px] text-gray-400">{reg.email}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-gray-700">{reg.father_name}</p>
                          <p className="text-[10px] text-gray-400">{reg.father_mobile}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{reg.mobile_number}</td>
                        <td className="px-3 py-2">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold rounded px-1.5 py-0.5">{reg.applied_class_name || '—'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{reg.registration_date?.slice(0, 10)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            {!showTrashed && reg.status !== 1 && (
                              <button
                                onClick={() => handleStatusChange(reg.id, 1)}
                                className="p-1 rounded hover:bg-green-100 text-green-600 opacity-0 group-hover:opacity-100 transition cursor-pointer bg-transparent border-none"
                                title="Approve"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                            {!showTrashed && reg.status !== 2 && (
                              <button
                                onClick={() => handleStatusChange(reg.id, 2)}
                                className="p-1 rounded hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer bg-transparent border-none"
                                title="Reject"
                              >
                                <XCircle size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => { setCurrent(reg); setViewOpen(true); }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition cursor-pointer bg-transparent border-none"
                              title="View details"
                            >
                              <Eye size={13} />
                            </button>
                            {!showTrashed && (
                              <>
                                <button
                                  onClick={() => navigate(`/students/registration/edit/${reg.id}`)}
                                  className="p-1 rounded hover:bg-blue-100 text-blue-600 transition cursor-pointer bg-transparent border-none"
                                  title="Edit"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(reg.id)}
                                  className="p-1 rounded hover:bg-red-100 text-red-500 transition cursor-pointer bg-transparent border-none"
                                  title="Move to trash"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                            {showTrashed && (
                              <>
                                <button onClick={() => handleRestore(reg.id)} className="p-1 rounded hover:bg-green-100 text-green-600 cursor-pointer bg-transparent border-none" title="Restore">
                                  <RefreshCw size={13} />
                                </button>
                                <button onClick={() => handleForceDelete(reg.id)} className="p-1 rounded hover:bg-red-100 text-red-500 cursor-pointer bg-transparent border-none" title="Delete permanently">
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && registrations.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Per page:</span>
                <select value={perPage} onChange={e => setPerPage(parseInt(e.target.value))} className="border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none">
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[10px] text-gray-400">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}</span>
              </div>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none"><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                  const p = Math.max(1, page - 2) + i;
                  if (p > lastPage) return null;
                  return <button key={p} onClick={() => loadData(p)} className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer border-none transition ${p === page ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>;
                })}
                <button disabled={page >= lastPage} onClick={() => loadData(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
