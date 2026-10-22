import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isLight: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isLight: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('gridx-theme') === 'light' || document.body.classList.contains('light-theme');
  });

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('gridx-theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('gridx-theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => setIsLight(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isLight, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
