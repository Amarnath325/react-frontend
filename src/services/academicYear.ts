import api from './api';

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
  school_id?: number;
  created_at?: string;
  updated_at?: string;
}

export const academicYearService = {
  // Get all academic years
  getAll: async (): Promise<AcademicYear[]> => {
    const response = await api.get('/school/academic-years');
    return response.data.data;
  },

  // Get single academic year
  getById: async (id: number): Promise<AcademicYear> => {
    const response = await api.get(`/school/academic-years/${id}`);
    return response.data.data;
  },

  // Create new academic year
  create: async (data: Partial<AcademicYear>): Promise<AcademicYear> => {
    const response = await api.post('/school/academic-years', data);
    return response.data.data;
  },

  // Update academic year
  update: async (id: number, data: Partial<AcademicYear>): Promise<AcademicYear> => {
    const response = await api.put(`/school/academic-years/${id}`, data);
    return response.data.data;
  },

  // Delete academic year
  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/academic-years/${id}`);
  },

  // Set as current academic year
  setAsCurrent: async (id: number): Promise<void> => {
    await api.post(`/school/academic-years/${id}/set-current`);
  },
};

// Default export as well
export default academicYearService;