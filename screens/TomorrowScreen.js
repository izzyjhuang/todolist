// TomorrowScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTodoModal from '../components/AddTodoModal';
import SettingsModal from '../components/SettingsModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import { usePriorities } from '../components/PrioritiesContext';
import eventEmitter from '../components/EventEmitter';

// Function to get tomorrow's date in the format "YYYY-MM-DD" for easier comparison
const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

// Function to get tomorrow's date in the format "Wed, Oct 23"
const getFormattedDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(tomorrow); // Outputs in the format: Wed, Oct 23
};

const generateTimeBlocks = (interval = 15, dayStart = '6:00', dayEnd = '23:00') => {
  const blocks = [];
  let [startHour, startMinute] = dayStart.split(':').map(Number);
  let [endHour, endMinute] = dayEnd.split(':').map(Number);

  if (endHour === 0) endHour = 24;

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const totalMinutes = endTotalMinutes - startTotalMinutes;
  const totalBlocks = Math.floor(totalMinutes / interval);
  let currentMinutes = startTotalMinutes;

  for (let i = 0; i < totalBlocks; i++) {
    const startHour = Math.floor(currentMinutes / 60);
    const startMinute = currentMinutes % 60;
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute
      .toString()
      .padStart(2, '0')}`;

    currentMinutes += interval;

    let endHour = Math.floor(currentMinutes / 60);
    if (endHour === 24) endHour = 0;
    const endMinute = currentMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute
      .toString()
      .padStart(2, '0')}`;

    const timeRange = `${startTime}-${endTime}`;

    blocks.push({ id: i.toString(), time: timeRange, title: '', description: '', priority: 'none' });
  }

  return blocks;
};

const TomorrowScreen = () => {
  const { customPriorities, setCustomPriorities } = usePriorities();
  const [dayStart, setDayStart] = useState('6:00');
  const [dayEnd, setDayEnd] = useState('23:00');
  const [blocks, setBlocks] = useState(generateTimeBlocks());
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);    const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [entryBlock, setEntryBlock] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [incompleteRemindersCount, setIncompleteRemindersCount] = useState(0);
  const [isRemindersVisible, setIsRemindersVisible] = useState(false); // Toggle for collapsible section
  const [timeInterval, setTimeInterval] = useState(15);
  const [editingReminder, setEditingReminder] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date());

  const renderReminderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity onPress={() => openEditModal(item)} style={styles.reminderItem}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)}>
          <Icon name={item.completed ? "check-circle" : "radio-button-unchecked"} size={24} color={item.completed ? "green" : "gray"} />
        </TouchableOpacity>
        <View style={styles.reminderTextContainer}>
          <Text style={[styles.reminderTitle, item.completed && styles.completedText]}>{item.title}</Text>
          {item.description ? (
            <Text style={[styles.reminderDescription, item.completed && styles.completedText]}>{item.description}</Text>
          ) : null}
        </View>
        {/* <Text style={[styles.reminderDate, item.completed && styles.completedText]}>
          {new Date(item.date).toLocaleDateString('en-US')}
        </Text> */}
      </TouchableOpacity>
    </Swipeable>
  );

  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteReminder(id)}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  // Load reminders for tomorrow from AsyncStorage
  useEffect(() => {
    const loadTomorrowReminders = async () => {
      const storedTodos = await AsyncStorage.getItem('todos');
      const tomorrowDate = getTomorrowDate();
      if (storedTodos) {
        const todos = JSON.parse(storedTodos);
        const tomorrowReminders = todos.filter(
          (todo) => new Date(todo.date).toISOString().split('T')[0] === tomorrowDate
        );
        setReminders(tomorrowReminders);
        setIncompleteRemindersCount(tomorrowReminders.filter(reminder => !reminder.completed).length);
      }
    };
  
    loadTomorrowReminders(); // Initial load
  
    const handleReminderUpdate = () => {
      loadTomorrowReminders(); // Reload reminders when an update occurs
    };
  
    eventEmitter.on('reminderUpdated', handleReminderUpdate);
  
    // Clean up the listener when the component is unmounted
    return () => {
      eventEmitter.off('reminderUpdated', handleReminderUpdate);
    };
  }, []);

  const toggleRemindersVisibility = () => {
    setIsRemindersVisible(!isRemindersVisible);
  };

  const saveReminders = async (updatedReminders) => {
    setReminders(updatedReminders);
    const storedTodos = await AsyncStorage.getItem('todos');
    if (storedTodos) {
      const todos = JSON.parse(storedTodos);
      const otherTodos = todos.filter(
        (todo) => new Date(todo.date).toISOString().split('T')[0] !== getTomorrowDate()
      );
      await AsyncStorage.setItem('todos', JSON.stringify([...otherTodos, ...updatedReminders]));
    }
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder.id);
    setNewTitle(reminder.title);
    setNewDescription(reminder.description || '');
    setNewDate(new Date(reminder.date));
    setEditModalVisible(true);
};

