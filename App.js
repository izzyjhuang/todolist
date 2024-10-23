import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TodayScreen from './screens/TodayScreen';
import TomorrowScreen from './screens/TomorrowScreen';
import SearchScreen from './screens/SearchScreen';
import BrowseScreen from './screens/BrowseScreen';
import DateIcon from './components/DateIcon';  // Import custom DateIcon component

const Tab = createBottomTabNavigator();

export default function App() {
  // Get today's date and tomorrow's date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Function to get the short weekday name
  const getWeekday = (date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);  // e.g., "Mon", "Tue"
  };

  // Function to get the day of the month (1-31)
  const getDayOfMonth = (date) => {
    return date.getDate();
  };

  // Prepare the data for Today and Tomorrow
  const todayWeekday = getWeekday(today);      // e.g., "Wed" for today
  const tomorrowWeekday = getWeekday(tomorrow); // e.g., "Thu" for tomorrow

  const todayDate = getDayOfMonth(today);      // e.g., 23 for today
  const tomorrowDate = getDayOfMonth(tomorrow); // e.g., 24 for tomorrow

  return (
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
                iconName = 'search-outline';
              } else if (route.name === 'Browse') {
                iconName = 'list-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: 'red',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Tomorrow" component={TomorrowScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Browse" component={BrowseScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}