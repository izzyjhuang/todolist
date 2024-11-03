// TomorrowScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Modal, TextInput, Switch} from 'react-native';
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(tomorrow); // Outputs in the format: Wed, Oct 23
};

const generateTimeBlocks = (interval = 15, dayStart = '6:00', dayEnd = '23:00') => {
  const blocks = [];
  let [startHour, startMinute] = dayStart.split(':').map(Number);
  let [endHour, endMinute] = dayEnd.split(':').map(Number);

  // Adjust for midnight as an end time
  if (endHour === 0) endHour = 24;

  // Calculate total minutes for start and end times
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Loop from start to end in intervals to create time blocks
  for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += interval) {
    const blockStartHour = Math.floor(currentMinutes / 60);
    const blockStartMinute = currentMinutes % 60;
    const startTime = `${blockStartHour.toString().padStart(2, '0')}:${blockStartMinute.toString().padStart(2, '0')}`;

    const endMinutes = currentMinutes + interval;
    const blockEndHour = Math.floor(endMinutes / 60);
    const blockEndMinute = endMinutes % 60;
    const endTime = `${blockEndHour.toString().padStart(2, '0')}:${blockEndMinute.toString().padStart(2, '0')}`;

    blocks.push({
      id: blocks.length.toString(),
      time: `${startTime}-${endTime}`,
      title: '',
      description: '',
      priority: 'none'
    });
  }

  return blocks;
};

const sortAndUpdateBlockIds = (blocks) => {
  blocks.sort((a, b) => {
    const [aStartHour, aStartMinute] = a.time.split('-')[0].split(':').map(Number);
    const [bStartHour, bStartMinute] = b.time.split('-')[0].split(':').map(Number);
    return (aStartHour * 60 + aStartMinute) - (bStartHour * 60 + bStartMinute);
  });

  return blocks.map((block, index) => ({
    ...block,
    id: index.toString(),
  }));
};

