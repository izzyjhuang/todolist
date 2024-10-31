// PrioritisContext.js
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

  // Function to load priorities from AsyncStorage
  const loadPriorities = async () => {
    try {
      const savedPriorities = await AsyncStorage.getItem('customPriorities');
      if (savedPriorities) {
        setCustomPriorities(JSON.parse(savedPriorities));
      }
    } catch (error) {
      console.error('Error loading priorities:', error);
    }
  };

  // Function to save priorities to AsyncStorage
  const savePriorities = async (priorities) => {
    try {
      await AsyncStorage.setItem('customPriorities', JSON.stringify(priorities));
    } catch (error) {
      console.error('Error saving priorities:', error);
    }
  };

  // Load priorities on component mount
  useEffect(() => {
    loadPriorities();
  }, []);

  // Save priorities whenever they change
  useEffect(() => {
    savePriorities(customPriorities);
  }, [customPriorities]);

  return (
    <PrioritiesContext.Provider value={{ customPriorities, setCustomPriorities }}>
      {children}
    </PrioritiesContext.Provider>
  );
};

// Custom hook to use the context
export const usePriorities = () => useContext(PrioritiesContext);
