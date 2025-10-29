'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// The context is now empty as currency is handled by the CurrencySymbol component.
// We can keep the provider structure in case we need to add other global settings later.
interface SettingsContextType {}

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
  const value = {}; // No values needed for now

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
