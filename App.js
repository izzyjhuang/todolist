// App.js

import React, { useEffect, useState } from 'react';
import { PrioritiesProvider } from './components/PrioritiesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';

import TodayScreen from './screens/TodayScreen';
import TomorrowScreen from './screens/TomorrowScreen';
import SearchScreen from './screens/SearchScreen';
// import BrowseScreen from './screens/BrowseScreen';
import DateIcon from './components/DateIcon';
import RoutineScreen from './screens/RoutineScreen';
import AllTodosScreen from './screens/AllTodosScreen';




const Tab = createBottomTabNavigator();

export default function App() {
  const [taskUpdated, setTaskUpdated] = useState(false); // State variable to trigger rerender
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

  useEffect(() => {
    const moveTasksToToday = async () => {
      const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
      if (tomorrowTasks) {
        await AsyncStorage.setItem('todayTasks', tomorrowTasks); // Move tasks
        await AsyncStorage.removeItem('tomorrowTasks'); // Clear tomorrow's tasks
        setTaskUpdated((prev) => !prev); // Toggle to force rerender
      }
    };

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 44) {
        moveTasksToToday();
      }
    };

    const interval = setInterval(checkTime, 6000); // Check every 60 seconds
    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  useEffect(() => {
    const loadRoutineForTomorrow = async () => {
      // Get the next day
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1); // Move to the next day
      
      // Format the weekday name for the next day
      const weekday = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Load routine for the next day's name
      const routine = await AsyncStorage.getItem(`routine${weekday}`);
      if (routine) {
        await AsyncStorage.setItem('tomorrowTasks', routine);
        const interval = setInterval(checkTime, 6000); // Check every 60 seconds
      }
    };
  
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 45) {
        loadRoutineForTomorrow();
      }
    };
  
    const interval = setInterval(checkTime, 6000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

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
            <Tab.Screen name="Today" component={TodayScreen} />
            <Tab.Screen name="Tomorrow" component={TomorrowScreen} />
            <Tab.Screen name="Reminders" component={AllTodosScreen} />
            <Tab.Screen name="Routine" component={RoutineScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PrioritiesProvider>
    </GestureHandlerRootView>
  );
};
