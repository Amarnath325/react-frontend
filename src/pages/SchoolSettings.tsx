import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

interface SchoolSettingsData {
  // Basic Information
  business_name: string;
  registration_number: string;
  tax_number: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  established_year: string;
  affiliation_board: string;
  school_type: string;
  gender_type: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  
  // Academic Settings
  academic_year_start: string;
  academic_year_end: string;
  session_start_month: string;
  session_end_month: string;
  
  // Examination Settings
  exam_type: string;
  grading_system: string;
  passing_percentage: number;
  
  // Fees Settings
  fee_reminder_days: number;
  late_fee_charges: number;
  fine_after_days: number;
  
  // Communication Settings
  sms_enabled: boolean;
  email_enabled: boolean;
  notice_board_enabled: boolean;
  parent_portal_enabled: boolean;
  
  // Security Settings
  two_factor_auth: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  
  // Other Settings
  timezone: string;
  date_format: string;
  language: string;
  logo: string | null;
  
  // Social Media Links
  facebook_url: string;
  twitter_url: string;
  linkedin_url: string;
  instagram_url: string;
  
  // About School
  about_school: string;
  mission: string;
  vision: string;
}

const SchoolSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<SchoolSettingsData>({
    business_name: '',
    registration_number: '',
    tax_number: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    established_year: '',
    affiliation_board: '',
    school_type: '',
    gender_type: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    academic_year_start: '',
    academic_year_end: '',
    session_start_month: '',
    session_end_month: '',
    exam_type: '',
    grading_system: '',
    passing_percentage: 33,
    fee_reminder_days: 7,
    late_fee_charges: 10,
    fine_after_days: 15,
    sms_enabled: true,
    email_enabled: true,
    notice_board_enabled: true,
    parent_portal_enabled: true,
    two_factor_auth: false,
    password_expiry_days: 90,
    max_login_attempts: 5,
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    language: 'en',
    logo: null,
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    instagram_url: '',
    about_school: '',
    mission: '',
    vision: '',
  });

  interface MasterData {
    affiliationBoards: any[];
    schoolTypes: any[];
    genders: any[];
    timezones: any[];
    languages: any[];
  }

  const [masterData, setMasterData] = useState<MasterData>({
    affiliationBoards: [],
    schoolTypes: [],
    genders: [],
    timezones: [],
    languages: [],
  });

  useEffect(() => {
    fetchSettings();
    fetchMasterData();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/settings');
      if (response.data.success) {
        setFormData(response.data.data);
        if (response.data.data.logo) {
          setLogoPreview(response.data.data.logo);
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to load school settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/master/affiliation-boards'),
        api.get('/master/school-types'),
        api.get('/master/genders'),
        api.get('/master/timezones'),
        api.get('/master/languages'),
      ]);

      const [boards, types, genders, timezones, languages] = results.map((result) => {
        if (result.status === 'fulfilled' && result.value?.data?.data) {
          const data = result.value.data.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      });

      setMasterData({
        affiliationBoards: Array.isArray(boards) ? boards : [],
        schoolTypes: Array.isArray(types) ? types : [],
        genders: Array.isArray(genders) ? genders : [],
        timezones: Array.isArray(timezones) ? timezones : [],
        languages: Array.isArray(languages) ? languages : [],
      });
    } catch (error) {
      console.error('Error fetching master data:', error);
      // Set empty arrays to prevent crashes
      setMasterData({
        affiliationBoards: [],
        schoolTypes: [],
        genders: [],
        timezones: [],
        languages: [],
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper function to render select options safely
  const renderSelectOptions = (options: any[], emptyMessage = 'No options available') => {
    if (!Array.isArray(options) || options.length === 0) {
      return <option disabled>{emptyMessage}</option>;
    }
    return options.map((item: any) => (
      <option key={item.value || item.id} value={item.value || item.id}>
        {item.label || item.name}
      </option>
    ));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          submitData.append(key, value ? '1' : '0');
        } else {
          submitData.append(key, String(value));
        }
      });
      
      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      
      const response = await api.post('/school/settings', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '🏫' },
    { id: 'address', name: 'Address', icon: '📍' },
    { id: 'academic', name: 'Academic', icon: '📚' },
    { id: 'examination', name: 'Examination', icon: '📝' },
    { id: 'fees', name: 'Fees', icon: '💰' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'security', name: 'Security', icon: '🔐' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-2xl font-bold">School Settings</h1>
        <p className="text-blue-100 mt-1">Manage your school configuration and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">General Information</h2>
              
              {/* Logo Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="space-y-3">
                    <img src={logoPreview} alt="School Logo" className="w-32 h-32 object-contain mx-auto" />
                    <button
                      type="button"
                      onClick={() => document.getElementById('logo')?.click()}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Change Logo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('logo')?.click()}
                    className="space-y-2"
                  >
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Upload School Logo</p>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number (GST/PAN)</label>
                  <input
                    type="text"
                    name="tax_number"
                    value={formData.tax_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://www.school.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                  <input
                    type="number"
                    name="established_year"
                    value={formData.established_year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation Board</label>
                  <select
                    name="affiliation_board"
                    value={formData.affiliation_board}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {renderSelectOptions(masterData.affiliationBoards, 'Select affiliation board')}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Type</label>
                  <select
                    name="school_type"
                    value={formData.school_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {renderSelectOptions(masterData.schoolTypes, 'Select school type')}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Type</label>
                  <select
                    name="gender_type"
                    value={formData.gender_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {renderSelectOptions(masterData.genders, 'Select gender type')}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Address Settings Tab */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Academic Settings Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Academic Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Start</label>
                  <input
                    type="date"
                    name="academic_year_start"
                    value={formData.academic_year_start}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year End</label>
                  <input
                    type="date"
                    name="academic_year_end"
                    value={formData.academic_year_end}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Start Month</label>
                  <select
                    name="session_start_month"
                    value={formData.session_start_month}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session End Month</label>
                  <select
                    name="session_end_month"
                    value={formData.session_end_month}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Examination Settings Tab */}
          {activeTab === 'examination' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Examination Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    name="exam_type"
                    value={formData.exam_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="grading">Grading System</option>
                    <option value="percentage">Percentage System</option>
                    <option value="cgpa">CGPA System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                  <select
                    name="grading_system"
                    value={formData.grading_system}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Percentage (0-100)</option>
                    <option value="letter_grade">Letter Grade (A-F)</option>
                    <option value="cgpa">CGPA (0-10)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Percentage</label>
                  <input
                    type="number"
                    name="passing_percentage"
                    value={formData.passing_percentage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fees Settings Tab */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Fees Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Reminder Days (Before Due)</label>
                  <input
                    type="number"
                    name="fee_reminder_days"
                    value={formData.fee_reminder_days}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Charges (%)</label>
                  <input
                    type="number"
                    name="late_fee_charges"
                    value={formData.late_fee_charges}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fine After Days</label>
                  <input
                    type="number"
                    name="fine_after_days"
                    value={formData.fine_after_days}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Communication Settings Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Communication Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">SMS Notifications</span>
                    <p className="text-sm text-gray-500">Send SMS alerts for events, fees, attendance</p>
                  </div>
                  <input
                    type="checkbox"
                    name="sms_enabled"
                    checked={formData.sms_enabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">Email Notifications</span>
                    <p className="text-sm text-gray-500">Send email alerts for important updates</p>
                  </div>
                  <input
                    type="checkbox"
                    name="email_enabled"
                    checked={formData.email_enabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">Notice Board</span>
                    <p className="text-sm text-gray-500">Enable notice board for announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    name="notice_board_enabled"
                    checked={formData.notice_board_enabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">Parent Portal</span>
                    <p className="text-sm text-gray-500">Allow parents to access student information</p>
                  </div>
                  <input
                    type="checkbox"
                    name="parent_portal_enabled"
                    checked={formData.parent_portal_enabled}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {renderSelectOptions(masterData.timezones, 'Select timezone')}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select
                    name="date_format"
                    value={formData.date_format}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {renderSelectOptions(masterData.languages, 'Select language')}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (Days)</label>
                  <input
                    type="number"
                    name="password_expiry_days"
                    value={formData.password_expiry_days}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="30"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                  <input
                    type="number"
                    name="max_login_attempts"
                    value={formData.max_login_attempts}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="3"
                    max="10"
                  />
                </div>
              </div>
              
              <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-700">Two-Factor Authentication</span>
                  <p className="text-sm text-gray-500">Enable 2FA for admin accounts</p>
                </div>
                <input
                  type="checkbox"
                  name="two_factor_auth"
                  checked={formData.two_factor_auth}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600"
                />
              </label>
            </div>
          )}

          {/* Social Media Settings Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Social Media Links</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                  <input
                    type="url"
                    name="facebook_url"
                    value={formData.facebook_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://facebook.com/school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                  <input
                    type="url"
                    name="twitter_url"
                    value={formData.twitter_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://twitter.com/school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://linkedin.com/school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://instagram.com/school"
                  />
                </div>
              </div>
            </div>
          )}

          {/* About Settings Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">About School</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About School</label>
                <textarea
                  name="about_school"
                  value={formData.about_school}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Write about your school's history, achievements, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
                <textarea
                  name="mission"
                  value={formData.mission}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="School's mission statement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vision</label>
                <textarea
                  name="vision"
                  value={formData.vision}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="School's vision statement"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchoolSettings;
