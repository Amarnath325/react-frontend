import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { ArrowLeft, Save, Building2, MapPin, Wifi, CheckCircle2, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

// Toggle Switch Component
const FormToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-1 px-2.5 bg-slate-50 border border-slate-200/90 rounded-lg transition-all hover:border-slate-300">
    <div>
      <span className="text-[11px] font-bold text-slate-800 block">{label}</span>
      {description && <span className="text-[9.5px] text-slate-500 block leading-tight">{description}</span>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none cursor-pointer flex-shrink-0 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

// Searchable Select Component for Form Fields
const SearchableFormSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? (selected as any).value : '')}
      placeholder={placeholder}
      className="w-full text-xs"
      classNamePrefix="react-select"
      styles={{
        control: (base: any) => ({
          ...base,
          borderRadius: '0.5rem',
          borderColor: '#cbd5e1',
          minHeight: '28px',
          height: '28px',
          fontSize: '11.5px',
          boxShadow: 'none',
          backgroundColor: 'white',
          '&:hover': { borderColor: '#94a3b8' },
        }),
        valueContainer: (base: any) => ({
          ...base,
          padding: '0 8px',
        }),
        input: (base: any) => ({
          ...base,
          margin: '0',
          padding: '0',
        }),
        option: (base: any, state: any) => ({
          ...base,
          backgroundColor: state.isFocused ? '#eff6ff' : 'white',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '11.5px',
          padding: '4px 8px',
        }),
        placeholder: (base: any) => ({
          ...base,
          fontSize: '11.5px',
          color: '#94a3b8',
        }),
        singleValue: (base: any) => ({
          ...base,
          fontSize: '11.5px',
          color: '#1e293b',
          fontWeight: '600',
        }),
      }}
    />
  );
};