const handleSaveEdit = () => {
  const updatedReminders = reminders.map(reminder =>
    reminder.id === editingReminder
      ? { ...reminder, title: newTitle, description: newDescription, date: newDate }
      : reminder
  );
  
  saveReminders(updatedReminders); // Save updated reminders
  filterTomorrowReminders(updatedReminders); // Re-check dates for tomorrow's reminders
  
  setEditModalVisible(false);
  setEditingReminder(null);
  setNewTitle('');
  setNewDescription('');
  setNewDate(new Date());
};

const filterTomorrowReminders = (reminders) => {
  const tomorrowDate = getTomorrowDate(); // Get tomorrow's date in "YYYY-MM-DD" format
  const tomorrowReminders = reminders.filter(
    (reminder) => new Date(reminder.date).toISOString().split('T')[0] === tomorrowDate
  );
  setReminders(tomorrowReminders);
};

  const toggleComplete = async (id) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  
    // Update the count of incomplete reminders
    setIncompleteRemindersCount(updatedReminders.filter(reminder => !reminder.completed).length);
  
    eventEmitter.emit('reminderUpdated'); // Emit event for sync
  };

  const handleDeleteReminder = async (id) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    await saveReminders(updatedReminders); // Save the updated list after deletion
    
    eventEmitter.emit('reminderUpdated'); // Emit event for sync
  };


  

  
  useEffect(() => {
    const loadTomorrowTasks = async () => {
      const storedBlocks = await AsyncStorage.getItem('tomorrowTasks');
      if (storedBlocks) {
        setBlocks(JSON.parse(storedBlocks));
      }
    };
    loadTomorrowTasks();
  }, []);

  useEffect(() => {
    // Save blocks to AsyncStorage when updated
    const saveTomorrowTasks = async () => {
      await AsyncStorage.setItem('tomorrowTasks', JSON.stringify(blocks));
    };
    saveTomorrowTasks();
  }, [blocks]);

  const saveHistory = () => {
    setHistory([...history, blocks]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setFuture([blocks, ...future]);
      const previousState = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setBlocks(previousState);
    }
  };

  const handleRestore = () => {
    if (future.length > 0) {
      setHistory([...history, blocks]);
      const nextState = future[0];
      setFuture(future.slice(1));
      setBlocks(nextState);
    }
  };

  const updateTimeBlocks = (newInterval, newDayStart, newDayEnd) => {
    setBlocks(generateTimeBlocks(newInterval, newDayStart, newDayEnd));
    setDayStart(newDayStart);
    setDayEnd(newDayEnd);
  };

  const toggleSelectMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedBlocks([]);
  };

  const handleBlockPressEntryMode = (block) => {
    setEntryBlock(block);
    setAddTaskModalVisible(true);
};

  const handleBlockPressSelectMode = (block) => {
    if (selectedBlocks.length === 0) {
      setSelectedBlocks([block]);
    } else {
      const lastSelected = selectedBlocks[selectedBlocks.length - 1];
      const blockIndex = parseInt(block.id);
      const lastIndex = parseInt(lastSelected.id);

      if (blockIndex > lastIndex) {
        const newSelection = blocks.slice(lastIndex, blockIndex + 1);
        setSelectedBlocks(newSelection);
      } else {
        const newSelection = blocks.slice(blockIndex, lastIndex + 1);
        setSelectedBlocks(newSelection);
      }
    }
  };

  const handleSplit = () => {
    if (selectedBlocks.length === 1) {
      saveHistory();

      const block = selectedBlocks[0];
      const [startTime, endTime] = block.time.split('-');
      let [startHour, startMinute] = startTime.split(':').map(Number);
      let [endHour, endMinute] = endTime.split(':').map(Number);

      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      const totalMinutes = endTotalMinutes - startTotalMinutes;

      const numBlocks = totalMinutes / 5;

      const newBlocks = [];

      for (let i = 0; i < numBlocks; i++) {
        const newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute
          .toString()
          .padStart(2, '0')}`;
        startMinute += 5;
        if (startMinute === 60) {
          startMinute = 0;
          startHour += 1;
        }
        const newEndTime = `${startHour.toString().padStart(2, '0')}:${startMinute
          .toString()
          .padStart(2, '0')}`;

        newBlocks.push({
          id: `${block.id}-${i}`,
          time: `${newStartTime}-${newEndTime}`,
          title: '',
          description: '',
          priority: 'none',
        });
      }

      const updatedBlocks = [
        ...blocks.slice(0, parseInt(block.id)),
        ...newBlocks,
        ...blocks.slice(parseInt(block.id) + 1),
      ];

      const reassignedBlocks = updatedBlocks.map((block, index) => ({
        ...block,
        id: index.toString(),
      }));

      setBlocks(reassignedBlocks);
      setSelectedBlocks([]);
      setIsSelecting(false);
    }
  };

  const handleAddTodo = (newTask) => {
    saveHistory();

    const updatedBlocks = blocks.map((block) =>
      entryBlock && block.id === entryBlock.id
        ? { ...block, ...newTask }
        : block
    );
    setBlocks(updatedBlocks);
    setSelectedBlocks([]);
    setEntryBlock(null);
    setEditModalVisible(false);
  };

  const handleMerge = () => {
    if (selectedBlocks.length > 1) {
      saveHistory();
  
      const firstBlock = selectedBlocks[0];
      const lastBlock = selectedBlocks[selectedBlocks.length - 1];
  
      // Create a new time range for the first block, covering the full selected range
      const updatedTimeRange = `${firstBlock.time.split('-')[0]}-${lastBlock.time.split('-')[1]}`;
  
      // Update the first block with the new time range and other info
      const updatedFirstBlock = { ...firstBlock, time: updatedTimeRange };
  
      // Update the block list, keeping only the first block and removing the others
      const updatedBlocks = blocks
        .filter(block => !selectedBlocks.find(selected => selected.id === block.id) || block.id === firstBlock.id)
        .map(block => (block.id === firstBlock.id ? updatedFirstBlock : block));
  
      // Reassign unique IDs to all blocks based on their index in the updated array
      const reassignedBlocks = updatedBlocks.map((block, index) => ({ ...block, id: index.toString() }));
  
      setBlocks(reassignedBlocks);
      setSelectedBlocks([]); // Clear the selection after merge
      setIsSelecting(false); // Automatically return to entry mode
    }
  };

  const handleCancel = () => {
    setSelectedBlocks([]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'p1':
        return customPriorities.p1.color;
      case 'p2':
        return customPriorities.p2.color;
      case 'p3':
        return customPriorities.p3.color;
      case 'p4':
        return customPriorities.p4.color;
      default:
        return 'transparent';
    }
  };

  const renderBlock = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.block,
        { backgroundColor: getPriorityColor(item.priority) },
        selectedBlocks.find(block => block.id === item.id) ? styles.selectedBlock : null
      ]}
      onPress={() =>
        isSelecting ? handleBlockPressSelectMode(item) : handleBlockPressEntryMode(item)
      }
    >
      <Text style={styles.timeText}>{item.time}</Text>
      {item.title ? (
        <View>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptyText}>Empty</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Icon name="settings" size={30} color="#1E8AFF" />
        </TouchableOpacity>
        <Button title="↺" onPress={handleUndo} disabled={history.length === 0} />
        <Button title="↻" onPress={handleRestore} disabled={future.length === 0} />
        <Button title={isSelecting ? "Cancel Select" : "Select"} onPress={toggleSelectMode} />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{getFormattedDate()}</Text>
        <TouchableOpacity onPress={toggleRemindersVisibility}>
          <Text
            style={[
              styles.remindersButton,
              { fontWeight: incompleteRemindersCount > 0 ? 'bold' : 'normal',
                fontSize: 18,
                color: '#1E8AFF',
               } // Conditional font weight
            ]}
          >
            {isRemindersVisible ? `Hide Reminders` : `Reminders (${incompleteRemindersCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Reminder Section */}
      {isRemindersVisible && (
          <View style={styles.remindersContainer}>
            <FlatList
              data={reminders}
              keyExtractor={(item) => item.id}
              renderItem={renderReminderItem}
              ListEmptyComponent={<Text style={styles.noRemindersText}>There are no reminders for tomorrow</Text>} // Display message if empty
            />
          </View>
        )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Reminder</Text>
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
            <Button title="Save Changes" onPress={handleSaveEdit} />
            <Button title="Close" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        timeInterval={timeInterval}
        setTimeInterval={setTimeInterval}
        customPriorities={customPriorities}
        setCustomPriorities={setCustomPriorities}
        updateTimeBlocks={updateTimeBlocks}
        selectedDayStart={dayStart}
        selectedDayEnd={dayEnd}
        setSelectedDayStart={setDayStart}
        setSelectedDayEnd={setDayEnd}
      />

      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        renderItem={renderBlock}
      />

      {isSelecting && selectedBlocks.length > 1 && (
        <View style={styles.selectionOptions}>
          <Button title="Merge" onPress={handleMerge} />
          <Button title="Cancel" onPress={handleCancel} />
        </View>
      )}

      {isSelecting && selectedBlocks.length === 1 && (
        <View style={styles.selectionOptions}>
          <Button title="Split" onPress={handleSplit} />
          <Button title="Cancel" onPress={handleCancel} />
        </View>
      )}

      <AddTodoModal
        visible={addTaskModalVisible}
        onClose={() => {
          setAddTaskModalVisible(false);
          setSelectedBlocks([]);
          setEntryBlock(null);
        }}
        onAddTodo={handleAddTodo}
        initialTitle={entryBlock?.title}
        initialDescription={entryBlock?.description}
        initialPriority={entryBlock?.priority}
        customPriorities={customPriorities}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  block: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 60,
    borderRadius: 10, // Add this line to round the block's edges
  },
  selectedBlock: {
    borderColor: '#00f',
    borderWidth: 2,
    borderRadius: 10, // Add this line to round the edges of the selected block
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  description: {
    fontSize: 14,
    color: 'blue',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
  },
  selectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  remindersContainer: {
    // marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  remindersHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  reminderTextContainer: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 10,
  },
  reminderTitle: {
    fontSize: 16,
  },
  reminderDescription: {
    fontSize: 14,
    color: 'blue',
    marginTop: 2,
  },
  reminderDate: {
    fontSize: 14,
    color: '#666',
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
  completedText: {
    color: 'gray',
    textDecorationLine: 'line-through',
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
  noRemindersText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default TomorrowScreen;