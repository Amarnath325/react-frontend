import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';

interface Allocation {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  fee_structure_id: number;
  fee_head_label: string;
  base_amount: number;
  discount_type: string | null;
  discount_amount: number;
  scholarship_type: string | null;
  scholarship_amount: number;
  transport_route_id: number | null;
  hostel_room_id: number | null;
  previous_balance: number;
  fine_carry_forward: number;
  opening_balance: number;
  custom_amount: number | null;
  net_amount: number;
  frequency_label: string;
  allocated_date: string | null;
  notes: string | null;
  is_active: boolean;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface ClassOption {
  value: number;
  label: string;
}

interface FeeStructureOption {
  value: number;
  label: string;
  class_id: number;
  amount: number;
  frequency_label: string;
  fee_head_label: string;
}

interface StudentOption {
  value: number;
  label: string;
  class_id: number;
  class_name: string;
  transport_required: boolean;
  hostel_required: boolean;
}

interface TransportRouteOption {
  value: number;
  label: string;
  fare: number;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
      checked ? 'bg-emerald-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-[22px]' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function StudentFeeAllocation() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [filteredData, setFilteredData] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCopyYearModalOpen, setIsCopyYearModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Allocation | null>(null);

  // Dropdown options
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRouteOption[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [viewTrash, setViewTrash] = useState(false);

  // Selected row tracking
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Excel import
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    student_id: '',
    fee_structure_ids: [] as string[], // support multi-select allocation
    fee_structure_id: '', // for editing single item
    discount_type: 'None',
    discount_amount: 0,
    scholarship_type: 'None',
    scholarship_amount: 0,
    transport_route_id: '',
    hostel_room_id: '',
    previous_balance: 0,
    fine_carry_forward: 0,
    opening_balance: 0,
    custom_amount: '',
    allocated_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: true,
  });

  // Bulk dialog form fields
  const [bulkAllocForm, setBulkAllocForm] = useState({
    class_id: '',
    student_ids: [] as string[],
    fee_structure_ids: [] as string[],
    discount_type: 'None',
    discount_amount: 0,
    scholarship_type: 'None',
    scholarship_amount: 0,
    allocated_date: new Date().toISOString().split('T')[0],
    notes: 'Bulk class allocation setup',
    is_active: true
  });

  const [copyYearForm, setCopyYearForm] = useState({
    from_year_id: '',
    to_year_id: '',
    student_ids: [] as string[]
  });

  const [promoteForm, setPromoteForm] = useState({
    academic_year_id: '',
    student_ids: [] as string[],
    class_id: ''
  });

