import api from './api';

export interface MasterOption {
  value: string;
  label: string;
}

// Helper function to convert API response to MasterOption array
// Backend returns {m_id: m_name} format where m_id is stored and m_name is displayed
const convertToOptions = (data: any): MasterOption[] => {
  // Handle array response
  if (Array.isArray(data)) {
    return data;
  }
  
  // Handle object response (convert to array)
  // The backend now returns data as {id: name} where:
  // - id (key) is what gets stored in the database (m_id)
  // - name (value) is what gets displayed to the user (m_name)
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).map(([id, name]) => ({
      value: id,  // This is m_id - stored in database
      label: String(name)  // This is m_name - displayed to user
    }));
  }
  
  return [];
};

export const masterService = {
  getSchoolTypes: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/school-types');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching school types:', error);
      return [];
    }
  },
  
  getManagementTypes: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/management-types');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching management types:', error);
      return [];
    }
  },
  
  getAffiliationBoards: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/affiliation-boards');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching affiliation boards:', error);
      return [];
    }
  },
  
  getClasses: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/classes');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },
  
  getStreams: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/streams');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching streams:', error);
      return [];
    }
  },
  
  getMediums: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/mediums');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching mediums:', error);
      return [];
    }
  },
  
  getSubscriptionPlans: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/subscription-plans');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  },

  getAffiliationStatuses: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/affiliation-statuses');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching affiliation statuses:', error);
      return [];
    }
  },
  
  getReligions: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/religions');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching religions:', error);
      return [];
    }
  },
  
  getCategories: async (): Promise<MasterOption[]> => {
    try {
      const response = await api.get('/master/categories');
      return convertToOptions(response.data?.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
};

// Also export a default object for convenience
export default masterService;