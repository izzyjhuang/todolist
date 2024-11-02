// App.js

import React, { useEffect, useState, useCallback } from 'react';
import { PrioritiesProvider } from './components/PrioritiesContext';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TodayScreen from './screens/TodayScreen';
import TomorrowScreen from './screens/TomorrowScreen';
import DateIcon from './components/DateIcon';
import RoutineScreen from './screens/RoutineScreen';
import RemindersScreen from './screens/ReminderScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [todayTaskUpdated, setTodayTaskUpdated] = useState(false);
  const [tomorrowTaskUpdated, setTomorrowTaskUpdated] = useState(false);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const getWeekday = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const getDayOfMonth = (date) => date.getDate();

  const todayWeekday = getWeekday(today);
  const tomorrowWeekday = getWeekday(tomorrow);
  const todayDate = getDayOfMonth(today);
  const tomorrowDate = getDayOfMonth(tomorrow);

  // Function to move tasks from 'tomorrowTasks' to 'todayTasks'
  const moveTasksToToday = useCallback(async () => {
    const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
    if (tomorrowTasks) {
      await AsyncStorage.setItem('todayTasks', tomorrowTasks); // Move tasks to today
      await AsyncStorage.removeItem('tomorrowTasks');          // Clear tomorrow's tasks
      setTodayTaskUpdated((prev) => !prev);                    // Update after moving completes
    }
  }, []);

  // Function to load routine into 'tomorrowTasks'
  const loadRoutineForTomorrow = useCallback(async () => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const weekday = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
  
    const routine = await AsyncStorage.getItem(`routine${weekday}`);
    if (routine) {
      await AsyncStorage.setItem('tomorrowTasks', routine);    // Load routine for tomorrow
      setTomorrowTaskUpdated((prev) => !prev);                 // Only trigger TomorrowScreen update
    }
  }, []);  

  // Run `moveTasksToToday` at a specific time
useEffect(() => {
  const checkMoveTasks = () => {
    const now = new Date();
    if (now.getHours() === 7 && now.getMinutes() === 7) {
      moveTasksToToday();
    }
  };

  const moveInterval = setInterval(checkMoveTasks, 2000); // Check every minute
  return () => clearInterval(moveInterval); // Cleanup on unmount
}, [moveTasksToToday]);

// Run `loadRoutineForTomorrow` at a specific time
useEffect(() => {
  const checkLoadRoutine = () => {
    const now = new Date();
    if (now.getHours() === 7 && now.getMinutes() === 8) {
      loadRoutineForTomorrow();
    }
  };

  const routineInterval = setInterval(checkLoadRoutine, 2000); // Check every minute
  return () => clearInterval(routineInterval); // Cleanup on unmount
}, [loadRoutineForTomorrow]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <PrioritiesProvider>
        <NavigationContainer>
        <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                if (route.name === 'Today') {
                  return <DateIcon weekday={todayWeekday} date={todayDate} />;
                } else if (route.name === 'Tomorrow') {
                  return <DateIcon weekday={tomorrowWeekday} date={tomorrowDate} />;
                } else {
                  let iconName;
                  if (route.name === 'Reminders') {
                    iconName = 'notifications';
                  } else if (route.name === 'Routine') {
                    iconName = 'schedule';
                  }
                  return <MaterialIcons name={iconName} size={size} color={color} />;
                }
              },
              tabBarActiveTintColor: 'red',
              tabBarInactiveTintColor: 'gray',
            })}
          >
            <Tab.Screen name="Today">
              {(props) => <TodayScreen {...props} todayTaskUpdated={todayTaskUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Tomorrow">
              {(props) => <TomorrowScreen {...props} tomorrowTaskUpdated={tomorrowTaskUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Reminders" component={RemindersScreen} />
            <Tab.Screen name="Routine" component={RoutineScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PrioritiesProvider>
    </GestureHandlerRootView>
  );
}
