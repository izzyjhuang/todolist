// TodayScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Modal, TextInput } from 'react-native';
import { usePriorities } from '../components/PrioritiesContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTodoModal from '../components/AddTodoModal';
import SettingsModal from '../components/SettingsModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import eventEmitter from '../components/EventEmitter';

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Function to check if current time is within a block's time range
const isCurrentTimeInRange = (blockTime, currentTime) => {
  const [start, end] = blockTime.split('-');
  return currentTime >= start && currentTime <= end;
};

// Function to calculate the fraction of time passed within a block
const calculateTimeFraction = (blockTime, currentTime) => {
  const [start, end] = blockTime.split('-');
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const totalBlockMinutes = endTotalMinutes - startTotalMinutes;
  const passedMinutes = currentTotalMinutes - startTotalMinutes;

  if (passedMinutes < 0 || passedMinutes > totalBlockMinutes) {
    return null;  // Out of block range
  }

  return passedMinutes / totalBlockMinutes;  // Fraction of time passed
};

// Function to get tomorrow's date in the format "Wed, Oct 23"
const getFormattedDate = () => {
    const today = new Date();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(today); // Outputs in the format: Wed, Oct 23
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

const TodayScreen = ({ todayTaskUpdated }) => {
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
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [currentTimeFraction, setCurrentTimeFraction] = useState(null);  // Track time fraction
  const [reminders, setReminders] = useState([]);
  const [incompleteRemindersCount, setIncompleteRemindersCount] = useState(0);
  const [isRemindersVisible, setIsRemindersVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date());

  const [timeInterval, setTimeInterval] = useState(15);
  const prevIntervalRef = useRef(timeInterval);
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false); // Confirmation modal visibility

  const moveTasksToToday = useCallback(async () => {
    const tomorrowTasks = await AsyncStorage.getItem('tomorrowTasks');
    if (tomorrowTasks) {
      await AsyncStorage.setItem('todayTasks', tomorrowTasks);
      await AsyncStorage.removeItem('tomorrowTasks');
    }
  }, []);

  useEffect(() => {
  const loadTodayTasks = async () => {
    const storedBlocks = await AsyncStorage.getItem('todayTasks');
    if (storedBlocks) {
      setBlocks(JSON.parse(storedBlocks));
    }
  };

  loadTodayTasks();
}, [todayTaskUpdated]);

  const adjustTimeBlocks = (newDayStart, newDayEnd) => {
    const [startHour, startMinute] = newDayStart.split(':').map(Number);
    const [endHour, endMinute] = newDayEnd.split(':').map(Number);
  
    const newStartTotalMinutes = startHour * 60 + startMinute;
    const newEndTotalMinutes = (endHour === 0 ? 24 : endHour) * 60 + endMinute;
  
    const currentStartTotalMinutes = parseInt(blocks[0].time.split('-')[0].split(':')[0]) * 60 
                                      + parseInt(blocks[0].time.split('-')[0].split(':')[1]);
    const currentEndTotalMinutes = parseInt(blocks[blocks.length - 1].time.split('-')[1].split(':')[0]) * 60 
                                      + parseInt(blocks[blocks.length - 1].time.split('-')[1].split(':')[1]);
  
    let updatedBlocks = [...blocks];

    // Add blocks at the beginning if newDayStart is earlier than the current start
    if (newStartTotalMinutes < currentStartTotalMinutes) {
      let currentMinutes = newStartTotalMinutes;
      while (currentMinutes < currentStartTotalMinutes) {
        const startHour = Math.floor(currentMinutes / 60);
        const startMinute = currentMinutes % 60;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
  
        currentMinutes += timeInterval;
        const endHour = Math.floor(currentMinutes / 60);
        const endMinute = currentMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
        updatedBlocks.unshift({ id: `${Date.now()}-${currentMinutes}`, time: `${startTime}-${endTime}`, title: '', description: '', priority: 'none' });
      }
    }
  
    // Remove blocks at the beginning if newDayStart is later than the current start
    if (newStartTotalMinutes > currentStartTotalMinutes) {
      updatedBlocks = updatedBlocks.filter((block) => {
        const blockStartMinutes = parseInt(block.time.split('-')[0].split(':')[0]) * 60 + parseInt(block.time.split('-')[0].split(':')[1]);
        return blockStartMinutes >= newStartTotalMinutes;
      });
    }
  
    // Add blocks at the end if newDayEnd is later than the current end
    if (newEndTotalMinutes > currentEndTotalMinutes) {
      let currentMinutes = currentEndTotalMinutes;
      while (currentMinutes < newEndTotalMinutes) {
        const startHour = Math.floor(currentMinutes / 60);
        const startMinute = currentMinutes % 60;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
  
        currentMinutes += timeInterval;
        let endHour = Math.floor(currentMinutes / 60);
        if (endHour === 24) endHour = 0;
        const endMinute = currentMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
        updatedBlocks.push({ id: `${Date.now()}-${currentMinutes}`, time: `${startTime}-${endTime}`, title: '', description: '', priority: 'none' });
      }
    }
  
    // Remove blocks at the end if newDayEnd is earlier than the current end
    if (newEndTotalMinutes < currentEndTotalMinutes) {
      updatedBlocks = updatedBlocks.filter((block) => {
        const blockEndMinutes = parseInt(block.time.split('-')[1].split(':')[0]) * 60 + parseInt(block.time.split('-')[1].split(':')[1]);
        return blockEndMinutes <= newEndTotalMinutes;
      });
    }
  
    // Sort blocks by start time to ensure correct chronological order
    updatedBlocks.sort((a, b) => {
      const [aStartHour, aStartMinute] = a.time.split('-')[0].split(':').map(Number);
      const [bStartHour, bStartMinute] = b.time.split('-')[0].split(':').map(Number);
      return (aStartHour * 60 + aStartMinute) - (bStartHour * 60 + bStartMinute);
    });
  
    setBlocks(updatedBlocks);
    setDayStart(newDayStart);
    setDayEnd(newDayEnd);
  };

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

  // Load reminders for today from AsyncStorage
  useEffect(() => {
    const setToMidnight = (date) => {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0); // Normalize to midnight
      return newDate;
    };
  
    const loadTodayReminders = async () => {
      const storedTodos = await AsyncStorage.getItem('todos');
      const todayDate = setToMidnight(new Date()); // Normalize today's date to midnight
  
      let todayReminders = [];
  
      if (storedTodos) {
        const todos = JSON.parse(storedTodos);
        todayReminders = todos.filter(
          (todo) => setToMidnight(new Date(todo.date)).getTime() === todayDate.getTime() // Compare dates without time
        );
      }
  
      setReminders(todayReminders); // Set reminders to only today's reminders
      setIncompleteRemindersCount(todayReminders.filter(reminder => !reminder.completed).length);
    };
  
    loadTodayReminders(); // Initial load of today's reminders
  
    // Refresh reminders every minute
    const intervalId = setInterval(() => {
      loadTodayReminders();
    }, 60000);
  
    // Set up event listener to update reminders when new ones are added
    const handleReminderUpdate = () => {
      loadTodayReminders(); // Reload reminders when an update occurs
    };
    eventEmitter.on('reminderUpdated', handleReminderUpdate);
  
    // Clean up interval and event listener on component unmount
    return () => {
      clearInterval(intervalId);
      eventEmitter.off('reminderUpdated', handleReminderUpdate);
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
        (todo) => new Date(todo.date).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]
      );
      
      // Update AsyncStorage with today’s updated reminders and other todos
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
  
  // Filter to show only today’s reminders
  filterTodayReminders(updatedReminders); 
  
  // Emit an event to notify RemindersScreen of the update
  eventEmitter.emit('reminderUpdated');
  
  // Close the edit modal and reset state
  setEditModalVisible(false);
  setEditingReminder(null);
  setNewTitle('');
  setNewDescription('');
  setNewDate(new Date());
};
  
  // Helper function to filter and set only today's reminders
  const filterTodayReminders = (reminders) => {
    const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in "YYYY-MM-DD" format
    const todayReminders = reminders.filter(
      (reminder) => new Date(reminder.date).toISOString().split('T')[0] === todayDate
    );
    setReminders(todayReminders);
  };

  const toggleComplete = async (id) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
  
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    setIncompleteRemindersCount(updatedReminders.filter(reminder => !reminder.completed).length);
  
    eventEmitter.emit('reminderUpdated'); // Emit event for sync
  };
  

  const handleDeleteReminder = async (id) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    await saveReminders(updatedReminders);
    setIncompleteRemindersCount(updatedReminders.filter(reminder => !reminder.completed).length);
  
    eventEmitter.emit('reminderUpdated'); // Emit event for sync
  };

  // Function to locate the current block based on the time
  const locateCurrentBlock = () => {
    const currentTime = getCurrentTime();
    const currentBlock = blocks.find(block => isCurrentTimeInRange(block.time, currentTime));
    if (currentBlock) {
      setCurrentBlockId(currentBlock.id);
      const timeFraction = calculateTimeFraction(currentBlock.time, currentTime);
      setCurrentTimeFraction(timeFraction);  // Set the time fraction for red line position
    } else {
      setCurrentBlockId(null);
      setCurrentTimeFraction(null);  // Clear highlight if no block is found
    }
  };

  // Recalculate the current block every minute
  useEffect(() => {
    locateCurrentBlock();  // Run it when the screen first loads
    const intervalId = setInterval(() => {
      locateCurrentBlock();  // Update every minute
    }, 60000);  // 60000ms = 1 minute
    return () => clearInterval(intervalId);  // Cleanup interval on unmount
  }, [blocks]);  // Re-run when blocks are updated (split/merge)

  const loadTodayTasks = useCallback(async () => {
    const storedBlocks = await AsyncStorage.getItem('todayTasks');
    if (storedBlocks) {
      setBlocks(JSON.parse(storedBlocks));
    }
  }, []);

  useEffect(() => {
    loadTodayTasks(); // Load tasks on initial render and when taskUpdated changes
  }, [todayTaskUpdated, loadTodayTasks]);

  useEffect(() => {
    // Save blocks to AsyncStorage when updated
    const saveTodayTasks = async () => {
      await AsyncStorage.setItem('todayTasks', JSON.stringify(blocks));
    };
    saveTodayTasks();
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
      const updatedTimeRange = `${firstBlock.time.split('-')[0]}-${lastBlock.time.split('-')[1]}`;
      const updatedFirstBlock = { ...firstBlock, time: updatedTimeRange };
  
      const updatedBlocks = blocks
        .filter(block => !selectedBlocks.find(selected => selected.id === block.id) || block.id === firstBlock.id)
        .map(block => (block.id === firstBlock.id ? updatedFirstBlock : block));
  
      const reassignedBlocks = updatedBlocks.map((block, index) => ({ ...block, id: index.toString() }));
      setBlocks(reassignedBlocks);
      setSelectedBlocks([]);
      setIsSelecting(false);
  
      locateCurrentBlock();  // Recalculate current block after merge
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
    <View style={styles.blockContainer}>
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
      
      {/* Red line for current block */}
      {currentBlockId === item.id && currentTimeFraction !== null && (
        <View style={[styles.redLine, { top: `${currentTimeFraction * 100}%` }]} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Icon name="settings" size={30} color="#1E8AFF" />
        </TouchableOpacity>
        <Button title="Reset" onPress={confirmReset}/>
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
              ListEmptyComponent={<Text style={styles.noRemindersText}>There are no reminders for today</Text>} // Display message if empty
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
            <Button title="Close" onPress={() => setEditModalVisible(false)} color="red"/>
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
  blockContainer: {
    position: 'relative',  // Allow absolute positioning of the red line
  },
  block: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 60,
    borderRadius: 10,
  },
  selectedBlock: {
    borderColor: '#00f',
    borderWidth: 2,
    borderRadius: 10,
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
  redLine: {
    position: 'absolute',  // The red line is positioned absolutely inside the block
    height: 2,             // Set a thin height for the red line
    backgroundColor: 'red',
    width: '100%',         // Stretch the red line to the full width of the block
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
});

export default TodayScreen;