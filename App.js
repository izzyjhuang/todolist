// App.js

import React, { useEffect } from 'react';
import { PrioritiesProvider } from './components/PrioritiesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';


import TodayScreen from './screens/TodayScreen';
import TomorrowScreen from './screens/TomorrowScreen';
import SearchScreen from './screens/SearchScreen';
// import BrowseScreen from './screens/BrowseScreen';
import DateIcon from './components/DateIcon';
import RoutineScreen from './screens/RoutineScreen';



const Tab = createBottomTabNavigator();

export default function App() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const getWeekday = (date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  };

  const getDayOfMonth = (date) => {
    return date.getDate();
  };

  const todayWeekday = getWeekday(today);
  const tomorrowWeekday = getWeekday(tomorrow);
  const todayDate = getDayOfMonth(today);
  const tomorrowDate = getDayOfMonth(tomorrow);

  // Schedule task move from TomorrowScreen to TodayScreen at 3 AM
  useEffect(() => {
    const moveTasksToToday = async () => {
      const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
      if (tomorrowTasks) {
        await AsyncStorage.setItem('todayTasks', tomorrowTasks); // Move tasks
        await AsyncStorage.removeItem('tomorrowTasks'); // Clear tomorrow's tasks
      }
    };

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        moveTasksToToday();
      }
    };

    // Check every minute if it's 3 AM
    const interval = setInterval(checkTime, 60000); // Check every 60 seconds

    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  useEffect(() => {
    const loadRoutineForTomorrow = async () => {
      const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const routine = await AsyncStorage.getItem(`routine${weekday}`);
      if (routine) {
        await AsyncStorage.setItem('tomorrowTasks', routine);
      }
    };

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 2) {
        loadRoutineForTomorrow();
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  return (
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
              if (route.name === 'Search') {
                iconName = 'search';
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
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Tomorrow" component={TomorrowScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Routine" component={RoutineScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    </PrioritiesProvider>
  );
}
