// screens/TodayScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TaskList from '../components/TaskList';
import FloatingActionButton from '../components/FloatingActionButton';
import AddTodoModal from '../components/AddTodoModal';

const initialTasks = [
  { id: '1', title: 'Download Todoist', description: '', date: 'Oct 22', time: '10:00 AM', priority: 'Normal' },
];

const TodayScreen = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddTodo = (newTask) => {
    setTasks([...tasks, { id: Date.now().toString(), ...newTask }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today</Text>
      <TaskList tasks={tasks} />
      <FloatingActionButton onPress={() => setModalVisible(true)} />

      {/* Add Todo Modal */}
      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddTodo={handleAddTodo}
      />
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