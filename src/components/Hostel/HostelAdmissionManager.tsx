import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Select from 'react-select';
import {
  Search, Plus, Filter, CheckCircle, XCircle, AlertCircle,
  Trash2, FileText, Check, X, RefreshCw, UserPlus, Shield, Activity,
  Download, Upload, RotateCcw, Trash, FileSpreadsheet, Eye, Info
} from 'lucide-react';

// ─── REACT SELECT STYLES ─────────────────────────────────────────────────────

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '30px',
    height: '30px',
    fontSize: '11px',
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0', // blue-500 : slate-200
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1', // slate-300
    },
    backgroundColor: '#ffffff',
    minWidth: '140px',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '28px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8', // slate-400
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menu: (base: any) => ({
    ...base,
    fontSize: '11px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
    border: '1px solid #f1f5f9',
    zIndex: 50,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb' // blue-600
      : state.isFocused
      ? '#eff6ff' // blue-50
      : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#334155', // slate-700
    padding: '5px 10px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#2563eb',
      color: '#ffffff',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#334155', // slate-700
    fontWeight: '600',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#94a3b8',
  }),
};

// Reusable Pagination component
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items',
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-1.5 mt-2 gap-3 select-none">
      <div className="text-[10px] text-slate-500 font-semibold font-sans">
        Showing <span className="text-slate-800 font-bold">{startItem}-{endItem}</span> of <span className="text-slate-800 font-bold">{totalItems}</span> {itemName}
      </div>
      <div className="flex items-center gap-1 font-sans">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer text-[10px]"
        >
          Previous
        </button>
        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              p === currentPage
                ? 'bg-blue-600 text-white shadow-sm'
                : p === '...'
                ? 'text-slate-400 cursor-default'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer text-[10px]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

interface StudentMaster {
  id: number;
  name: string;
  admission_number: string;
  roll_number: string;
  class_id: number | null;
  class_name: string;
  section: string | null;
  email: string | null;
  mobile: string | null;
  father_name: string | null;
  father_mobile: string | null;
  medical_conditions: string | null;
  allergies: string | null;
}

interface ClassMaster {
  m_id: number;
  m_name: string;
  m_alias_name: string | null;
}

interface SectionMaster {
  id: number;
  section: string;
}

interface HostelAdmission {
  id: number;
  hostel_admission_no: string;
  admission_date: string | null;
  room_type_preference: string;
  medical_history: string | null;
  allergies: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  guardian_relationship: string;
  aadhaar_verified: boolean;
  report_card_verified: boolean;
  medical_clearance_verified: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  remarks: string | null;
  created_at?: string;
  deleted_at?: string | null;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: string;
    roll_number: string;
    section: string | null;
    email: string | null;
    mobile_number: string | null;
    father_name: string | null;
    father_mobile: string | null;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      full_name: string;
      email: string;
    } | null;
    class: {
      m_id: number;
      m_name: string;
    } | null;
  };
}

