import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface RouteStop {
  id: number;
  stop_name: string;
  stop_order: number;
}

interface RouteOption {
  value: number;
  label: string;
  stops?: RouteStop[];
}

interface VehicleOption {
  value: number;
  label: string;
}

interface DriverOption {
  value: number;
  label: string;
}

interface Trip {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  trip_name: string;
  trip_code: string | null;
  route_id: number;
  trip_type: string;
  trip_type_id: number | null;
  vehicle_id: number | null;
  driver_id: number | null;
  departure_time: string;
  expected_arrival_time: string | null;
  status: string;
  status_id: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  trip_type_master?: { m_id: number; m_name: string; m_alias_name: string } | null;
  status_master?: { m_id: number; m_name: string; m_alias_name: string } | null;
  route?: {
    id: number;
    route_name: string;
    route_code: string;
    stops?: RouteStop[];
  };
  vehicle?: {
    id: number;
    vehicle_number: string;
    model: string | null;
  };
  driver?: {
    id: number;
    full_name: string;
    phone_number: string;
  };
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

const TripManager: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [filteredData, setFilteredData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Trip | null>(null);

  // Master databases
  const [tripTypes, setTripTypes] = useState<{ id: number; name: string }[]>([]);
  const [tripStatuses, setTripStatuses] = useState<{ id: number; name: string }[]>([]);

  // Stats from backend
  const [stats, setStats] = useState({
    Scheduled: 0,
    'In Progress': 0,
    Completed: 0,
    Cancelled: 0,
    All: 0,
  });

  // Filters
  const [showTrashed, setShowTrashed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterTripType, setFilterTripType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All'); // All, Scheduled, In Progress, Completed

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('departure_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    trip_name: '',
    trip_code: '',
    route_id: '',
    trip_type_id: '',
    vehicle_id: '',
    driver_id: '',
    departure_time: '',
    expected_arrival_time: '',
    status_id: '',
    notes: '',
  });

  // Dynamic Stop Sequence loaded in Form Modal
  const [stopSequence, setStopSequence] = useState<RouteStop[]>([]);

  useEffect(() => {
    fetchRoutes();
    fetchVehicles();
    fetchDrivers();
    fetchTripTypes();
    fetchTripStatuses();
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [showTrashed, activeTab]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [trips, searchTerm, filterRoute, filterVehicle, filterDriver, filterTripType, filterStatus, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterRoute, filterVehicle, filterDriver, filterTripType, filterStatus, showTrashed, activeTab, currentPage, itemsPerPage]);

  // Handle auto loading stop sequence on Route selection inside Form
  useEffect(() => {
    if (formData.route_id) {
      const selectedRoute = routes.find(r => String(r.value) === String(formData.route_id));
      if (selectedRoute && selectedRoute.stops) {
        const sortedStops = [...selectedRoute.stops].sort((a, b) => a.stop_order - b.stop_order);
        setStopSequence(sortedStops);
      } else {
        setStopSequence([]);
      }
    } else {
      setStopSequence([]);
    }
  }, [formData.route_id, routes]);

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/school/transport-routes');
      if (response.data.success) {
        const routeOpts = response.data.data.map((r: any) => ({
          value: r.id,
          label: r.route_name,
          stops: r.stops || []
        }));
        setRoutes(routeOpts);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/school/vehicles');
      if (response.data.success) {
        const vehicleOpts = response.data.data.map((v: any) => ({
          value: v.id,
          label: `${v.vehicle_number} (${v.model || 'No Model'})`
        }));
        setVehicles(vehicleOpts);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/school/drivers');
      if (response.data.success) {
        const driverOpts = response.data.data.map((d: any) => ({
          value: d.id,
          label: `${d.full_name} (${d.phone_number})`
        }));
        setDrivers(driverOpts);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchTripTypes = async () => {
    try {
      const response = await api.get('/master/trip-types');
      if (response.data.success) {
        const parsed = Object.entries(response.data.data).map(([id, name]) => ({
          id: parseInt(id),
          name: name as string
        }));
        setTripTypes(parsed);
      }
    } catch (error) {
      console.error('Error fetching trip types:', error);
    }
  };

  const fetchTripStatuses = async () => {
    try {
      const response = await api.get('/master/trip-statuses');
      if (response.data.success) {
        const parsed = Object.entries(response.data.data).map(([id, name]) => ({
          id: parseInt(id),
          name: name as string
        }));
        setTripStatuses(parsed);
      }
    } catch (error) {
      console.error('Error fetching trip statuses:', error);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params: any = { only_trashed: showTrashed };
      if (activeTab !== 'All') {
        params.status = activeTab;
      }
      const response = await api.get('/school/transport-trips', { params });
      if (response.data.success) {
        setTrips(response.data.data);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...trips];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.trip_name.toLowerCase().includes(lowerSearch) ||
        (item.trip_code && item.trip_code.toLowerCase().includes(lowerSearch)) ||
        (item.notes && item.notes.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterRoute) {
      filtered = filtered.filter(item => item.route_id === parseInt(filterRoute));
    }

    if (filterVehicle) {
      filtered = filtered.filter(item => item.vehicle_id === parseInt(filterVehicle));
    }

    if (filterDriver) {
      filtered = filtered.filter(item => item.driver_id === parseInt(filterDriver));
    }

    if (filterTripType) {
      filtered = filtered.filter(item => String(item.trip_type_id) === String(filterTripType));
    }

    if (filterStatus) {
      filtered = filtered.filter(item => String(item.status_id) === String(filterStatus));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Trip] ?? '';
      let bVal: any = b[sortColumn as keyof Trip] ?? '';

      if (sortColumn === 'route_name') {
        aVal = a.route?.route_name || '';
        bVal = b.route?.route_name || '';
      } else if (sortColumn === 'vehicle_number') {
        aVal = a.vehicle?.vehicle_number || '';
        bVal = b.vehicle?.vehicle_number || '';
      } else if (sortColumn === 'driver_name') {
        aVal = a.driver?.full_name || '';
        bVal = b.driver?.full_name || '';
      } else if (sortColumn === 'trip_type') {
        aVal = a.trip_type_master?.m_name || a.trip_type || '';
        bVal = b.trip_type_master?.m_name || b.trip_type || '';
      } else if (sortColumn === 'status') {
        aVal = a.status_master?.m_name || a.status || '';
        bVal = b.status_master?.m_name || b.status || '';
      }

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
    setFilterRoute('');
    setFilterVehicle('');
    setFilterDriver('');
    setFilterTripType('');
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

  const openAddModal = () => {
    setEditingItem(null);
    const morningType = tripTypes.find(t => t.name === 'Morning') || tripTypes[0];
    const scheduledStatus = tripStatuses.find(s => s.name === 'Scheduled') || tripStatuses[0];

    setFormData({
      trip_name: '',
      trip_code: '',
      route_id: routes.length > 0 ? String(routes[0].value) : '',
      trip_type_id: morningType ? String(morningType.id) : '',
      vehicle_id: vehicles.length > 0 ? String(vehicles[0].value) : '',
      driver_id: drivers.length > 0 ? String(drivers[0].value) : '',
      departure_time: '',
      expected_arrival_time: '',
      status_id: scheduledStatus ? String(scheduledStatus.id) : '',
      notes: '',
    });
    setStopSequence([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Trip) => {
    setEditingItem(item);
    
    // Formatting date-time string to local datetime-local format 'YYYY-MM-DDTHH:MM'
    const depTimeFormatted = item.departure_time ? item.departure_time.substring(0, 16).replace(' ', 'T') : '';
    const arrTimeFormatted = item.expected_arrival_time ? item.expected_arrival_time.substring(0, 16).replace(' ', 'T') : '';

    let tripTypeIdVal = item.trip_type_id ? String(item.trip_type_id) : '';
    if (!tripTypeIdVal && item.trip_type) {
      const found = tripTypes.find(t => t.name === item.trip_type);
      if (found) tripTypeIdVal = String(found.id);
    }

    let statusIdVal = item.status_id ? String(item.status_id) : '';
    if (!statusIdVal && item.status) {
      const found = tripStatuses.find(s => s.name === item.status);
      if (found) statusIdVal = String(found.id);
    }

    setFormData({
      trip_name: item.trip_name,
      trip_code: item.trip_code || '',
      route_id: String(item.route_id),
      trip_type_id: tripTypeIdVal,
      vehicle_id: item.vehicle_id ? String(item.vehicle_id) : '',
      driver_id: item.driver_id ? String(item.driver_id) : '',
      departure_time: depTimeFormatted,
      expected_arrival_time: arrTimeFormatted,
      status_id: statusIdVal,
      notes: item.notes || '',
    });

    if (item.route && item.route.stops) {
      setStopSequence([...item.route.stops].sort((a, b) => a.stop_order - b.stop_order));
    } else {
      const routeObj = routes.find(r => String(r.value) === String(item.route_id));
      if (routeObj && routeObj.stops) {
        setStopSequence([...routeObj.stops].sort((a, b) => a.stop_order - b.stop_order));
      }
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trip_name.trim()) {
      toast.error('Trip Name is required');
      return;
    }
    if (!formData.route_id) {
      toast.error('Route is required');
      return;
    }
    if (!formData.vehicle_id) {
      toast.error('Vehicle is required');
      return;
    }
    if (!formData.driver_id) {
      toast.error('Driver is required');
      return;
    }
    if (!formData.departure_time) {
      toast.error('Departure Time is required');
      return;
    }

    const submitData = {
      trip_name: formData.trip_name.trim(),
      trip_code: formData.trip_code.trim() || null,
      route_id: parseInt(formData.route_id),
      trip_type_id: formData.trip_type_id ? parseInt(formData.trip_type_id) : null,
      vehicle_id: parseInt(formData.vehicle_id),
      driver_id: parseInt(formData.driver_id),
      departure_time: formData.departure_time.replace('T', ' '),
      expected_arrival_time: formData.expected_arrival_time ? formData.expected_arrival_time.replace('T', ' ') : null,
      status_id: formData.status_id ? parseInt(formData.status_id) : null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (editingItem) {
        const response = await api.put(`/school/transport-trips/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Trip updated successfully');
        }
      } else {
        const response = await api.post('/school/transport-trips', submitData);
        if (response.data.success) {
          toast.success('Trip scheduled successfully');
        }
      }
      setIsModalOpen(false);
      fetchTrips();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const action = showTrashed ? 'permanently delete' : 'delete';
    if (window.confirm(`Are you sure you want to ${action} trip "${name}"?`)) {
      try {
        let response;
        if (showTrashed) {
          response = await api.delete(`/school/transport-trips/${id}/force`);
        } else {
          response = await api.delete(`/school/transport-trips/${id}`);
        }
        if (response.data.success) {
          toast.success(`Trip ${showTrashed ? 'permanently deleted' : 'deleted'} successfully`);
          fetchTrips();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleQuickStatusUpdate = async (id: number, newStatus: string) => {
    const foundStatus = tripStatuses.find(s => s.name === newStatus);
    if (!foundStatus) {
      toast.error(`Invalid status: ${newStatus}`);
      return;
    }
    try {
      const response = await api.put(`/school/transport-trips/${id}`, { status_id: foundStatus.id });
      if (response.data.success) {
        toast.success(`Trip is now ${newStatus}`);
        fetchTrips();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('Are you sure you want to restore this trip?')) return;
    try {
      const response = await api.post(`/school/transport-trips/${id}/restore`);
      if (response.data.success) {
        toast.success('Trip restored successfully');
        fetchTrips();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore trip');
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

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    const foundStatus = tripStatuses.find(s => s.name === newStatus);
    if (!foundStatus) {
      toast.error(`Invalid status: ${newStatus}`);
      setBulkUpdating(false);
      return;
    }

    try {
      const response = await api.post('/school/transport-trips/bulk-status', {
        status_id: foundStatus.id,
        ids: ids
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedItems(new Set());
        fetchTrips();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete ${selectedItems.size} selected trip(s)?`
      : `Are you sure you want to delete ${selectedItems.size} selected trip(s)?`;

    if (window.confirm(confirmMessage)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/transport-trips/bulk-delete', {
          ids: ids,
          force: showTrashed
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Deleted successfully');
          setSelectedItems(new Set());
          fetchTrips();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      } finally {
        setBulkUpdating(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedItems.size} selected trip(s)?`)) {
      setBulkUpdating(true);
      const ids = Array.from(selectedItems);

      try {
        const response = await api.post('/school/transport-trips/bulk-restore', {
          ids: ids
        });
        if (response.data.success) {
          toast.success(response.data.message || 'Restored successfully');
          setSelectedItems(new Set());
          fetchTrips();
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
        'Trip Name': item.trip_name,
        'Trip Code': item.trip_code || '',
        'Route Name': item.route?.route_name || '',
        'Trip Type': item.trip_type_master?.m_name || item.trip_type || '',
        'Vehicle Number': item.vehicle?.vehicle_number || '',
        'Driver Name': item.driver?.full_name || '',
        'Departure Time': item.departure_time,
        'Expected Arrival': item.expected_arrival_time || '',
        'Status': item.status_master?.m_name || item.status || '',
        'Notes': item.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Trips');
      XLSX.writeFile(wb, `trips_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Trips');

      worksheet.columns = [
        { header: 'Trip Name *', key: 'trip_name', width: 25 },
        { header: 'Trip Code', key: 'trip_code', width: 15 },
        { header: 'Route Name *', key: 'route_name', width: 20 },
        { header: 'Trip Type (Morning/Afternoon/Special)', key: 'trip_type', width: 20 },
        { header: 'Vehicle Number *', key: 'vehicle_number', width: 18 },
        { header: 'Driver Name *', key: 'driver_name', width: 18 },
        { header: 'Departure Time (YYYY-MM-DD HH:MM) *', key: 'departure_time', width: 25 },
        { header: 'Expected Arrival (YYYY-MM-DD HH:MM)', key: 'expected_arrival_time', width: 25 },
        { header: 'Status (Scheduled/In Progress/Completed/Cancelled)', key: 'status', width: 20 },
        { header: 'Notes', key: 'notes', width: 20 },
      ];

      worksheet.addRow({
        trip_name: 'North Route Morning Trip',
        trip_code: 'TRP-2026-001',
        route_name: routes.length > 0 ? routes[0].label : 'North Route',
        trip_type: 'Morning',
        vehicle_number: vehicles.length > 0 ? vehicles[0].label.split(' ')[0] : 'DL-01-A-1234',
        driver_name: drivers.length > 0 ? drivers[0].label.split(' ')[0] : 'Satish Singh',
        departure_time: '2026-06-18 07:30',
        expected_arrival_time: '2026-06-18 08:30',
        status: 'Scheduled',
        notes: 'Covers early morning pickup',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_trips.xlsx');
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
          if (firstCell && (firstCell === 'Trip Name *' || firstCell?.toString().includes('Trip Name'))) {
            headerRowIndex = i;
            headers = rows[i].map((cell: any) => cell?.toString().trim() || '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Could not find header row (e.g. "Trip Name *")');
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
            const cleanHeader = header.replace(' *', '').replace(' (YYYY-MM-DD HH:MM)', '').replace(' (Morning/Afternoon/Special)', '').replace(' (Scheduled/In Progress/Completed/Cancelled)', '');
            rowData[cleanHeader] = row[j]?.toString() || '';
          }

          if (rowData['Trip Name'] && rowData['Route Name']) {
            dataRows.push(rowData);
          }
        }

        if (dataRows.length === 0) {
          toast.error('No valid data rows found.');
          return;
        }

        const payloadData = dataRows.map(row => ({
          trip_name: row['Trip Name'],
          trip_code: row['Trip Code'] || null,
          route_name: row['Route Name'],
          trip_type: row['Trip Type'] || 'Morning',
          vehicle_number: row['Vehicle Number'],
          driver_name: row['Driver Name'],
          departure_time: row['Departure Time'],
          expected_arrival_time: row['Expected Arrival'] || null,
          status: row['Status'] || 'Scheduled',
          notes: row['Notes'] || null,
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
      const response = await api.post('/school/transport-trips/bulk-import', { data: importData });
      if (response.data.success) {
        toast.success(response.data.message || 'Import successful!');
        setIsImportModalOpen(false);
        fetchTrips();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

  return (
    <div className="space-y-3 text-xs">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Trip & Schedule Management</h3>
          <p className="text-[12px] text-gray-500">Dispatch, schedule, and track route trips, vehicle assignation, and driver duty logs</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total Trips</span>
            <span className="text-xs font-bold text-slate-700">{stats.All}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-indigo-500">Scheduled</span>
            <span className="text-xs font-bold text-indigo-700">{stats.Scheduled}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-amber-500">In Progress</span>
            <span className="text-xs font-bold text-amber-700">{stats['In Progress']}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Completed</span>
            <span className="text-xs font-bold text-emerald-700">{stats.Completed}</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter (Horizontal Tabs with Counts) */}
      <div className="flex border-b border-gray-200 bg-white rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab('All')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'All'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>📋 All Trips</span>
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
            activeTab === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {stats.All}
          </span>
        </button>
        {tripStatuses.map(status => {
          const count = stats[status.name as keyof typeof stats] ?? 0;
          let emoji = '📅';
          if (status.name === 'In Progress') emoji = '🚀';
          if (status.name === 'Completed') emoji = '✅';
          if (status.name === 'Cancelled') emoji = '❌';

          return (
            <button
              key={status.id}
              onClick={() => setActiveTab(status.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === status.name
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{emoji} {status.name}</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
                activeTab === status.name ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

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
              placeholder="Search trip name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          <SearchableSelect
            options={routes}
            value={filterRoute}
            onChange={(val) => setFilterRoute(val)}
            placeholder="Route"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          <SearchableSelect
            options={vehicles}
            value={filterVehicle}
            onChange={(val) => setFilterVehicle(val)}
            placeholder="Vehicle"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          <SearchableSelect
            options={drivers}
            value={filterDriver}
            onChange={(val) => setFilterDriver(val)}
            placeholder="Driver"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          <SearchableSelect
            options={tripTypes.map(t => ({ value: t.id, label: t.name }))}
            value={filterTripType}
            onChange={(val) => setFilterTripType(val)}
            placeholder="Trip Type"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          <SearchableSelect
            options={tripStatuses.map(s => ({ value: s.id, label: s.name }))}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="Status"
            isClearable={true}
            className="w-36 text-xs"
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

          {(searchTerm || filterRoute || filterVehicle || filterDriver || filterTripType || filterStatus) && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium px-1 cursor-pointer">
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer"
            title="Download Trip Template"
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
              Schedule Trip
            </button>
          )}
        </div>
      </div>

      {/* Trashed Warning Banner */}
      {showTrashed && (
        <div className="bg-red-50 border border-red-200 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <span>You are viewing deleted trips. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
          <div className="text-blue-800 font-bold">{selectedItems.size} item(s) selected</div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatusUpdate('Scheduled')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-indigo-750 font-medium cursor-pointer"
                >
                  Scheduled
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('In Progress')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-amber-700 font-medium cursor-pointer"
                >
                  Start Trip
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Completed')}
                  disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-750 font-medium cursor-pointer"
                >
                  Complete
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
              <th onClick={() => handleSort('trip_code')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Trip Code {getSortIcon('trip_code')}
              </th>
              <th onClick={() => handleSort('trip_name')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Trip Details {getSortIcon('trip_name')}
              </th>
              <th onClick={() => handleSort('route_name')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Route {getSortIcon('route_name')}
              </th>
              <th onClick={() => handleSort('vehicle_number')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Vehicle {getSortIcon('vehicle_number')}
              </th>
              <th onClick={() => handleSort('driver_name')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none">
                Driver {getSortIcon('driver_name')}
              </th>
              <th onClick={() => handleSort('departure_time')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none text-center">
                Times / Schedule {getSortIcon('departure_time')}
              </th>
              <th onClick={() => handleSort('status')} className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none text-center w-24">
                Status {getSortIcon('status')}
              </th>
              <th className="py-2.5 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">Loading trips data...</td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">No trips found.</td>
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
                  <td className="py-2 px-3 font-semibold text-gray-800">{item.trip_code || '—'}</td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-gray-955">{item.trip_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1 bg-indigo-50 text-indigo-700 rounded-sm text-[9px] font-extrabold">
                        {item.trip_type_master?.m_name || item.trip_type}
                      </span>
                      {item.notes && <span className="text-[10px] text-gray-400 italic">Notes: {item.notes}</span>}
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-indigo-650 bg-indigo-50/10">{item.route?.route_name || '—'}</td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-gray-800">{item.vehicle?.vehicle_number || '—'}</div>
                    {item.vehicle?.model && <div className="text-[10px] text-gray-400">{item.vehicle.model}</div>}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-gray-850">{item.driver?.full_name || '—'}</div>
                    {item.driver?.phone_number && <div className="text-[10px] text-gray-450">{item.driver.phone_number}</div>}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-gray-800 text-[10px]">Dep: {item.departure_time.substring(0, 16)}</span>
                      {item.expected_arrival_time && (
                        <span className="text-gray-500 text-[9px] mt-0.5">Arr: {item.expected_arrival_time.substring(0, 16)}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[9px] inline-block ${
                      (item.status_master?.m_name || item.status) === 'Scheduled' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      (item.status_master?.m_name || item.status) === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      (item.status_master?.m_name || item.status) === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {item.status_master?.m_name || item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {showTrashed ? (
                        <>
                          <button onClick={() => handleRestore(item.id)} className="px-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 cursor-pointer" title="Restore">
                            Restore
                          </button>
                          <button onClick={() => handleDelete(item.id, item.trip_name)} className="px-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 cursor-pointer" title="Delete Permanently">
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Quick transitions */}
                          {(item.status_master?.m_name || item.status) === 'Scheduled' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(item.id, 'In Progress')}
                              className="px-1.5 py-0.5 bg-blue-50 text-blue-650 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer font-bold text-[9px]"
                              title="Start Transit"
                            >
                              Start
                            </button>
                          )}
                          {(item.status_master?.m_name || item.status) === 'In Progress' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(item.id, 'Completed')}
                              className="px-1.5 py-0.5 bg-emerald-50 text-emerald-650 hover:bg-emerald-100 rounded border border-emerald-250 cursor-pointer font-bold text-[9px]"
                              title="Complete Trip"
                            >
                              Finish
                            </button>
                          )}
                          <button onClick={() => openEditModal(item)} className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 cursor-pointer" title="Edit">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(item.id, item.trip_name)} className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 cursor-pointer" title="Delete">
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
        <div className="flex items-center justify-between bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-xs">
          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
            <span className="font-semibold">{filteredData.length}</span> trips
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

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[95vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-650 px-5 py-3.5 flex items-center justify-between text-white flex-shrink-0">
              <h2 className="text-sm font-extrabold tracking-tight">
                {editingItem ? '✏️ Edit Scheduled Trip' : '📅 Schedule New Trip'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-slate-200 text-lg font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5 text-xs font-semibold overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className={lbl}>Trip Name *</label>
                  <input
                    type="text"
                    required
                    name="trip_name"
                    value={formData.trip_name}
                    onChange={handleInputChange}
                    placeholder="e.g. North Route Morning Trip"
                    className={inp}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Trip Code</label>
                  <input
                    type="text"
                    name="trip_code"
                    value={formData.trip_code}
                    onChange={handleInputChange}
                    placeholder="e.g. TRP-2026-001"
                    className={inp}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Select Route *</label>
                  <SearchableSelect
                    options={routes}
                    value={formData.route_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, route_id: val }))}
                    placeholder="Select Route"
                    className="w-full text-xs"
                    compact={true}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Select Vehicle *</label>
                  <SearchableSelect
                    options={vehicles}
                    value={formData.vehicle_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, vehicle_id: val }))}
                    placeholder="Select Vehicle"
                    className="w-full text-xs"
                    compact={true}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Select Driver *</label>
                  <SearchableSelect
                    options={drivers}
                    value={formData.driver_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, driver_id: val }))}
                    placeholder="Select Driver"
                    className="w-full text-xs"
                    compact={true}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Departure Time *</label>
                  <input
                    type="datetime-local"
                    required
                    name="departure_time"
                    value={formData.departure_time}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white h-[28px]"
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Expected Arrival</label>
                  <input
                    type="datetime-local"
                    name="expected_arrival_time"
                    value={formData.expected_arrival_time}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white h-[28px]"
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Trip Type *</label>
                  <SearchableSelect
                    options={tripTypes.map(t => ({ value: t.id, label: t.name }))}
                    value={formData.trip_type_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, trip_type_id: val }))}
                    placeholder="Select Trip Type"
                    className="w-full text-xs"
                    compact={true}
                  />
                </div>

                <div className="col-span-1">
                  <label className={lbl}>Status *</label>
                  <SearchableSelect
                    options={tripStatuses.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.status_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, status_id: val }))}
                    placeholder="Select Status"
                    className="w-full text-xs"
                    compact={true}
                  />
                </div>
              </div>

              {/* Stop Sequence preview block */}
              <div>
                <span className={lbl}>Stop Sequence</span>
                <span className="block text-[9px] text-gray-400 font-medium -mt-1 mb-1">Stops are auto-loaded based on the selected route sequence</span>
                <div className="border border-dashed border-indigo-200 p-2 rounded-lg bg-indigo-50/20 max-h-[60px] overflow-y-auto">
                  {stopSequence.length === 0 ? (
                    <div className="text-gray-400 italic text-[10px] text-center py-1">No route selected or selected route has no stops configured.</div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {stopSequence.map((stop, index) => (
                        <React.Fragment key={stop.id}>
                          {index > 0 && <span className="text-gray-300 font-extrabold text-[9px]">➔</span>}
                          <span className="bg-white border border-indigo-150 text-indigo-850 px-1.5 py-0.2 rounded font-bold shadow-2xs text-[9px]">
                            <span className="text-indigo-400 font-extrabold mr-1">#{stop.stop_order}</span>
                            {stop.stop_name}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={lbl}>Notes / Instructions</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Special instructions..."
                  rows={1}
                  className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
                />
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5 mt-1">
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
                  {editingItem ? 'Save Updates' : 'Save Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Data Import Preview Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-3xl overflow-hidden shadow-2xl">
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
                      <th className="py-2 px-3">Trip Name</th>
                      <th className="py-2 px-3">Route Name</th>
                      <th className="py-2 px-3">Vehicle</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3">Departure Time</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row['Trip Name']}</td>
                        <td className="py-2 px-3 font-bold text-indigo-700">{row['Route Name']}</td>
                        <td className="py-2 px-3">{row['Vehicle Number']}</td>
                        <td className="py-2 px-3">{row['Driver Name']}</td>
                        <td className="py-2 px-3 text-slate-700 font-semibold">{row['Departure Time']}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-[9px] rounded font-bold">{row['Status']}</span>
                        </td>
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

export default TripManager;
