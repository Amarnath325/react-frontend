import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Brush, Plus, RefreshCw, Eye, Sun, Moon,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, ShieldCheck, Star, X, Type, Minus,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import api from '../../../services/api';

interface ThemePreset {
  id: number;
  name: string;
  key: string;
  mode: 'dark' | 'light' | 'glassmorphism';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  bg_color: string;
  font_family: string;
  is_default: boolean;
  active_schools_count: number;
}

type SortField = 'name' | 'active_schools_count' | 'mode';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Searchable Select Component supporting both Light & Dark themes
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  labelPrefix,
  isLightMode
}: {
  options: SearchableOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon?: React.ElementType;
  labelPrefix?: string;
  isLightMode?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 font-bold cursor-pointer transition-all ${
          isLightMode
            ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-500" />}
        {labelPrefix && <span className={`text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-3 h-3 ml-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 mt-1.5 w-52 border rounded-2xl shadow-2xl z-50 p-2 space-y-1 ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
        }`}>
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className={`w-full pl-7 pr-2 py-1.5 border rounded-lg text-[11px] focus:outline-none focus:border-amber-500 ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
              }`}
            />
          </div>
          <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[10px] text-slate-400 text-center font-medium">No options match</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    opt.value === value
                      ? 'bg-amber-500/10 text-amber-600 font-bold border border-amber-500/30'
                      : isLightMode
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockThemes: ThemePreset[] = [
  {
    id: 1,
    name: 'Midnight Emerald (Default Dark)',
    key: 'midnight_emerald',
    mode: 'dark',
    primary_color: '#10B981',
    secondary_color: '#06B6D4',
    accent_color: '#3B82F6',
    bg_color: '#0F172A',
    font_family: 'Inter',
    is_default: true,
    active_schools_count: 142
  },
  {
    id: 2,
    name: 'Pure Pearl White (Light Theme)',
    key: 'pure_pearl_white_light',
    mode: 'light',
    primary_color: '#2563EB',
    secondary_color: '#0284C7',
    accent_color: '#059669',
    bg_color: '#FFFFFF',
    font_family: 'Inter',
    is_default: false,
    active_schools_count: 98
  },
  {
    id: 3,
    name: 'Classic Campus (Light Mode)',
    key: 'classic_campus_light',
    mode: 'light',
    primary_color: '#1E40AF',
    secondary_color: '#0284C7',
    accent_color: '#D97706',
    bg_color: '#F8FAFC',
    font_family: 'Roboto',
    is_default: false,
    active_schools_count: 65
  },
  {
    id: 4,
    name: 'Emerald Academy (Mint Light)',
    key: 'emerald_academy_light',
    mode: 'light',
    primary_color: '#047857',
    secondary_color: '#0D9488',
    accent_color: '#B45309',
    bg_color: '#F0FDF4',
    font_family: 'Outfit',
    is_default: false,
    active_schools_count: 42
  },
  {
    id: 5,
    name: 'Royal Sapphire (Navy Dark)',
    key: 'royal_sapphire',
    mode: 'dark',
    primary_color: '#2563EB',
    secondary_color: '#4F46E5',
    accent_color: '#06B6D4',
    bg_color: '#0B1329',
    font_family: 'Inter',
    is_default: false,
    active_schools_count: 85
  },
  {
    id: 6,
    name: 'Sunset Amber (Warm Dark)',
    key: 'sunset_amber',
    mode: 'dark',
    primary_color: '#F59E0B',
    secondary_color: '#EA580C',
    accent_color: '#EAB308',
    bg_color: '#121624',
    font_family: 'Outfit',
    is_default: false,
    active_schools_count: 54
  },
  {
    id: 7,
    name: 'Frosted Glassmorphism Dark',
    key: 'frosted_glass_dark',
    mode: 'glassmorphism',
    primary_color: '#06B6D4',
    secondary_color: '#8B5CF6',
    accent_color: '#F59E0B',
    bg_color: '#090D16',
    font_family: 'Plus Jakarta Sans',
    is_default: false,
    active_schools_count: 45
  }
];

export default function DefaultThemesPage() {
  const [themes, setThemes] = useState<ThemePreset[]>(mockThemes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // PAGE-LEVEL UI THEME MODE TOGGLE: 'dark' vs 'light'
  const [pageThemeMode, setPageThemeMode] = useState<'dark' | 'light'>('dark');

  // DYNAMIC TEXT SIZE SCALE (in px)
  const [fontSizePx, setFontSizePx] = useState<number>(14);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('active_schools_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [previewTheme, setPreviewTheme] = useState<ThemePreset | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for New Theme
  const [themeForm, setThemeForm] = useState({
    name: '',
    key: '',
    mode: 'light' as ThemePreset['mode'],
    primary_color: '#2563EB',
    secondary_color: '#0284C7',
    accent_color: '#059669',
    bg_color: '#FFFFFF',
    font_family: 'Inter',
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/themes');
      if (res.data.success && Array.isArray(res.data.data)) {
        setThemes(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Pre-built theme presets reloaded');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, modeFilter, sortBy, sortOrder, pageSize]);

  // Handle Font Size Controls
  const handleIncreaseFont = () => {
    if (fontSizePx >= 22) {
      toast.error('Maximum text size limit reached (22px)');
      return;
    }
    const next = fontSizePx + 1;
    setFontSizePx(next);
    toast.success(`Text size scaled to ${next}px`);
  };

  const handleDecreaseFont = () => {
    if (fontSizePx <= 10) {
      toast.error('Minimum text size limit reached (10px)');
      return;
    }
    const next = fontSizePx - 1;
    setFontSizePx(next);
    toast.success(`Text size scaled to ${next}px`);
  };

  // Set Default Theme
  const handleSetDefaultTheme = async (id: number) => {
    const target = themes.find(t => t.id === id);
    setThemes(prev =>
      prev.map(t => ({
        ...t,
        is_default: t.id === id,
      }))
    );

    // If a light theme is set as default, auto-switch page UI to light mode for true visual fidelity
    if (target?.mode === 'light') {
      setPageThemeMode('light');
    }

    toast.success(`🎉 '${target?.name}' set as default theme for all newly provisioned schools!`);

    try {
      await api.post(`/landlord/themes/${id}/set-default`);
    } catch {
      // Fallback
    }
  };

  // Create Theme Submit
  const handleCreateThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeForm.name) {
      toast.error('Please enter theme name');
      return;
    }

    const created: ThemePreset = {
      id: Date.now(),
      name: themeForm.name,
      key: themeForm.key || themeForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      mode: themeForm.mode,
      primary_color: themeForm.primary_color,
      secondary_color: themeForm.secondary_color,
      accent_color: themeForm.accent_color,
      bg_color: themeForm.bg_color,
      font_family: themeForm.font_family,
      is_default: false,
      active_schools_count: 0,
    };

    setThemes(prev => [created, ...prev]);
    setShowCreateModal(false);
    toast.success(`Custom theme '${created.name}' created!`);
    setThemeForm({ name: '', key: '', mode: 'light', primary_color: '#2563EB', secondary_color: '#0284C7', accent_color: '#059669', bg_color: '#FFFFFF', font_family: 'Inter' });
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = themes.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.font_family.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = modeFilter === 'all' || t.mode === modeFilter;

    return matchesSearch && matchesMode;
  });

  // Sorted Dataset
  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Dataset
  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  // Aggregated KPIs
  const totalPresets = themes.length;
  const defaultTheme = themes.find(t => t.is_default);
  const lightCount = themes.filter(t => t.mode === 'light').length;
  const darkCount = themes.filter(t => t.mode === 'dark' || t.mode === 'glassmorphism').length;
  const totalActiveSchools = themes.reduce((acc, t) => acc + t.active_schools_count, 0);

  const isLight = pageThemeMode === 'light';

  const sortOptions: SearchableOption[] = [
    { value: 'active_schools_count', label: 'Adoption Count' },
    { value: 'name', label: 'Theme Name' },
    { value: 'mode', label: 'Theme Mode' },
  ];

  const modeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Modes' },
    { value: 'light', label: 'Light Themes (White UI)' },
    { value: 'dark', label: 'Dark Themes Only' },
    { value: 'glassmorphism', label: 'Glassmorphism' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div
      className={`space-y-4 font-sans transition-colors duration-300 p-2 rounded-3xl ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-transparent text-slate-100'
      }`}
      style={{ fontSize: `${fontSizePx}px` }}
    >
      {/* ── TOP HEADER WITH PAGE UI MODE SWITCHER ── */}
      <div className={`flex items-center justify-between flex-wrap gap-4 p-6 rounded-3xl border shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-400/30'
            }`}>
              <Brush className="w-6 h-6" />
            </span>
            <div>
              <h1 className={`font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${fontSizePx * 1.4}px` }}>
                Default Dashboard Themes & Skin Presets
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-extrabold rounded-full border border-amber-500/30 uppercase tracking-wider">
                  UI Skin Engine
                </span>
              </h1>
              <p className={`mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontSize: `${fontSizePx * 0.85}px` }}>
                Pre-configured Pure White Light & OLED Dark color palettes with live pixel font scaling
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* UI THEME MODE TOGGLE: WHITE LIGHT VS SLATE DARK */}
          <button
            onClick={() => {
              const nextMode = isLight ? 'dark' : 'light';
              setPageThemeMode(nextMode);
              toast.success(`UI Mode switched to ${nextMode === 'light' ? 'Pure White Light Mode ☀️' : 'Sleek Dark Mode 🌙'}`);
            }}
            className={`px-3.5 py-2 border rounded-xl font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              isLight
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
            }`}
            style={{ fontSize: `${fontSizePx * 0.85}px` }}
          >
            {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-400" />}
            {isLight ? 'UI Mode: PURE WHITE LIGHT' : 'UI Mode: SLEEK DARK'}
          </button>

          <button
            onClick={handleRefresh}
            className={`px-3.5 py-2 border rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            style={{ fontSize: `${fontSizePx * 0.85}px` }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Themes
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 transition-all"
            style={{ fontSize: `${fontSizePx * 0.85}px` }}
          >
            <Plus className="w-4 h-4" /> Create Custom Theme
          </button>
        </div>
      </div>

      {/* ── GLOBAL TEXT SIZE & TYPOGRAPHY PX SCALE CONTROLLER BAR ── */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 shadow-xl transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`p-2 rounded-xl border ${
            isLight ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          }`}>
            <Type className="w-5 h-5" />
          </span>
          <div>
            <div className={`font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${fontSizePx * 1.05}px` }}>
              Global Typography & Text Size Controller (PX Scale)
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-500 font-mono font-black rounded-md border border-blue-500/30">
                {fontSizePx}px
              </span>
            </div>
            <div className={`mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontSize: `${fontSizePx * 0.8}px` }}>
              Increase or decrease base text size across student, staff, and admin portals in real time
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Preset Scale Buttons */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border font-bold ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`} style={{ fontSize: `${fontSizePx * 0.8}px` }}>
            <button
              onClick={() => setFontSizePx(12)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                fontSizePx === 12 ? 'bg-blue-600 text-white shadow-sm' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              12px
            </button>
            <button
              onClick={() => setFontSizePx(14)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                fontSizePx === 14 ? 'bg-blue-600 text-white shadow-sm' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              14px (Default)
            </button>
            <button
              onClick={() => setFontSizePx(16)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                fontSizePx === 16 ? 'bg-blue-600 text-white shadow-sm' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              16px
            </button>
            <button
              onClick={() => setFontSizePx(18)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                fontSizePx === 18 ? 'bg-blue-600 text-white shadow-sm' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              18px
            </button>
            <button
              onClick={() => setFontSizePx(20)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                fontSizePx === 20 ? 'bg-blue-600 text-white shadow-sm' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              20px
            </button>
          </div>

          {/* Stepper Buttons: A- & A+ */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecreaseFont}
              className={`p-2 border rounded-xl cursor-pointer font-extrabold flex items-center gap-1 transition-all ${
                isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              }`}
              style={{ fontSize: `${fontSizePx * 0.8}px` }}
              title="Decrease Text Size (-1px)"
            >
              <Minus className="w-3.5 h-3.5 text-blue-500" /> A-
            </button>
            <button
              onClick={handleIncreaseFont}
              className={`p-2 border rounded-xl cursor-pointer font-extrabold flex items-center gap-1 transition-all ${
                isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              }`}
              style={{ fontSize: `${fontSizePx * 0.8}px` }}
              title="Increase Text Size (+1px)"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" /> A+
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`border rounded-2xl p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Presets</span>
            <Brush className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`font-black ${isLight ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${fontSizePx * 1.5}px` }}>{totalPresets}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Curated Themes</div>
        </div>

        <div className={`border rounded-2xl p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Default</span>
            <Star className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-black text-emerald-600 truncate" style={{ fontSize: `${fontSizePx * 1.05}px` }}>{defaultTheme?.name || 'Midnight Emerald'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{defaultTheme?.primary_color} Accent</div>
        </div>

        <div className={`border rounded-2xl p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Light Themes (White)</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-black text-amber-600" style={{ fontSize: `${fontSizePx * 1.5}px` }}>{lightCount} Presets</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pure White UI</div>
        </div>

        <div className={`border rounded-2xl p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dark Themes</span>
            <Moon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-black text-purple-600" style={{ fontSize: `${fontSizePx * 1.5}px` }}>{darkCount} Presets</div>
          <div className="text-[10px] text-slate-400 mt-0.5">OLED & Glass UI</div>
        </div>

        <div className={`border rounded-2xl p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Schools</span>
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="font-black text-cyan-600" style={{ fontSize: `${fontSizePx * 1.5}px` }}>{totalActiveSchools}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Applied Themes</div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & SEARCHABLE DROPDOWNS ── */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 shadow-md ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search themes by name, key, font family..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl font-medium focus:outline-none focus:border-amber-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
              }`}
              style={{ fontSize: `${fontSizePx * 0.85}px` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <SearchableSelect
              options={sortOptions}
              value={sortBy}
              onChange={val => setSortBy(val as SortField)}
              placeholder="Sort By..."
              icon={ArrowUpDown}
              labelPrefix="Sort"
              isLightMode={isLight}
            />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`p-2 border rounded-xl cursor-pointer transition-all ${
                isLight ? 'bg-white border-slate-300 text-amber-600 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              }`}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Mode Filter Dropdown */}
          <SearchableSelect
            options={modeOptions}
            value={modeFilter}
            onChange={setModeFilter}
            placeholder="Mode..."
            icon={Filter}
            labelPrefix="Mode"
            isLightMode={isLight}
          />

          {/* 3. Page Size Dropdown */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
            isLightMode={isLight}
          />

          {/* 4. View Mode Switcher */}
          <div className={`flex items-center border rounded-xl p-1 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(t => (
            <div
              key={t.id}
              className={`rounded-3xl border p-5 space-y-4 shadow-xl transition-all ${
                isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              } ${t.is_default ? 'ring-2 ring-amber-500/50 border-amber-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-extrabold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${fontSizePx * 1.05}px` }}>
                    {t.name}
                    {t.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">{t.key}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase flex items-center gap-1 ${
                  t.mode === 'light'
                    ? 'text-amber-700 bg-amber-500/15 border-amber-500/30'
                    : 'text-purple-600 bg-purple-500/15 border-purple-500/30'
                }`}>
                  {t.mode === 'dark' ? <Moon className="w-3 h-3 text-purple-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
                  {t.mode}
                </span>
              </div>

              {/* Color Swatch Circles */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full border border-black/10 shadow-md" style={{ backgroundColor: t.primary_color }} title={`Primary: ${t.primary_color}`} />
                  <span className="w-6 h-6 rounded-full border border-black/10 shadow-md" style={{ backgroundColor: t.secondary_color }} title={`Secondary: ${t.secondary_color}`} />
                  <span className="w-6 h-6 rounded-full border border-black/10 shadow-md" style={{ backgroundColor: t.accent_color }} title={`Accent: ${t.accent_color}`} />
                  <span className="w-6 h-6 rounded-full border border-black/10 shadow-md" style={{ backgroundColor: t.bg_color }} title={`Background: ${t.bg_color}`} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold">{t.font_family}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'} style={{ fontSize: `${fontSizePx * 0.85}px` }}>
                  Active Schools: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{t.active_schools_count}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTheme(t)}
                    className={`p-1.5 border rounded-xl cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Live Preview Theme"
                  >
                    <Eye className="w-4 h-4 text-cyan-500" />
                  </button>
                  {t.is_default ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-600 rounded-xl text-[10px] font-bold">
                      Default Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultTheme(t.id)}
                      className={`px-2.5 py-1 border rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-amber-600 hover:text-white'
                      }`}
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className={`rounded-3xl border p-5 shadow-2xl overflow-hidden space-y-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-medium border-collapse" style={{ fontSize: `${fontSizePx * 0.85}px` }}>
              <thead>
                <tr className={`border-b font-bold uppercase text-[10px] tracking-wider select-none ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}>
                  <th className="p-3.5 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('name')}>
                    Theme Preset Name
                  </th>
                  <th className="p-3.5 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('mode')}>
                    Mode
                  </th>
                  <th className="p-3.5">Color Tokens</th>
                  <th className="p-3.5">Font</th>
                  <th className="p-3.5 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('active_schools_count')}>
                    Active Schools
                  </th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {paginatedData.map(t => (
                  <tr key={t.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-slate-900/50 transition-colors'}>
                    <td className="p-3.5 font-bold">
                      <div className={`font-extrabold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {t.name}
                        {t.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="text-[10px] font-mono text-amber-600 mt-0.5">{t.key}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
                        t.mode === 'light'
                          ? 'text-amber-700 bg-amber-500/10 border-amber-500/30'
                          : 'text-purple-600 bg-purple-500/10 border-purple-500/30'
                      }`}>
                        {t.mode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.primary_color }} />
                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.secondary_color }} />
                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.accent_color }} />
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">{t.font_family}</td>
                    <td className="p-3.5 font-mono font-bold">{t.active_schools_count}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewTheme(t)}
                          className={`px-2 py-1 border rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Eye className="w-3 h-3 text-cyan-500" /> Preview
                        </button>
                        {t.is_default ? (
                          <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-600 rounded-lg text-[10px] font-bold">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultTheme(t.id)}
                            className={`px-2 py-1 border rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-amber-600 hover:text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-amber-600 hover:text-white'
                            }`}
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 font-medium ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`} style={{ fontSize: `${fontSizePx * 0.8}px` }}>
          <div>
            Showing <strong className={isLight ? 'text-slate-900' : 'text-white'}>{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className={isLight ? 'text-slate-900' : 'text-white'}>{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalFiltered}</strong> theme presets
          </div>

          {pageSize !== 'all' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className={`p-2 border rounded-xl disabled:opacity-40 cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validPage === 1}
                className={`p-2 border rounded-xl disabled:opacity-40 cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold cursor-pointer ${
                      pageNum === validPage
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isLight
                        ? 'bg-white text-slate-700 border border-slate-300'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validPage === totalPages}
                className={`p-2 border rounded-xl disabled:opacity-40 cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className={`p-2 border rounded-xl disabled:opacity-40 cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: LIVE THEME PREVIEW ── */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-500" /> Live Theme Previewer: {previewTheme.name}
                </h3>
                <div className="text-[10px] text-slate-400 font-mono">
                  Font: {previewTheme.font_family} · Mode: {previewTheme.mode} · Scaled Text: {fontSizePx}px
                </div>
              </div>
              <button onClick={() => setPreviewTheme(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Simulated Portal Box */}
            <div
              className="p-5 rounded-2xl border shadow-inner space-y-4"
              style={{
                backgroundColor: previewTheme.bg_color,
                borderColor: previewTheme.secondary_color + '40',
                fontSize: `${fontSizePx}px`
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                    style={{ backgroundColor: previewTheme.primary_color }}
                  >
                    S
                  </div>
                  <span className={`font-bold ${previewTheme.mode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    School Dashboard
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: previewTheme.secondary_color }}
                >
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${previewTheme.mode === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className={`text-[10px] font-bold uppercase ${previewTheme.mode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Enrolled Students
                  </div>
                  <div className="font-black" style={{ color: previewTheme.primary_color }}>
                    2,450
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${previewTheme.mode === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className={`text-[10px] font-bold uppercase ${previewTheme.mode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Fee Collection
                  </div>
                  <div className="font-black" style={{ color: previewTheme.accent_color }}>
                    ₹ 14.8 Lakhs
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  style={{ backgroundColor: previewTheme.primary_color }}
                  className="px-4 py-2 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Primary Action Button
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Primary Hex: <strong className="font-mono">{previewTheme.primary_color}</strong>
              </span>
              <button
                onClick={() => setPreviewTheme(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CREATE CUSTOM THEME ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateThemeSubmit} className={`border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Brush className="w-4 h-4 text-amber-500" /> Create Custom Theme Preset
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Theme Display Name *</label>
                <input
                  type="text"
                  value={themeForm.name}
                  onChange={e => setThemeForm({ ...themeForm, name: e.target.value })}
                  placeholder="e.g. Pure Pearl White Light"
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Mode</label>
                  <select
                    value={themeForm.mode}
                    onChange={e => setThemeForm({ ...themeForm, mode: e.target.value as ThemePreset['mode'] })}
                    className={`w-full border rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="light">Pure White Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="glassmorphism">Glassmorphism</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Font Family</label>
                  <select
                    value={themeForm.font_family}
                    onChange={e => setThemeForm({ ...themeForm, font_family: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeForm.primary_color}
                      onChange={e => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeForm.primary_color}
                      onChange={e => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                      className={`w-full border rounded-xl px-2 py-1.5 font-mono uppercase text-[11px] ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeForm.bg_color}
                      onChange={e => setThemeForm({ ...themeForm, bg_color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeForm.bg_color}
                      onChange={e => setThemeForm({ ...themeForm, bg_color: e.target.value })}
                      className={`w-full border rounded-xl px-2 py-1.5 font-mono uppercase text-[11px] ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Save Theme Preset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
