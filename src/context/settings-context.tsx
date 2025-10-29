'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SettingsContextType {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [currencySymbol, setCurrencySymbolState] = useState<string>('SAR');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSymbol = localStorage.getItem('currencySymbol');
      if (storedSymbol) {
        setCurrencySymbolState(storedSymbol);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  const setCurrencySymbol = (symbol: string) => {
    setCurrencySymbolState(symbol);
    try {
      localStorage.setItem('currencySymbol', symbol);
    } catch (error) {
       console.error("Could not access localStorage:", error);
    }
  };

  const value = {
    currencySymbol,
    setCurrencySymbol,
  };
  
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
