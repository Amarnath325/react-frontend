import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Type definitions for mock data state
interface Vehicle {
  id: number;
  number: string;
  type: string;
  model: string;
  capacity: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
  driver: string;
  route: string;
}

interface Driver {
  id: number;
  name: string;
  license: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  vehicle: string;
}

interface RouteItem {
  id: number;
  name: string;
  stops: string[];
  distance: string;
  duration: string;
  bus: string;
}

interface Stop {
  id: number;
  name: string;
  time: string;
  route: string;
  fee: number;
}

interface StudentAllocation {
  id: number;
  studentName: string;
  rollNo: string;
  classSection: string;
  route: string;
  stop: string;
  status: 'Active' | 'Suspended';
}

interface Trip {
  id: number;
  vehicle: string;
  route: string;
  type: 'Pickup' | 'Drop';
  time: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Delayed';
  studentsCount: number;
}

interface AttendanceRecord {
  id: number;
  studentName: string;
  route: string;
  stop: string;
  boarded: boolean;
  time?: string;
}

interface FuelLog {
  id: number;
  date: string;
  vehicle: string;
  liters: number;
  amount: number;
  odometer: number;
}

interface MaintenanceRecord {
  id: number;
  date: string;
  vehicle: string;
  type: string;
  cost: number;
  status: 'Completed' | 'Pending';
  remarks: string;
}

interface Complaint {
  id: number;
  date: string;
  user: string;
  type: 'Driver Behavior' | 'Delay' | 'Vehicle Issue' | 'Other';
  description: string;
  status: 'Pending' | 'Resolved' | 'In Investigation';
}

const TransportPlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // React State for interactive mockups
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 1, number: 'DL-1PA-1234', type: 'Bus', model: 'Tata Starbus', capacity: 40, status: 'Active', driver: 'Rajesh Kumar', route: 'Route A - North Sector' },
    { id: 2, number: 'DL-1PB-5678', type: 'Bus', model: 'Eicher Starline', capacity: 32, status: 'Active', driver: 'Sohan Singh', route: 'Route B - East Avenue' },
    { id: 3, number: 'DL-2PC-9012', type: 'Van', model: 'Force Traveller', capacity: 15, status: 'Maintenance', driver: 'Amit Sharma', route: 'Route C - South Extension' },
    { id: 4, number: 'DL-1PD-4321', type: 'Bus', model: 'Tata Starbus', capacity: 40, status: 'Active', driver: 'Gurnam Singh', route: 'Route D - West Ring Road' },
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    { id: 1, name: 'Rajesh Kumar', license: 'DL-12202209384', phone: '9876543210', status: 'Active', vehicle: 'DL-1PA-1234' },
    { id: 2, name: 'Sohan Singh', license: 'DL-14202300481', phone: '9876543211', status: 'Active', vehicle: 'DL-1PB-5678' },
    { id: 3, name: 'Amit Sharma', license: 'DL-12202008761', phone: '9876543212', status: 'On Leave', vehicle: 'DL-2PC-9012' },
    { id: 4, name: 'Gurnam Singh', license: 'DL-15202409812', phone: '9876543213', status: 'Active', vehicle: 'DL-1PD-4321' },
  ]);

  const [routes, setRoutes] = useState<RouteItem[]>([
    { id: 1, name: 'Route A - North Sector', stops: ['Rohini Sec 15', 'Pitampura', 'Shalimar Bagh'], distance: '14.5 km', duration: '40 mins', bus: 'DL-1PA-1234' },
    { id: 2, name: 'Route B - East Avenue', stops: ['Preet Vihar', 'Laxmi Nagar', 'Mayur Vihar'], distance: '12.2 km', duration: '35 mins', bus: 'DL-1PB-5678' },
    { id: 3, name: 'Route C - South Extension', stops: ['Saket', 'Malviya Nagar', 'Green Park'], distance: '18.0 km', duration: '50 mins', bus: 'DL-2PC-9012' },
    { id: 4, name: 'Route D - West Ring Road', stops: ['Janakpuri', 'Dwarka Sec 6', 'Rajouri Garden'], distance: '21.5 km', duration: '55 mins', bus: 'DL-1PD-4321' },
  ]);

  const [stops, setStops] = useState<Stop[]>([
    { id: 1, name: 'Rohini Sec 15', time: '07:15 AM', route: 'Route A - North Sector', fee: 1800 },
    { id: 2, name: 'Pitampura', time: '07:25 AM', route: 'Route A - North Sector', fee: 1600 },
    { id: 3, name: 'Shalimar Bagh', time: '07:35 AM', route: 'Route A - North Sector', fee: 1500 },
    { id: 4, name: 'Preet Vihar', time: '07:20 AM', route: 'Route B - East Avenue', fee: 1700 },
    { id: 5, name: 'Laxmi Nagar', time: '07:30 AM', route: 'Route B - East Avenue', fee: 1600 },
    { id: 6, name: 'Mayur Vihar', time: '07:45 AM', route: 'Route B - East Avenue', fee: 1500 },
  ]);

  const [allocations, setAllocations] = useState<StudentAllocation[]>([
    { id: 1, studentName: 'Aarav Sharma', rollNo: 'S1024', classSection: 'Class X-A', route: 'Route A - North Sector', stop: 'Rohini Sec 15', status: 'Active' },
    { id: 2, studentName: 'Diya Patel', rollNo: 'S1154', classSection: 'Class IX-B', route: 'Route B - East Avenue', stop: 'Preet Vihar', status: 'Active' },
    { id: 3, studentName: 'Kabir Singh', rollNo: 'S0987', classSection: 'Class XI-A', route: 'Route C - South Extension', stop: 'Saket', status: 'Active' },
    { id: 4, studentName: 'Ananya Goel', rollNo: 'S1231', classSection: 'Class XII-C', route: 'Route A - North Sector', stop: 'Pitampura', status: 'Active' },
    { id: 5, studentName: 'Rohan Verma', rollNo: 'S1402', classSection: 'Class VIII-A', route: 'Route D - West Ring Road', stop: 'Janakpuri', status: 'Active' },
  ]);

  const [trips, setTrips] = useState<Trip[]>([
    { id: 1, vehicle: 'DL-1PA-1234', route: 'Route A - North Sector', type: 'Pickup', time: '07:00 AM', status: 'Completed', studentsCount: 38 },
    { id: 2, vehicle: 'DL-1PB-5678', route: 'Route B - East Avenue', type: 'Pickup', time: '07:15 AM', status: 'In Progress', studentsCount: 29 },
    { id: 3, vehicle: 'DL-2PC-9012', route: 'Route C - South Extension', type: 'Pickup', time: '07:10 AM', status: 'Delayed', studentsCount: 14 },
    { id: 4, vehicle: 'DL-1PD-4321', route: 'Route D - West Ring Road', type: 'Pickup', time: '07:05 AM', status: 'Scheduled', studentsCount: 35 },
  ]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: 1, studentName: 'Aarav Sharma', route: 'Route A - North Sector', stop: 'Rohini Sec 15', boarded: true, time: '07:16 AM' },
    { id: 2, studentName: 'Ananya Goel', route: 'Route A - North Sector', stop: 'Pitampura', boarded: false },
    { id: 3, studentName: 'Rohan Verma', route: 'Route D - West Ring Road', stop: 'Janakpuri', boarded: true, time: '07:09 AM' },
    { id: 4, studentName: 'Diya Patel', route: 'Route B - East Avenue', stop: 'Preet Vihar', boarded: true, time: '07:22 AM' },
  ]);

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([
    { id: 1, date: '2026-06-12', vehicle: 'DL-1PA-1234', liters: 45.5, amount: 4322.50, odometer: 45200 },
    { id: 2, date: '2026-06-13', vehicle: 'DL-1PB-5678', liters: 38.0, amount: 3610.00, odometer: 32800 },
    { id: 3, date: '2026-06-14', vehicle: 'DL-1PD-4321', liters: 50.0, amount: 4750.00, odometer: 18450 },
  ]);

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([
    { id: 1, date: '2026-06-10', vehicle: 'DL-2PC-9012', type: 'Routine Service', cost: 6500, status: 'Completed', remarks: 'Engine oil and air filter replacement' },
    { id: 2, date: '2026-06-14', vehicle: 'DL-1PA-1234', type: 'Brake Repair', cost: 3800, status: 'Completed', remarks: 'Front brake pads replaced' },
    { id: 3, date: '2026-06-15', vehicle: 'DL-1PB-5678', type: 'AC Checking', cost: 1200, status: 'Pending', remarks: 'Cooling check requested' },
  ]);

  const [complaints, setComplaints] = useState<Complaint[]>([
    { id: 1, date: '2026-06-12', user: 'Parent (Kunal Goel)', type: 'Delay', description: 'Bus #1 was delayed by 20 minutes at Rohini Sec 15 stop.', status: 'Resolved' },
    { id: 2, date: '2026-06-14', user: 'Parent (Meera Shah)', type: 'Driver Behavior', description: 'Driver was driving somewhat fast on the highway.', status: 'In Investigation' },
  ]);

  // Form input states (for interactive mock actions)
  const [newVehicleNum, setNewVehicleNum] = useState('');
  const [newVehicleDriver, setNewVehicleDriver] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newStopName, setNewStopName] = useState('');
  const [newStopFee, setNewStopFee] = useState('');
  const [allocStudentName, setAllocStudentName] = useState('');
  const [allocRoute, setAllocRoute] = useState('Route A - North Sector');
  const [allocStop, setAllocStop] = useState('Rohini Sec 15');
  const [fuelVehicle, setFuelVehicle] = useState('DL-1PA-1234');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');

  // Handle Form Actions
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleNum) return;
    const newV: Vehicle = {
      id: vehicles.length + 1,
      number: newVehicleNum,
      type: 'Bus',
      model: 'Tata Starbus',
      capacity: 40,
      status: 'Active',
      driver: newVehicleDriver || 'Unassigned',
      route: 'Unassigned',
    };
    setVehicles([newV, ...vehicles]);
    setNewVehicleNum('');
    setNewVehicleDriver('');
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;
    const newD: Driver = {
      id: drivers.length + 1,
      name: newDriverName,
      license: 'DL-' + Math.floor(10000000000 + Math.random() * 90000000000),
      phone: newDriverPhone,
      status: 'Active',
      vehicle: 'Unassigned',
    };
    setDrivers([newD, ...drivers]);
    setNewDriverName('');
    setNewDriverPhone('');
  };

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName || !newStopFee) return;
    const newS: Stop = {
      id: stops.length + 1,
      name: newStopName,
      time: '07:30 AM',
      route: 'Route A - North Sector',
      fee: parseFloat(newStopFee),
    };
    setStops([newS, ...stops]);
    setNewStopName('');
    setNewStopFee('');
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocStudentName) return;
    const newAlloc: StudentAllocation = {
      id: allocations.length + 1,
      studentName: allocStudentName,
      rollNo: 'S' + Math.floor(1000 + Math.random() * 9000),
      classSection: 'Class VIII-B',
      route: allocRoute,
      stop: allocStop,
      status: 'Active',
    };
    setAllocations([newAlloc, ...allocations]);
    setAllocStudentName('');
  };

  const handleAddFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelLiters || !fuelAmount) return;
    const newF: FuelLog = {
      id: fuelLogs.length + 1,
      date: new Date().toISOString().split('T')[0],
      vehicle: fuelVehicle,
      liters: parseFloat(fuelLiters),
      amount: parseFloat(fuelAmount),
      odometer: 45000 + fuelLogs.length * 120,
    };
    setFuelLogs([newF, ...fuelLogs]);
    setFuelLiters('');
    setFuelAmount('');
  };

  // RENDER VEHICLE MANAGEMENT
  const renderVehicles = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>➕</span> Add School Vehicle
        </h2>
        <form onSubmit={handleAddVehicle} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Number</label>
            <input
              type="text"
              required
              placeholder="e.g. DL-1PA-9999"
              value={newVehicleNum}
              onChange={(e) => setNewVehicleNum(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign Driver</label>
            <select
              value={newVehicleDriver}
              onChange={(e) => setNewVehicleDriver(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="">Unassigned</option>
              {drivers.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors duration-150"
          >
            Register Vehicle
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>🚌</span> Active Vehicle Fleet
          </h2>
          <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 font-bold">
            Total: {vehicles.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Vehicle</th>
                <th className="py-2 px-3">Model/Type</th>
                <th className="py-2 px-3">Driver</th>
                <th className="py-2 px-3">Assigned Route</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{v.number}</td>
                  <td className="py-2.5 px-3 text-slate-600">{v.model} ({v.type})</td>
                  <td className="py-2.5 px-3 text-slate-600">{v.driver}</td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">{v.route}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      v.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RENDER DRIVER MANAGEMENT
  const renderDrivers = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>➕</span> Add Transport Driver
        </h2>
        <form onSubmit={handleAddDriver} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Driver Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Singh"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 9988776655"
              value={newDriverPhone}
              onChange={(e) => setNewDriverPhone(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors duration-150"
          >
            Register Driver
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>👥</span> Driver Registry
          </h2>
          <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 font-bold">
            Total: {drivers.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Driver Name</th>
                <th className="py-2 px-3">License Number</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Assigned Vehicle</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{d.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{d.license}</td>
                  <td className="py-2.5 px-3 text-slate-600">{d.phone}</td>
                  <td className="py-2.5 px-3 text-slate-600">{d.vehicle}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      d.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RENDER ROUTE MANAGEMENT
  const renderRoutes = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>🗺️</span> Transport Route Mapping
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Route Name</th>
              <th className="py-2 px-3">Stops List</th>
              <th className="py-2 px-3">Distance</th>
              <th className="py-2 px-3">Est. Duration</th>
              <th className="py-2 px-3">Assigned Bus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">{r.name}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 text-[10px]">
                    {r.stops.map((stop, sidx) => (
                      <React.Fragment key={sidx}>
                        {sidx > 0 && <span className="text-slate-400">➔</span>}
                        <span className="bg-blue-50/50 border border-blue-100/60 text-blue-600 px-1 py-0.2 rounded font-semibold">
                          {stop}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{r.distance}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.duration}</td>
                <td className="py-2.5 px-3 text-slate-600 font-semibold">{r.bus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER STOP MANAGEMENT
  const renderStops = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>➕</span> Add Route Stop
        </h2>
        <form onSubmit={handleAddStop} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stop Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rohini Sec 11"
              value={newStopName}
              onChange={(e) => setNewStopName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Monthly Fee (₹)</label>
            <input
              type="number"
              required
              placeholder="e.g. 1500"
              value={newStopFee}
              onChange={(e) => setNewStopFee(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors duration-150"
          >
            Register Stop
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>📍</span> Stop Lists & Tariffs
        </h2>
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Stop Name</th>
                <th className="py-2 px-3">Morning Pickup Time</th>
                <th className="py-2 px-3">Route Assigned</th>
                <th className="py-2 px-3 text-right">Monthly Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stops.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.time}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.route}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-bold text-right">₹{s.fee.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RENDER STUDENT ALLOCATION
  const renderAllocations = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>➕</span> Allocate Student
        </h2>
        <form onSubmit={handleAllocate} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Diya Patel"
              value={allocStudentName}
              onChange={(e) => setAllocStudentName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Route</label>
            <select
              value={allocRoute}
              onChange={(e) => setAllocRoute(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {routes.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Stop</label>
            <select
              value={allocStop}
              onChange={(e) => setAllocStop(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="Rohini Sec 15">Rohini Sec 15</option>
              <option value="Preet Vihar">Preet Vihar</option>
              <option value="Saket">Saket</option>
              <option value="Pitampura">Pitampura</option>
              <option value="Janakpuri">Janakpuri</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors duration-150"
          >
            Assign Student
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>👨‍🎓</span> Assigned Passengers List
        </h2>
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Student</th>
                <th className="py-2 px-3">Class/Roll</th>
                <th className="py-2 px-3">Route</th>
                <th className="py-2 px-3">Stop</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{a.studentName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.classSection} ({a.rollNo})</td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[130px]">{a.route}</td>
                  <td className="py-2.5 px-3 text-slate-650">{a.stop}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RENDER TRIP MANAGEMENT
  const renderTrips = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>🔄</span> Today's Trip Checklist & Schedules
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Bus Vehicle</th>
              <th className="py-2 px-3">Scheduled Route</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Depart Time</th>
              <th className="py-2 px-3">Students</th>
              <th className="py-2 px-3">Trip Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((t) => {
              let badge = 'bg-slate-50 text-slate-550 border-slate-150';
              if (t.status === 'Completed') badge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              if (t.status === 'In Progress') badge = 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
              if (t.status === 'Delayed') badge = 'bg-rose-50 text-rose-600 border-rose-100';

              return (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{t.vehicle}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.route}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-bold">{t.type}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.time}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-bold">{t.studentsCount}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER TRANSPORT ATTENDANCE
  const renderAttendance = () => {
    const toggleBoarded = (id: number) => {
      setAttendance(attendance.map(a => {
        if (a.id === id) {
          const nowBoarded = !a.boarded;
          return {
            ...a,
            boarded: nowBoarded,
            time: nowBoarded ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
          };
        }
        return a;
      }));
    };

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>📋</span> Real-time Passenger Boarding Checklist
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">Click checkmark to mark Boarded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Student Name</th>
                <th className="py-2 px-3">Route</th>
                <th className="py-2 px-3">Stop</th>
                <th className="py-2 px-3">Boarding Status</th>
                <th className="py-2 px-3">Logged Boarding Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{a.studentName}</td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[130px]">{a.route}</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.stop}</td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => toggleBoarded(a.id)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all duration-150 active:scale-95 ${
                        a.boarded
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/60'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {a.boarded ? '✓ Boarded' : '✗ Unchecked'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-750">{a.time || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // RENDER GPS TRACKING
  const renderGPS = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>📡</span> Live Vehicle GPS Telemetry
        </h2>
        <span className="flex items-center gap-1.5 text-[9px] text-emerald-650 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Connection: Active
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mock Map View Card */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl h-60 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Mock Roads */}
          <div className="absolute w-full h-1.5 bg-slate-350 top-1/3 left-0" />
          <div className="absolute w-full h-1.5 bg-slate-350 bottom-1/4 left-0" />
          <div className="absolute h-full w-1.5 bg-slate-350 left-1/4 top-0" />
          <div className="absolute h-full w-1.5 bg-slate-350 left-2/3 top-0" />

          {/* School location dot */}
          <div className="absolute top-[40%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-base">🏫</span>
            <span className="text-[8px] bg-slate-950 text-white font-bold px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap border border-slate-700">School HQ</span>
          </div>

          {/* Bus 01 Dot */}
          <div className="absolute top-[32%] left-[45%] flex flex-col items-center animate-bounce">
            <span className="text-sm">🚌</span>
            <span className="text-[8px] bg-indigo-650 text-white font-bold px-1.2 py-0.2 rounded mt-0.5 whitespace-nowrap">Bus #1 (42 km/h)</span>
          </div>

          {/* Bus 02 Dot */}
          <div className="absolute top-[73%] left-[70%] flex flex-col items-center">
            <span className="text-sm">🚌</span>
            <span className="text-[8px] bg-indigo-650 text-white font-bold px-1.2 py-0.2 rounded mt-0.5 whitespace-nowrap">Bus #2 (Idle)</span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2 max-w-[150px] shadow-sm z-10">
            <p className="text-[9px] font-bold text-slate-800 uppercase tracking-tight">Active Fleet Units</p>
            <p className="text-[8px] text-slate-500 mt-0.5 leading-normal">DL-1PA-1234: 2.1km away (ETA 8 mins)<br />DL-1PB-5678: Completed Pickup</p>
          </div>
        </div>

        {/* Live ETAs Side Card */}
        <div className="space-y-3.5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live ETA Checklist</h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {trips.filter(t => t.status === 'In Progress' || t.status === 'Delayed').map((t, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t.vehicle}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${
                    t.status === 'Delayed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {t.status === 'Delayed' ? 'Delayed 12m' : 'On Schedule'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className={`h-full ${t.status === 'Delayed' ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: t.status === 'Delayed' ? '40%' : '75%' }} />
                </div>
                <p className="text-[8px] text-slate-500 mt-1 font-semibold">Route: {t.route}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER FUEL MANAGEMENT
  const renderFuel = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>⛽</span> Log Fuel Entry
        </h2>
        <form onSubmit={handleAddFuel} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Vehicle</label>
            <select
              value={fuelVehicle}
              onChange={(e) => setFuelVehicle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.number}>{v.number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Liters Filled</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 40.5"
              value={fuelLiters}
              onChange={(e) => setFuelLiters(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Bill Amount (₹)</label>
            <input
              type="number"
              required
              placeholder="e.g. 3800"
              value={fuelAmount}
              onChange={(e) => setFuelAmount(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors duration-150"
          >
            Submit Fuel Entry
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <span>📊</span> Fuel Logs Ledger
        </h2>
        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
          <table className="w-full text-left text-xs font-medium text-slate-650">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Vehicle</th>
                <th className="py-2 px-3">Liters Filled</th>
                <th className="py-2 px-3">Odometer</th>
                <th className="py-2 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fuelLogs.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-600">{f.date}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{f.vehicle}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-bold">{f.liters} L</td>
                  <td className="py-2.5 px-3 text-slate-550">{f.odometer.toLocaleString()} km</td>
                  <td className="py-2.5 px-3 font-extrabold text-slate-800 text-right">₹{f.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RENDER MAINTENANCE MANAGEMENT
  const renderMaintenance = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>🔧</span> Service Maintenance Tickets & Logs
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Service Date</th>
              <th className="py-2 px-3">Vehicle</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Remarks</th>
              <th className="py-2 px-3 text-right">Cost (₹)</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {maintenanceRecords.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-slate-600">{m.date}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{m.vehicle}</td>
                <td className="py-2.5 px-3 text-slate-600 font-bold">{m.type}</td>
                <td className="py-2.5 px-3 text-slate-550 truncate max-w-[200px]">{m.remarks}</td>
                <td className="py-2.5 px-3 font-extrabold text-slate-800 text-right">₹{m.cost.toLocaleString()}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    m.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                  }`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER DOCUMENT MANAGEMENT
  const renderDocuments = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>📄</span> Legal Permitting & Vehicle Document Registry
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Vehicle</th>
              <th className="py-2 px-3">Registration Expiry</th>
              <th className="py-2 px-3">Insurance Policy Expiry</th>
              <th className="py-2 px-3">Fitness Cert Expiry</th>
              <th className="py-2 px-3">Permit State Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">DL-1PA-1234</td>
              <td className="py-2.5 px-3 text-slate-600">2032-11-20</td>
              <td className="py-2.5 px-3 text-slate-600">
                <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1 py-0.2 rounded">
                  2026-06-25 (Expiring soon)
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-600">2027-04-12</td>
              <td className="py-2.5 px-3 text-slate-600">2029-08-30</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">DL-1PB-5678</td>
              <td className="py-2.5 px-3 text-slate-600">2033-03-10</td>
              <td className="py-2.5 px-3 text-slate-600">2027-02-15</td>
              <td className="py-2.5 px-3 text-slate-650">2027-11-05</td>
              <td className="py-2.5 px-3 text-slate-600">2028-12-14</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">DL-2PC-9012</td>
              <td className="py-2.5 px-3 text-slate-600">2030-05-18</td>
              <td className="py-2.5 px-3 text-slate-600">2027-01-22</td>
              <td className="py-2.5 px-3 text-slate-600">2026-09-02</td>
              <td className="py-2.5 px-3 text-slate-600">2027-10-11</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER TRANSPORT FEE MANAGEMENT
  const renderFees = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>💳</span> Transport Fee Collection Ledgers
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Student Name</th>
              <th className="py-2 px-3">Class</th>
              <th className="py-2 px-3">Assigned Route</th>
              <th className="py-2 px-3 text-right">Fee Rate (Month)</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">Aarav Sharma</td>
              <td className="py-2.5 px-3 text-slate-600">Class X-A</td>
              <td className="py-2.5 px-3 text-slate-600">Route A - North Sector</td>
              <td className="py-2.5 px-3 text-slate-800 text-right">₹1,800</td>
              <td className="py-2.5 px-3">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">
                  Paid
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">Diya Patel</td>
              <td className="py-2.5 px-3 text-slate-600">Class IX-B</td>
              <td className="py-2.5 px-3 text-slate-600">Route B - East Avenue</td>
              <td className="py-2.5 px-3 text-slate-800 text-right">₹1,700</td>
              <td className="py-2.5 px-3">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-rose-50 text-rose-600 border-rose-100">
                  Overdue
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-bold text-slate-800">Kabir Singh</td>
              <td className="py-2.5 px-3 text-slate-600">Class XI-A</td>
              <td className="py-2.5 px-3 text-slate-600">Route C - South Extension</td>
              <td className="py-2.5 px-3 text-slate-800 text-right">₹1,600</td>
              <td className="py-2.5 px-3">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">
                  Paid
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER COMPLAINTS
  const renderComplaints = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>💬</span> Customer & Parent Grievances
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium text-slate-650">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Logged Date</th>
              <th className="py-2 px-3">Reporter</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Incident Description</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-slate-600">{c.date}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{c.user}</td>
                <td className="py-2.5 px-3 text-slate-600 font-bold">{c.type}</td>
                <td className="py-2.5 px-3 text-slate-550 leading-normal max-w-[250px] truncate" title={c.description}>
                  {c.description}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // RENDER NOTIFICATIONS
  const renderNotifications = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>🔔</span> Push Notification Logs & Alerts Dispatcher
      </h2>
      <div className="space-y-3.5 max-w-lg">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Send Alert to Route Parents</p>
          <div className="mt-2 space-y-2">
            <select className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium">
              {routes.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <textarea
              rows={2}
              placeholder="Enter message (e.g. Bus #2 is delayed by 15 mins due to waterlogging)"
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
            <button
              onClick={() => alert('Notification broadcast request successfully sent.')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Broadcast Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER REPORTS
  const renderReports = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
      <h2 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        <span>📈</span> Operations & Analytics Report Generator
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { name: 'Fuel Performance Index', desc: 'Liters/km efficiency logs per chassis' },
          { name: 'Maintenance Expense Sheet', desc: 'Aggregated service ticket financials' },
          { name: 'Passenger Attendance Sheet', desc: 'Boarding reports filterable by route' },
          { name: 'Route Capacity Load Factor', desc: 'Allocation percentage vs bus capacities' }
        ].map((rep, idx) => (
          <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-350 rounded-xl transition-all duration-150 cursor-pointer shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{rep.name}</p>
              <p className="text-[10px] text-slate-500 leading-normal">{rep.desc}</p>
            </div>
            <button
              onClick={() => alert(`Preparing download for: ${rep.name}`)}
              className="mt-3.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded text-[10px] w-full transition-colors duration-100"
            >
              Export PDF / CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // RENDER GENERAL DASHBOARD (DEFAULT VIEW)
  const renderDashboard = () => {
    const statsList = [
      { label: 'Total Vehicles', value: vehicles.length, icon: '🚌', route: '/transport/vehicles', color: 'bg-blue-50 text-blue-600 border-blue-100' },
      { label: 'Active Drivers', value: drivers.filter(d => d.status === 'Active').length, icon: '👥', route: '/transport/drivers', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      { label: 'Operational Routes', value: routes.length, icon: '🗺️', route: '/transport/routes', color: 'bg-violet-50 text-violet-600 border-violet-100' },
      { label: 'Allocated Students', value: allocations.length, icon: '👨‍🎓', route: '/transport/allocations', color: 'bg-amber-50 text-amber-600 border-amber-100' },
      { label: 'Today\'s Scheduled Trips', value: trips.length, icon: '🔄', route: '/transport/trips', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
      { label: 'Pending Maintenance', value: maintenanceRecords.filter(m => m.status === 'Pending').length, icon: '🔧', route: '/transport/maintenance', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    ];

    const alerts = [
      { text: 'Bus DL-1PA-1234 Insurance policy is expiring in 10 days.', type: 'warn' },
      { text: 'Van DL-2PC-9012 has completed 5,000 km since last routine service.', type: 'info' },
    ];

    return (
      <div className="space-y-3.5 pb-2">
        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {statsList.map((stat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(stat.route)}
              className="group cursor-pointer bg-white border border-slate-200 hover:border-slate-350 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg border text-base ${stat.color} group-hover:scale-105 flex-shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 font-bold text-[9px] uppercase tracking-wider leading-none mb-1.5 truncate">
                  {stat.label}
                </h3>
                <span className="text-sm font-extrabold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors duration-150">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Quick Actions & Live Trips */}
          <div className="xl:col-span-2 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Navigation Hub</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Vehicle Fleet', path: '/transport/vehicles', emoji: '🚌' },
                  { name: 'Driver Records', path: '/transport/drivers', emoji: '👥' },
                  { name: 'GPS Tracking', path: '/transport/gps', emoji: '📡' },
                  { name: 'Fuel Management', path: '/transport/fuel', emoji: '⛽' },
                  { name: 'Maintenance Logs', path: '/transport/maintenance', emoji: '🔧' },
                  { name: 'Fee Ledger', path: '/transport/fees', emoji: '💳' },
                  { name: 'Daily Attendance', path: '/transport/attendance', emoji: '📋' },
                  { name: 'Operations Reports', path: '/transport/reports', emoji: '📈' },
                ].map((act, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(act.path)}
                    className="cursor-pointer bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 transition-all duration-150 hover:-translate-y-0.5 text-center group flex flex-col items-center justify-center gap-1.5"
                  >
                    <span className="text-base group-hover:scale-115 transition-transform duration-200">{act.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">{act.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warnings and Expiry Alerts */}
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Urgent Alerts & Notifications</h3>
              <div className="space-y-2.5">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={`p-2.5 border rounded-lg text-[10px] leading-relaxed font-semibold ${
                    alert.type === 'warn' ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-blue-50 text-blue-700 border-blue-150'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs">{alert.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
                      <p>{alert.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // HELPER MAPPING PATHS TO SPECIFIC LAYOUTS
  const getModuleTitle = () => {
    switch (path) {
      case '/transport/dashboard': return 'Transportation Dashboard';
      case '/transport/vehicles': return 'Vehicle Management (Bus & Van Setup)';
      case '/transport/drivers': return 'Driver & Staff Management';
      case '/transport/routes': return 'Route Management';
      case '/transport/stops': return 'Route Stop & Tariff Setup';
      case '/transport/allocations': return 'Student Transport Allocation';
      case '/transport/trips': return 'Trip & Schedule Management';
      case '/transport/attendance': return 'Daily Transport Attendance';
      case '/transport/gps': return 'Live GPS Tracking';
      case '/transport/fuel': return 'Fuel Log & Expense Management';
      case '/transport/maintenance': return 'Vehicle Maintenance Logs';
      case '/transport/documents': return 'Document & Permit Expiry Registry';
      case '/transport/fees': return 'Transport Fee Management';
      case '/transport/complaints': return 'Complaint & Feedback Log';
      case '/transport/notifications': return 'Broadcast & Route Alerts';
      case '/transport/reports': return 'Operations & Financial Analytics Reports';
      default: return 'Transport Operations';
    }
  };

  const getModuleIcon = () => {
    switch (path) {
      case '/transport/dashboard': return '📊';
      case '/transport/vehicles': return '🚌';
      case '/transport/drivers': return '👥';
      case '/transport/routes': return '🗺️';
      case '/transport/stops': return '📍';
      case '/transport/allocations': return '👨‍🎓';
      case '/transport/trips': return '🔄';
      case '/transport/attendance': return '📋';
      case '/transport/gps': return '📡';
      case '/transport/fuel': return '⛽';
      case '/transport/maintenance': return '🔧';
      case '/transport/documents': return '📄';
      case '/transport/fees': return '💳';
      case '/transport/complaints': return '💬';
      case '/transport/notifications': return '🔔';
      case '/transport/reports': return '📈';
      default: return '🚌';
    }
  };

  const getModuleDescription = () => {
    switch (path) {
      case '/transport/dashboard': return 'Overall metrics summary, fleet charts, and operational warnings.';
      case '/transport/vehicles': return 'Maintain detailed vehicle records, manufacturer specs, capacity parameters, and statuses.';
      case '/transport/drivers': return 'Register transport drivers, licensing details, contacts, and active status lists.';
      case '/transport/routes': return 'Manage school route maps, coordinate stop points, distances, and driving durations.';
      case '/transport/stops': return 'Define stop boarding times, street locations, and associated monthly route fee charges.';
      case '/transport/allocations': return 'Assign students to specific routes, stops, and vehicles for boarding list generation.';
      case '/transport/trips': return 'Plan morning pickups and afternoon drop-off shifts with load counts.';
      case '/transport/attendance': return 'Mark boarding check-ins and board times for students at stops.';
      case '/transport/gps': return 'Live vehicle location tracking, route telemetry coordinates, and auto-ETAs.';
      case '/transport/fuel': return 'Log fuel quantities, transaction receipts, odometer readings, and efficiency logs.';
      case '/transport/maintenance': return 'Track routine engine servicing, breakdowns, mechanics invoices, and service checklists.';
      case '/transport/documents': return 'Monitor registration papers, state permits, pollution PUC, and fitness certificate expiration warnings.';
      case '/transport/fees': return 'Verify student transport fee account status, pending ledgers, and invoice histories.';
      case '/transport/complaints': return 'Record parental complaints about delays, driver behavior, or bus conditions.';
      case '/transport/notifications': return 'Dispatch bulk WhatsApp/SMS delay notifications and route alteration alerts to parents.';
      case '/transport/reports': return 'Generate operations checklists, monthly expenditure worksheets, and attendance grids.';
      default: return 'Manage school transport operations.';
    }
  };

  const renderContent = () => {
    switch (path) {
      case '/transport/dashboard': return renderDashboard();
      case '/transport/vehicles': return renderVehicles();
      case '/transport/drivers': return renderDrivers();
      case '/transport/routes': return renderRoutes();
      case '/transport/stops': return renderStops();
      case '/transport/allocations': return renderAllocations();
      case '/transport/trips': return renderTrips();
      case '/transport/attendance': return renderAttendance();
      case '/transport/gps': return renderGPS();
      case '/transport/fuel': return renderFuel();
      case '/transport/maintenance': return renderMaintenance();
      case '/transport/documents': return renderDocuments();
      case '/transport/fees': return renderFees();
      case '/transport/complaints': return renderComplaints();
      case '/transport/notifications': return renderNotifications();
      case '/transport/reports': return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="space-y-3.5 animate-fadeIn pb-2">
      {/* Super Compact Slim Light Header */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-36 h-36 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{getModuleIcon()}</span> {getModuleTitle()}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {getModuleDescription()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-bold uppercase tracking-wider">
              Transport Module
            </span>
            {path !== '/transport/dashboard' && (
              <button
                onClick={() => navigate('/transport/dashboard')}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold transition-colors duration-150"
              >
                ← Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Content Pane */}
      {renderContent()}
    </div>
  );
};

export default TransportPlaceholder;
