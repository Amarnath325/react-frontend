import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  FileText,
  Upload,
  Download,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileCheck
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface StaffDoc {
  id: number;
  school_id: number;
  staff_id: number;
  staff_type: string;
  document_type: string;
  document_title: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  issue_date: string | null;
  expiry_date: string | null;
  document_number: string | null;
  issuing_authority: string | null;
  remarks: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_remarks: string | null;
  verified_at: string | null;
  is_active: boolean;
  staff_name?: string;
  staff_employee_id?: string;
  created_at?: string;
}

interface StaffOption {
  id: number;
  name: string;
  employee_id: string;
  type: string;
  label: string;
}

const DOC_TYPES = [
  'Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID', 'Driving License',
  'Experience Letter', 'Relieving Letter', 'Appointment Letter', 'Offer Letter',
  'Degree Certificate', 'Diploma Certificate', 'Mark Sheet', 'B.Ed Certificate',
  'CTET Certificate', 'TET Certificate', 'Medical Certificate', 'Police Verification',
  'Address Proof', 'Bank Passbook', 'Salary Slip', 'Contract Agreement', 'Other'
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const STORAGE_URL = API_BASE.replace('/api', '') + '/storage/';
const PAGE_SIZE = 10;

export default function EmployeeDocuments() {
  const [docs, setDocs]             = useState<StaffDoc[]>([]);
  const [staffList, setStaffList]   = useState<StaffOption[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [alert, setAlert]           = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [page, setPage]             = useState(1);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showView, setShowView]     = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StaffDoc | null>(null);
  const [viewDoc, setViewDoc]       = useState<StaffDoc | null>(null);
  const [verifyDoc, setVerifyDoc]   = useState<StaffDoc | null>(null);
  const [deleteDoc, setDeleteDoc]   = useState<StaffDoc | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // Upload form
  const [form, setForm] = useState({
    staff_id: '', staff_type: '', document_type: '', document_title: '',
    issue_date: '', expiry_date: '', document_number: '', issuing_authority: '', remarks: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verify form
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected'>('verified');
  const [verifyRemarks, setVerifyRemarks] = useState('');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlertMsg = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/staff-documents');
      if (res.data.success) setDocs(res.data.data || []);
    } catch {
      showAlertMsg('err', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [showAlertMsg]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/school/staff-documents/staff-list');
      if (res.data.success) setStaffList(res.data.data || []);
    } catch {
      console.error('Failed to load staff list');
    }
  }, []);

  useEffect(() => { fetchDocs(); fetchStaff(); }, [fetchDocs, fetchStaff]);

  /* ════════ FORM HELPERS ════════ */
  const resetForm = () => {
    setForm({ staff_id: '', staff_type: '', document_type: '', document_title: '', issue_date: '', expiry_date: '', document_number: '', issuing_authority: '', remarks: '' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openUpload = () => { setEditingDoc(null); resetForm(); setShowUpload(true); };

  const openEdit = (doc: StaffDoc) => {
    setEditingDoc(doc);
    setForm({
      staff_id: doc.staff_id.toString(),
      staff_type: doc.staff_type,
      document_type: doc.document_type,
      document_title: doc.document_title,
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
      document_number: doc.document_number || '',
      issuing_authority: doc.issuing_authority || '',
      remarks: doc.remarks || '',
    });
    setSelectedFile(null);
    setShowUpload(true);
  };

  const handleStaffSelect = (val: string) => {
    if (!val) { setForm(p => ({ ...p, staff_id: '', staff_type: '' })); return; }
    const [id, type] = val.split('|');
    setForm(p => ({ ...p, staff_id: id, staff_type: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc && !selectedFile) { showAlertMsg('err', 'Please select a file to upload'); return; }
    if (!form.staff_id || !form.document_type || !form.document_title) { showAlertMsg('err', 'Please fill all required fields'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (selectedFile) fd.append('file', selectedFile);
      fd.append('staff_id', form.staff_id);
      fd.append('staff_type', form.staff_type);
      fd.append('document_type', form.document_type);
      fd.append('document_title', form.document_title);
      if (form.issue_date) fd.append('issue_date', form.issue_date);
      if (form.expiry_date) fd.append('expiry_date', form.expiry_date);
      if (form.document_number) fd.append('document_number', form.document_number);
      if (form.issuing_authority) fd.append('issuing_authority', form.issuing_authority);
      if (form.remarks) fd.append('remarks', form.remarks);

      if (editingDoc) {
        const res = await api.post(`/school/staff-documents/${editingDoc.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.success) showAlertMsg('ok', 'Document updated successfully');
      } else {
        const res = await api.post('/school/staff-documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.success) showAlertMsg('ok', 'Document uploaded successfully');
      }
      setShowUpload(false);
      fetchDocs();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyDoc) return;
    try {
      const res = await api.patch(`/school/staff-documents/${verifyDoc.id}/verify`, {
        verification_status: verifyStatus,
        verification_remarks: verifyRemarks || null,
      });
      if (res.data.success) {
        showAlertMsg('ok', `Document ${verifyStatus} successfully`);
        setShowVerify(false);
        fetchDocs();
      }
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Verification failed');
    }
  };

  const handleDownload = async (doc: StaffDoc) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/school/staff-documents/${doc.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showAlertMsg('err', 'Failed to download');
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/staff-documents/${deleteDoc.id}`);
      if (res.data.success) { showAlertMsg('ok', 'Document deleted'); setShowDelete(false); setDeleteDoc(null); fetchDocs(); }
    } catch { showAlertMsg('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ════════ HELPERS ════════ */
  const formatSize = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Clock className="w-3 h-3" /> },
      verified: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
      rejected: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: <XCircle className="w-3 h-3" /> },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${s.bg} ${s.text}`}>
        {s.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const fileIcon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type?.toLowerCase())) return '🖼️';
    if (type?.toLowerCase() === 'pdf') return '📄';
    if (['doc', 'docx'].includes(type?.toLowerCase())) return '📝';
    if (['xls', 'xlsx'].includes(type?.toLowerCase())) return '📊';
    return '📎';
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = docs.filter(d => {
    const matchesSearch = !search ||
      d.document_title.toLowerCase().includes(search.toLowerCase()) ||
      d.document_type.toLowerCase().includes(search.toLowerCase()) ||
      (d.staff_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.document_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.staff_employee_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || d.document_type === filterType;
    const matchesVerification = !filterVerification || d.verification_status === filterVerification;
    return matchesSearch && matchesType && matchesVerification;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ════════════ HEADER ════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><FileText className="w-5 h-5" /></span>
            <span>Staff Document Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Upload, manage, and verify official staff documents — ID proofs, certificates, experience letters</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDocs} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" /><span>Refresh</span>
          </button>
          <button onClick={openUpload} className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
            <Upload className="w-4 h-4" /><span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ════════════ METRIC CARDS ════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'Total Documents', value: docs.length, bg: 'bg-cyan-50', text: 'text-cyan-600' },
          { icon: Clock, label: 'Pending Verification', value: docs.filter(d => d.verification_status === 'pending').length, bg: 'bg-amber-50', text: 'text-amber-600' },
          { icon: CheckCircle2, label: 'Verified', value: docs.filter(d => d.verification_status === 'verified').length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: XCircle, label: 'Rejected', value: docs.filter(d => d.verification_status === 'rejected').length, bg: 'bg-rose-50', text: 'text-rose-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg ${s.bg} ${s.text}`}><Icon className="w-4 h-4" /></div>
            </div>
          );
        })}
      </div>

      {/* ════════════ CONTROLS ════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
            placeholder="Search by title, type, staff name, document number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-cyan-500 shadow-sm cursor-pointer"
            value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Document Types</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-cyan-500 shadow-sm cursor-pointer"
            value={filterVerification} onChange={e => { setFilterVerification(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* ════════════ TABLE ════════════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-cyan-600 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3"><FileText className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{docs.length === 0 ? 'No documents uploaded yet' : 'No matching documents found'}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{docs.length === 0 ? 'Click "Upload Document" to add the first document' : 'Try adjusting your search or filters'}</p>
          {docs.length === 0 && (
            <button onClick={openUpload} className="mt-4 inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition">
              <Upload className="w-4 h-4" /><span>Upload First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Doc Number</th>
                  <th className="py-3 px-4">File</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4 text-center">Verification</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{d.staff_name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{d.staff_employee_id}</span>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${d.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {d.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{d.document_title}</span>
                      {d.issuing_authority && <span className="text-[10px] text-slate-400 block mt-0.5">{d.issuing_authority}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-cyan-50 text-cyan-700 border border-cyan-100">{d.document_type}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{d.document_number || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>{fileIcon(d.file_type)}</span>
                        <div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[100px]" title={d.file_name}>{d.file_name}</span>
                          <span className="text-[9px] text-slate-400">{formatSize(d.file_size)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{d.issue_date ? new Date(d.issue_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {d.expiry_date ? (
                        <span className={new Date(d.expiry_date) < new Date() ? 'text-rose-600 font-bold' : ''}>
                          {new Date(d.expiry_date).toLocaleDateString('en-IN')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge(d.verification_status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setViewDoc(d); setShowView(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-cyan-600 transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDownload(d)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition" title="Download"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setVerifyDoc(d); setVerifyStatus('verified'); setVerifyRemarks(''); setShowVerify(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition" title="Verify"><Shield className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(d)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setDeleteDoc(d); setShowDelete(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} documents
            </span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const prev = arr[idx - 1]; const showEllipsis = prev && pg - prev > 1;
                return (<React.Fragment key={pg}>{showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ UPLOAD / EDIT MODAL ════════════ */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-600" />
                {editingDoc ? 'Edit Document' : 'Upload Document'}
              </h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Member <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    value={form.staff_id ? `${form.staff_id}|${form.staff_type}` : ''} onChange={e => handleStaffSelect(e.target.value)} required disabled={!!editingDoc}>
                    <option value="">Select Staff Member</option>
                    {staffList.map(s => <option key={`${s.id}-${s.type}`} value={`${s.id}|${s.type}`}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Type <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    value={form.document_type} onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))} required>
                    <option value="">Select Type</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Title <span className="text-rose-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    placeholder="e.g. Aadhaar Card - Front" value={form.document_title} onChange={e => setForm(p => ({ ...p, document_title: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    placeholder="e.g. XXXX-XXXX-XXXX" value={form.document_number} onChange={e => setForm(p => ({ ...p, document_number: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Issuing Authority</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    placeholder="e.g. UIDAI" value={form.issuing_authority} onChange={e => setForm(p => ({ ...p, issuing_authority: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Issue Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {editingDoc ? 'Replace File (optional)' : 'File'} {!editingDoc && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-cyan-400 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileCheck className="w-5 h-5 text-cyan-600" />
                        <span className="text-xs font-semibold text-slate-700">{selectedFile.name}</span>
                        <span className="text-[10px] text-slate-400">({formatSize(selectedFile.size)})</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">Click to select file</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG, DOC, XLS (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    rows={2} placeholder="Any additional notes..." value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowUpload(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingDoc ? 'Update Document' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ VIEW MODAL ════════════ */}
      {showView && viewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-600" /> Document Details</h3>
              <button onClick={() => setShowView(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 bg-cyan-50/50 p-3 rounded-xl border border-cyan-100">
                <div className="text-3xl">{fileIcon(viewDoc.file_type)}</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{viewDoc.document_title}</h4>
                  <p className="text-[11px] text-slate-500">{viewDoc.file_name} · {formatSize(viewDoc.file_size)}</p>
                  <div className="mt-1">{statusBadge(viewDoc.verification_status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Staff Member', viewDoc.staff_name],
                  ['Staff Type', viewDoc.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'],
                  ['Document Type', viewDoc.document_type],
                  ['Document Number', viewDoc.document_number],
                  ['Issuing Authority', viewDoc.issuing_authority],
                  ['Issue Date', viewDoc.issue_date ? new Date(viewDoc.issue_date).toLocaleDateString('en-IN') : null],
                  ['Expiry Date', viewDoc.expiry_date ? new Date(viewDoc.expiry_date).toLocaleDateString('en-IN') : null],
                  ['Uploaded', viewDoc.created_at ? new Date(viewDoc.created_at).toLocaleDateString('en-IN') : null],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{value || '—'}</span>
                  </div>
                ))}
              </div>
              {viewDoc.remarks && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Remarks</span>
                  <p className="text-xs text-slate-700 mt-1">{viewDoc.remarks}</p>
                </div>
              )}
              {viewDoc.verification_remarks && (
                <div className={`p-3 rounded-lg border ${viewDoc.verification_status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <span className="text-[10px] font-bold uppercase block text-slate-500">Verification Remarks</span>
                  <p className="text-xs text-slate-700 mt-1">{viewDoc.verification_remarks}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => handleDownload(viewDoc)} className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button>
              <button onClick={() => setShowView(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ VERIFY MODAL ════════════ */}
      {showVerify && verifyDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800 text-center">Verify Document</h3>
              <p className="text-xs text-slate-500 mt-1 text-center">
                <strong className="text-slate-700">{verifyDoc.document_title}</strong> — {verifyDoc.staff_name}
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Decision</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setVerifyStatus('verified')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${verifyStatus === 'verified' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      ✅ Verify
                    </button>
                    <button type="button" onClick={() => setVerifyStatus('rejected')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${verifyStatus === 'rejected' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    rows={2} placeholder="Add verification remarks..." value={verifyRemarks} onChange={e => setVerifyRemarks(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowVerify(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition">Cancel</button>
              <button onClick={handleVerifySubmit} className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition shadow-sm ${verifyStatus === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {verifyStatus === 'verified' ? 'Confirm Verification' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ DELETE MODAL ════════════ */}
      {showDelete && deleteDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Delete Document</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete <strong className="text-slate-700">{deleteDoc.document_title}</strong>?</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
