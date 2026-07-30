import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import {
  Sun, Moon, Monitor, Eye, Sparkles, Check, RotateCcw,
  Save, Layout, Palette, Sliders, Type, Maximize2
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Royal Indigo', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Ocean Blue', hex: '#0284c7', bg: 'bg-sky-600' },
  { name: 'Emerald Green', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Crimson Rose', hex: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Amethyst Purple', hex: '#7c3aed', bg: 'bg-purple-600' },
  { name: 'Amber Gold', hex: '#d97706', bg: 'bg-amber-600' },
  { name: 'Dark Teal', hex: '#0d9488', bg: 'bg-teal-600' },
  { name: 'Slate Dark', hex: '#334155', bg: 'bg-slate-700' },
];

export default function SystemThemeManager() {
  const { theme, updateTheme, resetTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  // Preset Template loader
  const applyPresetTemplate = (type: string) => {
    switch (type) {
      case 'default':
        updateTheme({
          themeMode: 'light',
          primaryColor: '#4f46e5',
          pageDensity: 'compact',
          fontSizeScale: 12,
          containerWidth: 'full',
          tablePadding: 6,
          borderRadius: 'rounded',
          cardStyle: 'bordered'
        });
        toast.success('Loaded Default ERP Compact Theme');
        break;
      case 'dark_dev':
        updateTheme({
          themeMode: 'dark',
          primaryColor: '#0284c7',
          pageDensity: 'compact',
          fontSizeScale: 12,
          containerWidth: 'full',
          tablePadding: 6,
          borderRadius: 'subtle',
          cardStyle: 'bordered'
        });
        toast.success('Loaded Developer Dark Theme');
        break;
      case 'readability':
        updateTheme({
          themeMode: 'light',
          primaryColor: '#059669',
          pageDensity: 'spacious',
          fontSizeScale: 15,
          containerWidth: '1440px',
          tablePadding: 12,
          borderRadius: 'rounded',
          cardStyle: 'shadowed'
        });
        toast.success('Loaded High Readability Theme');
        break;
      case 'cyberpunk':
        updateTheme({
          themeMode: 'midnight_cyberpunk',
          primaryColor: '#7c3aed',
          pageDensity: 'compact',
          fontSizeScale: 12,
          containerWidth: 'full',
          tablePadding: 5,
          borderRadius: 'subtle',
          cardStyle: 'glass'
        });
        toast.success('Loaded Midnight Cyberpunk Theme');
        break;
      case 'sepia':
        updateTheme({
          themeMode: 'sepia_warm',
          primaryColor: '#d97706',
          pageDensity: 'comfortable',
          fontSizeScale: 14,
          containerWidth: '1280px',
          tablePadding: 8,
          borderRadius: 'rounded',
          cardStyle: 'bordered'
        });
        toast.success('Loaded Warm Sepia Eye-Care Theme');
        break;
    }
  };

  const handleSaveTheme = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Theme preferences & page scaling saved successfully!');
    }, 400);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-6 text-xs">
      {/* ─── HEADER & LIVE INTERACTIVE PREVIEW ──────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-150 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-gray-900">System Theme & Page Customization Module</h2>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Configure system-wide page size scaling, font density, dark/light theme modes, and primary color palettes in real-time.
          </p>
        </div>

        {/* Live Mini Preview Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 min-w-[280px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider">Real-Time Layout Preview</span>
            <span
              className="px-2 py-0.5 rounded text-white font-extrabold text-[9px]"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {theme.themeMode.toUpperCase()}
            </span>
          </div>
          <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1.5" style={{ fontSize: `${theme.fontSizeScale}px` }}>
            <div className="flex items-center justify-between font-bold">
              <span>Sample Dashboard Card</span>
              <span className="text-[9px] font-mono text-gray-400">Scale: {theme.fontSizeScale}px</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full" style={{ width: '70%', backgroundColor: theme.primaryColor }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
              <span>Density: {theme.pageDensity}</span>
              <button
                className="px-2 py-0.5 rounded text-white font-bold text-[9px]"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── QUICK PRESET TEMPLATES ─────────────────────────── */}
      <div className="space-y-2">
        <label className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
          <Sparkles className="w-4 h-4 text-amber-500" /> Quick Theme Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'default', label: 'Default ERP', desc: 'Compact / Light / Indigo', color: '#4f46e5' },
            { id: 'dark_dev', label: 'Developer Dark', desc: 'Compact / Dark / Sky Blue', color: '#0284c7' },
            { id: 'readability', label: 'High Readability', desc: 'Spacious 15px / Emerald', color: '#059669' },
            { id: 'cyberpunk', label: 'Midnight Neon', desc: 'Cyberpunk / Amethyst', color: '#7c3aed' },
            { id: 'sepia', label: 'Warm Eye-Care', desc: 'Sepia / Amber Gold', color: '#d97706' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPresetTemplate(p.id)}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-[11px] group-hover:text-indigo-900">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }}></span>
                {p.label}
              </div>
              <span className="text-[9.5px] text-gray-500 block mt-0.5 font-medium">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── SECTION 1: PAGE DENSITY & FONT SCALE CONTROL ───── */}
      <div className="space-y-3 pt-3 border-t border-gray-150">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
            <Maximize2 className="w-4 h-4 text-indigo-600" /> Page Layout Size & Font Density (Scaling)
          </label>
          <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Current Scale: {theme.fontSizeScale}px Font | Padding: {theme.tablePadding}px
          </span>
        </div>

        {/* Page Density Radio Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'ultra_compact', label: 'Ultra Compact', size: '11px', desc: 'Maximum data rows' },
            { id: 'compact', label: 'Compact ERP', size: '12px', desc: 'Default standard' },
            { id: 'comfortable', label: 'Comfortable', size: '14px', desc: 'Balanced spacing' },
            { id: 'spacious', label: 'Spacious', size: '16px', desc: 'Relaxed readability' },
            { id: 'custom', label: 'Custom Slider', size: `${theme.fontSizeScale}px`, desc: 'Manual control' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => updateTheme({ pageDensity: d.id as any })}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                theme.pageDensity === d.id
                  ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                  : 'bg-white border-gray-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">{d.label}</span>
                <span className="text-[9.5px] font-mono font-extrabold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">{d.size}</span>
              </div>
              <span className="text-[9.5px] text-gray-500 block mt-1 font-semibold">{d.desc}</span>
            </button>
          ))}
        </div>

        {/* Fine-Tuning Manual Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-800 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-gray-500" /> Base Font Size:
              </span>
              <span className="font-mono font-extrabold text-indigo-700">{theme.fontSizeScale}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={18}
              value={theme.fontSizeScale}
              onChange={(e) => updateTheme({ fontSizeScale: Number(e.target.value), pageDensity: 'custom' })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
              <span>10px (Tiny)</span>
              <span>12px (ERP)</span>
              <span>18px (Large)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-800 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-gray-500" /> Table Row Cell Padding:
              </span>
              <span className="font-mono font-extrabold text-indigo-700">{theme.tablePadding}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={14}
              value={theme.tablePadding}
              onChange={(e) => updateTheme({ tablePadding: Number(e.target.value), pageDensity: 'custom' })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
              <span>2px (Tight)</span>
              <span>6px (Std)</span>
              <span>14px (Spacious)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-gray-800 block text-xs flex items-center gap-1">
              <Layout className="w-3.5 h-3.5 text-gray-500" /> Page Container Width:
            </span>
            <select
              value={theme.containerWidth}
              onChange={(e) => updateTheme({ containerWidth: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-semibold text-xs focus:outline-none"
            >
              <option value="full">Full Screen (100% Fluid Width)</option>
              <option value="1440px">Fixed 1440px (Ultra-Wide Monitor)</option>
              <option value="1280px">Fixed 1280px (Standard Desktop)</option>
              <option value="90%">90% Width Centered</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: SYSTEM THEME MODES ──────────────────── */}
      <div className="space-y-3 pt-3 border-t border-gray-150">
        <label className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
          <Moon className="w-4 h-4 text-purple-600" /> Theme Display Mode (Light / Dark / Special Modes)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun, bg: 'bg-white border-gray-300 text-gray-900' },
            { id: 'dark', label: 'Dark Mode', icon: Moon, bg: 'bg-slate-900 border-slate-700 text-white' },
            { id: 'system', label: 'System Default', icon: Monitor, bg: 'bg-slate-100 border-slate-300 text-slate-800' },
            { id: 'high_contrast', label: 'High Contrast', icon: Eye, bg: 'bg-black border-yellow-400 text-white' },
            { id: 'midnight_cyberpunk', label: 'Midnight Neon', icon: Sparkles, bg: 'bg-slate-950 border-purple-500 text-purple-200' },
            { id: 'sepia_warm', label: 'Warm Sepia', icon: Eye, bg: 'bg-[#fbf0d9] border-[#e2d5b6] text-[#433422]' }
          ].map(m => {
            const Icon = m.icon;
            const isSelected = theme.themeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => updateTheme({ themeMode: m.id as any })}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-2 ${m.bg} ${
                  isSelected ? 'ring-2 ring-indigo-600 shadow-md scale-[1.02]' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-extrabold text-[11px]">{m.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 3: THEME PRIMARY COLOR PALETTE ──────────── */}
      <div className="space-y-3 pt-3 border-t border-gray-150">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
            <Palette className="w-4 h-4 text-emerald-600" /> Primary Color Palette
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold">Custom Hex:</span>
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
              title="Choose Custom Color"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-20 px-2 py-0.5 border border-gray-300 rounded font-mono text-[11px] uppercase font-bold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {COLOR_PRESETS.map(c => {
            const isSelected = theme.primaryColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                onClick={() => updateTheme({ primaryColor: c.hex })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                  isSelected ? 'border-gray-900 ring-2 ring-indigo-500 shadow-sm bg-indigo-50/50' : 'border-gray-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${c.bg} shadow-2xs`}></span>
                <span className="font-bold text-[10.5px] text-gray-800">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 4: CORNER RADIUS & CARD ELEVATION ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-150">
        <div className="space-y-2">
          <label className="font-extrabold text-gray-800 block text-xs">Border Corner Radius Style</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'square', label: 'Square (0px)' },
              { id: 'subtle', label: 'Subtle (6px)' },
              { id: 'rounded', label: 'Rounded (12px)' },
              { id: 'pill', label: 'Pill (24px)' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => updateTheme({ borderRadius: r.id as any })}
                className={`p-2 border rounded-lg text-center font-bold text-[10.5px] cursor-pointer transition ${
                  theme.borderRadius === r.id ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-extrabold text-gray-800 block text-xs">Card Elevation & Style</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'bordered', label: 'Bordered' },
              { id: 'shadowed', label: 'Soft Shadow' },
              { id: 'flat', label: 'Flat Clean' },
              { id: 'glass', label: 'Glassmorphism' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => updateTheme({ cardStyle: c.id as any })}
                className={`p-2 border rounded-lg text-center font-bold text-[10.5px] cursor-pointer transition ${
                  theme.cardStyle === c.id ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ACTION BUTTONS ─────────────────────────────────── */}
      <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={resetTheme}
          className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Default ERP Theme
        </button>

        <button
          onClick={handleSaveTheme}
          disabled={saving}
          className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-extrabold transition shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Preferences...' : 'Save Theme & Scaling Settings'}
        </button>
      </div>
    </div>
  );
}
