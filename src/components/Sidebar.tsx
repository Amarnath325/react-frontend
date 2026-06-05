import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    fetchMenus();
  }, []);

  // Automatically expand parent menus that contain the currently active route
  useEffect(() => {
    if (menus.length > 0) {
      menus.forEach(menu => {
        if (menu.children && menu.children.some(child => location.pathname === child.menu_route)) {
          setExpandedMenus(prev => {
            if (!prev.includes(menu.menu_id)) {
              return [...prev, menu.menu_id];
            }
            return prev;
          });
        }
      });
    }
  }, [location.pathname, menus]);

  const fetchMenus = async () => {
    try {
      const response = await api.get('/menus');
      if (response.data.success) {
        const menusData = buildMenuHierarchy(response.data.data);
        setMenus(menusData);
        
        // Initial auto expand of active route category or fallback to first item
        const currentPath = window.location.pathname;
        const activeParentIds: number[] = [];
        menusData.forEach(menu => {
          if (menu.children && menu.children.some(child => currentPath === child.menu_route)) {
            activeParentIds.push(menu.menu_id);
          }
        });

        if (activeParentIds.length > 0) {
          setExpandedMenus(activeParentIds);
        } else if (menusData.length > 0) {
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
      <div className="w-64 bg-slate-950 text-white flex flex-col h-full border-r border-slate-900">
        <div className="p-4.5 border-b border-slate-900">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-900 rounded w-3/4"></div>
              <div className="h-3 bg-slate-900 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="p-4 flex-1 space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-900 rounded w-full"></div>
            <div className="h-4 bg-slate-900 rounded w-5/6"></div>
            <div className="h-4 bg-slate-900 rounded w-4/5"></div>
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800/85 shadow-xl hover:bg-slate-900 transition-all duration-200 active:scale-95"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 w-64 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out h-full border-r border-slate-900/60 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-slate-900 flex-shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 transform hover:scale-105 transition-transform duration-200">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-wide leading-tight">School Manager</h1>
              <p className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase mt-0.5">{user?.user_type || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex-shrink-0">
          <div className="flex items-center gap-3 bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/60">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-extrabold text-sm shadow-inner flex-shrink-0">
              {user?.first_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto py-3.5 custom-scrollbar-dark">
          <div className="px-3 space-y-1">
            {menus.map((menu) => (
              <div key={menu.menu_id} className="space-y-0.5">
                {/* Parent Menu with Submenus */}
                {menu.children && menu.children.length > 0 ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(menu.menu_id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 relative group ${
                        menu.children.some(child => location.pathname === child.menu_route)
                          ? 'text-white font-semibold bg-blue-500/5'
                          : expandedMenus.includes(menu.menu_id)
                          ? 'text-slate-200 bg-slate-900/20'
                          : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {menu.children.some(child => location.pathname === child.menu_route) && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-md shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        )}
                        <span className={`text-[15px] flex-shrink-0 transition-transform duration-200 ${
                          menu.children.some(child => location.pathname === child.menu_route)
                            ? 'scale-110 opacity-100'
                            : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'
                        }`}>
                          {menu.menu_icon}
                        </span>
                        <span className="text-[13px] font-semibold tracking-wide">{menu.menu_name}</span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          expandedMenus.includes(menu.menu_id) ? 'rotate-180 text-slate-200' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Child Submenus */}
                    {expandedMenus.includes(menu.menu_id) && (
                      <div className="ml-5 pl-3 border-l border-slate-900/80 my-1 space-y-1">
                        {menu.children.map((child) => (
                          <NavLink
                            key={child.menu_id}
                            to={child.menu_route}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group ${
                                isActive
                                  ? 'bg-blue-500/10 text-blue-400 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10" />
                                )}
                                <span className={`text-[13px] flex-shrink-0 transition-transform duration-200 ${
                                  isActive ? 'scale-110 opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'
                                }`}>
                                  {child.menu_icon}
                                </span>
                                <span className="text-xs font-semibold tracking-wide">{child.menu_name}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Parent NavLink */
                  <NavLink
                    to={menu.menu_route}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 font-semibold'
                          : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-md shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        )}
                        <span className={`text-[15px] flex-shrink-0 transition-transform duration-200 ${
                          isActive ? 'scale-110 opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'
                        }`}>
                          {menu.menu_icon}
                        </span>
                        <span className="text-[13px] font-semibold tracking-wide">{menu.menu_name}</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-3.5 border-t border-slate-900 flex-shrink-0 bg-slate-950">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <svg className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[13px] font-semibold tracking-wide">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
