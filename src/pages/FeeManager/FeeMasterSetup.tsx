import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Save, RefreshCw, DollarSign, Calendar, CheckSquare, Shield, FileText, Settings, CreditCard, HelpCircle
} from 'lucide-react';
import api from '../../services/api';

interface Installment {
  name: string;
  due_date: string;
  amount_type: 'equal' | 'custom';
  percentage: number;
}

interface FeeSettings {
  // Basic Info
  branch_name: string;
  academic_session_id: string;
  financial_year: string;
  currency: string;
  timezone: string;
  status: string;
  
  // Fee Collection Setup
  collection_start_date: string;
  collection_end_date: string;
  collection_due_date: string;
  grace_days: number;
  allow_advance: boolean;
  allow_partial: boolean;
  allow_previous_due: boolean;
  allow_future_month: boolean;
  
  // Fee Collection Rules
  collection_type: string;
  collection_cycle: string;
  auto_generate_monthly: boolean;
  auto_carry_forward: boolean;
  allow_zero_amount: boolean;
  auto_calculate_fine: boolean;
  allow_negative_balance: boolean;
  min_collection_amount: number;
  max_collection_amount: number;
  
  // Late Fine Rules
  fine_applicable: boolean;
  fine_type: string;
  fine_amount: number;
  max_fine_amount: number;
  fine_grace_period: number;
  fine_start_after_days: number;
  holiday_exemption: boolean;
  sunday_exemption: boolean;
  fine_on_previous_due: boolean;
  
  // Receipt Settings
  receipt_prefix: string;
  receipt_start_number: number;
  receipt_num_length: number;
  receipt_auto_generate: boolean;
  receipt_allow_reprint: boolean;
  receipt_allow_cancellation: boolean;
  receipt_cancel_limit_hours: number;
  receipt_print_logo: boolean;
  receipt_print_qr: boolean;
  receipt_print_barcode: boolean;
  receipt_digital_signature: boolean;
  receipt_footer_msg: string;
  
  // Installment Settings
  num_installments: number;
  installments: Installment[];
  
