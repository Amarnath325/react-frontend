import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface TimetableSlot {
  id: number;
  school_id: number;
  academic_year_id: number;
  class_id: number;
  section_id: number;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  teacher_id: number;
  room_number: string;
  is_break: boolean;
}

interface ClassOption {
  value: number;
  label: string;
}

interface SectionOption {
  value: number;
  label: string;
}

interface SubjectOption {
  value: number;
  label: string;
}

interface TeacherOption {
  value: number;
  label: string;
}

const TimetableGenerator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [viewType, setViewType] = useState<'class' | 'teacher'>('class');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  
  // Master data
  const [academicYears, setAcademicYears] = useState<ClassOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  
  // Timetable data
  const [timetable, setTimetable] = useState<any[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Days of week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchMasterData();
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedAcademicYear) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSection, selectedAcademicYear]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [academicYearsRes, classesRes, sectionsRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/school/academic-years'),
        api.get('/master/classes'),
        api.get('/school/sections'),
        api.get('/school/subjects'),
        api.get('/school/teachers'),
      ]);
      
      setAcademicYears(academicYearsRes.data.data.map((y: any) => ({ value: y.id, label: y.name })));
      
      const classesData = classesRes.data.data;
      let classArray: ClassOption[] = [];
      if (typeof classesData === 'object' && !Array.isArray(classesData)) {
        classArray = Object.entries(classesData).map(([id, name]) => ({ value: parseInt(id), label: name as string }));
      }
      setClasses(classArray);
      
      setSections(sectionsRes.data.data.map((s: any) => ({ value: s.id, label: `${getClassName(s.class_id)} - Section ${s.section_name}` })));
      setSubjects(subjectsRes.data.data.map((sub: any) => ({ value: sub.id, label: sub.name })));
      setTeachers(teachersRes.data.data.map((t: any) => ({ value: t.id, label: t.user?.first_name + ' ' + t.user?.last_name })));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await api.get('/school/time-slots');
      if (response.data.success) {
        setTimeSlots(response.data.data);
      } else {
        // Default time slots if none exist
        setTimeSlots([
          { period: 1, start: '09:00', end: '09:45' },
          { period: 2, start: '09:45', end: '10:30' },
          { period: 3, start: '10:30', end: '11:15' },
          { period: 4, start: '11:15', end: '12:00' },
          { period: 5, start: '12:00', end: '12:30', is_break: true, name: 'Lunch Break' },
          { period: 6, start: '12:30', end: '13:15' },
          { period: 7, start: '13:15', end: '14:00' },
          { period: 8, start: '14:00', end: '14:45' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const fetchTimetable = async () => {
    setIsGenerating(true);
    try {
      const response = await api.get('/school/timetable', {
        params: {
          class_id: selectedClass,
          section_id: selectedSection,
          academic_year_id: selectedAcademicYear,
        },
      });
      
      if (response.data.success && response.data.data.length > 0) {
        // Convert to 2D array [day][period]
        const matrix: any[][] = Array(daysOfWeek.length).fill(null).map(() => Array(timeSlots.length).fill(null));
        response.data.data.forEach((slot: any) => {
          const dayIndex = daysOfWeek.indexOf(slot.day_of_week);
          const periodIndex = slot.period_number - 1;
          if (dayIndex >= 0 && periodIndex >= 0) {
            matrix[dayIndex][periodIndex] = slot;
          }
        });
        setTimetable(matrix);
      } else {
        // Empty timetable
        setTimetable(Array(daysOfWeek.length).fill(null).map(() => Array(timeSlots.length).fill(null)));
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSlot = async (dayIndex: number, periodIndex: number, data: any) => {
    try {
      const slotData = {
        academic_year_id: parseInt(selectedAcademicYear),
        class_id: parseInt(selectedClass),
        section_id: parseInt(selectedSection),
        day_of_week: daysOfWeek[dayIndex],
        period_number: periodIndex + 1,
        start_time: timeSlots[periodIndex]?.start,
        end_time: timeSlots[periodIndex]?.end,
        ...data,
      };
      
      const response = await api.post('/school/timetable/slot', slotData);
      if (response.data.success) {
        toast.success('Slot updated successfully');
        fetchTimetable();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update slot');
    }
  };

  const generateAutoTimetable = async () => {
    if (!selectedClass || !selectedSection || !selectedAcademicYear) {
      toast.error('Please select class, section, and academic year');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await api.post('/school/timetable/generate', {
        class_id: selectedClass,
        section_id: selectedSection,
        academic_year_id: selectedAcademicYear,
      });
      
      if (response.data.success) {
        toast.success('Timetable generated successfully!');
        fetchTimetable();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setIsGenerating(false);
    }
  };

  const getClassName = (classId: number) => {
    const cls = classes.find(c => c.value === classId);
    return cls?.label || 'N/A';
  };

  const getSubjectName = (subjectId: number) => {
    const sub = subjects.find(s => s.value === subjectId);
    return sub?.label || 'N/A';
  };

  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find(t => t.value === teacherId);
    return teacher?.label || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-[13px] text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[15px] font-semibold text-gray-800">Timetable Generator</h3>
        <p className="text-[12px] text-gray-500">Generate and manage class schedules</p>
      </div>

      {/* Controls */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg"
            >
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.value} value={section.value}>{section.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={generateAutoTimetable}
              disabled={isGenerating}
              className="flex-1 px-3 py-1.5 text-[12px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Auto Generate'}
            </button>
            <button
              onClick={() => fetchTimetable()}
              className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewType('class')}
            className={`px-3 py-1 text-[11px] rounded-lg transition ${
              viewType === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Class View
          </button>
          <button
            onClick={() => setViewType('teacher')}
            className={`px-3 py-1 text-[11px] rounded-lg transition ${
              viewType === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Teacher View
          </button>
        </div>
      </div>

      {/* Timetable Table */}
      {selectedClass && selectedSection && selectedAcademicYear ? (
        <div className="overflow-x-auto border-y border-gray-200">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[12px] font-semibold text-gray-700 w-24">Day / Time</th>
                {timeSlots.map((slot, idx) => (
                  <th key={idx} className="px-2 py-2 text-center text-[11px] font-semibold text-gray-700 min-w-[100px]">
                    {slot.is_break ? (
                      <span className="text-orange-600">{slot.name || 'Break'}</span>
                    ) : (
                      <>
                        <div>Period {slot.period}</div>
                        <div className="text-[10px] text-gray-500">{slot.start} - {slot.end}</div>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {daysOfWeek.map((day, dayIndex) => (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-[12px] font-medium text-gray-700 bg-gray-50 sticky left-0">
                    {day}
                  </td>
                  {timeSlots.map((slot, periodIndex) => {
                    const slotData = timetable[dayIndex]?.[periodIndex];
                    const isBreak = slot.is_break;
                    
                    if (isBreak) {
                      return (
                        <td key={periodIndex} className="px-2 py-2 text-center bg-orange-50">
                          <span className="text-[11px] text-orange-600 font-medium">{slot.name || 'Break'}</span>
                        </td>
                      );
                    }
                    
                    return (
                      <td key={periodIndex} className="px-2 py-2 text-center border">
                        {slotData ? (
                          <div className="space-y-1">
                            <div className="text-[12px] font-medium text-gray-800">{getSubjectName(slotData.subject_id)}</div>
                            <div className="text-[10px] text-gray-500">{getTeacherName(slotData.teacher_id)}</div>
                            <div className="text-[10px] text-gray-400">Room: {slotData.room_number || '-'}</div>
                            <button
                              onClick={() => {
                                const subject = prompt('Enter Subject ID:', slotData.subject_id);
                                const teacher = prompt('Enter Teacher ID:', slotData.teacher_id);
                                const room = prompt('Enter Room Number:', slotData.room_number);
                                if (subject && teacher) {
                                  updateSlot(dayIndex, periodIndex, {
                                    subject_id: parseInt(subject),
                                    teacher_id: parseInt(teacher),
                                    room_number: room,
                                  });
                                }
                              }}
                              className="text-[10px] text-blue-500 hover:text-blue-700"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const subject = prompt('Enter Subject ID:');
                              const teacher = prompt('Enter Teacher ID:');
                              const room = prompt('Enter Room Number:');
                              if (subject && teacher) {
                                updateSlot(dayIndex, periodIndex, {
                                  subject_id: parseInt(subject),
                                  teacher_id: parseInt(teacher),
                                  room_number: room,
                                });
                              }
                            }}
                            className="w-full py-4 text-[11px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[12px]">Select Class, Section, and Academic Year to view timetable</p>
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;