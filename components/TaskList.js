// components/TaskList.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const TaskList = ({ tasks }) => {
  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.taskItem}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
          <Text style={styles.taskDate}>{item.date} {item.time}</Text>
          <Text style={styles.taskPriority}>Priority: {item.priority}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  taskItem: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderColor: '#eee',
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskDate: {
    fontSize: 12,
    color: '#888',
  },
  taskPriority: {
    fontSize: 12,
    color: '#444',
  },
});

export default TaskList;