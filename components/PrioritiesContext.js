import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Context
const PrioritiesContext = createContext();

export const PrioritiesProvider = ({ children }) => {
  const [customPriorities, setCustomPriorities] = useState({
    p1: { label: 'p1', color: '#D6B4FC' },
    p2: { label: 'p2', color: '#FF8184' },
    p3: { label: 'p3', color: '#FDAA48' },
    p4: { label: 'p4', color: '#FFFFC5' },
  });

  // Load custom priorities from AsyncStorage
  useEffect(() => {
    const loadPriorities = async () => {
      const savedPriorities = await AsyncStorage.getItem('customPriorities');
      if (savedPriorities) {
        setCustomPriorities(JSON.parse(savedPriorities));
      }
    };
    loadPriorities();
  }, []);

  // Save custom priorities to AsyncStorage when they change
  useEffect(() => {
    const savePriorities = async () => {
      await AsyncStorage.setItem('customPriorities', JSON.stringify(customPriorities));
    };
    savePriorities();
  }, [customPriorities]);

  return (
    <PrioritiesContext.Provider value={{ customPriorities, setCustomPriorities }}>
      {children}
    </PrioritiesContext.Provider>
  );
};

// Custom hook to use the context
export const usePriorities = () => useContext(PrioritiesContext);
