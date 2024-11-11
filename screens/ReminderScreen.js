import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Modal, TextInput, TouchableOpacity, StyleSheet, Button, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import eventEmitter from '../components/EventEmitter';

const RemindersScreen = () => {
  const [todos, setTodos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date()); // Initialize with today's date
  const [editingIndex, setEditingIndex] = useState(null);
  const [showArchived, setShowArchived] = useState(false); // State for archived section visibility
  const [newUrgent, setNewUrgent] = useState(false);
  const [newImportant, setNewImportant] = useState(false);

  useEffect(() => {
    const loadTodos = async () => {
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        const seenIds = new Set();
        const parsedTodos = JSON.parse(storedTodos).map(todo => {
          const id = todo.id || uuidv4();
          // Ensure each ID is unique by checking the Set
          if (seenIds.has(id)) {
            return { ...todo, id: uuidv4() }; // Generate a new ID if duplicate
          } else {
            seenIds.add(id);
            return { ...todo, id };
          }
        });
        setTodos(parsedTodos.sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
    };
  
    loadTodos(); // Initial load
  
    // Listen for the reminderUpdated event to refresh the todos
    const handleReminderUpdate = () => {
      loadTodos(); // Reload todos from storage when an update occurs
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

  const handleAddOrEditTodo = () => {
    let updatedTodos;

    if (editingIndex !== null) {
        // Editing an existing todo
        updatedTodos = todos.map(todo =>
            todo.id === editingIndex
                ? { ...todo, title: newTitle, description: newDescription, date: newDate, urgent: newUrgent, important: newImportant }
                : todo
        );
        setEditingIndex(null); // Reset editing index after editing
    } else {
        // Adding a new todo
        const newTodo = { id: uuidv4(), title: newTitle, description: newDescription, date: newDate, completed: false, urgent: newUrgent, important: newImportant };
        updatedTodos = [...todos, newTodo];
    }

    saveTodos(updatedTodos); // Save the updated list of todos
    eventEmitter.emit('reminderUpdated'); // Emit an event for update
    setModalVisible(false); // Close the modal after adding or editing
    setNewTitle(''); // Reset the title input
    setNewDescription(''); // Reset the description input
    setNewDate(new Date()); // Reset the date input to today’s date
    setNewUrgent(false); // Reset Urgent flag
    setNewImportant(false); // Reset Important flag
  };
  
  const toggleComplete = async (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  
    await saveTodos(updatedTodos); // Save updated todos to AsyncStorage
    
    eventEmitter.emit('reminderUpdated'); // Emit event for sync with TodayScreen
  };

  const categorizeTodos = () => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 6);

    const sections = [
        { title: 'Archived ', data: [], collapsible: true }, // Add Archived section
        { title: 'Past Due', data: [] },
        { title: 'Today', data: [] },
        { title: 'Upcoming Week', data: [] },
        { title: 'Scheduled', data: [] },
    ];

    const setToMidnight = (date) => {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0); // Set time to midnight
        return newDate;
    };

    const today = setToMidnight(new Date());

    todos.forEach(todo => {
        const todoDate = setToMidnight(new Date(todo.date));

        if (todo.completed && todoDate < today) {
            sections[0].data.push(todo); // Add to Archived if completed and in the past
        } else if (todoDate < today) {
            sections[1].data.push(todo); // Past Due section
        } else if (todoDate.getTime() === today.getTime()) {
            sections[2].data.push(todo); // Today's tasks
        } else if (todoDate > today && todoDate <= endOfWeek) {
            sections[3].data.push(todo); // Upcoming Week section
        } else if (todoDate > endOfWeek) {
            sections[4].data.push(todo); // Scheduled section
        }
    });

    // Sort each section's data array with priorities:
    // Urgent first, then Important, then completed tasks at the bottom
    sections.forEach((section) => {
        section.data.sort((a, b) => {
            // If priorities are the same, completed tasks go to the bottom
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            
            // Prioritize Urgent tasks
            if (a.urgent && !b.urgent) return -1;
            if (!a.urgent && b.urgent) return 1;

            // If neither or both are Urgent, prioritize Important tasks
            if (a.important && !b.important) return -1;
            if (!a.important && b.important) return 1;

            // Otherwise, sort by date if tasks have the same priority and completion status
            return new Date(a.date) - new Date(b.date);
        });
    });

    return sections
        .filter(section => section.data.length > 0) // Only include non-empty sections
        .map(section => ({
            ...section,
            data: section.title === 'Archived ' && !showArchived ? [] : section.data, // Hide archived if toggled off
        }));
  };

  const toggleArchivedVisibility = () => {
    setShowArchived(!showArchived);
  };

  const renderSectionHeader = ({ section: { title, collapsible } }) => (
    <TouchableOpacity onPress={collapsible ? toggleArchivedVisibility : null} style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {collapsible && (
        <Icon
          name={showArchived ? "keyboard-arrow-up" : "keyboard-arrow-down"} // Use down arrow when collapsed, up arrow when expanded
          size={24}
          color="#1E8AFF"
          style={styles.collapseIcon} // Adjust styles to ensure close alignment
        />
      )}
    </TouchableOpacity>
  );

  const handleEditTodo = (id) => {
    const todo = todos.find(todo => todo.id === id); // Find the todo by id
    setNewTitle(todo.title); // Populate modal with the todo title
    setNewDescription(todo.description || ''); // Populate modal with the todo description
    setNewDate(new Date(todo.date)); // Populate modal with the todo date
    setNewUrgent(todo.urgent || false); // Set urgent flag
    setNewImportant(todo.important || false); // Set important flag
    setEditingIndex(id); // Set the id of the todo being edited
    setModalVisible(true); // Show the modal for editing
  };

  const handleDeleteTodo = async (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    await saveTodos(updatedTodos); // Save updated todos to AsyncStorage
    
    eventEmitter.emit('reminderUpdated'); // Emit event for sync with TodayScreen
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
                <View style={styles.titleWithTags}>
                    <Text style={[
                        styles.todoText,
                        item.completed && styles.completedText,
                        styles.titleText // Add a width constraint to prevent overflow
                    ]}>
                        {item.title}
                    </Text>
                    {item.urgent && <Text style={styles.urgentTag}>U</Text>}
                    {item.important && <Text style={styles.importantTag}>I</Text>}
                </View>
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
      </View>

      <SectionList
        sections={categorizeTodos()}
        renderItem={renderTodo}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={true}
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
                
                {/* Add switches for Urgent and Important flags */}
                <View style={styles.switchContainer}>
                    <Text>Urgent</Text>
                    <Switch
                        value={newUrgent}
                        onValueChange={setNewUrgent}
                    />
                </View>
                <View style={styles.switchContainer}>
                    <Text>Important</Text>
                    <Switch
                        value={newImportant}
                        onValueChange={setNewImportant}
                    />
                </View>

                <Button title={editingIndex !== null ? 'Save Changes' : 'Add'} onPress={handleAddOrEditTodo} />
                <Button title="Close" color="red" onPress={() => {
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
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E8AFF',
  },
  collapseIcon: {
    fontSize: 18,
    color: '#1E8AFF',
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
    borderRadius: 5,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  titleWithTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap', // Prevents tags from wrapping to a new line
  },
  titleText: {
    maxWidth: '70%', // Limits title width to prevent overlap
    flexShrink: 1, // Allows text to shrink within the available space
  },
  urgentTag: {
    backgroundColor: '#ffe5e5', // Light red background
    color: 'red', // Dark red text
    fontSize: 12,
    fontWeight: 'bold',
    height: 24,
    width: 24,
    textAlign: 'center',
    lineHeight: 18, // Center text vertically
    borderRadius: 8, // Fully rounded
    marginLeft: 6, // Space between title and tag
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Ensure the border radius applies correctly
  },
  importantTag: {
    backgroundColor: '#e5f0ff', // Light blue background
    color: 'blue', // Dark blue text
    fontSize: 12,
    fontWeight: 'bold',
    height: 24,
    width: 24,
    textAlign: 'center',
    lineHeight: 18, // Center text vertically
    borderRadius: 8, // Fully rounded
    marginLeft: 6, // Space between tags
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Ensure the border radius applies correctly
  },
});

export default RemindersScreen;
