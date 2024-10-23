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
          <Text style={styles.taskText}>{item.text}</Text>
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
  taskText: {
    fontSize: 16,
  },
});

export default TaskList;