const TomorrowScreen = ({ tomorrowTaskUpdated }) => {
  const { customPriorities, setCustomPriorities } = usePriorities();
  const [dayStart, setDayStart] = useState('6:00');
  const [dayEnd, setDayEnd] = useState('23:00');
  const [blocks, setBlocks] = useState(generateTimeBlocks());
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);    
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [entryBlock, setEntryBlock] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [incompleteRemindersCount, setIncompleteRemindersCount] = useState(0);
  const [isRemindersVisible, setIsRemindersVisible] = useState(false); // Toggle for collapsible section
  const [timeInterval, setTimeInterval] = useState(15);
  const prevIntervalRef = useRef(timeInterval);

  const [editingReminder, setEditingReminder] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false); // Confirmation modal visibility
  const [newUrgent, setNewUrgent] = useState(false);
  const [newImportant, setNewImportant] = useState(false);

  const loadRoutineForTomorrow = useCallback(async () => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const weekday = nextDay.toLocaleDateString('en-US', { weekday: 'long' });

    const routine = await AsyncStorage.getItem(`routine${weekday}`);
    if (routine) {
      await AsyncStorage.setItem('tomorrowTasks', routine);
    }
  }, []);

  useEffect(() => {
    const loadTomorrowTasks = async () => {
      const storedBlocks = await AsyncStorage.getItem('tomorrowTasks');
      if (storedBlocks) {
        setBlocks(JSON.parse(storedBlocks));
      }
    };
  
    loadTomorrowTasks();
  }, [tomorrowTaskUpdated]);
  
  const adjustTimeBlocks = (newDayStart, newDayEnd) => {
    const [startHour, startMinute] = newDayStart.split(':').map(Number);
    const [endHour, endMinute] = newDayEnd.split(':').map(Number);
  
    const newStartTotalMinutes = startHour * 60 + startMinute;
    const newEndTotalMinutes = (endHour === 0 ? 24 * 60 : endHour * 60) + endMinute;
  
    let updatedBlocks = [...blocks];
  
    // Add blocks at the beginning if newDayStart is earlier than the current start
    if (newStartTotalMinutes < getTimeInMinutes(updatedBlocks[0].time.split('-')[0])) {
      let currentMinutes = newStartTotalMinutes;
      const newBlocks = [];
      while (currentMinutes < getTimeInMinutes(updatedBlocks[0].time.split('-')[0])) {
        const startTime = formatTime(currentMinutes);
        currentMinutes += timeInterval;
        const endTime = formatTime(currentMinutes);
  
        newBlocks.push({
          id: '', // Temporary ID
          time: `${startTime}-${endTime}`,
          title: '',
          description: '',
          priority: 'none',
        });
      }
      updatedBlocks = [...newBlocks, ...updatedBlocks];
    }
  
    // Remove blocks at the beginning if newDayStart is later than the current start
    if (newStartTotalMinutes > getTimeInMinutes(updatedBlocks[0].time.split('-')[0])) {
      updatedBlocks = updatedBlocks.filter((block) => {
        const blockStartMinutes = getTimeInMinutes(block.time.split('-')[0]);
        return blockStartMinutes >= newStartTotalMinutes;
      });
    }
  
    // Add blocks at the end if newDayEnd is later than the current end
    if (newEndTotalMinutes > getTimeInMinutes(updatedBlocks[updatedBlocks.length - 1].time.split('-')[1])) {
      let currentMinutes = getTimeInMinutes(updatedBlocks[updatedBlocks.length - 1].time.split('-')[1]);
      const newBlocks = [];
      while (currentMinutes < newEndTotalMinutes) {
        const startTime = formatTime(currentMinutes);
        currentMinutes += timeInterval;
        const endTime = formatTime(currentMinutes);
  
        newBlocks.push({
          id: '', // Temporary ID
          time: `${startTime}-${endTime}`,
          title: '',
          description: '',
          priority: 'none',
        });
      }
      updatedBlocks = [...updatedBlocks, ...newBlocks];
    }
  
    // Remove blocks at the end if newDayEnd is earlier than the current end
    if (newEndTotalMinutes < getTimeInMinutes(updatedBlocks[updatedBlocks.length - 1].time.split('-')[1])) {
      updatedBlocks = updatedBlocks.filter((block) => {
        const blockEndMinutes = getTimeInMinutes(block.time.split('-')[1]);
        return blockEndMinutes <= newEndTotalMinutes;
      });
    }
  
    // Reassign IDs to all blocks based on their final order
    updatedBlocks = sortAndUpdateBlockIds(updatedBlocks);
  
    setBlocks(updatedBlocks);
    setDayStart(newDayStart);
    setDayEnd(newDayEnd);
  };

  const formatTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const renderReminderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity onPress={() => openEditModal(item)} style={styles.reminderItem}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)}>
          <Icon name={item.completed ? "check-circle" : "radio-button-unchecked"} size={24} color={item.completed ? "green" : "gray"} />
        </TouchableOpacity>
        <View style={styles.reminderTextContainer}>
          <View style={styles.titleWithTags}>
            <Text style={[styles.reminderTitle, item.completed && styles.completedText, styles.titleText]}>
              {item.title}
            </Text>
            {item.urgent && <Text style={styles.urgentTag}>U</Text>}
            {item.important && <Text style={styles.importantTag}>I</Text>}
          </View>
          {item.description ? (
            <Text style={[styles.reminderDescription, item.completed && styles.completedText]}>{item.description}</Text>
          ) : null}
        </View>
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
    const setToMidnight = (date) => {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0); // Normalize to midnight
      return newDate;
    };
  
    const getTomorrowMidnight = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // Move to next day
      return setToMidnight(tomorrow); // Normalize to midnight
    };
  
    const loadTomorrowReminders = async () => {
      const storedTodos = await AsyncStorage.getItem('todos');
      const tomorrowDate = getTomorrowMidnight(); // Get tomorrow's date normalized to midnight
  
      let tomorrowReminders = [];
  
      if (storedTodos) {
        const todos = JSON.parse(storedTodos);
        tomorrowReminders = todos.filter(
          (todo) => setToMidnight(new Date(todo.date)).getTime() === tomorrowDate.getTime() // Compare dates without time
        );
      }
  
      // Sort by urgency, importance, completion, and date
      tomorrowReminders.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return new Date(a.date) - new Date(b.date);
      });
  
      setReminders(tomorrowReminders); // Set reminders to only tomorrow's reminders
      setIncompleteRemindersCount(tomorrowReminders.filter(reminder => !reminder.completed).length);
    };
  
    // Initial load of tomorrow's reminders
    loadTomorrowReminders();
  
    const handleReminderUpdate = () => {
      loadTomorrowReminders(); // Reload reminders when an update occurs
    };
    eventEmitter.on('reminderUpdated', handleReminderUpdate);
  
    // Set interval to refresh reminders every minute, checking if it's a new day
    const intervalId = setInterval(() => {
      const now = new Date();
      const isNewDay = now.getHours() === 0 && now.getMinutes() === 0;
      if (isNewDay) {
        loadTomorrowReminders(); // Load reminders for the new "tomorrow"
      }
    }, 60000);
  
    // Clean up interval and event listener when component unmounts
    return () => {
      eventEmitter.off('reminderUpdated', handleReminderUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const toggleRemindersVisibility = () => {
    setIsRemindersVisible(!isRemindersVisible);
  };

  const saveReminders = async (updatedReminders) => {
    setReminders(updatedReminders);
    
    // Retrieve all todos from storage
    const storedTodos = await AsyncStorage.getItem('todos');
    
    if (storedTodos) {
      const todos = JSON.parse(storedTodos);
      const otherTodos = todos.filter(
        (todo) => new Date(todo.date).toISOString().split('T')[0] !== getTomorrowDate()
      );
      
      // Update AsyncStorage with tomorrow’s updated reminders and other todos
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

const handleSaveEdit = async () => {
  const updatedReminders = reminders.map(reminder =>
    reminder.id === editingReminder
      ? { ...reminder, title: newTitle, description: newDescription, date: newDate }
      : reminder
  );

  // Save updated reminders to AsyncStorage
  await saveReminders(updatedReminders); 
  
  // Filter to show only tomorrow’s reminders
  filterTomorrowReminders(updatedReminders); 
  
  // Emit an event to notify RemindersScreen of the update
  eventEmitter.emit('reminderUpdated');
  
  // Close the edit modal and reset state
  setEditModalVisible(false);
  setEditingReminder(null);
  setNewTitle('');
  setNewDescription('');
  setNewDate(new Date());
  setNewUrgent(false);
  setNewImportant(false);
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
  
  const loadTomorrowTasks = useCallback(async () => {
    const storedBlocks = await AsyncStorage.getItem('tomorrowTasks');
    if (storedBlocks) {
      setBlocks(JSON.parse(storedBlocks));
    }
  }, []);

  useEffect(() => {
    loadTomorrowTasks(); // Load tasks initially and whenever taskUpdated changes
  }, [tomorrowTaskUpdated, loadTomorrowTasks]);

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
  const getTimeInMinutes = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };

  const updateTimeBlocks = (newInterval, newDayStart, newDayEnd) => {
    if (newInterval !== prevIntervalRef.current) {
        const newBlocks = generateTimeBlocks(newInterval, dayStart, dayEnd);
        setBlocks(newBlocks);
        setTimeInterval(newInterval);
        prevIntervalRef.current = newInterval;
    } else {
        adjustTimeBlocks(newDayStart, newDayEnd);
    }
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
  const blockIndex = parseInt(block.id);

  if (selectedBlocks.length === 0) {
    // Start a new selection if no blocks are selected
    setSelectedBlocks([block]);
  } else {
    const firstSelectedIndex = parseInt(selectedBlocks[0].id);
    const lastSelectedIndex = parseInt(selectedBlocks[selectedBlocks.length - 1].id);

    if (blockIndex > lastSelectedIndex) {
      // If the new block is after the last selected, extend the selection forward
      const newSelection = blocks.slice(firstSelectedIndex, blockIndex + 1);
      setSelectedBlocks(newSelection);
    } else if (blockIndex < firstSelectedIndex) {
      // If the new block is before the first selected, extend the selection backward
      const newSelection = blocks.slice(blockIndex, lastSelectedIndex + 1);
      setSelectedBlocks(newSelection);
    } else {
      // If the block is within the current selection, reduce the selection up to the clicked block
      const newSelection = selectedBlocks.filter(b => parseInt(b.id) <= blockIndex);
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

    let numBlocks;
    let splitInterval;

    // Determine split interval and number of blocks
    if (totalMinutes === timeInterval) {
      splitInterval = 5; // Split 15-minute blocks into 5-minute intervals
      numBlocks = timeInterval / 5;
    } else if (totalMinutes % timeInterval === 0) {
      splitInterval = timeInterval; // Split into blocks of the interval size
      numBlocks = totalMinutes / timeInterval;
    } else {
      splitInterval = 5; // For other cases, default to 5-minute splits
      numBlocks = Math.floor(totalMinutes / splitInterval);
    }

    const newBlocks = [];

    for (let i = 0; i < numBlocks; i++) {
      const newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute
        .toString()
        .padStart(2, '0')}`;

      startMinute += splitInterval;
      if (startMinute >= 60) {
        startMinute -= 60;
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

  const handleReset = () => {
    saveHistory(); // Save the current state before resetting
    const clearedBlocks = blocks.map(block => ({ ...block, title: '', description: '', priority: 'none' }));
    setBlocks(clearedBlocks);
    setResetConfirmationVisible(false); // Close the confirmation modal after reset
  };
  
  const confirmReset = () => {
    setResetConfirmationVisible(true);
  };
  
  const cancelReset = () => {
    setResetConfirmationVisible(false);
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
    setSelectedBlocks([]); // Clear any selected blocks
    setIsSelecting(false); // Exit select mode and return to entry mode
  };

  const getPriorityColor = (priority) => {
    return customPriorities[priority]?.color || 'transparent';
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
        <Button title="Reset" onPress={confirmReset} />
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
            <Switch value={newUrgent} onValueChange={setNewUrgent} />
            <Switch value={newImportant} onValueChange={setNewImportant} />

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
          <Button title="Cancel" onPress={handleCancel} color="red"/>
        </View>
      )}

      {isSelecting && selectedBlocks.length === 1 && (
        <View style={styles.selectionOptions}>
          <Button title="Split" onPress={handleSplit} />
          <Button title="Cancel" onPress={handleCancel} color="red"/>
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
      <Modal visible={resetConfirmationVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.modalText}>This will reset the routine for tomorrow.</Text>
            <View style={styles.modalButtons}>
              <Button title="Confirm" onPress={handleReset} />
              <Button title="Cancel" onPress={cancelReset} color="red" />
            </View>
          </View>
        </View>
      </Modal>
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
    maxHeight: 300,
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
    borderRadius: 5,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationModal: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
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
    lineHeight: 24, // Center text vertically
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
    lineHeight: 24, // Center text vertically
    borderRadius: 8, // Fully rounded
    marginLeft: 6, // Space between tags
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Ensure the border radius applies correctly
  },
});

export default TomorrowScreen;