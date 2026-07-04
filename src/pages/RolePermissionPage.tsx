import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Sliders, 
  FileDown, 
  FileUp, 
  Search, 
  X, 
  Archive, 
  Info, 
  Layers, 
  UserCheck, 
  ToggleLeft, 
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  group_name: string;
  description: string;
  status: string;
}

interface Role {
  id: number;
  school_id: number;
  name: string;
  description: string;
  status: string;
  deleted_at?: string | null;
  permissions: Permission[];
}

interface GroupedPermissions {
  [key: string]: Permission[];
}

const RolePermissionPage: React.FC = () => {
  // States
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'trash'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [trashedRoles, setTrashedRoles] = useState<Role[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<GroupedPermissions>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  // Selection states
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedTrashedIds, setSelectedTrashedIds] = useState<number[]>([]);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  
  // Form states
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  
  // CSV Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (matrixModalOpen && Object.keys(permissionsGrouped).length > 0) {
      setExpandedGroups(Object.keys(permissionsGrouped));
    }
  }, [matrixModalOpen, permissionsGrouped]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, trashedRes, permRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/trashed'),
        api.get('/permissions?grouped=1')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (trashedRes.data.success) setTrashedRoles(trashedRes.data.data);
      if (permRes.data.success) setPermissionsGrouped(permRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  // Helper to refresh lists
  const refreshRoles = async () => {
    try {
      const rolesRes = await api.get('/roles');
      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      
      const trashedRes = await api.get('/roles/trashed');
      if (trashedRes.data.success) setTrashedRoles(trashedRes.data.data);
    } catch (e) {
      console.error('Error refreshing roles:', e);
    }
  };

  // Delete / Trash Role
  const handleTrashRole = async (id: number) => {
    if (!window.confirm('Are you sure you want to move this role to trash?')) return;
    try {
      const res = await api.delete(`/roles/${id}`);
      if (res.data.success) {
        toast.success('Role moved to trash');
        setSelectedRoleIds(prev => prev.filter(item => item !== id));
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to trash role');
    }
  };

  // Restore Role
  const handleRestoreRole = async (id: number) => {
    try {
      const res = await api.post(`/roles/${id}/restore`);
      if (res.data.success) {
        toast.success('Role restored successfully');
        setSelectedTrashedIds(prev => prev.filter(item => item !== id));
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to restore role');
    }
  };

  // Force Delete Role
  const handleForceDeleteRole = async (id: number) => {
    if (!window.confirm('WARNING: This will permanently delete this role! This action CANNOT be undone. Proceed?')) return;
    try {
      const res = await api.delete(`/roles/${id}/force`);
      if (res.data.success) {
        toast.success('Role permanently deleted');
        setSelectedTrashedIds(prev => prev.filter(item => item !== id));
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to permanently delete role');
    }
  };

  // Toggle Status Switcher
  const handleToggleStatus = async (role: Role) => {
    const newStatus = role.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.post('/roles/bulk-status', {
        ids: [role.id],
        status: newStatus
      });
      if (res.data.success) {
        toast.success(`Role set to ${newStatus}`);
        refreshRoles();
      }
    } catch (e: any) {
      toast.error('Failed to change role status');
    }
  };

  // Open Add Role Modal
  const openAddModal = () => {
    setModalMode('add');
    setCurrentRole({
      name: '',
      description: '',
      status: 'active'
    });
    setRolePermissions([]);
    setRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const openEditModal = (role: Role) => {
    setModalMode('edit');
    setCurrentRole(role);
    setRoleModalOpen(true);
  };

  // Open Permissions Matrix Modal
  const openMatrixModal = (role: Role) => {
    setCurrentRole(role);
    setRolePermissions(role.permissions.map(p => p.id));
    setMatrixModalOpen(true);
  };

  // Save Role
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole || !currentRole.name) return;

    try {
      if (modalMode === 'add') {
        const res = await api.post('/roles', {
          ...currentRole,
          permissions: []
        });
        if (res.data.success) {
          toast.success('Role created successfully');
          setRoleModalOpen(false);
          fetchData();
          if (window.confirm('Do you want to configure permissions for this new role now?')) {
            openMatrixModal(res.data.data);
          }
        }
      } else {
        const res = await api.put(`/roles/${currentRole.id}`, {
          ...currentRole,
          permissions: currentRole.permissions?.map(p => p.id) || []
        });
        if (res.data.success) {
          toast.success('Role updated successfully');
          setRoleModalOpen(false);
          fetchData();
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save role');
    }
  };

  // Save Permissions Matrix Mapping
  const handleSavePermissions = async () => {
    if (!currentRole) return;
    try {
      const res = await api.put(`/roles/${currentRole.id}`, {
        name: currentRole.name,
        description: currentRole.description,
        status: currentRole.status,
        permissions: rolePermissions
      });
      if (res.data.success) {
        toast.success('Permissions updated successfully');
        setMatrixModalOpen(false);
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update permissions');
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    const list = activeTab === 'roles' ? selectedRoleIds : selectedTrashedIds;
    if (list.length === 0) {
      toast.error('No items selected');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Permanently delete the ${list.length} selected roles? This cannot be undone.`)) return;
    } else if (action === 'trash') {
      if (!window.confirm(`Move the ${list.length} selected roles to trash?`)) return;
    }

    try {
      let res;
      if (action === 'active' || action === 'inactive') {
        res = await api.post('/roles/bulk-status', { ids: list, status: action });
      } else if (action === 'trash') {
        res = await api.post('/roles/bulk-trash', { ids: list });
      } else if (action === 'restore') {
        res = await api.post('/roles/bulk-restore', { ids: list });
      } else if (action === 'delete') {
        res = await api.post('/roles/bulk-force-delete', { ids: list });
      }

      if (res && res.data.success) {
        toast.success('Bulk operation completed successfully');
        setSelectedRoleIds([]);
        setSelectedTrashedIds([]);
        fetchData();
      }
    } catch (e: any) {
      toast.error('Bulk operation failed');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get('/roles/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'school_roles_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Roles exported successfully');
    } catch (e) {
      toast.error('Failed to export roles');
    }
  };

  // Download CSV Sample Template
  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/roles/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'roles_import_sample.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sample template downloaded');
    } catch (e) {
      toast.error('Failed to download template');
    }
  };

  // Import CSV File Upload Handler
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select a CSV file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    setImportLoading(true);

    try {
      const res = await api.post('/roles/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setImportModalOpen(false);
        setImportFile(null);
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to import roles CSV');
    } finally {
      setImportLoading(false);
    }
  };

  // Checkbox toggle helpers
  const togglePermissionSelection = (id: number) => {
    setRolePermissions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleGroupSelection = (groupPermissions: Permission[], checked: boolean) => {
    const ids = groupPermissions.map(p => p.id);
    if (checked) {
      setRolePermissions(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      setRolePermissions(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const toggleGroupCollapse = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
    );
  };

  const allPermissionsList = Object.values(permissionsGrouped).flat();
  const isAllSelected = allPermissionsList.length > 0 && rolePermissions.length === allPermissionsList.length;

  const handleSelectAllPermissions = (checked: boolean) => {
    if (checked) {
      setRolePermissions(allPermissionsList.map(p => p.id));
    } else {
      setRolePermissions([]);
    }
  };

  const handleSelectRoleCheckbox = (id: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllRoles = () => {
    if (selectedRoleIds.length === filteredRoles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(filteredRoles.map(r => r.id));
    }
  };

  const handleSelectTrashedCheckbox = (id: number) => {
    setSelectedTrashedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTrashed = () => {
    if (selectedTrashedIds.length === trashedRoles.length) {
      setSelectedTrashedIds([]);
    } else {
      setSelectedTrashedIds(trashedRoles.map(r => r.id));
    }
  };

  // Filtering
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 p-4 max-w-[1400px] mx-auto text-slate-600 bg-white min-h-screen text-[11px] font-sans">
      
      {/* Minimalist Flat Header Area */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Roles & Permissions Configuration
          </h2>
          <p className="text-[11px] text-slate-400">
            Create schoolwise staff roles, toggle active status, map module permissions, and manage bulk workflows.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 rounded-lg border border-slate-200 shadow-sm transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button 
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 rounded-lg border border-slate-200 shadow-sm transition"
          >
            <FileUp className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-[11px] font-semibold text-white rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Role
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3">
          <Layers className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Roles</div>
            <div className="text-sm font-bold text-slate-800 leading-none mt-0.5">{roles.length}</div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active</div>
            <div className="text-sm font-bold text-slate-800 leading-none mt-0.5">{roles.filter(r => r.status === 'active').length}</div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3">
          <ToggleLeft className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inactive</div>
            <div className="text-sm font-bold text-slate-800 leading-none mt-0.5">{roles.filter(r => r.status === 'inactive').length}</div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3">
          <Archive className="w-4 h-4 text-rose-500" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trashed</div>
            <div className="text-sm font-bold text-slate-800 leading-none mt-0.5">{trashedRoles.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('roles')}
            className={`pb-2 font-bold text-[11px] transition-all relative ${
              activeTab === 'roles' 
                ? 'text-indigo-650 border-b-2 border-indigo-650' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Manage Roles
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`pb-2 font-bold text-[11px] transition-all relative ${
              activeTab === 'permissions' 
                ? 'text-indigo-650 border-b-2 border-indigo-650' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            System Permissions Overview
          </button>
          <button 
            onClick={() => setActiveTab('trash')}
            className={`pb-2 font-bold text-[11px] transition-all relative ${
              activeTab === 'trash' 
                ? 'text-indigo-650 border-b-2 border-indigo-650' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Trash Bin ({trashedRoles.length})
          </button>
        </div>

        {activeTab === 'roles' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg w-full sm:w-48 text-[11px] focus:outline-none focus:border-slate-350"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-450 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-[10px] font-semibold">Syncing database...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              {/* Bulk Actions Menu */}
              {selectedRoleIds.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-700 text-[11px]">
                    {selectedRoleIds.length} Selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBulkAction('active')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold transition"
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => handleBulkAction('inactive')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold transition"
                    >
                      Inactive
                    </button>
                    <button 
                      onClick={() => handleBulkAction('trash')}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Move to Trash
                    </button>
                  </div>
                </div>
              )}

              {filteredRoles.length === 0 ? (
                <div className="border border-dashed border-slate-250 rounded-xl p-12 text-center max-w-md mx-auto mt-6">
                  <Sliders className="w-6 h-6 text-slate-350 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-slate-700">No Custom Roles Found</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your school hasn't configured any custom roles yet. Click "New Role" to define one.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedRoleIds.length === filteredRoles.length && filteredRoles.length > 0}
                            onChange={handleSelectAllRoles}
                            className="rounded border-slate-300 text-indigo-650 cursor-pointer w-3.5 h-3.5"
                          />
                        </th>
                        <th className="p-3 text-[11px]">Role Name</th>
                        <th className="p-3 text-[11px]">Description</th>
                        <th className="p-3 w-36 text-center text-[11px]">Permissions</th>
                        <th className="p-3 w-24 text-center text-[11px]">Status</th>
                        <th className="p-3 w-32 text-center text-[11px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRoles.map(role => (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox"
                              checked={selectedRoleIds.includes(role.id)}
                              onChange={() => handleSelectRoleCheckbox(role.id)}
                              className="rounded border-slate-300 text-indigo-650 cursor-pointer w-3.5 h-3.5"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{role.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {role.id}</span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-sm truncate">
                            {role.description || <span className="italic text-slate-300 text-[10px]">No description</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                              {role.permissions ? role.permissions.length : 0} Assigned
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleToggleStatus(role)}
                              className="focus:outline-none"
                            >
                              {role.status === 'active' ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-250">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-150 text-slate-650 font-bold text-[10px] border border-slate-200">
                                  Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => openMatrixModal(role)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition"
                                title="Map Permissions"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openEditModal(role)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition"
                                title="Edit Role"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleTrashRole(role.id)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition"
                                title="Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
              <div className="flex gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-500 text-[10px] items-center">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <p>
                  System permissions are granular operations linked to resource actions. Grant these inside custom roles.
                </p>
              </div>

              <div className="space-y-4">
                {Object.keys(permissionsGrouped).map(groupName => (
                  <div key={groupName} className="space-y-2">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1 h-2 rounded bg-indigo-600 inline-block"></span>
                      {groupName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissionsGrouped[groupName].map(perm => (
                        <div key={perm.id} className="border border-slate-150 bg-slate-50/50 rounded-lg p-2.5 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 text-[11px] capitalize">{perm.name.replace(/_/g, ' ')}</span>
                            <code className="text-[9px] block text-indigo-650 font-mono font-semibold">{perm.name}</code>
                            <p className="text-[10px] text-slate-400 mt-1">{perm.description}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 text-[9px] text-slate-400">
                            <span>ID: {perm.id}</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">System Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRASH BIN */}
          {activeTab === 'trash' && (
            <div className="space-y-3">
              {/* Bulk Actions */}
              {selectedTrashedIds.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 flex items-center justify-between gap-4">
                  <span className="font-semibold text-rose-950 text-[11px]">
                    {selectedTrashedIds.length} Trashed Selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBulkAction('restore')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
                    >
                      Restore
                    </button>
                    <button 
                      onClick={() => handleBulkAction('delete')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-semibold transition"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              )}

              {trashedRoles.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto mt-6">
                  <Archive className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-755">Trash Bin Empty</h4>
                  <p className="text-[10px] text-slate-400 mt-1">No trashed roles available for restoration.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedTrashedIds.length === trashedRoles.length && trashedRoles.length > 0}
                            onChange={handleSelectAllTrashed}
                            className="rounded border-slate-300 text-indigo-650 cursor-pointer w-3.5 h-3.5"
                          />
                        </th>
                        <th className="p-3 text-[11px]">Role Name</th>
                        <th className="p-3 text-[11px]">Description</th>
                        <th className="p-3 w-40 text-center text-[11px]">Deleted At</th>
                        <th className="p-3 w-44 text-center text-[11px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {trashedRoles.map(role => (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox"
                              checked={selectedTrashedIds.includes(role.id)}
                              onChange={() => handleSelectTrashedCheckbox(role.id)}
                              className="rounded border-slate-300 text-indigo-650 cursor-pointer w-3.5 h-3.5"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{role.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {role.id}</span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-sm truncate">
                            {role.description || <span className="italic text-slate-350 text-[10px]">No description</span>}
                          </td>
                          <td className="p-3 text-center text-slate-400">
                            {role.deleted_at ? new Date(role.deleted_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleRestoreRole(role.id)}
                                className="px-2 py-1 text-indigo-600 hover:bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] transition"
                              >
                                Restore
                              </button>
                              <button 
                                onClick={() => handleForceDeleteRole(role.id)}
                                className="px-2 py-1 text-rose-600 hover:bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD/EDIT ROLE */}
      {roleModalOpen && currentRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-850 text-white">
              <h3 className="font-bold text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {modalMode === 'add' ? 'Create Custom Role' : 'Edit Role details'}
              </h3>
              <button onClick={() => setRoleModalOpen(false)} className="p-1 hover:bg-white/10 rounded transition text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRole} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role Title *</label>
                <input 
                  type="text" 
                  required
                  value={currentRole.name || ''}
                  onChange={(e) => setCurrentRole(prev => ({ ...prev!, name: e.target.value }))}
                  placeholder="e.g. Accountant Assistant"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-slate-350"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea 
                  value={currentRole.description || ''}
                  onChange={(e) => setCurrentRole(prev => ({ ...prev!, description: e.target.value }))}
                  placeholder="Describe role responsibilities..."
                  rows={3}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-slate-350 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Availability Status</label>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-2 rounded-lg">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input 
                      type="radio" 
                      name="role_status" 
                      value="active"
                      checked={currentRole.status === 'active'}
                      onChange={() => setCurrentRole(prev => ({ ...prev!, status: 'active' }))}
                      className="text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input 
                      type="radio" 
                      name="role_status" 
                      value="inactive"
                      checked={currentRole.status === 'inactive'}
                      onChange={() => setCurrentRole(prev => ({ ...prev!, status: 'inactive' }))}
                      className="text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    Inactive
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setRoleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERMISSIONS MAPPING MATRIX */}
      {matrixModalOpen && currentRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-850 text-white">
              <div>
                <h3 className="font-bold text-[11px] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Map Role Permissions Matrix
                </h3>
                <p className="text-[10px] text-slate-300">Set permissions for role: <strong className="text-white font-bold">{currentRole.name}</strong></p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-extrabold cursor-pointer select-none tracking-wider uppercase bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg transition">
                  <input 
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAllPermissions(e.target.checked)}
                    className="rounded border-slate-500 text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                  />
                  Select All Permissions
                </label>
                <button onClick={() => setMatrixModalOpen(false)} className="p-1 hover:bg-white/10 rounded transition text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {Object.keys(permissionsGrouped).map(groupName => {
                const groupPerms = permissionsGrouped[groupName];
                const selectedInGroup = groupPerms.filter(p => rolePermissions.includes(p.id));
                const allChecked = selectedInGroup.length === groupPerms.length;
                const isExpanded = expandedGroups.includes(groupName);
                
                return (
                  <div key={groupName} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={() => toggleGroupCollapse(groupName)}
                        className="flex items-center gap-2 font-bold text-slate-700 text-[10px] uppercase tracking-wider text-left focus:outline-none"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="w-1.5 h-2.5 rounded bg-indigo-600 inline-block shrink-0"></span>
                        {groupName} 
                        <span className="text-[9px] text-slate-400 font-medium normal-case font-sans">
                          ({selectedInGroup.length}/{groupPerms.length} selected)
                        </span>
                      </button>
                      <label className="flex items-center gap-1 text-[9px] text-indigo-700 font-extrabold cursor-pointer select-none tracking-wider uppercase">
                        <input 
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => toggleGroupSelection(groupPerms, e.target.checked)}
                          className="rounded border-slate-350 text-indigo-650 cursor-pointer w-3.5 h-3.5"
                        />
                        Select Group
                      </label>
                    </div>

                    {isExpanded && (
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-white transition-all duration-300">
                        {groupPerms.map(perm => {
                          const isChecked = rolePermissions.includes(perm.id);
                          return (
                            <label 
                              key={perm.id} 
                              className={`flex gap-2 border rounded-lg p-2.5 cursor-pointer transition ${
                                isChecked 
                                  ? 'bg-indigo-50/10 border-indigo-200' 
                                  : 'border-slate-150 hover:bg-slate-50/50'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermissionSelection(perm.id)}
                                className="rounded border-slate-300 text-indigo-605 mt-0.5 cursor-pointer w-3.5 h-3.5"
                              />
                              <div>
                                <div className="text-[11px] font-bold text-slate-700 capitalize">{perm.name.replace(/_/g, ' ')}</div>
                                <code className="text-[9px] text-slate-400 font-mono">{perm.name}</code>
                                <p className="text-[9px] text-slate-400 mt-1">{perm.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 bg-white border-t border-slate-200 flex sm:items-center justify-between gap-3 flex-wrap">
              <span className="text-[10px] text-slate-500 font-semibold">
                Selected: <strong className="text-indigo-600 font-bold">{rolePermissions.length}</strong>
              </span>
              <div className="flex gap-1.5">
                <button 
                  type="button" 
                  onClick={() => setMatrixModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSavePermissions}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORT BULK CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-850 text-white">
              <h3 className="font-bold text-[11px] flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-indigo-400" />
                Bulk Import Roles CSV
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="p-1 hover:bg-white/10 rounded transition text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleImportCSV} className="p-4 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
                <h5 className="font-bold text-[10px] text-slate-650 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-505" />
                  Format Requirements
                </h5>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Your CSV must hold exactly 4 columns: Role Name, Description, Status, Permissions.
                </p>
                
                <button 
                  type="button" 
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-650 hover:text-indigo-500 transition mt-1 bg-white border border-slate-200 px-2 py-1 rounded shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  Download Sample CSV
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select CSV File</label>
                <input 
                  type="file" 
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full border border-slate-200 rounded-lg p-1 text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition"
                  disabled={importLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                  disabled={importLoading}
                >
                  {importLoading ? 'Uploading...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissionPage;
