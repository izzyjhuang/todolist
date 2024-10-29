import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Modal, TextInput, TouchableOpacity, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import eventEmitter from '../components/EventEmitter';

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
      let parsedTodos = JSON.parse(storedTodos);
      parsedTodos = parsedTodos.map(todo => ({
        ...todo,
        id: todo.id || uuidv4() // Assign a UUID if it doesn't already have one
      }));
      const sortedTodos = parsedTodos.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTodos(sortedTodos);
    }
  };

  loadTodos();

  // Listen for updates to refresh the reminders
  const handleReminderUpdate = () => {
    loadTodos();
  };

  eventEmitter.on('reminderUpdated', handleReminderUpdate);

  return () => {
    eventEmitter.off('reminderUpdated', handleReminderUpdate);
  };
}, []);

  const saveTodos = async (updatedTodos) => {
    const sortedTodos = updatedTodos.sort((a, b) => new Date(a.date) - new Date(b.date));
    setTodos(sortedTodos);
    await AsyncStorage.setItem('todos', JSON.stringify(sortedTodos));
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
    saveHistory(); // Save the current state for undo functionality
    let updatedTodos;
  
    if (editingIndex !== null) {
      // Editing an existing todo
      updatedTodos = todos.map(todo =>
        todo.id === editingIndex
          ? { ...todo, title: newTitle, description: newDescription, date: newDate }
          : todo
      );
      setEditingIndex(null); // Reset editing index after editing
    } else {
      // Adding a new todo
      const newTodo = { id: uuidv4(), title: newTitle, description: newDescription, date: newDate, completed: false };
      updatedTodos = [...todos, newTodo];
    }
  
    saveTodos(updatedTodos); // Save the updated list of todos
    eventEmitter.emit('reminderUpdated'); // Emit an event for update
    setModalVisible(false); // Close the modal after adding or editing
    setNewTitle(''); // Reset the title input
    setNewDescription(''); // Reset the description input
    setNewDate(new Date()); // Reset the date input to today’s date
  };
  
  const toggleComplete = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    eventEmitter.emit('reminderUpdated'); // Emit an event for update
    saveTodos(updatedTodos); // Save the updated list with the updated completion status
  };
  const categorizeTodos = () => {
    const now = new Date();
    const todayDate = now.toDateString();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    const sections = [
      { title: 'Past Due', data: [] },
      { title: 'Today', data: [] },
      { title: 'This Week', data: [] },
      { title: 'Scheduled', data: [] },
    ];

    todos.forEach(todo => {
      const todoDate = new Date(todo.date);
      if (todoDate < now && todoDate.toDateString() !== todayDate) {
        sections[0].data.push(todo);
      } else if (todoDate.toDateString() === todayDate) {
        sections[1].data.push(todo);
      } else if (todoDate > now && todoDate <= endOfWeek) {
        sections[2].data.push(todo);
      } else if (todoDate > endOfWeek) {
        sections[3].data.push(todo);
      }
    });

    return sections.filter(section => section.data.length > 0);
  };

  const handleEditTodo = (id) => {
    saveHistory(); // Save the current state for undo functionality
    const todo = todos.find(todo => todo.id === id); // Find the todo by id
    setNewTitle(todo.title); // Populate modal with the todo title
    setNewDescription(todo.description || ''); // Populate modal with the todo description
    setNewDate(new Date(todo.date)); // Populate modal with the todo date
    setEditingIndex(id); // Set the id of the todo being edited
    setModalVisible(true); // Show the modal for editing
  };

  const handleDeleteTodo = (id) => {
    saveHistory(); // Save the current state for undo functionality
    const updatedTodos = todos.filter(todo => todo.id !== id); // Filter out the todo with the specified id
    saveTodos(updatedTodos); // Save the updated list of todos
    eventEmitter.emit('reminderUpdated'); // Emit an event for update
  };

  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTodo(id)}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderTodo = ({ item, index }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity onPress={() => handleEditTodo(item.id)} style={styles.todoItem}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)}>
            <Icon name={item.completed ? "check-circle" : "radio-button-unchecked"} size={24} color={item.completed ? "green" : "gray"} />
        </TouchableOpacity>
        <View style={styles.todoTextContainer}>
            <Text style={[styles.todoText, item.completed && styles.completedText]}>{item.title}</Text>
            {item.description ? (
            <Text style={[styles.descriptionText, item.completed && styles.completedText]}>{item.description}</Text>
            ) : null}
        </View>
        <Text style={[styles.dateText, item.completed && styles.completedText]}>{new Date(item.date).toLocaleDateString('en-US')}</Text>
        </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Reminders</Text>
        <View style={styles.buttonContainer}>
          <Button title="↺" onPress={handleUndo} disabled={history.length === 0} />
          <Button title="↻" onPress={handleRedo} disabled={future.length === 0} />
        </View>
      </View>

      <SectionList
        sections={categorizeTodos()}
        renderItem={renderTodo}
        renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item) => item.id} // Use id as the key
        contentContainerStyle={styles.listContainer}
        />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

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
            <View style={styles.datePickerContainer}>
                <DateTimePicker
                value={newDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => setNewDate(selectedDate || new Date())}
                style={styles.datePicker}
                />
            </View>
            <Button title={editingIndex !== null ? 'Save Changes' : 'Add'} onPress={handleAddOrEditTodo} />
            <Button title="Close" onPress={() => {
            setNewTitle('');         // Clear title field
            setNewDescription('');    // Clear description field
            setNewDate(new Date());   // Reset date to today
            setEditingIndex(null);    // Ensure we're in add mode
            setModalVisible(false);   // Close the modal
            }} />
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
    marginLeft: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: 'blue',
    marginTop: 2,
  },
  todoText: {
    fontSize: 16,
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
    width: '40%',
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
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E8AFF',
    marginVertical: 10,
  },
  completedText: {
    color: 'gray',
    textDecorationLine: 'line-through',
  },
});

export default AllTodosScreen;
