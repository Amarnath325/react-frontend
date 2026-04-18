import api from './api';

export interface MenuItem {
  menu_id: number;
  menu_p_id: number | null;
  menu_name: string;
  menu_icon: string;
  menu_route: string;
  menu_sequence: number;
  menu_status: boolean;
  menu_sub_status: number;
  children?: MenuItem[];
}

export const menuService = {
  getAllMenus: async (): Promise<MenuItem[]> => {
    const response = await api.get('/menus');
    return response.data.data;
  },
  
  getParentMenus: async (): Promise<MenuItem[]> => {
    const response = await api.get('/menus/parent');
    return response.data.data;
  },
  
  getSubMenus: async (parentId: number): Promise<MenuItem[]> => {
    const response = await api.get(`/menus/${parentId}/sub`);
    return response.data.data;
  },
};
