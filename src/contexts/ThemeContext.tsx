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
      const loadTheme = async () => {
        try {
          const result = await window.electronAPI.readThemeFile(currentTheme.file);
          if (result.success && result.content) {
            const styleId = 'theme-stylesheet';
            let style = document.getElementById(styleId) as HTMLStyleElement;

            if (!style) {
              style = document.createElement('style');
              style.id = styleId;
              document.head.appendChild(style);
            }

            // Scope theme CSS to .markdown-preview container
            // This ensures theme styles only apply to the preview area
            let scopedContent = result.content;
            
            // Replace selectors to scope them to .markdown-preview
            // Skip @-rules, :root, and keyframes
            scopedContent = scopedContent.replace(
              /^(?!@|:root)([^{]+)\{/gm,
              (match, selector) => {
                // Skip comments
                if (selector.trim().startsWith('/*')) {
                  return match;
                }
                
                // If selector already includes .markdown-preview, don't double-scope
                if (selector.includes('.markdown-preview')) {
                  return match;
                }
                
                // Split multiple selectors (e.g., ".md-fences, code, tt")
                const selectors = selector.split(',').map((s: string) => {
                  const trimmed = s.trim();
                  
                  // Handle child combinator (>) at the start of the selector
                  // e.g., "blockquote>h1" should become ".markdown-preview blockquote>h1"
                  // Split on spaces, >, +, ~ to find the first element
                  const firstElementMatch = trimmed.match(/^([^\s>+~]+)/);
                  if (firstElementMatch) {
                    const firstElement = firstElementMatch[1];
                    const rest = trimmed.substring(firstElement.length);
                    // Scope by adding .markdown-preview before the first element
                    return `.markdown-preview ${firstElement}${rest}`;
                  }
                  
                  // Fallback: just add .markdown-preview as descendant
                  return `.markdown-preview ${trimmed}`;
                }).join(',\n');
                
                return `${selectors} {`;
              }
            );

            style.textContent = scopedContent;
          } else {
            console.error('Failed to load theme:', result.error);
            // Remove theme stylesheet for default theme
            const style = document.getElementById('theme-stylesheet');
            if (style) {
              style.remove();
            }
          }
        } catch (error) {
          console.error('Error loading theme:', error);
          // Remove theme stylesheet for default theme
          const style = document.getElementById('theme-stylesheet');
          if (style) {
            style.remove();
          }
        }
      };

      loadTheme();
    } else {
      // Remove theme stylesheet for default theme
      const style = document.getElementById('theme-stylesheet');
      if (style) {
        style.remove();
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

    // Listen for theme file changes
    const handleThemeFileChange = () => {
      loadThemes();
    };

    window.electronAPI.onThemeFileAdded(handleThemeFileChange);
    window.electronAPI.onThemeFileChanged(handleThemeFileChange);
    window.electronAPI.onThemeFileDeleted(handleThemeFileChange);

    // Cleanup listeners on unmount
    return () => {
      // Note: Electron doesn't have removeListener for these, so they persist
      // In a real app, you might want to implement remove listeners
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};