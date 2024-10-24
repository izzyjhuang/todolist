// screens/UpcomingScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TaskList from '../components/TaskList';
import FloatingActionButton from '../components/FloatingActionButton';

const tasks = [
  { id: '1', text: 'Upcoming task 1' },
  { id: '2', text: 'Upcoming task 2' },
];

const UpcomingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcoming</Text>
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

export default UpcomingScreen;