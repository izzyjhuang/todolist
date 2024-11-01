import React, { createContext, useState, useContext } from 'react';

// Create the Context
const PrioritiesContext = createContext();

// Create a Provider component
export const PrioritiesProvider = ({ children }) => {
  const [customPriorities, setCustomPriorities] = useState({
    p1: { label: 'p1', color: '#D6B4FC' },
    p2: { label: 'p2', color: '#FF8184' },
    p3: { label: 'p3', color: '#FDAA48' },
    p4: { label: 'p4', color: '#FFFFC5' },
  });

  return (
    <PrioritiesContext.Provider value={{ customPriorities, setCustomPriorities }}>
      {children}
    </PrioritiesContext.Provider>
  );
};

// Custom hook to use the context
export const usePriorities = () => useContext(PrioritiesContext);