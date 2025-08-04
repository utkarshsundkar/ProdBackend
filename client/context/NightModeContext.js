import React, { createContext, useContext, useState } from 'react';

const NightModeContext = createContext();

export const useNightMode = () => {
  const context = useContext(NightModeContext);
  if (!context) {
    throw new Error('useNightMode must be used within a NightModeProvider');
  }
  return context;
};

export const NightModeProvider = ({ children }) => {
  const [isNightMode, setIsNightMode] = useState(false);

  const value = {
    isNightMode,
    setIsNightMode,
  };

  return (
    <NightModeContext.Provider value={value}>
      {children}
    </NightModeContext.Provider>
  );
}; 