const HostelAdmissionManager: React.FC = () => {
  // State variables
  const [admissions, setAdmissions] = useState<HostelAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  
  // Masters state
  const [studentMasters, setStudentMasters] = useState<StudentMaster[]>([]);
  const [classMasters, setClassMasters] = useState<ClassMaster[]>([]);
  const [sectionMasters, setSectionMasters] = useState<SectionMaster[]>([]);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [onlyTrashed, setOnlyTrashed] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Options configurations
  const classOptions = useMemo(() => {
    return [
      { value: '', label: 'All Classes' },
      ...classMasters.map(c => ({ value: c.m_id.toString(), label: c.m_alias_name || c.m_name }))
    ];
  }, [classMasters]);

  const sectionOptions = useMemo(() => {
    return [
      { value: '', label: 'All Sections' },
      ...sectionMasters.map(s => ({ value: s.section, label: s.section }))
    ];
  }, [sectionMasters]);

  const studentOptions = useMemo(() => {
    return studentMasters.map(s => ({
      value: s.id.toString(),
      label: `${s.name} (${s.class_name} - ${s.section || 'N/A'}) [Roll: ${s.roll_number || 'N/A'}]`
    }));
  }, [studentMasters]);

  const roomPrefOptions = [
    { value: 'Single', label: 'Single Room Seater' },
    { value: '2-Seater', label: 'Double (2-Seater)' },
    { value: '4-Seater', label: 'Quad (4-Seater)' }
  ];

  const guardianRelationOptions = [
    { value: 'Father', label: 'Father' },
    { value: 'Mother', label: 'Mother' },
    { value: 'Local Guardian', label: 'Local Guardian' },
    { value: 'Other', label: 'Other' }
  ];
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    verified_rate: 0
  });

  // Modal / Drawer state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<HostelAdmission | null>(null);
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New enrolment form state
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [roomPreference, setRoomPreference] = useState('2-Seater');
  const [medHistory, setMedHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Father');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [reportVerified, setReportVerified] = useState(false);
  const [medicalVerified, setMedicalVerified] = useState(false);
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState<'Pending' | 'Approved'>('Pending');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchAdmissions();
      }
    }
  };

  // Load admissions data on filter or page changes
  useEffect(() => {
    fetchAdmissions();
  }, [activeTab, selectedClass, selectedSection, onlyTrashed, currentPage]);

  // Load master data on mount
  useEffect(() => {
    fetchMasters();
  }, []);

  // Reset page number back to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedClass, selectedSection, onlyTrashed]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: activeTab,
        class_id: selectedClass || undefined,
        section: selectedSection || undefined,
        search: search || undefined,
        only_trashed: onlyTrashed ? 'true' : undefined,
        page: currentPage
      };
      
      const response = await api.get('/school/hostel/admissions', { params });
      if (response.data.success) {
        setAdmissions(response.data.data);
        setStats(response.data.stats);
        
        // Parse backend pagination details
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.last_page || 1);
          setTotalItems(response.data.pagination.total || 0);
          setPerPage(response.data.pagination.per_page || 15);
        }
      }
    } catch (error: any) {
      console.error('Error fetching admissions:', error);
      toast.error('Failed to load hostel admissions roster.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const response = await api.get('/school/hostel/admissions/masters');
      if (response.data.success) {
        setStudentMasters(response.data.data.students);
        setClassMasters(response.data.data.classes);
        setSectionMasters(response.data.data.sections);
      }
    } catch (error: any) {
      console.error('Error fetching masters:', error);
    }
  };

  // Find currently selected student in autocomplete list
  const selectedStudentObj = studentMasters.find(s => s.id.toString() === newStudentId);

  // Auto populate student details in the form when selected
  useEffect(() => {
    if (selectedStudentObj) {
      setEmergencyName(selectedStudentObj.father_name || '');
      setEmergencyPhone(selectedStudentObj.father_mobile || selectedStudentObj.mobile || '');
      setMedHistory(selectedStudentObj.medical_conditions || '');
      setAllergies(selectedStudentObj.allergies || '');
    } else {
      setEmergencyName('');
      setEmergencyPhone('');
      setMedHistory('');
      setAllergies('');
    }
  }, [newStudentId]);

  // Handle adding new enrolment
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) {
      toast.error('Please select a student.');
      return;
    }
    
    try {
      const payload = {
        student_id: newStudentId,
        room_type_preference: roomPreference,
        medical_history: medHistory || null,
        allergies: allergies || null,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        guardian_relationship: guardianRelation,
        aadhaar_verified: aadhaarVerified,
        report_card_verified: reportVerified,
        medical_clearance_verified: medicalVerified,
        remarks: formRemarks || null,
        status: formStatus
      };
      
      const response = await api.post('/school/hostel/admissions', payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Admission registered successfully.');
        setIsAddOpen(false);
        resetAddForm();
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Error creating admission:', error);
      toast.error(error.response?.data?.message || 'Failed to submit admission application.');
    }
  };

  // Reset add form fields
  const resetAddForm = () => {
    setNewStudentId('');
    setRoomPreference('2-Seater');
    setMedHistory('');
    setAllergies('');
    setEmergencyName('');
    setEmergencyPhone('');
    setGuardianRelation('Father');
    setAadhaarVerified(false);
    setReportVerified(false);
    setMedicalVerified(false);
    setFormRemarks('');
    setFormStatus('Pending');
  };

  // Open review details modal
  const openReviewDetails = (admission: HostelAdmission) => {
    setSelectedAdmission(admission);
    setIsDetailOpen(true);
  };

  // Handle updating admission details / status
  const handleUpdateStatus = async (status: 'Approved' | 'Rejected' | 'Pending' | 'Cancelled') => {
    if (!selectedAdmission) return;
    
    try {
      const payload = {
        status,
        room_type_preference: selectedAdmission.room_type_preference,
        medical_history: selectedAdmission.medical_history,
        allergies: selectedAdmission.allergies,
        emergency_contact_name: selectedAdmission.emergency_contact_name,
        emergency_contact_phone: selectedAdmission.emergency_contact_phone,
        guardian_relationship: selectedAdmission.guardian_relationship,
        aadhaar_verified: selectedAdmission.aadhaar_verified,
        report_card_verified: selectedAdmission.report_card_verified,
        medical_clearance_verified: selectedAdmission.medical_clearance_verified,
        remarks: selectedAdmission.remarks
      };

      const response = await api.put(`/school/hostel/admissions/${selectedAdmission.id}`, payload);
      if (response.data.success) {
        toast.success(`Admission application status is now ${status}`);
        setIsDetailOpen(false);
        setSelectedAdmission(null);
        fetchAdmissions();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };

  // Save changes from details modal directly
  const handleDetailSave = async () => {
    if (!selectedAdmission) return;
    
    try {
      const payload = {
        status: selectedAdmission.status,
        room_type_preference: selectedAdmission.room_type_preference,
        medical_history: selectedAdmission.medical_history,
        allergies: selectedAdmission.allergies,
        emergency_contact_name: selectedAdmission.emergency_contact_name,
        emergency_contact_phone: selectedAdmission.emergency_contact_phone,
        guardian_relationship: selectedAdmission.guardian_relationship,
        aadhaar_verified: selectedAdmission.aadhaar_verified,
        report_card_verified: selectedAdmission.report_card_verified,
        medical_clearance_verified: selectedAdmission.medical_clearance_verified,
        remarks: selectedAdmission.remarks
      };

      const response = await api.put(`/school/hostel/admissions/${selectedAdmission.id}`, payload);
      if (response.data.success) {
        toast.success('Admission details updated successfully.');
        setIsDetailOpen(false);
        setSelectedAdmission(null);
        fetchAdmissions();
      }
    } catch (error: any) {
      console.error('Error saving details:', error);
      toast.error('Failed to update details.');
    }
  };

  // Handle soft deleting admission
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this admission request? This will soft-delete the record.')) {
      return;
    }

    try {
      const response = await api.delete(`/school/hostel/admissions/${id}`);
      if (response.data.success) {
        toast.success('Hostel admission record soft-deleted successfully.');
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Error deleting admission:', error);
      toast.error('Failed to delete admission.');
    }
  };

  // Handle restoring soft deleted admission
  const handleRestore = async (id: number) => {
    try {
      const response = await api.post(`/school/hostel/admissions/${id}/restore`);
      if (response.data.success) {
        toast.success('Hostel admission request restored successfully.');
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Error restoring admission:', error);
      toast.error('Failed to restore admission.');
    }
  };

  // Handle permanently deleting soft deleted admission
  const handleForceDelete = async (id: number) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this record? This action CANNOT be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/school/hostel/admissions/${id}/force`);
      if (response.data.success) {
        toast.success('Hostel admission record permanently deleted.');
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Error force deleting admission:', error);
      toast.error('Failed to permanently delete admission.');
    }
  };

  // Handle row selection
  const toggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === admissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(admissions.map(item => item.id));
    }
  };

  // Bulk Actions Handlers
  const handleBulkStatusChange = async (status: 'Approved' | 'Rejected' | 'Pending' | 'Cancelled') => {
    if (selectedIds.length === 0) return;
    try {
      const response = await api.post('/school/hostel/admissions/bulk-status', {
        ids: selectedIds,
        status
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchAdmissions();
      }
    } catch (error: any) {
      console.error('Bulk status update failed:', error);
      toast.error('Bulk status update failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to soft-delete the ${selectedIds.length} selected admission requests?`)) {
      return;
    }
    try {
      const response = await api.post('/school/hostel/admissions/bulk-delete', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      toast.error('Bulk delete failed.');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      const response = await api.post('/school/hostel/admissions/bulk-restore', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk restore failed:', error);
      toast.error('Bulk restore failed.');
    }
  };

  const handleBulkForceDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the ${selectedIds.length} selected records? This action CANNOT be undone.`)) {
      return;
    }
    try {
      const response = await api.post('/school/hostel/admissions/bulk-force-delete', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedIds([]);
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('Bulk permanent delete failed:', error);
      toast.error('Bulk permanent delete failed.');
    }
  };

  // CSV Exporter
  const exportToCSV = () => {
    if (admissions.length === 0) {
      toast.error('No records in active view to export.');
      return;
    }

    const headers = [
      'Hostel Admission No',
      'Student Name',
      'Admission Number',
      'Roll Number',
      'Class',
      'Section',
      'Room Preference',
      'Aadhaar Verified',
      'Report Card Verified',
      'Medical Clearance Verified',
      'Status',
      'Admission Date',
      'Remarks'
    ];

    const rows = admissions.map(item => [
      item.hostel_admission_no,
      item.student.user ? item.student.user.full_name : `${item.student.first_name} ${item.student.last_name}`,
      item.student.admission_number,
      item.student.roll_number,
      item.student.class ? item.student.class.m_name : 'N/A',
      item.student.section || 'N/A',
      item.room_type_preference,
      item.aadhaar_verified ? 'Yes' : 'No',
      item.report_card_verified ? 'Yes' : 'No',
      item.medical_clearance_verified ? 'Yes' : 'No',
      item.status,
      item.admission_date || '--',
      item.remarks || ''
    ]);
    
    // Construct CSV String
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_admissions_export_${onlyTrashed ? 'trash_' : ''}${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export download started.');
  };

  // Sample CSV Template Downloader
  const downloadSampleCSV = () => {
    const headers = [
      'admission_number',
      'room_type_preference',
      'emergency_contact_name',
      'emergency_contact_phone',
      'guardian_relationship',
      'medical_history',
      'allergies',
      'status',
      'remarks'
    ];
    
    const sampleRows = [
      ['ADM-2026-0001', '2-Seater', 'Rajesh Kumar', '9876543210', 'Father', 'None', 'Dust allergy', 'Pending', 'Prefers first floor room'],
      ['ADM-2026-0002', 'Single', 'Sunita Sharma', '9123456789', 'Mother', 'Asthma', 'Gluten', 'Approved', 'Requires lower berth room']
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_hostel_admissions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded.');
  };

  // CSV Preview Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
          const previewRows: any[] = [];
          for (let i = 1; i < Math.min(lines.length, 6); i++) {
            if (!lines[i].trim()) continue;
            // Split line by commas, accounting for quotes
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^["']|["']$/g, '').trim());
            if (values.length === headers.length) {
              const obj: any = {};
              headers.forEach((header, idx) => {
                obj[header] = values[idx];
              });
              previewRows.push(obj);
            }
          }
          setCsvPreview({ headers, rows: previewRows });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse CSV preview. Please check file formatting.");
      }
    };
    reader.readAsText(file);
  };

  // CSV Submit Uploader
  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select a CSV file first.');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/school/hostel/admissions/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'CSV parsed and processed successfully.');
        if (response.data.errors && response.data.errors.length > 0) {
          console.warn('Import warnings:', response.data.errors);
          toast(
            `Import complete with warnings:\n${response.data.errors.slice(0, 3).join('\n')}`,
            { icon: '⚠️', duration: 6000 }
          );
        }
        setIsImportOpen(false);
        setImportFile(null);
        setCsvPreview(null);
        fetchAdmissions();
        fetchMasters();
      }
    } catch (error: any) {
      console.error('CSV import failed:', error);
      toast.error(error.response?.data?.message || 'CSV import operation encountered an error.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800 bg-slate-50/50 min-h-screen">
      
      {/* ── HEADER & TITLE ── */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Hostel Management System</div>
            <h1 className="text-base font-bold text-slate-900 mt-0.5">Student Admission & Enrolment</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Action */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold shadow-xs transition duration-150 active:scale-95 cursor-pointer text-[10px]"
            title="Export Grid Data to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Import Action */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-xs transition duration-150 active:scale-95 cursor-pointer text-[10px]"
            title="Bulk Import Admissions from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          {/* New Enrolment Form */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded-lg font-bold shadow-xs transition duration-150 active:scale-95 cursor-pointer text-[10px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Enrolment</span>
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition duration-200">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Applications</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">All registrations filed</div>
        </div>
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition duration-200">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Approved Admissions</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.approved}</div>
          <div className="text-[10px] text-slate-500 mt-1">Beds successfully assigned</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition duration-200">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pending Review</div>
          <div className="text-xl font-bold text-amber-500 mt-1">{stats.pending}</div>
          <div className="text-[10px] text-slate-500 mt-1">Awaiting warden verification</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 hover:shadow-md transition duration-200">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Approval Rate</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.verified_rate}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Ratio of accepted requests</div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by student name, roll number, admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-4 py-1.5 text-[11px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Dropdown Filters & Trash View */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class filter */}
          <Select
            options={classOptions}
            value={classOptions.find(o => o.value === selectedClass) || null}
            onChange={(selected) => {
              setSelectedClass(selected?.value || '');
              setSelectedSection('');
            }}
            styles={selectStyles}
            placeholder="Select Class"
            isSearchable={true}
          />

          {/* Section filter */}
          <Select
            options={sectionOptions}
            value={sectionOptions.find(o => o.value === selectedSection) || null}
            onChange={(selected) => setSelectedSection(selected?.value || '')}
            styles={selectStyles}
            placeholder="Select Section"
            isSearchable={true}
          />

          <button
            onClick={() => {
              setSearch('');
              setSelectedClass('');
              setSelectedSection('');
              if (currentPage !== 1) {
                setCurrentPage(1);
              } else {
                fetchAdmissions();
              }
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150 cursor-pointer border border-slate-200 bg-white h-[30px] flex items-center justify-center"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {/* Trash Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-100/60 border border-slate-250 rounded-lg px-2.5 py-1 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={onlyTrashed}
              onChange={(e) => setOnlyTrashed(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-bold text-[10px] text-slate-650 uppercase tracking-wide select-none flex items-center gap-1">
              <Trash className={`w-3.5 h-3.5 ${onlyTrashed ? 'text-rose-500' : 'text-slate-400'}`} />
              Trash Bin View
            </span>
          </label>
        </div>
      </div>

      {/* ── BULK ACTION TOOLBAR ── */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md border border-slate-800 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-blue-550 text-white font-bold rounded-full w-5 h-5 text-[9px] shadow-sm">
              {selectedIds.length}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Selected Applications</span>
          </div>

          <div className="flex items-center gap-2">
            {onlyTrashed ? (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected</span>
                </button>
                <button
                  onClick={handleBulkForceDelete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkStatusChange('Approved')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleBulkStatusChange('Rejected')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Soft Delete</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-700 mx-1"></div>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-slate-400 hover:text-white transition text-[10px] font-bold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ── REGISTER ROSTER TABLE ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 justify-between items-center pr-3">
          <div className="flex">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 font-bold border-b-2 text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-650 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab} ({
                  tab === 'All' ? stats.total :
                  tab === 'Pending' ? stats.pending :
                  tab === 'Approved' ? stats.approved :
                  stats.rejected
                })
              </button>
            ))}
          </div>
          {onlyTrashed && (
            <span className="flex items-center gap-1 text-rose-600 text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1 animate-pulse">
              <Info className="w-3.5 h-3.5" />
              Viewing Soft Deleted Records Only
            </span>
          )}
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 font-medium">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <span>Syncing admissions record...</span>
            </div>
          ) : admissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              No hostel admissions found matching active status or filters.
            </div>
          ) : (
            <table className="w-full text-left font-medium text-slate-650">
              <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === admissions.length && admissions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-2.5 px-4">HST No</th>
                  <th className="py-2.5 px-4">Student details</th>
                  <th className="py-2.5 px-4">Class & Section</th>
                  <th className="py-2.5 px-4">Room Preference</th>
                  <th className="py-2.5 px-4">Document Checklist</th>
                  <th className="py-2.5 px-4">Status</th>
                  {onlyTrashed && <th className="py-2.5 px-4">Deleted At</th>}
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {admissions.map((item) => {
                  const isRowSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/40 transition ${isRowSelected ? 'bg-blue-50/20' : ''}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.hostel_admission_no}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {item.student.user ? item.student.user.full_name : `${item.student.first_name} ${item.student.last_name}`}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          ADM: {item.student.admission_number} | Roll: {item.student.roll_number}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700">
                          {item.student.class ? item.student.class.m_name : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-450 mt-0.5">
                          Section {item.student.section || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{item.room_type_preference}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                            item.aadhaar_verified 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-550 border-rose-100/60'
                          }`}>
                            ID Proof
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                            item.report_card_verified 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-550 border-rose-100/60'
                          }`}>
                            Report Card
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                            item.medical_clearance_verified 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-550 border-rose-100/60'
                          }`}>
                            Med Fit
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      {onlyTrashed && (
                        <td className="py-3 px-4 text-slate-450 font-mono text-[10px]">
                          {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '--'}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onlyTrashed ? (
                            <>
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold cursor-pointer text-[10px]"
                                title="Restore Application"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => handleForceDelete(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-650 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded transition duration-150 cursor-pointer"
                                title="Delete Permanently"
                              >
                                <Trash className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openReviewDetails(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded font-semibold cursor-pointer text-[10px]"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-650 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition duration-150 cursor-pointer"
                                title="Soft-delete Application"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && admissions.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/50 rounded-b-xl">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={perPage}
              onPageChange={setCurrentPage}
              itemName="applications"
            />
          </div>
        )}
      </div>

      {/* ── CSV BULK IMPORT DRAWER / MODAL ── */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Bulk Import Admissions from CSV</span>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                  setCsvPreview(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleCSVImport} className="p-5 space-y-4">
              
              {/* Info text & Template download */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-800">Instructions for CSV import:</p>
                  <p className="mt-1">
                    Upload a CSV file containing your student admissions data. The file headers must strictly match the template formatting. 
                    If a student already has a pending or approved application, details will be overwritten (updated), otherwise a new enrolment record will be created.
                  </p>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold mt-2.5 transition active:scale-95 text-[9px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample CSV Template</span>
                  </button>
                </div>
              </div>

              {/* Drag-and-drop input area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/55 hover:bg-slate-50 cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-[11px]">
                  {importFile ? importFile.name : 'Drag & Drop CSV File here or click to browse'}
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Supports: standard comma-separated text files (.csv, .txt)</p>
                {importFile && (
                  <p className="text-[9px] text-emerald-600 font-bold mt-1.5">
                    File selected: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              {/* CSV Preview Cards Table */}
              {csvPreview && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 font-bold text-[9px] uppercase tracking-wide text-slate-500 flex items-center justify-between">
                    <span>Parsed Roster Preview (First 5 Rows)</span>
                    <span className="text-[8px] bg-slate-200 text-slate-650 px-1.5 py-0.5 rounded">Check alignments below</span>
                  </div>
                  <div className="overflow-x-auto max-h-[160px]">
                    <table className="w-full text-left text-[10px] text-slate-600 border-collapse">
                      <thead className="bg-slate-50 font-bold border-b text-slate-450 text-[8px] uppercase">
                        <tr>
                          {csvPreview.headers.map((h, idx) => (
                            <th key={idx} className="py-2 px-3 bg-slate-100/80">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {csvPreview.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-55/20">
                            {csvPreview.headers.map((h, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 max-w-[120px] truncate" title={row[h]}>
                                {row[h] || <span className="text-slate-350 italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setImportFile(null);
                    setCsvPreview(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  disabled={importing || !importFile}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Parse & Import</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── NEW ENROLMENT MODAL ── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Register New Hostel Enrolment</span>
              </div>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  resetAddForm();
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Student Autocomplete Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Student</label>
                <Select
                  options={studentOptions}
                  value={studentOptions.find(o => o.value === newStudentId) || null}
                  onChange={(selected) => setNewStudentId(selected?.value || '')}
                  styles={selectStyles}
                  placeholder="Search by student name, class, section, or roll..."
                  isSearchable={true}
                  className="text-[11px]"
                />
                {studentMasters.length === 0 && (
                  <p className="text-[9px] text-amber-500 mt-1">No vacant students found. All registered students already have active hostel applications.</p>
                )}
              </div>

              {/* Read Only Auto Filled Student Details */}
              {selectedStudentObj && (
                <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-bold block">Class / Section:</span>
                    <span className="text-slate-700 font-semibold">{selectedStudentObj.class_name} - {selectedStudentObj.section || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Admission No:</span>
                    <span className="text-slate-700 font-mono font-semibold">{selectedStudentObj.admission_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Guardian Name:</span>
                    <span className="text-slate-700 font-semibold">{selectedStudentObj.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Contact Details:</span>
                    <span className="text-slate-700 font-mono font-semibold">{selectedStudentObj.father_mobile || selectedStudentObj.mobile || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Preferences & Contact details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Room Type Preference</label>
                  <Select
                    options={roomPrefOptions}
                    value={roomPrefOptions.find(o => o.value === roomPreference) || null}
                    onChange={(selected) => setRoomPreference(selected?.value || '2-Seater')}
                    styles={selectStyles}
                    placeholder="Select preference"
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Guardian relationship</label>
                  <Select
                    options={guardianRelationOptions}
                    value={guardianRelationOptions.find(o => o.value === guardianRelation) || null}
                    onChange={(selected) => setGuardianRelation(selected?.value || 'Father')}
                    styles={selectStyles}
                    placeholder="Select relationship"
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emergency contact name</label>
                  <input
                    type="text"
                    required
                    placeholder="Warden calls in emergencies"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emergency contact phone</label>
                  <input
                    type="text"
                    required
                    placeholder="10 digit mobile number"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              {/* Medical Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medical history / notes</label>
                  <textarea
                    rows={2}
                    placeholder="Chronic issues, medication routines..."
                    value={medHistory}
                    onChange={(e) => setMedHistory(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Food or drug allergies</label>
                  <textarea
                    rows={2}
                    placeholder="Peanut allergy, Penicillin, etc..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Document checklist */}
              <div className="bg-slate-50 border border-slate-250 rounded-xl p-3.5 space-y-2">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide border-b pb-1 mb-2.5">Document Checklist & Physical Verification</div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer bg-white border border-slate-200 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={aadhaarVerified}
                      onChange={(e) => setAadhaarVerified(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Aadhaar / ID Card</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-750 cursor-pointer bg-white border border-slate-200 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={reportVerified}
                      onChange={(e) => setReportVerified(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Prev Report Card</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-750 cursor-pointer bg-white border border-slate-200 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={medicalVerified}
                      onChange={(e) => setMedicalVerified(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Medical Fitness</span>
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Office Remarks / Comments</label>
                <input
                  type="text"
                  placeholder="Notes about verification, temporary room arrangements..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Application Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-750 font-semibold cursor-pointer bg-slate-50 px-3 py-2 border rounded-lg hover:bg-slate-100 w-full justify-center">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'Pending'}
                      onChange={() => setFormStatus('Pending')}
                      className="w-3.5 h-3.5 text-blue-600"
                    />
                    <span>Pending Review</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-750 font-semibold cursor-pointer bg-emerald-50/50 px-3 py-2 border border-emerald-250 rounded-lg hover:bg-emerald-50 w-full justify-center">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'Approved'}
                      onChange={() => setFormStatus('Approved')}
                      className="w-3.5 h-3.5 text-emerald-600"
                    />
                    <span className="text-emerald-700">Pre-Approve Application</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetAddForm();
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                >
                  Register Application
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── REVIEW & VERIFICATION DIALOG ── */}
      {isDetailOpen && selectedAdmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Review Application: {selectedAdmission.hostel_admission_no}</span>
              </div>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedAdmission(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Student Overview Header */}
              <div className="flex items-start justify-between border-b pb-3.5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedAdmission.student.user ? selectedAdmission.student.user.full_name : `${selectedAdmission.student.first_name} ${selectedAdmission.student.last_name}`}
                  </h2>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Admission ID: {selectedAdmission.student.admission_number} | Class: {selectedAdmission.student.class ? selectedAdmission.student.class.m_name : 'N/A'} (Section {selectedAdmission.student.section || 'N/A'})
                  </div>
                </div>
                <span className={`px-2.5 py-0.8 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  selectedAdmission.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  selectedAdmission.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {selectedAdmission.status}
                </span>
              </div>

              {/* Verification Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Physical Document Checklist</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-slate-750 cursor-pointer bg-white border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedAdmission.aadhaar_verified}
                      onChange={(e) => setSelectedAdmission({
                        ...selectedAdmission,
                        aadhaar_verified: e.target.checked
                      })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Aadhaar / ID Card</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-750 cursor-pointer bg-white border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedAdmission.report_card_verified}
                      onChange={(e) => setSelectedAdmission({
                        ...selectedAdmission,
                        report_card_verified: e.target.checked
                      })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Report Card Verified</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-750 cursor-pointer bg-white border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedAdmission.medical_clearance_verified}
                      onChange={(e) => setSelectedAdmission({
                        ...selectedAdmission,
                        medical_clearance_verified: e.target.checked
                      })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[10px]">Medical Fitness Cert</span>
                  </label>
                </div>
              </div>

              {/* Emergency Contacts & Preferences */}
              <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Emergency Contact</div>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-750">{selectedAdmission.emergency_contact_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Relation:</span>
                      <span className="font-bold text-slate-750">{selectedAdmission.guardian_relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono font-bold text-slate-750">{selectedAdmission.emergency_contact_phone}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Preferences & Dates</div>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bed Preference:</span>
                      <span className="font-bold text-slate-750">{selectedAdmission.room_type_preference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applied Date:</span>
                      <span className="font-mono font-bold text-slate-750">
                        {new Date(selectedAdmission.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission Date:</span>
                      <span className="font-mono font-bold text-slate-750">
                        {selectedAdmission.admission_date 
                          ? new Date(selectedAdmission.admission_date).toLocaleDateString()
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical & Allergies */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-red-500" />
                  <span>Medical declaration notes</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-bold block">Medical history:</span>
                    <p className="text-slate-700 mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[40px]">
                      {selectedAdmission.medical_history || 'No medical conditions declared.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Declared allergies:</span>
                    <p className="text-slate-700 mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[40px]">
                      {selectedAdmission.allergies || 'No specific allergies reported.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Office Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Office Remarks / Comments</label>
                <textarea
                  rows={2}
                  placeholder="e.g. verified ID, approved on trial basis..."
                  value={selectedAdmission.remarks || ''}
                  onChange={(e) => setSelectedAdmission({
                    ...selectedAdmission,
                    remarks: e.target.value
                  })}
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between border-t pt-3.5 mt-4">
                <div className="flex gap-1.5">
                  {selectedAdmission.status !== 'Approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('Approved')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer text-[10px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Admission</span>
                    </button>
                  )}
                  {selectedAdmission.status !== 'Rejected' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('Rejected')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-650 hover:bg-rose-750 text-white rounded-lg font-bold shadow-xs transition cursor-pointer text-[10px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setSelectedAdmission(null);
                    }}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDetailSave}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                  >
                    Save details
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HostelAdmissionManager;
