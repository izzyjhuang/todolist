// screens/TodayScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TaskList from '../components/TaskList';
import FloatingActionButton from '../components/FloatingActionButton';

const tasks = [
  { id: '1', text: 'Download Todoist on all devices' },
  { id: '2', text: 'Take the productivity quiz' },
  { id: '3', text: 'Browse the Todoist Inspiration Hub' },
];

const TodayScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today</Text>
      <TaskList tasks={tasks} />
      <FloatingActionButton onPress={() => alert('Add Task')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default TodayScreen;