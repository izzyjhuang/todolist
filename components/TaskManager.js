// TaskManager.js
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTaskUpdate } from './TaskUpdateContext';

const TaskManager = () => {
  const { toggleTaskUpdate } = useTaskUpdate();

  useEffect(() => {
    const moveTasksToToday = async () => {
      const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
      if (tomorrowTasks) {
        await AsyncStorage.setItem('todayTasks', tomorrowTasks);
        await AsyncStorage.removeItem('tomorrowTasks');
        toggleTaskUpdate(); // Trigger update
      }
    };

    const loadRoutineForTomorrow = async () => {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      const weekday = nextDay.toLocaleDateString('en-US', { weekday: 'long' });

      const routine = await AsyncStorage.getItem(`routine${weekday}`);
      if (routine) {
        await AsyncStorage.setItem('tomorrowTasks', routine);
        toggleTaskUpdate(); // Trigger update
      }
    };

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 1) {
        moveTasksToToday();
      }
      if (now.getHours() === 0 && now.getMinutes() === 2) {
        loadRoutineForTomorrow();
      }
    };

    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [toggleTaskUpdate]);

  return null; // This component doesn't render anything visible
};

export default TaskManager;