import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import AcademicYearManager from '../components/Academic/AcademicYearManager';
import FeeStructureManager from '../components/FeeStructureManager';
import ExaminationManager from '../components/Examination/ExaminationManager';
import DepartmentManager from '../components/Academic/DepartmentManager';

interface SchoolProfile {
  // Basic Information
  business_name: string;
  school_code: string;
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

interface MasterData {
  affiliationBoards: any[];
  schoolTypes: any[];
  genders: any[];
  timezones: any[];
  languages: any[];
}

const SchoolSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // School Profile Loading States
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const [masterDataFetched, setMasterDataFetched] = useState(false);
  const [openedCards, setOpenedCards] = useState<string[]>([]);
  
  // School Profile State
  const [profile, setProfile] = useState<SchoolProfile>({
    business_name: '',
    school_code: '',
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
    country: 'India',
    pincode: '',
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
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    instagram_url: '',
    about_school: '',
    mission: '',
    vision: '',
  });

  const [masterData, setMasterData] = useState<MasterData>({
    affiliationBoards: [],
    schoolTypes: [],
    genders: [],
    timezones: [],
    languages: [],
  });

  const loadProfileAndMasterData = async () => {
    if (profileFetched && masterDataFetched) return;
    
    setProfileLoading(true);
    try {
      const promises = [];
      if (!profileFetched) {
        promises.push(fetchSchoolProfile());
      }
      if (!masterDataFetched) {
        promises.push(fetchMasterData());
      }
      await Promise.all(promises);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      const response = await api.get('/school/settings');
      if (response.data.success) {
        setProfile(response.data.data);
        setProfileFetched(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
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

      const convertToArray = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'object' && data !== null) {
          return Object.entries(data).map(([value, label]) => ({
            value: value,
            label: label as string
          }));
        }
        return [];
      };

      const boards = results[0].status === 'fulfilled' 
        ? convertToArray(results[0].value?.data?.data || results[0].value?.data || {}) 
        : [];
      
      const types = results[1].status === 'fulfilled' 
        ? convertToArray(results[1].value?.data?.data || results[1].value?.data || {}) 
        : [];
      
      const genders = results[2].status === 'fulfilled' 
        ? convertToArray(results[2].value?.data?.data || results[2].value?.data || {}) 
        : [];
      
      const timezones = results[3].status === 'fulfilled' 
        ? (Array.isArray(results[3].value?.data?.data) ? results[3].value?.data?.data : []) 
        : [];
      
      const languages = results[4].status === 'fulfilled' 
        ? (Array.isArray(results[4].value?.data?.data) ? results[4].value?.data?.data : []) 
        : [];

      setMasterData({
        affiliationBoards: boards,
        schoolTypes: types,
        genders: genders,
        timezones: timezones,
        languages: languages,
      });
      setMasterDataFetched(true);
    } catch (error) {
      console.error('Error fetching master data:', error);
      throw error;
    }
  };

