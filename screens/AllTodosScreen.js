import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Modal, TextInput, TouchableOpacity, StyleSheet, Button } from 'react-native';
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
        const parsedTodos = JSON.parse(storedTodos);
        const sortedTodos = parsedTodos.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTodos(sortedTodos);
      }
    };
    loadTodos();
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
    saveHistory();
    const updatedTodos = [...todos];

    if (editingIndex !== null) {
      updatedTodos[editingIndex] = { ...updatedTodos[editingIndex], title: newTitle, description: newDescription, date: newDate };
      setEditingIndex(null);
    } else {
      const newTodo = { title: newTitle, description: newDescription, date: newDate, completed: false };
      updatedTodos.push(newTodo);
    }

    saveTodos(updatedTodos);
    setModalVisible(false);
    setNewTitle('');
    setNewDescription('');
    setNewDate(new Date());
  };

  const toggleComplete = (index) => {
    const updatedTodos = [...todos];
    updatedTodos[index].completed = !updatedTodos[index].completed;
    saveTodos(updatedTodos);
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

  const handleEditTodo = (index) => {
    const todo = todos[index];
    setNewTitle(todo.title);
    setNewDescription(todo.description);
    setNewDate(new Date(todo.date));
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
        <TouchableOpacity onPress={() => toggleComplete(index)}>
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
        <Text style={styles.headerText}>Todos</Text>
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
        keyExtractor={(item, index) => index.toString()}
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
