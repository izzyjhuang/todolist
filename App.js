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
import AllTodosScreen from './screens/AllTodosScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [taskUpdated, setTaskUpdated] = useState(false);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const getWeekday = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  const getDayOfMonth = (date) => date.getDate();

  const todayWeekday = getWeekday(today);
  const tomorrowWeekday = getWeekday(tomorrow);
  const todayDate = getDayOfMonth(today);
  const tomorrowDate = getDayOfMonth(tomorrow);

  const moveTasksToToday = useCallback(async () => {
    const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
    if (tomorrowTasks) {
      await AsyncStorage.setItem('todayTasks', tomorrowTasks);
      await AsyncStorage.removeItem('tomorrowTasks');
      setTaskUpdated((prev) => !prev); // Toggle to force rerender
    }
  }, []);

  const loadRoutineForTomorrow = useCallback(async () => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const weekday = nextDay.toLocaleDateString('en-US', { weekday: 'long' });

    const routine = await AsyncStorage.getItem(`routine${weekday}`);
    if (routine) {
      await AsyncStorage.setItem('tomorrowTasks', routine);
      setTaskUpdated((prev) => !prev); // Toggle to force rerender
    }
  }, []);

  const checkTimeAndUpdate = useCallback(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 1) {
      moveTasksToToday();
    }
    if (now.getHours() === 0 && now.getMinutes() === 2) {
      loadRoutineForTomorrow();
    }
  }, [moveTasksToToday, loadRoutineForTomorrow]);

  useEffect(() => {
    const interval = setInterval(checkTimeAndUpdate, 60000); // Check every 60 seconds
    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, [checkTimeAndUpdate]);

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
              {(props) => <TodayScreen {...props} taskUpdated={taskUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Tomorrow">
              {(props) => <TomorrowScreen {...props} taskUpdated={taskUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Reminders" component={AllTodosScreen} />
            <Tab.Screen name="Routine" component={RoutineScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PrioritiesProvider>
    </GestureHandlerRootView>
  );
}