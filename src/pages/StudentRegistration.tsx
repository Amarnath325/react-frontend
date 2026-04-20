import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

interface StudentFormData {
  // Basic Details
  student_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  age: number;
  blood_group: string;
  category: string;
  religion: string;
  aadhaar_number: string;
  
  // Academic Details
  admission_number: string;
  admission_date: string;
  class_id: string;
  section: string;
  roll_number: string;
  previous_school: string;
  previous_class: string;
  medium: string;
  
  // Contact Details
  mobile_number: string;
  alternate_mobile: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  
  // Parent Details
  father_name: string;
  father_mobile: string;
  father_occupation: string;
  mother_name: string;
  mother_mobile: string;
  mother_occupation: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_mobile: string;
  
  // Emergency Details
  emergency_name: string;
  emergency_number: string;
  emergency_relation: string;
  
  // Medical Details
  medical_conditions: string;
  allergies: string;
  doctor_name: string;
  doctor_contact: string;
  
  // Transport Details
  transport_required: boolean;
  transport_route: string;
  pickup_point: string;
  
  // Hostel Details
  hostel_required: boolean;
  room_number: string;
  
  // Fee Details
  fee_category: string;
  discount: string;
  fee_structure: string;
}

const StudentRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState<StudentFormData>({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    age: 0,
    blood_group: '',
    category: '',
    religion: '',
    aadhaar_number: '',
    admission_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    class_id: '',
    section: '',
    roll_number: '',
    previous_school: '',
    previous_class: '',
    medium: 'english',
    mobile_number: '',
    alternate_mobile: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    father_name: '',
    father_mobile: '',
    father_occupation: '',
    mother_name: '',
    mother_mobile: '',
    mother_occupation: '',
    guardian_name: '',
    guardian_relation: '',
    guardian_mobile: '',
    emergency_name: '',
    emergency_number: '',
    emergency_relation: '',
    medical_conditions: '',
    allergies: '',
    doctor_name: '',
    doctor_contact: '',
    transport_required: false,
    transport_route: '',
    pickup_point: '',
    hostel_required: false,
    room_number: '',
    fee_category: '',
    discount: '',
    fee_structure: '',
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (formData.date_of_birth) {
      calculateAge();
    }
  }, [formData.date_of_birth]);

  const fetchDropdownData = async () => {
    try {
      const [classesRes, routesRes, feeCategoriesRes] = await Promise.all([
        api.get('/master/classes'),
        api.get('/master/transport-routes'),
        api.get('/master/fee-categories'),
      ]);
      setClasses(classesRes.data.data || []);
      setRoutes(routesRes.data.data || []);
      setFeeCategories(feeCategoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const calculateAge = () => {
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setFormData(prev => ({ ...prev, age }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/students', formData);
      if (response.data.success) {
        toast.success('Student registered successfully!');
        setTimeout(() => navigate('/students/all'), 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const steps = [
    { number: 1, title: 'Basic Details', icon: '👤' },
    { number: 2, title: 'Academic', icon: '📚' },
    { number: 3, title: 'Contact', icon: '📞' },
    { number: 4, title: 'Parents', icon: '👨‍👩‍👧' },
    { number: 5, title: 'Emergency', icon: '🚨' },
    { number: 6, title: 'Medical', icon: '🏥' },
    { number: 7, title: 'Transport', icon: '🚌' },
    { number: 8, title: 'Hostel', icon: '🏠' },
    { number: 9, title: 'Fee', icon: '💰' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-2xl font-bold">Student Registration</h1>
        <p className="text-blue-100 mt-1">Fill in the details to register a new student</p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 overflow-x-auto">
        <div className="flex min-w-max">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {currentStep > step.number ? '✓' : step.icon}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {step.number < steps.length && (
                <div className={`w-12 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
          
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated or manual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    name="aadhaar_number"
                    value={formData.aadhaar_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={12}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="admission_number"
                    value={formData.admission_number}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    name="admission_date"
                    value={formData.admission_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls: any) => (
                      <option key={cls.value} value={cls.value}>{cls.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Name</label>
                  <input
                    type="text"
                    name="previous_school"
                    value={formData.previous_school}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Class</label>
                  <input
                    type="text"
                    name="previous_class"
                    value={formData.previous_class}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                  <select
                    name="medium"
                    value={formData.medium}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="marathi">Marathi</option>
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile Number</label>
                  <input
                    type="tel"
                    name="alternate_mobile"
                    value={formData.alternate_mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
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

          {/* Step 4: Parent/Guardian Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Parent/Guardian Details</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Father's Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="tel" name="father_mobile" placeholder="Mobile Number" value={formData.father_mobile} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="text" name="father_occupation" placeholder="Occupation" value={formData.father_occupation} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Mother's Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" name="mother_name" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="tel" name="mother_mobile" placeholder="Mobile Number" value={formData.mother_mobile} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="text" name="mother_occupation" placeholder="Occupation" value={formData.mother_occupation} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Guardian Details (If different)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" name="guardian_name" placeholder="Guardian Name" value={formData.guardian_name} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="text" name="guardian_relation" placeholder="Relation" value={formData.guardian_relation} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  <input type="tel" name="guardian_mobile" placeholder="Mobile Number" value={formData.guardian_mobile} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Emergency Details */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Emergency Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input type="text" name="emergency_name" value={formData.emergency_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
                  <input type="tel" name="emergency_number" value={formData.emergency_number} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <input type="text" name="emergency_relation" value={formData.emergency_relation} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Medical Details */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Medical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                  <textarea name="medical_conditions" rows={3} value={formData.medical_conditions} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Any chronic conditions, surgeries, etc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <textarea name="allergies" rows={3} value={formData.allergies} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Food, medicine, or other allergies" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input type="text" name="doctor_name" value={formData.doctor_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Contact</label>
                  <input type="tel" name="doctor_contact" value={formData.doctor_contact} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Transport Details */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Transport Details</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="transport_required" checked={formData.transport_required} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Transport Required</span>
                </label>
                
                {formData.transport_required && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                    <select name="transport_route" value={formData.transport_route} onChange={handleChange} className="px-3 py-2 border rounded-lg">
                      <option value="">Select Route</option>
                      {routes.map((route: any) => (
                        <option key={route.value} value={route.value}>{route.label}</option>
                      ))}
                    </select>
                    <input type="text" name="pickup_point" placeholder="Pickup Point" value={formData.pickup_point} onChange={handleChange} className="px-3 py-2 border rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Hostel Details */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Hostel Details</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="hostel_required" checked={formData.hostel_required} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Hostel Required</span>
                </label>
                
                {formData.hostel_required && (
                  <div className="pl-8">
                    <input type="text" name="room_number" placeholder="Room Number" value={formData.room_number} onChange={handleChange} className="w-full md:w-1/2 px-3 py-2 border rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 9: Fee Details */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Fee Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Category</label>
                  <select name="fee_category" value={formData.fee_category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Category</option>
                    {feeCategories.map((cat: any) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount/Scholarship</label>
                  <input type="text" name="discount" placeholder="e.g., 10% Scholarship" value={formData.discount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure</label>
                  <select name="fee_structure" value={formData.fee_structure} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Fee Structure</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
              ← Previous
            </button>
          )}
          
          {currentStep < 9 ? (
            <button type="button" onClick={nextStep} className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${currentStep === 1 ? 'ml-auto' : ''}`}>
              Next Step →
            </button>
          ) : (
            <button type="submit" disabled={loading} className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-auto">
              {loading ? 'Registering...' : '✓ Register Student'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StudentRegistration;