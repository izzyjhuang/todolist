// TaskUpdateContext.js
import React, { createContext, useState, useContext } from 'react';

const TaskUpdateContext = createContext();

export const TaskUpdateProvider = ({ children }) => {
  const [taskUpdated, setTaskUpdated] = useState(false);

  const toggleTaskUpdate = () => setTaskUpdated((prev) => !prev);

  return (
    <TaskUpdateContext.Provider value={{ taskUpdated, toggleTaskUpdate }}>
      {children}
    </TaskUpdateContext.Provider>
  );
};

export const useTaskUpdate = () => useContext(TaskUpdateContext);