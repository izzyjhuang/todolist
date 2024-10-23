// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TodayScreen from './screens/TodayScreen';
import UpcomingScreen from './screens/UpcomingScreen';
import SearchScreen from './screens/SearchScreen';
import BrowseScreen from './screens/BrowseScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Today') {
              iconName = 'calendar-outline';
            } else if (route.name === 'Upcoming') {
              iconName = 'calendar-sharp';
            } else if (route.name === 'Search') {
              iconName = 'search-outline';
            } else if (route.name === 'Browse') {
              iconName = 'list-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'red',
          inactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Upcoming" component={UpcomingScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Browse" component={BrowseScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}