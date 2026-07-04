import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface FineSlab {
  min_days: number;
  max_days: number | null;
  fine_amount: number;
}

interface CategoryRule {
  category_name: string;
  issue_limit: number;
  issue_duration: number;
  fine_per_day: number;
}

interface LibrarySettings {
  library_enabled: boolean;
  library_name: string;
  contact_email: string;
  contact_phone: string;
  
  // Borrowing Limits
  issue_limit_student: number;
  issue_limit_teacher: number;
  issue_limit_staff: number;
  issue_duration_student: number;
  issue_duration_teacher: number;
  issue_duration_staff: number;
  
  // Fines Configuration
  fine_per_day: number;
  fine_grace_period: number;
  auto_calculate_fine: boolean;
  fine_slabs: FineSlab[];
  category_rules: CategoryRule[];
  lost_book_penalty_multiplier: number;
  lost_book_flat_penalty: number;
  
  // Holiday and Alerts
  exclude_holidays: boolean;
  due_date_reminders: boolean;
  overdue_alerts: boolean;
  reminder_days_before: number;
}

interface LibrarySettingsManagerProps {
  onClose?: () => void;
}

// Compact Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

const LibrarySettingsManager: React.FC<LibrarySettingsManagerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LibrarySettings>({
    library_enabled: true,
    library_name: 'School Central Library',
    contact_email: '',
    contact_phone: '',
    issue_limit_student: 3,
    issue_limit_teacher: 5,
    issue_limit_staff: 5,
    issue_duration_student: 14,
    issue_duration_teacher: 21,
    issue_duration_staff: 30,
    fine_per_day: 1.00,
    fine_grace_period: 0,
    auto_calculate_fine: true,
    fine_slabs: [],
    category_rules: [],
    lost_book_penalty_multiplier: 1.00,
    lost_book_flat_penalty: 0.00,
    exclude_holidays: true,
    due_date_reminders: true,
    overdue_alerts: true,
    reminder_days_before: 2,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'general' | 'lending' | 'slabs' | 'categories'>('general');

  // Input states for adding rules/slabs
  const [newSlab, setNewSlab] = useState<FineSlab>({ min_days: 1, max_days: 7, fine_amount: 1.00 });
  const [newCatRule, setNewCatRule] = useState<CategoryRule>({ category_name: '', issue_limit: 3, issue_duration: 14, fine_per_day: 1.00 });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/library-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          ...data,
          fine_slabs: Array.isArray(data.fine_slabs) ? data.fine_slabs : [],
          category_rules: Array.isArray(data.category_rules) ? data.category_rules : [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load library settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'contact_phone') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue.length > 10) return; // limit to 10 digits
      setSettings(prev => ({ ...prev, contact_phone: cleanValue }));
      return;
    }

    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const addSlab = () => {
    if (newSlab.min_days < 0 || newSlab.fine_amount < 0) {
      toast.error('Values must be positive');
      return;
    }
    if (newSlab.max_days !== null && newSlab.max_days < newSlab.min_days) {
      toast.error('Max days cannot be less than min days');
      return;
    }

    setSettings(prev => ({
      ...prev,
      fine_slabs: [...prev.fine_slabs, newSlab].sort((a, b) => a.min_days - b.min_days),
    }));
    setNewSlab({ min_days: 1, max_days: 7, fine_amount: 1.00 });
  };

  const deleteSlab = (index: number) => {
    setSettings(prev => ({
      ...prev,
      fine_slabs: prev.fine_slabs.filter((_, idx) => idx !== index),
    }));
  };

  const addCategoryRule = () => {
    if (!newCatRule.category_name.trim()) {
      toast.error('Category Name is required');
      return;
    }
    if (newCatRule.issue_limit < 0 || newCatRule.issue_duration < 0 || newCatRule.fine_per_day < 0) {
      toast.error('Values must be positive');
      return;
    }
    if (settings.category_rules.some(r => r.category_name.toLowerCase() === newCatRule.category_name.toLowerCase())) {
      toast.error('Rule for this category already exists');
      return;
    }

    setSettings(prev => ({
      ...prev,
      category_rules: [...prev.category_rules, newCatRule],
    }));
    setNewCatRule({ category_name: '', issue_limit: 3, issue_duration: 14, fine_per_day: 1.00 });
  };

  const deleteCategoryRule = (index: number) => {
    setSettings(prev => ({
      ...prev,
      category_rules: prev.category_rules.filter((_, idx) => idx !== index),
    }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!settings.library_name || settings.library_name.trim() === '') {
      toast.error('Library Name is required');
      return;
    }
    if (settings.library_name.length > 30) {
      toast.error('Library Name cannot exceed 30 characters');
      return;
    }

    if (!settings.contact_email || settings.contact_email.trim() === '') {
      toast.error('Contact Email Address is required');
      return;
    }
    if (settings.contact_email.length > 30) {
      toast.error('Contact Email Address cannot exceed 30 characters');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.contact_email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!settings.contact_phone || settings.contact_phone.trim() === '') {
      toast.error('Contact Phone Number is required');
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(settings.contact_phone)) {
      toast.error('Contact Phone Number must be exactly 10 digits and contain only numbers');
      return;
    }

    if (settings.issue_limit_student < 0 || settings.issue_limit_teacher < 0 || settings.issue_limit_staff < 0) {
      toast.error('Limits must be non-negative integers');
      return;
    }
    if (settings.issue_duration_student < 0 || settings.issue_duration_teacher < 0 || settings.issue_duration_staff < 0) {
      toast.error('Borrow durations must be non-negative integers');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/school/library-settings', settings);
      if (response.data.success) {
        toast.success(response.data.message || 'Library settings saved successfully!');
        const data = response.data.data;
        setSettings({
          ...data,
          fine_slabs: Array.isArray(data.fine_slabs) ? data.fine_slabs : [],
          category_rules: Array.isArray(data.category_rules) ? data.category_rules : [],
        });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-xs text-gray-500">Loading library settings...</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'general', name: 'General', icon: '🏫' },
    { id: 'lending', name: 'Lending Policies', icon: '📖' },
    { id: 'slabs', name: 'Slab-wise Fines', icon: '📈' },
    { id: 'categories', name: 'Category Rules', icon: '🏷️' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header section with status toggle - layout MATCHES School Profile banner exactly */}
      <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[#558fed] to-[#87a1d9] text-white">
        <div>
          <h2 className="text-[14px] font-semibold">Library Settings</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg border border-white/10 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider">Library Enabled</span>
            <ToggleSwitch
              checked={settings.library_enabled}
              onChange={(checked) => setSettings(prev => ({ ...prev, library_enabled: checked }))}
            />
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${!settings.library_enabled ? 'opacity-60' : ''} transition-opacity duration-200`}>
        {/* Navigation Tabs - styling MATCHES School Profile tabs row exactly */}
        <div className="flex border-b border-gray-200 overflow-x-auto px-4 bg-white">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={!settings.library_enabled}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-[12px] font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1 text-[13px]">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-4">
          {!settings.library_enabled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> Note: The Library Module is currently disabled. Toggle the switch in the header to enable editing.
            </div>
          )}

          {/* TAB 1: GENERAL & ALERTS */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1">Profile & Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Library Name *</label>
                    <input
                      type="text"
                      name="library_name"
                      maxLength={30}
                      disabled={!settings.library_enabled}
                      value={settings.library_name}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Contact Email Address *</label>
                    <input
                      type="email"
                      name="contact_email"
                      maxLength={30}
                      disabled={!settings.library_enabled}
                      value={settings.contact_email}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Contact Phone Number *</label>
                    <input
                      type="text"
                      name="contact_phone"
                      maxLength={10}
                      disabled={!settings.library_enabled}
                      value={settings.contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Holiday Management & Reminders */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1">Holiday Management & Alerts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                  <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 h-7.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Exclude Holidays</span>
                    <ToggleSwitch
                      checked={settings.exclude_holidays}
                      disabled={!settings.library_enabled}
                      onChange={(checked) => setSettings(prev => ({ ...prev, exclude_holidays: checked }))}
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 h-7.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Due Date Reminders</span>
                    <ToggleSwitch
                      checked={settings.due_date_reminders}
                      disabled={!settings.library_enabled}
                      onChange={(checked) => setSettings(prev => ({ ...prev, due_date_reminders: checked }))}
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 h-7.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Overdue Alerts</span>
                    <ToggleSwitch
                      checked={settings.overdue_alerts}
                      disabled={!settings.library_enabled}
                      onChange={(checked) => setSettings(prev => ({ ...prev, overdue_alerts: checked }))}
                    />
                  </label>
                  
                  {settings.due_date_reminders && (
                    <div className="animate-fadeIn">
                      <input
                        type="number"
                        name="reminder_days_before"
                        disabled={!settings.library_enabled}
                        value={settings.reminder_days_before}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                        placeholder="Remind days before"
                        min="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LENDING POLICIES */}
          {activeTab === 'lending' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b pb-1">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Lending Limits & Durations</h3>
              </div>

              {/* Grid 4 columns style matches user screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Student Book Limit</label>
                  <input
                    type="number"
                    name="issue_limit_student"
                    disabled={!settings.library_enabled}
                    value={settings.issue_limit_student}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Student Duration (Days)</label>
                  <input
                    type="number"
                    name="issue_duration_student"
                    disabled={!settings.library_enabled}
                    value={settings.issue_duration_student}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Teacher Book Limit</label>
                  <input
                    type="number"
                    name="issue_limit_teacher"
                    disabled={!settings.library_enabled}
                    value={settings.issue_limit_teacher}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Teacher Duration (Days)</label>
                  <input
                    type="number"
                    name="issue_duration_teacher"
                    disabled={!settings.library_enabled}
                    value={settings.issue_duration_teacher}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Staff Book Limit</label>
                  <input
                    type="number"
                    name="issue_limit_staff"
                    disabled={!settings.library_enabled}
                    value={settings.issue_limit_staff}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Staff Duration (Days)</label>
                  <input
                    type="number"
                    name="issue_duration_staff"
                    disabled={!settings.library_enabled}
                    value={settings.issue_duration_staff}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lost Book Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    name="lost_book_penalty_multiplier"
                    disabled={!settings.library_enabled}
                    value={settings.lost_book_penalty_multiplier}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lost Book Flat Penalty (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="lost_book_flat_penalty"
                    disabled={!settings.library_enabled}
                    value={settings.lost_book_flat_penalty}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SLAB-WISE FINES */}
          {activeTab === 'slabs' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b pb-1 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Slab-wise Overdue Fines</h3>
                <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 h-7.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-2">Auto Calculate Fines</span>
                  <ToggleSwitch
                    checked={settings.auto_calculate_fine}
                    disabled={!settings.library_enabled}
                    onChange={(checked) => setSettings(prev => ({ ...prev, auto_calculate_fine: checked }))}
                  />
                </label>
              </div>

              {settings.auto_calculate_fine && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Default daily rate & grace period */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Default Daily Fine (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="fine_per_day"
                        disabled={!settings.library_enabled}
                        value={settings.fine_per_day}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fine Grace Period (Days)</label>
                      <input
                        type="number"
                        name="fine_grace_period"
                        disabled={!settings.library_enabled}
                        value={settings.fine_grace_period}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Slab Creator Grid */}
                  <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add Fine Slab Rules</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">From Day Overdue</label>
                        <input
                          type="number"
                          disabled={!settings.library_enabled}
                          value={newSlab.min_days}
                          onChange={(e) => setNewSlab(prev => ({ ...prev, min_days: parseInt(e.target.value) || 1 }))}
                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">To Day Overdue (blank = ∞)</label>
                        <input
                          type="number"
                          disabled={!settings.library_enabled}
                          value={newSlab.max_days === null ? '' : newSlab.max_days}
                          onChange={(e) => setNewSlab(prev => ({ ...prev, max_days: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                          placeholder="Infinity"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fine Amount/Day (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          disabled={!settings.library_enabled}
                          value={newSlab.fine_amount}
                          onChange={(e) => setNewSlab(prev => ({ ...prev, fine_amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                          min="0"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!settings.library_enabled}
                        onClick={addSlab}
                        className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-bold rounded-lg h-7.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        + Add Slab
                      </button>
                    </div>
                  </div>

                  {/* Slabs List Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b font-bold text-gray-600 text-[10px] uppercase">
                          <th className="py-2 px-3">Slab Range</th>
                          <th className="py-2 px-3 text-right">Daily Fine Rate</th>
                          <th className="py-2 px-3 text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {settings.fine_slabs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-gray-500">
                              No fine slabs defined. Default daily fine rate will apply.
                            </td>
                          </tr>
                        ) : (
                          settings.fine_slabs.map((slab, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition text-gray-700">
                              <td className="py-2 px-3">
                                Overdue from day <span className="font-bold">{slab.min_days}</span> to{' '}
                                <span className="font-bold">{slab.max_days === null ? '∞ (Infinity)' : slab.max_days}</span>
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-gray-900">
                                ₹ {slab.fine_amount.toFixed(2)} / day
                              </td>
                              <td className="py-1 px-3 text-center">
                                <button
                                  type="button"
                                  disabled={!settings.library_enabled}
                                  onClick={() => deleteSlab(idx)}
                                  className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CATEGORY RULES */}
          {activeTab === 'categories' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b pb-1">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Category-Specific Lending Rules</h3>
              </div>

              {/* Add Category Rule Inputs */}
              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Define New Category Rule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Category Name</label>
                    <input
                      type="text"
                      disabled={!settings.library_enabled}
                      value={newCatRule.category_name}
                      onChange={(e) => setNewCatRule(prev => ({ ...prev, category_name: e.target.value }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                      placeholder="e.g. Reference"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Max Limit</label>
                    <input
                      type="number"
                      disabled={!settings.library_enabled}
                      value={newCatRule.issue_limit}
                      onChange={(e) => setNewCatRule(prev => ({ ...prev, issue_limit: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Duration (Days)</label>
                    <input
                      type="number"
                      disabled={!settings.library_enabled}
                      value={newCatRule.issue_duration}
                      onChange={(e) => setNewCatRule(prev => ({ ...prev, issue_duration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fine/Day (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!settings.library_enabled}
                      value={newCatRule.fine_per_day}
                      onChange={(e) => setNewCatRule(prev => ({ ...prev, fine_per_day: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!settings.library_enabled}
                    onClick={addCategoryRule}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-bold rounded-lg h-7.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    + Add Category Rule
                  </button>
                </div>
              </div>

              {/* Category Rules List Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b font-bold text-gray-600 text-[10px] uppercase">
                      <th className="py-2 px-3">Category Name</th>
                      <th className="py-2 px-3 text-center">Books Limit</th>
                      <th className="py-2 px-3 text-center">Duration</th>
                      <th className="py-2 px-3 text-right">Fine Per Day</th>
                      <th className="py-2 px-3 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settings.category_rules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">
                          No category-specific rules defined. Global limits will apply.
                        </td>
                      </tr>
                    ) : (
                      settings.category_rules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition text-gray-700">
                          <td className="py-2 px-3 font-semibold text-gray-800">{rule.category_name}</td>
                          <td className="py-2 px-3 text-center">{rule.issue_limit}</td>
                          <td className="py-2 px-3 text-center">{rule.issue_duration} days</td>
                          <td className="py-2 px-3 text-right font-semibold">₹ {rule.fine_per_day.toFixed(2)}</td>
                          <td className="py-1 px-3 text-center">
                            <button
                              type="button"
                              disabled={!settings.library_enabled}
                              onClick={() => deleteCategoryRule(idx)}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form Actions - styled EXACTLY like School Settings footer */}
          <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-3 py-1 text-[11.5px] border rounded-lg text-gray-700 hover:bg-gray-50 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !settings.library_enabled}
              className="px-4 py-1 text-[11.5px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LibrarySettingsManager;