  const handleCardClick = (cardId: string) => {
    const isClosing = activeCard === cardId;
    setActiveCard(isClosing ? null : cardId);
    
    if (!isClosing) {
      if (!openedCards.includes(cardId)) {
        setOpenedCards(prev => [...prev, cardId]);
      }
      if (cardId === 'profile') {
        loadProfileAndMasterData();
      }
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const submitData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            submitData.append(key, value ? '1' : '0');
          } else {
            submitData.append(key, String(value));
          }
        }
      });
      
      const response = await api.post('/school/settings', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success('Profile saved successfully!');
        setActiveCard(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addFeeStructure = async () => {
    if (!newFeeStructure.class_name || !newFeeStructure.fee_head || !newFeeStructure.amount) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const response = await api.post('/school/fee-structures', newFeeStructure);
      if (response.data.success) {
        toast.success('Fee structure added successfully');
        setFeeStructures([...feeStructures, response.data.data]);
        setNewFeeStructure({ class_name: '', fee_head: '', amount: 0, frequency: 'monthly' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add fee structure');
    }
  };

  const addExamination = async () => {
    if (!newExamination.exam_name || !newExamination.exam_type) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const response = await api.post('/school/examinations', newExamination);
      if (response.data.success) {
        toast.success('Examination added successfully');
        setExaminations([...examinations, response.data.data]);
        setNewExamination({ exam_name: '', exam_type: '', max_marks: 100, passing_marks: 33, term: 'first' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add examination');
    }
  };

  const cards = [
    { id: 'profile', title: 'School Profile', icon: '🏫', description: 'Manage school school profile', color: 'bg-[#558fed]' },
    { id: 'academic', title: 'Academic Years', icon: '📅', description: 'Manage academic sessions', color: 'bg-[#4e74b1]' },
    { id: 'fee', title: 'Fee Structure', icon: '💰', description: 'Manage fee categories', color: 'bg-[#b4a67a]' },
    { id: 'exam', title: 'Examination System', icon: '📝', description: 'Manage exam settings', color: 'bg-[#9889a5]' },
    { id: 'department', title: 'Departments', icon: '🏢', description: 'Manage school departments', color: 'bg-[#4ca1af]' },
  ];

  const profileTabs = [
    { id: 'general', name: 'General', icon: '🏫' },
    { id: 'address', name: 'Address', icon: '📍' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'security', name: 'Security', icon: '🔐' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
  ];

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
    <div className="space-y-6">
      {/* Cards Grid - Ultra Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`bg-white rounded-xl shadow-sm p-2 sm:p-2.5 text-center transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-98 ${
              activeCard === card.id ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${card.color} rounded-lg flex items-center justify-center text-sm sm:text-base mx-auto mb-1`}>
              {card.icon}
            </div>
            <h3 className="text-[11px] sm:text-xs font-bold text-gray-800">{card.title}</h3>
            <p className="text-gray-500 text-[9px] sm:text-[10px] mt-0.5 hidden sm:block leading-tight">{card.description}</p>
          </button>
        ))}
      </div>

      {/* ========== SCHOOL PROFILE SECTION (With Tabs) ========== */}
      {openedCards.includes('profile') && (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${activeCard === 'profile' ? '' : 'hidden'}`}>
          {/* Header with Close Button */}
          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[#558fed] to-[#87a1d9] text-white">
            <div>
              <h2 className="text-[14px] font-semibold">School Profile</h2>
            </div>
            <button 
              onClick={() => setActiveCard(null)}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                <p className="mt-2 text-xs text-gray-500">Loading profile...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto px-4">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveProfileTab(tab.id)}
                className={`px-3 py-2 text-[12px] font-medium transition whitespace-nowrap ${
                  activeProfileTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1 text-[13px]">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          <div className="p-3">
            {/* General Tab */}
            {activeProfileTab === 'general' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">School Name *</label>
                  <input type="text" name="business_name" value={profile.business_name} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">School Code *</label>
                  <input type="text" name="school_code" value={profile.school_code} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Registration Number</label>
                  <input type="text" name="registration_number" value={profile.registration_number} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Tax Number (GST/PAN)</label>
                  <input type="text" name="tax_number" value={profile.tax_number} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Email</label>
                  <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg bg-gray-50 h-7.5 outline-none" disabled />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Phone Number</label>
                  <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Mobile Number</label>
                  <input type="tel" name="mobile" value={profile.mobile} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Website</label>
                  <input type="url" name="website" value={profile.website} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="https://www.school.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Established Year</label>
                  <input type="text" name="established_year" value={profile.established_year} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="2024" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Affiliation Board</label>
                  <select name="affiliation_board" value={profile.affiliation_board} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    <option value="">Select Board</option>
                    {renderSelectOptions(masterData.affiliationBoards, 'No boards available')}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">School Type</label>
                  <select name="school_type" value={profile.school_type} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    {renderSelectOptions(masterData.schoolTypes, 'Select school type')}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Gender Type</label>
                  <select name="gender_type" value={profile.gender_type} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    {renderSelectOptions(masterData.genders, 'Select gender type')}
                  </select>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeProfileTab === 'address' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Address</label>
                  <textarea name="address" value={profile.address} onChange={handleProfileChange} rows={1} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">City</label>
                  <input type="text" name="city" value={profile.city} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">State</label>
                  <input type="text" name="state" value={profile.state} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Country</label>
                  <input type="text" name="country" value={profile.country} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg bg-gray-50 h-7.5 outline-none" readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Pincode</label>
                  <input type="text" name="pincode" value={profile.pincode} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" />
                </div>
              </div>
            )}

            {/* Communication Tab */}
            {activeProfileTab === 'communication' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">SMS Alerts</span>
                    <p className="text-[9px] text-gray-400">Enable SMS notifications</p>
                  </div>
                  <input type="checkbox" name="sms_enabled" checked={profile.sms_enabled} onChange={handleProfileChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">Email Alerts</span>
                    <p className="text-[9px] text-gray-400">Enable email notifications</p>
                  </div>
                  <input type="checkbox" name="email_enabled" checked={profile.email_enabled} onChange={handleProfileChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">Notice Board</span>
                    <p className="text-[9px] text-gray-400">Enable notice boards</p>
                  </div>
                  <input type="checkbox" name="notice_board_enabled" checked={profile.notice_board_enabled} onChange={handleProfileChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">Parent Portal</span>
                    <p className="text-[9px] text-gray-400">Enable parent access</p>
                  </div>
                  <input type="checkbox" name="parent_portal_enabled" checked={profile.parent_portal_enabled} onChange={handleProfileChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                </label>
              </div>
            )}

            {/* Security Tab */}
            {activeProfileTab === 'security' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3.5 gap-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Timezone</label>
                  <select name="timezone" value={profile.timezone} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    {renderSelectOptions(masterData.timezones, 'Select timezone')}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Date Format</label>
                  <select name="date_format" value={profile.date_format} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Language</label>
                  <select name="language" value={profile.language} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition">
                    {renderSelectOptions(masterData.languages, 'Select language')}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Password Expiry (Days)</label>
                  <input type="number" name="password_expiry_days" value={profile.password_expiry_days} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" min="30" max="365" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Max Login Attempts</label>
                  <input type="number" name="max_login_attempts" value={profile.max_login_attempts} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" min="3" max="10" />
                </div>
                <label className="flex items-center justify-between p-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">Two-Factor Auth</span>
                    <p className="text-[9px] text-gray-400">Enable 2FA security</p>
                  </div>
                  <input type="checkbox" name="two_factor_auth" checked={profile.two_factor_auth} onChange={handleProfileChange} className="w-3.5 h-3.5 text-blue-600 rounded" />
                </label>
              </div>
            )}

            {/* Social Media Tab */}
            {activeProfileTab === 'social' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Facebook URL</label>
                  <input type="url" name="facebook_url" value={profile.facebook_url} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="https://facebook.com/school" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Twitter URL</label>
                  <input type="url" name="twitter_url" value={profile.twitter_url} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="https://twitter.com/school" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">LinkedIn URL</label>
                  <input type="url" name="linkedin_url" value={profile.linkedin_url} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="https://linkedin.com/school" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Instagram URL</label>
                  <input type="url" name="instagram_url" value={profile.instagram_url} onChange={handleProfileChange} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white h-7.5 outline-none transition" placeholder="https://instagram.com/school" />
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeProfileTab === 'about' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3.5 gap-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">About School</label>
                  <textarea name="about_school" value={profile.about_school} onChange={handleProfileChange} rows={2} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white outline-none transition" placeholder="School's history, achievements, etc." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Mission</label>
                  <textarea name="mission" value={profile.mission} onChange={handleProfileChange} rows={2} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white outline-none transition" placeholder="School's mission statement" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Vision</label>
                  <textarea name="vision" value={profile.vision} onChange={handleProfileChange} rows={2} className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white outline-none transition" placeholder="School's vision statement" />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t">
              <button onClick={() => setActiveCard(null)} className="px-3 py-1 text-[11.5px] border rounded-lg text-gray-700 hover:bg-gray-50 transition active:scale-95">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="px-4 py-1 text-[11.5px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition active:scale-95">{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* ========== ACADEMIC YEARS SECTION ========== */}
      {openedCards.includes('academic') && (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${activeCard === 'academic' ? '' : 'hidden'}`}>
          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[#4e74b1] to-[#93a6d0] text-white">
            <div>
              <h2 className="text-[14px] font-semibold">Academic Years</h2>
            </div>
            <button 
              onClick={() => setActiveCard(null)}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-3 overflow-visible">
            <AcademicYearManager onClose={() => setActiveCard(null)} />
          </div>
        </div>
      )}

      {/* ========== FEE STRUCTURE SECTION ========== */}
      {openedCards.includes('fee') && (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${activeCard === 'fee' ? '' : 'hidden'}`}>
          <div className="px-4 py-3 bg-gradient-to-r from-[#b4a67a] to-[#b7a275] text-white flex justify-between items-center">
            <div>
              <h2 className="text-[14px] font-semibold">Fee Structure</h2>
            </div>
            <button onClick={() => setActiveCard(null)} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-3 overflow-visible">
            <FeeStructureManager />
          </div>
        </div>
      )}

      {/* ========== EXAMINATION SYSTEM SECTION ========== */}
      {openedCards.includes('exam') && (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${activeCard === 'exam' ? '' : 'hidden'}`}>
          <div className="px-4 py-3 bg-gradient-to-r from-[#9889a5] to-[#ae8ace] text-white flex justify-between items-center">
            <div>
              <h2 className="text-[14px] font-semibold">Examination System</h2>
            </div>
            <button onClick={() => setActiveCard(null)} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-3 overflow-visible">
            <ExaminationManager />
          </div>
        </div>
      )}

      {/* ========== DEPARTMENTS SECTION ========== */}
      {openedCards.includes('department') && (
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${activeCard === 'department' ? '' : 'hidden'}`}>
          <div className="px-4 py-3 bg-gradient-to-r from-[#4ca1af] to-[#2c3e50] text-white flex justify-between items-center">
            <div>
              <h2 className="text-[14px] font-semibold">Departments</h2>
            </div>
            <button onClick={() => setActiveCard(null)} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-3 overflow-visible">
            <DepartmentManager />
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SchoolSettings;