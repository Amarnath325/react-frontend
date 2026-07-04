import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { 
  Search, Plus, Edit2, Trash2, RotateCcw, 
  DollarSign, CheckCircle, Clock, AlertTriangle, 
  X, Info, Landmark
} from 'lucide-react';

// Type definitions matching Laravel backend models
interface StudentDetails {
  id: number;
  class_id: number;
  user?: {
    first_name: string;
    last_name: string;
    full_name: string;
  };
  admission_number: string;
  roll_number: string | null;
}

interface MasterClass {
  m_id: number;
  m_name: string;
  m_alias_name: string | null;
}

interface RouteItem {
  id: number;
  route_name: string;
  route_code: string;
  amount: number;
}

interface StudentAllocationMaster {
  student_id: number;
  student_name: string;
  admission_number: string;
  class_id: number;
  class_name: string;
  route_id: number;
  route_name: string;
  monthly_fee: number;
}

interface FeePayment {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  student_id: number;
  class_id: number;
  route_id: number;
  fee_month: string;
  amount: string | number;
  paid_amount: string | number;
  payment_mode: string;
  payment_date: string | null;
  receipt_number: string | null;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  remarks: string | null;
  created_at?: string;
  updated_at?: string;
  student?: StudentDetails;
  class?: MasterClass;
  route?: RouteItem;
}

// React Select Styling
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 10px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '32px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '12px',
    padding: '6px 10px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};