export default function BranchForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Complete Form State with all 13 br_* fields
  const [formData, setFormData] = useState({
    br_code: '',
    br_name: '',
    br_email: '',
    br_is_active: true,
    br_address: '',
    br_latitude: '28.613930',
    br_longitude: '77.209020',
    br_range_limit: 100,
    br_is_wifi_restricted: false,
    br_wifi_address: '',
    br_c_id: '1',
    br_s_id: '1',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityOptions = [
    { value: '1', label: 'Central Delhi City' },
    { value: '2', label: 'Noida Metro Region' },
    { value: '3', label: 'Gurugram Cyber Hub' },
  ];

  const stateOptions = [
    { value: '1', label: 'Delhi NCR State' },
    { value: '2', label: 'Uttar Pradesh State' },
    { value: '3', label: 'Haryana State' },
  ];


  useEffect(() => {
    if (isEditMode) {
      if (id === '1') {
        setFormData({
          br_code: 'BR-MAIN',
          br_name: 'Main Campus Branch',
          br_email: 'main.branch@school.edu',
          br_is_active: true,
          br_address: '123 Education Boulevard, Central Sector',
          br_latitude: '28.613930',
          br_longitude: '77.209020',
          br_range_limit: 100,
          br_is_wifi_restricted: true,
          br_wifi_address: '192.168.1.1',
          br_c_id: '1',
          br_s_id: '1',
        });
      } else if (id === '2') {
        setFormData({
          br_code: 'BR-CITY',
          br_name: 'City Center Branch',
          br_email: 'city.branch@school.edu',
          br_is_active: true,
          br_address: '45 Knowledge Park Road, Metro Area',
          br_latitude: '28.535517',
          br_longitude: '77.391029',
          br_range_limit: 150,
          br_is_wifi_restricted: false,
          br_wifi_address: '',
          br_c_id: '1',
          br_s_id: '2',
        });
      }
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFetchCurrentGps = () => {
    if ('geolocation' in navigator) {
      toast.loading('Capturing current GPS coordinates...', { id: 'gps' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            br_latitude: pos.coords.latitude.toFixed(6),
            br_longitude: pos.coords.longitude.toFixed(6),
          }));
          toast.success('GPS coordinates updated successfully!', { id: 'gps' });
        },
        () => {
          toast.error('Location permission denied or unavailable', { id: 'gps' });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'br_is_active') {
      setFormData((prev) => ({ ...prev, br_is_active: value === '1' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.br_code.trim()) {
      toast.error('Please enter Branch Code');
      return;
    }
    if (!formData.br_name.trim()) {
      toast.error('Please enter Branch Name');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(
        isEditMode
          ? `Branch "${formData.br_name}" updated successfully!`
          : `Branch "${formData.br_name}" created successfully!`
      );
      navigate('/attendance/settings/branch');
    }, 600);
  };

  return (
    <div className="bg-[#f4f7fc] p-1.5 sm:p-2 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-1.5">

        {/* COMPACT BREADCRUMB & PAGE TITLE */}
        <div className="flex items-center justify-between gap-2 py-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/attendance/settings/branch')}
              className="p-1 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-[#2b6cb0] tracking-tight leading-none">
                {isEditMode ? 'Edit School Branch' : 'Create New School Branch'}
              </h1>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <span onClick={() => navigate('/attendance/dashboard')} className="hover:text-blue-600 cursor-pointer">
                  Dashboard
                </span>
                <span>/</span>
                <span onClick={() => navigate('/attendance/config')} className="hover:text-blue-600 cursor-pointer">
                  Attendance Settings
                </span>
                <span>/</span>
                <span onClick={() => navigate('/attendance/settings/branch')} className="hover:text-blue-600 cursor-pointer">
                  Branch Policy
                </span>
                <span>/</span>
                <span className="font-bold text-slate-700">{isEditMode ? 'Edit' : 'Create'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ZERO SCROLL ENTERPRISE FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2">

          {/* SECTION 1: BASIC BRANCH DETAILS */}
          <div className="space-y-1.5">
            <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
              <h3 className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-3 h-3" />
                </div>
                <span>1. Basic Branch Information</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">

              {/* br_code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Branch Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="br_code"
                  value={formData.br_code}
                  onChange={handleChange}
                  placeholder="e.g. BR-MAIN"
                  required
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* br_name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="br_name"
                  value={formData.br_name}
                  onChange={handleChange}
                  placeholder="e.g. Main Campus Branch"
                  required
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* br_email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Branch Email
                </label>
                <input
                  type="email"
                  name="br_email"
                  value={formData.br_email}
                  onChange={handleChange}
                  placeholder="e.g. branch@school.edu"
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* br_c_id */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  City / Region
                </label>
                <SearchableFormSelect
                  options={cityOptions}
                  value={formData.br_c_id}
                  onChange={(val) => handleSelectChange('br_c_id', val)}
                  placeholder="Select City..."
                />
              </div>

              {/* br_s_id */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  State / Campus
                </label>
                <SearchableFormSelect
                  options={stateOptions}
                  value={formData.br_s_id}
                  onChange={(val) => handleSelectChange('br_s_id', val)}
                  placeholder="Select State..."
                />
              </div>

              {/* br_is_active TOGGLE SWITCH */}
              <div className="flex items-end">
                <div className="w-full">
                  <FormToggleSwitch
                    label="Branch Active Status"
                    description={formData.br_is_active ? 'Branch active & operational' : 'Branch inactive'}
                    checked={formData.br_is_active}
                    onChange={(val) => handleToggleChange('br_is_active', val)}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: GEOFENCE & GPS COORDINATES */}
          <div className="space-y-1.5 pt-0.5">
            <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
              <h3 className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-3 h-3" />
                </div>
                <span>2. Geofence & GPS Coordinates</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchCurrentGps}
                  className="text-[10.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.2 rounded-full border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Capture current device GPS coordinates"
                >
                  <Navigation className="w-3 h-3 text-blue-600" />
                  <span>📍 Get Current GPS</span>
                </button>
                {formData.br_latitude && formData.br_longitude && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active ({formData.br_range_limit}m)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">

              {/* br_address */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Physical Branch Address
                </label>
                <input
                  type="text"
                  name="br_address"
                  value={formData.br_address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Education Boulevard, Central Sector"
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* br_latitude */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Latitude Coordinate
                </label>
                <input
                  type="text"
                  name="br_latitude"
                  value={formData.br_latitude}
                  onChange={handleChange}
                  placeholder="e.g. 28.613930"
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* br_longitude */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Longitude Coordinate
                </label>
                <input
                  type="text"
                  name="br_longitude"
                  value={formData.br_longitude}
                  onChange={handleChange}
                  placeholder="e.g. 77.209020"
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* br_range_limit */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Geofence Radius (Meters)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    name="br_range_limit"
                    value={formData.br_range_limit}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-24 px-2 py-0.5 h-7 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {[50, 100, 200, 500, 1000].map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, br_range_limit: radius }))}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          Number(formData.br_range_limit) === radius
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {radius >= 1000 ? `${radius / 1000}k` : `${radius}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: WI-FI RESTRICTIONS */}
          <div className="space-y-1.5 pt-0.5">
            <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
              <h3 className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Wifi className="w-3 h-3" />
                </div>
                <span>3. Wi-Fi IP Restriction Rules</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">

              {/* br_is_wifi_restricted */}
              <div className="sm:col-span-2 md:col-span-2">
                <FormToggleSwitch
                  label="Enable Wi-Fi Restriction"
                  description="Require employees to be connected to branch Wi-Fi network for biometric attendance"
                  checked={formData.br_is_wifi_restricted}
                  onChange={(val) => handleToggleChange('br_is_wifi_restricted', val)}
                />
              </div>

              {/* br_wifi_address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Allowed Wi-Fi IP Address
                </label>
                <input
                  type="text"
                  name="br_wifi_address"
                  value={formData.br_wifi_address}
                  onChange={handleChange}
                  placeholder="e.g. 192.168.1.1"
                  disabled={!formData.br_is_wifi_restricted}
                  className="w-full px-2.5 py-1 h-7.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                />
              </div>

            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/attendance/settings/branch')}
              className="px-3.5 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Branch' : 'Save Branch'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
