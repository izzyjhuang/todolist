import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, TextInput, TouchableOpacity, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';

const AllTodosScreen = () => {
  const [todos, setTodos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date()); // Initialize with today's date
  const [editingIndex, setEditingIndex] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  useEffect(() => {
    const loadTodos = async () => {
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    };
    loadTodos();
  }, []);

  const saveTodos = async (updatedTodos) => {
    setTodos(updatedTodos);
    await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  const saveHistory = () => {
    setHistory([...history, todos]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setFuture([todos, ...future]);
      const previousState = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setTodos(previousState);
    }
  };

  const handleRedo = () => {
    if (future.length > 0) {
      setHistory([...history, todos]);
      const nextState = future[0];
      setFuture(future.slice(1));
      setTodos(nextState);
    }
  };

  const handleAddOrEditTodo = () => {
    saveHistory();
    const formattedDate = newDate.toLocaleDateString('en-US');
    const updatedTodos = [...todos];

    if (editingIndex !== null) {
      // Update an existing todo
      updatedTodos[editingIndex] = { title: newTitle, description: newDescription, date: formattedDate };
      setEditingIndex(null);
    } else {
      // Add a new todo
      const newTodo = { title: newTitle, description: newDescription, date: formattedDate };
      updatedTodos.push(newTodo);
    }

    saveTodos(updatedTodos);
    setModalVisible(false);
    setNewTitle('');
    setNewDescription('');
    setNewDate(new Date()); // Reset to today's date after adding/editing
  };

  const handleEditTodo = (index) => {
    const todo = todos[index];
    setNewTitle(todo.title);
    setNewDescription(todo.description);
    
    // Parse date string to Date object; fallback to today's date if parsing fails
    const parsedDate = new Date(todo.date);
    setNewDate(isNaN(parsedDate) ? new Date() : parsedDate);
    
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleDeleteTodo = (index) => {
    saveHistory();
    const updatedTodos = todos.filter((_, i) => i !== index);
    saveTodos(updatedTodos);
  };

  const renderRightActions = (index) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTodo(index)}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderTodo = ({ item, index }) => (
    <Swipeable renderRightActions={() => renderRightActions(index)}>
      <TouchableOpacity onPress={() => handleEditTodo(index)} style={styles.todoItem}>
        <View style={styles.todoTextContainer}>
          <Text style={styles.todoText}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.descriptionText}>{item.description}</Text>
          ) : null}
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date(); // Fallback to today's date if selectedDate is undefined
    setNewDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Today</Text>
        <View style={styles.buttonContainer}>
          <Button title="↺" onPress={handleUndo} disabled={history.length === 0} />
          <Button title="↻" onPress={handleRedo} disabled={future.length === 0} />
        </View>
      </View>
      <Text style={styles.subHeaderText}>{new Date().toDateString()}</Text>
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add TODO Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add/Edit TODO Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingIndex !== null ? 'Edit Reminder' : 'Add Reminder'}</Text>
            <TextInput
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description (Optional)"
              value={newDescription}
              onChangeText={setNewDescription}
              style={styles.input}
            />

            {/* Inline Date Picker as Input */}
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={newDate} // Ensure newDate is always a valid Date object
                mode="date"
                display="default"
                onChange={handleDateChange}
                style={styles.datePicker}
              />
            </View>

            <Button title={editingIndex !== null ? 'Save Changes' : 'Add'} onPress={handleAddOrEditTodo} />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  subHeaderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 100,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  todoTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  descriptionText: {
    fontSize: 14,
    color: 'blue',
    marginTop: 2,
  },
  todoText: {
    fontSize: 16,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: 'red',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'left',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  datePicker: {
    width: '100%',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AllTodosScreen;
