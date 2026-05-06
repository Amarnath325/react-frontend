import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

type MasterData = string | { m_name: string };

interface StudentData {
  // Basic Details
  student_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: MasterData;
  date_of_birth: string;
  age: number;
  blood_group: MasterData;
  category: MasterData;
  religion: MasterData;
  aadhaar_number: string;
  
  // Academic Details
  admission_number: string;
  admission_date: string;
  class_name: MasterData;
  section: string;
  roll_number: string;
  previous_school: string;
  previous_class: string;
  medium: MasterData;
  
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
  
  // Status
  status: string;
}

const StudentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students/${id}`);
      if (response.data.success) {
        setStudent(response.data.data);
      } else {
        toast.error('Student not found');
        navigate('/students/all');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Details', icon: '👤' },
    { id: 'academic', name: 'Academic Details', icon: '📚' },
    { id: 'contact', name: 'Contact Details', icon: '📞' },
    { id: 'parents', name: 'Parent Details', icon: '👨‍👩‍👧' },
    { id: 'emergency', name: 'Emergency', icon: '🚨' },
    { id: 'medical', name: 'Medical', icon: '🏥' },
    { id: 'transport', name: 'Transport', icon: '🚌' },
    { id: 'hostel', name: 'Hostel', icon: '🏠' },
    { id: 'fee', name: 'Fee Details', icon: '💰' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student not found</p>
        <button
          onClick={() => navigate('/students/all')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Profile</h1>
            <p className="text-gray-500 mt-1">
              {student.first_name} {student.middle_name} {student.last_name} - {student.admission_number}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/students/edit/${id}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/students/all')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Details Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Student ID:</span>
                    <span className="text-gray-800">{student.student_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">First Name:</span>
                    <span className="text-gray-800">{student.first_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Middle Name:</span>
                    <span className="text-gray-800">{student.middle_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Last Name:</span>
                    <span className="text-gray-800">{student.last_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="text-gray-800">{typeof student.gender === 'object' ? student.gender?.m_name : student.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Date of Birth:</span>
                    <span className="text-gray-800">{student.date_of_birth || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Age:</span>
                    <span className="text-gray-800">{student.age || 'N/A'} years</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Blood Group:</span>
                    <span className="text-gray-800">{typeof student.blood_group === 'object' ? student.blood_group?.m_name : student.blood_group || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Category:</span>
                    <span className="text-gray-800">{typeof student.category === 'object' ? student.category?.m_name : student.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Religion:</span>
                    <span className="text-gray-800">{typeof student.religion === 'object' ? student.religion?.m_name : student.religion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Aadhaar Number:</span>
                    <span className="text-gray-800">{student.aadhaar_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Details Tab */}
          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Admission Number:</span>
                    <span className="text-gray-800">{student.admission_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Admission Date:</span>
                    <span className="text-gray-800">{student.admission_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Class:</span>
                    <span className="text-gray-800">{typeof student.class_name === 'object' ? student.class_name?.m_name : student.class_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Section:</span>
                    <span className="text-gray-800">{student.section || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Roll Number:</span>
                    <span className="text-gray-800">{student.roll_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Previous School:</span>
                    <span className="text-gray-800">{student.previous_school || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Previous Class:</span>
                    <span className="text-gray-800">{student.previous_class || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Medium:</span>
                    <span className="text-gray-800">{typeof student.medium === 'object' ? student.medium?.m_name : student.medium || 'English'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Details Tab */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Mobile Number:</span>
                    <span className="text-gray-800">{student.mobile_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Alternate Mobile:</span>
                    <span className="text-gray-800">{student.alternate_mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Email ID:</span>
                    <span className="text-gray-800">{student.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Address:</span>
                    <span className="text-gray-800">
                      {student.address_line1}<br />
                      {student.address_line2}<br />
                      {student.city}, {student.state} - {student.pincode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parent Details Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4 text-gray-800">Father's Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-800">{student.father_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Mobile:</span>
                    <span className="text-gray-800">{student.father_mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Occupation:</span>
                    <span className="text-gray-800">{student.father_occupation || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4 text-gray-800">Mother's Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-800">{student.mother_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Mobile:</span>
                    <span className="text-gray-800">{student.mother_mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Occupation:</span>
                    <span className="text-gray-800">{student.mother_occupation || 'N/A'}</span>
                  </div>
                </div>
              </div>
              {(student.guardian_name || student.guardian_relation || student.guardian_mobile) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Guardian Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="text-gray-800">{student.guardian_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Relation:</span>
                      <span className="text-gray-800">{student.guardian_relation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Mobile:</span>
                      <span className="text-gray-800">{student.guardian_mobile || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Details Tab */}
          {activeTab === 'emergency' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Emergency Contact Name:</span>
                  <span className="text-gray-800">{student.emergency_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Emergency Contact Number:</span>
                  <span className="text-gray-800">{student.emergency_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Relation:</span>
                  <span className="text-gray-800">{student.emergency_relation || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Medical Details Tab */}
          {activeTab === 'medical' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Medical Conditions:</span>
                  <span className="text-gray-800">{student.medical_conditions || 'None'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Allergies:</span>
                  <span className="text-gray-800">{student.allergies || 'None'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Doctor Name:</span>
                  <span className="text-gray-800">{student.doctor_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Doctor Contact:</span>
                  <span className="text-gray-800">{student.doctor_contact || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transport Details Tab */}
          {activeTab === 'transport' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Transport Required:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    student.transport_required 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.transport_required ? 'Yes' : 'No'}
                  </span>
                </div>
                {student.transport_required && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Route:</span>
                      <span className="text-gray-800">{student.transport_route || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">Pickup Point:</span>
                      <span className="text-gray-800">{student.pickup_point || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Hostel Details Tab */}
          {activeTab === 'hostel' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Hostel Required:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    student.hostel_required 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.hostel_required ? 'Yes' : 'No'}
                  </span>
                </div>
                {student.hostel_required && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Room Number:</span>
                    <span className="text-gray-800">{student.room_number || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Details Tab */}
          {activeTab === 'fee' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Fee Category:</span>
                  <span className="text-gray-800">{student.fee_category || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Discount/Scholarship:</span>
                  <span className="text-gray-800">{student.discount || 'None'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Fee Structure:</span>
                  <span className="text-gray-800">{student.fee_structure || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentView;
