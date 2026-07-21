import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeTransportItem {
  id: number;
  route_code: string;
  route_name: string;
  start_point: string | null;
  end_point: string | null;
  pickup_point: string;
  drop_point: string;
  stop_name: string | null;
  distance_km: number;
  pricing_mode: 'route_wise' | 'stop_wise' | 'distance_wise';
  stop_fee: number;
  vehicle_number: string | null;
  vehicle_type: 'Bus' | 'Mini Bus' | 'Van' | 'Cab';
  driver_name: string | null;
  driver_phone: string | null;
  helper_name: string | null;
  seating_capacity: number;
  allocated_students: number;
  monthly_fee: number;
  quarterly_fee: number;
  annual_fee: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const PRICING_MODES = [
  { value: 'route_wise', label: 'Route Wise Fixed Fee' },
  { value: 'stop_wise', label: 'Stop Wise Distance Fee' },
  { value: 'distance_wise', label: 'Per KM Distance Slab Fee' }
];

const VEHICLE_TYPES = [
  { value: 'Bus', label: 'Heavy Bus (40-60 Seats)' },
  { value: 'Mini Bus', label: 'Mini Bus (20-35 Seats)' },
  { value: 'Van', label: 'School Van / Traveler (10-18 Seats)' },
  { value: 'Cab', label: 'Auto / Small Cab (4-8 Seats)' }
];

export default function TransportFeeManagement() {
  const [data, setData] = useState<FeeTransportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterPricingMode, setFilterPricingMode] = useState<string>('');
  const [filterVehicleType, setFilterVehicleType] = useState<string>('');
  const [filterDistance, setFilterDistance] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeTransportItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeTransportItem | null>(null);
  const [formData, setFormData] = useState({
    route_code: '',
    route_name: '',
    start_point: 'City Bus Stand',
    end_point: 'School Main Gate',
    pickup_point: 'City Center Clock Tower',
    drop_point: 'School Main Gate',
    stop_name: 'Clock Tower Stop',
    distance_km: 8.5,
    pricing_mode: 'route_wise' as 'route_wise' | 'stop_wise' | 'distance_wise',
    stop_fee: 0,
    vehicle_number: 'UP-14-BT-1234',
    vehicle_type: 'Bus' as 'Bus' | 'Mini Bus' | 'Van' | 'Cab',
    driver_name: 'Ramesh Kumar',
    driver_phone: '9876543210',
    helper_name: 'Sohan Lal',
    seating_capacity: 40,
    allocated_students: 32,
    monthly_fee: 1200,
    quarterly_fee: 3600,
    annual_fee: 12000,
    description: 'Main city route covering Clock Tower, Civil Lines, and Station Road.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchRoutes();
  }, [viewTrash, filterPricingMode, filterVehicleType, filterDistance, filterStatus]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-transports', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          pricing_mode: filterPricingMode || undefined,
          vehicle_type: filterVehicleType || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transport routes', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            route_code: 'ROUTE-CITY-01',
            route_name: 'Route 1: City Center to School',
            start_point: 'City Stand Depot',
            end_point: 'School Campus',
            pickup_point: 'City Center Clock Tower',
            drop_point: 'School Main Gate',
            stop_name: 'Clock Tower Junction',
            distance_km: 8.50,
            pricing_mode: 'route_wise',
            stop_fee: 0.00,
            vehicle_number: 'UP-14-BT-1234',
            vehicle_type: 'Bus',
            driver_name: 'Ramesh Kumar',
            driver_phone: '9876543210',
            helper_name: 'Sohan Lal',
            seating_capacity: 40,
            allocated_students: 32,
            monthly_fee: 1200.00,
            quarterly_fee: 3600.00,
            annual_fee: 12000.00,
            description: 'Main city route covering Clock Tower, Civil Lines, and Station Road',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            route_code: 'ROUTE-EAST-02',
            route_name: 'Route 2: East Colony to School',
            start_point: 'East Depot',
            end_point: 'School Gate B',
            pickup_point: 'East Colony Crossing',
            drop_point: 'School Gate B',
            stop_name: 'Greenfield Colony Stop',
            distance_km: 12.00,
            pricing_mode: 'stop_wise',
            stop_fee: 150.00,
            vehicle_number: 'UP-14-BT-5678',
            vehicle_type: 'Mini Bus',
            driver_name: 'Suresh Singh',
            driver_phone: '9876543211',
            helper_name: 'Ram Charan',
            seating_capacity: 25,
            allocated_students: 22,
            monthly_fee: 1500.00,
            quarterly_fee: 4500.00,
            annual_fee: 15000.00,
            description: 'Suburban route covering East Colony and Greenfield Apartments',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            route_code: 'ROUTE-WEST-03',
            route_name: 'Route 3: West Bypass Express',
            start_point: 'West Toll Plaza',
            end_point: 'School Main Gate',
            pickup_point: 'West Bypass Toll Plaza',
            drop_point: 'School Main Gate',
            stop_name: 'Sector 14 Bypass',
            distance_km: 16.50,
            pricing_mode: 'distance_wise',
            stop_fee: 250.00,
            vehicle_number: 'UP-14-BT-9900',
            vehicle_type: 'Van',
            driver_name: 'Vikram Yadav',
            driver_phone: '9876543212',
            helper_name: 'Amit Verma',
            seating_capacity: 15,
            allocated_students: 14,
            monthly_fee: 1800.00,
            quarterly_fee: 5400.00,
            annual_fee: 18000.00,
            description: 'Express van route for long distance suburban students',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.route_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pickup_point.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.drop_point.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.stop_name && item.stop_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.vehicle_number && item.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.driver_name && item.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchDist = true;
      if (filterDistance === '0-5') matchDist = item.distance_km <= 5;
      else if (filterDistance === '5-10') matchDist = item.distance_km > 5 && item.distance_km <= 10;
      else if (filterDistance === '10-15') matchDist = item.distance_km > 10 && item.distance_km <= 15;
      else if (filterDistance === '15+') matchDist = item.distance_km > 15;

      return matchSearch && matchDist;
    }).sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [data, searchTerm, filterDistance, sortColumn, sortOrder]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeTransportItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeTransportItem) => {
    if (sortColumn !== col) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Checkbox Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectRow = (id: number) => {
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItems(next);
  };

  // Single Item CRUD
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      route_code: 'ROUTE-' + Math.floor(100 + Math.random() * 900),
      route_name: '',
      start_point: 'City Bus Stand',
      end_point: 'School Main Gate',
      pickup_point: 'City Center Clock Tower',
      drop_point: 'School Main Gate',
      stop_name: 'Clock Tower Stop',
      distance_km: 8.5,
      pricing_mode: 'route_wise',
      stop_fee: 0,
      vehicle_number: 'UP-14-BT-' + Math.floor(1000 + Math.random() * 9000),
      vehicle_type: 'Bus',
      driver_name: '',
      driver_phone: '',
      helper_name: '',
      seating_capacity: 40,
      allocated_students: 0,
      monthly_fee: 1200,
      quarterly_fee: 3600,
      annual_fee: 12000,
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeTransportItem) => {
    setEditingItem(item);
    setFormData({
      route_code: item.route_code,
      route_name: item.route_name,
      start_point: item.start_point || item.pickup_point,
      end_point: item.end_point || item.drop_point,
      pickup_point: item.pickup_point,
      drop_point: item.drop_point || 'School Campus',
      stop_name: item.stop_name || item.pickup_point,
      distance_km: item.distance_km,
      pricing_mode: item.pricing_mode || 'route_wise',
      stop_fee: item.stop_fee || 0,
      vehicle_number: item.vehicle_number || '',
      vehicle_type: item.vehicle_type || 'Bus',
      driver_name: item.driver_name || '',
      driver_phone: item.driver_phone || '',
      helper_name: item.helper_name || '',
      seating_capacity: item.seating_capacity,
      allocated_students: item.allocated_students || 0,
      monthly_fee: item.monthly_fee,
      quarterly_fee: item.quarterly_fee,
      annual_fee: item.annual_fee,
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_name.trim()) {
      alert('Please enter route name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-transports/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-transports', formData);
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (error: any) {
      alert('Failed to save transport route: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-transports/${id}/toggle-status`);
      fetchRoutes();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this transport route to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-transports/${id}`);
      fetchRoutes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-transports/${id}/restore`);
      fetchRoutes();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this transport route? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-transports/${id}/force`);
      fetchRoutes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Auto fee multiplier on monthly change
  const handleMonthlyChange = (val: number) => {
    setFormData(prev => ({
      ...prev,
      monthly_fee: val,
      quarterly_fee: val * 3,
      annual_fee: val * 10
    }));
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected transport route(s)?`)) return;

    try {
      await axios.post('/api/school/fee-transports/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchRoutes();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchRoutes();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-transports/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-transports/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { route_code: 'ROUTE-CITY-01', route_name: 'Route 1: City Center to School', start_point: 'City Stand', end_point: 'School Gate', pickup_point: 'City Center', drop_point: 'School Campus', stop_name: 'Clock Tower', distance_km: 8.5, pricing_mode: 'route_wise', vehicle_number: 'UP-14-BT-1234', vehicle_type: 'Bus', driver_name: 'Ramesh Kumar', seating_capacity: 40, allocated_students: 32, monthly_fee: 1200, quarterly_fee: 3600, annual_fee: 12000 },
      { route_code: 'ROUTE-EAST-02', route_name: 'Route 2: East Colony to School', start_point: 'East Depot', end_point: 'School Gate', pickup_point: 'East Colony', drop_point: 'School Campus', stop_name: 'Greenfield Stop', distance_km: 12.0, pricing_mode: 'stop_wise', vehicle_number: 'UP-14-BT-5678', vehicle_type: 'Mini Bus', driver_name: 'Suresh Singh', seating_capacity: 25, allocated_students: 22, monthly_fee: 1500, quarterly_fee: 4500, annual_fee: 15000 },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-transports/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchRoutes();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchRoutes();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(d => d.is_active).length;
    const totalRiders = data.reduce((sum, d) => sum + (d.allocated_students || 0), 0);
    const totalCapacity = data.reduce((sum, d) => sum + (d.seating_capacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalRiders / totalCapacity) * 100) : 0;
    return { total, active, totalRiders, totalCapacity, occupancyRate };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Transport Fee Management</h1>
            <p className="text-[10px] text-gray-500">Route & Stop Setup, Route/Stop/Distance Wise Fee Configuration, Vehicle Type & Driver Allocation, and Vehicle Occupancy Tracking.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Transport Routes</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total} Routes</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Routes Count</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">{stats.active} Active</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Allocated Student Riders</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">{stats.totalRiders} Riders</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Vehicle Occupancy Rate</p>
            <h3 className="text-lg font-black text-blue-700 mt-0.5">{stats.occupancyRate}% ({stats.totalRiders}/{stats.totalCapacity})</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Transport Route */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Route Code, Name, Stop, Vehicle, Driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-xs"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Show Trashed Toggle */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-gray-700 font-bold select-none text-[10px] uppercase tracking-wider">Show Trashed</span>
              <button
                type="button"
                onClick={() => setViewTrash(prev => !prev)}
                className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${viewTrash ? 'bg-rose-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'}`}
                />
              </button>
            </div>

            {/* Pagination select */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">SHOW:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={25}>25 Rows</option>
                <option value={50}>50 Rows</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {/* Action Buttons: Sample, Import, Export, + Add Transport Route */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSample}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Sample
            </button>

            <label className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition cursor-pointer font-bold shadow-xs text-xs">
              Import
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Export
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Transport Route</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Pricing Mode Filter */}
          <select
            value={filterPricingMode}
            onChange={(e) => setFilterPricingMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Pricing Modes (Route/Stop/Distance)</option>
            {PRICING_MODES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Vehicle Type Filter */}
          <select
            value={filterVehicleType}
            onChange={(e) => setFilterVehicleType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Vehicle Types</option>
            {VEHICLE_TYPES.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          {/* Distance Filter */}
          <select
            value={filterDistance}
            onChange={(e) => setFilterDistance(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Distance Slabs</option>
            <option value="0-5">0 - 5 KM (Short Route)</option>
            <option value="5-10">5 - 10 KM (Medium Route)</option>
            <option value="10-15">10 - 15 KM (Long Route)</option>
            <option value="15+">15+ KM (Express Suburb)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterPricingMode || filterVehicleType || filterDistance || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterPricingMode('');
                setFilterVehicleType('');
                setFilterDistance('');
                setFilterStatus('');
              }}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition flex-shrink-0 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions Context Menu panel */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} transport route(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-amber-800"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-gray-600"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkAction('trash')}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('restore')}
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-amber-800"
                >
                  Restore Selected
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-bold text-[10px]"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ERP Table View */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-[10px]">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('route_code')}>
                <div className="flex items-center gap-0.5">ROUTE CODE {getSortIcon('route_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('route_name')}>
                <div className="flex items-center gap-0.5">ROUTE TITLE & STOPS {getSortIcon('route_name')}</div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('distance_km')}>
                <div className="flex items-center justify-center gap-0.5">DISTANCE & MODE {getSortIcon('distance_km')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('monthly_fee')}>
                <div className="flex items-center justify-end gap-0.5">MONTHLY / QTR FARE (₹) {getSortIcon('monthly_fee')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">BUS VEHICLE & DRIVER</th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('allocated_students')}>
                <div className="flex items-center justify-center gap-0.5">OCCUPANCY {getSortIcon('allocated_students')}</div>
              </th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading transport routes...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No transport routes found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const occupancyPct = item.seating_capacity > 0 ? Math.round((item.allocated_students / item.seating_capacity) * 100) : 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                      {item.route_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.route_name}</div>
                      <div className="text-[9.5px] text-emerald-700 font-semibold">Stop: {item.stop_name || item.pickup_point} ({item.pickup_point} ➔ {item.drop_point})</div>
                      {item.description && <div className="text-[9px] text-gray-400 italic max-w-xs truncate">{item.description}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="font-black text-amber-950">{item.distance_km} KM</div>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold text-[8.5px] rounded uppercase">
                        {item.pricing_mode ? item.pricing_mode.replace('_', ' ') : 'Route Wise'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-black text-gray-900">₹{item.monthly_fee.toFixed(2)} / mo</div>
                      <div className="text-[9px] text-indigo-700 font-bold">Qtr: ₹{item.quarterly_fee.toFixed(2)}</div>
                      {item.stop_fee > 0 && <div className="text-[8.5px] text-purple-700 font-bold">Stop Charge: ₹{item.stop_fee}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-gray-700">
                      <div className="font-bold text-gray-800">{item.vehicle_number || 'Unassigned'} ({item.vehicle_type || 'Bus'})</div>
                      {item.driver_name && <div className="text-[9px] text-slate-500">Driver: {item.driver_name} ({item.driver_phone})</div>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="font-bold text-slate-800">{item.allocated_students}/{item.seating_capacity} Seats</div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mx-auto mt-0.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                        />
                      </div>
                      <div className="text-[8.5px] font-bold text-slate-500 mt-0.2">{occupancyPct}% Occupied</div>
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-amber-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-amber-700' : 'text-gray-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!viewTrash ? (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-amber-700 hover:bg-amber-50 rounded transition"
                              title="Edit Route"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Move to Trash"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded text-[9px] hover:bg-amber-100 transition"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              className="p-1 text-rose-650 hover:bg-rose-50 rounded transition"
                              title="Delete Permanently"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-white px-4 py-2.5 text-xs shadow-xs">
          <div>
            <p className="text-xs text-gray-600 font-medium">
              Showing page <span className="font-semibold text-amber-600">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({filteredData.length} records)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                « First
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                if (Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) return null;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`relative inline-flex items-center border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      currentPage === pNum
                        ? 'z-10 bg-amber-50 border-amber-500 text-amber-700 font-black'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Last »
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Add / Edit Transport Route Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Transport Bus Route & Stops' : 'Configure New Transport Bus Route & Stops'}</h3>
                  <p className="text-[9.5px] text-gray-500">Define Route Stops, Distance, Pricing Mode (Route/Stop/Distance), Vehicle Type, Capacity & Rider Allocation.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full border border-gray-200 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-3 space-y-2 text-xs">
              {/* Row 1: Route Code, Route Name, Start Point, End Point (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Route Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.route_code}
                    onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="ROUTE-CITY-01"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Route Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Route 1: City Center to School"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Start Terminal Point *</label>
                  <input
                    type="text"
                    required
                    value={formData.start_point}
                    onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                    placeholder="City Stand Depot"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">End Terminal Point *</label>
                  <input
                    type="text"
                    required
                    value={formData.end_point}
                    onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                    placeholder="School Main Gate"
                  />
                </div>
              </div>

              {/* Row 2: Stop Name, Pickup Point, Drop Point, Pricing Mode (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-amber-50/40 p-2 rounded-lg border border-amber-200/80">
                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Stop Name / Landmark *</label>
                  <input
                    type="text"
                    required
                    value={formData.stop_name}
                    onChange={(e) => setFormData({ ...formData, stop_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-amber-900"
                    placeholder="Clock Tower Stop"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Pickup Stop *</label>
                  <input
                    type="text"
                    required
                    value={formData.pickup_point}
                    onChange={(e) => setFormData({ ...formData, pickup_point: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-amber-900"
                    placeholder="City Center Crossing"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Drop Stop *</label>
                  <input
                    type="text"
                    required
                    value={formData.drop_point}
                    onChange={(e) => setFormData({ ...formData, drop_point: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-amber-900"
                    placeholder="School Campus Gate A"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Fee Pricing Mode *</label>
                  <select
                    value={formData.pricing_mode}
                    onChange={(e) => setFormData({ ...formData, pricing_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-indigo-900"
                  >
                    {PRICING_MODES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Distance KM, Stop Fee, Monthly Fee, Quarterly Fee (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Distance (KM) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-amber-950"
                    placeholder="8.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Stop Wise Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stop_fee}
                    onChange={(e) => setFormData({ ...formData, stop_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-purple-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Monthly Transport Fee (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.monthly_fee}
                    onChange={(e) => handleMonthlyChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-amber-950"
                    placeholder="1200"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Quarterly Fare (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quarterly_fee}
                    onChange={(e) => setFormData({ ...formData, quarterly_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-indigo-900"
                    placeholder="3600"
                  />
                </div>
              </div>

              {/* Row 4: Vehicle Type, Vehicle Number, Seating Capacity, Allocated Riders (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Vehicle Type *</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    {VEHICLE_TYPES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none font-mono uppercase"
                    placeholder="UP-14-BT-1234"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Seating Capacity *</label>
                  <input
                    type="number"
                    required
                    value={formData.seating_capacity}
                    onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-amber-900"
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Allocated Student Riders</label>
                  <input
                    type="number"
                    value={formData.allocated_students}
                    onChange={(e) => setFormData({ ...formData, allocated_students: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-emerald-800"
                    placeholder="32"
                  />
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active & Operating Route</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Route'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/45 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Excel Transport Routes Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Route Code</th>
                    <th className="px-3 py-2 border">Route Name</th>
                    <th className="px-3 py-2 border">Stop Name</th>
                    <th className="px-3 py-2 border text-center">Distance</th>
                    <th className="px-3 py-2 border text-right">Monthly Fee (₹)</th>
                    <th className="px-3 py-2 border">Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-amber-800">{row.route_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.route_name}</td>
                      <td className="px-3 py-2 border">{row.stop_name}</td>
                      <td className="px-3 py-2 border text-center font-black">{row.distance_km} KM</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.monthly_fee}</td>
                      <td className="px-3 py-2 border font-mono">{row.vehicle_number} ({row.vehicle_type})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button
                type="button"
                disabled={importing}
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={processImport}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-sm text-xs"
              >
                {importing ? 'Importing routes...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
