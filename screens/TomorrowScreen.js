// TomorrowScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddTodoModal from '../components/AddTodoModal';
import SettingsModal from '../components/SettingsModal';
import RedBar from '../components/RedBar';

const generateTimeBlocks = (interval = 15, dayStart = '6:00', dayEnd = '23:00') => {
    const blocks = [];
    let [startHour, startMinute] = dayStart.split(':').map(Number);
    let [endHour, endMinute] = dayEnd.split(':').map(Number);

    if (endHour === 0) endHour = 24;
  
    // Calculate total minutes for the day start and day end
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
    const [dayStart, setDayStart] = useState('6:00'); // Default start time
    const [dayEnd, setDayEnd] = useState('23:00'); // Default end time
    const [blocks, setBlocks] = useState(generateTimeBlocks());
    const [selectedBlocks, setSelectedBlocks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false); // Settings modal visibility
    const [isSelecting, setIsSelecting] = useState(false); // Selection mode toggle
    const [entryBlock, setEntryBlock] = useState(null); // Block selected in entry mode
    const [history, setHistory] = useState([]); // To store previous states for undo
    const [future, setFuture] = useState([]); // To store future states for restore
  
    // Settings state
    const [timeInterval, setTimeInterval] = useState(15); // Default interval 15 mins
    const [customPriorities, setCustomPriorities] = useState({
      p1: { label: 'p1', color: '#D6B4FC' },
      p2: { label: 'p2', color: '#FF8184' },
      p3: { label: 'p3', color: '#FDAA48' },
      p4: { label: 'p4', color: '#FFFFC5' }
    });
  
    // Save current state to history before making changes
    const saveHistory = () => {
      setHistory([...history, blocks]);
      setFuture([]); // Clear the future stack once a new action is performed
    };
  
    // Undo operation (revert to the last state in history)
    const handleUndo = () => {
      if (history.length > 0) {
        setFuture([blocks, ...future]); // Save current state in future stack
        const previousState = history[history.length - 1];
        setHistory(history.slice(0, -1)); // Remove the last state from history
        setBlocks(previousState); // Restore the last state
      }
    };
  
    // Restore operation (restore the future state if any undo was performed)
    const handleRestore = () => {
      if (future.length > 0) {
        setHistory([...history, blocks]); // Save current state to history
        const nextState = future[0];
        setFuture(future.slice(1)); // Remove the first state from future
        setBlocks(nextState); // Restore the future state
      }
    };
  
    // Update blocks when interval changes
    const updateTimeBlocks = (newInterval, newDayStart, newDayEnd) => {
        setBlocks(generateTimeBlocks(newInterval, newDayStart, newDayEnd));
        setDayStart(newDayStart);
        setDayEnd(newDayEnd);
      };
  
    // Toggle between Select and Entry modes
    const toggleSelectMode = () => {
      setIsSelecting(!isSelecting);
      setSelectedBlocks([]); // Clear any existing selection
    };
  
    // Entry mode - handle a block click and open modal to edit existing task
    const handleBlockPressEntryMode = (block) => {
      setEntryBlock(block);
      setModalVisible(true);
    };
  
    // Select mode - select consecutive blocks
    const handleBlockPressSelectMode = (block) => {
      if (selectedBlocks.length === 0) {
        setSelectedBlocks([block]); // Start selection
      } else {
        const lastSelected = selectedBlocks[selectedBlocks.length - 1];
        const blockIndex = parseInt(block.id);
        const lastIndex = parseInt(lastSelected.id);
  
        // Ensure consecutive selection
        if (blockIndex > lastIndex) {
          const newSelection = blocks.slice(lastIndex, blockIndex + 1);
          setSelectedBlocks(newSelection);
        } else {
          const newSelection = blocks.slice(blockIndex, lastIndex + 1);
          setSelectedBlocks(newSelection);
        }
      }
    };
  
    // Split a block into smaller 5-minute increments
    const handleSplit = () => {
      if (selectedBlocks.length === 1) {
        saveHistory(); // Save state before splitting
  
        const block = selectedBlocks[0];
        const [startTime, endTime] = block.time.split('-');
        let [startHour, startMinute] = startTime.split(':').map(Number);
        let [endHour, endMinute] = endTime.split(':').map(Number);
  
        // Convert start and end times to total minutes since 00:00
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const totalMinutes = endTotalMinutes - startTotalMinutes; // Duration of block in minutes
  
        // Calculate how many 5-minute blocks we need
        const numBlocks = totalMinutes / 5;
  
        const newBlocks = [];
  
        // Create new 5-minute blocks within the original time range
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
            id: `${block.id}-${i}`, // Use a unique id for each 5-minute block
            time: `${newStartTime}-${newEndTime}`,
            title: '',
            description: '',
            priority: 'none', // Default priority is 'none'
          });
        }
  
        // Update the block list by replacing the original block with the split blocks
        const updatedBlocks = [
          ...blocks.slice(0, parseInt(block.id)),
          ...newBlocks,
          ...blocks.slice(parseInt(block.id) + 1),
        ];
  
        // Reassign unique IDs to all blocks based on their index in the updated array
        const reassignedBlocks = updatedBlocks.map((block, index) => ({
          ...block,
          id: index.toString(), // Ensure unique ids for each block
        }));
  
        setBlocks(reassignedBlocks);
        setSelectedBlocks([]); // Clear the selection after split
        setIsSelecting(false); // Automatically return to entry mode
      }
    };
  
    const handleAddTodo = (newTask) => {
      saveHistory(); // Save state before adding a task
  
      const updatedBlocks = blocks.map((block) =>
        entryBlock && block.id === entryBlock.id
          ? { ...block, ...newTask } // Update the block with the new task and priority
          : block
      );
      setBlocks(updatedBlocks); // Update the state with the new blocks
      setSelectedBlocks([]); // Clear the selection after merging
      setEntryBlock(null); // Clear entry block
      setModalVisible(false); // Close the modal
    };
  
    const handleMerge = () => {
      if (selectedBlocks.length > 1) {
        saveHistory(); // Save state before merging
  
        const firstBlock = selectedBlocks[0]; // Take the first selected block
        const lastBlock = selectedBlocks[selectedBlocks.length - 1]; // Take the last selected block
  
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
        setSelectedBlocks([updatedFirstBlock]); // Only keep the first block selected
  
        setIsSelecting(false); // Automatically return to entry mode
        setModalVisible(true); // Open the modal to enter task details for the merged block
      }
    };
  
    const handleCancel = () => {
      setSelectedBlocks([]); // Clear the selection
    };
  
    // Function to determine background color based on priority
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
          return 'transparent'; // No highlight
      }
    };
  
    const renderBlock = ({ item }) => (
      <TouchableOpacity
        style={[
          styles.block,
          { backgroundColor: getPriorityColor(item.priority) }, // Apply the background color based on priority
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
          <Text style={styles.header}>Tomorrow</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Icon name="settings" size={30} color="#1E8AFF" />
          </TouchableOpacity>
          <Button title="↺" onPress={handleUndo} disabled={history.length === 0} />
          <Button title="↻" onPress={handleRestore} disabled={future.length === 0} />
          <Button title={isSelecting ? "Cancel Select" : "Select"} onPress={toggleSelectMode} />
        </View>
  
      {/* Settings Modal */}
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
        renderItem={({ item }) => (
          <View style={styles.block}>
            <Text style={styles.timeText}>{item.time}</Text>
            {item.title ? (
              <View>
                <Text style={styles.title}>{item.title}</Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              </View>
            ) : (
              <Text style={styles.emptyText}>Empty</Text>
            )}
          </View>
        )}
      />

      {/* Render RedBar as a single component relative to all blocks */}
      <RedBar blocks={blocks} />
  
        {/* Show merge and cancel buttons when blocks are selected */}
        {isSelecting && selectedBlocks.length > 1 && (
          <View style={styles.selectionOptions}>
            <Button title="Merge" onPress={handleMerge} />
            <Button title="Cancel" onPress={handleCancel} />
          </View>
        )}
  
        {/* Show split and cancel when only one block is selected */}
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
        initialTitle={entryBlock?.title} // Pass the existing title
        initialDescription={entryBlock?.description} // Pass the existing description
        initialPriority={entryBlock?.priority} // Pass the existing priority
        customPriorities={customPriorities} // Pass the dynamic priorities from settings
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
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    block: {
      padding: 15,
      borderBottomWidth: 1,
      borderColor: '#eee',
      minHeight: 60, // Minimum height to expand with content
    },
    selectedBlock: {
      borderColor: '#00f',
      borderWidth: 2, // Highlight the selected block
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