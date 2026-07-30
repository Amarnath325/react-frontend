import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'high_contrast' | 'midnight_cyberpunk' | 'sepia_warm';
export type PageDensity = 'ultra_compact' | 'compact' | 'comfortable' | 'spacious' | 'custom';
export type BorderRadius = 'square' | 'subtle' | 'rounded' | 'pill';
export type CardStyle = 'bordered' | 'shadowed' | 'flat' | 'glass';

export interface ThemeConfig {
  themeMode: ThemeMode;
  primaryColor: string;
  pageDensity: PageDensity;
  fontSizeScale: number; // 10 to 18 (default 12)
  containerWidth: string; // 'full' | '1440px' | '1280px' | '90%'
  tablePadding: number; // 2 to 12 (default 6)
  borderRadius: BorderRadius;
  cardStyle: CardStyle;
}

const DEFAULT_THEME: ThemeConfig = {
  themeMode: 'light',
  primaryColor: '#4f46e5', // Indigo 600
  pageDensity: 'compact',
  fontSizeScale: 12,
  containerWidth: 'full',
  tablePadding: 6,
  borderRadius: 'rounded',
  cardStyle: 'bordered',
};

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (newConfig: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'school_erp_theme_config';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_THEME, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse theme from localStorage:', e);
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  const updateTheme = (newConfig: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...newConfig }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Apply dynamic root variables & DOM attributes
function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement;

  // 1. Theme Mode Data Attribute & Dark class
  root.setAttribute('data-theme-mode', theme.themeMode);
  
  const isDarkTheme = ['dark', 'high_contrast', 'midnight_cyberpunk'].includes(theme.themeMode) ||
    (theme.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkTheme) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Font Size & Page Density Scaling
  let effectiveFontSize = theme.fontSizeScale;
  let effectiveTablePadding = theme.tablePadding;

  if (theme.pageDensity === 'ultra_compact') {
    effectiveFontSize = 11;
    effectiveTablePadding = 3;
  } else if (theme.pageDensity === 'compact') {
    effectiveFontSize = 12;
    effectiveTablePadding = 6;
  } else if (theme.pageDensity === 'comfortable') {
    effectiveFontSize = 14;
    effectiveTablePadding = 10;
  } else if (theme.pageDensity === 'spacious') {
    effectiveFontSize = 16;
    effectiveTablePadding = 14;
  }

  root.style.setProperty('--base-font-size', `${effectiveFontSize}px`);
  root.style.setProperty('--table-cell-padding', `${effectiveTablePadding}px`);
  root.style.fontSize = `${effectiveFontSize}px`;

  // 3. Primary Color Override
  root.style.setProperty('--primary-accent-color', theme.primaryColor);

  // 4. Container Max Width
  let maxWidthCss = '100%';
  if (theme.containerWidth === '1440px') maxWidthCss = '1440px';
  else if (theme.containerWidth === '1280px') maxWidthCss = '1280px';
  else if (theme.containerWidth === '90%') maxWidthCss = '90%';

  root.style.setProperty('--page-container-width', maxWidthCss);

  // 5. Border Radius
  let radiusCss = '12px';
  if (theme.borderRadius === 'square') radiusCss = '0px';
  else if (theme.borderRadius === 'subtle') radiusCss = '6px';
  else if (theme.borderRadius === 'rounded') radiusCss = '12px';
  else if (theme.borderRadius === 'pill') radiusCss = '24px';

  root.style.setProperty('--theme-border-radius', radiusCss);
}
