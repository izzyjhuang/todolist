// TomorrowScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button } from 'react-native';
import { usePriorities } from '../components/PrioritiesContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTodoModal from '../components/AddTodoModal';
import SettingsModal from '../components/SettingsModal';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [entryBlock, setEntryBlock] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [timeInterval, setTimeInterval] = useState(15);
  // const [customPriorities, setCustomPriorities] = useState({
  //   p1: { label: 'p1', color: '#D6B4FC' },
  //   p2: { label: 'p2', color: '#FF8184' },
  //   p3: { label: 'p3', color: '#FDAA48' },
  //   p4: { label: 'p4', color: '#FFFFC5' }
  // });

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
    setModalVisible(true);
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
    setModalVisible(false);
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
      <Text style={styles.header}>{getFormattedDate()}</Text>

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
});

export default TomorrowScreen;