  // Other Settings
  refund_allowed: boolean;
  adjustment_allowed: boolean;
  round_off_amount: boolean;
  rounding_method: string;
  scholarship_applicable: boolean;
  employee_child_discount: boolean;
  sibling_discount: boolean;
  transport_fee_included: boolean;
  hostel_fee_included: boolean;
  tax_applicable: boolean;
  gst_percentage: number;
  notes: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

export default function FeeMasterSetup() {
  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'fine' | 'receipt' | 'installment' | 'other'>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [initialData, setInitialData] = useState<FeeSettings | null>(null);

  const [formData, setFormData] = useState<FeeSettings>({
    branch_name: '',
    academic_session_id: '',
    financial_year: '2026-2027',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    collection_start_date: '',
    collection_end_date: '',
    collection_due_date: '',
    grace_days: 0,
    allow_advance: false,
    allow_partial: false,
    allow_previous_due: false,
    allow_future_month: false,
    collection_type: 'Monthly',
    collection_cycle: '',
    auto_generate_monthly: false,
    auto_carry_forward: false,
    allow_zero_amount: false,
    auto_calculate_fine: false,
    allow_negative_balance: false,
    min_collection_amount: 0,
    max_collection_amount: 0,
    fine_applicable: false,
    fine_type: 'Fixed',
    fine_amount: 0,
    max_fine_amount: 0,
    fine_grace_period: 0,
    fine_start_after_days: 0,
    holiday_exemption: false,
    sunday_exemption: false,
    fine_on_previous_due: false,
    receipt_prefix: 'REC',
    receipt_start_number: 1001,
    receipt_num_length: 6,
    receipt_auto_generate: true,
    receipt_allow_reprint: true,
    receipt_allow_cancellation: true,
    receipt_cancel_limit_hours: 24,
    receipt_print_logo: true,
    receipt_print_qr: true,
    receipt_print_barcode: false,
    receipt_digital_signature: false,
    receipt_footer_msg: 'Thank you for your payment.',
    num_installments: 4,
    installments: [
      { name: '1st Installment', due_date: '', amount_type: 'equal', percentage: 25 },
      { name: '2nd Installment', due_date: '', amount_type: 'equal', percentage: 25 },
      { name: '3rd Installment', due_date: '', amount_type: 'equal', percentage: 25 },
      { name: '4th Installment', due_date: '', amount_type: 'equal', percentage: 25 }
    ],
    refund_allowed: false,
    adjustment_allowed: false,
    round_off_amount: false,
    rounding_method: 'Nearest',
    scholarship_applicable: false,
    employee_child_discount: false,
    sibling_discount: false,
    transport_fee_included: false,
    hostel_fee_included: false,
    tax_applicable: false,
    gst_percentage: 18,
    notes: ''
  });

  useEffect(() => {
    fetchAcademicYears();
    loadSettings();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get('/school/academic-years');
      if (res.data?.success) {
        setAcademicYears(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load academic years', err);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/fee-settings');
      if (res.data?.success && res.data.data) {
        // Ensure defaults if keys are missing from the saved JSON
        const merged = { ...formData, ...res.data.data };
        setFormData(merged);
        setInitialData(merged);
      }
    } catch (err) {
      toast.error('Failed to load current settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FeeSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInstallmentChange = (index: number, key: keyof Installment, value: any) => {
    const updated = [...formData.installments];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setFormData(prev => ({
      ...prev,
      installments: updated
    }));
  };

  const handleNumInstallmentsChange = (num: number) => {
    const parsed = Math.max(1, Math.min(12, num));
    let updated = [...formData.installments];
    
    if (parsed > updated.length) {
      // Add items
      const equalShare = Math.round(100 / parsed);
      for (let i = updated.length; i < parsed; i++) {
        updated.push({
          name: `${i + 1}st Installment`,
          due_date: '',
          amount_type: 'equal',
          percentage: equalShare
        });
      }
    } else if (parsed < updated.length) {
      // Remove excess items
      updated = updated.slice(0, parsed);
    }
    
    setFormData(prev => ({
      ...prev,
      num_installments: parsed,
      installments: updated
    }));
  };

  const handleSave = async (e: React.FormEvent, resetAfter = false) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/school/fee-settings', formData);
      if (res.data?.success) {
        toast.success('Fee setup configuration updated successfully!');
        if (resetAfter) {
          handleReset();
        } else {
          setInitialData(formData);
        }
      }
    } catch (err) {
      toast.error('Failed to save master setup');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast.success('Settings restored to initial state');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-3 text-xs">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg animate-pulse">
            <Settings className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Fee Master Setup Cockpit</h1>
            <p className="text-[10px] text-gray-500">Global configurations for billing sessions, collection logic, grace periods, receipt sequence, and fine slabs.</p>
          </div>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-medium">Load Active</span>
        </button>
      </div>

      <form onSubmit={(e) => handleSave(e)} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side: Navigation Tabs */}
        <div className="w-full md:w-56 bg-gray-50 border-r border-gray-200 flex flex-col justify-between">
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'basic' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Basic Information</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'rules' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Collection Rules</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fine')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'fine' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Late Fine Rules</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receipt')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'receipt' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Receipt Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('installment')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'installment' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Installment Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('other')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition flex items-center gap-2 ${
                activeTab === 'other' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-150'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Other Settings</span>
            </button>
          </div>

          <div className="p-3 bg-indigo-50/50 border-t border-indigo-100 text-[10px] text-indigo-650 flex items-start gap-1.5 leading-snug">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Updates apply institution-wide. Check active collection runs before altering rules.</span>
          </div>
        </div>

        {/* Right Side: Tab Form Panel */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  School & Session Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">School Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Branch or Public Campus"
                      value={formData.branch_name}
                      onChange={e => handleInputChange('branch_name', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Academic Session</label>
                    <select
                      value={formData.academic_session_id}
                      onChange={e => handleInputChange('academic_session_id', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Financial Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      value={formData.financial_year}
                      onChange={e => handleInputChange('financial_year', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={e => handleInputChange('currency', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Time Zone</label>
                    <select
                      value={formData.timezone}
                      onChange={e => handleInputChange('timezone', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => handleInputChange('status', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Active">Active Setup</option>
                      <option value="Inactive">Inactive Setup</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Fee Collection Setup
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Collection Start Date</label>
                    <input
                      type="date"
                      value={formData.collection_start_date}
                      onChange={e => handleInputChange('collection_start_date', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Collection End Date</label>
                    <input
                      type="date"
                      value={formData.collection_end_date}
                      onChange={e => handleInputChange('collection_end_date', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Standard Due Date</label>
                    <input
                      type="date"
                      value={formData.collection_due_date}
                      onChange={e => handleInputChange('collection_due_date', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Grace Days</label>
                    <input
                      type="number"
                      value={formData.grace_days}
                      onChange={e => handleInputChange('grace_days', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_advance}
                      onChange={e => handleInputChange('allow_advance', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Advance Fee</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_partial}
                      onChange={e => handleInputChange('allow_partial', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Partial Fee</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_previous_due}
                      onChange={e => handleInputChange('allow_previous_due', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Prev Due Collection</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_future_month}
                      onChange={e => handleInputChange('allow_future_month', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Future Month Billing</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEE COLLECTION RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Collection Configuration Rules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fee Collection Type</label>
                    <select
                      value={formData.collection_type}
                      onChange={e => handleInputChange('collection_type', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Monthly">Monthly Cycle</option>
                      <option value="Quarterly">Quarterly Cycle</option>
                      <option value="Half Yearly">Half Yearly Cycle</option>
                      <option value="Yearly">Yearly Cycle</option>
                      <option value="Custom">Custom Installment Type</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Collection Cycle Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Month-wise Cycle Run"
                      value={formData.collection_cycle}
                      onChange={e => handleInputChange('collection_cycle', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Minimum Collection Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.min_collection_amount}
                      onChange={e => handleInputChange('min_collection_amount', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Maximum Collection Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.max_collection_amount}
                      onChange={e => handleInputChange('max_collection_amount', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-4 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_generate_monthly}
                      onChange={e => handleInputChange('auto_generate_monthly', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Auto Generate Monthly Fee</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_carry_forward}
                      onChange={e => handleInputChange('auto_carry_forward', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Auto Carry Forward Due</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_zero_amount}
                      onChange={e => handleInputChange('allow_zero_amount', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Zero Amount Receipt</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_calculate_fine}
                      onChange={e => handleInputChange('auto_calculate_fine', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Auto Calculate Fine</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_negative_balance}
                      onChange={e => handleInputChange('allow_negative_balance', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Negative Balance</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LATE FINE RULES */}
          {activeTab === 'fine' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Late Penalty Slabs & Settings
                </h3>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded border border-gray-200 font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={formData.fine_applicable}
                      onChange={e => handleInputChange('fine_applicable', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Late Fine Penalty Applicable</span>
                  </label>
                </div>

                {formData.fine_applicable && (
                  <div className="space-y-3 p-3 bg-slate-50/40 rounded border border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fine Type</label>
                        <select
                          value={formData.fine_type}
                          onChange={e => handleInputChange('fine_type', e.target.value)}
                          className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Fixed">Fixed Amount</option>
                          <option value="Per Day">Per Day Accumulation</option>
                          <option value="Percentage">Percentage of Balance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fine Amount (₹ / %)</label>
                        <input
                          type="number"
                          value={formData.fine_amount}
                          onChange={e => handleInputChange('fine_amount', Number(e.target.value))}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Maximum Fine (₹)</label>
                        <input
                          type="number"
                          value={formData.max_fine_amount}
                          onChange={e => handleInputChange('max_fine_amount', Number(e.target.value))}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fine Grace Period (Days)</label>
                        <input
                          type="number"
                          value={formData.fine_grace_period}
                          onChange={e => handleInputChange('fine_grace_period', Number(e.target.value))}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fine Start After (Days)</label>
                        <input
                          type="number"
                          value={formData.fine_start_after_days}
                          onChange={e => handleInputChange('fine_start_after_days', Number(e.target.value))}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-gray-200">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.holiday_exemption}
                          onChange={e => handleInputChange('holiday_exemption', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-gray-700">Holiday Exemption</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sunday_exemption}
                          onChange={e => handleInputChange('sunday_exemption', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-gray-700">Sunday Exemption</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fine_on_previous_due}
                          onChange={e => handleInputChange('fine_on_previous_due', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-gray-700">Fine on Previous Due</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPT SETTINGS */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Receipt Template & Invoice Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Receipt Prefix</label>
                    <input
                      type="text"
                      value={formData.receipt_prefix}
                      onChange={e => handleInputChange('receipt_prefix', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Starting Number</label>
                    <input
                      type="number"
                      value={formData.receipt_start_number}
                      onChange={e => handleInputChange('receipt_start_number', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Number Length</label>
                    <input
                      type="number"
                      value={formData.receipt_num_length}
                      onChange={e => handleInputChange('receipt_num_length', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Receipt Cancellation Limit (Hours)</label>
                    <input
                      type="number"
                      value={formData.receipt_cancel_limit_hours}
                      onChange={e => handleInputChange('receipt_cancel_limit_hours', Number(e.target.value))}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Footer Message</label>
                    <input
                      type="text"
                      value={formData.receipt_footer_msg}
                      onChange={e => handleInputChange('receipt_footer_msg', e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_auto_generate}
                      onChange={e => handleInputChange('receipt_auto_generate', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Auto Generate Receipt</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_allow_reprint}
                      onChange={e => handleInputChange('receipt_allow_reprint', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Receipt Reprint</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_allow_cancellation}
                      onChange={e => handleInputChange('receipt_allow_cancellation', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Allow Cancellation</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_print_logo}
                      onChange={e => handleInputChange('receipt_print_logo', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Print School Logo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_print_qr}
                      onChange={e => handleInputChange('receipt_print_qr', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Print QR Code</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_print_barcode}
                      onChange={e => handleInputChange('receipt_print_barcode', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Print Barcode</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.receipt_digital_signature}
                      onChange={e => handleInputChange('receipt_digital_signature', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Digital Signature</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INSTALLMENT SETTINGS */}
          {activeTab === 'installment' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Installment Slabs Configuration
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <label className="font-bold text-gray-600">Number of Installments:</label>
                  <input
                    type="number"
                    value={formData.num_installments}
                    onChange={e => handleNumInstallmentsChange(Number(e.target.value))}
                    className="w-16 h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    min="1"
                    max="12"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">(Max 12 billing structures)</span>
                </div>

                <div className="space-y-2.5">
                  {formData.installments.map((inst, idx) => (
                    <div key={idx} className="p-2.5 border border-gray-150 rounded bg-gray-50/50 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Installment Label</label>
                        <input
                          type="text"
                          value={inst.name}
                          onChange={e => handleInstallmentChange(idx, 'name', e.target.value)}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-gray-800 bg-white"
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Due Date</label>
                        <input
                          type="date"
                          value={inst.due_date}
                          onChange={e => handleInstallmentChange(idx, 'due_date', e.target.value)}
                          className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Amount Type</label>
                        <select
                          value={inst.amount_type}
                          onChange={e => handleInstallmentChange(idx, 'amount_type', e.target.value)}
                          className="w-full h-7 px-2 border border-gray-300 rounded bg-white focus:outline-none"
                        >
                          <option value="equal">Equal Share</option>
                          <option value="custom">Custom (%)</option>
                        </select>
                      </div>
                      {inst.amount_type === 'custom' && (
                        <div className="w-20">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Percentage (%)</label>
                          <input
                            type="number"
                            value={inst.percentage}
                            onChange={e => handleInstallmentChange(idx, 'percentage', Number(e.target.value))}
                            className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                            min="0"
                            max="100"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OTHER SETTINGS */}
          {activeTab === 'other' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs border-b pb-1.5 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full"></span>
                  Concession, Refunds & Taxes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.refund_allowed}
                      onChange={e => handleInputChange('refund_allowed', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Refund Allowed</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.adjustment_allowed}
                      onChange={e => handleInputChange('adjustment_allowed', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Adjustment Allowed</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.round_off_amount}
                      onChange={e => handleInputChange('round_off_amount', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Round Off Amount</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scholarship_applicable}
                      onChange={e => handleInputChange('scholarship_applicable', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Scholarship Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.employee_child_discount}
                      onChange={e => handleInputChange('employee_child_discount', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Staff Child Discount</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sibling_discount}
                      onChange={e => handleInputChange('sibling_discount', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Sibling Concession</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.transport_fee_included}
                      onChange={e => handleInputChange('transport_fee_included', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Transport Included</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hostel_fee_included}
                      onChange={e => handleInputChange('hostel_fee_included', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-gray-700">Hostel Included</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {formData.round_off_amount && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rounding Method</label>
                      <select
                        value={formData.rounding_method}
                        onChange={e => handleInputChange('rounding_method', e.target.value)}
                        className="w-full h-7 px-2 border border-gray-300 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Nearest">Nearest Rupee</option>
                        <option value="Up">Round Up</option>
                        <option value="Down">Round Down</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-1.5 cursor-pointer mb-1 mt-1 font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.tax_applicable}
                        onChange={e => handleInputChange('tax_applicable', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Taxes / GST Applicable</span>
                    </label>
                    {formData.tax_applicable && (
                      <input
                        type="number"
                        placeholder="GST % (e.g. 18)"
                        value={formData.gst_percentage}
                        onChange={e => handleInputChange('gst_percentage', Number(e.target.value))}
                        className="w-full h-7 px-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        min="0"
                        max="100"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">General Notes / Instructions</label>
                  <textarea
                    rows={4}
                    placeholder="Provide description or terms of cancellation/discounts..."
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Footer inside form */}
          <div className="flex justify-end gap-2 border-t border-gray-150 pt-3 mt-4">
            <button
              type="button"
              onClick={handleReset}
              className="h-7 px-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-[11px] font-semibold"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('basic'); }}
              className="h-7 px-3 border border-gray-300 rounded text-gray-650 hover:bg-gray-50 transition text-[11px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSave(e, true)}
              disabled={saving}
              className="h-7 px-3 bg-gray-100 border border-gray-350 hover:bg-gray-200 text-gray-700 rounded transition text-[11px] font-semibold"
            >
              Save & New
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-7 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded shadow-sm text-[11px] font-bold flex items-center gap-1 transition"
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{initialData ? 'Update Settings' : 'Save Config'}</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