const TransportFeeManager: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'all' | 'Paid' | 'Pending' | 'Overdue' | 'structure'>('all');

  // Master lists for Dropdowns
  const [allocations, setAllocations] = useState<StudentAllocationMaster[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [classes, setClasses] = useState<MasterClass[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  
  // Data list and filter states
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [stats, setStats] = useState({ all: 0, paid: 0, pending: 0, overdue: 0, structure: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filters toolbar states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeePayment | null>(null);
  const [editingStructureRoute, setEditingStructureRoute] = useState<RouteItem | null>(null);

  // Fee Form State
  const [formData, setFormData] = useState({
    student_id: '',
    fee_month: '',
    amount: '',
    paid_amount: '',
    payment_mode: 'Cash',
    payment_date: '',
    receipt_number: '',
    status: 'Pending' as 'Paid' | 'Pending' | 'Overdue' | 'Partial',
    remarks: '',
  });

  // Derived student allocation values for Form
  const [selectedStudentAlloc, setSelectedStudentAlloc] = useState<StudentAllocationMaster | null>(null);

  // Structure Form State (Route Standard Fare)
  const [structureAmount, setStructureAmount] = useState('');

  // Load masters on mount
  useEffect(() => {
    fetchMasters();
  }, []);

  // Fetch payments list and statistics whenever filters or active tabs change
  useEffect(() => {
    if (activeTab !== 'structure') {
      fetchPayments();
    } else {
      fetchStructureRoutes();
    }
  }, [activeTab, selectedRouteFilter, selectedMonthFilter]);

  // Handle Search Trigger
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchPayments();
    }
  };

  const fetchMasters = async () => {
    try {
      const res = await api.get('/school/transport-fees/masters');
      if (res.data.success) {
        const d = res.data.data;
        setAllocations(d.allocations || []);
        setRoutes(d.routes || []);
        setClasses(d.classes || []);
        setMonths(d.months || []);
      }
    } catch (err) {
      console.error('Error loading masters data:', err);
      toast.error('Failed to load dropdown option masters');
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedRouteFilter) params.route_id = selectedRouteFilter;
      if (selectedMonthFilter) params.fee_month = selectedMonthFilter;
      if (activeTab !== 'all') params.status = activeTab;

      const res = await api.get('/school/transport-fees', { params });
      if (res.data.success) {
        setPayments(res.data.data || []);
        setStats(res.data.stats || { all: 0, paid: 0, pending: 0, overdue: 0, structure: 0 });
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load transport fee payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStructureRoutes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/transport-fees/structure');
      if (res.data.success) {
        setRoutes(res.data.data || []);
        // Refresh counts
        const statsRes = await api.get('/school/transport-fees', { params: { limit: 1 } });
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching routes structure:', err);
      toast.error('Failed to load route fares');
    } finally {
      setLoading(false);
    }
  };

  // Prepopulate form fields on Student Selection
  const handleStudentSelect = (studentIdStr: string) => {
    const alloc = allocations.find(a => String(a.student_id) === studentIdStr);
    if (alloc) {
      setSelectedStudentAlloc(alloc);
      setFormData(prev => {
        const amt = String(alloc.monthly_fee);
        
        // Auto-calculate status depending on paid amount
        const paidAmt = prev.paid_amount || '0';
        let autoStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partial' = 'Pending';
        if (parseFloat(paidAmt) >= parseFloat(amt)) {
          autoStatus = 'Paid';
        } else if (parseFloat(paidAmt) > 0) {
          autoStatus = 'Partial';
        }

        return {
          ...prev,
          student_id: studentIdStr,
          amount: amt,
          status: autoStatus
        };
      });
    } else {
      setSelectedStudentAlloc(null);
      setFormData(prev => ({
        ...prev,
        student_id: studentIdStr
      }));
    }
  };

  // Watch Paid Amount changes to auto-adjust status
  const handlePaidAmountChange = (valStr: string) => {
    setFormData(prev => {
      const amt = parseFloat(prev.amount || '0');
      const paid = parseFloat(valStr || '0');
      
      let autoStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partial' = 'Pending';
      if (paid >= amt && amt > 0) {
        autoStatus = 'Paid';
      } else if (paid > 0) {
        autoStatus = 'Partial';
      }

      return {
        ...prev,
        paid_amount: valStr,
        status: autoStatus
      };
    });
  };

  // Watch Total Amount changes to auto-adjust status
  const handleAmountChange = (valStr: string) => {
    setFormData(prev => {
      const amt = parseFloat(valStr || '0');
      const paid = parseFloat(prev.paid_amount || '0');
      
      let autoStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partial' = 'Pending';
      if (paid >= amt && amt > 0) {
        autoStatus = 'Paid';
      } else if (paid > 0) {
        autoStatus = 'Partial';
      }

      return {
        ...prev,
        amount: valStr,
        status: autoStatus
      };
    });
  };

  // Form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedStudentAlloc(null);
    
    // Default fee month to current month if listed
    const currentMonth = months.length > 0 ? months[5] || months[0] : ''; // mid year or first month

    setFormData({
      student_id: '',
      fee_month: currentMonth,
      amount: '',
      paid_amount: '0',
      payment_mode: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: '',
      status: 'Pending',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeePayment) => {
    setEditingItem(item);
    
    // Find allocation info for the editing student
    const alloc = allocations.find(a => a.student_id === item.student_id);
    if (alloc) {
      setSelectedStudentAlloc(alloc);
    } else {
      setSelectedStudentAlloc(null);
    }

    setFormData({
      student_id: String(item.student_id),
      fee_month: item.fee_month,
      amount: String(item.amount),
      paid_amount: String(item.paid_amount),
      payment_mode: item.payment_mode,
      payment_date: item.payment_date || '',
      receipt_number: item.receipt_number || '',
      status: item.status,
      remarks: item.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.fee_month) {
      toast.error('Please select a fee month');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) < 0) {
      toast.error('Amount must be positive');
      return;
    }
    if (!formData.paid_amount || parseFloat(formData.paid_amount) < 0) {
      toast.error('Paid amount must be positive');
      return;
    }

    // Double validation: Paid status requires paid amount to equal amount
    if (formData.status === 'Paid' && parseFloat(formData.paid_amount) < parseFloat(formData.amount)) {
      if (!window.confirm('The paid amount is less than the total monthly fare. Do you still want to mark it as fully Paid?')) {
        return;
      }
    }

    const payload = {
      student_id: parseInt(formData.student_id),
      fee_month: formData.fee_month,
      amount: parseFloat(formData.amount),
      paid_amount: parseFloat(formData.paid_amount),
      payment_mode: formData.payment_mode,
      payment_date: formData.payment_date || null,
      receipt_number: formData.receipt_number || null,
      status: formData.status,
      remarks: formData.remarks || null,
    };

    try {
      if (editingItem) {
        const res = await api.put(`/school/transport-fees/${editingItem.id}`, payload);
        if (res.data.success) {
          toast.success('Fee record updated successfully');
          setIsModalOpen(false);
          fetchPayments();
        }
      } else {
        const res = await api.post('/school/transport-fees', payload);
        if (res.data.success) {
          toast.success('Fee payment recorded successfully');
          setIsModalOpen(false);
          fetchPayments();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save fee record';
      toast.error(msg);
    }
  };

  const handleDelete = async (item: FeePayment) => {
    const studentName = item.student?.user?.full_name || 'Selected student';
    if (window.confirm(`Are you sure you want to delete the transport fee payment of "${studentName}" for ${item.fee_month}?`)) {
      try {
        const res = await api.delete(`/school/transport-fees/${item.id}`);
        if (res.data.success) {
          toast.success('Payment record deleted successfully');
          fetchPayments();
        }
      } catch (err) {
        toast.error('Failed to delete payment record');
      }
    }
  };

  // Route Standard Fares (Structure) editing
  const openStructureEditModal = (route: RouteItem) => {
    setEditingStructureRoute(route);
    setStructureAmount(String(route.amount));
    setIsStructureModalOpen(true);
  };

  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructureRoute) return;

    if (!structureAmount || parseFloat(structureAmount) < 0) {
      toast.error('Standard fare must be a positive amount');
      return;
    }

    try {
      const res = await api.put(`/school/transport-fees/structure/${editingStructureRoute.id}`, {
        amount: parseFloat(structureAmount)
      });
      if (res.data.success) {
        toast.success(`Fare updated for route ${editingStructureRoute.route_name}`);
        setIsStructureModalOpen(false);
        fetchStructureRoutes();
      }
    } catch (err) {
      toast.error('Failed to update route monthly fare');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRouteFilter('');
    setSelectedMonthFilter('');
    // Need to trigger a fetch explicitly since state variables update asynchronously
    setTimeout(() => {
      fetchPayments();
    }, 50);
  };

  // Dropdown options for student select
  const studentOptions = allocations.map(a => ({
    value: String(a.student_id),
    label: `${a.student_name} (${a.class_name}) - Route: ${a.route_name} [Adm: ${a.admission_number}]`
  }));

  const selectedStudentOption = studentOptions.find(opt => opt.value === formData.student_id) || null;

  return (
    <div className="flex flex-col gap-4 p-1.5 md:p-3 text-[11px] font-sans antialiased text-slate-800">
      
      {/* ── HEADER TITLE & BADGES ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 shadow-sm rounded-xl p-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Landmark className="w-4.5 h-4.5 text-blue-600" />
            Transport Fee Management
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Record payments, manage routes pricing, and track monthly student balances.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[9px] font-semibold text-slate-500 uppercase">Collection Rate</span>
            <span className="text-[11px] font-bold text-slate-900">
              {stats.all > 0 ? Math.round((stats.paid / stats.all) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-[9px] font-semibold text-green-600 uppercase">Collected</span>
            <span className="text-[11px] font-bold text-green-700">{stats.paid} student(s)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-[9px] font-semibold text-amber-600 uppercase">Pending</span>
            <span className="text-[11px] font-bold text-amber-700">{stats.pending} student(s)</span>
          </div>
        </div>
      </div>

      {/* ── TABS BAR with Counts ── */}
      <div className="flex border-b border-slate-200 bg-white/60 backdrop-blur rounded-lg p-1.5 gap-1 shadow-sm border">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
            activeTab === 'all' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Fees</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeTab === 'all' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {stats.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Paid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
            activeTab === 'Paid' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Paid</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeTab === 'Paid' ? 'bg-green-800 text-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {stats.paid}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Pending')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
            activeTab === 'Pending' 
              ? 'bg-amber-500 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeTab === 'Pending' ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {stats.pending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Overdue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
            activeTab === 'Overdue' 
              ? 'bg-rose-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeTab === 'Overdue' ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {stats.overdue}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ml-auto ${
            activeTab === 'structure' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fee Structure</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeTab === 'structure' ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {stats.structure}
          </span>
        </button>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      {activeTab !== 'structure' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-56">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search name, admission, route..."
                className="w-full pl-7.5 pr-2 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-[11px] transition"
              />
            </div>

            {/* Route Filter Selector */}
            <div className="w-44">
              <select
                value={selectedRouteFilter}
                onChange={(e) => setSelectedRouteFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] text-slate-700 cursor-pointer"
              >
                <option value="">All Routes</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>
                ))}
              </select>
            </div>

            {/* Month Filter Selector */}
            <div className="w-40">
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] text-slate-700 cursor-pointer"
              >
                <option value="">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Action buttons inside filter bar */}
            <button
              onClick={fetchPayments}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium transition cursor-pointer"
            >
              Filter
            </button>

            <button
              onClick={resetFilters}
              title="Reset Search and Filters"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-md font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Fee
            </button>
          </div>
        </div>
      )}

      {/* ── LIST VIEW TABLE (Payments list) ── */}
      {activeTab !== 'structure' ? (
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Loading transport fee records...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
              <Info className="w-6 h-6 text-slate-300" />
              <span>No transport fee records found. Click "+ Add Fee" to record one.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase text-[9px] tracking-wide whitespace-nowrap">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Route Allocated</th>
                  <th className="py-3 px-3">Fee Month</th>
                  <th className="py-3 px-3 text-right">Fare Amount</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                  <th className="py-3 px-3">Payment Info</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((item) => {
                  const studentName = item.student?.user?.full_name || 'N/A';
                  const admissionNo = item.student?.admission_number || 'N/A';
                  
                  const fareVal = parseFloat(String(item.amount));
                  const paidVal = parseFloat(String(item.paid_amount));
                  const balanceVal = fareVal - paidVal;

                  let statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (item.status === 'Paid') {
                    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (item.status === 'Pending') {
                    statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (item.status === 'Overdue') {
                    statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (item.status === 'Partial') {
                    statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{studentName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">Adm: {admissionNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.class?.m_alias_name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{item.route?.route_name || 'N/A'}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{item.route?.route_code || 'N/A'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.fee_month}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        ₹{fareVal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                        ₹{paidVal.toFixed(2)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${balanceVal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ₹{balanceVal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {paidVal > 0 ? (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{item.payment_mode}</span>
                              {item.payment_date && <span className="text-slate-400">| {item.payment_date}</span>}
                            </div>
                            {item.receipt_number && (
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5" title="Receipt Number">
                                Rec: {item.receipt_number}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-medium">No transaction details</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadgeColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Record"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete Record"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── FEE STRUCTURE VIEW (Standard route fares list) ── */
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Loading route fares structure...
            </div>
          ) : routes.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
              <Info className="w-6 h-6 text-slate-300" />
              <span>No routes are registered in the system. Populate routes first to manage structures.</span>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Standard Fares Structure:</span> Standard routes fares are used as default pricing when assigning student transportation allocations. Changing route amounts below updates standard fares but won't alter existing past recorded payments.
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase text-[9px] tracking-wide whitespace-nowrap">
                    <th className="py-3 px-3">Route Code</th>
                    <th className="py-3 px-3">Route Name</th>
                    <th className="py-3 px-3 text-right">Standard Monthly Fare</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {routes.map((route) => {
                    const fareVal = parseFloat(String(route.amount || '0'));
                    return (
                      <tr key={route.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                          {route.route_code}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {route.route_name}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-xs">
                          ₹{fareVal.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openStructureEditModal(route)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md font-medium transition cursor-pointer text-[10px]"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            Update Fare
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT FEE PAYMENT RECORD MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-blue-600" />
                {editingItem ? 'Edit Transport Fee Record' : 'Record Student Transport Fee'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              
              {/* Student Dropdown Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Student (Active allocations only)</label>
                {editingItem ? (
                  <input
                    type="text"
                    disabled
                    value={`${editingItem.student?.user?.full_name || 'N/A'} [Adm: ${editingItem.student?.admission_number || 'N/A'}]`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 cursor-not-allowed outline-none font-medium text-[11px]"
                  />
                ) : (
                  <Select
                    options={studentOptions}
                    value={selectedStudentOption}
                    onChange={(opt) => handleStudentSelect(opt ? opt.value : '')}
                    placeholder="Search by student name or admission number..."
                    styles={customSelectStyles}
                    isClearable
                    className="text-[12px]"
                  />
                )}
              </div>

              {/* Class & Route Autofill Preview */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400 uppercase">Assigned Class</span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {selectedStudentAlloc?.class_name || editingItem?.class?.m_alias_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400 uppercase">Assigned Route</span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {selectedStudentAlloc?.route_name || editingItem?.route?.route_name || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Fee Month Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fee Month</label>
                <select
                  name="fee_month"
                  value={formData.fee_month}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] text-slate-700 cursor-pointer"
                >
                  <option value="">Select Month</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Monthly Fee Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                    placeholder="1500.00"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="paid_amount"
                    value={formData.paid_amount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                  />
                </div>
              </div>

              {/* Payment details grid (Hidden if paid amount is 0) */}
              {parseFloat(formData.paid_amount || '0') > 0 && (
                <div className="grid grid-cols-2 gap-3.5 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
                    <select
                      name="payment_mode"
                      value={formData.payment_mode}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-md py-1 px-2 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] text-slate-700 cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online Payment</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Receipt Number (Optional)</label>
                    <input
                      type="text"
                      name="receipt_number"
                      value={formData.receipt_number}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if left blank & marked Paid"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] text-slate-700 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks & Internal Notes</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Record transactional details or installment agreements..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-[11px] resize-none"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow-sm cursor-pointer transition"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE ROUTE STANDARD FARE MODAL (FEE STRUCTURE) ── */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h2 className="text-xs font-bold text-slate-900">
                Update Standard Route Fare
              </h2>
              <button
                onClick={() => setIsStructureModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStructureSubmit} className="p-4 space-y-4">
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                <div>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase block">Route Code:</span>
                  <span className="font-bold text-slate-900 font-mono text-[11px]">{editingStructureRoute?.route_code}</span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase block">Route Name:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{editingStructureRoute?.route_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Monthly Standard Fare (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={structureAmount}
                  onChange={(e) => setStructureAmount(e.target.value)}
                  required
                  placeholder="1500.00"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold cursor-pointer shadow-sm"
                >
                  Update Fare
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransportFeeManager;
