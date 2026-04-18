import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface MenuItem {
  menu_id: number;
  menu_p_id: number | null;
  menu_name: string;
  menu_icon: string;
  menu_route: string;
  menu_sequence: number;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await api.get('/menus');
      if (response.data.success) {
        const menusData = buildMenuHierarchy(response.data.data);
        setMenus(menusData);
        // Auto expand first menu
        if (menusData.length > 0) {
          setExpandedMenus([menusData[0].menu_id]);
        }
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildMenuHierarchy = (menus: any[]): MenuItem[] => {
    const parentMenus = menus.filter(menu => !menu.menu_p_id);
    const childMenus = menus.filter(menu => menu.menu_p_id);
    
    return parentMenus.map(parent => ({
      ...parent,
      children: childMenus.filter(child => child.menu_p_id === parent.menu_id)
    }));
  };

  const toggleMenu = (menuId: number) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-900 text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col transition-transform duration-300 ease-in-out h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">School Manager</h1>
              <p className="text-xs text-gray-400">{user?.user_type || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menus.map((menu) => (
              <div key={menu.menu_id}>
                {/* Parent Menu */}
                {menu.children && menu.children.length > 0 ? (
                  <button
                    onClick={() => toggleMenu(menu.menu_id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      expandedMenus.includes(menu.menu_id)
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{menu.menu_icon}</span>
                      <span className="text-sm font-medium">{menu.menu_name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMenus.includes(menu.menu_id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <NavLink
                    to={menu.menu_route}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-xl">{menu.menu_icon}</span>
                    <span className="text-sm font-medium">{menu.menu_name}</span>
                  </NavLink>
                )}

                {/* Child Menus */}
                {menu.children && menu.children.length > 0 && expandedMenus.includes(menu.menu_id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {menu.children.map((child) => (
                      <NavLink
                        key={child.menu_id}
                        to={child.menu_route}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`
                        }
                      >
                        <span className="text-sm">{child.menu_icon}</span>
                        <span className="text-sm">{child.menu_name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
