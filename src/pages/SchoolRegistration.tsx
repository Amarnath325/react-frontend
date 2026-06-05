import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { masterService } from '../services/master';
import type { MasterOption, RegistrationOptions } from '../services/master';
import Select from 'react-select';

// Types
interface SchoolFormData {
  // Basic School Information
  school_name: string;
  school_code: string;
  established_year: string;
  school_type: string;
  management_type: string;
  
  // Location Details
  country: string;
  state: string;
  city: string;
  pincode: string;
  full_address: string;
  
  // Contact Details
  contact_number: string;
  email: string;
  website: string;
  
  // Affiliation Details
  affiliation_board: string;
  affiliation_number: string;
  affiliation_status: string;
  
  // Academic Structure
  classes_available: string[];
  streams_available: string[];
  medium_of_instruction: string[];
  
  // Infrastructure Details
  has_labs: boolean;
  has_library: boolean;
  has_sports: boolean;
  has_hostel: boolean;
  has_transport: boolean;
  
  // Subscription Plan
  subscription_plan: string;
  
  // About School
  about_school: string;
}

// Custom Select Styles
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.selectProps.hasError 
      ? '#ef4444' // red-500
      : state.isFocused 
        ? '#3b82f6' 
        : '#d1d5db',
    boxShadow: state.selectProps.hasError
      ? '0 0 0 2px rgba(239, 68, 68, 0.15)'
      : state.isFocused 
        ? '0 0 0 2px rgba(59, 130, 246, 0.15)' 
        : 'none',
    minHeight: '38px',
    backgroundColor: state.selectProps.hasError ? '#fef2f2' : '#ffffff',
    borderColorHover: state.selectProps.hasError
      ? '#ef4444'
      : state.isFocused
        ? '#3b82f6'
        : '#d1d5db',
    '&:hover': {
      borderColor: state.selectProps.hasError
        ? '#ef4444'
        : state.isFocused
          ? '#3b82f6'
          : '#9ca3af',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '2px 12px',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '14px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '14px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '14px',
    color: '#111827',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '14px',

    padding: '8px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    marginTop: '4px',
    zIndex: 9999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  menuList: (base: any) => ({
    ...base,
    maxHeight: '180px',
    overflowY: 'auto',
  }),
};

interface SearchableSelectProps {
  options: MasterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  hasError?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = '',
  hasError = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected) => onChange(selected ? selected.value : '')}
        placeholder={placeholder}
        styles={customSelectStyles}
        isSearchable
        className="text-sm"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        hasError={hasError}
      />
    </div>
  );
};

const SchoolRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [affiliationFile, setAffiliationFile] = useState<File | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  
  // Master Data States
  const [schoolTypes, setSchoolTypes] = useState<MasterOption[]>([]);
  const [managementTypes, setManagementTypes] = useState<MasterOption[]>([]);
  const [affiliationBoards, setAffiliationBoards] = useState<MasterOption[]>([]);
  const [affiliationStatuses, setAffiliationStatuses] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [streams, setStreams] = useState<MasterOption[]>([]);
  const [mediums, setMediums] = useState<MasterOption[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<MasterOption[]>([]);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const affiliationInputRef = useRef<HTMLInputElement>(null);
  const registrationInputRef = useRef<HTMLInputElement>(null);
  const toastShownRef = useRef<string>('');
  
  const [formData, setFormData] = useState<SchoolFormData>({
    school_name: '',
    school_code: '',
    established_year: '',
    school_type: '',
    management_type: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    full_address: '',
    contact_number: '',
    email: '',
    website: '',
    affiliation_board: '',
    affiliation_number: '',
    affiliation_status: '',
    classes_available: [],
    streams_available: [],
    medium_of_instruction: [],
    has_labs: false,
    has_library: false,
    has_sports: false,
    has_hostel: false,
    has_transport: false,
    subscription_plan: 'free',
    about_school: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        const options = await masterService.getRegistrationOptions();
        if (options) {
          setSchoolTypes(options.school_types);
          setManagementTypes(options.management_types);
          setAffiliationBoards(options.affiliation_boards);
          setAffiliationStatuses(options.affiliation_statuses);
          setClasses(options.classes);
          setStreams(options.streams);
          setMediums(options.mediums);
          setSubscriptionPlans(options.subscription_plans);
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
        toast.error('Failed to load form data');
        setSchoolTypes([]);
        setManagementTypes([]);
        setAffiliationBoards([]);
        setAffiliationStatuses([]);
        setClasses([]);
        setStreams([]);
        setMediums([]);
        setSubscriptionPlans([]);
      } finally {
        setLoadingMaster(false);
      }
    };
    
    fetchMasterData();
  }, []);

  // Prevent background body scrolling on mount, restore on unmount
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectChange = (name: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    setFormData(prev => ({
      ...prev,
      established_year: value
    }));

    if (errors.established_year) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.established_year;
        return next;
      });
    }
    
    if (value.length === 4) {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      
      if (year < 1800) {
        if (toastShownRef.current !== 'year-validation-min') {
          toast.error('Year must be 1800 or later');
          toastShownRef.current = 'year-validation-min';
          setTimeout(() => { toastShownRef.current = ''; }, 3000);
        }
      } else if (year > currentYear) {
        if (toastShownRef.current !== 'year-validation-max') {
          toast.error(`Year cannot be greater than ${currentYear}`);
          toastShownRef.current = 'year-validation-max';
          setTimeout(() => { toastShownRef.current = ''; }, 3000);
        }
      }
    }
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof SchoolFormData] as string[];
      let newValues: string[];
      
      if (name === 'classes_available') {
        const targetClass = classes.find(c => String(c.value) === String(value));
        const isPrePrimary = targetClass && ['nursery', 'lkg', 'ukg'].includes(targetClass.label.toLowerCase());
        
        if (isPrePrimary) {
          // Toggle pre-primary classes individually
          newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        } else {
          // Standard classes (Class 1 to 12) auto-select range logic
          const prePrimaryValues = classes.filter(c => ['nursery', 'lkg', 'ukg'].includes(c.label.toLowerCase())).map(c => c.value);
          const standardClasses = classes.filter(c => !['nursery', 'lkg', 'ukg'].includes(c.label.toLowerCase()));
          const targetStdIndex = standardClasses.findIndex(c => String(c.value) === String(value));
          
          if (targetStdIndex !== -1) {
            const currentPrePrimarySelected = currentValues.filter(v => prePrimaryValues.includes(v));
            const stdValuesToSelect = standardClasses.slice(0, targetStdIndex + 1).map(c => c.value);
            newValues = [...currentPrePrimarySelected, ...stdValuesToSelect];
          } else {
            newValues = currentValues.includes(value)
              ? currentValues.filter(v => v !== value)
              : [...currentValues, value];
          }
        }
      } else {
        newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
      }
      
      return {
        ...prev,
        [name]: newValues
      };
    });

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (type === 'logo') {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (type === 'affiliation') {
      setAffiliationFile(file);
    } else if (type === 'registration') {
      setRegistrationFile(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles([...galleryFiles, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && currentStep < 8) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            submitData.append(`${key}[]`, item);
          });
        } else if (typeof value === 'boolean') {
          submitData.append(key, value ? '1' : '0');
        } else {
          submitData.append(key, String(value));
        }
      });
      
      if (logoFile) submitData.append('logo', logoFile);
      if (affiliationFile) submitData.append('affiliation_certificate', affiliationFile);
      if (registrationFile) submitData.append('registration_certificate', registrationFile);
      galleryFiles.forEach(file => {
        submitData.append('gallery_images[]', file);
      });
      
      const response = await api.post('/school/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data) {
        toast.success('School registered successfully!');
        
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('school', JSON.stringify(response.data.school));
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.school_name.trim()) newErrors.school_name = 'School Name is required';
        if (!formData.school_code.trim()) newErrors.school_code = 'School Code is required';
        if (!formData.school_type.trim()) newErrors.school_type = 'School Type is required';
        if (!formData.management_type.trim()) newErrors.management_type = 'Management Type is required';
        break;
      case 2:
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Pin Code is required';
        if (!formData.full_address.trim()) newErrors.full_address = 'Full Address is required';
        break;
      case 3:
        if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact Number is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Valid Email is required';
        }
        break;
      case 4:
        if (!formData.affiliation_board.trim()) newErrors.affiliation_board = 'Affiliation Board is required';
        if (!formData.affiliation_number.trim()) newErrors.affiliation_number = 'Affiliation Number is required';
        if (!formData.affiliation_status.trim()) newErrors.affiliation_status = 'Affiliation Status is required';
        break;
      case 5:
        if (formData.classes_available.length === 0) newErrors.classes_available = 'Select at least one class';
        if (formData.medium_of_instruction.length === 0) newErrors.medium_of_instruction = 'Select at least one medium';
        break;
      case 6:
        break;
      case 7:
        if (!formData.subscription_plan.trim()) newErrors.subscription_plan = 'Select a subscription plan';
        break;
      case 8:
        break;
    }

    setErrors(newErrors);

    const firstError = Object.values(newErrors)[0];
    if (firstError) {
      const errorKey = `step-${currentStep}-${firstError}`;
      if (toastShownRef.current !== errorKey) {
        toast.error(firstError);
        toastShownRef.current = errorKey;
        setTimeout(() => { toastShownRef.current = ''; }, 3000);
      }
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loadingMaster) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-[13px] text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col p-2 sm:p-3 font-sans">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full min-h-0">
        
        {/* Header */}
        <div className="text-center mb-1 flex-shrink-0 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg mb-1 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight leading-none">School Registration</h1>
          <p className="text-[9px] text-gray-500 mt-0.5">Join our platform and manage your school efficiently</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-1.5 overflow-x-auto flex-shrink-0 bg-white/60 backdrop-blur-md p-1.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex min-w-max justify-center">
            {['Basic', 'Location', 'Contact', 'Affiliation', 'Academic', 'Infra', 'Plan', 'Docs'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10.5px] font-semibold transition-all duration-200 ${
                    currentStep > index + 1 ? 'bg-green-500 text-white' :
                    currentStep === index + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-100 font-bold' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className="text-[10.5px] mt-0.5 font-medium text-gray-500 hidden sm:block">{label}</span>
                </div>
                {index < 7 && <div className={`w-5 sm:w-8 h-0.5 mx-1 sm:mx-1.5 rounded ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3 min-h-0">
            
            {/* Step 1: Basic School Information */}
            {currentStep === 1 && (
              <div className="space-y-3.5 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-2.5">
                  <span className="text-blue-600 text-lg">🏫</span> Basic School Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">School Name <span className="text-red-500">*</span></label>
                    <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.school_name ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="e.g., Delhi Public School" />
                    {errors.school_name && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.school_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">School Code/ID <span className="text-red-500">*</span></label>
                    <input type="text" name="school_code" value={formData.school_code} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.school_code ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="e.g., DPS2024" />
                    {errors.school_code && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.school_code}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">School Type <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={schoolTypes}
                      value={formData.school_type}
                      onChange={(value) => handleSelectChange('school_type', value)}
                      placeholder="Select School Type"
                      hasError={!!errors.school_type}
                    />
                    {errors.school_type && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.school_type}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Management Type <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={managementTypes}
                      value={formData.management_type}
                      onChange={(value) => handleSelectChange('management_type', value)}
                      placeholder="Select Management Type"
                      hasError={!!errors.management_type}
                    />
                    {errors.management_type && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.management_type}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Established Year</label>
                    <input type="text" name="established_year" value={formData.established_year} onChange={handleYearChange} maxLength={4} className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150 bg-white" placeholder="2024" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-3">
                  <span className="text-blue-600 text-lg">📍</span> Location Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.state ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="e.g., Delhi" />
                    {errors.state && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Pin Code <span className="text-red-500">*</span></label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.pincode ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="110001" />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.pincode}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">City/District <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.city ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="e.g., New Delhi" />
                    {errors.city && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.city}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Full Address <span className="text-red-500">*</span></label>
                    <textarea name="full_address" value={formData.full_address} onChange={handleChange} required rows={2} className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.full_address ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="Complete address with landmark" />
                    {errors.full_address && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.full_address}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-3">
                  <span className="text-blue-600 text-lg">📞</span> Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">School Contact Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.contact_number ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="011-12345678" />
                    {errors.contact_number && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.contact_number}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.email ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="school@example.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Website (Optional)</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150 bg-white" placeholder="https://www.school.com" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Affiliation Details */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-3">
                  <span className="text-blue-600 text-lg">📘</span> Affiliation Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Affiliation Board <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={affiliationBoards}
                      value={formData.affiliation_board}
                      onChange={(value) => handleSelectChange('affiliation_board', value)}
                      placeholder="Select Affiliation Board"
                      hasError={!!errors.affiliation_board}
                    />
                    {errors.affiliation_board && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.affiliation_board}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Affiliation Number <span className="text-red-500">*</span></label>
                    <input type="text" name="affiliation_number" value={formData.affiliation_number} onChange={handleChange} required className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition duration-150 ${errors.affiliation_number ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 bg-white'}`} placeholder="e.g., 2130124" />
                    {errors.affiliation_number && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.affiliation_number}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Affiliation Status <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={affiliationStatuses}
                      value={formData.affiliation_status}
                      onChange={(value) => handleSelectChange('affiliation_status', value)}
                      placeholder="Select Affiliation Status"
                      hasError={!!errors.affiliation_status}
                    />
                    {errors.affiliation_status && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.affiliation_status}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Academic Structure */}
            {currentStep === 5 && (
              <div className="space-y-3.5 animate-fadeIn">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-100 mb-1.5">
                  <span className="text-blue-600 text-base">🎓</span> Academic Structure
                </h2>
                
                {/* Classes Available */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Classes Available <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-1">
                    {classes.map((cls) => (
                      <button key={cls.value} type="button" onClick={() => handleMultiSelect('classes_available', cls.value)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all duration-150 ${formData.classes_available.includes(cls.value) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : errors.classes_available ? 'border-red-500 text-red-700 bg-red-50/20 hover:border-red-500' : 'border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 bg-white'}`}>
                        {cls.label}
                      </button>
                    ))}
                  </div>
                  {errors.classes_available && <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.classes_available}</p>}
                </div>
                
                {/* Streams Available */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Streams Available (11-12)</label>
                  <div className="flex flex-wrap gap-1">
                    {streams.map((stream) => (
                      <button key={stream.value} type="button" onClick={() => handleMultiSelect('streams_available', stream.value)} className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all duration-150 ${formData.streams_available.includes(stream.value) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 bg-white'}`}>
                        {stream.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Medium of Instruction */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Medium of Instruction <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-1">
                    {mediums.map((medium) => (
                      <button key={medium.value} type="button" onClick={() => handleMultiSelect('medium_of_instruction', medium.value)} className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all duration-150 ${formData.medium_of_instruction.includes(medium.value) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : errors.medium_of_instruction ? 'border-red-500 text-red-700 bg-red-50/20 hover:border-red-500' : 'border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 bg-white'}`}>
                        {medium.label}
                      </button>
                    ))}
                  </div>
                  {errors.medium_of_instruction && <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.medium_of_instruction}</p>}
                </div>
              </div>
            )}

            {/* Step 6: Infrastructure Details */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-3">
                  <span className="text-blue-600 text-lg">🏢</span> Infrastructure Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'has_labs', label: '🧪 Labs Available' },
                    { key: 'has_library', label: '📚 Library Available' },
                    { key: 'has_sports', label: '⚽ Sports Facilities' },
                    { key: 'has_hostel', label: '🏠 Hostel Facility' },
                    { key: 'has_transport', label: '🚌 Transport Facility' },
                  ].map(facility => (
                    <label key={facility.key} className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition duration-150 hover:bg-gray-50 ${formData[facility.key as keyof SchoolFormData] ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200'}`}>
                      <input type="checkbox" name={facility.key} checked={formData[facility.key as keyof SchoolFormData] as boolean} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20" />
                      <span className="text-sm font-medium text-gray-700">{facility.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Subscription Plan */}
            {currentStep === 7 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100 mb-3">
                  <span className="text-blue-600 text-lg">💳</span> Subscription Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <label key={plan.value} className={`relative p-4 border-2 rounded-xl cursor-pointer transition duration-150 ${formData.subscription_plan === plan.value ? 'border-blue-500 bg-blue-50/30' : errors.subscription_plan ? 'border-red-300 hover:border-red-400 bg-red-50/5' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input type="radio" name="subscription_plan" value={plan.value} checked={formData.subscription_plan === plan.value} onChange={handleChange} className="absolute top-3 right-3 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500/20" />
                      <h3 className="text-sm font-bold text-gray-900">{plan.label.split(' - ')[0]}</h3>
                      <p className="text-base font-extrabold text-blue-600 mt-1">{plan.label.includes('₹') ? plan.label.split(' - ')[1] : 'Custom'}</p>
                    </label>
                  ))}
                </div>
                {errors.subscription_plan && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠️</span> {errors.subscription_plan}</p>}
              </div>
            )}

            {/* Step 8: Documents & Media Upload */}
            {currentStep === 8 && (
              <div className="space-y-3 animate-fadeIn">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-100 mb-1.5">
                  <span className="text-blue-600 text-base">📄</span> Documents & Media
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  {/* Logo */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-1.5 hover:bg-blue-50/10 hover:border-blue-400 transition-all duration-150 cursor-pointer flex flex-col justify-center items-center h-20 text-center">
                    <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
                    {logoPreview ? (
                      <div className="space-y-0.5">
                        <img src={logoPreview} alt="Logo" className="w-9 h-9 object-contain mx-auto" />
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="text-blue-600 text-[9px] font-bold hover:text-blue-700 block">Change Logo</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="space-y-0.5 w-full flex flex-col items-center">
                        <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-700">School Logo</p>
                      </button>
                    )}
                  </div>

                  {/* Gallery */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-1.5 hover:bg-blue-50/10 hover:border-blue-400 transition-all duration-150 cursor-pointer flex flex-col justify-center items-center h-20 text-center">
                    <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="space-y-0.5 w-full flex flex-col items-center">
                      <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700">Gallery Images</p>
                    </button>
                    {galleryPreviews.length > 0 && (
                      <div className="mt-0.5 flex gap-0.5 justify-center">
                        {galleryPreviews.slice(0, 3).map((preview, idx) => (
                          <img key={idx} src={preview} alt={`Gallery ${idx}`} className="w-4 h-4 object-cover rounded border" />
                        ))}
                        {galleryPreviews.length > 3 && (
                          <span className="text-[8px] text-gray-500 flex items-center">+{galleryPreviews.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Affiliation Certificate */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-1.5 hover:bg-blue-50/10 hover:border-blue-400 transition-all duration-150 cursor-pointer flex flex-col justify-center items-center h-20 text-center">
                    <input type="file" ref={affiliationInputRef} onChange={(e) => handleFileUpload(e, 'affiliation')} accept=".pdf,.jpg,.png" className="hidden" />
                    <button type="button" onClick={() => affiliationInputRef.current?.click()} className="space-y-0.5 w-full flex flex-col items-center">
                      <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700">Affiliation Doc</p>
                      {affiliationFile && <p className="text-[8px] text-green-600 font-bold truncate max-w-[80px]">✓ Selected</p>}
                    </button>
                  </div>

                  {/* Registration Certificate */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-1.5 hover:bg-blue-50/10 hover:border-blue-400 transition-all duration-150 cursor-pointer flex flex-col justify-center items-center h-20 text-center">
                    <input type="file" ref={registrationInputRef} onChange={(e) => handleFileUpload(e, 'registration')} accept=".pdf,.jpg,.png" className="hidden" />
                    <button type="button" onClick={() => registrationInputRef.current?.click()} className="space-y-0.5 w-full flex flex-col items-center">
                      <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700">Registration Doc</p>
                      {registrationFile && <p className="text-[8px] text-green-600 font-bold truncate max-w-[80px]">✓ Selected</p>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">About School</label>
                  <textarea name="about_school" value={formData.about_school} onChange={handleChange} rows={1} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150 bg-white" placeholder="Tell us about your school's mission, vision, achievements..." />
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-150 flex justify-between gap-3 flex-shrink-0">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition active:scale-98">
                ← Previous
              </button>
            )}
            {currentStep < 8 ? (
              <button type="button" onClick={nextStep} className={`px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition active:scale-98 ${currentStep === 1 ? 'w-full sm:w-auto' : 'sm:ml-auto'}`}>
                Next Step →
              </button>
            ) : (
              <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition active:scale-98 disabled:opacity-50 sm:ml-auto">
                {loading ? 'Registering...' : '✓ Register'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistration;