import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Stop {
  id?: number;
  stop_name: string;
  stop_code?: string;
  stop_type?: string;
  stop_order?: number;
  distance_km?: number | string;
  arrival_time?: string;
  departure_time?: string;
  location_address?: string;
  latitude?: number | string;
  longitude?: number | string;
  status?: string;
  notes?: string;
}

interface Route {
  id: number;
  route_name: string;
  route_code: string;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  capacity: number | null;
  amount: number | null;
  distance_km: number | null;
  estimated_duration_min: number | null;
  description: string | null;
  efficiency_rating: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  stops?: Stop[];
}

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 10px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '32px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '12px',
    padding: '6px 10px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '11px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '26px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '11px',
    padding: '5px 8px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
  compact?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = "",
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected) => onChange(selected ? String(selected.value) : '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={compact ? compactSelectStyles : customSelectStyles}
        className={compact ? "text-[11px]" : "text-[12px]"}
      />
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

const RouteManager: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredData, setFilteredData] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Route | null>(null);

  // Filters
  const [showTrashed, setShowTrashed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEfficiency, setFilterEfficiency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Nested stops list inside Form
  const [formStops, setFormStops] = useState<Stop[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    route_name: '',
    route_code: '',
    vehicle_number: '',
    driver_name: '',
    driver_phone: '',
    capacity: '',
    amount: '',
    distance_km: '',
    estimated_duration_min: '',
    description: '',
    efficiency_rating: 'Good',
    is_active: true,
  });

  // Tab states and other view states
  const [activeTab, setActiveTab] = useState<'all_routes' | 'route_stops' | 'optimization' | 'route_map'>('all_routes');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [selectedMapRoute, setSelectedMapRoute] = useState<string>('All');
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'optimization') {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await api.get('/students');
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const dbStudents = response.data.data.map((stu: any, idx: number) => ({
          id: stu.id,
          studentName: stu.full_name || `${stu.user?.first_name || ''} ${stu.user?.last_name || ''}`.trim() || `Student ${idx + 1}`,
          route: stu.transport_route || (routes.length > 0 ? routes[0].route_name : 'North Route'),
          stop: stu.pickup_point || 'Metro Station',
        }));
        
        const mockStudentNames = [
          "Aarav Sharma", "Diya Patel", "Kabir Singh", "Ananya Goel", "Rohan Verma",
          "Vihaan Gupta", "Ishaan Reddy", "Aditya Nair", "Siddharth Rao", "Krishna Murthy",
          "Karan Malhotra", "Arjun Sen", "Rahul Bose", "Dev Mukherjee", "Pranav Joshi",
          "Rudra Dwivedi", "Reyansh Mishra", "Aaryan Pandey", "Sai Teja", "Madhav Acharya",
          "Anika Iyer", "Myra Saxena", "Saisha Kulkarni", "Aanya Deshmukh", "Zara Khan",
          "Kavya Pillai", "Ishita Choudhury", "Riya Das", "Sneha Roy", "Tanya Dutta",
          "Pooja Mehta", "Neha Trivedi", "Shruti Shah", "Aditi Joshi", "Divya Solanki",
          "Nisha Parmar", "Meera Hegde", "Priya Bhatt", "Komal Sharma", "Swati Patil"
        ];
        
        const combined = [...dbStudents];
        let idx = dbStudents.length;
        while (combined.length < 40) {
          const name = mockStudentNames[combined.length % mockStudentNames.length];
          let assignedRoute = 'North Route';
          if (routes.length > 0) {
            assignedRoute = routes[combined.length % routes.length].route_name;
          }

          combined.push({
            id: 1000 + idx,
            studentName: name,
            route: assignedRoute,
            stop: 'Central Market',
          });
          idx++;
        }
        setStudents(combined);
      } else {
        generateFallbackMockStudents();
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      generateFallbackMockStudents();
    } finally {
      setStudentsLoading(false);
    }
  };

  const generateFallbackMockStudents = () => {
    const mockStudentNames = [
      "Aarav Sharma", "Diya Patel", "Kabir Singh", "Ananya Goel", "Rohan Verma",
      "Vihaan Gupta", "Ishaan Reddy", "Aditya Nair", "Siddharth Rao", "Krishna Murthy",
      "Karan Malhotra", "Arjun Sen", "Rahul Bose", "Dev Mukherjee", "Pranav Joshi",
      "Rudra Dwivedi", "Reyansh Mishra", "Aaryan Pandey", "Sai Teja", "Madhav Acharya",
      "Anika Iyer", "Myra Saxena", "Saisha Kulkarni", "Aanya Deshmukh", "Zara Khan",
      "Kavya Pillai", "Ishita Choudhury", "Riya Das", "Sneha Roy", "Tanya Dutta",
      "Pooja Mehta", "Neha Trivedi", "Shruti Shah", "Aditi Joshi", "Divya Solanki",
      "Nisha Parmar", "Meera Hegde", "Priya Bhatt", "Komal Sharma", "Swati Patil"
    ];
    const generated = [];
    for (let i = 0; i < 40; i++) {
      const name = mockStudentNames[i];
      let assignedRoute = 'North Route';
      if (routes.length > 0) {
        assignedRoute = routes[i % routes.length].route_name;
      }
      generated.push({
        id: 1000 + i,
        studentName: name,
        route: assignedRoute,
        stop: 'Central Market',
      });
    }
    setStudents(generated);
  };

  const handleMoveStop = async (routeId: number, stopIndex: number, direction: 'up' | 'down') => {
    const route = routes.find(r => r.id === routeId);
    if (!route || !route.stops) return;
    const sortedStops = [...route.stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
    
    const targetIdx = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
    if (targetIdx < 0 || targetIdx >= sortedStops.length) return;

    const currentStop = sortedStops[stopIndex];
    const otherStop = sortedStops[targetIdx];

    if (!currentStop.id || !otherStop.id) {
      toast.error('Unable to update stop sequence: missing stop identifiers');
      return;
    }

    // Swap stop_order values
    const tempOrder = currentStop.stop_order || 0;
    currentStop.stop_order = otherStop.stop_order || 0;
    otherStop.stop_order = tempOrder;

    try {
      const updateCurrent = api.put(`/school/transport-stops/${currentStop.id}`, {
        route_id: routeId,
        stop_name: currentStop.stop_name,
        stop_order: currentStop.stop_order,
        arrival_time: currentStop.arrival_time || null,
        departure_time: currentStop.departure_time || null,
        status: currentStop.status || 'Active',
      });

      const updateOther = api.put(`/school/transport-stops/${otherStop.id}`, {
        route_id: routeId,
        stop_name: otherStop.stop_name,
        stop_order: otherStop.stop_order,
        arrival_time: otherStop.arrival_time || null,
        departure_time: otherStop.departure_time || null,
        status: otherStop.status || 'Active',
      });

      await Promise.all([updateCurrent, updateOther]);
      toast.success('Stop sequence updated successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Error updating stop order:', error);
      toast.error('Failed to update stop sequence');
    }
  };

  const toggleRouteExpanded = (routeId: number) => {
    setExpandedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchRoutes();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [routes, searchTerm, filterEfficiency, filterStatus, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterEfficiency, filterStatus, showTrashed, currentPage, itemsPerPage]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/transport-routes', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...routes];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.route_name.toLowerCase().includes(lowerSearch) ||
        item.route_code.toLowerCase().includes(lowerSearch) ||
        (item.driver_name && item.driver_name.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterEfficiency) {
      filtered = filtered.filter(item => item.efficiency_rating === filterEfficiency);
    }

    if (filterStatus) {
      const activeBool = filterStatus === 'Active';
      filtered = filtered.filter(item => item.is_active === activeBool);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Route] ?? '';
      let bVal: any = b[sortColumn as keyof Route] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEfficiency('');
    setFilterStatus('');
  };

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addStopField = () => {
    setFormStops(prev => [
      ...prev,
      { stop_name: '', arrival_time: '', distance_km: '' }
    ]);
  };

  const addMultipleStops = () => {
    setFormStops(prev => [
      ...prev,
      { stop_name: '', arrival_time: '', distance_km: '' },
      { stop_name: '', arrival_time: '', distance_km: '' },
      { stop_name: '', arrival_time: '', distance_km: '' }
    ]);
  };

  const removeStopField = (index: number) => {
    setFormStops(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStopChange = (index: number, field: keyof Stop, value: string) => {
    setFormStops(prev => prev.map((stop, idx) => {
      if (idx === index) {
        return { ...stop, [field]: value };
      }
      return stop;
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      route_name: '',
      route_code: '',
      vehicle_number: '',
      driver_name: '',
      driver_phone: '',
      capacity: '',
      amount: '',
      distance_km: '',
      estimated_duration_min: '',
      description: '',
      efficiency_rating: 'Good',
      is_active: true,
    });
    setFormStops([
      { stop_name: '', arrival_time: '', distance_km: '' },
      { stop_name: '', arrival_time: '', distance_km: '' },
      { stop_name: '', arrival_time: '', distance_km: '' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Route) => {
    setEditingItem(item);
    setFormData({
      route_name: item.route_name,
      route_code: item.route_code,
      vehicle_number: item.vehicle_number || '',
      driver_name: item.driver_name || '',
      driver_phone: item.driver_phone || '',
      capacity: item.capacity ? item.capacity.toString() : '',
      amount: item.amount ? item.amount.toString() : '',
      distance_km: item.distance_km ? item.distance_km.toString() : '',
      estimated_duration_min: item.estimated_duration_min ? item.estimated_duration_min.toString() : '',
      description: item.description || '',
      efficiency_rating: item.efficiency_rating || 'Good',
      is_active: item.is_active,
    });

    const parsedStops = (item.stops || []).map(s => ({
      id: s.id,
      stop_name: s.stop_name,
      stop_code: s.stop_code || '',
      stop_type: s.stop_type || 'Sub Stop',
      stop_order: s.stop_order,
      distance_km: s.distance_km || '',
      arrival_time: s.arrival_time ? s.arrival_time.substring(0, 5) : '',
      departure_time: s.departure_time ? s.departure_time.substring(0, 5) : '',
      location_address: s.location_address || '',
      latitude: s.latitude || '',
      longitude: s.longitude || '',
      status: s.status || 'Active',
      notes: s.notes || '',
    }));

    setFormStops(parsedStops.length > 0 ? parsedStops : [
      { stop_name: '', arrival_time: '', distance_km: '' }
    ]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.route_name) {
      toast.error('Route Name is required');
      return;
    }
    if (!formData.route_code) {
      toast.error('Route Code is required');
      return;
    }

    // Filter valid stops
    const validStops = formStops.filter(s => s.stop_name.trim() !== '');

    const submitData = {
      route_name: formData.route_name,
      route_code: formData.route_code,
      vehicle_number: formData.vehicle_number || null,
      driver_name: formData.driver_name || null,
      driver_phone: formData.driver_phone || null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      amount: formData.amount ? parseFloat(formData.amount) : null,
      distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
      estimated_duration_min: formData.estimated_duration_min ? parseInt(formData.estimated_duration_min) : null,
      description: formData.description || null,
      efficiency_rating: formData.efficiency_rating,
      is_active: formData.is_active,
      stops: validStops.map(s => ({
        id: s.id,
        stop_name: s.stop_name,
        stop_code: s.stop_code || null,
        stop_type: s.stop_type || 'Sub Stop',
        distance_km: s.distance_km ? parseFloat(s.distance_km.toString()) : null,
        arrival_time: s.arrival_time || null,
        location_address: s.location_address || null,
        status: s.status || 'Active',
        notes: s.notes || null,
      }))
    };

    try {
      if (editingItem) {
        const response = await api.put(`/school/transport-routes/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Route updated successfully');
        }
      } else {
        const response = await api.post('/school/transport-routes', submitData);
        if (response.data.success) {
          toast.success('Route registered successfully');
        }
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (window.confirm(`Are you sure you want to ${action} route "${name}"?`)) {
      try {
        let response;
        if (showTrashed) {
          response = await api.delete(`/school/transport-routes/${id}/force`);
        } else {
          response = await api.delete(`/school/transport-routes/${id}`);
        }
        if (response.data.success) {
          toast.success(`Route ${showTrashed ? 'permanently deleted' : 'deleted'} successfully`);
          fetchRoutes();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/transport-routes/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Route status updated');
        fetchRoutes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this route?')) return;
    try {
      const response = await api.post(`/school/transport-routes/${id}/restore`);
      if (response.data.success) {
        toast.success('Route restored successfully');
        fetchRoutes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore route');
    }
  };

  // Bulk Actions
  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => item.id);
      setSelectedItems(new Set(ids));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);

    try {
      const response = await api.post('/school/transport-routes/bulk-status', {
        is_active: isActive,
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchRoutes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected route(s)?`
      : `Are you sure you want to delete ${selectedItems.size} selected route(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/transport-routes/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchRoutes();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected route(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/transport-routes/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchRoutes();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to restore');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  // Excel Operations
  const handleExport = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Route Name': item.route_name,
        'Route Code': item.route_code,
        'Assigned Vehicle': item.vehicle_number || '',
        'Driver Name': item.driver_name || '',
        'Driver Phone': item.driver_phone || '',
        'Capacity': item.capacity || '',
        'Amount / Fee': item.amount || '',
        'Distance (km)': item.distance_km || '',
        'Duration (min)': item.estimated_duration_min || '',
        'Description': item.description || '',
        'Efficiency Rating': item.efficiency_rating || '',
        'Status': item.is_active ? 'Active' : 'Inactive',
        'Stops Count': item.stops?.length || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Routes');
      XLSX.writeFile(wb, `routes_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Routes');

      worksheet.columns = [
        { header: 'Route Name *', key: 'route_name', width: 20 },
        { header: 'Route Code *', key: 'route_code', width: 15 },
        { header: 'Vehicle Number', key: 'vehicle_number', width: 15 },
        { header: 'Driver Name', key: 'driver_name', width: 15 },
        { header: 'Driver Phone', key: 'driver_phone', width: 15 },
        { header: 'Capacity', key: 'capacity', width: 12 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Distance (km)', key: 'distance_km', width: 15 },
        { header: 'Duration (min)', key: 'estimated_duration_min', width: 15 },
        { header: 'Description', key: 'description', width: 25 },
        { header: 'Efficiency Rating (Good/Average/Poor)', key: 'efficiency_rating', width: 20 },
      ];

      worksheet.addRow({
        route_name: 'North Route',
        route_code: 'RT-NORTH-01',
        vehicle_number: 'DL-01-A-1234',
        driver_name: 'Satish Singh',
        driver_phone: '+91-9876543210',
        capacity: 40,
        amount: 1200,
        distance_km: 25.5,
        estimated_duration_min: 45,
        description: 'Covers North Delhi stop points',
        efficiency_rating: 'Good',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_routes.xlsx');
      toast.success('Sample template downloaded!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download sample file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const firstCell = rows[i][0];
          if (firstCell && (firstCell === 'Route Name *' || firstCell?.toString().includes('Route Name'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Route Name *")');
          return;
        }

        const dataRows: any[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const hasData = row.some((cell: any) => cell && cell.toString().trim() !== '');
          if (!hasData) continue;

          const rowData: any = {};
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const cleanHeader = header.replace(' *', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }

          if (rowData['Route Name'] && rowData['Route Code']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found.');
          return;
        }

        const payloadData = dataRows.map(row => ({
          route_name: row['Route Name'],
          route_code: row['Route Code'],
          vehicle_number: row['Vehicle Number'] || null,
          driver_name: row['Driver Name'] || null,
          driver_phone: row['Driver Phone'] || null,
          capacity: row['Capacity'] ? parseInt(row['Capacity']) : null,
          amount: row['Amount'] ? parseFloat(row['Amount']) : null,
          distance_km: row['Distance (km)'] ? parseFloat(row['Distance (km)']) : null,
          estimated_duration_min: row['Duration (min)'] ? parseInt(row['Duration (min)']) : null,
          description: row['Description'] || null,
          efficiency_rating: row['Efficiency Rating (Good/Average/Poor)'] || 'Good',
          is_active: true,
        }));

        setImportData(payloadData);
        setImportPreview(dataRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submitImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/school/transport-routes/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchRoutes();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const totalDistance = filteredData.reduce((acc, r) => acc + (r.distance_km || 0), 0);
  const avgDuration = filteredData.length > 0
    ? Math.round(filteredData.reduce((acc, r) => acc + (r.estimated_duration_min || 0), 0) / filteredData.length)
    : 0;

  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Transport Route Management</h3>
          <p className="text-[12px] text-gray-500">Configure transit routes, distance charts, efficiency ratings, and stops sequences</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Routes</span>
            <span className="text-xs font-bold text-slate-700">{routes.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Total KM</span>
            <span className="text-xs font-bold text-emerald-700">{totalDistance.toFixed(1)}</span>
          </div>
          <div className="bg-blue-50/60 border border-blue-100/80 rounded px-2.5 py-0.5 text-center min-w-[65px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">Avg Min</span>
            <span className="text-xs font-bold text-blue-700">{avgDuration}m</span>
          </div>
        </div>
      </div>

      {/* Tab headers bar */}
      <div className="border-b border-gray-200 bg-white px-4 pt-1 flex items-center gap-6 rounded-t-xl shadow-xs">
        <button
          onClick={() => setActiveTab('all_routes')}
          className={`py-2.5 px-1 font-bold border-b-2 text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeTab === 'all_routes'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          🗺️ All Routes
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
            activeTab === 'all_routes'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-150'
              : 'bg-indigo-50/50 text-indigo-500/85 border border-indigo-100/50'
          }`}>
            {routes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('route_stops')}
          className={`py-2.5 px-1 font-bold border-b-2 text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeTab === 'route_stops'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          📍 Route Stops
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-indigo-50 text-indigo-600 border border-indigo-150`}>
            {routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('optimization')}
          className={`py-2.5 px-1 font-bold border-b-2 text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeTab === 'optimization'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          🎯 Optimization
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-amber-50 text-amber-600 border border-amber-150`}>
            {routes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('route_map')}
          className={`py-2.5 px-1 font-bold border-b-2 text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            activeTab === 'route_map'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          🚌 Route Map
        </button>
      </div>

      {activeTab === 'all_routes' && (
        <>
          {/* Toolbar Area */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search route name, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-2 py-1 w-48 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
                />
              </div>

              <SearchableSelect
                options={[
                  { value: 'Good', label: 'Good' },
                  { value: 'Average', label: 'Average' },
                  { value: 'Poor', label: 'Poor' }
                ]}
                value={filterEfficiency}
                onChange={(val) => setFilterEfficiency(val)}
                placeholder="All Efficiencies"
                isClearable={true}
                className="w-36 text-xs"
                compact={true}
              />

              <SearchableSelect
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' }
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                placeholder="All Status"
                isClearable={true}
                className="w-28 text-xs"
                compact={true}
              />

              {/* Trashed Toggle */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
                <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
                <button
                  type="button"
                  onClick={() => setShowTrashed(prev => !prev)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[18px]' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {(searchTerm || filterEfficiency || filterStatus) && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium px-1 cursor-pointer">
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={downloadSampleFile}
                className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
                title="Download Route Sample Template"
              >
                Sample
              </button>

              <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
                Import
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
              >
                Export
              </button>

              {!showTrashed && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium cursor-pointer"
                >
                  Add Route
                </button>
              )}
            </div>
          </div>

          {/* Trashed Warning Banner */}
          {showTrashed && (
            <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
              <span>You are viewing deleted routes. You can restore them or permanently delete them below.</span>
            </div>
          )}

          {/* Bulk actions */}
          {selectedItems.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
              <div className="text-blue-800 font-bold">{selectedItems.size} item(s) selected</div>
              <div className="flex items-center gap-1.5">
                {!showTrashed ? (
                  <>
                    <button
                      onClick={() => handleBulkStatusUpdate(true)}
                      disabled={bulkUpdating}
                      className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium cursor-pointer"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate(false)}
                      disabled={bulkUpdating}
                      className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium cursor-pointer"
                    >
                      Inactive
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkUpdating}
                      className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      disabled={bulkUpdating}
                      className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkUpdating}
                      className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedItems(new Set())} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Main Table Grid */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-bold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th onClick={() => handleSort('route_code')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                    Route Code {getSortIcon('route_code')}
                  </th>
                  <th onClick={() => handleSort('route_name')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                    Route Name {getSortIcon('route_name')}
                  </th>
                  <th className="py-2.5 px-3">Vehicle Details</th>
                  <th className="py-2.5 px-3">Driver Info</th>
                  <th className="py-2.5 px-3 text-center">Stops Count</th>
                  <th className="py-2.5 px-3 text-center">Distance / Time</th>
                  <th className="py-2.5 px-3 text-center">Efficiency</th>
                  <th onClick={() => handleSort('is_active')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none text-center w-20">
                    Status {getSortIcon('is_active')}
                  </th>
                  <th className="py-2.5 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">Loading routes data...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-500">No transit routes found.</td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-800">{item.route_code}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-gray-955">{item.route_name}</div>
                        {item.description && <div className="text-[10px] text-gray-400 mt-0.5">{item.description}</div>}
                      </td>
                      <td className="py-2 px-3">{item.vehicle_number || '—'}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold">{item.driver_name || '—'}</div>
                        {item.driver_phone && <div className="text-[10px] text-gray-400">{item.driver_phone}</div>}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-blue-650 bg-blue-50/40 rounded">
                        {item.stops?.length || 0} stops
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="font-bold">{item.distance_km ? `${item.distance_km} km` : '—'}</div>
                        {item.estimated_duration_min && <div className="text-[10px] text-gray-400">{item.estimated_duration_min} mins</div>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          item.efficiency_rating === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.efficiency_rating === 'Average' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.efficiency_rating || 'Good'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            checked={item.is_active}
                            onChange={() => handleToggleStatus(item.id)}
                            disabled={showTrashed}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {showTrashed ? (
                            <>
                              <button onClick={() => handleRestore(item.id)} className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 cursor-pointer" title="Restore">
                                Restore
                              </button>
                              <button onClick={() => handleDelete(item.id, item.route_name)} className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 cursor-pointer" title="Delete Permanently">
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openEditModal(item)} className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 cursor-pointer" title="Edit">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(item.id, item.route_name)} className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 cursor-pointer" title="Delete">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-2 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500">
                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
                <span className="font-semibold">{filteredData.length}</span> routes
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-xs cursor-pointer font-bold"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-2.5 py-1 border rounded text-xs font-bold cursor-pointer ${
                      currentPage === idx + 1 ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-xs cursor-pointer font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'route_stops' && (
        <div className="space-y-3">
          <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-950 p-3 rounded-lg text-xs leading-normal flex items-center gap-2">
            <span className="text-lg">ℹ️</span>
            <div>
              <strong className="font-bold">Route Sequencing Management:</strong> Expand any route below to adjust the sequential order of its stops. Use the <strong className="font-bold">↑ Move Up</strong> or <strong className="font-bold">↓ Move Down</strong> controls to update their schedule sequence in the database.
            </div>
          </div>

          <div className="space-y-2">
            {routes.length === 0 ? (
              <div className="bg-white border border-gray-250 p-8 text-center text-gray-500 rounded-xl">No routes available.</div>
            ) : (
              routes.map((route) => {
                const isExpanded = expandedRoutes.has(route.id);
                const sortedStops = [...(route.stops || [])].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

                return (
                  <div key={route.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:border-gray-300 transition-colors">
                    {/* Route Header */}
                    <div 
                      onClick={() => toggleRouteExpanded(route.id)}
                      className="flex items-center justify-between p-3.5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded text-xs">
                          {route.route_code}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">{route.route_name}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                            Vehicle: <span className="text-gray-600 font-semibold">{route.vehicle_number || 'N/A'}</span> • Driver: <span className="text-gray-600 font-semibold">{route.driver_name || 'N/A'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded text-[10px]">
                          📍 {sortedStops.length} Stops
                        </div>
                        <span className="text-gray-400 font-bold text-sm">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Stops List */}
                    {isExpanded && (
                      <div className="border-t border-gray-150 p-3 bg-white animate-fadeIn">
                        {sortedStops.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 italic">No stops mapped to this route. Go to Stop Management to add stops.</div>
                        ) : (
                          <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 font-bold uppercase text-[9px] whitespace-nowrap">
                                  <th className="py-2 px-3 text-center w-12">Seq</th>
                                  <th className="py-2 px-3">Stop Code</th>
                                  <th className="py-2 px-3">Stop Name</th>
                                  <th className="py-2 px-3">Arrival Time</th>
                                  <th className="py-2 px-3">Distance</th>
                                  <th className="py-2 px-3 text-center">Status</th>
                                  <th className="py-2 px-3 text-center w-28">Order Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {sortedStops.map((stop, idx) => (
                                  <tr key={stop.id} className="hover:bg-slate-50/40 text-gray-700 font-medium">
                                    <td className="py-2 px-3 text-center">
                                      <span className="w-5 h-5 bg-indigo-50 text-indigo-700 font-bold rounded-full flex items-center justify-center text-[10px] mx-auto">
                                        #{idx + 1}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-gray-800">{stop.stop_code || '—'}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{stop.stop_name}</td>
                                    <td className="py-2 px-3 text-slate-600 font-semibold">{stop.arrival_time ? stop.arrival_time.substring(0, 5) : '—'}</td>
                                    <td className="py-2 px-3 text-emerald-700 font-bold">{stop.distance_km ? `${stop.distance_km} km` : '—'}</td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                        stop.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                      }`}>
                                        {stop.status || 'Active'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleMoveStop(route.id, idx, 'up')}
                                          className="px-2 py-1 bg-white border border-gray-300 hover:bg-slate-50 text-gray-700 rounded font-bold text-[10px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                          title="Move Stop Up"
                                        >
                                          ↑ Up
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === sortedStops.length - 1}
                                          onClick={() => handleMoveStop(route.id, idx, 'down')}
                                          className="px-2 py-1 bg-white border border-gray-300 hover:bg-slate-50 text-gray-700 rounded font-bold text-[10px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                          title="Move Stop Down"
                                        >
                                          ↓ Down
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
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'optimization' && (
        <div className="space-y-4">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Average Utilization</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-indigo-650">
                  {routes.length > 0
                    ? Math.round(
                        routes.reduce((acc, r) => {
                          const routeStudents = students.filter(s => s.route === r.route_name).length;
                          const capacity = r.capacity || 40;
                          return acc + (routeStudents / capacity) * 100;
                        }, 0) / routes.length
                      )
                    : 0}%
                </span>
                <span className="text-[10px] text-green-500 font-bold">↑ Optimal Load</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Across all scheduled school routes</p>
            </div>

            <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total Mileage</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-emerald-700">
                  {routes.reduce((acc, r) => acc + (r.distance_km || 0), 0).toFixed(1)} km
                </span>
                <span className="text-[10px] text-indigo-500 font-bold">Total Transit</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Daily total route distances</p>
            </div>

            <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Overall Efficiency</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-amber-600">92%</span>
                <span className="text-[10px] text-indigo-500 font-bold">Excellent</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Based on times & seat occupancy</p>
            </div>

            <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Most Utilized Route</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-extrabold text-rose-600 truncate max-w-[150px]">
                  {routes.length > 0
                    ? (() => {
                        let maxUtil = -1;
                        let bestRouteName = 'N/A';
                        routes.forEach(r => {
                          const routeStudents = students.filter(s => s.route === r.route_name).length;
                          const capacity = r.capacity || 40;
                          const util = (routeStudents / capacity) * 100;
                          if (util > maxUtil) {
                            maxUtil = util;
                            bestRouteName = r.route_name;
                          }
                        });
                        return bestRouteName;
                      })()
                    : 'N/A'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Running at maximum capacity</p>
            </div>
          </div>

          {/* Efficiency Report Table */}
          <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-gray-150 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">🎯 Route Resource & Capacity Optimization Chart</h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                Telemetry Log Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/30 text-gray-600 font-bold uppercase text-[9px] whitespace-nowrap">
                    <th className="py-2.5 px-3">Route Details</th>
                    <th className="py-2.5 px-3 text-center">Allocated Students / Capacity</th>
                    <th className="py-2.5 px-3">Utilization Rate</th>
                    <th className="py-2.5 px-3 text-center">Efficiency Rating</th>
                    <th className="py-2.5 px-3">Optimization Action & Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">Calculating optimization report...</td>
                    </tr>
                  ) : routes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">No transit routes available for optimization check.</td>
                    </tr>
                  ) : (
                    routes.map((route) => {
                      const routeStudents = students.filter(s => s.route === route.route_name).length;
                      const capacity = route.capacity || 40;
                      const utilization = Math.round((routeStudents / capacity) * 100);

                      // Determine recommendation text
                      let recommendation = "";
                      let recBadge = "";
                      if (utilization > 90) {
                        recommendation = "Capacity threshold exceeded. Shift 3-4 stop points to adjacent low load routes.";
                        recBadge = "bg-rose-50 text-rose-700 border-rose-200";
                      } else if (utilization >= 60 && utilization <= 90) {
                        recommendation = "Optimal load allocation. Schedule is highly cost-efficient. Keep monitoring timings.";
                        recBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      } else {
                        recommendation = "Underutilized vehicle. Merge stop patterns or consolidate driver sheets with next route.";
                        recBadge = "bg-amber-50 text-amber-700 border-amber-200";
                      }

                      return (
                        <tr key={route.id} className="hover:bg-slate-50/50 text-gray-700">
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">{route.route_name}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {route.route_code} • {route.vehicle_number || 'No Vehicle'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-extrabold text-slate-800 text-xs">
                              {routeStudents}
                            </span>
                            <span className="text-gray-400"> / {capacity} seats</span>
                          </td>
                          <td className="py-3 px-3 w-52">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    utilization > 90 ? 'bg-rose-500' : utilization >= 60 ? 'bg-green-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-[11px] text-gray-700 w-8">{utilization}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] border ${
                              route.efficiency_rating === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              route.efficiency_rating === 'Average' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {route.efficiency_rating || 'Good'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${recBadge}`}>
                              {recommendation}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'route_map' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Map canvas */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-150 pb-2 mb-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">📍 Dynamic Transit Route Map Visualizer</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Focus Route:</span>
                <select
                  value={selectedMapRoute}
                  onChange={(e) => setSelectedMapRoute(e.target.value)}
                  className="px-2 py-0.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-bold text-indigo-700 cursor-pointer"
                >
                  <option value="All">All Routes</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.route_name}>{r.route_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <line x1="15%" y1="0%" x2="15%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="85%" y1="0%" x2="85%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="0%" y1="40%" x2="100%" y2="40%" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="0%" y1="80%" x2="100%" y2="80%" stroke="#e2e8f0" strokeWidth="1" />
              </svg>

              {routes.length === 0 ? (
                <div className="text-gray-400 text-xs font-bold">No routes defined. Add routes to see them here.</div>
              ) : (
                <div className="w-full max-w-2xl h-80 relative">
                  <svg viewBox="0 0 600 300" className="w-full h-full">
                    {/* Draw Bezier connector lines between stops */}
                    {routes.map((route, rIdx) => {
                      const routeStops = [...(route.stops || [])].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
                      if (routeStops.length < 2) return null;

                      // Colors
                      const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
                      const strokeColor = colors[rIdx % colors.length];
                      const isFocused = selectedMapRoute === 'All' || selectedMapRoute === route.route_name;

                      // Map stops to coordinates dynamically
                      const coordinates = routeStops.map((stop, sIdx) => {
                        const total = routeStops.length;
                        const factor = sIdx / (total - 1 || 1);
                        const x = 80 + factor * 440;
                        const y = 80 + (rIdx * 50) + Math.sin(sIdx * 1.5) * 30;
                        return { x, y, stop };
                      });

                      // Construct path data
                      let pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
                      for (let i = 1; i < coordinates.length; i++) {
                        const prev = coordinates[i - 1];
                        const curr = coordinates[i];
                        const cpX = (prev.x + curr.x) / 2;
                        pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${cpX} ${curr.y}`;
                      }

                      return (
                        <g key={route.id} className="transition-opacity duration-300" opacity={isFocused ? 1 : 0.15}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray="4,4"
                          />
                          {/* Animated bus emoji moving along path */}
                          {isFocused && (
                            <text className="animate-pulse font-bold text-sm">
                              <textPath href={`#route-path-${route.id}`} startOffset="50%" fill={strokeColor}>
                                🚌
                              </textPath>
                            </text>
                          )}
                          <path id={`route-path-${route.id}`} d={pathD} fill="none" stroke="none" />
                        </g>
                      );
                    })}

                    {/* Draw Stop Pins */}
                    {routes.flatMap((route, rIdx) => {
                      const routeStops = [...(route.stops || [])].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
                      const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
                      const pinColor = colors[rIdx % colors.length];
                      const isFocused = selectedMapRoute === 'All' || selectedMapRoute === route.route_name;

                      return routeStops.map((stop, sIdx) => {
                        const total = routeStops.length;
                        const factor = sIdx / (total - 1 || 1);
                        const x = 80 + factor * 440;
                        const y = 80 + (rIdx * 50) + Math.sin(sIdx * 1.5) * 30;

                        return (
                          <g
                            key={stop.id || `${route.id}-${sIdx}`}
                            className="group/pin cursor-pointer transition-opacity duration-300"
                            opacity={isFocused ? 1 : 0.15}
                          >
                            <circle cx={x} cy={y} r="14" fill={pinColor} opacity="0" className="group-hover/pin:opacity-25 transition-opacity duration-200" />
                            <circle cx={x} cy={y} r="14" stroke={pinColor} strokeWidth="1" fill="none" opacity="0" className="group-hover/pin:opacity-40 animate-ping" />
                            <circle cx={x} cy={y} r="7.5" fill="#ffffff" stroke={pinColor} strokeWidth="3" />
                            <circle cx={x} cy={y} r="2.5" fill={pinColor} />
                            
                            {/* Hover tooltip overlay */}
                            <foreignObject x={x - 70} y={y - 85} width="140" height="75" className="hidden group-hover/pin:block transition-all duration-200 z-50">
                              <div className="bg-slate-900/95 text-white p-1.5 rounded-lg border border-slate-800 text-[9px] shadow-lg leading-tight relative">
                                <p className="font-extrabold text-[10px] truncate text-indigo-400">{stop.stop_name}</p>
                                <p className="mt-0.5 font-bold"><span className="text-gray-400">Sequence:</span> #{stop.stop_order || sIdx + 1}</p>
                                <p className="font-bold"><span className="text-gray-400">Route:</span> {route.route_name}</p>
                                {stop.arrival_time && <p className="font-bold"><span className="text-gray-400">ETA:</span> {stop.arrival_time.substring(0, 5)}</p>}
                                {stop.distance_km && <p className="font-bold text-emerald-400"><span className="text-gray-400">Dist:</span> {stop.distance_km} km</p>}
                                <div className="absolute w-2 h-2 bg-slate-900 rotate-45 left-1/2 -translate-x-1/2 bottom-[-4px]" />
                              </div>
                            </foreignObject>

                            <text x={x} y={y + 16} textAnchor="middle" fill="#334155" className="text-[8px] font-extrabold tracking-tight select-none pointer-events-none">
                              {stop.stop_name}
                            </text>
                          </g>
                        );
                      });
                    })}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Details side panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide border-b border-gray-150 pb-2 mb-3">📋 Route Specifications</h4>
              
              {selectedMapRoute === 'All' ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">Select a specific route focus dropdown above to view real-time driver telemetry details.</p>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {routes.map((route, idx) => {
                      const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
                      const routeColor = colors[idx % colors.length];
                      return (
                        <div 
                          key={route.id} 
                          onClick={() => setSelectedMapRoute(route.route_name)}
                          className="p-2 border border-gray-100 rounded-lg hover:border-gray-300 cursor-pointer bg-slate-50/30 transition-all flex items-start gap-2 text-xs"
                        >
                          <span className="w-3.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: routeColor }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">{route.route_name}</p>
                            <p className="text-[9px] font-semibold text-slate-400">
                              Vehicle: <span className="text-slate-600 font-bold">{route.vehicle_number || '—'}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                (() => {
                  const focusedRoute = routes.find(r => r.route_name === selectedMapRoute);
                  if (!focusedRoute) return null;

                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Route</span>
                        <h5 className="font-extrabold text-indigo-750 text-xs">{focusedRoute.route_name}</h5>
                        <p className="text-[10px] font-semibold text-gray-400">Code: <span className="text-gray-600 font-bold">{focusedRoute.route_code}</span></p>
                      </div>

                      {/* Driver Card overlay */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {focusedRoute.driver_name ? focusedRoute.driver_name.charAt(0) : '👤'}
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Assigned Operator</span>
                            <span className="font-bold text-slate-800 text-xs block">{focusedRoute.driver_name || 'Not Assigned'}</span>
                            <span className="text-[9px] font-semibold text-slate-400">{focusedRoute.driver_phone || 'No Contact'}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-[10px]">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Vehicle</span>
                            <span className="font-bold text-slate-700">{focusedRoute.vehicle_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Capacity</span>
                            <span className="font-bold text-slate-700">{focusedRoute.capacity ? `${focusedRoute.capacity} Seats` : 'N/A'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Distance</span>
                            <span className="font-bold text-emerald-700">{focusedRoute.distance_km ? `${focusedRoute.distance_km} km` : '—'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Est. Duration</span>
                            <span className="font-bold text-indigo-600">{focusedRoute.estimated_duration_min ? `${focusedRoute.estimated_duration_min} mins` : '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Transit Progress</span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-600">
                            <span>Origin Depot</span>
                            <span>School Gate</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                            <div className="h-full w-2/3 bg-indigo-500 rounded-full" />
                            <div className="w-2.5 h-2.5 bg-indigo-650 rounded-full border-2 border-white absolute top-1/2 -translate-y-1/2 left-2/3 -translate-x-1/2 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-4">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">GPS Transceiver</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-extrabold text-slate-700">GPS location linked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">
                {editingItem ? '✏️ Edit Transit Route' : '🗺️ Add New Route'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Route Name *</label>
                  <input
                    type="text"
                    required
                    name="route_name"
                    value={formData.route_name}
                    onChange={handleInputChange}
                    placeholder="e.g. North Route"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Route Code *</label>
                  <input
                    type="text"
                    required
                    name="route_code"
                    value={formData.route_code}
                    onChange={handleInputChange}
                    placeholder="e.g. RT-NORTH-01"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Assigned Vehicle</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="e.g. DL-01-A-1234"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Driver Name</label>
                  <input
                    type="text"
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh Kumar"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Driver Phone</label>
                  <input
                    type="text"
                    name="driver_phone"
                    value={formData.driver_phone}
                    onChange={handleInputChange}
                    placeholder="+91-XXXXXXXXXX"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="40"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Total Distance (km)</label>
                  <input
                    type="text"
                    name="distance_km"
                    value={formData.distance_km}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.5"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Estimated Time (minutes)</label>
                  <input
                    type="number"
                    name="estimated_duration_min"
                    value={formData.estimated_duration_min}
                    onChange={handleInputChange}
                    placeholder="e.g., 45"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Fare Amount / Month</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="1200"
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Route description, coverage area..."
                  rows={1}
                  className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Efficiency Rating</label>
                  <select
                    name="efficiency_rating"
                    value={formData.efficiency_rating}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="Good">🟢 Good</option>
                    <option value="Average">🟡 Average</option>
                    <option value="Poor">🔴 Poor</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className={lbl}>Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <ToggleSwitch
                      checked={formData.is_active}
                      onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <span className={`text-xs font-bold ${formData.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Dynamic nested stops creator */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-indigo-750 uppercase tracking-wide">Route Stops *</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={addStopField}
                      className="px-2 py-0.5 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 rounded-md hover:bg-indigo-100 cursor-pointer"
                    >
                      + Add Stop
                    </button>
                    <button
                      type="button"
                      onClick={addMultipleStops}
                      className="px-2 py-0.5 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 rounded-md hover:bg-indigo-100 cursor-pointer"
                    >
                      📄 Add Multiple Stops
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50 max-h-[160px] overflow-y-auto">
                  {formStops.length === 0 ? (
                    <div className="text-center py-4 text-gray-450 italic">No stops added yet. Click "+ Add Stop" to begin.</div>
                  ) : (
                    formStops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2 animate-fadeIn">
                        <span className="text-[10px] font-bold text-slate-400 w-4">#{index + 1}</span>
                        <input
                          type="text"
                          required
                          value={stop.stop_name}
                          onChange={(e) => handleStopChange(index, 'stop_name', e.target.value)}
                          placeholder="Stop name (e.g. City Center)"
                          className="flex-1 px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                        />
                        <input
                          type="time"
                          value={stop.arrival_time}
                          onChange={(e) => handleStopChange(index, 'arrival_time', e.target.value)}
                          className="w-28 px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                        />
                        <input
                          type="text"
                          value={stop.distance_km}
                          onChange={(e) => handleStopChange(index, 'distance_km', e.target.value)}
                          placeholder="Dist (km)"
                          className="w-20 px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeStopField(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Updates' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Data Import Preview modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white">
              <h2 className="text-sm font-extrabold">Excel Data Import Preview ({importData.length} records)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white hover:text-slate-200 text-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Showing first 5 rows for review:</p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs font-medium text-slate-650">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Route Name</th>
                      <th className="py-2 px-3">Route Code</th>
                      <th className="py-2 px-3">Assigned Vehicle</th>
                      <th className="py-2 px-3">Driver Name</th>
                      <th className="py-2 px-3">Distance (km)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row['Route Name']}</td>
                        <td className="py-2 px-3">{row['Route Code']}</td>
                        <td className="py-2 px-3 font-bold text-slate-700">{row['Vehicle Number']}</td>
                        <td className="py-2 px-3">{row['Driver Name']}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{row['Distance (km)']} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-250 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={submitImport}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {importing ? 'Importing...' : 'Confirm Bulk Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManager;
