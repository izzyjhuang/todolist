// RoutineScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Modal} from 'react-native';
import { usePriorities } from '../components/PrioritiesContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTodoModal from '../components/AddTodoModal';
import SettingsModal from '../components/SettingsModal';

const generateTimeBlocks = (interval = 15, dayStart = '6:00', dayEnd = '23:00') => {
    const blocks = [];
    let [startHour, startMinute] = dayStart.split(':').map(Number);
    let [endHour, endMinute] = dayEnd.split(':').map(Number);

    if (endHour === 0) endHour = 24;

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    let currentMinutes = startTotalMinutes;

    while (currentMinutes < endTotalMinutes) {
        const startHour = Math.floor(currentMinutes / 60);
        const startMinute = currentMinutes % 60;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

        currentMinutes += interval;

        let endHour = Math.floor(currentMinutes / 60);
        if (endHour === 24) endHour = 0;
        const endMinute = currentMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        const timeRange = `${startTime}-${endTime}`;

        blocks.push({ id: blocks.length.toString(), time: timeRange, title: '', description: '', priority: 'none' });
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

const RoutineScreen = () => {
  const { customPriorities, setCustomPriorities } = usePriorities();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isDayPaletteVisible, setIsDayPaletteVisible] = useState(false); // Toggle day palette visibility
  const [dayStart, setDayStart] = useState('6:00');
  const [dayEnd, setDayEnd] = useState('23:00');
  const [blocks, setBlocks] = useState(generateTimeBlocks());
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [entryBlock, setEntryBlock] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false); // Confirmation modal visibility
  const [timeInterval, setTimeInterval] = useState(15);

  const prevIntervalRef = useRef(timeInterval);
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  useEffect(() => {
    const loadRoutine = async () => {
      const storedBlocks = await AsyncStorage.getItem(`routine${selectedDay}`);
      if (storedBlocks) {
        setBlocks(JSON.parse(storedBlocks));
      } else {
        setBlocks(generateTimeBlocks(timeInterval, dayStart, dayEnd));
      }
    };
    loadRoutine();
  }, [selectedDay, timeInterval, dayStart, dayEnd]);

  useEffect(() => {
    const saveRoutine = async () => {
      await AsyncStorage.setItem(`routine${selectedDay}`, JSON.stringify(blocks));
    };
    saveRoutine();
  }, [blocks, selectedDay]);

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

const formatTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const handleSaveSettings = () => {
    updateTimeBlocks(timeInterval, dayStart, dayEnd);
    setSettingsVisible(false);
};

const toggleSelectMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedBlocks([]);
  };

  const handleBlockPressEntryMode = (block) => {
    setEntryBlock(block);
    setModalVisible(true);
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
    setModalVisible(false);
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
    }
  };

  const handleCancel = () => {
    setSelectedBlocks([]); // Clear any selected blocks
    setIsSelecting(false); // Exit select mode and return to entry mode
  };

  const getPriorityColor = (priority) => {
    return customPriorities[priority]?.color || 'transparent';
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setIsDayPaletteVisible(false);
  };

  const renderDaySelector = () => (
    <View style={styles.daySelectorContainer}>
      <View style={styles.selectorRow}>
        <Text style={styles.selectorText}>Routine for</Text>
        <TouchableOpacity onPress={() => setIsDayPaletteVisible(!isDayPaletteVisible)} style={styles.selectedDay}>
          <Text style={styles.selectedDayText}>{selectedDay}</Text>
        </TouchableOpacity>
      </View>
      {isDayPaletteVisible && (
        <View style={styles.dayPalette}>
          {dayOptions.map(day => (
            day !== selectedDay && (
              <TouchableOpacity key={day} onPress={() => handleDaySelect(day)} style={styles.dayOption}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            )
          ))}
        </View>
      )}
    </View>
  );

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
          {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
      ) : (
        <Text style={styles.emptyText}>Empty</Text>
      )}
    </TouchableOpacity>
  );

  const renderDayOptions = () => {
    return (
      <View style={styles.timeZonePalette}>
        {dayOptions.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.timeZoneOption,
              selectedDay === day ? styles.selectedDay : null,
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={styles.intervalText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/* <Text style={styles.header}>Routine for {selectedDay}</Text> */}
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Icon name="settings" size={30} color="#1E8AFF" />
        </TouchableOpacity>
        <Button title="Reset" onPress={confirmReset} />
        <Button title="↺" onPress={handleUndo} disabled={history.length === 0} />
        <Button title="↻" onPress={handleRestore} disabled={future.length === 0} />
        <Button title={isSelecting ? "Cancel Select" : "Select"} onPress={toggleSelectMode} />
      </View>

      {/* Day Selector */}
      {renderDaySelector()}

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
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedBlocks([]);
          setEntryBlock(null);
        }}
        onAddTodo={handleAddTodo}
        initialTitle={entryBlock?.title}
        initialDescription={entryBlock?.description}
        initialPriority={entryBlock?.priority}
        customPriorities={customPriorities}
      />
      {/* Reset Confirmation Modal */}
      <Modal visible={resetConfirmationVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.modalText}>This will reset the routine for {selectedDay}.</Text>
            <View style={styles.modalButtons}>
              <Button title="Confirm" onPress={handleReset} />
              <Button title="Cancel" onPress={cancelReset} color="red"/>
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
    marginBottom: 5,
    marginLeft: 15,
    marginRight: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  daySelectorContainer: {
    alignItems: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 5, // Adds spacing between "Routines for" and day selector
  },
  selectedDay: {
    backgroundColor: '#1E8AFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedDayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    // backgroundColor: '#f5f5f5',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dayOption: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 5,
  },
  dayText: {
    color: '#333',
    fontSize: 16,
  },
  block: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 60,
    borderRadius: 10,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
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
  timeZonePalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  timeZoneOption: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    margin: 5,
  },
  intervalText: {
    fontSize: 16,
    color: 'black',
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
  selectedBlock: {
    borderColor: '#00f',
    borderWidth: 2,
    borderRadius: 10, // Rounds edges of the selected block
  },
});

export default RoutineScreen;