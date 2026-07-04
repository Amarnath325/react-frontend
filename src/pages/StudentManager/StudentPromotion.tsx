import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Select from 'react-select';

interface Student {
  id: number;
  student_id: string;
  name: string;
  admission_number: string;
  current_class: string;
  current_section: string;
  roll_number: string;
  percentage: number;
  result: string;
  selected: boolean;
}

interface PromotionData {
  from_academic_year: string;
  to_academic_year: string;
  from_class_id: string;
  to_class_id: string;
  promotion_type: string;
  promotion_date: string;
}

const StudentPromotion: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionData>({
    from_academic_year: '',
    to_academic_year: '',
    from_class_id: '',
    to_class_id: '',
    promotion_type: 'automatic',
    promotion_date: new Date().toISOString().split('T')[0],
  });
  
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (promotionData.from_class_id && promotionData.from_academic_year) {
      fetchStudents();
    }
  }, [promotionData.from_class_id, promotionData.from_academic_year]);

  const fetchMasterData = async () => {
    setLoadingData(true);
    try {
      const [yearsRes, classesRes] = await Promise.all([
        api.get('/school/academic-years'),
        api.get('/master/classes'),
      ]);
      
      // Convert academic years
      const years = yearsRes.data.data.map((year: any) => ({
        value: year.id,
        label: year.name,
      }));
      
      // Convert classes from object to array
      let classesArray: any[] = [];
      const classesData = classesRes.data.data;
      if (typeof classesData === 'object' && !Array.isArray(classesData)) {
        classesArray = Object.entries(classesData).map(([id, name]) => ({
          value: parseInt(id),
          label: name as string,
        }));
      } else {
        classesArray = classesData || [];
      }
      
      setAcademicYears(years);
      setClasses(classesArray);
      
      // Set default values
      if (years.length > 0) {
        setPromotionData(prev => ({
          ...prev,
          from_academic_year: years[0]?.value?.toString() || '',
          to_academic_year: years[1]?.value?.toString() || (years[0]?.value ? (parseInt(years[0].value) + 1).toString() : ''),
        }));
      }
      if (classesArray.length > 0) {
        setPromotionData(prev => ({
          ...prev,
          from_class_id: classesArray[0]?.value?.toString() || '',
          to_class_id: classesArray[1]?.value?.toString() || classesArray[0]?.value?.toString() || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students/by-class', {
        params: {
          class_id: promotionData.from_class_id,
          academic_year: promotionData.from_academic_year,
        },
      });
      
      if (response.data.success) {
        const studentsWithSelection = response.data.data.map((student: any) => ({
          ...student,
          selected: promotionData.promotion_type === 'automatic' || 
                   (promotionData.promotion_type === 'merit' && (student.percentage || 0) >= 35),
        }));
        setStudents(studentsWithSelection);
        const allSelected = studentsWithSelection.length > 0 && studentsWithSelection.every((s: any) => s.selected);
        setSelectAll(allSelected);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setStudents(students.map(s => ({ ...s, selected: newSelectAll })));
  };

  const handleSelectStudent = (id: number) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
    setSelectAll(students.every(s => s.selected));
  };

  const handlePromote = async () => {
    const selectedStudents = students.filter(s => s.selected);
    
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student to promote');
      return;
    }

    if (!promotionData.to_class_id) {
      toast.error('Please select target class');
      return;
    }

    if (!promotionData.to_academic_year) {
      toast.error('Please select target academic year');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/students/promote-bulk', {
        student_ids: selectedStudents.map(s => s.id),
        from_class_id: promotionData.from_class_id,
        to_class_id: promotionData.to_class_id,
        from_academic_year: promotionData.from_academic_year,
        to_academic_year: promotionData.to_academic_year,
        promotion_date: promotionData.promotion_date,
        promotion_type: promotionData.promotion_type,
      });

      if (response.data.success) {
        toast.success(`${selectedStudents.length} students promoted successfully!`);
        navigate('/students/all');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion failed');
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (percentage: number) => {
    if (percentage >= 60) {
      return <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700">First Division</span>;
    }
    if (percentage >= 45) {
      return <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">Second Division</span>;
    }
    if (percentage >= 33) {
      return <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-700">Pass</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">Fail</span>;
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-[13px] text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Custom select styles
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#d1d5db',
      minHeight: '34px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9ca3af' },
    }),
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
        <h1 className="text-[15px] font-bold text-white">Student Promotion</h1>
        <p className="text-purple-100 text-[12px]">Promote students to next academic year/class</p>
      </div>

      {/* Promotion Configuration */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">From Academic Year</label>
            <select
              value={promotionData.from_academic_year}
              onChange={(e) => setPromotionData({ ...promotionData, from_academic_year: e.target.value })}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              {academicYears.map((year: any) => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">From Class</label>
            <select
              value={promotionData.from_class_id}
              onChange={(e) => setPromotionData({ ...promotionData, from_class_id: e.target.value })}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              {classes.map((cls: any) => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">To Academic Year</label>
            <select
              value={promotionData.to_academic_year}
              onChange={(e) => setPromotionData({ ...promotionData, to_academic_year: e.target.value })}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              {academicYears.map((year: any) => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">To Class</label>
            <select
              value={promotionData.to_class_id}
              onChange={(e) => setPromotionData({ ...promotionData, to_class_id: e.target.value })}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              {classes.map((cls: any) => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Promotion Type</label>
            <select
              value={promotionData.promotion_type}
              onChange={(e) => {
                const newType = e.target.value;
                setPromotionData({ ...promotionData, promotion_type: newType });
                if (newType === 'automatic') {
                  setStudents(students.map(s => ({ ...s, selected: true })));
                  setSelectAll(true);
                } else if (newType === 'merit') {
                  setStudents(students.map(s => ({ ...s, selected: (s.percentage || 0) >= 35 })));
                }
              }}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              <option value="automatic">Automatic (All Students)</option>
              <option value="merit">Merit Based (Only Pass)</option>
              <option value="manual">Manual Selection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="ml-2 text-[13px] text-gray-600">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[13px]">No students found in this class</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={promotionData.promotion_type !== 'manual'}
                    className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                  />
                </th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Student Name</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Admission No.</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Current Class</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Roll No.</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Percentage</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Result</th>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700">Promote To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={student.selected}
                      onChange={() => handleSelectStudent(student.id)}
                      disabled={promotionData.promotion_type !== 'manual' || 
                               (promotionData.promotion_type === 'merit' && (student.percentage || 0) < 35)}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-[11px] font-medium">
                        {student.name?.charAt(0)}
                      </div>
                      <span className="text-[13px] font-medium text-gray-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{student.admission_number}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{student.current_class} {student.current_section}</td>
                  <td className="px-3 py-2 text-[12px] text-gray-600">{student.roll_number}</td>
                  <td className="px-3 py-2 text-[13px] font-semibold text-gray-700">{student.percentage || 0}%</td>
                  <td className="px-3 py-2">{getResultBadge(student.percentage || 0)}</td>
                  <td className="px-3 py-2 text-[12px] font-medium text-green-600">
                    {classes.find(c => c.value == promotionData.to_class_id)?.label || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      {students.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-[12px] text-gray-600">
              <span className="font-medium">Summary:</span> {students.filter(s => s.selected).length} of {students.length} students selected for promotion
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/students/all')}
                className="px-4 py-1.5 text-[12px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={loading || students.filter(s => s.selected).length === 0}
                className="px-5 py-1.5 text-[12px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Promoting...' : `Promote (${students.filter(s => s.selected).length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPromotion;
