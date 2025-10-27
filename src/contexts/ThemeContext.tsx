import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  name: string;
  file: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([{ name: 'None', file: '' }]);
  const [currentTheme, setCurrentTheme] = useState<Theme>({ name: 'None', file: '' });

  useEffect(() => {
    // Load bridge CSS (always loaded to support theme features)
    const bridgeLinkId = 'theme-bridge-stylesheet';
    let bridgeLink = document.getElementById(bridgeLinkId) as HTMLLinkElement;

    if (!bridgeLink) {
      bridgeLink = document.createElement('link');
      bridgeLink.id = bridgeLinkId;
      bridgeLink.rel = 'stylesheet';
      bridgeLink.href = '/themes/theme-bridge.css';
      document.head.appendChild(bridgeLink);
    }

    // Load theme CSS dynamically
    if (currentTheme.file) {
      const linkId = 'theme-stylesheet';
      let link = document.getElementById(linkId) as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      link.href = `/themes/${currentTheme.file}`;
    } else {
      // Remove theme stylesheet for default theme
      const link = document.getElementById('theme-stylesheet');
      if (link) {
        link.remove();
      }
    }
  }, [currentTheme]);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    // Store in localStorage
    localStorage.setItem('selectedTheme', theme.name);
  };

  // Load available themes and saved theme on mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const result = await window.electronAPI.listThemes();
        if (result.success && result.themes.length > 0) {
          // Add "None" theme at the beginning
          const allThemes = [{ name: 'None', file: '' }, ...result.themes];
          setAvailableThemes(allThemes);

          // Load saved theme preference
          const savedThemeName = localStorage.getItem('selectedTheme');
          if (savedThemeName) {
            const savedTheme = allThemes.find(t => t.name === savedThemeName);
            if (savedTheme) {
              setCurrentTheme(savedTheme);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load themes:', error);
        // Keep default "None" theme if loading fails
      }
    };

    loadThemes();
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};