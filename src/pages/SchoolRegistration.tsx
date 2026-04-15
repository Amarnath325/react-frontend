import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

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
  latitude: string;
  longitude: string;
  
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

const SchoolRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [affiliationFile, setAffiliationFile] = useState<File | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const affiliationInputRef = useRef<HTMLInputElement>(null);
  const registrationInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<SchoolFormData>({
    school_name: '',
    school_code: '',
    established_year: '',
    school_type: 'day',
    management_type: 'private',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    full_address: '',
    latitude: '',
    longitude: '',
    contact_number: '',
    email: '',
    website: '',
    affiliation_board: 'CBSE',
    affiliation_number: '',
    affiliation_status: 'pending',
    classes_available: [],
    streams_available: [],
    medium_of_instruction: ['english'],
    has_labs: false,
    has_library: false,
    has_sports: false,
    has_hostel: false,
    has_transport: false,
    subscription_plan: 'free',
    about_school: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof SchoolFormData] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [name]: newValues
      };
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          submitData.append(key, JSON.stringify(value));
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
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">School Registration</h1>
          <p className="text-gray-600 mt-2">Join our platform and manage your school efficiently</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              'Basic Info', 'Location', 'Contact', 'Affiliation', 
              'Academic', 'Infrastructure', 'Subscription', 'Documents'
            ].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep > index + 1 ? 'bg-green-500 text-white' :
                    currentStep === index + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 hidden sm:block">{label}</span>
                </div>
                {index < 7 && <div className={`w-12 h-1 mx-2 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {/* Step 1: Basic School Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">🏫</span> Basic School Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="school_name"
                        value={formData.school_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Delhi Public School"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Code/ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="school_code"
                        value={formData.school_code}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., DPS2024"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Established Year
                      </label>
                      <input
                        type="number"
                        name="established_year"
                        value={formData.established_year}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2024"
                        min="1900"
                        max="2024"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="school_type"
                        value={formData.school_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="day">Day School</option>
                        <option value="boarding">Boarding School</option>
                        <option value="day_boarding">Day & Boarding</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Management Type
                      </label>
                      <select
                        name="management_type"
                        value={formData.management_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="private">Private</option>
                        <option value="government">Government</option>
                        <option value="aided">Aided</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📍</span> Location Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Delhi"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City/District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., New Delhi"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pin Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="110001"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="full_address"
                        value={formData.full_address}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Complete address with landmark"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude (Optional)
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="28.6139"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude (Optional)
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="77.2090"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📞</span> Contact Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="011-12345678"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="school@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://www.school.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Affiliation Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📘</span> Affiliation Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affiliation Board
                      </label>
                      <select
                        name="affiliation_board"
                        value={formData.affiliation_board}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="CBSE">CBSE - Central Board of Secondary Education</option>
                        <option value="ICSE">ICSE - Council for Indian School Certificate</option>
                        <option value="State Board">State Board</option>
                        <option value="IB">IB - International Baccalaureate</option>
                        <option value="Cambridge">Cambridge International</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affiliation Number
                      </label>
                      <input
                        type="text"
                        name="affiliation_number"
                        value={formData.affiliation_number}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., 2130124"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affiliation Status
                      </label>
                      <select
                        name="affiliation_status"
                        value={formData.affiliation_status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Academic Structure */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">🎓</span> Academic Structure
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Classes Available
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {['Nursery', 'KG', '1-5', '6-8', '9-10', '11-12'].map(cls => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleMultiSelect('classes_available', cls)}
                            className={`px-3 py-2 text-sm rounded-lg border transition ${
                              formData.classes_available.includes(cls)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:border-blue-400'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Streams Available (11-12)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Science', 'Commerce', 'Arts', 'Vocational'].map(stream => (
                          <button
                            key={stream}
                            type="button"
                            onClick={() => handleMultiSelect('streams_available', stream)}
                            className={`px-3 py-2 text-sm rounded-lg border transition ${
                              formData.streams_available.includes(stream)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:border-blue-400'
                            }`}
                          >
                            {stream}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medium of Instruction
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Other'].map(medium => (
                          <button
                            key={medium}
                            type="button"
                            onClick={() => handleMultiSelect('medium_of_instruction', medium.toLowerCase())}
                            className={`px-3 py-2 text-sm rounded-lg border transition ${
                              formData.medium_of_instruction.includes(medium.toLowerCase())
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:border-blue-400'
                            }`}
                          >
                            {medium}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Infrastructure Details */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">🏢</span> Infrastructure Details
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'has_labs', label: '🧪 Labs Available' },
                      { key: 'has_library', label: '📚 Library Available' },
                      { key: 'has_sports', label: '⚽ Sports Facilities' },
                      { key: 'has_hostel', label: '🏠 Hostel Facility' },
                      { key: 'has_transport', label: '🚌 Transport Facility' },
                    ].map(facility => (
                      <label key={facility.key} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          name={facility.key}
                          checked={formData[facility.key as keyof SchoolFormData] as boolean}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{facility.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Subscription Plan */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">💳</span> Subscription Plan
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'free', name: 'Free', price: '₹0', features: ['Basic Features', 'Up to 100 Students', 'Email Support'] },
                      { value: 'basic', name: 'Basic', price: '₹999/mo', features: ['All Free Features', 'Up to 500 Students', 'Priority Support', 'Reports'] },
                      { value: 'premium', name: 'Premium', price: '₹2499/mo', features: ['All Basic Features', 'Unlimited Students', '24/7 Support', 'Advanced Analytics', 'SMS Integration'] },
                    ].map(plan => (
                      <label
                        key={plan.value}
                        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.subscription_plan === plan.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subscription_plan"
                          value={plan.value}
                          checked={formData.subscription_plan === plan.value}
                          onChange={handleChange}
                          className="absolute top-4 right-4 w-4 h-4 text-blue-600"
                        />
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{plan.price}</p>
                        <ul className="mt-4 space-y-2">
                          {plan.features.map(feature => (
                            <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8: Documents & Media Upload */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📄</span> Documents & Media
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        accept="image/*"
                        className="hidden"
                      />
                      {logoPreview ? (
                        <div className="space-y-3">
                          <img src={logoPreview} alt="Logo" className="w-32 h-32 object-contain mx-auto" />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Change Logo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
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
                    
                    {/* Gallery Images */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        ref={galleryInputRef}
                        onChange={handleGalleryUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="space-y-2"
                      >
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">Upload Gallery Images</p>
                        <p className="text-xs text-gray-400">Multiple images allowed</p>
                      </button>
                      {galleryPreviews.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {galleryPreviews.map((preview, idx) => (
                            <img key={idx} src={preview} alt={`Gallery ${idx}`} className="w-16 h-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Affiliation Certificate */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        ref={affiliationInputRef}
                        onChange={(e) => handleFileUpload(e, 'affiliation')}
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => affiliationInputRef.current?.click()}
                        className="space-y-2"
                      >
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">Affiliation Certificate</p>
                        {affiliationFile && <p className="text-xs text-green-600">✓ File selected</p>}
                      </button>
                    </div>
                    
                    {/* Registration Certificate */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        ref={registrationInputRef}
                        onChange={(e) => handleFileUpload(e, 'registration')}
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => registrationInputRef.current?.click()}
                        className="space-y-2"
                      >
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">School Registration Certificate</p>
                        {registrationFile && <p className="text-xs text-green-600">✓ File selected</p>}
                      </button>
                    </div>
                  </div>
                  
                  {/* About School */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About School
                    </label>
                    <textarea
                      name="about_school"
                      value={formData.about_school}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about your school's mission, vision, achievements..."
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div className="px-6 sm:px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${currentStep === 1 ? 'w-full sm:w-auto' : 'sm:ml-auto'}`}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? 'Registering...' : '✓ Complete Registration'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistration;