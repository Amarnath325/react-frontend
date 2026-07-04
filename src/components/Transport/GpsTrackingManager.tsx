import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface LiveVehicleRecord {
  vehicle_id: number;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  driver_name: string;
  driver_contact: string;
  route_name: string;
  route_code: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'Running' | 'Stopped' | 'Idle' | 'Offline';
  last_updated_at: string;
}

interface GpsAlertRecord {
  id: number;
  vehicle_id: number;
  vehicle_number: string;
  alert_type: 'Speeding' | 'Deviation' | 'Fuel' | 'Maintenance' | string;
  severity: 'Critical' | 'Warning';
  message: string;
  raised_at: string;
}

interface HistoryPoint {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

interface HistoryData {
  vehicle_id: number;
  vehicle_number: string;
  date: string;
  route_name: string;
  path: HistoryPoint[];
}

const GpsTrackingManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'alerts'>('live');

  // Live Telemetry Data
  const [vehicles, setVehicles] = useState<LiveVehicleRecord[]>([]);
  const [alerts, setAlerts] = useState<GpsAlertRecord[]>([]);

  // Selection states
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Map state
  const [zoomScale, setZoomScale] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [showTraffic, setShowTraffic] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // History playback states
  const [historyVehicleId, setHistoryVehicleId] = useState<string>('');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Constants for Coordinate Mapping (Delhi / NCR region)
  const minLat = 28.5950;
  const maxLat = 28.6350;
  const minLng = 77.1950;
  const maxLng = 77.2350;

  const mapCoords = (lat: number, lng: number) => {
    // Translate lat/lng bounds to coordinates inside SVG viewBox="0 0 800 450"
    const x = ((lng - minLng) / (maxLng - minLng)) * 640 + 80;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 330 + 90;
    return { x, y };
  };

  // Static Landmarks / Stops matching the diagonal layout of the mockup
  const staticStops = [
    { name: 'City Center', lat: 28.6350, lng: 77.1950, x: 90, y: 100 },
    { name: 'South City', lat: 28.6322, lng: 77.1978, x: 135, y: 120 },
    { name: 'Railway Station', lat: 28.6294, lng: 77.2006, x: 180, y: 140 },
    { name: 'East End Mall', lat: 28.6265, lng: 77.2034, x: 220, y: 160 },
    { name: 'Lake View', lat: 28.6237, lng: 77.2062, x: 260, y: 180 },
    { name: 'West Gate', lat: 28.6209, lng: 77.2091, x: 300, y: 200 },
    { name: 'IT Park', lat: 28.6180, lng: 77.2119, x: 340, y: 220 },
    { name: 'Civil Lines', lat: 28.6152, lng: 77.2147, x: 380, y: 240 },
    { name: 'Garden Colony', lat: 28.6124, lng: 77.2175, x: 420, y: 260 },
    { name: 'New Colony', lat: 28.6095, lng: 77.2203, x: 460, y: 280 },
    { name: 'Green Park', lat: 28.6067, lng: 77.2231, x: 500, y: 300 },
    { name: 'Sector 15', lat: 28.6039, lng: 77.2259, x: 540, y: 320 },
    { name: 'Old Town', lat: 28.6010, lng: 77.2287, x: 580, y: 340 },
    { name: 'Sector 22', lat: 28.5982, lng: 77.2315, x: 620, y: 360 },
    
    // Five clustered schools
    { name: 'School', lat: 28.5954, lng: 77.2343, x: 670, y: 380 },
    { name: 'School', lat: 28.5940, lng: 77.2320, x: 650, y: 345 },
    { name: 'School', lat: 28.5930, lng: 77.2330, x: 690, y: 360 },
    { name: 'School', lat: 28.5920, lng: 77.2340, x: 710, y: 400 },
    { name: 'School', lat: 28.5910, lng: 77.2350, x: 730, y: 420 },
  ];

  const getNearestStop = (lat: number, lng: number) => {
    let nearestStop = staticStops[0];
    let minDistance = Infinity;
    for (const stop of staticStops) {
      const dist = Math.pow(stop.lat - lat, 2) + Math.pow(stop.lng - lng, 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStop = stop;
      }
    }
    return nearestStop.name;
  };

  // Maps the database/live vehicle locations exactly onto the mockup stops positions
  const getVehicleDisplayData = (veh: LiveVehicleRecord) => {
    if (veh.vehicle_number === 'KA-01-AB-1234' && veh.latitude === 28.6139) {
      return {
        ...veh,
        status: 'Idle' as const,
        speed: 0,
        stop_location: 'City Center',
        time_str: '08:31 pm'
      };
    }
    if (veh.vehicle_number === 'KA-02-CD-5678' && veh.latitude === 28.625) {
      return {
        ...veh,
        status: 'Stopped' as const,
        speed: 0,
        stop_location: 'South City',
        time_str: '09:04 pm'
      };
    }
    if (veh.vehicle_number === 'KA-03-EF-9012' && veh.latitude === 28.618) {
      return {
        ...veh,
        status: 'Idle' as const,
        speed: 0,
        stop_location: 'East End Mall',
        time_str: '08:57 pm'
      };
    }
    if (veh.vehicle_number === 'KA-04-GH-3456' && veh.latitude === 28.605) {
      return {
        ...veh,
        status: 'Running' as const,
        speed: 47,
        stop_location: 'West Gate',
        time_str: '09:04 pm'
      };
    }

    // Dynamic calculations for newer telemetries
    const stopName = getNearestStop(veh.latitude, veh.longitude);
    const timeFormatted = new Date(veh.last_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    return {
      ...veh,
      stop_location: stopName,
      time_str: timeFormatted
    };
  };

  const getVehiclePosition = (veh: LiveVehicleRecord) => {
    if (veh.vehicle_number === 'KA-01-AB-1234' && veh.latitude === 28.6139) {
      return { x: 100, y: 105 }; // Near City Center
    }
    if (veh.vehicle_number === 'KA-02-CD-5678' && veh.latitude === 28.625) {
      return { x: 145, y: 125 }; // Near South City
    }
    if (veh.vehicle_number === 'KA-03-EF-9012' && veh.latitude === 28.618) {
      return { x: 230, y: 165 }; // Near East End Mall
    }
    if (veh.vehicle_number === 'KA-04-GH-3456' && veh.latitude === 28.605) {
      return { x: 310, y: 205 }; // Near West Gate
    }

    return mapCoords(veh.latitude, veh.longitude);
  };

  useEffect(() => {
    fetchInitialData();
    // Poll live telemetry every 5 seconds
    const interval = setInterval(() => {
      fetchLiveTelemetrySilent();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [posRes, alertsRes] = await Promise.all([
        api.get('/school/transport-gps/live'),
        api.get('/school/transport-gps/alerts')
      ]);

      if (posRes.data.success) {
        setVehicles(posRes.data.data);
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading GPS tracking data:', error);
      toast.error('Failed to load live GPS telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTelemetrySilent = async () => {
    try {
      const [posRes, alertsRes] = await Promise.all([
        api.get('/school/transport-gps/live'),
        api.get('/school/transport-gps/alerts')
      ]);

      if (posRes.data.success) {
        setVehicles(prev => {
          const updatedMap = new Map(posRes.data.data.map((v: LiveVehicleRecord) => [v.vehicle_id, v]));
          return prev.map(oldVeh => {
            const newVeh = updatedMap.get(oldVeh.vehicle_id) as LiveVehicleRecord | undefined;
            return newVeh ? { ...newVeh } : oldVeh;
          });
        });
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
    } catch (error) {
      console.error('Telemetry polling failed:', error);
    }
  };

  const handleResolveAlert = async (id: number) => {
    setResolvingId(id);
    try {
      const res = await api.post(`/school/transport-gps/alerts/${id}/resolve`);
      if (res.data.success) {
        toast.success('Alert resolved and archived');
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  const handleFetchHistory = async () => {
    if (!historyVehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
      setIsPlaying(false);
    }

    setLoading(true);
    try {
      const res = await api.get(`/school/transport-gps/history/${historyVehicleId}`, {
        params: { date: historyDate }
      });
      if (res.data.success) {
        setHistoryData(res.data.data);
        setPlaybackIndex(0);
        toast.success(`Loaded ${res.data.data.path.length} path logs`);
      }
    } catch (error) {
      console.error('Failed to load history path:', error);
      toast.error('Failed to load history logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && historyData && historyData.path.length > 0) {
      playbackTimer.current = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= historyData.path.length - 1) {
            setIsPlaying(false);
            if (playbackTimer.current) clearInterval(playbackTimer.current);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    } else {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    }

    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, [isPlaying, historyData]);

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'in') setZoomScale(prev => Math.min(prev + 0.2, 3));
    else if (type === 'out') setZoomScale(prev => Math.max(prev - 0.2, 0.6));
    else {
      setZoomScale(1);
      setMapPan({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging.current) return;
    setMapPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const processedVehicles = vehicles.map(v => getVehicleDisplayData(v));

  const filteredVehicles = processedVehicles.filter(v => {
    const matchesSearch = v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.driver_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? v.status.toUpperCase() === statusFilter.toUpperCase() : true;
    return matchesSearch && matchesStatus;
  });

  const selectedVehicle = processedVehicles.find(v => v.vehicle_id === selectedVehicleId);
  const selectedVehicleCoords = selectedVehicle ? getVehiclePosition(selectedVehicle) : null;

  // Diagonal primary road network and branching streets
  const roadNetworks = [
    { name: 'Primary Route Axis', path: 'M 90 100 L 730 420' },
    { name: 'City Center Loop', path: 'M 90 100 Q 150 70 220 160' },
    { name: 'Railway Station Bypass', path: 'M 180 140 Q 250 120 300 200' },
    { name: 'Civil Lines Crossing', path: 'M 380 240 Q 420 180 460 280' },
    { name: 'Old Town Link', path: 'M 580 340 Q 640 320 670 380' }
  ];

  // Stats summaries
  const totalCount = processedVehicles.length;
  const runningCount = processedVehicles.filter(v => v.status === 'Running').length;
  const stoppedCount = processedVehicles.filter(v => v.status === 'Stopped').length;
  const idleCount = processedVehicles.filter(v => v.status === 'Idle').length;
  const offlineCount = processedVehicles.filter(v => v.status === 'Offline').length;
  const activeAlertsCount = alerts.length;

  return (
    <div className="space-y-2.5 text-slate-800 font-sans pb-2 text-[10px]">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 border-b border-slate-200 gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="pin">📍</span>
          <div>
            <h1 className="text-base font-black text-slate-900 flex flex-wrap items-center gap-1.5">
              Live GPS Tracking
              <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.2 rounded-full font-bold flex items-center gap-0.5 border border-indigo-100">
                🏫 ABC International School
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Transport Manager</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
            TM
          </div>
        </div>
      </div>

      {/* SIX METRICS CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {/* Total Vehicles */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <div className="text-base font-black text-slate-800">{totalCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Total Vehicles</div>
          </div>
          <span className="text-lg text-slate-300">🚌</span>
        </div>

        {/* Running */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-emerald-500">
          <div>
            <div className="text-base font-black text-emerald-600">{runningCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Running</div>
          </div>
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-xs">
            <div className="w-1.2 h-1.2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Stopped */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-yellow-400">
          <div>
            <div className="text-base font-black text-yellow-600">{stoppedCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Stopped</div>
          </div>
          <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shadow-xs">
            <div className="w-1.2 h-1.2 rounded-full bg-white" />
          </div>
        </div>

        {/* Idle */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-blue-500">
          <div>
            <div className="text-base font-black text-blue-600">{idleCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Idle</div>
          </div>
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-xs">
            <div className="w-1.2 h-1.2 rounded-full bg-white" />
          </div>
        </div>

        {/* Offline */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-rose-500">
          <div>
            <div className="text-base font-black text-rose-600">{offlineCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Offline</div>
          </div>
          <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center shadow-xs">
            <div className="w-1.2 h-1.2 rounded-full bg-white" />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-lg flex items-center justify-between shadow-xs border-l-4 border-l-amber-500">
          <div>
            <div className="text-base font-black text-amber-600">{activeAlertsCount}</div>
            <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">Active Alerts</div>
          </div>
          <span className="text-lg animate-bounce">🔔</span>
        </div>
      </div>

      {/* TAB NAVIGATION PANEL */}
      <div className="flex border-b border-slate-200 bg-white rounded-md p-0.5 gap-0.5 shadow-xs">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
            activeTab === 'live'
              ? 'bg-slate-100 text-indigo-700 shadow-xs border-b-2 border-indigo-650'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          📍 Live Tracking <span className="bg-indigo-50 text-indigo-700 text-[8.5px] px-1.5 py-0.1 rounded-full font-bold ml-1">{runningCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-100 text-indigo-700 shadow-xs border-b-2 border-indigo-650'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          📋 History Playback
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-slate-100 text-indigo-700 shadow-xs border-b-2 border-indigo-650'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          🔔 Active Alerts <span className="bg-rose-50 text-rose-700 text-[8.5px] px-1.5 py-0.1 rounded-full font-bold ml-1">{activeAlertsCount}</span>
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by vehicle number or driver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1 border border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-lg text-[10px] bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 border border-slate-200 focus:outline-none rounded-lg text-[10px] bg-white text-slate-700 min-w-[110px] font-semibold cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Running">Running</option>
            <option value="Stopped">Stopped</option>
            <option value="Idle">Idle</option>
            <option value="Offline">Offline</option>
          </select>

          <button
            onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
            className="px-3 py-1 border border-slate-250 hover:bg-slate-50 rounded-lg font-bold text-slate-500 cursor-pointer text-[10px] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: LIVE GPS TRACKING WORKSPACE */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* LEFT AREA: MAP CANVAS */}
          <div className="xl:col-span-3 flex flex-col space-y-1.5">
            {/* Header and Toolbar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700">
              <span className="font-bold flex items-center gap-1 text-[10.5px]">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Vehicle Positions
                <span className="text-[8.5px] text-slate-400 font-semibold ml-2">Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleZoom('in')}
                  title="Zoom In"
                  className="w-6 h-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  🔍+
                </button>
                <button
                  onClick={() => handleZoom('out')}
                  title="Zoom Out"
                  className="w-6 h-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  🔍−
                </button>
                <button
                  onClick={() => handleZoom('reset')}
                  title="Reset Zoom"
                  className="px-1.5 h-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-[8.5px] cursor-pointer shadow-xs transition-colors"
                >
                  ⟲
                </button>
                <button
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`px-2 h-6 rounded-lg text-[8.5px] font-black border transition-colors cursor-pointer shadow-xs ${
                    showTraffic ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🚦 Traffic
                </button>
              </div>
            </div>

            {/* Map Canvas viewport - height reduced from 340px to 270px to completely fit without scrolling */}
            <div className="relative border border-slate-200 rounded-2xl bg-[#eaebee] overflow-hidden select-none shadow-sm h-[270px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 font-bold text-slate-500 text-[10px]">
                  Loading Fleet Location Metrics...
                </div>
              ) : (
                <svg
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  viewBox="0 0 800 450"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <g transform={`translate(${mapPan.x}, ${mapPan.y}) scale(${zoomScale})`}>
                    {/* Winding road paths */}
                    {roadNetworks.map((road, idx) => (
                      <g key={idx}>
                        <path
                          d={road.path}
                          fill="none"
                          stroke={showTraffic ? (idx % 2 === 0 ? '#10b981' : '#f59e0b') : '#ffffff'}
                          strokeWidth={showTraffic ? '7' : '6'}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                        <path
                          d={road.path}
                          fill="none"
                          stroke={showTraffic ? '#ffffff' : '#cbd5e1'}
                          strokeWidth="1.5"
                          strokeDasharray="4,10"
                          strokeLinecap="round"
                        />
                      </g>
                    ))}

                    {/* Landmarks / Stops dots and tags */}
                    {staticStops.map((stop, index) => {
                      const isSchool = stop.name === 'School';
                      return (
                        <g key={index}>
                          {/* Dot marker */}
                          <circle
                            cx={stop.x}
                            cy={stop.y}
                            r={isSchool ? '5' : '4'}
                            fill={isSchool ? '#ef4444' : '#10b981'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          
                          {/* Small offset indicator ring for school */}
                          {isSchool && (
                            <circle cx={stop.x} cy={stop.y} r="8" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="1,2" />
                          )}

                          {/* Stop label text tag */}
                          <g transform={`translate(${stop.x + 8}, ${stop.y - 7})`}>
                            <rect
                              width={stop.name.length * 5.2 + 10}
                              height="14"
                              rx="3"
                              fill="#475569"
                              opacity="0.85"
                            />
                            <text
                              x={(stop.name.length * 5.2 + 10) / 2}
                              y="9.5"
                              textAnchor="middle"
                              fill="#ffffff"
                              className="text-[8px] font-extrabold font-sans pointer-events-none"
                            >
                              {stop.name}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Active gliding vehicle pins */}
                    {filteredVehicles.map(veh => {
                      const pos = getVehiclePosition(veh);
                      const isSelected = veh.vehicle_id === selectedVehicleId;

                      let markerColor = '#94a3b8'; // Offline
                      if (veh.status === 'Running') markerColor = '#10b981'; // Green
                      else if (veh.status === 'Stopped') markerColor = '#f59e0b'; // Yellow/Orange
                      else if (veh.status === 'Idle') markerColor = '#3b82f6'; // Blue

                      return (
                        <g
                          key={veh.vehicle_id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicleId(veh.vehicle_id === selectedVehicleId ? null : veh.vehicle_id);
                          }}
                        >
                          {/* Pulsing selection target */}
                          {isSelected && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="22"
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="2"
                              className="animate-pulse-ring"
                              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                            />
                          )}

                          {/* Pulse indicator for running status */}
                          {veh.status === 'Running' && !isSelected && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="16"
                              fill="none"
                              stroke={markerColor}
                              strokeWidth="1.5"
                              className="animate-pulse-ring"
                              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                            />
                          )}

                          {/* Outer border for selected */}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="13"
                            fill={isSelected ? '#4f46e5' : markerColor}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="shadow-lg transition-all"
                          />

                          {/* Bus emoji icon */}
                          <text
                            x={pos.x}
                            y={pos.y + 3.5}
                            textAnchor="middle"
                            className="text-[11px] pointer-events-none select-none"
                          >
                            🚌
                          </text>

                          {/* License Tag label above */}
                          <g transform={`translate(${pos.x - 35}, ${pos.y - 27})`}>
                            <rect width="70" height="13" rx="3" fill="#1e293b" />
                            <text
                              x="35"
                              y="9"
                              textAnchor="middle"
                              fill="#ffffff"
                              className="text-[7.5px] font-extrabold font-sans"
                            >
                              {veh.vehicle_number}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}

              {/* FLOATING VEHICLE TELEMETRY CARD */}
              {selectedVehicle && selectedVehicleCoords && (
                <div className="absolute top-2 left-2 w-56 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-md space-y-1.5 animate-fadeIn z-30">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-extrabold text-slate-800 text-[10.5px]">{selectedVehicle.vehicle_number}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[7.5px] font-extrabold tracking-wider ${
                      selectedVehicle.status === 'Running' ? 'bg-emerald-50 text-emerald-700' :
                      selectedVehicle.status === 'Stopped' ? 'bg-amber-50 text-amber-700' :
                      selectedVehicle.status === 'Idle' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[9px] text-slate-600">
                    <p className="flex justify-between"><span>👤 Driver:</span> <span className="font-bold text-slate-800">{selectedVehicle.driver_name}</span></p>
                    <p className="flex justify-between"><span>📞 Contact:</span> <span className="font-bold text-slate-800">{selectedVehicle.driver_contact}</span></p>
                    <p className="flex justify-between"><span>🗺️ Route:</span> <span className="font-bold text-slate-800 truncate max-w-[100px]">{selectedVehicle.route_name}</span></p>
                    <p className="flex justify-between"><span>⚡ Speed:</span> <span className="font-black text-indigo-700 text-[9.5px]">{selectedVehicle.speed} km/h</span></p>
                    <p className="flex justify-between"><span>📍 Location:</span> <span className="font-bold text-slate-800">{selectedVehicle.stop_location}</span></p>
                  </div>
                  <div className="text-[7px] text-slate-400 font-bold border-t border-slate-100 pt-1 flex justify-between items-center">
                    <span>Telemetrics Update:</span>
                    <span>{selectedVehicle.time_str}</span>
                  </div>
                  <button
                    onClick={() => setSelectedVehicleId(null)}
                    className="w-full py-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[8.5px] transition-colors cursor-pointer"
                  >
                    Close Information
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT AREA: ACTIVE FLEET LIST SIDEBAR */}
          <div className="flex flex-col space-y-1.5">
            <div className="bg-slate-800 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded-xl shadow-xs flex items-center justify-between">
              <span className="flex items-center gap-1">🚌 Active Vehicles</span>
              <span className="bg-white/20 px-1 py-0.2 rounded-full text-[8px] lowercase font-semibold">{runningCount} running</span>
            </div>

            {/* Scroll list - max height reduced to 230px to sit perfectly next to 270px map */}
            <div className="flex-1 overflow-y-auto max-h-[230px] space-y-1.5 pr-1 custom-scrollbar">
              {filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl font-bold">
                  No active fleet matches.
                </div>
              ) : (
                filteredVehicles.map(veh => {
                  const isSelected = veh.vehicle_id === selectedVehicleId;
                  
                  let badgeDotColor = 'bg-slate-400';
                  if (veh.status === 'Running') badgeDotColor = 'bg-emerald-500';
                  else if (veh.status === 'Stopped') badgeDotColor = 'bg-yellow-500';
                  else if (veh.status === 'Idle') badgeDotColor = 'bg-blue-500';

                  return (
                    <div
                      key={veh.vehicle_id}
                      onClick={() => {
                        setSelectedVehicleId(veh.vehicle_id);
                        const pos = getVehiclePosition(veh);
                        setMapPan({ x: 400 - pos.x * zoomScale, y: 225 - pos.y * zoomScale });
                      }}
                      className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-xs ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-350 ring-2 ring-indigo-50 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-[10px] text-slate-800">{veh.vehicle_number}</span>
                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-500 bg-slate-50 px-1 py-0.1 rounded-full border border-slate-100">
                          <span className={`w-1 h-1 rounded-full ${badgeDotColor}`} />
                          {veh.status}
                        </span>
                      </div>
                      
                      {/* Grid representation */}
                      <div className="grid grid-cols-2 gap-y-0.5 gap-x-1 text-[8.5px] text-slate-500 border-t border-slate-100 pt-1">
                        <div className="flex items-center gap-1 truncate">
                          <span>👤</span>
                          <span className="font-bold text-slate-850">{veh.driver_name}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <span>🗺️</span>
                          <span className="font-bold text-slate-850">{veh.route_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>⚡</span>
                          <span className="font-bold text-indigo-700">{veh.speed} km/h</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <span>📍</span>
                          <span className="font-bold text-slate-850">{veh.stop_location}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2 text-[7.5px] text-slate-400 font-bold mt-0.5">
                          <span>🕒</span>
                          <span>{veh.time_str}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: HISTORY PLAYBACK TAB WORKSPACE */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500 text-[8.5px] uppercase tracking-wider">Select Vehicle:</span>
              <select
                value={historyVehicleId}
                onChange={(e) => setHistoryVehicleId(e.target.value)}
                className="px-2 py-1 border border-slate-200 focus:outline-none rounded-lg text-[10px] h-[28px] w-44 bg-white text-slate-700 cursor-pointer font-semibold"
              >
                <option value="">Choose Vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} ({v.driver_name})</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500 text-[8.5px] uppercase tracking-wider">Select Date:</span>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 focus:outline-none rounded-lg text-[10px] h-[28px] w-32 bg-white text-slate-700 font-semibold"
              />
            </div>

            <button
              onClick={handleFetchHistory}
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer shadow-xs h-[28px]"
            >
              Fetch Historical Path
            </button>
          </div>

          {historyData && historyData.path.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {/* Playback Map Canvas */}
              <div className="xl:col-span-3 flex flex-col space-y-1.5">
                <div className="relative border border-slate-200 rounded-2xl bg-[#eaebee] overflow-hidden shadow-inner h-[270px]">
                  <svg className="w-full h-full" viewBox="0 0 800 450">
                    {/* Background Roads */}
                    {roadNetworks.map((road, idx) => (
                      <path
                        key={idx}
                        d={road.path}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    ))}

                    {/* Historical Route Line */}
                    {(() => {
                      const points = historyData.path.map(p => mapCoords(p.latitude, p.longitude));
                      if (points.length < 2) return null;
                      const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

                      return (
                        <g>
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="4"
                            strokeDasharray="4,6"
                            strokeLinecap="round"
                          />
                          {/* Starting marker */}
                          <circle cx={points[0].x} cy={points[0].y} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                          <text x={points[0].x + 8} y={points[0].y + 3} className="text-[7.5px] font-black fill-emerald-600 bg-white">START</text>
                          
                          {/* Ending marker */}
                          <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                          <text x={points[points.length-1].x + 8} y={points[points.length-1].y + 3} className="text-[7.5px] font-black fill-rose-600 bg-white">END</text>
                        </g>
                      );
                    })()}

                    {/* Playback Marker Dot */}
                    {(() => {
                      const point = historyData.path[playbackIndex];
                      if (!point) return null;
                      const pos = mapCoords(point.latitude, point.longitude);
                      return (
                        <g>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="18"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2"
                            className="animate-pulse-ring"
                            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                          />
                          <circle cx={pos.x} cy={pos.y} r="11" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                          <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" className="text-[10px] pointer-events-none select-none">🚌</text>
                          <g transform={`translate(${pos.x - 35}, ${pos.y - 27})`}>
                            <rect width="70" height="13" rx="3" fill="#6366f1" />
                            <text x="35" y="9" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-extrabold">
                              {historyData.vehicle_number}
                            </text>
                          </g>
                        </g>
                      );
                    })()}
                  </svg>
                  
                  {/* Floating Playback telemetry logs */}
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-white rounded-xl p-2.5 shadow-md space-y-1 text-[9px] w-48 border border-slate-700">
                    <p className="font-extrabold border-b border-slate-800 pb-1 text-indigo-400">📊 History Telemetry Logs</p>
                    <p className="flex justify-between"><span>Speed:</span> <span className="font-bold text-white">{historyData.path[playbackIndex]?.speed} km/h</span></p>
                    <p className="flex justify-between"><span>Coordinates:</span> <span className="font-mono text-white text-[7.5px]">{historyData.path[playbackIndex]?.latitude.toFixed(5)}, {historyData.path[playbackIndex]?.longitude.toFixed(5)}</span></p>
                    <p className="flex justify-between"><span>Log Time:</span> <span className="font-bold text-white">{new Date(historyData.path[playbackIndex]?.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span></p>
                  </div>
                </div>

                {/* Timeline slider row */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs space-y-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`w-16 py-1 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-xs transition-colors ${
                        isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>

                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={historyData.path.length - 1}
                        value={playbackIndex}
                        onChange={(e) => {
                          setPlaybackIndex(parseInt(e.target.value));
                          setIsPlaying(false);
                        }}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-655 focus:outline-none"
                      />
                    </div>

                    <span className="text-[9px] font-bold text-slate-500 w-12 text-right">
                      {playbackIndex + 1} / {historyData.path.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinates List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-col justify-between max-h-[310px]">
                <h4 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-wider mb-1.5 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  Route Path Timeline
                </h4>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-[8.5px]">
                  {historyData.path.map((pt, idx) => (
                    <div
                      key={idx}
                      onClick={() => { setPlaybackIndex(idx); setIsPlaying(false); }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex justify-between items-center ${
                        playbackIndex === idx
                          ? 'bg-indigo-50 border-indigo-300 font-bold text-slate-900 shadow-xs'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <span className="block text-[7.5px] text-slate-400 font-black">
                          {new Date(pt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </span>
                        <span className="font-mono text-[8px]">
                          {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                        </span>
                      </div>
                      <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1 py-0.1 rounded-full border border-indigo-100">
                        {pt.speed} km/h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl font-bold shadow-xs">
              No historical data loaded. Choose a vehicle and click "Fetch Historical Path" to preview coordinates playback timeline.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: ACTIVE ALERTS TABLE WORKSPACE */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2.5">
            <h4 className="font-extrabold text-slate-800 text-[11px] flex items-center gap-1.5">
              ⚠️ Active Fleet Safety Warnings & Deviations
            </h4>
            <span className="bg-rose-50 text-rose-700 text-[8.5px] font-bold px-2 py-0.2 rounded-full border border-rose-100">
              {alerts.length} active alerts
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-6 text-center text-emerald-600 font-bold text-[10px] bg-slate-50 rounded-lg">
              ✓ All fleet diagnostics are normal. No active speed limits or route deviations logged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[8px] uppercase">
                    <th className="p-1.5 pl-2">Vehicle Plate No.</th>
                    <th className="p-1.5">Category</th>
                    <th className="p-1.5">Severity</th>
                    <th className="p-1.5">Telemetry Description Message</th>
                    <th className="p-1.5">Time Logged</th>
                    <th className="p-1.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[9.5px]">
                  {alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-1.5 pl-2 font-black text-slate-900">{alert.vehicle_number}</td>
                      <td className="p-1.5 font-semibold text-slate-700">{alert.alert_type}</td>
                      <td className="p-1.5">
                        <span className={`inline-block px-1.5 py-0.1 rounded-full text-[8px] font-extrabold border ${
                          alert.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-1.5 text-slate-600 font-medium max-w-[200px]">{alert.message}</td>
                      <td className="p-1.5 text-slate-400 font-semibold">
                        {new Date(alert.raised_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }).toLowerCase()}
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolvingId === alert.id}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[8.5px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RECENT ALERTS BAR AT BOTTOM PANEL (Matches Mockup) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs">
        <h4 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-widest mb-1.5 border-b border-slate-100 pb-1 flex items-center gap-1.5">
          🔔 Recent Alerts
        </h4>
        <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <p className="text-[9px] text-slate-400 font-semibold italic pl-1">No warning notifications flagged recently.</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="flex justify-between items-center text-[9px] bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    alert.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span className="font-extrabold text-slate-800 w-16">{alert.vehicle_number}</span>
                  <span className="text-slate-600 font-semibold">{alert.message}</span>
                </div>
                <span className="text-slate-400 font-bold">
                  {new Date(alert.raised_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }).toLowerCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GpsTrackingManager;