  useEffect(() => {
    initLoad();
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [viewTrash]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [allocations, searchTerm, filterClass, filterAcademicYear, sortColumn, sortDirection]);

  const initLoad = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAcademicYears(),
        fetchClasses(),
        fetchDropdownMasters(),
        fetchAllocations(),
        fetchTransportRoutes(),
      ]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load initial masters data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    const res = await api.get('/school/academic-years');
    if (res.data.success) {
      setAcademicYears(res.data.data);
      const current = res.data.data.find((y: any) => y.is_current);
      if (current) {
        setFilterAcademicYear(current.id.toString());
        setCopyYearForm(prev => ({ ...prev, to_year_id: current.id.toString() }));
        setPromoteForm(prev => ({ ...prev, academic_year_id: current.id.toString() }));
      }
    }
  };

  const fetchClasses = async () => {
    const res = await api.get('/school/masters', { params: { group: 'CLASS' } });
    if (res.data.success) {
      setClasses(res.data.data.map((item: any) => ({
        value: item.m_id,
        label: item.m_name,
      })));
    }
  };

  const fetchTransportRoutes = async () => {
    try {
      const res = await api.get('/school/transport-routes');
      if (res.data.success) {
        setTransportRoutes(res.data.data.map((r: any) => ({
          value: r.id,
          label: `${r.name} (Fare: ₹${r.fare})`,
          fare: parseFloat(r.fare)
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDropdownMasters = async () => {
    try {
      const studRes = await api.get('/students', { params: { per_page: 1000 } });
      if (studRes.data.success) {
        setStudents((studRes.data.data || []).map((s: any) => ({
          value: s.id,
          label: `${s.user?.first_name} ${s.user?.last_name} (${s.admission_number} - ${s.class?.m_name || 'No Class'})`,
          class_id: s.class_id,
          class_name: s.class?.m_name || 'No Class',
          transport_required: !!s.transport_required,
          hostel_required: !!s.hostel_required
        })));
      }

      const structRes = await api.get('/school/fee-structures');
      if (structRes.data.success) {
        setFeeStructures((structRes.data.data || []).map((s: any) => ({
          value: s.id,
          label: `${s.fee_head_label} - ₹${parseFloat(s.amount).toFixed(2)} (${s.frequency_label})`,
          class_id: s.class_id,
          amount: parseFloat(s.amount),
          frequency_label: s.frequency_label,
          fee_head_label: s.fee_head_label
        })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await api.get('/school/student-fee-allocations', {
        params: {
          only_trashed: viewTrash ? 1 : 0
        }
      });
      if (response.data.success) {
        setAllocations(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load allocations');
    }
  };

  const getAvailableStructures = (studentId: string) => {
    if (!studentId) return [];
    const selectedStudent = students.find(s => s.value.toString() === studentId.toString());
    if (!selectedStudent) return [];
    return feeStructures.filter(s => s.class_id.toString() === selectedStudent.class_id.toString());
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...allocations];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.student_name.toLowerCase().includes(search) ||
          a.admission_number.toLowerCase().includes(search) ||
          a.roll_number.toLowerCase().includes(search) ||
          a.fee_head_label.toLowerCase().includes(search)
      );
    }

    if (filterClass) {
      filtered = filtered.filter((a) => a.class_name.toLowerCase() === classes.find(c => c.value.toString() === filterClass)?.label.toLowerCase());
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Allocation];
      let bVal: any = b[sortColumn as keyof Allocation];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await api.patch(`/school/student-fee-allocations/${id}/toggle-status`);
      if (res.data.success) {
        toast.success('Billing status updated');
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error('Failed to change status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Move allocation for "${name}" to trash?`)) {
      try {
        const res = await api.delete(`/school/student-fee-allocations/${id}`);
        if (res.data.success) {
          toast.success('Allocation moved to trash');
          fetchAllocations();
        }
      } catch (error) {
        toast.error('Move to trash failed');
      }
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/school/student-fee-allocations/${id}/restore`);
      if (res.data.success) {
        toast.success('Allocation restored');
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Restore failed');
    }
  };

  const handleForceDelete = async (id: number, name: string) => {
    if (window.confirm(`Permanently delete allocation for "${name}"?`)) {
      try {
        const res = await api.delete(`/school/student-fee-allocations/${id}/force`);
        if (res.data.success) {
          toast.success('Allocation permanently deleted');
          fetchAllocations();
        }
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedData.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedItems.size === 0) return;
    try {
      const res = await api.post('/school/student-fee-allocations/bulk-status', {
        ids: Array.from(selectedItems),
        is_active: status ? 1 : 0
      });
      if (res.data.success) {
        toast.success('Selected status updated');
        setSelectedItems(new Set());
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Bulk update failed');
    }
  };

  const handleBulkTrash = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Move selected ${selectedItems.size} items to trash?`)) return;
    try {
      const res = await api.post('/school/student-fee-allocations/bulk-trash', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success('Selected allocations moved to trash');
        setSelectedItems(new Set());
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Bulk trash failed');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.size === 0) return;
    try {
      const res = await api.post('/school/student-fee-allocations/bulk-restore', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success('Allocations restored successfully');
        setSelectedItems(new Set());
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Bulk restore failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedItems.size} allocations?`)) return;
    try {
      const res = await api.post('/school/student-fee-allocations/bulk-delete', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success('Selection permanently deleted');
        setSelectedItems(new Set());
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Bulk deletion failed');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      student_id: '',
      fee_structure_ids: [],
      fee_structure_id: '',
      discount_type: 'None',
      discount_amount: 0,
      scholarship_type: 'None',
      scholarship_amount: 0,
      transport_route_id: '',
      hostel_room_id: '',
      previous_balance: 0,
      fine_carry_forward: 0,
      opening_balance: 0,
      custom_amount: '',
      allocated_date: new Date().toISOString().split('T')[0],
      notes: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Allocation) => {
    setEditingItem(item);
    setFormData({
      student_id: item.student_id.toString(),
      fee_structure_ids: [item.fee_structure_id.toString()],
      fee_structure_id: item.fee_structure_id.toString(),
      discount_type: item.discount_type || 'None',
      discount_amount: item.discount_amount,
      scholarship_type: item.scholarship_type || 'None',
      scholarship_amount: item.scholarship_amount,
      transport_route_id: item.transport_route_id ? item.transport_route_id.toString() : '',
      hostel_room_id: item.hostel_room_id ? item.hostel_room_id.toString() : '',
      previous_balance: item.previous_balance,
      fine_carry_forward: item.fine_carry_forward,
      opening_balance: item.opening_balance,
      custom_amount: item.custom_amount !== null ? item.custom_amount.toString() : '',
      allocated_date: item.allocated_date || new Date().toISOString().split('T')[0],
      notes: item.notes || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      toast.error('Student must be selected');
      return;
    }

    const basePayload = {
      student_id: Number(formData.student_id),
      academic_year_id: filterAcademicYear ? parseInt(filterAcademicYear) : null,
      discount_type: formData.discount_type,
      discount_amount: Number(formData.discount_amount),
      scholarship_type: formData.scholarship_type,
      scholarship_amount: Number(formData.scholarship_amount),
      transport_route_id: formData.transport_route_id ? Number(formData.transport_route_id) : null,
      hostel_room_id: formData.hostel_room_id ? Number(formData.hostel_room_id) : null,
      previous_balance: Number(formData.previous_balance),
      fine_carry_forward: Number(formData.fine_carry_forward),
      opening_balance: Number(formData.opening_balance),
      custom_amount: formData.custom_amount !== '' ? Number(formData.custom_amount) : null,
      allocated_date: formData.allocated_date,
      notes: formData.notes,
      is_active: formData.is_active
    };

    try {
      if (editingItem) {
        // Edit Allocation
        const res = await api.put(`/school/student-fee-allocations/${editingItem.id}`, {
          ...basePayload,
          fee_structure_id: Number(formData.fee_structure_id)
        });
        if (res.data.success) {
          toast.success('Allocation updated');
          setIsModalOpen(false);
          fetchAllocations();
        }
      } else {
        // Create Multi Allocation
        if (formData.fee_structure_ids.length === 0) {
          toast.error('At least one fee head must be selected');
          return;
        }

        const res = await api.post('/school/student-fee-allocations/bulk-store', {
          student_ids: [Number(formData.student_id)],
          fee_structure_ids: formData.fee_structure_ids.map(Number),
          ...basePayload
        });

        if (res.data.success) {
          toast.success('Fee structure heads allocated successfully');
          setIsModalOpen(false);
          fetchAllocations();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  // Bulk Store Class setup
  const handleBulkAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkAllocForm.class_id || bulkAllocForm.fee_structure_ids.length === 0) {
      toast.error('Class and at least one fee head are required');
      return;
    }

    // Resolve student IDs in class
    const selectedStuds = students
      .filter(s => s.class_id.toString() === bulkAllocForm.class_id.toString())
      .map(s => s.value);

    if (selectedStuds.length === 0) {
      toast.error('No students found in the selected class');
      return;
    }

    try {
      const res = await api.post('/school/student-fee-allocations/bulk-store', {
        student_ids: selectedStuds,
        fee_structure_ids: bulkAllocForm.fee_structure_ids.map(Number),
        academic_year_id: filterAcademicYear ? parseInt(filterAcademicYear) : null,
        discount_type: bulkAllocForm.discount_type,
        discount_amount: Number(bulkAllocForm.discount_amount),
        scholarship_type: bulkAllocForm.scholarship_type,
        scholarship_amount: Number(bulkAllocForm.scholarship_amount),
        allocated_date: bulkAllocForm.allocated_date,
        notes: bulkAllocForm.notes,
        is_active: bulkAllocForm.is_active
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Bulk class fee heads allocated!');
        setIsBulkModalOpen(false);
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk class allocation failed');
    }
  };

  // Copy Previous Year
  const handleCopyYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyYearForm.from_year_id || !copyYearForm.to_year_id || copyYearForm.student_ids.length === 0) {
      toast.error('Academic Years and Student selection are required');
      return;
    }

    try {
      const res = await api.post('/school/student-fee-allocations/copy-previous', {
        from_academic_year_id: parseInt(copyYearForm.from_year_id),
        to_academic_year_id: parseInt(copyYearForm.to_year_id),
        student_ids: copyYearForm.student_ids.map(Number)
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Fees cloned successfully!');
        setIsCopyYearModalOpen(false);
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Clone action failed');
    }
  };

  // Promote Fee allocation
  const handlePromoteFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteForm.academic_year_id || !promoteForm.class_id || promoteForm.student_ids.length === 0) {
      toast.error('All fields are required to allocate promotion fee structures');
      return;
    }

    try {
      const res = await api.post('/school/student-fee-allocations/promote', {
        academic_year_id: parseInt(promoteForm.academic_year_id),
        student_ids: promoteForm.student_ids.map(Number),
        class_id: parseInt(promoteForm.class_id)
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Promotion fee assigned!');
        setIsPromoteModalOpen(false);
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion allocation failed');
    }
  };

  // Recalculate billing
  const handleRecalculate = async () => {
    const selectedStuds = allocations.map(a => a.student_id);
    if (selectedStuds.length === 0) return;

    try {
      const res = await api.post('/school/student-fee-allocations/recalculate', {
        student_ids: Array.from(new Set(selectedStuds))
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Net amounts recalculated');
        fetchAllocations();
      }
    } catch (error) {
      toast.error('Recalculation failed');
    }
  };

  // Import / Export
  const handleExport = () => {
    try {
      const dataToExport = filteredData.map((item) => ({
        'Student Name': item.student_name,
        'Admission Number': item.admission_number,
        'Roll Number': item.roll_number,
        'Class': item.class_name,
        'Fee Head': item.fee_head_label,
        'Base Amount (₹)': item.base_amount,
        'Discount Type': item.discount_type,
        'Discount Amount (₹)': item.discount_amount,
        'Scholarship Type': item.scholarship_type,
        'Scholarship Amount (₹)': item.scholarship_amount,
        'Previous Balance (₹)': item.previous_balance,
        'Carry Fine (₹)': item.fine_carry_forward,
        'Opening Balance (₹)': item.opening_balance,
        'Net Amount (₹)': item.net_amount,
        'Frequency': item.frequency_label,
        'Date': item.allocated_date,
        'Status': item.is_active ? 'Active' : 'Inactive',
        'Notes': item.notes
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Fee Allocations');
      XLSX.writeFile(wb, `Student_Fee_Allocations_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export allocations');
    }
  };

  const downloadSampleFile = () => {
    const sampleRows = [
      {
        'admission_number': 'STD-00213',
        'class_name': 'Class 10',
        'fee_head_label': 'Tuition Fee',
        'discount_type': 'Sibling Discount',
        'discount_amount': 200.00,
        'scholarship_type': 'Sport Scholarship',
        'scholarship_amount': 150.00,
        'previous_balance': 0.00,
        'fine_carry_forward': 50.00,
        'opening_balance': 0.00,
        'custom_amount': '',
        'allocated_date': '2026-07-01',
        'notes': 'Sibling discount + Sports quota applied',
        'is_active': 'yes'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Allocations');
    XLSX.writeFile(wb, 'student_fee_allocations_sample.xlsx');
    toast.success('Sample Excel file downloaded');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws);

        if (rawRows.length === 0) {
          toast.error('No rows found inside Excel sheet');
          return;
        }

        setImportData(rawRows);
        setImportPreview(rawRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/school/student-fee-allocations/bulk-import', {
        data: importData,
        academic_year_id: filterAcademicYear ? parseInt(filterAcademicYear) : null
      });

      if (response.data.success) {
        toast.success(`Import complete! Imported: ${response.data.imported_count}, Failed: ${response.data.error_count}`);
        setIsImportModalOpen(false);
        fetchAllocations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Real-time invoice previews calculation
  const calculateFormTotal = () => {
    let totalBase = 0;

    if (editingItem) {
      const matched = feeStructures.find(s => s.value.toString() === formData.fee_structure_id);
      totalBase = matched ? matched.amount : 0;
    } else {
      totalBase = formData.fee_structure_ids.reduce((sum, currentId) => {
        const matched = feeStructures.find(s => s.value.toString() === currentId);
        return sum + (matched ? matched.amount : 0);
      }, 0);
    }

    if (formData.custom_amount !== '') {
      return parseFloat(formData.custom_amount);
    }

    const transportFare = formData.transport_route_id
      ? (transportRoutes.find(r => r.value.toString() === formData.transport_route_id)?.fare || 0)
      : 0;

    const discountVal = Number(formData.discount_amount);
    const scholarshipVal = Number(formData.scholarship_amount);
    const prevVal = Number(formData.previous_balance);
    const fineVal = Number(formData.fine_carry_forward);
    const openingVal = Number(formData.opening_balance);

    return (totalBase + transportFare - discountVal - scholarshipVal + prevVal + fineVal + openingVal);
  };

  const calculateBulkFormTotal = () => {
    let totalBase = bulkAllocForm.fee_structure_ids.reduce((sum, currentId) => {
      const matched = feeStructures.find(s => s.value.toString() === currentId);
      return sum + (matched ? matched.amount : 0) * bulkAllocForm.student_ids.length;
    }, 0);

    const discountVal = Number(bulkAllocForm.discount_amount) * bulkAllocForm.student_ids.length;
    const scholarshipVal = Number(bulkAllocForm.scholarship_amount) * bulkAllocForm.student_ids.length;

    return Math.max(0, totalBase - discountVal - scholarshipVal);
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalAllocatedVolume = filteredData.reduce((sum, item) => sum + item.net_amount, 0);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Student Fee Allocation Desk</h1>
            <p className="text-[10px] text-gray-500">Create, customize, waive, and assign individual billing structures, opening balances, carry-forward fines, transport routes, and hostel details.</p>
          </div>
        </div>

        {/* Global Selects */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
          <span className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">Academic Year:</span>
          <select
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            className="px-2 py-0.5 text-xs border border-gray-300 rounded font-semibold text-gray-800 focus:outline-none bg-white cursor-pointer"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Allocations</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{filteredData.length}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Allocations</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">{filteredData.filter(a => a.is_active).length}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Waivers/Discounts</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">
              ₹{filteredData.reduce((sum, a) => sum + a.discount_amount + a.scholarship_amount, 0).toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Net Amount Allocated</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">₹{totalAllocatedVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Allocate Fee */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search student or fee head..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Show Trashed Toggle */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-gray-700 font-bold select-none text-[10px] uppercase tracking-wider">Show Trashed</span>
              <button
                type="button"
                onClick={() => setViewTrash(prev => !prev)}
                className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${viewTrash ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'
                    }`}
                />
              </button>
            </div>

            {/* Pagination select */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">SHOW:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={25}>25 Rows</option>
                <option value={50}>50 Rows</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {/* Action Buttons: Sample, Import, Export, + Allocate Fee */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleFile}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Sample
            </button>

            <label className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition cursor-pointer font-bold shadow-xs text-xs">
              Import
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Export
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Allocate Fee</span>
            </button>
          </div>
        </div>

        {/* Row 2: Class Filter & Wizard Batch Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter & Tools:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleRecalculate}
              className="flex items-center gap-1 px-2.5 py-1 border border-indigo-200 text-indigo-750 bg-indigo-50/40 rounded-lg hover:bg-indigo-100 transition font-bold text-xs"
              title="Recalculate Dynamic Net Payable amounts"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
              Recalculate
            </button>

            <button
              onClick={() => setIsCopyYearModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Copy Previous Year
            </button>

            <button
              onClick={() => setIsPromoteModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Promote Setup
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Bulk Assign
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions Context Menu panel */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2.5 rounded-lg text-blue-750 shadow-xs animate-fadeIn">
          <span className="font-bold">{selectedItems.size} allocation(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate(true)}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-green-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-gray-500"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={handleBulkTrash}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-indigo-700"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-rose-50 border border-rose-250 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-bold text-[10px]"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Grid Table view */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px]">
              <th className="py-2 px-2.5 w-8">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every((item) => selectedItems.has(item.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition text-[10px] font-bold text-gray-750" onClick={() => handleSort('student_name')}>
                <div className="flex items-center gap-0.5">STUDENT DETAILS {getSortIcon('student_name')}</div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition text-[10px] font-bold text-gray-750" onClick={() => handleSort('class_name')}>
                <div className="flex items-center gap-0.5">CLASS {getSortIcon('class_name')}</div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition text-[10px] font-bold text-gray-750" onClick={() => handleSort('fee_head_label')}>
                <div className="flex items-center gap-0.5">FEE HEAD {getSortIcon('fee_head_label')}</div>
              </th>
              <th className="py-2 px-2.5 text-right font-bold text-gray-750">BASE RATE</th>
              <th className="py-2 px-2.5 text-right font-bold text-gray-750">DISCOUNTS</th>
              <th className="py-2 px-2.5 text-right font-bold text-gray-750">SCHOLARSHIPS</th>
              <th className="py-2 px-2.5 text-right font-bold text-gray-755 bg-indigo-50/20">BAL / FINES</th>
              <th className="py-2 px-2.5 text-right font-bold text-indigo-750 bg-indigo-50/50">NET PAYABLE</th>
              <th className="py-2 px-2.5 font-bold text-gray-750">FREQUENCY</th>
              {!viewTrash && (
                <th className="py-2 px-2.5 text-center w-28 text-[10px] font-bold text-gray-750">BILLING</th>
              )}
              <th className="py-2 px-2.5 w-24 text-center text-[10px] font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 11 : 12} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading allocations schedule...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 11 : 12} className="py-8 text-center text-gray-400 font-medium font-semibold">
                  {viewTrash ? 'Trash bin is empty' : 'No student fee allocations found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                  <td className="py-2 px-2.5">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <div className="font-bold text-gray-900">{item.student_name}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-semibold">Adm: {item.admission_number} | Roll: {item.roll_number || 'N/A'}</div>
                  </td>
                  <td className="py-2 px-2.5 font-semibold text-gray-800">{item.class_name}</td>
                  <td className="py-2 px-2.5">
                    <div className="font-medium text-gray-900">{item.fee_head_label}</div>
                    {item.notes && <div className="text-[9px] text-gray-400 italic max-w-xs truncate">{item.notes}</div>}
                  </td>
                  <td className="py-2 px-2.5 text-right text-gray-500 font-semibold">₹{item.base_amount.toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right text-amber-700 font-semibold">
                    {item.discount_amount > 0 ? (
                      <div>
                        <div>-₹{item.discount_amount.toFixed(2)}</div>
                        <div className="text-[8px] text-amber-600 font-normal">({item.discount_type})</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2.5 text-right text-teal-700 font-semibold">
                    {item.scholarship_amount > 0 ? (
                      <div>
                        <div>-₹{item.scholarship_amount.toFixed(2)}</div>
                        <div className="text-[8px] text-teal-600 font-normal">({item.scholarship_type})</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2.5 text-right text-rose-700 bg-indigo-50/10">
                    {(item.previous_balance + item.fine_carry_forward + item.opening_balance) > 0 ? (
                      <div>
                        <div className="font-semibold">+₹{(item.previous_balance + item.fine_carry_forward + item.opening_balance).toFixed(2)}</div>
                        <div className="text-[7.5px] text-rose-500 font-normal">
                          (Bal: {item.previous_balance} | Fine: {item.fine_carry_forward})
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2.5 text-right text-indigo-700 font-black bg-indigo-50/20 text-sm">
                    ₹{item.net_amount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2.5">
                    <span className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-700 font-bold rounded-full">{item.frequency_label}</span>
                  </td>
                  {!viewTrash && (
                    <td className="py-2 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ToggleSwitch checked={item.is_active} onChange={() => handleToggleStatus(item.id)} />
                        <span className={`text-[9px] font-bold ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.is_active ? 'Billing' : 'Stopped'}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="py-2 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {!viewTrash ? (
                        <>
                          <button onClick={() => openEditModal(item)} className="p-1 text-indigo-650 hover:bg-indigo-50 rounded transition" title="Modify allocation">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(item.id, item.student_name)} className="p-1 text-rose-600 hover:bg-rose-50 rounded transition" title="Move to trash">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-750 font-bold rounded text-[9px] hover:bg-indigo-100 transition"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleForceDelete(item.id, item.student_name)}
                            className="p-1 text-red-650 hover:bg-rose-50 rounded transition"
                            title="Delete Permanently"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control panel */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-white px-4 py-2.5 text-xs shadow-xs">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">
                Showing page <span className="font-semibold text-indigo-650">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span> ({filteredData.length} records)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  « First
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  if (Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`relative inline-flex items-center border px-3 py-1 text-xs font-semibold transition cursor-pointer ${currentPage === pNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-650'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Last »
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 flex flex-col max-h-[94vh] overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">{editingItem ? 'Edit Student Billing Allocation' : 'Create Student Personal Fee Record'}</h3>
                  <p className="text-[10px] text-gray-500">Configure personal pricing rates, waiver models, transport fares and previous balances.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full border border-gray-200 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Row split: Left Inputs, Right Dynamic Preview Card */}
            <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                <form onSubmit={handleSubmitForm} className="lg:col-span-7 space-y-2.5 bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-xs">
                  {/* 1. Student Select & Allocated Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Select Student:</label>
                      <Select
                        options={students}
                        isDisabled={!!editingItem}
                        value={students.find(s => s.value.toString() === formData.student_id)}
                        onChange={(selected: any) => {
                          setFormData({
                            ...formData,
                            student_id: selected ? selected.value.toString() : '',
                            fee_structure_ids: [],
                            fee_structure_id: '',
                            transport_route_id: '',
                            hostel_room_id: ''
                          });
                        }}
                        placeholder="Search name or admission number..."
                        menuPortalTarget={document.body}
                        styles={{
                          control: (base) => ({
                            ...base,
                            fontSize: '11px',
                            borderColor: '#d1d5db',
                            borderRadius: '6px',
                            minHeight: '30px',
                            boxShadow: 'none',
                            '&:hover': { borderColor: '#9ca3af' }
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Allocated Date:</label>
                      <input
                        type="date"
                        value={formData.allocated_date}
                        onChange={(e) => setFormData({ ...formData, allocated_date: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-[10.5px] focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* 2. Fee Structure Checkboxes Grid / Class heads select */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">
                      {editingItem ? 'Assigned Fee Structure Head:' : 'Select Fee Structure Heads to Allocate:'}
                    </label>
                    {!formData.student_id ? (
                      <div className="p-2 bg-gray-50 border border-dashed rounded-lg text-center text-gray-400 text-[10px]">
                        Select a student first to load their class-wise fee heads.
                      </div>
                    ) : editingItem ? (
                      <select
                        value={formData.fee_structure_id}
                        onChange={(e) => setFormData({ ...formData, fee_structure_id: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md font-semibold text-gray-700 bg-white cursor-not-allowed text-[10.5px]"
                        disabled
                      >
                        {feeStructures.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-gray-200 rounded-lg p-1.5 max-h-24 overflow-y-auto bg-gray-50/80">
                        {getAvailableStructures(formData.student_id).map((struct) => (
                          <label key={struct.value} className="flex items-start gap-1.5 bg-white p-1 rounded-md border border-gray-200 hover:bg-slate-50 transition cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={formData.fee_structure_ids.includes(struct.value.toString())}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  fee_structure_ids: checked
                                    ? [...prev.fee_structure_ids, struct.value.toString()]
                                    : prev.fee_structure_ids.filter(id => id !== struct.value.toString())
                                }));
                              }}
                              className="rounded border-gray-300 text-indigo-650 w-3.5 h-3.5 mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-gray-800 text-[10px]">{struct.fee_head_label}</span>
                              <span className="block text-[8.5px] text-indigo-700 font-semibold">₹{struct.amount.toFixed(2)} ({struct.frequency_label})</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Transport & Hostel Allocation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Assign Transport Route:</label>
                      <select
                        value={formData.transport_route_id}
                        onChange={(e) => setFormData({ ...formData, transport_route_id: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-[10.5px]"
                      >
                        <option value="">No Transport Route</option>
                        {transportRoutes.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Assign Hostel Room:</label>
                      <select
                        value={formData.hostel_room_id}
                        onChange={(e) => setFormData({ ...formData, hostel_room_id: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-[10.5px]"
                      >
                        <option value="">No Hostel Room</option>
                        <option value="1">Room 101 (Triple Bed - Non AC)</option>
                        <option value="2">Room 102 (Double Bed - AC)</option>
                        <option value="3">Room 203 (Single Bed - AC Premium)</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Discount & Scholarship Side-by-Side Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/70 border border-gray-200 p-2 rounded-lg">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Discount Type:</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-md bg-white text-[10px]"
                      >
                        <option value="None">No Discount</option>
                        <option value="Sibling Discount">Sibling Discount</option>
                        <option value="Employee Child">Employee Child</option>
                        <option value="Management Discount">Management</option>
                        <option value="Special Discount">Special</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Discount (₹):</label>
                      <input
                        type="number"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-md font-bold text-amber-700 text-[10px] bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Scholarship Type:</label>
                      <select
                        value={formData.scholarship_type}
                        onChange={(e) => setFormData({ ...formData, scholarship_type: e.target.value })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-md bg-white text-[10px]"
                      >
                        <option value="None">No Scholarship</option>
                        <option value="Merit Scholarship">Merit</option>
                        <option value="Sport Scholarship">Sport</option>
                        <option value="EWS Waiver">EWS Waiver</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Scholarship (₹):</label>
                      <input
                        type="number"
                        value={formData.scholarship_amount}
                        onChange={(e) => setFormData({ ...formData, scholarship_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-md font-bold text-teal-700 text-[10px] bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* 5. Balances & Custom Override Grid */}
                  <div className="grid grid-cols-4 gap-2 border border-gray-200 p-2 rounded-lg bg-slate-50/60">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Prev Balance:</label>
                      <input
                        type="number"
                        value={formData.previous_balance}
                        onChange={(e) => setFormData({ ...formData, previous_balance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 text-[10px] border border-gray-300 rounded bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Carry Fine:</label>
                      <input
                        type="number"
                        value={formData.fine_carry_forward}
                        onChange={(e) => setFormData({ ...formData, fine_carry_forward: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 text-[10px] border border-gray-300 rounded bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Opening Bal:</label>
                      <input
                        type="number"
                        value={formData.opening_balance}
                        onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 text-[10px] border border-gray-300 rounded bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Custom Override:</label>
                      <input
                        type="number"
                        value={formData.custom_amount}
                        onChange={(e) => setFormData({ ...formData, custom_amount: e.target.value })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-indigo-700 font-bold text-[10px] bg-white"
                        placeholder="Override"
                      />
                    </div>
                  </div>

                  {/* 6. Remarks & Active Toggle Switch */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-[10.5px] focus:outline-none"
                        placeholder="Remarks / Justification notes..."
                      />
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <ToggleSwitch checked={formData.is_active} onChange={() => setFormData({ ...formData, is_active: !formData.is_active })} />
                      <span className="font-bold text-gray-700 text-[10px]">Active Status</span>
                    </div>
                  </div>
                </form>

                {/* Right side: Dynamic Invoice Billing receipt schedule mockup */}
                <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-xl p-3.5 shadow-xl flex flex-col justify-between border border-indigo-900 self-stretch">
                  <div>
                    <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2.5 mb-3">
                      <div>
                        <h4 className="font-black text-[11px] uppercase tracking-wide">personal fee schedule</h4>
                        <p className="text-[9px] text-indigo-300 mt-0.5">Live configuration calculated totals</p>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded uppercase tracking-wider">draft mockup</span>
                    </div>

                    {/* Student profile preview */}
                    {formData.student_id ? (
                      <div className="mb-3 bg-indigo-900/50 p-2 rounded-lg border border-indigo-800/80">
                        <div className="font-bold text-[11px] text-indigo-100">
                          {students.find(s => s.value.toString() === formData.student_id)?.label}
                        </div>
                        <div className="text-[9px] text-indigo-300 uppercase mt-0.5">
                          Class: {students.find(s => s.value.toString() === formData.student_id)?.class_name}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 bg-indigo-900/30 p-3 rounded-lg text-center text-indigo-300 italic text-[10px] border border-dashed border-indigo-800">
                        Select a student to load billing docket profile
                      </div>
                    )}

                    {/* Fee Head details checklist */}
                    <h5 className="font-bold text-[9px] uppercase text-indigo-300 tracking-wider mb-1.5">Assigned Heads Breakdown</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto mb-3 pr-1">
                      {editingItem ? (
                        (() => {
                          const matched = feeStructures.find(s => s.value.toString() === formData.fee_structure_id);
                          return matched ? (
                            <div className="flex items-center justify-between text-[10.5px] border-b border-indigo-850/50 pb-1">
                              <span className="font-medium">{matched.fee_head_label}</span>
                              <span className="font-bold">₹{matched.amount.toFixed(2)}</span>
                            </div>
                          ) : null;
                        })()
                      ) : formData.fee_structure_ids.length > 0 ? (
                        formData.fee_structure_ids.map(id => {
                          const matched = feeStructures.find(s => s.value.toString() === id);
                          return matched ? (
                            <div key={id} className="flex items-center justify-between text-[10.5px] border-b border-indigo-850/50 pb-1">
                              <span className="font-medium text-indigo-100">{matched.fee_head_label}</span>
                              <span className="font-bold">₹{matched.amount.toFixed(2)}</span>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <div className="text-indigo-400 italic text-[10px] text-center">No fee heads selected</div>
                      )}

                      {/* Transport Route mock addition */}
                      {formData.transport_route_id && (
                        <div className="flex items-center justify-between text-[10.5px] text-indigo-200 border-b border-indigo-850/50 pb-1 italic">
                          <span>Transport Fare ({transportRoutes.find(r => r.value.toString() === formData.transport_route_id)?.label})</span>
                          <span className="font-bold">+₹{(transportRoutes.find(r => r.value.toString() === formData.transport_route_id)?.fare || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Discount / Scholarship calculations */}
                    {(Number(formData.discount_amount) > 0 || Number(formData.scholarship_amount) > 0 || Number(formData.previous_balance) > 0 || Number(formData.fine_carry_forward) > 0 || Number(formData.opening_balance) > 0) && (
                      <div className="bg-indigo-900/60 p-2 rounded-lg border border-indigo-850 space-y-1 text-[10px]">
                        {Number(formData.discount_amount) > 0 && (
                          <div className="flex justify-between text-amber-300 font-bold">
                            <span>Discount Applied ({formData.discount_type})</span>
                            <span>-₹{Number(formData.discount_amount).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(formData.scholarship_amount) > 0 && (
                          <div className="flex justify-between text-teal-300 font-bold">
                            <span>Scholarship ({formData.scholarship_type})</span>
                            <span>-₹{Number(formData.scholarship_amount).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(formData.previous_balance) > 0 && (
                          <div className="flex justify-between text-rose-300">
                            <span>Previous Balance</span>
                            <span>+₹{Number(formData.previous_balance).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(formData.fine_carry_forward) > 0 && (
                          <div className="flex justify-between text-rose-300">
                            <span>Fines Carry Forward</span>
                            <span>+₹{Number(formData.fine_carry_forward).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(formData.opening_balance) > 0 && (
                          <div className="flex justify-between text-rose-200">
                            <span>Opening Balance Credit</span>
                            <span>+₹{Number(formData.opening_balance).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Final calculated total net billing */}
                  <div className="mt-3 pt-2.5 border-t border-indigo-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold tracking-wider text-indigo-300">Total Net Amount Payable</span>
                        {formData.custom_amount !== '' && <span className="block text-[8px] text-amber-300 uppercase font-semibold mt-0.5">Custom Override Active</span>}
                      </div>
                      <span className="text-xl font-black text-indigo-100">
                        ₹{calculateFormTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-150 flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitForm}
                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs shadow-md transition"
              >
                {editingItem ? 'Save Updates' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Setup Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-150 flex flex-col max-h-[85vh] animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/20">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bulk Fee Class Setup Allocation</h3>
                <p className="text-[10px] text-gray-500">Allocate selected fee structures to ALL students of a class simultaneously.</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBulkAllocation} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Target Class:</label>
                <select
                  value={bulkAllocForm.class_id}
                  onChange={(e) => {
                    const classVal = e.target.value;
                    // Auto select all students inside the class
                    const classStuds = students.filter(s => s.class_id.toString() === classVal.toString()).map(s => s.value.toString());
                    setBulkAllocForm({
                      ...bulkAllocForm,
                      class_id: classVal,
                      student_ids: classStuds,
                      fee_structure_ids: []
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:outline-none"
                >
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {bulkAllocForm.class_id && (
                  <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                    Found {bulkAllocForm.student_ids.length} student(s) enrolled in this class.
                  </span>
                )}
              </div>

              {/* Checkbox list for fee structures available for this class */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Fee Structures to Allocate:</label>
                {!bulkAllocForm.class_id ? (
                  <div className="p-3 bg-gray-50 border border-dashed rounded text-center text-gray-400">
                    Please select a target class first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-250 rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
                    {feeStructures.filter(s => s.class_id.toString() === bulkAllocForm.class_id.toString()).map(struct => (
                      <label key={struct.value} className="flex items-start gap-2 bg-white p-2 rounded border hover:bg-slate-50 transition cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bulkAllocForm.fee_structure_ids.includes(struct.value.toString())}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBulkAllocForm(prev => ({
                              ...prev,
                              fee_structure_ids: checked
                                ? [...prev.fee_structure_ids, struct.value.toString()]
                                : prev.fee_structure_ids.filter(id => id !== struct.value.toString())
                            }));
                          }}
                          className="rounded border-gray-300 text-indigo-650 w-3.5 h-3.5 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-gray-800">{struct.fee_head_label}</span>
                          <span className="block text-[9px] text-indigo-700 font-semibold">₹{struct.amount.toFixed(2)} ({struct.frequency_label})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Discounts & Waivers for bulk allocation */}
              <div className="grid grid-cols-2 gap-3 bg-amber-50/20 border border-amber-250 p-2.5 rounded-lg">
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Bulk Discount Type:</label>
                  <select
                    value={bulkAllocForm.discount_type}
                    onChange={(e) => setBulkAllocForm({ ...bulkAllocForm, discount_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white"
                  >
                    <option value="None">No Discount</option>
                    <option value="Sibling Discount">Sibling Discount</option>
                    <option value="Employee Child">Employee Child</option>
                    <option value="Management Discount">Management Discount</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Discount Per Student (₹):</label>
                  <input
                    type="number"
                    value={bulkAllocForm.discount_amount}
                    onChange={(e) => setBulkAllocForm({ ...bulkAllocForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-teal-50/20 border border-teal-250 p-2.5 rounded-lg">
                <div>
                  <label className="font-bold text-teal-900 block mb-1">Bulk Scholarship Type:</label>
                  <select
                    value={bulkAllocForm.scholarship_type}
                    onChange={(e) => setBulkAllocForm({ ...bulkAllocForm, scholarship_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-teal-300 rounded bg-white"
                  >
                    <option value="None">No Scholarship</option>
                    <option value="Merit Scholarship">Merit Scholarship</option>
                    <option value="Sport Scholarship">Sport Scholarship</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-teal-900 block mb-1">Scholarship Amount Per Student (₹):</label>
                  <input
                    type="number"
                    value={bulkAllocForm.scholarship_amount}
                    onChange={(e) => setBulkAllocForm({ ...bulkAllocForm, scholarship_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-teal-300 rounded"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                <span className="font-bold text-slate-700">Estimated Total Gross Allocation:</span>
                <span className="font-black text-indigo-750 text-sm">₹{calculateBulkFormTotal().toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-black shadow-md"
                >
                  Confirm Bulk Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Previous Year Fee Modal */}
      {isCopyYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-150 flex flex-col animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/20">
              <h3 className="text-sm font-bold text-gray-900">Copy Previous Year Fee Allocation</h3>
              <button onClick={() => setIsCopyYearModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCopyYear} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Source Year:</label>
                  <select
                    value={copyYearForm.from_year_id}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, from_year_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="">Select year...</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Target Year:</label>
                  <select
                    value={copyYearForm.to_year_id}
                    onChange={(e) => setCopyYearForm({ ...copyYearForm, to_year_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="">Select year...</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Student(s) to Copy:</label>
                <Select
                  options={students}
                  isMulti
                  onChange={(selected: any) => {
                    setCopyYearForm({
                      ...copyYearForm,
                      student_ids: selected ? selected.map((item: any) => item.value.toString()) : []
                    });
                  }}
                  placeholder="Select one or multiple students..."
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({ ...base, fontSize: '11px' }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsCopyYearModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold shadow-sm"
                >
                  Start Cloning Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Class Fee Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-150 flex flex-col animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/20">
              <h3 className="text-sm font-bold text-gray-900">Promoted Class Fee Setup</h3>
              <button onClick={() => setIsPromoteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePromoteFee} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Class (Promoted To):</label>
                <select
                  value={promoteForm.class_id}
                  onChange={(e) => setPromoteForm({ ...promoteForm, class_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                >
                  <option value="">Select destination class...</option>
                  {classes.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Promoted Student(s):</label>
                <Select
                  options={students}
                  isMulti
                  onChange={(selected: any) => {
                    setPromoteForm({
                      ...promoteForm,
                      student_ids: selected ? selected.map((item: any) => item.value.toString()) : []
                    });
                  }}
                  placeholder="Select promoted students..."
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({ ...base, fontSize: '11px' }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold shadow-sm"
                >
                  Allocate Promotion Fees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/45 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Excel Sheet Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing first 5 rows before importing payload to database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Admission Number</th>
                    <th className="px-3 py-2 border">Class Name</th>
                    <th className="px-3 py-2 border">Fee Head</th>
                    <th className="px-3 py-2 border text-right">Discount Type</th>
                    <th className="px-3 py-2 border text-right">Discount (₹)</th>
                    <th className="px-3 py-2 border text-right">Scholarship Type</th>
                    <th className="px-3 py-2 border text-right">Scholarship (₹)</th>
                    <th className="px-3 py-2 border text-right">Prev Balance (₹)</th>
                    <th className="px-3 py-2 border text-right">Carry Fine (₹)</th>
                    <th className="px-3 py-2 border text-right">Opening Bal (₹)</th>
                    <th className="px-3 py-2 border">Allocated Date</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-semibold">{row.admission_number || '-'}</td>
                      <td className="px-3 py-2 border font-bold">{row.class_name || '-'}</td>
                      <td className="px-3 py-2 border">{row.fee_head_label || '-'}</td>
                      <td className="px-3 py-2 border text-right">{row.discount_type || 'None'}</td>
                      <td className="px-3 py-2 border text-right text-amber-700">-₹{parseFloat(row.discount_amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border text-right">{row.scholarship_type || 'None'}</td>
                      <td className="px-3 py-2 border text-right text-teal-700">-₹{parseFloat(row.scholarship_amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border text-right">₹{parseFloat(row.previous_balance || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border text-right text-rose-650">₹{parseFloat(row.fine_carry_forward || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border text-right">₹{parseFloat(row.opening_balance || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border">{row.allocated_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button
                type="button"
                disabled={importing}
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={processImport}
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold shadow-sm"
              >
                {importing ? 'Importing file...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
